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
  table: T<Record>;
};
export function Frame({ table }: FrameProps) {
  return (
    <div className="overflow-hidden rounded-lg border md:min-h-min">
      <Table>
        <TableHeader className="bg-primary">
          {table.getHeaderGroups().map((headerGroup) => {
            const meta = table.options.meta?.headerRowProps;
            let props: React.ComponentProps<"tr"> | undefined;
            if (meta) props = meta(headerGroup);
            return (
              <TableRow
                key={headerGroup.id}
                className="text-primary-foreground hover:bg-inherit"
                {...props}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta?.columnHeaderProps;
                  let props: React.ComponentProps<"th"> | undefined;
                  if (meta) props = meta(header);
                  return (
                    <TableHead key={header.id} {...props}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            );
          })}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const meta = table.options.meta?.bodyRowProps;
              let props: React.ComponentProps<"tr"> | undefined;
              if (meta) props = meta(row);
              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="data-[state=selected]:bg-primary/50"
                  {...props}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="capitalize">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
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
