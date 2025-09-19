import { getWallets } from "@/app/(dashboard)/actions/wallets";
import db from "@/db/drizzle";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomFees } from "./components/custom-fees";
import { Records } from "./components/records";
import { UpdateWallet } from "./components/update-wallet";

export async function generateStaticParams() {
  const wallets = await getWallets();

  return wallets.map((wallet) => ({
    wallet: wallet.url,
  }));
}

type PageProps = {
  params: Promise<{ wallet: string }>;
};

const headers = [
  { id: "update-wallet", label: "Update e-Wallet" },
  { id: "records", label: "Backup & Restore" },
  { id: "custom-fees", label: "Custom Fees" },
];

export default async function Page({ params }: PageProps) {
  const { wallet } = await params;

  const eWallet = await db.query.eWalletsTable.findFirst({
    where: (wallets, { eq }) => eq(wallets.url, wallet),
  });

  if (!eWallet) return notFound();

  return (
    <div className="flex gap-x-48 p-2">
      <div className="flex-1 space-y-24">
        <UpdateWallet initialData={eWallet} />
        <Records wallet={eWallet} />
        <CustomFees walletId={eWallet.id} />
      </div>
      <div className="relative w-72 text-sm">
        <ul className="sticky top-20 [&>li]:mt-2 [&>li]:ml-4">
          <h5 className="mb-4 font-medium">On this page</h5>
          {headers.map((header, i) => (
            <li key={i}>
              <Link href={"#" + header.id} className="hover:text-primary">
                {header.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
