import { eWalletsTable } from "@/db/schema";
import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";

type ParseReturnType =
  | {
      success: true;
      data: any[];
    }
  | {
      success: false;
      error: string;
    };

/**
 * Parses a pdf file containing the transactions of an e-wallet by storing the file to somewhere,
 * then attaches the file path to the payload for an API that actually handles the parsing
 * @param file The PDF File from e-wallet transactions
 * @param wallet The wallet object
 * @param password PDF files given by e-wallets usually have password, leave empty if no password
 * @returns The raw data in the form of an array json
 */

export async function parseFile(
  file: File,
  wallet: typeof eWalletsTable.$inferSelect,
  password?: string,
): Promise<ParseReturnType> {
  const tempDir = os.tmpdir();

  const uniqueFileName = `pdf-${Date.now()}-${file.name}`;

  const fullPath = path.join(tempDir, uniqueFileName);

  const nodeStream = Readable.fromWeb(file.stream() as any);
  const writeStream = fs.createWriteStream(fullPath);
  nodeStream.pipe(writeStream);

  // Wait for the file to finish writing completely before sending
  await finished(writeStream);

  const pythonBaseUrl = process.env.PYTHON_API_URL;

  if (!pythonBaseUrl)
    return { success: false, error: "Undefined env: PYTHON_API_URL" };

  const pythonResponse = await fetch(pythonBaseUrl + "/pdf/parse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: fullPath,
      password: password || "",
      wallet: wallet.type,
    }),
  });

  await fs.promises.unlink(fullPath);

  if (!pythonResponse.ok)
    return {
      success: false,
      error: `Python API Error ${pythonResponse.status}: ${pythonResponse.statusText}`,
    };

  const data = await pythonResponse.json();
  const rawRecords = Array.isArray(data) ? data : [data];

  return { success: true, data: rawRecords };
}
