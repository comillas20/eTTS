import { DatatableColumnHeaderFilter } from "@/app/(dashboard)/components/datatable-column-header-filter";
import { Badge } from "@/components/ui/badge";
import { recordsTable } from "@/db/schema";
import { ColumnDef } from "@tanstack/react-table";
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  BracketsIcon,
  NotebookPenIcon,
  PhoneIcon,
  PhoneMissedIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { isDateRange } from "react-day-picker";
import { RowActions } from "./row-actions";

type Record = typeof recordsTable.$inferSelect;
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
    header: ({ column }) => (
      <DatatableColumnHeaderFilter
        options={[
          {
            label: "All",
            icon: BracketsIcon,
            isSelected: !column.getIsFiltered(),
            onSelect() {
              column.setFilterValue(undefined);
            },
          },
          {
            label: "With mobile number",
            icon: PhoneIcon,
            isSelected:
              typeof column.getFilterValue() === "boolean" &&
              !!column.getFilterValue(),
            onSelect() {
              column.setFilterValue(true);
            },
          },
          {
            label: "Without mobile number",
            icon: PhoneMissedIcon,
            isSelected:
              typeof column.getFilterValue() === "boolean" &&
              !column.getFilterValue(),
            onSelect() {
              column.setFilterValue(false);
            },
          },
        ]}
        header={{ title: "Mobile number", icon: SlidersHorizontalIcon }}
      />
    ),
    cell: ({ row }) =>
      row.original.cellNumber ?? <Badge variant="outline">N/A</Badge>,
    filterFn: (row, columnId, filterValue) => {
      if (typeof filterValue === "boolean") {
        return filterValue
          ? row.original.cellNumber !== null
          : row.original.cellNumber === null;
      }

      return true;
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      const facets = Array.from(
        column.getFacetedUniqueValues().keys(),
      ) as string[];

      return (
        <DatatableColumnHeaderFilter
          header={{ title: "Type", icon: SlidersHorizontalIcon }}
          options={[
            {
              label: "All",
              icon: BracketsIcon,
              isSelected: column.getFilterValue() === undefined,
              onSelect: () => column.setFilterValue(undefined),
            },
            ...facets.map((type) => ({
              label: type.charAt(0).toUpperCase() + type.slice(1),
              icon:
                type === "cash-in"
                  ? BanknoteArrowUpIcon
                  : BanknoteArrowDownIcon,
              isSelected: column.getFilterValue() === type,
              onSelect: () => column.setFilterValue(type),
            })),
          ]}
        />
      );
    },
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
