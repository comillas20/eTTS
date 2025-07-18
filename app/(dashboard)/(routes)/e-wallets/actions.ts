"use server";

import db from "@/db/drizzle";
import { eWalletsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createUpdateSchema } from "drizzle-zod";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateWalletSchema = createUpdateSchema(eWalletsTable, {
  name: (schema) => schema.trim().min(1, "E-wallet name is required"),
  cellNumber: (schema) =>
    schema.trim().min(11, "Invalid phone no.").or(z.literal("")),
  url: (schema) => schema.min(1, "E-wallet name is required"), // user does not need to know about url field
});

type UpdateWallet = z.infer<typeof updateWalletSchema> & { id: number };
export async function updateWallet(values: UpdateWallet) {
  const parsedValues = updateWalletSchema.safeParse(values);

  if (parsedValues.error) return parsedValues.error;

  const wallet = await db
    .update(eWalletsTable)
    .set(parsedValues.data)
    .where(eq(eWalletsTable.id, values.id))
    .returning({ url: eWalletsTable.url });

  revalidatePath("/e-wallets");
  return wallet[0];
}

export async function deleteWallet(
  id: typeof eWalletsTable.$inferSelect.id,
): Promise<{ error: string | null }> {
  if (typeof id !== "number") return { error: "ID should be a number" };

  await db.delete(eWalletsTable).where(eq(eWalletsTable.id, id));

  revalidatePath("/e-wallets");

  return { error: null };
}
