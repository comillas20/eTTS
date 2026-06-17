import { getSuggestedFee } from "@/app/(dashboard)/actions/fees";
import {
  eWalletsTable,
  eWalletTypeEnum,
  recordsTable,
  transactionTypeEnum,
} from "@/db/schema";
import fs from "fs";
import os from "os";
import path from "path";
import z from "zod";
import { Readable } from "stream";
import { finished } from "stream/promises";

type WalletType = (typeof eWalletTypeEnum.enumValues)[number];

// wallets that requires file password
export const PASS_PROTECTED_WALLETS: WalletType[] = ["g-cash"];

function getCustomerCellNumber(description: string, walletCellNumber: string) {
  const matches = description.match(/(?:\+639|09)\d{9}/g);

  if (!matches) return null;

  const foundCellNumber = matches.find(
    (cellNumber) => cellNumber !== walletCellNumber,
  );

  return foundCellNumber || null;
}

type ParseReturnRecords = Omit<
  typeof recordsTable.$inferSelect,
  "id" | "notes" | "createdAt"
>;
type ParseReturnType =
  | {
      success: true;
      data: ParseReturnRecords[];
    }
  | {
      success: false;
      error: string;
    };

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

  const partialRecordSchema = z.object({
    referenceNumber: z.string().refine((val) => val !== "N/A"),
    debit: z.number().nullable(),
    credit: z.number().nullable(),
    date: z.string(),
    description: z.string(),
  });

  const validatedRecords = rawRecords
    .map((r) => partialRecordSchema.safeParse(r))
    .filter((p) => p.success)
    .map((p) => p.data);

  if (!validatedRecords || validatedRecords.length <= 0)
    return { success: true, data: [] };

  const records = await Promise.all(
    validatedRecords.map(async (record) => {
      const amount = record.credit ?? record.debit ?? 0;
      const type: (typeof transactionTypeEnum.enumValues)[number] =
        record.credit ? "cash-out" : "cash-in";
      return {
        referenceNumber: record.referenceNumber,
        date: new Date(record.date),
        type,
        amount,
        fee: await getSuggestedFee({
          amount,
          type,
          walletId: wallet.id,
          transactionDate: new Date(record.date),
        }),
        eWalletId: wallet.id,
        cellNumber: getCustomerCellNumber(
          record.description,
          wallet.cellNumber,
        ),
        claimedAt: type === "cash-out" ? new Date(record.date) : null,
      };
    }),
  );

  return { success: true, data: records };
}
