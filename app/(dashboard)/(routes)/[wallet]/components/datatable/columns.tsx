import { ColumnDef } from "@tanstack/react-table";
import { Record } from "../../actions";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<Record>[] = [
  {
    id: "reference",
    accessorKey: "referenceNumber",
    header: "Reference",
  },
  {
    id: "mobile number",
    accessorKey: "cellNumber",
    header: "Mobile number",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const { claimedAt, type } = row.original;

      if (type === "cash-in") return <Badge>{type}</Badge>;
      else {
        return (
          <div className="flex gap-1">
            <Badge variant="outline">{type}</Badge>
            <Badge variant={claimedAt ? "secondary" : "default"}>
              {claimedAt ?? "Unclaimed"}
            </Badge>
          </div>
        );
      }
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) =>
      Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
        currencyDisplay: "code",
      }).format(row.original.amount),
  },
  {
    accessorKey: "fee",
    header: "Fee",
    cell: ({ row }) =>
      Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
        currencyDisplay: "code",
      }).format(row.original.fee),
  },
  {
    accessorKey: "date",
    header: "Date",
  },
];
