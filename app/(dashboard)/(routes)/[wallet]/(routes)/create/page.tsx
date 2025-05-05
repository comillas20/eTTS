import db from "@/db/drizzle";
import { notFound } from "next/navigation";
import { RecordForm } from "./components/record-form";

type PageProps = {
  params: Promise<{ wallet: string }>;
};

export default async function Page({ params }: PageProps) {
  const { wallet } = await params;

  const eWallet = await db.query.eWalletsTable.findFirst({
    columns: { id: true, name: true },
    where: (wallets, { eq }) => eq(wallets.url, wallet),
  });

  if (!eWallet) return notFound();

  const { id, name } = eWallet;
  return (
    <div className="space-y-4 p-2">
      <div>
        <h3>Create record</h3>
        <p className="text-sm">
          Create a new <strong className="text-accent">{name}</strong> record
        </p>
      </div>
      <RecordForm walletId={id} />
    </div>
  );
}
