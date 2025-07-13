import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import { NotebookPenIcon } from "lucide-react";
import { isDateRange } from "react-day-picker";
import { Record } from "../../actions";
import { RowActions } from "./row-actions";

const dateFormat = "MMM d, yyyy, h:mma";

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
    cell: ({ row }) =>
      row.original.cellNumber ?? <Badge variant="outline">N/A</Badge>,
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
            <Badge>
              {claimedAt ? format(claimedAt, dateFormat) : "Unclaimed"}
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
    id: "transaction date",
    accessorKey: "date",
    header: "Transaction date",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {format(row.original.date, dateFormat)}
        {row.original.notes && <NotebookPenIcon className="size-4" />}
      </div>
    ),
    filterFn: (row, columnId, filterValue) => {
      if (isDateRange(filterValue)) {
        const { date } = row.original;

        if (filterValue.from && isSameDay(filterValue.from, date)) return true;
        if (filterValue.to && isSameDay(filterValue.to, date)) return true;
        if (filterValue.from && filterValue.to)
          return (
            isAfter(date, filterValue.from) && isBefore(date, filterValue.to)
          );
      }

      return true;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
      <RowActions record={row.original} table={table} />
    ),
  },
];
