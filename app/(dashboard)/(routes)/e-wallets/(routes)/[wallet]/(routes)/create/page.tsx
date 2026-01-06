import { getWalletUrls } from "@/app/(dashboard)/actions/wallets";
import db from "@/db/drizzle";
import { notFound } from "next/navigation";
import { RecordForm } from "./components/record-form";

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
        <div className="grid gap-y-16 lg:grid-cols-2 lg:gap-x-4">
          <RecordForm wallet={eWallet} />
        </div>
      </div>
    </div>
  );
}
