"use server";

import db from "@/db/drizzle";
import { recordsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

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

  if (parsedValues.error) return parsedValues.error;

  if (parsedValues.data.type === "cash-in") parsedValues.data.claimedAt = null;

  const { id, ...rest } = parsedValues.data;

  await db.update(recordsTable).set(rest).where(eq(recordsTable.id, id));

  return null;
}
