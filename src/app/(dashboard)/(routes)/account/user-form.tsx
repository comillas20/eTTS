"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { user } from "@/db/schema";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createInsertSchema } from "drizzle-zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export const formSchema = createInsertSchema(user, {
  name: (schema) => schema.trim().min(1, "Name is required"),
  email: (schema) => schema.email("Invalid email address"),
});

type UpdateUserForm = z.infer<typeof formSchema>;
type UserFormProps = {
  initialData: typeof user.$inferInsert;
};
export function UserForm({ initialData }: UserFormProps) {
  const form = useForm<UpdateUserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData.id,
      name: initialData.name,
      email: initialData.email,
    },
  });

  const userM = useMutation({
    mutationFn: async (values: UpdateUserForm) => {
      let nameRes = null,
        emailRes = null;
      if (values.name !== initialData.name) {
        nameRes = await authClient.updateUser({
          name: values.name,
        });
      }
      if (values.email !== initialData.email) {
        emailRes = await authClient.changeEmail({
          newEmail: values.email,
        });
      }
      return {
        nameRes,
        emailRes,
      };
    },
    onSuccess: (data) => {
      if (data.nameRes instanceof Error) toast.error(data.nameRes.message);
      else if (data.nameRes?.data?.status)
        toast("Name has been updated successfully");

      if (data.emailRes instanceof Error) toast.error(data.emailRes.message);
      else if (data.emailRes?.data?.status)
        toast("Email has been updated successfully");
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => userM.mutate(values))}
        className="max-w-3xl space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={userM.isPending || !form.formState.isDirty}>
            {userM.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Update User
          </Button>
        </div>
      </form>
    </Form>
  );
}
