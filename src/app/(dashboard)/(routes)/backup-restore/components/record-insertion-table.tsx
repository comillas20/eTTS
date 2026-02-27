"use client";
import { DatatableColumnFilterHeader } from "@/app/(dashboard)/components/datatable-column-filter-header";
import { DataTableColumnSortHeader } from "@/app/(dashboard)/components/datatable-column-sort-header";
import { DatatableFrame } from "@/app/(dashboard)/components/datatable-frame";
import { DatatablePagination } from "@/app/(dashboard)/components/datatable-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { eWalletsTable, recordsTable } from "@/db/schema";
import {
  ColumnDef,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  BanknoteXIcon,
  BracketsIcon,
  NotebookPenIcon,
  PhoneIcon,
  PhoneMissedIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";

type InsertRecord = Omit<typeof recordsTable.$inferInsert, "eWalletId">;
type RecordInsertionTableProps = {
  records: InsertRecord[];
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setRecord: (updatedRecord: InsertRecord, index: number) => void;
  onSave: () => void;
  wallet: Pick<typeof eWalletsTable.$inferSelect, "id" | "name" | "url">;
};
const dateFormat = "MMM d, yyyy, h:mma";

const columns: ColumnDef<InsertRecord>[] = [
  {
    id: "reference",
    accessorKey: "referenceNumber",
    header: "Reference",
  },
  {
    id: "mobile number",
    accessorKey: "cellNumber",
    header: ({ column }) => (
      <DatatableColumnFilterHeader
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
      row.original.cellNumber ?? (
        <span className="text-muted-foreground italic">Not Available</span>
      ),
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
        <DatatableColumnFilterHeader
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
    cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnSortHeader column={column} title="Amount" />
    ),
    cell: ({ row }) =>
      Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
        currencyDisplay: "code",
      }).format(row.original.amount),
  },
  {
    accessorKey: "fee",
    header: ({ column }) => (
      <DataTableColumnSortHeader column={column} title="Fee" />
    ),
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
    header: ({ column }) => (
      <DataTableColumnSortHeader column={column} title="Transaction date" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {format(row.original.date, dateFormat)}
        {row.original.notes && <NotebookPenIcon className="size-4" />}
      </div>
    ),
  },
  {
    id: "claim status",
    accessorKey: "claimedAt",
    header: ({ column }) => {
      return (
        <DatatableColumnFilterHeader
          header={{ title: "Claim status", icon: SlidersHorizontalIcon }}
          options={[
            {
              label: "All",
              icon: BracketsIcon,
              isSelected: column.getFilterValue() === undefined,
              onSelect: () => column.setFilterValue(undefined),
            },
            {
              label: "Unclaimed",
              icon: BanknoteXIcon,
              isSelected: column.getFilterValue() === "unclaimed",
              onSelect: () => column.setFilterValue("unclaimed"),
            },
            {
              label: "Claimed",
              icon: BanknoteArrowDownIcon,
              isSelected: column.getFilterValue() === "claimed",
              onSelect: () => column.setFilterValue("claimed"),
            },
            {
              label: "Not Applicable",
              icon: XIcon,
              isSelected: column.getFilterValue() === "n/a",
              onSelect: () => column.setFilterValue("n/a"),
            },
          ]}
        />
      );
    },
    cell: ({ row }) => {
      if (row.original.type !== "cash-out")
        return (
          <span className="text-muted-foreground italic">Not Applicable</span>
        );

      return row.original.claimedAt ? (
        <Badge variant="outline">
          {format(row.original.claimedAt, dateFormat)}
        </Badge>
      ) : (
        <Badge variant="destructive">Unclaimed</Badge>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      if (typeof filterValue !== "string") return true;

      if (filterValue === "claimed") return row.original.claimedAt !== null;
      if (filterValue === "unclaimed")
        return (
          row.original.type === "cash-out" && row.original.claimedAt === null
        );
      if (filterValue === "n/a") return row.original.type !== "cash-out";

      return true;
    },
  },
];

export function RecordInsertionTable({
  records,
  isModalOpen,
  setIsModalOpen,
  onSave,
  wallet,
}: RecordInsertionTableProps) {
  const table = useReactTable({
    data: records,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      headerRowProps() {
        return {
          className: "hover:bg-muted/10",
        };
      },
    },
    autoResetPageIndex: false,
  });

  return (
    <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <AlertDialogContent className="sm:max-w-[calc(100%-2rem)]">
        <AlertDialogHeader>
          <AlertDialogTitle>Record Restoration</AlertDialogTitle>
          <AlertDialogDescription>
            The records that will be restored to{" "}
            <strong className="text-secondary">{wallet.name}</strong> wallet
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4">
          <DatatableFrame table={table} />
          <DatatablePagination table={table} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onSave}>Save</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
