import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flexRender, Table as T } from "@tanstack/react-table";
import { Record } from "../../actions";

type FrameProps = {
  tableData: T<Record>;
};
export function Frame({ tableData }: FrameProps) {
  return (
    <div className="overflow-hidden rounded-lg border md:min-h-min">
      <Table>
        <TableHeader className="bg-primary">
          <TableRow className="text-primary-foreground hover:bg-inherit">
            <TableHead>Reference</TableHead>
            <TableHead>Mobile no.</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="w-32">Amount</TableHead>
            <TableHead className="w-32">Fee</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.getRowModel().rows?.length ? (
            tableData.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="data-[state=selected]:bg-primary data-[state=selected]:text-primary-foreground">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="capitalize">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={tableData.getAllColumns().length}
                className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
