import { getWallets } from "@/app/(dashboard)/actions";
import db from "@/db/drizzle";
import { notFound } from "next/navigation";
import { RecordUpdateForm } from "./components/record-update-form";

export async function generateStaticParams() {
  const wallets = await getWallets();

  return wallets.map((wallet) => ({
    wallet: wallet.url,
  }));
}

type PageProps = {
  params: Promise<{ wallet: string; record: string }>;
};

export default async function Page({ params }: PageProps) {
  const { wallet, record: recordId } = await params;

  const eWallet = await db.query.eWalletsTable.findFirst({
    where: (wallets, { eq }) => eq(wallets.url, wallet),
  });

  const record = await db.query.recordsTable.findFirst({
    where: (records, { eq }) => eq(records.id, Number(recordId)),
  });

  if (!eWallet || !record) return notFound();

  return (
    <div className="space-y-12 p-2">
      <div className="space-y-4">
        <div>
          <h3>Update record</h3>
          <p className="text-sm">
            Update record details of this specific record
          </p>
        </div>
        <RecordUpdateForm wallet={eWallet} record={record} />
      </div>
    </div>
  );
}
