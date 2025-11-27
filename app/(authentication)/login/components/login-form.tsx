"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  rememberMe: z.boolean(),
});

type LoginForm = z.infer<typeof formSchema>;

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const router = useRouter();

  const onSubmit = async (data: LoginForm) => {
    await signIn.email(data, {
      onSuccess: () => router.push("/"),
      onError: (err) => {
        form.setError("email", {
          message: err.error.message,
        });

        form.setError("password", {
          message: err.error.message,
        });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Password — atleast 8 characters"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="rememberMe"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Remember me</FormLabel>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2Icon className="animate-spin" />
              )}
              Login
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
