"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { eWalletsTable } from "@/db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUploadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type RecordRestoreProps = {
  id: typeof eWalletsTable.$inferSelect.id;
};

export function RecordRestore({ id }: RecordRestoreProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const walletM = useMutation({
    mutationFn: async (id: number) => {
      return { id: id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["e-wallets"] });

      if (data instanceof Error) toast.error(data.message);
      else {
        toast("Records has been restored successfully");
        setOpen(false);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon">
          <CloudUploadIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create or Restore records</DialogTitle>
          <DialogDescription>
            Create records in bulk or restore data from a backup file.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Input type="file" />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => walletM.mutate(id)}
            disabled={walletM.isPending}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
