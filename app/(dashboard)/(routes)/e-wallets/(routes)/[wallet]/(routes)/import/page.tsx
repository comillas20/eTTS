import { getWalletUrls } from "@/app/(dashboard)/actions/wallets";
import db from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ImportForm } from "./components/import-form";

export async function generateStaticParams() {
  const wallets = await getWalletUrls();

  return wallets.map((url) => ({
    wallet: url,
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
  return (
    <div className="space-y-8 p-2">
      <div>
        <h3>Import data</h3>
        <p className="text-sm">
          Import data from a PDF downloaded from your e-wallet provider
        </p>
      </div>
      <ImportForm wallet={eWallet} />
    </div>
  );
}
