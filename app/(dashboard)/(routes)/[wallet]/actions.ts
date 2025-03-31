"use server";

import db from "@/db/drizzle";
import { format } from "date-fns";

export async function getRecords(walletId: number) {
  const records = await db.query.recordsTable.findMany({
    where: (fields, { eq }) => eq(fields.eWalletId, walletId),
  });
  const dateFormat = "MMM d, yyyy, h:mma";
  const mappedRecords = records.map((record) => ({
    ...record,
    date: format(record.date, dateFormat),
  }));

  return mappedRecords;
}

export type Record = Awaited<ReturnType<typeof getRecords>>[number];
