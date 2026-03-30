"use server";

import db from "@/db/drizzle";
import { eWalletsTable, feesTable, transactionTypeEnum } from "@/db/schema";
import { canAccessWallet } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { updateRecord } from "./records";
import { getDefaultLadder, getDefaultRate } from "./wallets";

type InsertFeeRange = typeof feesTable.$inferInsert;
type SelectFeeRange = typeof feesTable.$inferSelect;

export async function createFeeRange(values: InsertFeeRange) {
  const isAuthorized = await canAccessWallet(values.eWalletId);

  if (!isAuthorized)
    return { success: false as const, data: null, error: "Unauthorized" };

  const schema = createInsertSchema(feesTable);
  const parsedValues = schema.safeParse(values);

  if (parsedValues.error)
    return {
      success: false as const,
      data: null,
      error: parsedValues.error.message,
    };

  const result = await db
    .insert(feesTable)
    .values(parsedValues.data)
    .returning({ id: feesTable.id })
    .onConflictDoNothing();

  await adjustRecordFees(parsedValues.data);

  return {
    success: true as const,
    data: result[0],
    error: null,
  };
}

export async function getFeeRanges(walletId: number) {
  const isAuthorized = await canAccessWallet(walletId);

  if (!isAuthorized)
    return { success: false as const, data: null, error: "Unauthorized" };

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

export async function deleteFeeRange(
  values: Pick<SelectFeeRange, "id" | "eWalletId">,
) {
  const { id, eWalletId } = values;
  const isAuthorized = await canAccessWallet(eWalletId);

  if (!isAuthorized)
    return { success: false as const, data: null, error: "Unauthorized" };

  if (typeof id !== "number")
    return { success: false as const, error: "ID should be a number" };

  // gets the most recent fee range that is NOT the deleted one
  const currentFeeRange = await db.query.feesTable.findFirst({
    where: (table, { eq }) => eq(table.id, id),
  });

  if (!currentFeeRange)
    return { success: false as const, error: "Fee range not found" };

  await adjustRecordFees(currentFeeRange, true);
  // revert first before deleting, so no optimization here
  await db.delete(feesTable).where(eq(feesTable.id, id));

  return { success: true as const, error: null };
}

type SuggestedFeeOptions = {
  walletId: typeof eWalletsTable.$inferSelect.id;
  type: (typeof transactionTypeEnum.enumValues)[number];
  amount: number;
  transactionDate: Date;
};
export async function getSuggestedFee({
  walletId,
  type,
  amount,
  transactionDate,
}: SuggestedFeeOptions) {
  const isAuthorized = await canAccessWallet(walletId);
  if (!isAuthorized) return 0;

  // first attempt of getting fee is to check custom fee ranges if the amount falls within any range

  /* by getting all fees table in this wallet that was implemented BEFORE the transaction date,
   * because I need the fee property to do some calculations
   * to check if it really belongs in that fee range first
   */
  const result = await db.query.feesTable.findMany({
    where: (fields, { eq, and, lt }) =>
      and(
        eq(fields.eWalletId, walletId),
        lt(fields.dateImplemented, transactionDate),
      ),
    orderBy: (recordsTable, { desc }) => [desc(recordsTable.dateImplemented)],
  });

  /* the calculation was just reducing the amount with the fee if it was cash-out
   * e.g. in range 1-500 with fee = 15, 515 still belongs in this range (515 - 15 = 500)
   */

  if (result && result.length) {
    const matchedRange = result.find((range) => {
      const modAmount = type === "cash-out" ? amount - range.fee : amount;
      return modAmount >= range.amountStart && modAmount <= range.amountEnd;
    });
    if (matchedRange) return matchedRange.fee;
  }

  // second attempt is to use the default rate and ladder if no custom fee range matched
  const { data: rate } = await getDefaultRate(walletId);
  const { data: ladder } = await getDefaultLadder(walletId);

  if (!rate || !ladder) return null;

  if (type === "cash-out") {
    const multiplier = Math.floor(amount / ladder);
    const lowestLadderPossible = ladder * multiplier;
    const lowestLadderFee = rate * multiplier;
    const excess = amount - lowestLadderPossible;

    if (excess > lowestLadderFee) {
      return lowestLadderFee + rate; // next ladder fee
    } else return lowestLadderFee; // current ladder fee
  } else return Math.ceil(amount / ladder) * rate;
}

/**
 * @param currentFeeRange the current fee range, needs to be existing in the db
 * @param revert should be set to true if record.fee should be reverted to currentFeeRange's previous fee range (or default rate)
 */
async function adjustRecordFees(
  currentFeeRange: InsertFeeRange,
  revert?: boolean,
) {
  // get all records whose amount is within amountStart & amountEnd of curentFeerange
  // and whose record date is AFTER curentFeerange.dateImplementation
  const records = await db.query.recordsTable.findMany({
    where: (table, { and, eq, or, gte, between, sql }) =>
      and(
        eq(table.eWalletId, currentFeeRange.eWalletId),
        gte(table.date, currentFeeRange.dateImplemented),
        or(
          and(
            eq(table.type, "cash-in"),
            between(
              table.amount,
              currentFeeRange.amountStart,
              currentFeeRange.amountEnd,
            ),
          ),
          and(
            eq(table.type, "cash-out"),
            between(
              table.amount,
              currentFeeRange.amountStart,
              sql`${currentFeeRange.amountEnd} + ${table.fee}`,
            ),
          ),
        ),
      ),
    orderBy: (recordsTable, { desc }) => [desc(recordsTable.date)],
  });

  // loop each of them, and get the most recent fee range before this current fee range
  // if no prev fee range, get the default rate of this wallet
  //
  // if record.fee == prev.fee, change it to the curentFeerange's fee, unless revert == true,
  // in which case, change it to the prev.fee or default rate
  // otherwise, it means it was specially modified (e.g. discounts / another fee range later implemented), so leave it untouched
  records.forEach(async (record) => {
    const modifiedAmount =
      record.type === "cash-in" ? record.amount : record.amount - record.fee;
    // checks if this current fee range is the latest fee range for this specific record
    const otherLatestRange = await db.query.feesTable.findFirst({
      where: (table, { and, gt, lte, sql, between }) =>
        and(
          eq(table.eWalletId, currentFeeRange.eWalletId),
          gt(table.dateImplemented, currentFeeRange.dateImplemented), // should be AFTER the curentFeerange's date implementation
          lte(table.dateImplemented, record.date), // but BEFORE the record's date
          between(sql`${modifiedAmount}`, table.amountStart, table.amountEnd),
        ),
      orderBy: (recordsTable, { desc }) => [desc(recordsTable.dateImplemented)],
    });

    // skip if not the latest fee range and is not updating
    if (!!otherLatestRange) return;

    const prevFeeRange = await db.query.feesTable.findFirst({
      where: (table, { and, lt, sql, between }) =>
        and(
          eq(table.eWalletId, currentFeeRange.eWalletId),
          lt(table.dateImplemented, currentFeeRange.dateImplemented), // should be BEFORE the curentFeerange's date implementation
          lt(table.dateImplemented, record.date), // and BEFORE the record's date
          between(sql`${modifiedAmount}`, table.amountStart, table.amountEnd),
        ),
      orderBy: (recordsTable, { desc }) => [desc(recordsTable.dateImplemented)],
    });

    let prevFee = 0;
    if (!prevFeeRange) {
      const { data: rate } = await getDefaultRate(record.eWalletId);
      const { data: ladder } = await getDefaultLadder(record.eWalletId);

      // if default rate or ladder is not set which should NOT happen,
      // just skip the fee adjustment for this record to avoid messing up fees
      if (!rate || !ladder) return;

      if (record.type === "cash-out") {
        // round up to nearest ladder
        const nearestMaxLadder = Math.floor(record.amount / ladder) * ladder;
        const initialFee = nearestMaxLadder * rate;
        const diff = record.amount - nearestMaxLadder;
        const belowInitialFee = initialFee >= diff;

        prevFee = belowInitialFee ? initialFee : initialFee + ladder * rate;
      } else prevFee = Math.ceil(record.amount / ladder) * ladder * rate;
    } else prevFee = prevFeeRange.fee;

    // when adding new fee range
    if (record.fee === prevFee) {
      await updateRecord({
        ...record,
        fee: currentFeeRange.fee,
      });
    }
    // when deleting existing fee range
    else if (record.fee === currentFeeRange.fee && revert) {
      await updateRecord({
        ...record,
        fee: prevFee,
      });
    }
  });
}
