"use client";

import { WalletIcon, XIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getEWalletsQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavWallets() {
  const query = useQuery(getEWalletsQuery());

  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>e-Wallets</SidebarGroupLabel>
      <SidebarMenu>
        {query.data && query.data.length > 0 ? (
          query.data.map((wallet) => {
            const splittedPath = pathname.split("/");
            const currentWallet =
              splittedPath.length > 2 ? splittedPath[2] : "";
            return (
              <SidebarMenuItem key={wallet.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={wallet.name}
                  isActive={wallet.url === currentWallet}>
                  <Link href={"/e-wallets/" + wallet.url}>
                    <WalletIcon />
                    <span>{wallet.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })
        ) : (
          <SidebarMenuItem className="flex items-center justify-center text-xs">
            <XIcon className="text-destructive size-4" />
            No e-wallets found
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
