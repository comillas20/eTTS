"use client";
import { createRecords } from "@/app/(dashboard)/actions/records";
import { DatatableColumnFilterHeader } from "@/app/(dashboard)/components/datatable-column-filter-header";
import { DataTableColumnSortHeader } from "@/app/(dashboard)/components/datatable-column-sort-header";
import { DatatableFrame } from "@/app/(dashboard)/components/datatable-frame";
import { DatatablePagination } from "@/app/(dashboard)/components/datatable-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { eWalletsTable, recordsTable } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ColumnDef,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { createInsertSchema } from "drizzle-zod";
import {
  ArrowRightIcon,
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  BanknoteXIcon,
  BracketsIcon,
  DownloadIcon,
  Loader2Icon,
  NotebookPenIcon,
  PhoneIcon,
  PhoneMissedIcon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

type RecordsProps = {
  wallet: typeof eWalletsTable.$inferSelect;
};

export function Records({ wallet }: RecordsProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        id="records"
        title="Backup & Restore"
        description="Download all records or restore saved records from a file."
      />
      <div className="space-y-4">
        <h4 className="leading-none">Back-up records</h4>
        <RecordBackUpDownload wallet={wallet} />
      </div>
      <div className="relative">
        <Separator className="mx-auto data-[orientation=horizontal]:w-96" />
        <span className="bg-background absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] p-2">
          or
        </span>
      </div>
      <div className="space-y-6">
        <h4 className="leading-none">Restore records</h4>
        <RecordRestore wallet={wallet} />
      </div>
    </div>
  );
}

function RecordBackUpDownload({ wallet }: RecordsProps) {
  const onDownloadHandler = async () => {
    const response = await fetch(`/api/e-wallets/${wallet.url}`, {
      method: "GET",
    });

    if (!response || !response.ok) return;

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "backup.json";
    document.body.appendChild(a);
    a.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  return (
    <Button onClick={() => onDownloadHandler()}>
      <DownloadIcon />
      Download all records
    </Button>
  );
}

function RecordRestore({ wallet }: RecordsProps) {
  const queryClient = useQueryClient();

  const ACCEPTED_EXTENSIONS = ["application/pdf", "application/json"];
  const fileSchema = z.object({
    file: z
      .instanceof(File, { message: "No file found" })
      .refine(
        (file) => ACCEPTED_EXTENSIONS.includes(file.type),
        "Invalid file",
      ),
    filePassword: z.string().optional(),
  });

  const recordSchema = createInsertSchema(recordsTable, {
    date: z.string(),
    claimedAt: z.string().nullable(),
    createdAt: z.string().optional(),
    eWalletId: (schema) => schema.optional(),
  }).array();

  type RecordSchema = z.infer<typeof recordSchema>;

  const form = useForm({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      filePassword: "",
    },
  });

  type InsertRecord = typeof recordsTable.$inferInsert;
  async function parseFile(data: z.infer<typeof fileSchema>): Promise<{
    data: InsertRecord[] | null;
    message: string;
  }> {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("password", data.filePassword || "");

    type RecordResult =
      | {
          data: RecordSchema;
          error: null;
        }
      | {
          data: null;
          error: string;
        };

    let recordResult: RecordResult;

    // If the file is JSON, we can just read it directly on the client
    if (data.file.type === "application/json") {
      const blobString = await data.file.text();

      try {
        const parsedJSON = JSON.parse(blobString);
        const parsedRecords = recordSchema.safeParse(parsedJSON);

        if (parsedRecords.error)
          recordResult = { data: null, error: "Invalid JSON file" };
        else
          recordResult = {
            data: parsedRecords.data,
            error: null,
          };
      } catch (error) {
        if (error instanceof SyntaxError)
          recordResult = { data: null, error: "Invalid JSON file" };
        else recordResult = { data: null, error: "Something went wrong" };
      }
    }
    // otherwise we send it to the server for processing
    else {
      const result = await fetch(`/api/e-wallets/${wallet.url}`, {
        method: "POST",
        body: formData,
      });

      const resultData:
        | { success: false; error: string }
        | { success: true; records: unknown } = await result.json();

      if (!resultData.success) return { data: null, message: resultData.error };

      const parsedData = recordSchema.safeParse(resultData.records);
      if (parsedData.success) {
        recordResult = {
          data: parsedData.data,
          error: null,
        };
      } else
        recordResult = {
          data: null,
          error: "Something went wrong, please refresh and try again.",
        };
    }

    if (recordResult.data) {
      const records = recordResult.data.map((d) => ({
        ...d,
        cellNumber: d.cellNumber || null,
        date: new Date(d.date),
        claimedAt: d.claimedAt ? new Date(d.claimedAt) : null,
        createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
        eWalletId: wallet.id,
      }));

      return {
        data: records,
        message: "Records has been restored successfully",
      };
    } else return { data: null, message: recordResult.error };
  }

  const [records, setRecords] = useState<InsertRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fileM = useMutation({
    mutationFn: async (data: z.infer<typeof fileSchema>) => {
      const parsedData = await parseFile(data);

      if (!parsedData.data || parsedData.data.length < 1) return;

      setRecords(parsedData.data);
      setIsModalOpen(true);
    },
  });

  const walletM = useMutation({
    mutationFn: async () => {
      const result = await createRecords(records, wallet.id);

      if (!result.success)
        return { message: "Something went wrong, please try again." };

      queryClient.invalidateQueries({ queryKey: ["e-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["records"] });

      return { message: "Records has been restored successfully" };
    },

    onSuccess: async (data) => toast(data.message),
  });

  // solely for removing texts in the file input when reseting the form
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((data) => fileM.mutate(data))}>
          <FormField
            name="file"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Upload file</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        field.onChange(e.target.files[0]);
                      } else {
                        field.onChange(undefined);
                      }
                    }}
                    accept=".json,.pdf"
                    ref={fileRef}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="filePassword"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>File password</FormLabel>
                <FormDescription>
                  If your file has a password, enter them, otherwise leave it
                  blank
                </FormDescription>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                    placeholder="Enter password if any"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={fileM.isPending || !form.formState.isDirty}
              onClick={() => {
                form.reset();
                if (fileRef.current) fileRef.current.value = "";
              }}>
              <RefreshCwIcon />
              Reset
            </Button>
            <Button
              type="submit"
              disabled={fileM.isPending || walletM.isPending}>
              {fileM.isPending || walletM.isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <ArrowRightIcon />
              )}
              Continue
            </Button>
          </div>
        </form>
      </Form>
      <RecordInsertionTable
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        records={records}
        setRecord={() => {}}
        onSave={walletM.mutate}
        wallet={wallet}
      />
    </>
  );
}

type InsertRecord = typeof recordsTable.$inferInsert;
type RecordInsertionTableProps = {
  records: InsertRecord[];
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setRecord: (updatedRecord: InsertRecord, index: number) => void;
  onSave: () => void;
} & Pick<RecordsProps, "wallet">;

function RecordInsertionTable({
  records,
  isModalOpen,
  setIsModalOpen,
  onSave,
  wallet,
}: RecordInsertionTableProps) {
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
      cell: ({ row }) =>
        Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "PHP",
          currencyDisplay: "code",
        }).format(row.original.fee),
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
      cell: ({ row }) => {
        if (row.original.type !== "cash-out")
          return (
            <span className="text-muted-foreground italic">Not Applicable</span>
          );

        return row.original.claimedAt ? (
          <Badge variant="outline">
            {format(row.original.claimedAt, dateFormat)}
          </Badge>
        ) : (
          <Badge variant="destructive">Unclaimed</Badge>
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
  ];

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
    },
    autoResetPageIndex: false,
  });

  return (
    <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <AlertDialogContent className="sm:max-w-[calc(100%-2rem)]">
        <AlertDialogHeader>
          <AlertDialogTitle>Record Restoration</AlertDialogTitle>
          <AlertDialogDescription>
            The records that will be restored to{" "}
            <strong className="text-secondary">{wallet.name}</strong> wallet
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4">
          <DatatableFrame table={table} />
          <DatatablePagination table={table} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onSave}>Save</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
