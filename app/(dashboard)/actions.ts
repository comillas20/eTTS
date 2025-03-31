"use server";

import drizzle from "@/db/drizzle";
import { eWalletsTable } from "@/db/schema";

export async function getWallets() {
  const wallets = await drizzle.select().from(eWalletsTable);
  return wallets.map((wallet) => ({
    ...wallet,
    url: wallet.name.toLowerCase().replace(" ", "_"),
  }));
}

type WalletInsert = typeof eWalletsTable.$inferInsert;
export async function createWallet(values: WalletInsert) {
  const wallet = await drizzle.insert(eWalletsTable).values(values);

  return wallet.rowCount;
}

// export const fakeLinks = [
//   {
//     name: "e-Wallets",
//     url: "#",
//     icon: FrameIcon,
//   },
//   {
//     name: "Settings",
//     url: "#",
//     icon: PieChartIcon,
//   },
// ];
