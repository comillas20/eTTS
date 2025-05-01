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
  {
    id: "status",
    accessorKey: "claimedAt",
    header: "Status",
    cell: ({ row }) => {
      const value = row.original.claimedAt;

      return value ? (
        <div className="flex gap-2">
          <Badge variant="secondary">Claimed</Badge>
          <span>{value}</span>
        </div>
      ) : (
        <Badge>Unclaimed</Badge>
      );
    },
  },
];
