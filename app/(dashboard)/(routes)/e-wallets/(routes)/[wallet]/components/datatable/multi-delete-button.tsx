import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Table } from "@tanstack/table-core";
import { Trash2Icon } from "lucide-react";
import { deleteRecord, Record } from "../../actions";

type MultiDeleteButtonProps = {
  table: Table<Record>;
};

export function MultiDeleteButton({ table }: MultiDeleteButtonProps) {
  const selectedRows = table.getSelectedRowModel().rows;
  const recordIds = selectedRows.map((row) => row.original.id);

  const queryClient = useQueryClient();
  const records = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });

  if (selectedRows.length > 1)
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2Icon />
            <span className="hidden lg:inline">{`Delete (${recordIds.length})`}</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete (
              <strong>{selectedRows.length}</strong>) records. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => records.mutate(recordIds)}
              className={buttonVariants({ variant: "destructive" })}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  else
    return (
      <Button variant="destructive" onClick={() => records.mutate(recordIds)}>
        <Trash2Icon />
        <span className="hidden lg:inline">{`Delete (${recordIds.length})`}</span>
      </Button>
    );
}
