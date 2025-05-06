"use server";

import { Trash2Icon } from "lucide-react";
import { OverviewHeader } from "./components/overview-header";
import { StatusCard } from "./components/status-card";
import { getFilteredRecords } from "./actions";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { year, month, wallet } = await searchParams;

  const result = await getFilteredRecords({
    walletId:
      wallet && typeof wallet === "string" && !isNaN(parseInt(wallet, 10))
        ? parseInt(wallet, 10)
        : undefined,
    month:
      month && typeof month === "string" && !isNaN(parseInt(month, 10))
        ? parseInt(month, 10)
        : undefined,
    year:
      year && typeof year === "string" && !isNaN(parseInt(year, 10))
        ? parseInt(year, 10)
        : undefined,
  });

  console.log(result);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <OverviewHeader />
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <StatusCard
          title="Profit"
          content={Intl.NumberFormat("en-US", {
            currency: "PHP",
            style: "currency",
            currencyDisplay: "symbol",
          }).format(2000)}
          icon={Trash2Icon}
          description=""
          variant="secondary"
        />
        <StatusCard
          title="Cash-in"
          content={Intl.NumberFormat("en-US", {
            currency: "PHP",
            style: "currency",
            currencyDisplay: "symbol",
          }).format(2000)}
          icon={Trash2Icon}
          description=""
        />
        <StatusCard
          title="Cash-out"
          content={Intl.NumberFormat("en-US", {
            currency: "PHP",
            style: "currency",
            currencyDisplay: "symbol",
          }).format(2000)}
          icon={Trash2Icon}
          description=""
        />
        <StatusCard
          title="Losses"
          content={Intl.NumberFormat("en-US", {
            currency: "PHP",
            style: "currency",
            currencyDisplay: "symbol",
          }).format(2000)}
          icon={Trash2Icon}
          description=""
          variant="destructive"
        />
      </div>
    </main>
  );
}
