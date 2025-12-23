"use server";

import db from "@/db/drizzle";
import { eWalletsTable, recordsTable } from "@/db/schema";
import { canAccessWallet, getAuthentication } from "@/lib/auth";
import { and, desc, eq, getTableColumns, gte, lte, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { revalidatePath } from "next/cache";

type InsertRecord = typeof recordsTable.$inferInsert;
type SelectRecord = typeof recordsTable.$inferSelect;

export async function createRecord(values: InsertRecord) {
  const isAuthorized = await canAccessWallet(values.eWalletId);

  if (!isAuthorized)
    return { success: false as const, data: null, error: "Unauthorized" };

  const schema = createInsertSchema(recordsTable);
  const parsedValues = schema.safeParse(values);

  if (parsedValues.error)
    return {
      success: false as const,
      data: null,
      error: parsedValues.error.message,
    };

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

export async function createRecords(
  values: Omit<InsertRecord, "eWalletId">[],
  walletId: number,
) {
  const schema = createInsertSchema(recordsTable)
    .omit({ eWalletId: true })
    .array();
  const parsedValues = schema.safeParse(values);

  if (parsedValues.error)
    return {
      success: false as const,
      data: null,
      error: parsedValues.error.message,
    };

  parsedValues.data.forEach((record) => {
    if (record.type === "cash-in") record.claimedAt = null;
  });

  const hasAccess = await canAccessWallet(walletId);

  if (!hasAccess)
    return { success: false as const, data: null, error: "Unauthorized" };

  const finalData = parsedValues.data.map((record) => ({
    ...record,
    eWalletId: walletId,
  }));

  const result = await db
    .insert(recordsTable)
    .values(finalData)
    .returning({ id: recordsTable.id })
    .onConflictDoNothing();

  revalidatePath("/e-wallets");

  return {
    success: true as const,
    data: result,
    error: null,
  };
}

export async function restoreRecords(
  values: Omit<InsertRecord, "eWalletId">[],
  walletId: number,
) {
  const schema = createInsertSchema(recordsTable)
    .omit({ eWalletId: true })
    .array();
  const parsedValues = schema.safeParse(values);

  if (parsedValues.error)
    return {
      success: false as const,
      data: null,
      error: parsedValues.error.message,
    };

  parsedValues.data.forEach((record) => {
    if (record.type === "cash-in") record.claimedAt = null;
  });

  const hasAccess = await canAccessWallet(walletId);

  if (!hasAccess)
    return { success: false as const, data: null, error: "Unauthorized" };

  const finalData = parsedValues.data.map((record) => ({
    ...record,
    eWalletId: walletId,
  }));

  const result = await db
    .insert(recordsTable)
    .values(finalData)
    .returning({ id: recordsTable.id })
    .onConflictDoUpdate({
      target: [recordsTable.eWalletId, recordsTable.referenceNumber],
      set: {
        fee: sql.raw(`excluded.${recordsTable.fee.name}`),
        claimedAt: sql.raw(`excluded."${recordsTable.claimedAt.name}"`),
        notes: sql.raw(`excluded.${recordsTable.notes.name}`),
      },
    });

  revalidatePath("/e-wallets");

  return {
    success: true as const,
    data: result,
    error: null,
  };
}

type GetRecordFilters = {
  walletId?: number;
  limit?: number;
  range?: {
    startDate: Date;
    endDate: Date;
  };
};
export async function getRecords(filters?: GetRecordFilters) {
  if (filters) {
    const { walletId } = filters;
    if (walletId && typeof walletId !== "number")
      return {
        success: false as const,
        data: null,
        error: "Wallet ID should be a number or should not be provided",
      };
  }

  const auth = await getAuthentication();

  if (!auth)
    return {
      success: false as const,
      data: null,
      error: "Unauthenticated",
    };

  let query = db
    .select({ ...getTableColumns(recordsTable) })
    .from(recordsTable)
    .innerJoin(eWalletsTable, eq(recordsTable.eWalletId, eWalletsTable.id))
    .where(() => {
      if (!filters) return undefined;

      const { walletId, range } = filters;
      return and(
        walletId ? eq(recordsTable.eWalletId, walletId) : undefined,
        range
          ? and(
              gte(recordsTable.date, range.startDate),
              lte(recordsTable.date, range.endDate),
            )
          : undefined,
        eq(eWalletsTable.userId, auth.user.id),
      );
    })
    .orderBy(desc(recordsTable.date))
    .$dynamic();

  if (filters?.limit) query = query.limit(filters.limit);

  const result = await query;

  return {
    success: true as const,
    data: result,
    error: null,
  };
}

export async function updateRecord(values: SelectRecord) {
  const isAuthorized = await canAccessWallet(values.eWalletId);

  if (!isAuthorized)
    return { success: false as const, data: null, error: "Unauthorized" };

  // I used createSelectSchema instead of the update/insert counterpart
  // because I want the id to also be verified
  // and that all properties be required

  const schema = createSelectSchema(recordsTable);
  const parsedValues = schema.safeParse(values);

  if (parsedValues.error)
    return {
      success: false as const,
      data: null,
      error: parsedValues.error.message,
    };

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

export async function deleteRecord(
  values: Pick<SelectRecord, "id" | "eWalletId">,
) {
  const { id, eWalletId } = values;
  const isAuthorized = await canAccessWallet(eWalletId);

  if (!isAuthorized)
    return { success: false as const, data: null, error: "Unauthorized" };

  if (typeof id !== "number")
    return { success: false as const, error: "ID should be a number" };

  await db.delete(recordsTable).where(eq(recordsTable.id, id));

  return { success: true as const, error: null };
}
