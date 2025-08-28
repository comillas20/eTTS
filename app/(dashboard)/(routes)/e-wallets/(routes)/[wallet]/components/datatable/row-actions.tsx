import { deleteRecord } from "@/app/(dashboard)/actions/records";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { recordsTable } from "@/db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Table } from "@tanstack/react-table";
import {
  MoreHorizontalIcon,
  NotebookIcon,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UpdateDialog } from "./update-dialog";

type Record = typeof recordsTable.$inferSelect;
type RowActionsProps = {
  record: Record;
  table: Table<Record>;
};

export function RowActions({ record, table }: RowActionsProps) {
  const wallet = table.options.meta?.wallet;

  const queryClient = useQueryClient();
  const recordM = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });

      toast("The record has been deleted");
    },
  });

  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuItem asChild>
              <DropdownMenuSubTrigger>
                <NotebookIcon /> View notes
              </DropdownMenuSubTrigger>
            </DropdownMenuItem>
            <DropdownMenuSubContent className="aspect-square min-w-72 p-4">
              <h4>Notes</h4>
              <pre className="text-wrap">
                {record.notes || "No notes available."}
              </pre>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {wallet && (
            <DropdownMenuItem onSelect={() => setOpenUpdateDialog(true)}>
              <PenIcon />
              Edit record
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => recordM.mutate(record)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <UpdateDialog
        open={openUpdateDialog}
        onOpenChange={setOpenUpdateDialog}
        record={record}
      />
    </>
  );
}
