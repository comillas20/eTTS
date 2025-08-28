"use client";

import { deleteRecord } from "@/app/(dashboard)/actions/records";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { recordsTable } from "@/db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

type DeleteDialogProps = {
  record: typeof recordsTable.$inferSelect;
} & React.ComponentProps<typeof AlertDialog>;

export function DeleteDialog({ record, ...props }: DeleteDialogProps) {
  const queryClient = useQueryClient();
  const recordM = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });

      toast("The record has been deleted");
    },
  });

  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader className="gap-0.5">
          <AlertDialogTitle>Delete record</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this record?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="text-sm">
          <li className="flex justify-between">
            <span>Reference:</span> <span>{record.referenceNumber}</span>
          </li>
          <li className="flex justify-between">
            <span>Mobile number:</span> <span>{record.cellNumber}</span>
          </li>
          <li className="flex justify-between">
            <span>Amount:</span>{" "}
            <span>
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PHP",
                currencyDisplay: "code",
              }).format(record.amount)}
            </span>
          </li>
          <li className="flex justify-between">
            <span> Fee:</span>{" "}
            <span>
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PHP",
                currencyDisplay: "code",
              }).format(record.amount)}
            </span>
          </li>
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={recordM.isPending}>
            <XIcon />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white shadow-xs"
            onClick={() => recordM.mutate(record.id)}
            disabled={recordM.isPending}>
            <Trash2Icon />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
