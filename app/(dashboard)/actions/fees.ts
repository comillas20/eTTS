"use server";

import db from "@/db/drizzle";
import { eWalletsTable, feesTable, transactionTypeEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { updateRecord } from "./records";
import { getDefaultRate } from "./wallets";

type InsertFeeRange = typeof feesTable.$inferInsert;

export async function createFeeRange(values: InsertFeeRange) {
  const schema = createInsertSchema(feesTable);
  const parsedValues = schema.safeParse(values);

  if (parsedValues.error)
    return { success: false as const, data: null, error: parsedValues.error };

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

// export async function updateFeeRange(values: SelectFeeRange) {
//   // I used createSelectSchema instead of the update/insert counterpart
//   // because I want the id to also be verified
//   // and that all properties be required

//   const schema = createSelectSchema(feesTable);
//   const parsedValues = schema.safeParse(values);

//   if (parsedValues.error)
//     return { success: false as const, data: null, error: parsedValues.error };

//   const { id, ...rest } = parsedValues.data;

//   const result = await db
//     .update(feesTable)
//     .set(rest)
//     .where(eq(feesTable.id, id))
//     .returning();

//   return {
//     success: true as const,
//     data: result[0],
//     error: null,
//   };
// }

export async function deleteFeeRange(id: number) {
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

// export async function isFeeInExistingRange(fee: number, feeRangeId: number) {
//   const result = await db.query.feesTable.findMany({
//     where: (table, { and, lte, gte }) =>
//       and(lte(table.amountStart, fee), gte(table.amountEnd, fee)),
//   });

//   // if system only finds the current edited range, then we ignore
//   if (result && result.length === 1 && result[0].id === feeRangeId)
//     return false;

//   return !!result;
// }

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

  // second attempt is to use the default rate if no custom fee range matched
  // which has a default ladder of 500
  const { data: rate } = await getDefaultRate(walletId);

  const ladder = 500;
  const amountRate = ladder * rate;

  if (type === "cash-out") {
    const expectedFee = Math.ceil(amount / ladder) * amountRate;
    const baseAmount = amount - expectedFee;

    // Verifying the fee calculation on @baseAmount.
    // If the fee on the baseAmount < expectedFee, use the lower fee and the initial calculation was too high.

    const trueFee = Math.ceil(baseAmount / ladder) * amountRate;

    // The highest fee that could be correct is the expectedFee.
    // The lowest correct fee is trueFee. If they are different,
    // it means the baseAmount crossed into a lower tier.

    return trueFee > expectedFee ? expectedFee : trueFee;
  } else return Math.ceil(amount / ladder) * amountRate;
}

/**
 *
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

      const ladder = 500;

      if (record.type === "cash-out") {
        // round up to nearest ladder
        const nearestMaxLadder = Math.floor(record.amount / ladder) * ladder;
        const initialFee = nearestMaxLadder * rate;
        const diff = record.amount - nearestMaxLadder;
        const belowInitialFee = initialFee >= diff;

        prevFee = belowInitialFee ? initialFee : initialFee + ladder * rate;
      } else prevFee = Math.ceil(record.amount / ladder) * ladder * rate;
    } else prevFee = prevFeeRange.fee;

    if (record.fee === prevFee) {
      await updateRecord({
        ...record,
        fee: currentFeeRange.fee,
      });
    } else if (record.fee === currentFeeRange.fee && revert) {
      await updateRecord({
        ...record,
        fee: prevFee,
      });
    }
  });
}
