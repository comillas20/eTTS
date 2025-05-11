"use server";

import db from "@/db/drizzle";
import { recordsTable } from "@/db/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

  if (parsedValues.data.type === "cash-in") parsedValues.data.claimedAt = null;
  await db.insert(recordsTable).values(parsedValues.data);

  return null;
}
