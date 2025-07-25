import { getWallets } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { WalletUpdateDialog } from "./components/wallet-update-dialog";
import { WalletPieChart } from "./components/wallet-pie-chart";
import { WalletDeleteDialog } from "./components/wallet-delete-dialog";

export default async function Page() {
  const wallets = await getWallets();
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
      {wallets.map((wallet) => {
        const cashIn = wallet.records.filter(
          (record) => record.type === "cash-in",
        );
        const cashOut = wallet.records.filter(
          (record) => record.type === "cash-out" && !!record.claimedAt,
        );
        return (
          <Card key={wallet.id}>
            <CardHeader>
              <CardTitle>{wallet.name}</CardTitle>
              <CardDescription>{wallet.cellNumber}</CardDescription>
              <CardAction className="space-x-2">
                <WalletUpdateDialog initialData={wallet} />
                <WalletDeleteDialog id={wallet.id} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <WalletPieChart
                data={[
                  {
                    type: "cashIn",
                    transactions: cashIn.length,
                    fill: "var(--chart-1)",
                  },
                  {
                    type: "cashOut",
                    transactions: cashOut.length,
                    fill: "var(--chart-2)",
                  },
                ]}
              />
            </CardContent>
          </Card>
        );
      })}

      <Button
        className="size-full rounded-xl py-6 shadow-sm"
        variant="outline"
        asChild>
        <Link href="/e-wallets/create">
          <PlusIcon className="size-4" />
          <span>Add e-Wallet</span>
        </Link>
      </Button>
    </div>
  );
}
