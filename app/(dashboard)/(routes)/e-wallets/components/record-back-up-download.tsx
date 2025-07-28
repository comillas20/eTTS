"use client";
import { Button } from "@/components/ui/button";
import { eWalletsTable } from "@/db/schema";
import { CloudDownloadIcon } from "lucide-react";

type RecordBackUpDownloadProps = {
  wallet: typeof eWalletsTable.$inferSelect;
};
export function RecordBackUpDownload({ wallet }: RecordBackUpDownloadProps) {
  const onDownloadHandler = async () => {
    const response = await fetch(`/api/e-wallets/${wallet.url}`, {
      method: "GET",
    });

    if (!response || !response.ok) return;

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "backup.json";
    document.body.appendChild(a);
    a.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  return (
    <Button size="icon" onClick={() => onDownloadHandler()}>
      <CloudDownloadIcon />
    </Button>
  );
}
