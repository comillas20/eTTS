import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";
import {
  CalendarIcon,
  ChevronDownIcon,
  ColumnsIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Record } from "../../actions";
import { MultiDeleteButton } from "./multi-delete-button";

type HeaderProps = {
  table: Table<Record>;
};
export function Header({ table }: HeaderProps) {
  const path = usePathname();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Input
          className="w-80"
          placeholder="Search"
          value={(table.getState().globalFilter as string) || ""}
          onChange={({ target }) =>
            table.setState((prev) => ({
              ...prev,
              globalFilter: target.value,
            }))
          }
        />
        <Button size="icon" variant="outline">
          <CalendarIcon />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {table.getSelectedRowModel().rows.length > 0 && (
          <MultiDeleteButton table={table} />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ColumnsIcon />
              <span className="hidden lg:inline">Customize Columns</span>
              <span className="lg:hidden">Columns</span>
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide(),
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }>
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href={path + `/create`}
          className={buttonVariants({ variant: "secondary" })}>
          <PlusIcon />
          <span className="hidden lg:inline">Add Record</span>
        </Link>
      </div>
    </div>
  );
}
