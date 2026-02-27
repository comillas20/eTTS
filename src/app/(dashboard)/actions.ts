"use server";

import db from "@/db/drizzle";

export async function getRecordDates(walletId?: number) {
  return await db.query.recordsTable.findMany({
    columns: { date: true },
    where: (table, { eq }) =>
      walletId ? eq(table.eWalletId, walletId) : undefined,
    orderBy: (table, { desc }) => [desc(table.date)],
  });
}
