"use client";

import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

type NavWalletsProps = {
  wallets: {
    label: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
};

export function NavWallets({ wallets }: NavWalletsProps) {
  const isMobile = useIsMobile();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>e-Wallets</SidebarGroupLabel>
      <SidebarGroupAction title="Add e-wallet">
        <PlusIcon /> <span className="sr-only">Add Project</span>
      </SidebarGroupAction>
      <SidebarMenu>
        {wallets.map((wallet) => (
          <SidebarMenuItem key={wallet.label}>
            <SidebarMenuButton asChild tooltip={wallet.label}>
              <a href={wallet.url}>
                <wallet.icon />
                <span>{wallet.label}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontalIcon />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}>
                <DropdownMenuItem>
                  <PencilIcon className="text-muted-foreground" />
                  <span>{`Edit ${wallet.label}`}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2Icon className="text-destructive" />
                  <span>{`Delete ${wallet.label}`}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
