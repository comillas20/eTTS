"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEWalletsQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";

export function SelectWallet() {
  const wallets = useQuery({
    ...getEWalletsQuery(),
    select: (data) => data.map((w) => ({ id: w.id, name: w.name, url: w.url })),
  });

  return (
    <Select>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {wallets.data?.map((w) => (
          <SelectItem key={w.id} value={w.url}>
            {w.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
