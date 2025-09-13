"use server";

import db from "@/db/drizzle";
import { eWalletsTable } from "@/db/schema";
import { isCellnumber } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { revalidatePath } from "next/cache";
import z from "zod";

type InsertWallet = typeof eWalletsTable.$inferInsert;
type SelectWallet = typeof eWalletsTable.$inferSelect;

export async function createWallet(values: InsertWallet) {
  const schema = createInsertSchema(eWalletsTable, {
    name: (schema) => schema.trim().min(1).max(20),
    cellNumber: (schema) =>
      schema
        .trim()
        .refine((check) => isCellnumber(check))
        .or(z.literal("")),
    url: (schema) => schema.trim().min(1).max(20),
  }).refine(async (check) => !doesWalletAlreadyExist({ ...check, id: -1 }), {
    message: "You already have a wallet with this name",
    path: ["name"],
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

export async function updateWallet(values: SelectWallet) {
  const schema = createUpdateSchema(eWalletsTable, {
    name: (schema) => schema.trim().min(1).max(20),
    cellNumber: (schema) =>
      schema
        .trim()
        .refine((check) => isCellnumber(check))
        .or(z.literal("")),
    url: (schema) => schema.trim().min(1).max(20),
  }).refine(
    async (check) =>
      !check.name ||
      !doesWalletAlreadyExist({ id: values.id, name: check.name }),
    {
      message: "You already have a wallet with this name",
      path: ["name"],
    },
  );

  const parsedValues = schema.safeParse(values);
  if (parsedValues.error)
    return { success: false as const, data: null, error: parsedValues.error };

  const result = await db
    .update(eWalletsTable)
    .set(parsedValues.data)
    .where(eq(eWalletsTable.id, values.id))
    .returning({ url: eWalletsTable.url });

  revalidatePath("/e-wallets");
  return {
    success: true as const,
    data: result[0],
    error: null,
  };
}

export async function deleteWallet(id: number) {
  if (typeof id !== "number")
    return { success: false as const, error: "ID should be a number" };

  await db.delete(eWalletsTable).where(eq(eWalletsTable.id, id));

  revalidatePath("/e-wallets");
  return { success: true as const, error: null };
}

export async function doesWalletAlreadyExist(
  wallet: Pick<SelectWallet, "id" | "name">,
) {
  const result = await db.query.eWalletsTable.findFirst({
    where: (table, { eq, and, ne }) =>
      and(eq(table.name, wallet.name), ne(table.id, wallet.id)),
  });

  return !!result;
}

export async function getDefaultRate(id: number) {
  // just in case, there is no default rate set, which should NOT happen
  // also to satisfy typescript
  const defaultRate = 0.02;

  if (typeof id !== "number")
    return {
      success: false as const,
      data: defaultRate,
      error: "ID should be a number",
    };

  const result = await db.query.eWalletsTable.findFirst({
    where: (table, { eq }) => eq(table.id, id),
    columns: { defaultRate: true },
  });

  return {
    success: true as const,
    data: result ? result.defaultRate : defaultRate,
    error: null,
  };
}
