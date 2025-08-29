"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recordsTable } from "@/db/schema";
import { RecordUpdateForm } from "../record-update-form";

type UpdateDialogProps = {
  record: typeof recordsTable.$inferSelect;
} & React.ComponentProps<typeof Dialog>;

export function UpdateDialog({ record, ...props }: UpdateDialogProps) {
  return (
    <Dialog {...props} modal={false}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update record</DialogTitle>
          <DialogDescription>
            Update record details of this specific record
          </DialogDescription>
        </DialogHeader>
        <RecordUpdateForm
          record={record}
          onSave={() => {
            if (props.onOpenChange) props.onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
