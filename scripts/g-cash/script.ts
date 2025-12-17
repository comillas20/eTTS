import { getSuggestedFee } from "@/app/(dashboard)/actions/fees";
import { eWalletsTable, transactionTypeEnum } from "@/db/schema";
import { spawn } from "child_process";
import { chmod, mkdir } from "fs/promises";
import path from "path";
import { z } from "zod";

const partialRecordSchema = z.object({
  referenceNumber: z.string().refine((val) => val !== "N/A"),
  debit: z.number().nullable(),
  credit: z.number().nullable(),
  date: z.string(),
  description: z.string(),
});

type PartialRecord = z.infer<typeof partialRecordSchema>;

function getCellNumber(description: string, walletCellNumber: string) {
  const matches = description.match(/(?:\+639|09)\d{9}/g);

  if (!matches) return null;

  const foundCellNumber = matches.find(
    (cellNumber) => cellNumber !== walletCellNumber,
  );

  return foundCellNumber || null;
}

type ScriptOptions = {
  wallet: typeof eWalletsTable.$inferSelect;
  buffer: Buffer<ArrayBuffer>;
  scriptName: string;
  filePassword: string;
};

export async function runScript(options: ScriptOptions) {
  const { wallet, scriptName, filePassword, buffer } = options;
  if (!filePassword) return new Error("File password is required");

  // Ensure the python script is executable
  const scriptPath = path.resolve(
    process.cwd(),
    "scripts",
    "g-cash",
    scriptName,
  );
  await chmod(scriptPath, 0o755);

  const saveDir = path.resolve(process.cwd(), "scripts", "g-cash");
  await mkdir(saveDir, { recursive: true });

  return new Promise((resolve, reject) => {
    let pythonExecutable = "";
    switch (process.platform) {
      case "win32":
        pythonExecutable = path.join(
          process.cwd(),
          ".venv",
          "Scripts",
          "python.exe",
        );
        break;
      case "linux":
        pythonExecutable = path.join(process.cwd(), ".venv", "bin", "python");
        break;
      default:
        return reject(new Error("Unsupported platform: " + process.platform));
    }

    // The specific flags required to silence the warnings for jpype/tabula in newer Java versions.
    // const javaOptions =
    //   "--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED";
    const script = spawn(pythonExecutable, [scriptName], {
      cwd: saveDir,
      // env: {
      //   ...process.env,
      //   _JAVA_OPTIONS: javaOptions,
      // },
    });

    let scriptDataOutput = "";
    let scriptErrorOutput = "";

    script.stdout.on("data", (data) => {
      const prompt = data.toString("utf8");

      if (prompt.includes("[FILE_PASSWORD]"))
        script.stdin.write(filePassword + "\n");
      else if (prompt.includes("[PDF_BUFFER]")) {
        script.stdin.write(buffer);
        script.stdin.end();
      } else scriptDataOutput += prompt;
    });

    script.stderr.on("data", (data) => {
      scriptErrorOutput += data.toString();
    });

    script.on("close", async (code) => {
      console.log(`Python script exited with code ${code}`);

      if (code !== 0) {
        return reject(
          new Error(`Python Script Error (Code ${code}): ${scriptErrorOutput}`),
        );
      }

      try {
        const cleanedOutput = scriptDataOutput.trim();
        if (!cleanedOutput) return resolve([]);

        const parsedJson = JSON.parse(cleanedOutput);
        const rawRecords = Array.isArray(parsedJson)
          ? parsedJson
          : [parsedJson];

        const validatedRecords = rawRecords
          .map((r) => partialRecordSchema.safeParse(r))
          .filter((p) => p.success)
          .map((p) => p.data);

        if (!validatedRecords || validatedRecords.length <= 0)
          return reject("No records");

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
              cellNumber: getCellNumber(record.description, wallet.cellNumber),
              claimedAt: type === "cash-out" ? new Date(record.date) : null,
            };
          }),
        );
        console.log(records);
        return resolve(records);
      } catch (error) {
        return reject(
          new Error("Failed to parse Python output: " + String(error)),
        );
      }
    });
  });
}
