"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { getEWalletsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlertCircleIcon, DownloadIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export function BackupCard() {
  const wallets = useQuery({
    ...getEWalletsQuery(),
    select: (data) => data.map((w) => ({ id: w.id, name: w.name, url: w.url })),
  });

  const schema = z.object({
    password: z
      .string()
      .min(8, "Backup encryption password must be atleast 8 characters"),
    walletUrl: z.string().min(1, "Select a wallet"),
  });

  type BackupFormData = z.infer<typeof schema>;

  const form = useForm<BackupFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      walletUrl: "",
      password: "",
    },
  });

  const onDownloadHandler = async (values: BackupFormData) => {
    const { walletUrl, password } = values;
    if (!walletUrl) return;
    if (password.length <= 0) return;

    try {
      const formbody = new FormData();
      formbody.append("password", password);

      const response = await fetch(`/api/e-wallets/${walletUrl}/backup`, {
        body: formbody,
        method: "POST",
      });

      if (!response || !response.ok)
        throw Error(
          "An unexpected error occurred during the backup generation.",
        );

      const blob = await response.blob();

      let filename = "backup.enc"; // Fallback name
      const contentDisposition = response.headers.get("Content-Disposition");

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onDownloadHandler)}>
        <Card className="border-l-primary gap-4 border-l-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="bg-primary/20 rounded-lg p-2">
                <DownloadIcon className="text-primary size-5" />
              </div>
              Backup
            </CardTitle>
            <CardAction>
              <FormField
                control={form.control}
                name="walletUrl"
                render={({ field, fieldState }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <div className="relative">
                      <SelectTrigger
                        className={cn({
                          "border-primary focus-visible:border-primary focus-visible:ring-primary/50":
                            !fieldState.error,
                          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50":
                            fieldState.error,
                        })}>
                        <SelectValue placeholder="Select a wallet" />
                      </SelectTrigger>
                      <span
                        className={cn({
                          "absolute top-0 right-0 -mt-1 -mr-1 flex size-3":
                            true,
                          hidden: !!field.value,
                          show: !field.value,
                        })}>
                        <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                        <span className="bg-primary relative inline-flex size-3 rounded-full" />
                      </span>
                    </div>

                    <SelectContent>
                      {wallets.data?.map((w) => (
                        <SelectItem key={w.id} value={w.url}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Create a backup of your current data. You can download and store
              it safely for future restoration.
            </p>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Backup encryption password</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="ml-3" />
                </FormItem>
              )}
            />

            <Alert className="border-warning bg-warning/20">
              <AlertCircleIcon className="text-warning" />
              <p className="text-sm">
                <strong>Warning:</strong> We do not store this password. If you
                lose it, your backup files can never be recovered.
              </p>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full px-4 py-3"
              size="lg"
              disabled={!form.formState.isDirty}>
              <DownloadIcon className="size-5" />
              Create Backup
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
