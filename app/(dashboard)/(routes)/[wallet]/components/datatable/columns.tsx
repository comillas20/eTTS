import { ColumnDef } from "@tanstack/react-table";
import { Record } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<Record>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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

      if (type === "cash-in") return <Badge variant="outline">{type}</Badge>;
      else {
        return (
          <div className="flex gap-1">
            <Badge variant="outline">{type}</Badge>
            <Badge>{claimedAt ?? "Unclaimed"}</Badge>
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
    id: "transaction date",
    accessorKey: "date",
    header: "Transaction date",
  },
  {
    id: "recorded at",
    accessorKey: "createdAt",
    header: "Recorded at",
  },
];
