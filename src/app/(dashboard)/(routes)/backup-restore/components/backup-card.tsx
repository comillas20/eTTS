"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DownloadIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getEWalletsQuery } from "@/lib/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function BackupCard() {
  const wallets = useQuery({
    ...getEWalletsQuery(),
    select: (data) => data.map((w) => ({ id: w.id, name: w.name, url: w.url })),
  });

  const [walletUrl, setWalletUrl] = useState<string>();

  const onDownloadHandler = async () => {
    if (!walletUrl) return;

    const response = await fetch(`/api/e-wallets/${walletUrl}`, {
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
    <Card className="border-l-primary gap-4 border-l-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-bold">
          <div className="bg-primary/20 rounded-lg p-2">
            <DownloadIcon className="text-primary size-5" />
          </div>
          Backup
        </CardTitle>
        <CardAction>
          <Select value={walletUrl} onValueChange={setWalletUrl}>
            <div className="relative">
              <SelectTrigger className="border-primary focus-visible:border-primary focus-visible:ring-primary/50">
                <SelectValue placeholder="Select a wallet" />
              </SelectTrigger>
              <span
                className={cn({
                  "absolute top-0 right-0 -mt-1 -mr-1 flex size-3": true,
                  hidden: !!walletUrl,
                  show: !walletUrl,
                })}>
                <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-primary relative inline-flex size-3 rounded-full" />
              </span>
            </div>

            <SelectContent>
              {wallets.data?.map((w) => (
                <SelectItem key={w.id} value={w.url}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">
          Create a backup of your current data. You can download and store it
          safely for future restoration.
        </p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onDownloadHandler}
          disabled={!walletUrl}
          className="w-full px-4 py-3"
          size="lg">
          <DownloadIcon className="size-5" />
          Create Backup
        </Button>
      </CardFooter>
    </Card>
  );
}
