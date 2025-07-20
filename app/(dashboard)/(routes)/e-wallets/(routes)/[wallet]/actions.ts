"use server";

import db from "@/db/drizzle";
import { recordsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createUpdateSchema } from "drizzle-zod";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getRecords(walletId: number) {
  return await db.query.recordsTable.findMany({
    where: (fields, { eq }) => eq(fields.eWalletId, walletId),
    orderBy: (fields, { desc }) => [desc(fields.date)],
  });
}

export type Record = Awaited<ReturnType<typeof getRecords>>[number];

export async function deleteRecord(recordId: number) {
  await db.delete(recordsTable).where(eq(recordsTable.id, recordId));

  revalidatePath("/[wallet]", "page");
}

type UpdateNotes = {
  id: number;
  notes: string | null;
};
export async function updateNotes(record: UpdateNotes) {
  const { id, notes } = record;
  await db
    .update(recordsTable)
    .set({ notes: notes })
    .where(eq(recordsTable.id, id));
}

const updateRecordsSchema = createUpdateSchema(recordsTable, {
  id: z.number(),
  referenceNumber: (schema) => schema.min(1, "Invalid ref no."),
  cellNumber: (schema) => schema.min(11, "Invalid phone no.").or(z.literal("")),
  amount: (schema) => schema.min(1, "Amount cannot be below 1"),
  fee: (schema) => schema.min(0, "Fee cannot be negative"),
});

type UpdateRecord = z.infer<typeof updateRecordsSchema>;
export async function updateRecord(values: UpdateRecord) {
  const parsedValues = updateRecordsSchema.safeParse(values);

  if (parsedValues.error) return null;

  if (parsedValues.data.type === "cash-in") parsedValues.data.claimedAt = null;

  const { id, ...rest } = parsedValues.data;

  const updatedRecord = await db
    .update(recordsTable)
    .set(rest)
    .where(eq(recordsTable.id, id))
    .returning();

  return updatedRecord[0];
}
