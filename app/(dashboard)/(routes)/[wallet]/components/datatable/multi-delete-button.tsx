import { Button, buttonVariants } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { deleteRecord, Record } from "../../actions";
import { Table } from "@tanstack/table-core";
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

type MultiDeleteButtonProps = {
  table: Table<Record>;
};

export function MultiDeleteButton({ table }: MultiDeleteButtonProps) {
  const selectedRows = table.getSelectedRowModel().rows;
  const recordIds = selectedRows.map((row) => row.original.id);

  const onDelete = async () => {
    await deleteRecord(recordIds);

    // unselect all rows every time deletion succeed
    table.setRowSelection({});

    // toast here
  };

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
              onClick={onDelete}
              className={buttonVariants({ variant: "destructive" })}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  else
    return (
      <Button variant="destructive" onClick={onDelete}>
        <Trash2Icon />
        <span className="hidden lg:inline">{`Delete (${recordIds.length})`}</span>
      </Button>
    );
}
