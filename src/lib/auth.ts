import db from "@/db/drizzle";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    // disables sign-up if the env variable does not exists or has a value other than "false"
    // apparently, it prevents any registration submittions if set to true
    disableSignUp: process.env.DISABLE_SIGN_UP === "false" ? false : true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  account: {
    fields: {
      userId: "userId",
    },
  },
});

export async function getAuthentication() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

export async function canAccessWallet(walletId: number) {
  const auth = await getAuthentication();

  // early return if not authenticated
  if (!auth) return false;

  const wallet = await db.query.eWalletsTable.findFirst({
    where: (ewalletsTable, { eq, and }) =>
      and(
        eq(ewalletsTable.id, walletId),
        eq(ewalletsTable.userId, auth.user.id),
      ),
  });

  return !!wallet;
}
