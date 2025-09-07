"use server";

import db from "@/db/drizzle";
import { eWalletsTable, feesTable, transactionTypeEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { getDefaultRate } from "./wallets";

type InsertFeeRange = typeof feesTable.$inferInsert;
type SelectFeeRange = typeof feesTable.$inferSelect;

export async function createFeeRange(values: InsertFeeRange) {
  const schema = createInsertSchema(feesTable);
  const parsedValues = schema.safeParse(values);

  console.log(parsedValues.error);
  if (parsedValues.error)
    return { success: false as const, data: null, error: parsedValues.error };

  const result = await db
    .insert(feesTable)
    .values(parsedValues.data)
    .returning({ id: feesTable.id })
    .onConflictDoNothing();

  return {
    success: true as const,
    data: result[0],
    error: null,
  };
}

export async function getFeeRanges(walletId: number) {
  if (typeof walletId !== "number")
    return {
      success: false as const,
      data: null,
      error: "ID should be a number",
    };

  const result = await db.query.feesTable.findMany({
    where: (fields, { eq }) => eq(fields.eWalletId, walletId),
  });

  return {
    success: true as const,
    data: result,
    error: null,
  };
}

export async function updateFeeRange(values: SelectFeeRange) {
  // I used createSelectSchema instead of the update/insert counterpart
  // because I want the id to also be verified
  // and that all properties be required

  const schema = createSelectSchema(feesTable);
  const parsedValues = schema.safeParse(values);

  if (parsedValues.error)
    return { success: false as const, data: null, error: parsedValues.error };

  const { id, ...rest } = parsedValues.data;

  const result = await db
    .update(feesTable)
    .set(rest)
    .where(eq(feesTable.id, id))
    .returning();

  return {
    success: true as const,
    data: result[0],
    error: null,
  };
}

export async function deleteFeeRange(id: number) {
  if (typeof id !== "number")
    return { success: false as const, error: "ID should be a number" };

  await db.delete(feesTable).where(eq(feesTable.id, id));

  return { success: true as const, error: null };
}

export async function isFeeInExistingRange(fee: number, feeRangeId: number) {
  const result = await db.query.feesTable.findMany({
    where: (table, { and, lte, gte }) =>
      and(lte(table.amountStart, fee), gte(table.amountEnd, fee)),
  });

  // if system only finds the current edited range, then we ignore
  if (result && result.length === 1 && result[0].id === feeRangeId)
    return false;

  return !!result;
}

type SuggestedFeeOptions = {
  amount: number;
  type: (typeof transactionTypeEnum.enumValues)[number];
  walletId: typeof eWalletsTable.$inferSelect.id;
};
export async function getSuggestedFee({
  amount,
  type,
  walletId,
}: SuggestedFeeOptions) {
  // first attempt of getting fee is to check custom fee ranges if the amount falls within any range
  const result = await db.query.feesTable.findMany({
    where: (fields, { eq }) => eq(fields.eWalletId, walletId),
  });

  if (result && result.length) {
    const matchedRange = result.find((range) => {
      const modAmount = type === "cash-out" ? amount - range.fee : amount;
      return modAmount >= range.amountStart && modAmount <= range.amountEnd;
    });
    if (matchedRange) return matchedRange.fee;
  }

  // second attempt is to use the default rate if no custom fee range matched
  // which has a default ladder of 500
  const { data: rate } = await getDefaultRate(walletId);

  const ladder = 500;

  if (type === "cash-out") {
    // round up to nearest ladder
    const nearestMaxLadder = Math.floor(amount / ladder) * ladder;
    const initialFee = nearestMaxLadder * rate;
    const diff = amount - nearestMaxLadder;
    const belowInitialFee = initialFee >= diff;

    return belowInitialFee ? initialFee : initialFee + ladder * rate;
  } else return Math.ceil(amount / ladder) * ladder * rate;
}
