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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eWalletsTable, eWalletTypeEnum } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInsertSchema } from "drizzle-zod";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createWallet } from "../actions";

export const formSchema = createInsertSchema(eWalletsTable, {
  name: (schema) =>
    schema
      .trim()
      .min(1, "E-wallet name is required")
      .max(20, "E-wallet name is too long"),
  cellNumber: (schema) => schema.min(11, "Invalid phone no.").or(z.literal("")),
});

type CreateWalletForm = z.infer<typeof formSchema>;

type CreateWalletFormProps = {
  userId: string;
};
export function CreateWalletForm({ userId }: CreateWalletFormProps) {
  const form = useForm<CreateWalletForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      cellNumber: "",
      type: "g-cash",
      userId: userId,
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
                    <SelectItem key={type} value={type} className="capitalize">
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
            variant="secondary"
            disabled={!form.formState.isDirty || form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <PlusIcon />
            )}
            Create
          </Button>
        </div>
      </form>
    </Form>
  );
}
