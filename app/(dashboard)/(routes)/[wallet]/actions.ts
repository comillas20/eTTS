"use server";

import db from "@/db/drizzle";
import { recordsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRecords(walletId: number) {
  return await db.query.recordsTable.findMany({
    where: (fields, { eq }) => eq(fields.eWalletId, walletId),
  });
}

export type Record = Awaited<ReturnType<typeof getRecords>>[number];

export async function deleteRecord(recordIds: number[]) {
  await Promise.all(
    recordIds.map((recordId) =>
      db.delete(recordsTable).where(eq(recordsTable.id, recordId)),
    ),
  );

  revalidatePath("/[wallet]", "page");
}
