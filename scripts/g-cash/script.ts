import db from "@/db/drizzle";
import { eWalletsTable, recordsTable, transactionTypeEnum } from "@/db/schema";
import { spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import { chmod, mkdir, unlink } from "fs/promises";
import path from "path";
import { z } from "zod";

export async function runScript(filePath: string) {
  const pythonScript = "pdf-json-converter.py";

  try {
    // Defining the path to the Python executable within the virtual environment
    const pythonExecutable = path.join(
      process.cwd(),
      ".venv",
      "Scripts",
      "python.exe",
    );

    // Ensure the python script is executable
    const scriptPath = path.resolve(
      process.cwd(),
      "scripts",
      "g-cash",
      pythonScript,
    );
    await chmod(scriptPath, 0o755);

    const saveDir = path.resolve(process.cwd(), "scripts", "g-cash");
    await mkdir(saveDir, { recursive: true });

    const script = spawn(pythonExecutable, [pythonScript], {
      cwd: saveDir,
    });

    script.stdout.on("data", (data) => {
      console.log(`Output: ${data}`);

      if (data.includes("[ORIGINAL]")) {
        script.stdin.write(filePath + "\n");
      } else if (data.includes("[PASSWORD]")) {
        script.stdin.write("comillas1258" + "\n");
      }
    });

    script.stderr.on("data", (data) => {
      console.error(`Error: ${data}`);
    });

    script.on("close", async (code) => {
      console.log(`Python script exited with code ${code}`);

      const jsonPath = path.resolve(
        process.cwd(),
        "scripts",
        "g-cash",
        "output",
        "decrypted.json",
      );

      const wallet = await db.query.eWalletsTable.findFirst({
        where: (wallets, { eq }) => eq(wallets.url, "g-cash"),
      });

      if (!wallet) throw new Error("G-Cash wallet not found");

      const records = getRecordsFromJSON(jsonPath, wallet);

      if (records)
        await db
          .insert(recordsTable)
          .values(
            records.map((record) => ({ ...record, eWalletId: wallet.id })),
          );

      try {
        unlink(jsonPath).then(() =>
          console.log(`Deleted JSON file at ${jsonPath}`),
        );
        unlink(filePath).then(() => console.log(`Deleted PDF at ${filePath}`));
      } catch (err) {
        console.error(`Failed to delete file at ${jsonPath}:`, err);
      }
    });
  } catch (error) {
    console.error("Error running script: ", error);
  }
}

function feeCalculator(amount: number, type: "cash-in" | "cash-out") {
  const rate = 0.02;
  const ladder = 500;

  if (type === "cash-out") {
    const M = Math.floor(amount / ladder) * ladder;
    const initialFee = M * rate;
    const diff = amount - M;
    const belowInitialFee = initialFee >= diff;

    return belowInitialFee ? initialFee : initialFee + ladder * rate;
  } else return Math.ceil(amount / ladder) * ladder * rate;
}

function getCellNumber(description: string, walletCellNumber: string) {
  const matches = description.match(/\d{11}/g);

  if (!matches) return null;

  const foundCellNumber = matches.find(
    (cellNumber) => cellNumber !== walletCellNumber,
  );

  return foundCellNumber || null;
}

const recordJSONSchema = z
  .object({
    referenceNumber: z.string(),
    debit: z.number().nullable(),
    credit: z.number().nullable(),
    date: z.number().nullable(),
    description: z.string(),
  })
  .array();

function getRecordsFromJSON(
  path: string,
  wallet: typeof eWalletsTable.$inferSelect,
): (typeof recordsTable.$inferInsert)[] | null {
  try {
    if (!existsSync(path)) {
      throw new Error("JSON file does not exist");
    }

    const data = readFileSync(path, "utf-8");
    const parsed = recordJSONSchema.safeParse(JSON.parse(data));

    if (parsed.error) throw parsed.error;

    const filteredRecords = parsed.data.filter(
      (record) => record.date !== null && record.referenceNumber !== "N/A",
    );

    return filteredRecords.map((record) => {
      const amount = record.credit ?? record.debit ?? 0;
      const type =
        transactionTypeEnum.enumValues[record.credit != null ? 1 : 0];

      return {
        referenceNumber: record.referenceNumber,
        amount: amount,
        fee: feeCalculator(amount, type),
        type: type,
        date: new Date(record.date!),
        eWalletId: wallet.id,
        claimedAt: type === "cash-out" ? new Date(record.date!) : null,
        cellNumber: getCellNumber(record.description, wallet.cellNumber),
      };
    });
  } catch (err) {
    console.error("Error reading or parsing JSON file:", err);
    return null;
  }
}
