"use client";

import { deleteRecord } from "@/app/(dashboard)/actions/records";
import { DatatableColumnFilterHeader } from "@/app/(dashboard)/components/datatable-column-filter-header";
import { DataTableColumnSortHeader } from "@/app/(dashboard)/components/datatable-column-sort-header";
import { DatatableFrame } from "@/app/(dashboard)/components/datatable-frame";
import { DatatablePagination } from "@/app/(dashboard)/components/datatable-pagination";
import { RangedDateFilter } from "@/app/(dashboard)/components/ranged-date-filter";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { eWalletsTable, recordsTable } from "@/db/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ColumnDef,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Table,
  useReactTable,
} from "@tanstack/react-table";
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  BracketsIcon,
  ChevronDownIcon,
  ColumnsIcon,
  MoreHorizontalIcon,
  NotebookIcon,
  NotebookPenIcon,
  PenIcon,
  PhoneIcon,
  PhoneMissedIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DateRange, isDateRange } from "react-day-picker";
import { toast } from "sonner";

import { getRecordsQuery } from "@/lib/queries";
import { RecordUpdateForm } from "./record-update-form";

type DatatableProps = {
  wallet: typeof eWalletsTable.$inferSelect;
};

export function Datatable({ wallet }: DatatableProps) {
  const { data } = useQuery(getRecordsQuery(wallet.id));

  const records = data && data.success ? data.data : [];

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const currentPageIndexRef = useRef(pagination.pageIndex);

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
      wallet: wallet,
    },
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
  });

  useEffect(() => {
    currentPageIndexRef.current = pagination.pageIndex;
  }, [pagination]);

  // mainly used for useEffect dept. Calling a function as a useEffect dept is bad.
  const pageCount = table.getPageCount();
  useEffect(() => {
    if (currentPageIndexRef.current === 0) return;

    const pageCountIndex = pageCount - 1;
    const globalFilter = table.getState().globalFilter;

    if (typeof globalFilter === "string" && globalFilter !== "") {
      table.resetPageIndex();
      return;
    }

    const pageIndex =
      pageCountIndex < currentPageIndexRef.current
        ? pageCountIndex
        : currentPageIndexRef.current;
    setPagination((prev) => ({
      pageIndex: pageIndex,
      pageSize: prev.pageSize,
    }));
  }, [table, pageCount]);

  return (
    <div className="flex size-full flex-col gap-4">
      <Header table={table} />
      <DatatableFrame table={table} />
      <DatatablePagination table={table} />
    </div>
  );
}

type Record = typeof recordsTable.$inferSelect;
const dateFormat = "MMM d, yyyy, h:mma";

const columns: ColumnDef<Record>[] = [
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

type HeaderProps = {
  table: Table<Record>;
};
function Header({ table }: HeaderProps) {
  const path = usePathname();

  const transacDateCol = table.getColumn("transaction date");

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Input
          className="w-80"
          placeholder="Search"
          value={(table.getState().globalFilter as string) || ""}
          onChange={({ target }) =>
            table.setState((prev) => ({
              ...prev,
              globalFilter: target.value,
            }))
          }
        />
        {transacDateCol && (
          <RangedDateFilter
            dates={transacDateCol.getFilterValue() as DateRange}
            onDateChange={(dates) => {
              transacDateCol.setFilterValue(dates);
            }}
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ColumnsIcon />
              <span className="hidden lg:inline">Customize Columns</span>
              <span className="lg:hidden">Columns</span>
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide(),
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }>
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href={path + `/create`}
          className={buttonVariants({ variant: "secondary" })}>
          <PlusIcon />
          <span className="hidden lg:inline">Add Record</span>
        </Link>
      </div>
    </div>
  );
}

type RowActionsProps = {
  record: Record;
  table: Table<Record>;
};
function RowActions({ record, table }: RowActionsProps) {
  const wallet = table.options.meta?.wallet;

  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSub>
            <DropdownMenuItem asChild>
              <DropdownMenuSubTrigger>
                <NotebookIcon /> View notes
              </DropdownMenuSubTrigger>
            </DropdownMenuItem>
            <DropdownMenuSubContent className="aspect-square min-w-72 p-4">
              <h4>Notes</h4>
              <pre className="text-wrap">
                {record.notes || "No notes available."}
              </pre>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {wallet && (
            <DropdownMenuItem onSelect={() => setOpenUpdateDialog(true)}>
              <PenIcon />
              Edit record
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setOpenDeleteDialog(true)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RowUpdateDialog
        open={openUpdateDialog}
        onOpenChange={setOpenUpdateDialog}
        record={record}
      />
      <RowDeleteDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        record={record}
      />
    </>
  );
}

type RowDialogProps = {
  record: Record;
} & React.ComponentProps<typeof AlertDialog>;

function RowUpdateDialog({ record, ...props }: RowDialogProps) {
  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update record</AlertDialogTitle>
          <AlertDialogDescription>
            Update record details of this specific record
          </AlertDialogDescription>
        </AlertDialogHeader>
        <RecordUpdateForm
          record={record}
          onSave={() => {
            if (props.onOpenChange) props.onOpenChange(false);
          }}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RowDeleteDialog({ record, ...props }: RowDialogProps) {
  const queryClient = useQueryClient();
  const recordM = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });

      toast("The record has been deleted");
    },
  });

  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader className="gap-0.5">
          <AlertDialogTitle>Delete record</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this record?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="text-sm">
          <li className="flex justify-between">
            <span>Reference:</span> <span>{record.referenceNumber}</span>
          </li>
          <li className="flex justify-between">
            <span>Mobile number:</span> <span>{record.cellNumber}</span>
          </li>
          <li className="flex justify-between">
            <span>Amount:</span>{" "}
            <span>
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PHP",
                currencyDisplay: "code",
              }).format(record.amount)}
            </span>
          </li>
          <li className="flex justify-between">
            <span> Fee:</span>{" "}
            <span>
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PHP",
                currencyDisplay: "code",
              }).format(record.amount)}
            </span>
          </li>
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={recordM.isPending}>
            <XIcon />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white shadow-xs"
            onClick={() => recordM.mutate(record.id)}
            disabled={recordM.isPending}>
            <Trash2Icon />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
