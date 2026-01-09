import { eWalletsTable } from "@/db/schema";
import "@tanstack/react-table";
import { Header, HeaderGroup, Row, RowData } from "@tanstack/react-table";

declare module "@tanstack/table-core" {
  interface TableMeta<TData extends RowData> {
    headerRowProps?: (row: HeaderGroup<TData>) => React.ComponentProps<"tr">;
    bodyRowProps?: (row: Row<TData>) => React.ComponentProps<"tr">;
    wallet?: typeof eWalletsTable.$inferSelect;
    updateRow?: (
      rowIndex: number,
      columnId: (string & {}) | keyof TData,
      value: any,
    ) => void;
    deleteRow?: (rowIndex: number) => void;
  }
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    columnHeaderProps?: (
      row: Header<TData, TValue>,
    ) => React.ComponentProps<"th">;
  }
}
