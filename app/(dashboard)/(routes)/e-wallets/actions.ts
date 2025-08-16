"use server";

import db from "@/db/drizzle";
import { eWalletsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createUpdateSchema } from "drizzle-zod";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateWalletSchema = createUpdateSchema(eWalletsTable, {
  name: (schema) =>
    schema
      .trim()
      .min(1, "E-wallet name is required")
      .max(20, "E-wallet name is too long"),
  cellNumber: (schema) =>
    schema.trim().min(11, "Invalid phone no.").or(z.literal("")),
  url: (schema) =>
    schema
      .trim()
      .min(1, "E-wallet name is required")
      .max(20, "E-wallet name is too long"), // user does not need to know about url field
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
