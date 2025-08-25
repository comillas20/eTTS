"use client";

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
import { eWalletsTable } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUploadIcon } from "lucide-react";
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

    onSuccess: (data: Response) => {
      queryClient.invalidateQueries({ queryKey: ["e-wallets"] });

      toast("Records has been restored successfully");
      console.log(data);
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
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={walletM.isPending}>
                Continue
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
