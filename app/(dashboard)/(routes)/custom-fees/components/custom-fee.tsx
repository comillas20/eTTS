"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { eWalletsTable, feesTable } from "@/db/schema";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isFuture, set, startOfDay } from "date-fns";
import { createSelectSchema } from "drizzle-zod";
import {
  CalendarIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { mutateFeeRange } from "../action";

type WalletID = typeof eWalletsTable.$inferSelect.id;
type FeeRange = typeof feesTable.$inferSelect;

type CustomFeeProps = {
  walletId: WalletID;
  data?: FeeRange;
  includeLabel?: boolean;
  disabled?: boolean;
};
export function CustomFee({
  walletId,
  data,
  includeLabel,
  disabled,
}: CustomFeeProps) {
  const schema = createSelectSchema(feesTable, {
    id: (schema) => schema.optional(),
    amountStart: (schema) =>
      schema.min(1, "Amount (start) should be atleast 1"),
    amountEnd: (schema) => schema.min(1, "Amount (end) should be atleast 1"),
    fee: (schema) => schema.min(0, "Fee cannot be a negative number"),
  });

  type Form = z.infer<typeof schema>;

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: data ?? {
      amountStart: 0,
      amountEnd: 0,
      eWalletId: walletId,
      dateImplemented: startOfDay(Date.now()),
      fee: 0,
    },
    disabled: disabled || !!data,
  });

  const queryClient = useQueryClient();
  const feeMutation = useMutation({
    mutationFn: mutateFeeRange,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["fee-ranges"] });
      queryClient.invalidateQueries({ queryKey: ["records"] });

      if (result.success) {
        switch (result.op) {
          case "delete":
            toast.success("The fee range has been deleted");
            break;
          case "create":
            toast.success("The fee range has been added!");
            break;
          default:
            toast.error("An unexpected error occurred");
            break;
        }
        form.reset();
      } else {
        toast.error(result.error.toString());
      }
    },
  });

  function getFormSubActionButton() {
    const { isDirty } = form.formState;
    return !!data && !isDirty ? (
      <Button
        key={data.id.toString() + "_delete"}
        type="button"
        variant="destructive"
        className="w-24"
        onClick={() => feeMutation.mutate({ data, op: "delete" })}>
        <Trash2Icon />
        Delete
      </Button>
    ) : (
      <Button
        key={"_reset"}
        type="button"
        onClick={() => form.reset()}
        className="w-24"
        disabled={!isDirty}>
        <RefreshCwIcon />
        Reset
      </Button>
    );
  }

  return (
    <Form {...form}>
      <form
        className="space-y-2"
        onSubmit={form.handleSubmit((values) => {
          if (data)
            feeMutation.mutate({ data: { ...data, ...values }, op: "update" });
          else
            feeMutation.mutate({ data: { ...values, id: -1 }, op: "create" });
        })}>
        <div className="flex items-end gap-2">
          <FormField
            control={form.control}
            name="amountStart"
            render={({ field, fieldState }) => (
              <FormItem>
                {includeLabel && <FormLabel>Amount (start)</FormLabel>}
                <FormControl>
                  <Input
                    type="number"
                    className={cn({
                      "border-secondary": fieldState.isDirty && !!data,
                    })}
                    value={field.value === 0 ? "" : field.value}
                    onChange={({ target }) => {
                      const value = parseFloat(target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    disabled={field.disabled}
                    onFocus={(e) => e.target.select()}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amountEnd"
            render={({ field, fieldState }) => (
              <FormItem>
                {includeLabel && <FormLabel>Amount (end)</FormLabel>}
                <FormControl>
                  <Input
                    type="number"
                    className={cn({
                      "border-secondary": fieldState.isDirty && !!data,
                    })}
                    value={field.value === 0 ? "" : field.value}
                    onChange={({ target }) => {
                      const value = parseFloat(target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    disabled={field.disabled}
                    onFocus={(e) => e.target.select()}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fee"
            render={({ field, fieldState }) => (
              <FormItem>
                {includeLabel && <FormLabel>Fee</FormLabel>}
                <FormControl>
                  <Input
                    type="number"
                    className={cn({
                      "border-secondary": fieldState.isDirty && !!data,
                    })}
                    value={field.value === 0 ? "" : field.value}
                    onChange={({ target }) => {
                      const value = parseFloat(target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    disabled={field.disabled}
                    onFocus={(e) => e.target.select()}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateImplemented"
            render={({ field, fieldState, formState }) => (
              <FormItem className="flex flex-col">
                {includeLabel && (
                  <FormLabel
                    className={cn({
                      "text-primary": fieldState.isDirty,
                    })}>
                    Date Implemented
                  </FormLabel>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="pl-3 text-left font-normal"
                        disabled={formState.disabled}>
                        {format(field.value ?? new Date(), "PPP")}
                        <CalendarIcon className="ml-auto size-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" usePortal={false}>
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(date) => {
                        // Always put time on date when date exists
                        if (date && field.value) {
                          field.onChange(
                            set(date, {
                              hours: 0,
                              minutes: 0,
                            }),
                          );
                        } else field.onChange(date);
                      }}
                      disabled={(date) => isFuture(date)}
                      initialFocus
                      required
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
          <span className="flex gap-2">
            {!data && (
              <Button type="submit" variant="secondary" className="w-24">
                <PlusIcon />
                Create
              </Button>
            )}
            {getFormSubActionButton()}
          </span>
        </div>
        <div>
          {Object.values(form.formState.errors).map((error, i) => (
            <p key={i} className="text-destructive text-sm">
              {error.message}
            </p>
          ))}
        </div>
      </form>
    </Form>
  );
}
