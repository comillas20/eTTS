import { recordsTable } from "@/db/schema";
import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  HandCoinsIcon,
} from "lucide-react";
import { StatusCard } from "./status-card";

type OverviewCardsProps = {
  data: (typeof recordsTable.$inferSelect)[];
};
export function OverviewCards({ data }: OverviewCardsProps) {
  const cashInData = data
    .filter((record) => record.type === "cash-in")
    .map((record) => record.fee);
  const cashIn = cashInData.reduce((acc, fee) => acc + fee, 0);

  const cashOutData = data
    .filter((record) => record.type === "cash-out")
    .map((record) => record.fee);
  const cashOut = cashOutData.reduce((acc, fee) => acc + fee, 0);

  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      <StatusCard
        title="Total"
        content={Intl.NumberFormat("en-US", {
          currency: "PHP",
          style: "currency",
          currencyDisplay: "symbol",
        }).format(cashIn + cashOut)}
        icon={HandCoinsIcon}
        description={`${data.length} total transactions`}
        variant="primary"
      />
      <StatusCard
        title="Cash-in"
        content={Intl.NumberFormat("en-US", {
          currency: "PHP",
          style: "currency",
          currencyDisplay: "symbol",
        }).format(cashIn)}
        icon={BanknoteArrowUpIcon}
        description={`${cashInData.length} transactions`}
      />
      <StatusCard
        title="Cash-out"
        content={Intl.NumberFormat("en-US", {
          currency: "PHP",
          style: "currency",
          currencyDisplay: "symbol",
        }).format(cashOut)}
        icon={BanknoteArrowDownIcon}
        description={`${cashOutData.length} transactions`}
      />
    </div>
  );
}
