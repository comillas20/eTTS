"use client";

import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Header } from "./datatable/header";
import { Frame } from "./datatable/frame";
import { Pagination } from "./datatable/pagination";
import { columns } from "./datatable/columns";
import { Record } from "../data";

type DatatableProps = {
  data: Record[];
};
export function Datatable({ data }: DatatableProps) {
  const table = useReactTable({
    data: data,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  return (
    <div className="flex size-full flex-col gap-4">
      <Header />
      <Frame tableData={table} />
      <Pagination table={table} />
    </div>
  );
}
