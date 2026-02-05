"use client";
import { Separator } from "@/components/ui/separator";
import { eWalletsTable } from "@/db/schema";
import { getEWalletsQuery, getFeeRangesQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";

import { CustomFee } from "./custom-fee";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function CustomFees() {
  const wallets = useQuery({
    ...getEWalletsQuery(),
    select: (data) => data.map((w) => ({ id: w.id, name: w.name, url: w.url })),
  });
  const [walletId, setWalletId] = useState<number>(0);

  const { data, dataUpdatedAt } = useQuery(getFeeRangesQuery(walletId));
  const feeRanges = data && data.success ? data.data : [];

  return (
    <div className="space-y-8">
      <Select
        value={walletId !== 0 ? walletId.toString() : undefined}
        onValueChange={(value) => setWalletId(parseInt(value, 10))}>
        <div className="relative w-fit">
          <SelectTrigger>
            <SelectValue placeholder="Select wallet" />
          </SelectTrigger>
          <span
            className={cn({
              "absolute top-0 right-0 -mt-1 -mr-1 flex size-3": true,
              hidden: walletId > 0,
              show: walletId === 0,
            })}>
            <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="bg-primary relative inline-flex size-3 rounded-full" />
          </span>
        </div>
        <SelectContent>
          {wallets.data?.map((wallet) => (
            <SelectItem
              id={wallet.id.toString()}
              value={wallet.id.toString()}
              key={wallet.id}>
              {wallet.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex max-w-4xl flex-col gap-2 overflow-auto">
        {feeRanges.length > 0 &&
          feeRanges.map((fee, i) => (
            <CustomFee
              key={fee.id + "-" + dataUpdatedAt}
              data={fee}
              walletId={walletId}
              includeLabel={i === 0}
            />
          ))}
        {feeRanges.length > 0 && <Separator className="mb-4" />}
        <CustomFee key={walletId} walletId={walletId} includeLabel />
      </div>
    </div>
  );
}
