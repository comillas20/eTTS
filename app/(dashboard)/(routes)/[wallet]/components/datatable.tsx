"use client";

import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Record } from "../actions";
import { columns } from "./datatable/columns";
import { Frame } from "./datatable/frame";
import { Header } from "./datatable/header";
import { Pagination } from "./datatable/pagination";

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
      <Header table={table} />
      <Frame table={table} />
      <Pagination table={table} />
    </div>
  );
}
