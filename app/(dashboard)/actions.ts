"use server";

import db from "@/db/drizzle";
import { eWalletsTable, recordsTable } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function getWallets() {
  return await db.select().from(eWalletsTable);
}

type WalletInsert = typeof eWalletsTable.$inferInsert;
export async function createWallet(values: WalletInsert) {
  const wallet = await db.insert(eWalletsTable).values(values);

  return wallet.rowCount;
}

export async function getYears() {
  const years = await db
    .select({
      year: sql<number>`CAST(EXTRACT(YEAR FROM ${recordsTable.date}) AS INTEGER)`,
    })
    .from(recordsTable)
    .groupBy(sql`EXTRACT(YEAR FROM ${recordsTable.date})`);

  return years.map((row) => row.year);
}
