import { getWallets } from "@/app/(dashboard)/actions/wallets";
import db from "@/db/drizzle";
import { notFound } from "next/navigation";
import { CustomFees } from "./components/custom-fees";
import Link from "next/link";

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
    <div className="flex gap-x-48 p-2">
      <div className="flex-1 space-y-4">
        <CustomFees walletId={eWallet.id} />
      </div>
      <div className="sticky w-72 text-sm">
        <ul className="[&>li]:mt-2 [&>li]:ml-4">
          <h5 className="mb-4 font-medium">On this page</h5>
          <li>
            <Link href="#custom-fees" className="hover:text-primary">
              Custom Fees
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
