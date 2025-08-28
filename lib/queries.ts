import { getWallets } from "@/app/(dashboard)/actions/wallets";
import { queryOptions } from "@tanstack/react-query";

export function getEWalletsQuery() {
  return queryOptions({
    queryKey: ["e-wallets"],
    queryFn: getWallets,
  });
}
