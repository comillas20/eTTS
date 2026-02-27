import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import * as schema from "./schema";
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const drizzleSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  return drizzle(process.env.DATABASE_URL, { schema });
};

type DrizzleSingleton = ReturnType<typeof drizzleSingleton>;

const globalForDrizzle = globalThis as unknown as {
  db: DrizzleSingleton | undefined;
};

const db = globalForDrizzle.db ?? drizzleSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalForDrizzle.db = db;
