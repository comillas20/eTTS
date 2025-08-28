"use client";

import { updateWallet } from "@/app/(dashboard)/actions/wallets";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eWalletsTable, eWalletTypeEnum } from "@/db/schema";
import { isCellnumber } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSelectSchema } from "drizzle-zod";
import { Loader2Icon, PencilIcon, SaveIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = createSelectSchema(eWalletsTable, {
  name: (schema) =>
    schema
      .trim()
      .min(1, "E-wallet name is required")
      .max(20, "E-wallet name is too long"),
  cellNumber: (schema) =>
    schema.trim().refine((check) => isCellnumber(check), "Invalid cell number"),
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
          <form
            onSubmit={form.handleSubmit((values) => walletM.mutate(values))}
            className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-wallet name</FormLabel>
                  <FormDescription>
                    Your custom e-wallet name (e.g. My G-cash)
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of e-wallet</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eWalletTypeEnum.enumValues.map((type) => (
                        <SelectItem
                          key={type}
                          value={type}
                          className="capitalize">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {form.formState.isSubmitting ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <SaveIcon />
                )}
                Update
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
