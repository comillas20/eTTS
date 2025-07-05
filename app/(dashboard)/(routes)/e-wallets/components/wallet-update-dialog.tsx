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
import { createUpdateSchema } from "drizzle-zod";
import { PencilIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateWallet } from "../actions";

const formSchema = createUpdateSchema(eWalletsTable, {
  name: (schema) => schema.trim().min(1, "E-wallet name is required"),
  cellNumber: (schema) => schema.trim().min(11, "Invalid phone no."),
});

type UpdateWalletForm = z.infer<typeof formSchema>;

type WalletUpdateDialogProps = {
  initialData: typeof eWalletsTable.$inferSelect;
};

export function WalletUpdateDialog({ initialData }: WalletUpdateDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<UpdateWalletForm>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const queryClient = useQueryClient();
  const walletM = useMutation({
    mutationFn: updateWallet,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["e-wallets"] });

      if (data instanceof Error) toast.error(data.message);
      else {
        toast("Wallet has been updated successfully");
        setOpen(false);
      }
    },
  });

  const onSubmit = async (values: UpdateWalletForm) => {
    walletM.mutate({ id: initialData.id, ...values });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon">
          <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update e-Wallet</DialogTitle>
          <DialogDescription>
            Update the details of this e-Wallet
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-wallet name</FormLabel>
                  <FormDescription>
                    The e-wallet name (e.g. G-cash, Paymaya, etc.)
                  </FormDescription>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={({ target }) => {
                        field.onChange(target.value);
                        form.setValue(
                          "url",
                          target.value.replaceAll(" ", "-").toLowerCase(),
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cellNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cell number</FormLabel>
                  <FormDescription>
                    The cell number you use to transact
                  </FormDescription>
                  <FormControl>
                    <Input {...field} />
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
                  disabled={form.formState.isSubmitting}>
                  <XIcon />
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  !form.formState.isDirty || form.formState.isSubmitting
                }>
                <PencilIcon /> Update
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
