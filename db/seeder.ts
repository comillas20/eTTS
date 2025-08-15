import db from "./drizzle";
import { eWalletsTable } from "./schema";

type eWALLET = typeof eWalletsTable.$inferInsert;
const eWallets: eWALLET[] = [
  {
    name: "G-cash",
    url: "g-cash",
    cellNumber: "09165591258",
  },
  // Add more e-wallets here
];

export async function main() {
  await db
    .insert(eWalletsTable)
    .values(eWallets)
    .returning({ eWalletId: eWalletsTable.id })
    .onConflictDoNothing({ target: eWalletsTable.name });

  console.log("Seeder loaded successfully");
}

main();
