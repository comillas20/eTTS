"use server";
import db from "@/db/drizzle";
import { notFound } from "next/navigation";
import { getWallets } from "@/app/(dashboard)/actions";
import { Datatable } from "./components/datatable";

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

  const eWallet = await db.query.eWalletsTable.findFirst({
    where: (wallets, { eq }) => eq(wallets.url, wallet),
  });

  if (!eWallet) return notFound();

  return <Datatable wallet={eWallet} />;
}
