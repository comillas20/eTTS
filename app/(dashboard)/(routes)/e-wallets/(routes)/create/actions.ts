"use server";

import db from "@/db/drizzle";
import { eWalletsTable } from "@/db/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export async function hasWallets() {
  return await db.query.eWalletsTable.findFirst({
    columns: { id: true },
  });
}

const createWalletSchema = createInsertSchema(eWalletsTable, {
  name: (schema) =>
    schema
      .trim()
      .min(1, "E-wallet name is required")
      .max(20, "E-wallet name is too long"),
  cellNumber: (schema) => schema.min(11, "Invalid phone no.").or(z.literal("")),
  url: (schema) =>
    schema
      .trim()
      .min(1, "E-wallet name is required")
      .max(20, "E-wallet name is too long"), // user does not need to know about url field
});

type CreateWallet = z.infer<typeof createWalletSchema>;
export async function createWallet(values: CreateWallet) {
  const parsedValues = createWalletSchema.safeParse(values);

  if (parsedValues.error) return parsedValues.error;

  const wallet = await db
    .insert(eWalletsTable)
    .values(parsedValues.data)
    .returning({ url: eWalletsTable.url });

  return wallet[0];
}
