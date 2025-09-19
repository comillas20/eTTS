"use client";

import {
  doesWalletAlreadyExist,
  updateWallet,
} from "@/app/(dashboard)/actions/wallets";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eWalletsTable, eWalletTypeEnum } from "@/db/schema";
import { cn, isCellnumber } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSelectSchema } from "drizzle-zod";
import { Loader2Icon, SaveIcon, XIcon } from "lucide-react";
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
  defaultRate: (schema) =>
    schema.min(0.01, "Rate must be atleast 0.01 or greater"),
}).refine(async (check) => !(await doesWalletAlreadyExist(check)), {
  message: "You already have a wallet with this name",
  path: ["name"],
});

type UpdateWalletForm = z.infer<typeof formSchema>;

type UpdateWalletProps = {
  initialData: typeof eWalletsTable.$inferSelect;
};

export function UpdateWallet({ initialData }: UpdateWalletProps) {
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
      }
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        id="update-wallet"
        title="Update e-Wallet"
        description="Update the details of this e-Wallet"
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => walletM.mutate(values))}
          className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel
                  className={cn({
                    "text-primary": fieldState.isDirty,
                  })}>
                  E-wallet name
                </FormLabel>
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
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel
                    className={cn({
                      "text-primary": fieldState.isDirty,
                    })}>
                    Type of e-wallet
                  </FormLabel>
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
              name="defaultRate"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel
                    className={cn({
                      "text-primary": fieldState.isDirty,
                    })}>
                    Default rate (in decimals)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.02"
                      {...field}
                      onChange={({ target }) => {
                        const value = parseFloat(target.value);
                        field.onChange(isNaN(value) ? "" : value);
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="cellNumber"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel
                  className={cn({
                    "text-primary": fieldState.isDirty,
                  })}>
                  Cell number
                </FormLabel>
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
          <div className="flex justify-between">
            <DeleteWallet id={initialData.id} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={form.formState.isSubmitting}>
                <XIcon />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
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
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

import { deleteWallet } from "@/app/(dashboard)/actions/wallets";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowRightIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

type DeleteWalletProps = {
  id: typeof eWalletsTable.$inferSelect.id;
};

function DeleteWallet({ id }: DeleteWalletProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const walletM = useMutation({
    mutationFn: deleteWallet,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["e-wallets"] });

      if (data instanceof Error) toast.error(data.message);
      else {
        toast("Wallet has been deleted successfully");
        setOpen(false);
      }
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2Icon />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will
            <strong> permanently </strong>
            delete the wallet and all of its records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={walletM.isPending}>
            <XIcon />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => walletM.mutate(id)}
            disabled={walletM.isPending}>
            {walletM.isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <ArrowRightIcon />
            )}
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
