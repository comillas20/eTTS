"use client";

import { FileIcon, XIcon } from "lucide-react";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { eWalletsTable, recordsTable } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInsertSchema } from "drizzle-zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { Input } from "@/components/ui/input";
import { RecordInsertionTable } from "./record-insertion-table";
import { createRecords } from "@/app/(dashboard)/actions/records";

type RecordsProps = {
  wallet: typeof eWalletsTable.$inferSelect;
};
export function ImportForm({ wallet }: RecordsProps) {
  const queryClient = useQueryClient();

  const ACCEPTED_EXTENSIONS = ["application/pdf"];
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

      toast(parsedData.message);

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

  const file = form.watch("file");

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <>
      <Form {...form}>
        <form
          className="w-full max-w-lg"
          onSubmit={form.handleSubmit((data) => fileM.mutate(data))}>
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem
                className="border-input flex justify-center rounded-md border border-dashed px-6 py-12"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    field.onChange(e.dataTransfer.files[0]);
                  } else {
                    field.onChange(undefined);
                  }
                }}>
                <div>
                  <FileIcon
                    className="text-muted-foreground mx-auto h-12 w-12"
                    aria-hidden={true}
                  />
                  <div className="text-muted-foreground flex text-sm leading-6">
                    <p>Drag and drop or</p>
                    <FormLabel className="text-primary relative cursor-pointer rounded-sm pl-1 font-medium hover:underline hover:underline-offset-4">
                      choose file
                    </FormLabel>
                    <FormControl className="sr-only">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            field.onChange(e.target.files[0]);
                          } else {
                            field.onChange(undefined);
                          }
                        }}
                      />
                    </FormControl>
                    <p className="pl-1">to upload</p>
                  </div>
                  <FormMessage className="text-center" />
                </div>
              </FormItem>
            )}
          />

          {file && (
            <Card className="bg-muted relative mt-8 gap-4 p-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground absolute top-1 right-1 h-8 w-8"
                aria-label="Remove"
                onClick={() => form.reset()}>
                <XIcon className="size-5 shrink-0" aria-hidden={true} />
              </Button>

              <div className="flex space-x-2.5">
                <span className="bg-background ring-border flex size-8 shrink-0 items-center justify-center rounded-sm shadow-sm ring-1 ring-inset">
                  <FileIcon className="text-foreground size-4" />
                </span>
                <div className="mr-2 w-full">
                  <p className="text-foreground text-xs font-medium">
                    {file?.name}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {file && formatFileSize(file.size)}
                  </p>
                  <FormField
                    control={form.control}
                    name="filePassword"
                    render={({ field }) => (
                      <FormControl>
                        <Input
                          className="border-primary mt-2 -ml-1 border"
                          type="password"
                          placeholder="If file is encrypted, enter password here"
                          {...field}
                        />
                      </FormControl>
                    )}
                  />
                </div>
              </div>
            </Card>
          )}

          <div className="mt-8 flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              className="whitespace-nowrap"
              onClick={() => form.reset()}
              disabled={!file}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="whitespace-nowrap"
              disabled={fileM.isPending || !form.formState.isDirty}>
              Upload
            </Button>
          </div>
        </form>
      </Form>
      <RecordInsertionTable
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        records={records}
        setRecords={setRecords}
        onSave={walletM.mutate}
        wallet={wallet}
      />
    </>
  );
}
