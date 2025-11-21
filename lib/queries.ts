import { getFeeRanges } from "@/app/(dashboard)/actions/fees";
import { getRecords } from "@/app/(dashboard)/actions/records";
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
  });
}

export function getRecordsQuery(walletId: number) {
  return queryOptions({
    queryKey: ["records", walletId],
    queryFn: async () => getRecords(walletId),
  });
}
