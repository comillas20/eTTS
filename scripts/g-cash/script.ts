import { getSuggestedFee } from "@/app/(dashboard)/actions/fees";
import { eWalletsTable, transactionTypeEnum } from "@/db/schema";
import { spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import { chmod, mkdir, unlink } from "fs/promises";
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

function getJsonData(path: string) {
  try {
    if (!existsSync(path)) {
      throw new Error("JSON file does not exist");
    }

    const data = readFileSync(path, "utf-8");
    const jsonData = JSON.parse(data);

    if (Array.isArray(jsonData)) {
      const parsedJson: PartialRecord[] = [];
      jsonData.forEach((data) => {
        const parsed = partialRecordSchema.safeParse(data);
        if (parsed.success) parsedJson.push(parsed.data);
      });

      return parsedJson as PartialRecord[];
    } else {
      const parsed = partialRecordSchema.safeParse(jsonData);
      if (parsed.error) throw parsed.error;
      return [parsed.data];
    }
  } catch (err) {
    console.error("Error reading or parsing JSON file:", err);
    return null;
  }
}

type ScriptOptions = {
  wallet: typeof eWalletsTable.$inferSelect;
  sourceFilePath: string;
  scriptName: string;
  filePassword: string;
};

export async function runScript(options: ScriptOptions) {
  const { wallet, scriptName, filePassword, sourceFilePath } = options;
  if (!filePassword) return new Error("File password is required");

  const prompts = [
    {
      code: "[SOURCE_FILE_PATH]",
      reply: sourceFilePath,
    },
    {
      code: "[FILE_PASSWORD]",
      reply: filePassword,
    },
  ];

  function generateReply(prompt: string) {
    const result = prompts.find((p) => prompt.includes(p.code));
    if (!result) return null;
    return result.reply;
  }

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

      const script = spawn(pythonExecutable, [scriptName], {
        cwd: saveDir,
      });

      script.stdout.on("data", (data) => {
        const prompt = data.toString("utf8");
        const reply = generateReply(prompt);

        // check if it was actually a prompt not just a print()
        if (reply) script.stdin.write(reply + "\n");
      });

      script.stderr.on("data", (data) => {
        console.error(`Error: ${data}`);
      });

      script.on("close", async (code) => {
        console.log(`Python script exited with code ${code}`);
        const outputFilePath = path.resolve(
          saveDir,
          "output",
          "decrypted.json",
        );
        const partialRecords = getJsonData(outputFilePath);

        if (!partialRecords) return null;
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
              fee: await getSuggestedFee({ amount, type, walletId: wallet.id }),
              eWalletId: wallet.id,
              cellNumber: getCellNumber(record.description, wallet.cellNumber),
              claimedAt: type === "cash-out" ? new Date(record.date) : null,
            };
          }),
        );

        unlink(outputFilePath);
        unlink(sourceFilePath);

        resolve(records);
      });
    } catch (error) {
      reject(new Error("Error running script: " + error));
    }
  });
}
