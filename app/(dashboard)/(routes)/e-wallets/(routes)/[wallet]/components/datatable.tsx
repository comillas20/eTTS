"use client";

import { DatatableFrame } from "@/app/(dashboard)/components/datatable-frame";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { getRecords } from "../actions";
import { columns } from "./datatable/columns";
import { Header } from "./datatable/header";
import { Pagination } from "@/app/(dashboard)/components/datatable-pagination";

type DatatableProps = {
  walletId: number;
};

export function Datatable({ walletId }: DatatableProps) {
  const { data, isFetching } = useQuery({
    queryKey: ["records", walletId],
    queryFn: async () => getRecords(walletId),
  });

  const table = useReactTable({
    data: data || [],
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      headerRowProps() {
        return {
          className: "hover:bg-muted/10",
        };
      },
    },
  });

  if (!isFetching)
    return (
      <div className="flex size-full flex-col gap-4">
        <Header table={table} />
        <DatatableFrame table={table} />
        <Pagination table={table} />
      </div>
    );
}
