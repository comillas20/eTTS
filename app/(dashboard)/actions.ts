"use server";

import db from "@/db/drizzle";
import { eWalletsTable, recordsTable } from "@/db/schema";
import { getMonth, getYear, subDays } from "date-fns";
import { and, eq, or, sql } from "drizzle-orm";

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

type FilteredRecords = {
  walletId?: number;
  month?: number;
  year?: number;
};

export async function getFilteredRecords(filters?: FilteredRecords) {
  const now = new Date();

  const currentMonth = getMonth(now) + 1; // JavaScript months are 0-indexed
  const currentYear = getYear(now);

  const walletId = filters ? filters.walletId : undefined;
  const month = filters && filters.month ? filters.month : currentMonth;
  const year = filters && filters.year ? filters.year : currentYear;

  const range = 30;

  let targetDate: Date;
  if (month === currentMonth && year === currentYear) {
    targetDate = now;
  } else {
    // Get the last day of the selected month
    targetDate = new Date(year, month, 0); // Day 0 of the next month goes back to the last day of the current month
  }

  return await db
    .select()
    .from(recordsTable)
    .where(
      and(
        walletId ? eq(recordsTable.eWalletId, walletId) : undefined,
        or(
          sql`${recordsTable.date}::date = ${targetDate.toISOString().split("T")[0]}`,
          and(
            sql`${recordsTable.date}::date >= ${subDays(targetDate, range).toISOString().split("T")[0]}`,
            sql`${recordsTable.date}::date < ${targetDate.toISOString().split("T")[0]}`,
          ),
        ),
      ),
    );
}
