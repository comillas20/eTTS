import drizzle from "./drizzle";
import { eWalletsTable } from "./schema";

async function eWalletsSeeder() {
  await drizzle
    .insert(eWalletsTable)
    .values({
      name: "G-cash",
      cellNumber: "09215177647",
    })
    .onConflictDoNothing({ target: eWalletsTable.id });

  console.log("Seeder loaded successfully");
}

eWalletsSeeder();
