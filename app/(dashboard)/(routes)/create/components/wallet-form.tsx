"use client";

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
import { createInsertSchema } from "drizzle-zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createWallet } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = createInsertSchema(eWalletsTable, {
  name: (schema) => schema.min(1, "E-wallet name is required"),
  cellNumber: (schema) => schema.min(11, "Invalid phone no.").or(z.literal("")),
});

type WalletForm = z.infer<typeof formSchema>;

type WalletFormProps = {
  wallet?: typeof eWalletsTable.$inferSelect;
};
export function WalletForm({ wallet }: WalletFormProps) {
  const form = useForm<WalletForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: wallet ? wallet.name : "",
      url: wallet ? wallet.url : "",
      cellNumber: wallet ? wallet.cellNumber : "",
    },
  });

  const router = useRouter();

  const onSubmit = async (values: WalletForm) => {
    const result = await createWallet(values);
    if (result instanceof Error) {
      toast.error(result.message);
    } else {
      toast("A record has been created", {
        action: { label: "View", onClick: () => router.push(`/${result.url}`) },
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-96 space-y-4">
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
      </form>
    </Form>
  );
}
