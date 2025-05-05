"use client";

import { WalletIcon, XIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getWallets } from "../actions";

export function NavWallets() {
  const query = useQuery({
    queryKey: ["wallets"],
    queryFn: getWallets,
  });

  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>e-Wallets</SidebarGroupLabel>
      <SidebarMenu>
        {query.data && query.data.length > 0 ? (
          query.data.map((wallet) => (
            <SidebarMenuItem key={wallet.id}>
              <SidebarMenuButton
                asChild
                tooltip={wallet.name}
                isActive={pathname.startsWith("/" + wallet.url)}>
                <Link href={"/" + wallet.url}>
                  <WalletIcon />
                  <span>{wallet.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
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
