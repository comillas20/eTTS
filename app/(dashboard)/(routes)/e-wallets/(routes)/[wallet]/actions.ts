"use server";

import db from "@/db/drizzle";
import { recordsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRecords(walletId: number) {
  return await db.query.recordsTable.findMany({
    where: (fields, { eq }) => eq(fields.eWalletId, walletId),
    orderBy: (fields, { desc }) => [desc(fields.date)],
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

type UpdateNotes = {
  id: number;
  notes: string | null;
};
export async function updateNotes(record: UpdateNotes) {
  const { id, notes } = record;
  await db
    .update(recordsTable)
    .set({ notes: notes })
    .where(eq(recordsTable.id, id));
}
