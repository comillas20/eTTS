"use client";

import { createRecord } from "@/app/(dashboard)/actions/records";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { eWalletsTable, recordsTable, transactionTypeEnum } from "@/db/schema";
import { cn, feeCalculator } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, set } from "date-fns";
import { createInsertSchema } from "drizzle-zod";
import {
  CalendarIcon,
  FileDownIcon,
  Loader2Icon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = createInsertSchema(recordsTable, {
  referenceNumber: (schema) => schema.min(1, "Invalid ref no."),
  cellNumber: (schema) => schema.min(11, "Invalid phone no.").nullable(),
  amount: (schema) => schema.min(1, "Amount cannot be below 1"),
  fee: (schema) => schema.min(0, "Fee cannot be negative"),
});

type RecordForm = z.infer<typeof formSchema>;
type RecordFormProps = {
  wallet: typeof eWalletsTable.$inferSelect;
};

export function RecordForm({ wallet }: RecordFormProps) {
  const form = useForm<RecordForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referenceNumber: "",
      cellNumber: "",
      amount: 0,
      fee: 0,
      type: "cash-in",
      date: new Date(),
      claimedAt: null,
      eWalletId: wallet.id,
      notes: "",
    },
  });

  const queryClient = useQueryClient();
  const records = useMutation({
    mutationFn: createRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });

      toast("A record has been created", {
        action: {
          label: "View",
          onClick: () => router.push(`/e-wallets/${wallet.url}`),
        },
      });
    },
  });

  const router = useRouter();

  const [inboxMessage, setInboxMessage] = useState<string>();
  const extractData = (text?: string) => {
    if (!text) return;
    const { date, amount, cellNumber, referenceNumber, type } =
      getDataFromText(text);

    if (date) form.setValue("claimedAt", date, { shouldDirty: true });
    if (amount) form.setValue("amount", amount, { shouldDirty: true });
    if (cellNumber)
      form.setValue("cellNumber", cellNumber, { shouldDirty: true });
    if (referenceNumber)
      form.setValue("referenceNumber", referenceNumber, { shouldDirty: true });
    if (type) form.setValue("type", type, { shouldDirty: true });

    form.trigger();
  };

  const type = form.watch("type");
  const amount = form.watch("amount");

  useEffect(() => {
    const T = setTimeout(() => {
      if (!form.getFieldState("fee").isDirty && amount > 0) {
        form.setValue("fee", feeCalculator(amount, type), {
          shouldValidate: true,
        });
      }
    }, 1000);

    return () => {
      clearTimeout(T);
    };
  }, [form, type, amount]);

  return (
    <div className="grid gap-y-16 lg:grid-cols-2 lg:gap-x-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => records.mutate(values))}
          className="space-y-4">
          <FormField
            control={form.control}
            name="referenceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference number</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Usually 13 digits"
                    {...field}
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
                <FormControl>
                  <Input
                    type="number"
                    placeholder="If ref no. is not available"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Amount"
                      {...field}
                      onChange={({ target }) => {
                        const value = parseFloat(target.value);
                        field.onChange(isNaN(value) ? "" : value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Fee"
                      {...field}
                      onChange={({ target }) => {
                        const value = parseFloat(target.value);
                        field.onChange(isNaN(value) ? "" : value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="capitalize">
                      {field.value ?? "Select type"}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {transactionTypeEnum.enumValues.map((type) => (
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
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Transaction date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="pl-3 text-left font-normal">
                          {format(field.value, "PPPp")}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={(date) => {
                          // Always put time on date when date exists
                          if (date && field.value) {
                            const hours = field.value.getHours();
                            const minutes = field.value.getMinutes();
                            field.onChange(
                              set(date, {
                                hours: hours,
                                minutes: minutes,
                              }),
                            );
                          } else field.onChange(date);
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("2024-11-30")
                        }
                        initialFocus
                        required
                      />
                      <div className="p-2">
                        <Input
                          type="time"
                          value={`${format(field.value ?? new Date(), "HH:mm")}`}
                          onChange={({ target }) => {
                            const [hours, minutes] = target.value.split(":");
                            if (field.value)
                              field.onChange(
                                set(field.value, {
                                  hours: parseInt(hours),
                                  minutes: parseInt(minutes),
                                }),
                              );
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="claimedAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Claimed at</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                          disabled={type === "cash-in"}>
                          {field.value ? (
                            format(field.value, "PPPp")
                          ) : (
                            <span>Unclaimed</span>
                          )}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={(date) => {
                          // Always put time on date when date exists
                          if (date && field.value) {
                            const hours = field.value.getHours();
                            const minutes = field.value.getMinutes();
                            field.onChange(
                              set(date, {
                                hours: hours,
                                minutes: minutes,
                              }),
                            );
                          } else field.onChange(date);
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("2024-11-30")
                        }
                        initialFocus
                      />
                      <div className="p-2">
                        <Input
                          type="time"
                          value={`${format(field.value ?? new Date(), "HH:mm")}`}
                          onChange={({ target }) => {
                            const [hours, minutes] = target.value.split(":");
                            if (field.value)
                              field.onChange(
                                set(field.value, {
                                  hours: parseInt(hours),
                                  minutes: parseInt(minutes),
                                }),
                              );
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction notes</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ""} />
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
      <div className="flex-1 space-y-4">
        <div className="flex min-h-[50%] flex-col space-y-2">
          <Label htmlFor="GCASH_FORM_INBOX">
            ...or extract data from a message in your inbox
          </Label>
          <Textarea
            id="GCASH_FORM_INBOX"
            className="flex-1"
            value={inboxMessage}
            onChange={({ target }) => setInboxMessage(target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => extractData(inboxMessage)}
            disabled={!inboxMessage}>
            <FileDownIcon />
            Extract
          </Button>
        </div>
      </div>
    </div>
  );
}

type GetDataFromTextReturnType = Partial<RecordForm>;

export function getDataFromText(text: string): GetDataFromTextReturnType {
  const type = text.match("sent");

  const datePattern = /\d+ [a-zA-Z]+ \d{4}\, \d{2}\:\d{2} (AM|PM)/;
  const date = text.match(datePattern);

  const amountPattern = /\b\d+\.\d{2}\b/;
  const amount = text.match(amountPattern);

  const cellNumberPattern = /(\+63|0)9\d{9}/; //PH phones starts at either +639 or just 09
  const cellNumber = text.match(cellNumberPattern);

  const referenceNumber = text.match(/\d{13}/);

  return {
    date: date ? new Date(date[0]) : undefined,
    amount: amount ? parseFloat(amount[0]) : undefined,
    type: type ? (type[0] === "cash-in" ? "cash-in" : "cash-out") : undefined,
    cellNumber: cellNumber ? cellNumber[0] : undefined,
    referenceNumber: referenceNumber ? referenceNumber[0] : undefined,
  };
}
