"use server";

import db from "@/db/drizzle";
import { recordsTable } from "@/db/schema";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

const createRecordsSchema = createInsertSchema(recordsTable, {
  referenceNumber: (schema) => schema.min(1, "Invalid ref no."),
  cellNumber: (schema) => schema.min(11, "Invalid phone no.").or(z.literal("")),
  amount: (schema) => schema.min(1, "Amount cannot be below 1"),
  fee: (schema) => schema.min(1, "Fee cannot be below 1"),
});

type CreateRecord = z.infer<typeof createRecordsSchema>;
export async function createRecord(values: CreateRecord) {
  const parsedValues = createRecordsSchema.safeParse(values);

  if (parsedValues.error) return parsedValues.error;
  await db.insert(recordsTable).values(parsedValues.data);

  return null;
}

export async function deleteRecord(recordIds: number[]) {
  await Promise.all(
    recordIds.map((recordId) =>
      db.delete(recordsTable).where(eq(recordsTable.id, recordId)),
    ),
  );

  revalidatePath("/[wallet]", "page");
}
