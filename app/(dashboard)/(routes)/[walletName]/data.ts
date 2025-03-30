"use server";

import drizzle from "@/db/drizzle";
import { recordsTable } from "@/db/schema";
import { format } from "date-fns";

export async function getRecords() {
  const records = await drizzle.select().from(recordsTable);
  const dateFormat = "MMM d, yyyy, h:mma";
  const mappedRecords = records.map((record) => ({
    ...record,
    date: format(record.date, dateFormat),
  }));

  return mappedRecords;
}

export type Record = Awaited<ReturnType<typeof getRecords>>[number];
