"use server";

import db from "@/db/drizzle";
import { recordsTable } from "@/db/schema";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRecords(walletId: number) {
  const records = await db.query.recordsTable.findMany({
    where: (fields, { eq }) => eq(fields.eWalletId, walletId),
  });
  const dateFormat = "MMM d, yyyy, h:mma";
  const mappedRecords = records.map((record) => ({
    ...record,
    date: format(record.date, dateFormat),
    claimedAt: record.claimedAt ? format(record.claimedAt, dateFormat) : null,
    createdAt: format(record.date, dateFormat),
  }));

  return mappedRecords;
}

export type Record = Awaited<ReturnType<typeof getRecords>>[number];

export async function deleteRecord(recordIds: number[]) {
  await Promise.all(
    recordIds.map((recordId) =>
      db.delete(recordsTable).where(eq(recordsTable.id, recordId)),
    ),
  );

  revalidatePath("/[wallet]", "page");
}
