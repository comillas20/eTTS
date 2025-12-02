import { getWallets } from "@/app/(dashboard)/actions/wallets";
import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
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

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const eWallet = await db.query.eWalletsTable.findFirst({
    where: (wallets, { and, eq }) =>
      and(eq(wallets.url, wallet), eq(wallets.userId, session.user.id)),
  });

  if (!eWallet) return notFound();

  return <Datatable wallet={eWallet} />;
}
