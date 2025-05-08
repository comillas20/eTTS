import { recordsTable } from "@/db/schema";
import { StatusCard } from "./status-card";
import { HandCoinsIcon, Trash2Icon } from "lucide-react";

type OverviewCardsProps = {
  data: (typeof recordsTable.$inferSelect)[];
};
export function OverviewCards({ data }: OverviewCardsProps) {
  const fees = data.map((record) => record.fee);
  const profit = fees.reduce((acc, fee) => acc + fee, 0);

  const cashInData = data
    .filter((record) => record.type === "cash-in")
    .map((record) => record.fee);
  const cashIn = cashInData.reduce((acc, fee) => acc + fee, 0);

  const cashOutData = data
    .filter((record) => record.type === "cash-out")
    .map((record) => record.fee);
  const cashOut = cashOutData.reduce((acc, fee) => acc + fee, 0);

  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-4">
      <StatusCard
        title="Profit"
        content={Intl.NumberFormat("en-US", {
          currency: "PHP",
          style: "currency",
          currencyDisplay: "symbol",
        }).format(profit)}
        icon={HandCoinsIcon}
        description=""
        variant="secondary"
      />
      <StatusCard
        title="Cash-in"
        content={Intl.NumberFormat("en-US", {
          currency: "PHP",
          style: "currency",
          currencyDisplay: "symbol",
        }).format(cashIn)}
        icon={HandCoinsIcon}
        description={`${cashInData.length} transactions`}
      />
      <StatusCard
        title="Cash-out"
        content={Intl.NumberFormat("en-US", {
          currency: "PHP",
          style: "currency",
          currencyDisplay: "symbol",
        }).format(cashOut)}
        icon={HandCoinsIcon}
        description={`${cashOutData.length} transactions`}
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
  );
}
