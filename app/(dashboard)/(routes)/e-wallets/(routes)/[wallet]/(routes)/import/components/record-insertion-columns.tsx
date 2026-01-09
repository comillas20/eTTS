import { DatatableColumnFilterHeader } from "@/app/(dashboard)/components/datatable-column-filter-header";
import { DataTableColumnSortHeader } from "@/app/(dashboard)/components/datatable-column-sort-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { recordsTable } from "@/db/schema";
import { cn } from "@/lib/utils";
import { PopoverClose } from "@radix-ui/react-popover";
import { ColumnDef } from "@tanstack/react-table";
import { format, set } from "date-fns";
import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  BanknoteXIcon,
  BracketsIcon,
  CalendarIcon,
  NotebookPenIcon,
  PhoneIcon,
  PhoneMissedIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useState } from "react";

type Record = typeof recordsTable.$inferInsert;
const dateFormat = "MMM d, yyyy, h:mma";
const columns: ColumnDef<Record>[] = [
  {
    id: "reference",
    accessorKey: "referenceNumber",
    header: "Reference",
  },
  {
    id: "mobile number",
    accessorKey: "cellNumber",
    header: ({ column }) => (
      <DatatableColumnFilterHeader
        options={[
          {
            label: "All",
            icon: BracketsIcon,
            isSelected: !column.getIsFiltered(),
            onSelect() {
              column.setFilterValue(undefined);
            },
          },
          {
            label: "With mobile number",
            icon: PhoneIcon,
            isSelected:
              typeof column.getFilterValue() === "boolean" &&
              !!column.getFilterValue(),
            onSelect() {
              column.setFilterValue(true);
            },
          },
          {
            label: "Without mobile number",
            icon: PhoneMissedIcon,
            isSelected:
              typeof column.getFilterValue() === "boolean" &&
              !column.getFilterValue(),
            onSelect() {
              column.setFilterValue(false);
            },
          },
        ]}
        header={{ title: "Mobile number", icon: SlidersHorizontalIcon }}
      />
    ),
    cell: ({ row }) =>
      row.original.cellNumber ?? (
        <span className="text-muted-foreground italic">Not Available</span>
      ),
    filterFn: (row, columnId, filterValue) => {
      if (typeof filterValue === "boolean") {
        return filterValue
          ? row.original.cellNumber !== null
          : row.original.cellNumber === null;
      }

      return true;
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      const facets = Array.from(
        column.getFacetedUniqueValues().keys(),
      ) as string[];

      return (
        <DatatableColumnFilterHeader
          header={{ title: "Type", icon: SlidersHorizontalIcon }}
          options={[
            {
              label: "All",
              icon: BracketsIcon,
              isSelected: column.getFilterValue() === undefined,
              onSelect: () => column.setFilterValue(undefined),
            },
            ...facets.map((type) => ({
              label: type.charAt(0).toUpperCase() + type.slice(1),
              icon:
                type === "cash-in"
                  ? BanknoteArrowUpIcon
                  : BanknoteArrowDownIcon,
              isSelected: column.getFilterValue() === type,
              onSelect: () => column.setFilterValue(type),
            })),
          ]}
        />
      );
    },
    cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnSortHeader column={column} title="Amount" />
    ),
    cell: ({ row }) =>
      Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
        currencyDisplay: "code",
      }).format(row.original.amount),
  },
  {
    accessorKey: "fee",
    header: ({ column }) => (
      <DataTableColumnSortHeader column={column} title="Fee" />
    ),
    cell: ({ row, table }) => {
      const updateRow = table.options.meta?.updateRow;
      const initialValue = Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
        currencyDisplay: "code",
      }).format(row.original.fee);

      if (!updateRow) return initialValue;

      const [fee, setFee] = useState(row.original.fee);
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button className="h-6 text-xs">{initialValue}</Button>
          </PopoverTrigger>
          <PopoverContent usePortal={false} className="flex gap-2">
            <InputGroup>
              <InputGroupInput
                placeholder="Fee"
                value={fee}
                onChange={(e) => setFee(parseFloat(e.target.value))}
              />
              <InputGroupAddon align="inline-end">PHP</InputGroupAddon>
            </InputGroup>
            <PopoverClose asChild>
              <Button
                onClick={() => {
                  updateRow(row.index, "fee", fee);
                }}>
                Save
              </Button>
            </PopoverClose>
          </PopoverContent>
        </Popover>
      );
    },
  },
  {
    id: "transaction date",
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnSortHeader column={column} title="Transaction date" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {format(row.original.date, dateFormat)}
        {row.original.notes && <NotebookPenIcon className="size-4" />}
      </div>
    ),
  },
  {
    id: "claim status",
    accessorKey: "claimedAt",
    header: ({ column }) => {
      return (
        <DatatableColumnFilterHeader
          header={{ title: "Claim status", icon: SlidersHorizontalIcon }}
          options={[
            {
              label: "All",
              icon: BracketsIcon,
              isSelected: column.getFilterValue() === undefined,
              onSelect: () => column.setFilterValue(undefined),
            },
            {
              label: "Unclaimed",
              icon: BanknoteXIcon,
              isSelected: column.getFilterValue() === "unclaimed",
              onSelect: () => column.setFilterValue("unclaimed"),
            },
            {
              label: "Claimed",
              icon: BanknoteArrowDownIcon,
              isSelected: column.getFilterValue() === "claimed",
              onSelect: () => column.setFilterValue("claimed"),
            },
            {
              label: "Not Applicable",
              icon: XIcon,
              isSelected: column.getFilterValue() === "n/a",
              onSelect: () => column.setFilterValue("n/a"),
            },
          ]}
        />
      );
    },
    cell: ({ table, row }) => {
      const { type, claimedAt } = row.original;
      const updateRow = table.options.meta?.updateRow;

      if (type !== "cash-out")
        return (
          <span className="text-muted-foreground italic">Not Applicable</span>
        );

      if (!updateRow)
        return claimedAt ? (
          <Badge variant="outline">{format(claimedAt, dateFormat)}</Badge>
        ) : (
          <Badge variant="destructive">Unclaimed</Badge>
        );

      const [claimedDate, setClaimedDate] = useState<Date>();
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-6 pl-3 text-left text-xs font-normal",
                !claimedAt && "text-muted-foreground",
              )}>
              {claimedAt ? (
                format(claimedAt, dateFormat)
              ) : (
                <span>Unclaimed</span>
              )}
              <CalendarIcon className="ml-auto opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" usePortal={false}>
            <Calendar
              mode="single"
              selected={claimedDate ?? undefined}
              onSelect={(date) => {
                // Always put time on date when date exists
                if (date && claimedDate) {
                  const hours = claimedDate.getHours();
                  const minutes = claimedDate.getMinutes();
                  setClaimedDate(
                    set(date, {
                      hours: hours,
                      minutes: minutes,
                    }),
                  );
                } else setClaimedDate(date);
              }}
              disabled={(date) =>
                date > new Date() || date < new Date("2024-11-30")
              }
            />
            <div className="flex gap-2 p-2">
              <Input
                type="time"
                value={`${format(claimedDate ?? new Date(), "HH:mm")}`}
                onChange={({ target }) => {
                  const [hours, minutes] = target.value.split(":");
                  if (claimedDate)
                    setClaimedDate(
                      set(claimedDate, {
                        hours: parseInt(hours),
                        minutes: parseInt(minutes),
                      }),
                    );
                }}
              />
              <PopoverClose asChild>
                <Button
                  onClick={() => {
                    updateRow(row.index, "claimedAt", claimedDate);
                  }}>
                  Save
                </Button>
              </PopoverClose>
            </div>
          </PopoverContent>
        </Popover>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      if (typeof filterValue !== "string") return true;

      if (filterValue === "claimed") return row.original.claimedAt !== null;
      if (filterValue === "unclaimed")
        return (
          row.original.type === "cash-out" && row.original.claimedAt === null
        );
      if (filterValue === "n/a") return row.original.type !== "cash-out";

      return true;
    },
  },
  {
    id: "actions",
    cell: ({ table, row }) => (
      <Button
        variant="destructive"
        className="h-6 text-xs"
        onClick={() => {
          const deleteRow = table.options.meta?.deleteRow;
          if (deleteRow) deleteRow(row.index);
        }}>
        <Trash2Icon />
        Delete
      </Button>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
];

export { columns as recordInsertionColumns };
