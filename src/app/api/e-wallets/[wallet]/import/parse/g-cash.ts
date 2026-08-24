import { getSuggestedFee } from "@/app/(dashboard)/actions/fees";
import { eWalletsTable, transactionTypeEnum } from "@/db/schema";
import z from "zod";

function getCustomerCellNumber(description: string, walletCellNumber: string) {
  const matches = description.match(/(?:\+639|09)\d{9}/g);

  if (!matches) return null;

  const foundCellNumber = matches.find(
    (cellNumber) => cellNumber !== walletCellNumber,
  );

  return foundCellNumber || null;
}

async function refineFileData(
  data: any[],
  wallet: Pick<typeof eWalletsTable.$inferSelect, "id" | "cellNumber">,
) {
  const partialRecordSchema = z.object({
    referenceNumber: z.string().refine((val) => val !== "N/A"),
    debit: z.number().nullable(),
    credit: z.number().nullable(),
    date: z.string(),
    description: z.string(),
  });

  const validatedRecords = data
    .map((r) => partialRecordSchema.safeParse(r))
    .filter((p) => p.success)
    .map((p) => p.data);

  if (!validatedRecords || validatedRecords.length <= 0) return [];

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

  return records;
}

export default { refineFileData };
