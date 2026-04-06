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
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { InputPassword } from "../../components/input-password";

export const formSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type UpdatePasswordForm = z.infer<typeof formSchema>;
export function PasswordForm() {
  const form = useForm<UpdatePasswordForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passM = useMutation({
    mutationFn: async (values: UpdatePasswordForm) => {
      return await authClient.changePassword({
        newPassword: values.password,
        currentPassword: values.currentPassword,
        revokeOtherSessions: true,
      });
    },
    onSuccess: (response) => {
      const { data, error } = response;

      form.reset();
      if (error && error.message) toast.error(error.message);
      else toast("Password has been updated successfully");
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => passM.mutate(values))}
        className="max-w-3xl space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <InputPassword
                  inputProps={{
                    placeholder: "Enter your current password",
                    ...field,
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <InputPassword
                  inputProps={{
                    placeholder: "Enter your new password",
                    ...field,
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <InputPassword
                  inputProps={{
                    placeholder: "Confirm your new password",
                    ...field,
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button
            variant="secondary"
            type="submit"
            disabled={passM.isPending || !form.formState.isDirty}>
            {passM.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Update Password
          </Button>
        </div>
      </form>
    </Form>
  );
}
