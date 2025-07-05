"use client";

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
import { eWalletsTable } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInsertSchema } from "drizzle-zod";
import { PlusIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createWallet } from "../actions";

export const formSchema = createInsertSchema(eWalletsTable, {
  name: (schema) => schema.min(1, "E-wallet name is required"),
  cellNumber: (schema) => schema.min(11, "Invalid phone no.").or(z.literal("")),
});

type CreateWalletForm = z.infer<typeof formSchema>;

export function CreateWalletForm() {
  const form = useForm<CreateWalletForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      cellNumber: "",
    },
  });

  const router = useRouter();

  const queryClient = useQueryClient();
  const walletM = useMutation({
    mutationFn: createWallet,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["e-wallets"] });

      if (data instanceof Error) toast.error(data.message);
      else
        toast("Wallet has been created successfully", {
          action: {
            label: "View",
            onClick: () => router.push(`/e-wallets/${data.url}`),
          },
        });
    },
  });

  const onSubmit = async (values: CreateWalletForm) => {
    walletM.mutate(values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-[36rem] space-y-8">
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
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={form.formState.isSubmitting}>
            <XIcon />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isDirty || form.formState.isSubmitting}>
            <PlusIcon />
            Create
          </Button>
        </div>
      </form>
    </Form>
  );
}
