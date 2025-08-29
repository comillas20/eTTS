"use client";

import { updateRecord } from "@/app/(dashboard)/actions/records";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DialogClose } from "@/components/ui/dialog";
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
import { recordsTable, transactionTypeEnum } from "@/db/schema";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, set } from "date-fns";
import { createSelectSchema } from "drizzle-zod";
import { CalendarIcon, Loader2Icon, SaveIcon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = createSelectSchema(recordsTable, {
  id: z.number(),
  referenceNumber: (schema) => schema.min(1, "Invalid ref no."),
  cellNumber: (schema) => schema.min(11, "Invalid phone no.").or(z.literal("")),
  amount: (schema) => schema.min(1, "Amount cannot be below 1"),
  fee: (schema) => schema.min(0, "Fee cannot be negative"),
});

type RecordUpdateForm = z.infer<typeof formSchema>;

type RecordUpdateFormProps = {
  record: typeof recordsTable.$inferSelect;
  onSave?: () => void;
};
export function RecordUpdateForm({ record, onSave }: RecordUpdateFormProps) {
  const form = useForm<RecordUpdateForm>({
    resolver: zodResolver(formSchema),
    defaultValues: record,
  });

  const queryClient = useQueryClient();
  const records = useMutation({
    mutationFn: updateRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      if (onSave) onSave();

      toast("The record has been updated");
    },
  });

  const type = form.watch("type");

  return (
    <div className="space-y-16">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => records.mutate(values))}
          className="space-y-4">
          <FormField
            control={form.control}
            name="referenceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  className={cn({
                    "text-secondary":
                      form.getFieldState("referenceNumber").isDirty,
                  })}>
                  Reference number
                </FormLabel>
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
                <FormLabel
                  className={cn({
                    "text-secondary": form.getFieldState("cellNumber").isDirty,
                  })}>
                  Cell number
                </FormLabel>
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
                  <FormLabel
                    className={cn({
                      "text-secondary": form.getFieldState("amount").isDirty,
                    })}>
                    Amount
                  </FormLabel>
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
                  <FormLabel
                    className={cn({
                      "text-secondary": form.getFieldState("fee").isDirty,
                    })}>
                    Fee
                  </FormLabel>
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
                <FormLabel
                  className={cn({
                    "text-secondary": form.getFieldState("type").isDirty,
                  })}>
                  Type
                </FormLabel>
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
                  <FormLabel
                    className={cn({
                      "text-secondary": form.getFieldState("date").isDirty,
                    })}>
                    Transaction date
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="pl-3 text-left font-normal">
                          {format(field.value ?? new Date(), "PPPp")}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="z-[9999] w-auto p-0">
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
                  <FormLabel
                    className={cn({
                      "text-secondary": form.getFieldState("claimedAt").isDirty,
                    })}>
                    Claimed at
                  </FormLabel>
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
                <FormLabel
                  className={cn({
                    "text-secondary": form.getFieldState("notes").isDirty,
                  })}>
                  Transaction notes
                </FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end gap-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={form.formState.isSubmitting}>
                <XIcon />
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!form.formState.isDirty || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <SaveIcon />
              )}
              Update
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
