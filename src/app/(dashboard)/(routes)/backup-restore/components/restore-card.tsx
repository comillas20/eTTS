"use client";
import { restoreRecords } from "@/app/(dashboard)/actions/records";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordsTable } from "@/db/schema";
import { getEWalletsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInsertSchema } from "drizzle-zod";
import { AlertCircleIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { RecordInsertionTable } from "./record-insertion-table";
import { Input } from "@/components/ui/input";

export function RestoreCard() {
  const wallets = useQuery({
    ...getEWalletsQuery(),
    select: (data) => data.map((w) => ({ id: w.id, name: w.name, url: w.url })),
  });

  const ACCEPTED_EXTENSIONS = [".enc"];
  const schema = z.object({
    file: z.instanceof(File, { message: "No file found" }).refine((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return extension && ACCEPTED_EXTENSIONS.includes("." + extension);
    }, "Invalid file"),
    walletUrl: z.string().min(1, "Select a wallet"),
    password: z
      .string()
      .min(1, "Please input the backup password of this specific file"),
  });

  type RestoreFormData = z.infer<typeof schema>;

  const form = useForm<RestoreFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      walletUrl: "",
      password: "",
    },
  });

  // solely for removing texts in the file input when reseting the form
  const fileRef = useRef<HTMLInputElement>(null);

  const file = form.watch("file");
  const password = form.watch("password");
  const walletUrl = form.watch("walletUrl");

  type InsertRecord = Omit<typeof recordsTable.$inferInsert, "eWalletId">[];
  const [records, setRecords] = useState<InsertRecord>([]);
  const [openModal, setOpenModal] = useState(false);

  const onSubmit = async (data: RestoreFormData) => {
    const { file, password, walletUrl } = data;
    const formbody = new FormData();
    formbody.append("file", file);
    formbody.append("password", password);
    formbody.append("requestType", "preview");

    const response = await fetch(`/api/e-wallets/${walletUrl}/restore`, {
      body: formbody,
      method: "POST",
    });

    if (!response) {
      toast("Something went wrong in the server, please try again.");
      return;
    }

    if (!response.ok) {
      toast.error(response.text);
      return;
    }

    const recordSchema = createInsertSchema(recordsTable, {
      date: z.string(),
      claimedAt: z.string().nullable(),
      createdAt: z.string().optional(),
    })
      .omit({ eWalletId: true })
      .array();

    const responseSchema = z.object({
      data: recordSchema,
    });

    const responseJson = await response.json();

    const parsedResponse = responseSchema.safeParse(responseJson);

    if (!parsedResponse.success) {
      toast("Invalid server response");
      return;
    }

    const finalParsedRecords = parsedResponse.data.data.map((record) => ({
      ...record,
      date: new Date(record.date),
      claimedAt: record.claimedAt ? new Date(record.claimedAt) : null,
      createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
    }));

    setRecords(finalParsedRecords);
    setOpenModal(true);
  };

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data: RestoreFormData) => {
      const { file, password, walletUrl } = data;
      const formbody = new FormData();
      formbody.append("file", file);
      formbody.append("password", password);
      formbody.append("requestType", "save");

      const response = await fetch(`/api/e-wallets/${walletUrl}/restore`, {
        body: formbody,
        method: "POST",
      });

      if (!response) {
        return {
          message: "Something went wrong in the server, please try again.",
        };
      }

      if (!response.ok) {
        return {
          message: toast.error(response.text),
        };
      }

      const responseJson = await response.json();
      const responseSchema = z.object({
        data: z.number(),
      });
      const parsedResponse = responseSchema.safeParse(responseJson);

      let message = "";
      if (parsedResponse.success)
        message =
          parsedResponse.data.data + " records has been restored successfully";
      else message = "Records has been restored successfully";

      queryClient.invalidateQueries({ queryKey: ["e-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["records"] });

      return { message: message };
    },

    onSuccess: async (data) => toast(data.message),
  });

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="border-l-secondary border-l-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-bold">
                <div className="bg-secondary/20 rounded-lg p-2">
                  <UploadIcon className="text-secondary size-5" />
                </div>
                Restore
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
                            "border-secondary focus-visible:border-secondary focus-visible:ring-secondary/50":
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
                            hidden: field.value.length > 0,
                            show: field.value.length == 0,
                          })}>
                          <span className="bg-secondary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                          <span className="bg-secondary relative inline-flex size-3 rounded-full" />
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
              <div className="text-muted-foreground mb-6">
                Restore your data from a previously created backup file. This
                will replace your current data.
              </div>

              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Backup file</FormLabel>
                    <FormControl>
                      <InputGroup className="h-12">
                        <InputGroupInput
                          type="file"
                          className="my-2.5"
                          accept={ACCEPTED_EXTENSIONS.join(",")}
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              field.onChange(e.target.files[0]);
                            } else {
                              field.onChange(undefined);
                            }
                          }}
                          ref={fileRef}
                        />
                        {fileRef.current && fileRef.current.value && (
                          <InputGroupAddon align="inline-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="border-0"
                              onClick={() => {
                                if (fileRef.current) fileRef.current.value = "";
                                if (field.value) form.resetField("file");
                              }}>
                              <XIcon className="text-destructive" />
                            </Button>
                          </InputGroupAddon>
                        )}
                      </InputGroup>
                    </FormControl>
                    <FormMessage className="ml-3" />
                  </FormItem>
                )}
              />

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
                  <strong>Warning:</strong> This action will overwrite the{" "}
                  <strong>fee, claimed date, and notes</strong> of existing
                  records with same reference
                </p>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full px-4 py-3"
                size="lg"
                variant="secondary"
                disabled={mutation.isPending || !form.formState.isDirty}>
                {mutation.isPending ? (
                  <Loader2Icon className="size-5 animate-spin" />
                ) : (
                  <UploadIcon className="size-5" />
                )}
                Restore from Backup
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
      {wallets &&
        wallets.data &&
        wallets.data.length > 0 &&
        walletUrl != "" && (
          <RecordInsertionTable
            records={records}
            setRecord={(data, index) => {
              const r = records;
              r[index] = data;
              setRecords(r);
            }}
            isModalOpen={openModal}
            setIsModalOpen={setOpenModal}
            wallet={wallets.data?.find((w) => w.url === walletUrl)!}
            onSave={() => mutation.mutate({ file, password, walletUrl })}
          />
        )}
    </>
  );
}

async function parseFile(file: File) {
  const recordSchema = createInsertSchema(recordsTable, {
    date: z.string(),
    claimedAt: z.string().nullable(),
    createdAt: z.string().optional(),
  })
    .omit({ eWalletId: true })
    .array();

  if (file.type !== "application/json")
    return { data: null, error: "Invalid file" };

  const blobString = await file.text();

  try {
    const parsedJSON = JSON.parse(blobString);
    const parsedRecords = recordSchema.safeParse(parsedJSON);

    if (parsedRecords.error) return { data: null, error: "Invalid JSON file" };
    else
      return {
        data: parsedRecords.data,
        error: null,
      };
  } catch (error) {
    if (error instanceof SyntaxError)
      return { data: null, error: "Invalid JSON file" };
    else return { data: null, error: "Something went wrong" };
  }
}
