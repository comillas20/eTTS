"use server";

import db from "@/db/drizzle";
import { eWalletsTable, recordsTable } from "@/db/schema";
import { getAuthentication } from "@/lib/auth";
import { and, desc, eq } from "drizzle-orm";

export async function getRecordDates(walletId?: number) {
  const auth = await getAuthentication();
  if (!auth) return [];

  return await db
    .select({ date: recordsTable.date })
    .from(recordsTable)
    .innerJoin(eWalletsTable, eq(recordsTable.eWalletId, eWalletsTable.id))
    .where(
      and(
        eq(eWalletsTable.userId, auth.user.id),
        walletId ? eq(recordsTable.eWalletId, walletId) : undefined,
      ),
    )
    .orderBy(desc(recordsTable.date));
}
