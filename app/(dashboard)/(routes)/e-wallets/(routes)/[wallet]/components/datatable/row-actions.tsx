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
import { Table } from "@tanstack/react-table";
import {
  MoreHorizontalIcon,
  NotebookIcon,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteRecord, Record } from "../../actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type RowActionsProps = {
  record: Record;
  table: Table<Record>;
};

export function RowActions({ record, table }: RowActionsProps) {
  const router = useRouter();
  const wallet = table.options.meta?.wallet;

  const queryClient = useQueryClient();
  const recordM = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });

      toast("The record has been deleted");
    },
  });

  return (
    <DropdownMenu>
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
          <DropdownMenuItem
            onSelect={() =>
              router.push(`/e-wallets/${wallet.url}/${record.id}/update`)
            }>
            <PenIcon />
            Edit record
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => recordM.mutate(record.id)}>
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
