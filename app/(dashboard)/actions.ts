"use server";

import db from "@/db/drizzle";
import { eWalletsTable, recordsTable } from "@/db/schema";
import { getYear, lastDayOfMonth, subDays } from "date-fns";
import { and, eq, gte, lt, or, sql } from "drizzle-orm";

export async function getWallets() {
  return await db.query.eWalletsTable.findMany({
    with: {
      records: {
        columns: {
          type: true,
          claimedAt: true,
        },
      },
    },
  });
}

type WalletInsert = typeof eWalletsTable.$inferInsert;
export async function createWallet(values: WalletInsert) {
  const wallet = await db.insert(eWalletsTable).values(values);

  return wallet.rowCount;
}

export async function getMonthYears(walletId?: number) {
  const monthYears = await db
    .select({
      year: sql<number>`CAST(EXTRACT(YEAR FROM ${recordsTable.date}) AS INTEGER)`,
      month: sql<number>`CAST(EXTRACT(MONTH FROM ${recordsTable.date}) AS INTEGER)`,
    })
    .from(recordsTable)
    .where(walletId ? eq(recordsTable.eWalletId, walletId) : undefined)
    .groupBy(
      sql`EXTRACT(YEAR FROM ${recordsTable.date})`,
      sql`EXTRACT(MONTH FROM ${recordsTable.date})`,
    )
    .orderBy(
      sql`EXTRACT(YEAR FROM ${recordsTable.date}) DESC`,
      sql`EXTRACT(MONTH FROM ${recordsTable.date}) DESC`,
    );

  return monthYears.map((row) => ({
    year: row.year,
    month: row.month - 1, // Convert to 0-indexed month
  }));
}

type FilteredRecords = {
  walletId?: number;
  month?: number;
  year?: number;
};

export async function getFilteredRecords(filters: FilteredRecords) {
  const { walletId, month, year } = filters;

  const range = 90;

  let targetDate: Date;

  // Note to self: You cant do !month because month = 0 becomes false, and we dont want that
  if (typeof month !== "number") {
    const mostRecent = await db.query.recordsTable.findFirst({
      where: walletId ? eq(recordsTable.eWalletId, walletId) : undefined,
      orderBy: (recordsTable, { desc }) => [desc(recordsTable.date)],
      columns: {
        date: true,
      },
    });

    // something went wrong
    if (!mostRecent) return [];

    targetDate = lastDayOfMonth(mostRecent.date);
  } else
    targetDate = lastDayOfMonth(new Date(year || getYear(new Date()), month));

  const results = await db.query.recordsTable.findMany({
    where: and(
      walletId ? eq(recordsTable.eWalletId, walletId) : undefined,
      or(
        eq(recordsTable.date, targetDate),
        and(
          gte(recordsTable.date, subDays(targetDate, range)),
          lt(recordsTable.date, targetDate),
        ),
      ),
    ),
    orderBy: (recordsTable, { desc }) => [desc(recordsTable.date)],
  });

  return results || [];
}
