"use client";

import { DatatableFrame } from "@/app/(dashboard)/components/datatable-frame";
import { Pagination } from "@/app/(dashboard)/components/datatable-pagination";
import { eWalletsTable } from "@/db/schema";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { getRecords } from "../actions";
import { columns } from "./datatable/columns";
import { Header } from "./datatable/header";

type DatatableProps = {
  wallet: typeof eWalletsTable.$inferSelect;
};

export function Datatable({ wallet }: DatatableProps) {
  const { data, isFetching } = useQuery({
    queryKey: ["records", wallet.id],
    queryFn: async () => getRecords(wallet.id),
  });

  // const router = useRouter();

  const table = useReactTable({
    data: data || [],
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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

  if (!isFetching)
    return (
      <div className="flex size-full flex-col gap-4">
        <Header table={table} />
        <DatatableFrame table={table} />
        <Pagination table={table} />
      </div>
    );
}
