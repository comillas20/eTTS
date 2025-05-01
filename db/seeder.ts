import db from "./drizzle";
import { eWalletsTable, recordsTable } from "./schema";

async function eWalletsSeeder() {
  const eWallet = await db
    .insert(eWalletsTable)
    .values({
      name: "G-cash",
      url: "g-cash",
      cellNumber: "09215177647",
    })
    .returning({ eWalletId: eWalletsTable.id })
    .onConflictDoNothing({ target: eWalletsTable.name });

  await db.insert(recordsTable).values([
    {
      referenceNumber: "1234567890123",
      cellNumber: "09215177647",
      amount: 1000,
      fee: 20,
      type: "cash-in",
      date: new Date(),
      eWalletId: eWallet[0].eWalletId,
    },
    {
      referenceNumber: "1234567890455",
      cellNumber: "09215177647",
      amount: 10000,
      fee: 200,
      type: "cash-in",
      date: new Date(),
      eWalletId: eWallet[0].eWalletId,
      claimedAt: new Date(),
    },
  ]);

  console.log("Seeder loaded successfully");
}

eWalletsSeeder();
