"use server";

import db from "@/db/drizzle";
import { eWalletsTable } from "@/db/schema";

export async function getWallets() {
  return await db.select().from(eWalletsTable);
}

type WalletInsert = typeof eWalletsTable.$inferInsert;
export async function createWallet(values: WalletInsert) {
  const wallet = await db.insert(eWalletsTable).values(values);

  return wallet.rowCount;
}
