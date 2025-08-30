"use client";

import { getRecords } from "@/app/(dashboard)/actions/records";
import { DatatableFrame } from "@/app/(dashboard)/components/datatable-frame";
import { DatatablePagination } from "@/app/(dashboard)/components/datatable-pagination";
import { eWalletsTable } from "@/db/schema";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { columns } from "./datatable/columns";
import { Header } from "./datatable/header";

type DatatableProps = {
  wallet: typeof eWalletsTable.$inferSelect;
};

export function Datatable({ wallet }: DatatableProps) {
  const { data } = useQuery({
    queryKey: ["records", wallet.id],
    queryFn: async () => getRecords(wallet.id),
  });

  const records = data && data.success ? data.data : [];

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
  });

  return (
    <div className="flex size-full flex-col gap-4">
      <Header table={table} />
      <DatatableFrame table={table} />
      <DatatablePagination table={table} />
    </div>
  );
}
