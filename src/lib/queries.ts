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

type GetRecordFilters = {
  walletId?: number;
  limit?: number;
  range?: {
    startDate: Date;
    endDate: Date;
  };
};
export function getRecordsQuery(filters?: GetRecordFilters) {
  return queryOptions({
    queryKey: ["records", filters],
    queryFn: async () => getRecords(filters),
  });
}
