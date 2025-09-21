"use client";
import { createRecords } from "@/app/(dashboard)/actions/records";
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
import { createInsertSchema } from "drizzle-zod";
import {
  ArrowRightIcon,
  DownloadIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react";
import { useRef } from "react";
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

  const walletM = useMutation({
    mutationFn: async (data: z.infer<typeof fileSchema>) => {
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

        if (!resultData.success) return { message: resultData.error };

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

      // if we have data, we can insert it
      if (recordResult.data) {
        const records = recordResult.data.map((d) => ({
          ...d,
          cellNumber: d.cellNumber || null,
          date: new Date(d.date),
          claimedAt: d.claimedAt ? new Date(d.claimedAt) : null,
          createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
          eWalletId: wallet.id,
        }));

        await createRecords(records);

        queryClient.invalidateQueries({ queryKey: ["e-wallets"] });
        queryClient.invalidateQueries({ queryKey: ["records"] });

        return { message: "Records has been restored successfully" };
      } else return { message: recordResult.error };
    },

    onSuccess: async (data) => toast(data.message),
  });

  // solely for removing texts in the file input when reseting the form
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => walletM.mutate(data))}>
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
                      console.log(e.target.files[0].type);
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
            disabled={walletM.isPending || !form.formState.isDirty}
            onClick={() => {
              form.reset();
              if (fileRef.current) fileRef.current.value = "";
            }}>
            <RefreshCwIcon />
            Reset
          </Button>
          <Button type="submit" disabled={walletM.isPending}>
            {walletM.isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <ArrowRightIcon />
            )}
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}
