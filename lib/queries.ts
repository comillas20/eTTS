import { getFeeRanges } from "@/app/(dashboard)/actions/fees";
import { getWallets } from "@/app/(dashboard)/actions/wallets";
import { queryOptions } from "@tanstack/react-query";

export function getEWalletsQuery() {
  return queryOptions({
    queryKey: ["e-wallets"],
    queryFn: getWallets,
  });
}

export function getFeeRangesQuery(walletId: number) {
  return queryOptions({
    queryKey: ["fee-ranges", walletId],
    queryFn: async () => getFeeRanges(walletId),
    select: (result) => result.data,
  });
}
