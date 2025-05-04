import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { deleteRecord, Record } from "../../actions";
import { Table } from "@tanstack/table-core";

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
  return (
    <Button variant="destructive" onClick={onDelete}>
      <Trash2Icon />
      <span className="hidden lg:inline">{`Delete (${recordIds.length})`}</span>
    </Button>
  );
}
