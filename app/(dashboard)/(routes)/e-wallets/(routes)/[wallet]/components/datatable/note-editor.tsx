"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { recordsTable } from "@/db/schema";
import { PopoverArrow } from "@radix-ui/react-popover";
import { NotebookPenIcon, PenIcon, SaveIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { updateNotes } from "../../actions";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type NoteEditorProps = {
  record: typeof recordsTable.$inferSelect;
};

export function NoteEditor({ record }: NoteEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(record.notes);

  const queryClient = useQueryClient();
  const records = useMutation({
    mutationFn: updateNotes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });
  return (
    <Popover>
      <PopoverTrigger className="data-[state=open]:bg-primary data-[state=open]:text-primary-foreground rounded-md border p-1">
        <NotebookPenIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="bg-popover text-popover-foreground flex aspect-square w-auto min-w-72 flex-col space-y-2">
        <PopoverArrow />
        <h4 className="flex items-center gap-2">
          <NotebookPenIcon />
          Notes
        </h4>
        {isEditing ? (
          <Textarea
            value={notes ?? ""}
            onChange={({ target }) => setNotes(target.value)}
            className="flex-1"
          />
        ) : (
          <pre className="flex-1 text-wrap">{record.notes}</pre>
        )}
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setNotes(record.notes);
                setIsEditing(false);
              }}>
              <XIcon />
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => records.mutate({ id: record.id, notes })}>
              <SaveIcon />
              Save
            </Button>
          </div>
        ) : (
          <div className="flex">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <PenIcon />
              Edit
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
