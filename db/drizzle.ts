import { drizzle as D } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const drizzleSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  return D(process.env.DATABASE_URL);
};

type DrizzleSingleton = ReturnType<typeof drizzleSingleton>;

const globalForDrizzle = globalThis as unknown as {
  drizzle: DrizzleSingleton | undefined;
};

const drizzle = globalForDrizzle.drizzle ?? drizzleSingleton();

export default drizzle;

if (process.env.NODE_ENV !== "production") globalForDrizzle.drizzle = drizzle;
