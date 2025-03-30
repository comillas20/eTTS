import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const eWalletsTable = pgTable("eWallets", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  cellNumber: varchar({ length: 13 }).notNull(),
});

export const transactionTypeEnum = pgEnum("transactionType", [
  "cash-in",
  "cash-out",
]);

export const recordsTable = pgTable("records", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  referenceNumber: varchar({ length: 255 }).notNull(),
  cellNumber: varchar({ length: 13 }).notNull(),
  amount: numeric({ mode: "number", scale: 2 }).notNull(),
  fee: numeric({ mode: "number", scale: 2 }).notNull(),
  date: timestamp().notNull(),
  type: transactionTypeEnum().notNull(),
});
