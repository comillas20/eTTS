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
import { Loader2Icon, RefreshCwIcon, SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DeleteWalletButton } from "./delete-wallet-button";

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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => walletM.mutate(values))}
        className="max-w-3xl space-y-4">
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
          <DeleteWalletButton id={initialData.id} />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
              onClick={() => form.reset()}>
              <RefreshCwIcon />
              Reset
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={!form.formState.isDirty || form.formState.isSubmitting}>
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
  );
}
