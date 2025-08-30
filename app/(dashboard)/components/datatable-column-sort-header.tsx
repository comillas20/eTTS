import { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type DataTableColumnSortHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function DataTableColumnSortHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnSortHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const sortStatus = column.getIsSorted();
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent -ml-3 h-8">
            <span>{title}</span>
            {sortStatus === "desc" ? (
              <ArrowDownIcon />
            ) : sortStatus === "asc" ? (
              <ArrowUpIcon />
            ) : (
              <ChevronsUpDownIcon />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() =>
              sortStatus ? column.clearSorting() : column.toggleSorting(false)
            }>
            <ArrowUpIcon className="text-muted-foreground/70 h-3.5 w-3.5" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              sortStatus ? column.clearSorting() : column.toggleSorting(false)
            }>
            <ArrowDownIcon className="text-muted-foreground/70 h-3.5 w-3.5" />
            Desc
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
