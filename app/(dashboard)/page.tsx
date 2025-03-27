import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusCard } from "./components/status-card";
import { Trash2Icon } from "lucide-react";

export default function Page() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex justify-end">
        <Select defaultValue="January">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="January">January</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <StatusCard
          title="Profit"
          content={Intl.NumberFormat("en-US", {
            currency: "PHP",
            style: "currency",
            currencyDisplay: "symbol",
          }).format(2000)}
          icon={Trash2Icon}
          description=""
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
      </div>
    </main>
  );
}
