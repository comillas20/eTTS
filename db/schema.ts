import { relations } from "drizzle-orm";
import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean()
    .$defaultFn(() => false)
    .notNull(),
  image: text(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp().notNull(),
  token: text().notNull().unique(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  password: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});

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
  cellNumber: varchar({ length: 13 }),
  amount: numeric({ mode: "number", scale: 2 }).notNull(),
  fee: numeric({ mode: "number", scale: 2 }).notNull(),
  date: timestamp().notNull(),
  type: transactionTypeEnum().notNull(),
  claimedAt: timestamp(),
  notes: text(),
  eWalletId: integer()
    .notNull()
    .references(() => eWalletsTable.id, {
      onDelete: "cascade",
    }),
  createdAt: timestamp().notNull().defaultNow(),
});

export const recordsRelations = relations(recordsTable, ({ one }) => ({
  eWallet: one(eWalletsTable, {
    fields: [recordsTable.eWalletId],
    references: [eWalletsTable.id],
  }),
}));
