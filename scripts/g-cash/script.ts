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
    try {
      const pythonExecutable = path.join(
        process.cwd(),
        ".venv",
        "Scripts",
        "python.exe",
      );

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

      let partialRecords: PartialRecord[] = [];
      script.stdout.on("data", (data) => {
        const prompt = data.toString("utf8").trim();

        if (prompt === "[FILE_PASSWORD]")
          script.stdin.write(filePassword + "\n");
        else if (prompt === "[PDF_BUFFER]") {
          script.stdin.write(buffer);
          script.stdin.end();
        } else
          try {
            const parsedJson = JSON.parse(prompt);
            if (Array.isArray(parsedJson)) {
              parsedJson.forEach((data) => {
                const parsed = partialRecordSchema.safeParse(data);
                if (parsed.success) partialRecords.push(parsed.data);
              });
            } else {
              const parsedJsonWithZod =
                partialRecordSchema.safeParse(parsedJson);
              if (parsedJsonWithZod.error)
                throw new Error(
                  parsedJsonWithZod.error.flatten().fieldErrors.toString(),
                );
              partialRecords.push(parsedJsonWithZod.data);
            }
          } catch (error: unknown) {
            if (error instanceof SyntaxError) console.log(error.message);
            else console.error("Unexpected error:", error);
          }
      });

      script.stderr.on("data", (data) => {
        console.error(`Error: ${data}`);
      });

      script.on("close", async (code) => {
        console.log(`Python script exited with code ${code}`);

        if (!partialRecords || partialRecords.length <= 0) return null;
        const records = await Promise.all(
          partialRecords.map(async (record) => {
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

        resolve(records);
      });
    } catch (error) {
      reject(new Error("Error running script: " + error));
    }
  });
}
