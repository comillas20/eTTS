"use server";

import db from "@/db/drizzle";
import { recordsTable } from "@/db/schema";
import { tz } from "@date-fns/tz";
import { getYear, lastDayOfMonth, subDays } from "date-fns";
import { and, eq, gte, lt, or } from "drizzle-orm";

export async function getRecordDates(walletId?: number) {
  return await db.query.recordsTable.findMany({
    columns: { date: true },
    where: (table, { eq }) =>
      walletId ? eq(table.eWalletId, walletId) : undefined,
    orderBy: (table, { desc }) => [desc(table.date)],
  });
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

    targetDate = lastDayOfMonth(mostRecent.date, {
      in: tz("UTC"),
    });
  } else
    targetDate = lastDayOfMonth(new Date(year || getYear(new Date()), month), {
      in: tz("UTC"),
    });

  // set it so that records in the same day as @targetDate is included
  targetDate.setHours(23, 59, 59);

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
