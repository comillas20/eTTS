import { Trash2Icon } from "lucide-react";
import { OverviewHeader } from "./components/overview-header";
import { StatusCard } from "./components/status-card";

// type PageProps = {
//   params: Promise<{
//     searchParams: { [key: string]: string | undefined };
//   }>;
//   wallet: Promise<string>;
// };

export default async function Page() {
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
