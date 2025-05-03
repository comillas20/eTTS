import { relations } from "drizzle-orm";
import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
  text,
} from "drizzle-orm/pg-core";

export const eWalletsTable = pgTable("eWallets", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).unique().notNull(),
  url: varchar({ length: 255 }).unique().notNull(),
  cellNumber: varchar({ length: 13 }).notNull(),
});

export const eWalletsRelations = relations(eWalletsTable, ({ many }) => ({
  records: many(recordsTable),
}));

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
  claimedAt: timestamp(),
  notes: text(),
  eWalletId: integer(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const recordsRelations = relations(recordsTable, ({ one }) => ({
  eWallet: one(eWalletsTable, {
    fields: [recordsTable.eWalletId],
    references: [eWalletsTable.id],
  }),
}));
