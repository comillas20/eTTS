import { getWalletUrls } from "@/app/(dashboard)/actions/wallets";
import db from "@/db/drizzle";
import { notFound } from "next/navigation";

import { UpdateWallet } from "./components/update-wallet";

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
    <div className="flex gap-x-48 p-2">
      <div className="flex-1 space-y-24">
        <div className="space-y-8">
          <div>
            <h3>Update e-Wallet</h3>
            <p className="text-sm">Update the details of this e-Wallet</p>
          </div>
          <UpdateWallet initialData={eWallet} />
        </div>
      </div>
    </div>
  );
}
