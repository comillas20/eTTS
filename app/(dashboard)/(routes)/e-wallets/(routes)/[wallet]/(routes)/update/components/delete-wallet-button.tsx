"use client";

import { deleteWallet } from "@/app/(dashboard)/actions/wallets";
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
import { Button } from "@/components/ui/button";
import { eWalletsTable } from "@/db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, Loader2Icon, Trash2Icon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type DeleteWalletProps = {
  id: typeof eWalletsTable.$inferSelect.id;
};

export function DeleteWalletButton({ id }: DeleteWalletProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const walletM = useMutation({
    mutationFn: deleteWallet,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["e-wallets"] });

      if (data instanceof Error) toast.error(data.message);
      else {
        router.replace("/e-wallets");
        toast("Wallet has been deleted successfully");
        setOpen(false);
      }
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2Icon />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will
            <strong> permanently </strong>
            delete the wallet and all of its records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={walletM.isPending}>
            <XIcon />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => walletM.mutate(id)}
            disabled={walletM.isPending}>
            {walletM.isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <ArrowRightIcon />
            )}
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
