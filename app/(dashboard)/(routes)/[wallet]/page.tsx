"use server";
import db from "@/db/drizzle";
import { getWallets } from "../../actions";
import { Datatable } from "./components/datatable";
import { getRecords } from "./actions";
import { eWalletsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateStaticParams() {
  const wallets = await getWallets();

  return wallets.map((wallet) => ({
    wallet: wallet.url,
  }));
}

type PageProps = {
  params: Promise<{ wallet: string }>;
};

export default async function Page({ params }: PageProps) {
  const { wallet } = await params;
  const walletId = await db
    .select({ id: eWalletsTable.id })
    .from(eWalletsTable)
    .where(eq(eWalletsTable.url, wallet))
    .limit(1);

  const data = await getRecords(walletId[0].id);
  return <Datatable data={data} />;
}
