import drizzle from "./drizzle";
import { eWalletsTable, recordsTable } from "./schema";

async function eWalletsSeeder() {
  await drizzle
    .insert(eWalletsTable)
    .values({
      name: "G-cash",
      cellNumber: "09215177647",
    })
    .onConflictDoNothing({ target: eWalletsTable.name });

  await drizzle
    .insert(recordsTable)
    .values({
      referenceNumber: "1234567890123",
      cellNumber: "09215177647",
      amount: 1000,
      fee: 100,
      type: "cash-in",
      date: new Date(),
    })
    .onConflictDoNothing({ target: recordsTable.referenceNumber });

  console.log("Seeder loaded successfully");
}

eWalletsSeeder();
