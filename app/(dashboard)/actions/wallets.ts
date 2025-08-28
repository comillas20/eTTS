"use server";

import db from "@/db/drizzle";
import { eWalletsTable } from "@/db/schema";
import { isCellnumber } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

type InsertWallet = typeof eWalletsTable.$inferInsert;
type SelectWallet = typeof eWalletsTable.$inferSelect;

export async function getWallets() {
  return await db.query.eWalletsTable.findMany({
    with: {
      records: {
        columns: {
          type: true,
          claimedAt: true,
        },
      },
    },
  });
}

export async function createWallet(values: InsertWallet) {
  const schema = createInsertSchema(eWalletsTable, {
    name: (schema) => schema.trim().min(1).max(20),
    cellNumber: (schema) =>
      schema
        .trim()
        .refine((check) => isCellnumber(check))
        .or(z.literal("")),
    url: (schema) => schema.trim().min(1).max(20),
  });
  const parsedValues = schema.safeParse(values);

  if (parsedValues.error)
    return { success: false as const, data: null, error: parsedValues.error };

  const result = await db
    .insert(eWalletsTable)
    .values(parsedValues.data)
    .returning({ id: eWalletsTable.id })
    .onConflictDoNothing();

  return {
    success: true as const,
    data: result,
    error: null,
  };
}

export async function updateWallet(values: SelectWallet) {
  const schema = createUpdateSchema(eWalletsTable, {
    name: (schema) => schema.trim().min(1).max(20),
    cellNumber: (schema) =>
      schema
        .trim()
        .refine((check) => isCellnumber(check))
        .or(z.literal("")),
    url: (schema) => schema.trim().min(1).max(20),
  });

  const parsedValues = schema.safeParse(values);
  if (parsedValues.error)
    return { success: false as const, data: null, error: parsedValues.error };

  const result = await db
    .update(eWalletsTable)
    .set(parsedValues.data)
    .where(eq(eWalletsTable.id, values.id))
    .returning({ url: eWalletsTable.url });

  return {
    success: true as const,
    data: result[0],
    error: null,
  };
}

export async function deleteWallet({ id }: Pick<SelectWallet, "id">) {
  if (typeof id !== typeof eWalletsTable.$inferSelect.id)
    return { success: false as const, error: "ID should be a number" };

  await db.delete(eWalletsTable).where(eq(eWalletsTable.id, id));

  return { success: true as const, error: null };
}
