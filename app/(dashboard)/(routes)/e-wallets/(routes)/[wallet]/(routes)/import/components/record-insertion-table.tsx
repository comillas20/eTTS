"use client";

import { deleteRecord } from "@/app/(dashboard)/actions/records";
import { DatatableColumnFilterHeader } from "@/app/(dashboard)/components/datatable-column-filter-header";
import { DataTableColumnSortHeader } from "@/app/(dashboard)/components/datatable-column-sort-header";
import { DatatableFrame } from "@/app/(dashboard)/components/datatable-frame";
import { DatatablePagination } from "@/app/(dashboard)/components/datatable-pagination";
import { RangedDateFilter } from "@/app/(dashboard)/components/ranged-date-filter";
import { SearchBar } from "@/components/search-bar";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { format } from "date-fns";
import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  BanknoteXIcon,
  BracketsIcon,
  ChevronDownIcon,
  ColumnsIcon,
  FolderUpIcon,
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
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { recordInsertionColumns } from "./record-insertion-columns";
import { set } from "better-auth";

type RecordsProps = {
  wallet: typeof eWalletsTable.$inferSelect;
};
type SelectRecord = typeof recordsTable.$inferSelect;
type InsertRecord = typeof recordsTable.$inferInsert;
type RecordInsertionTableProps = {
  records: InsertRecord[];
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setRecords: (records: InsertRecord[]) => void;
  onSave: () => void;
} & Pick<RecordsProps, "wallet">;

export function RecordInsertionTable({
  records,
  setRecords,
  isModalOpen,
  setIsModalOpen,
  onSave,
  wallet,
}: RecordInsertionTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const currentPageIndexRef = useRef(pagination.pageIndex);

  const table = useReactTable({
    data: records,
    columns: recordInsertionColumns,
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
      updateRow(rowIndex, columnId, value) {
        const updatedRecords = [...records];
        const recordToUpdate = updatedRecords[rowIndex];
        updatedRecords[rowIndex] = {
          ...recordToUpdate,
          [columnId]: value,
        };

        setRecords(updatedRecords);
      },
      deleteRow(rowIndex) {
        const updatedRecords = [...records];
        updatedRecords.splice(rowIndex, 1);
        setRecords(updatedRecords);
      },
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
    <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <AlertDialogContent className="sm:max-w-[calc(100%-2rem)]">
        <div className="grid grid-cols-4 items-center gap-8">
          <AlertDialogHeader className="col-span-3">
            <AlertDialogTitle>Import data</AlertDialogTitle>
            <AlertDialogDescription>
              The records that will be imported to{" "}
              <strong className="text-secondary">{wallet.name}</strong> wallet
            </AlertDialogDescription>
          </AlertDialogHeader>
          <SearchBar
            value={(table.getState().globalFilter as string) || ""}
            onChange={({ target }) =>
              table.setState((prev) => ({
                ...prev,
                globalFilter: target.value,
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-4">
          <DatatableFrame table={table} />
          <DatatablePagination table={table} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onSave}>Import</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
