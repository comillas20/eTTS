import { getWallets } from "@/app/(dashboard)/actions/wallets";
import db from "@/db/drizzle";
import { notFound } from "next/navigation";
import { RecordForm } from "./components/record-form";
import { RecordFromJson } from "./components/record-from-json";

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

  return (
    <div className="space-y-12 p-2">
      <div className="space-y-4">
        <div>
          <h3>Create record</h3>
          <p className="text-sm">
            Create a new{" "}
            <strong className="text-secondary">{eWallet.name}</strong> record
          </p>
        </div>
        <RecordForm wallet={eWallet} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="col-span-2">
          <h3>Create records in bulk with JSON data</h3>
          <p className="text-sm">Create records in bulk by pasting JSON data</p>
        </div>
        <RecordFromJson wallet={eWallet} />
      </div>
    </div>
  );
}
