"use server";

import db from "@/db/drizzle";
import { recordsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

type InsertRecord = typeof recordsTable.$inferInsert;
type SelectRecord = typeof recordsTable.$inferSelect;

export async function createRecord(values: InsertRecord) {
  const schema = createInsertSchema(recordsTable);
  const parsedValues = schema.safeParse(values);

  if (parsedValues.error)
    return { success: false as const, data: null, error: parsedValues.error };

  if (parsedValues.data.type === "cash-in") parsedValues.data.claimedAt = null;

  const result = await db
    .insert(recordsTable)
    .values(parsedValues.data)
    .returning({ id: recordsTable.id })
    .onConflictDoNothing();

  return {
    success: true as const,
    data: result[0],
    error: null,
  };
}

export async function createRecords(values: InsertRecord[]) {
  const schema = createInsertSchema(recordsTable).array();
  const parsedValues = schema.safeParse(values);

  if (parsedValues.error)
    return { success: false as const, data: null, error: parsedValues.error };

  parsedValues.data.forEach((record) => {
    if (record.type === "cash-in") record.claimedAt = null;
  });

  const result = await db
    .insert(recordsTable)
    .values(parsedValues.data)
    .returning({ id: recordsTable.id })
    .onConflictDoNothing();

  return {
    success: true as const,
    data: result,
    error: null,
  };
}

export async function getRecords(id: number) {
  if (typeof id !== "number")
    return {
      success: false as const,
      data: null,
      error: "ID should be a number",
    };

  const result = await db.query.recordsTable.findMany({
    where: (fields, { eq }) => eq(fields.eWalletId, id),
    orderBy: (fields, { desc }) => [desc(fields.date)],
  });

  return {
    success: true as const,
    data: result,
    error: null,
  };
}

export async function updateRecord(values: SelectRecord) {
  // I used createSelectSchema instead of the update/insert counterpart
  // because I want the id to also be verified
  // and that all properties be required

  const schema = createSelectSchema(recordsTable);
  const parsedValues = schema.safeParse(values);

  if (parsedValues.error)
    return { success: false as const, data: null, error: parsedValues.error };

  const { id, ...rest } = parsedValues.data;

  const result = await db
    .update(recordsTable)
    .set(rest)
    .where(eq(recordsTable.id, id))
    .returning();

  return {
    success: true as const,
    data: result[0],
    error: null,
  };
}

export async function updateNotes(record: Pick<SelectRecord, "id" | "notes">) {
  const schema = z.object({
    id: z.number(),
    notes: z.string().nullable(),
  });

  const parsedValues = schema.safeParse(record);

  if (parsedValues.error)
    return { success: false as const, error: parsedValues.error };

  const { id, notes } = parsedValues.data;
  await db
    .update(recordsTable)
    .set({ notes: notes })
    .where(eq(recordsTable.id, id));

  return { success: true as const, error: parsedValues.error };
}

export async function deleteRecord(id: number) {
  if (typeof id !== "number")
    return { success: false as const, error: "ID should be a number" };

  await db.delete(recordsTable).where(eq(recordsTable.id, id));

  return { success: true as const, error: null };
}
