"use client";

import { createRecords } from "@/app/(dashboard)/actions/records";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { eWalletsTable, recordsTable } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInsertSchema } from "drizzle-zod";
import {
  ArrowRightIcon,
  CloudUploadIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

type RecordRestoreProps = {
  wallet: typeof eWalletsTable.$inferSelect;
};

const fileSchema = z.object({
  file: z.instanceof(File),
  filePassword: z.string().optional(),
});

export function RecordRestore({ wallet }: RecordRestoreProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

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

      const res = await fetch(`/api/e-wallets/${wallet.url}`, {
        method: "POST",
        body: formData,
      });

      return await res.json();
    },

    onSuccess: async (data: Response) => {
      queryClient.invalidateQueries({ queryKey: ["e-wallets"] });

      const recordSchema = createInsertSchema(recordsTable, {
        date: z.string(),
        claimedAt: z.string().optional(),
      }).array();

      if (typeof data !== "object" || !("records" in data)) return;
      const parsedData = recordSchema.safeParse(data.records);
      if (parsedData.success) {
        const modifiedRecords = parsedData.data.map((d) => ({
          ...d,
          cellNumber: d.cellNumber || null,
          date: new Date(d.date),
          claimedAt: d.claimedAt ? new Date(d.claimedAt) : null,
        }));

        await createRecords(modifiedRecords);
        toast("Records has been restored successfully");
      } else {
        toast("Record restoration failed");
      }

      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon">
          <CloudUploadIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create or Restore records</DialogTitle>
          <DialogDescription>
            Create records in bulk or restore data from a backup file.
          </DialogDescription>
        </DialogHeader>
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
                          field.onChange(e.target.files[0]);
                        } else {
                          field.onChange(undefined);
                        }
                      }}
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
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={walletM.isPending}>
                  <XIcon />
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={walletM.isPending}>
                {walletM.isPending ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <ArrowRightIcon />
                )}
                Continue
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
