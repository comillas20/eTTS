"use client";

import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  WalletIcon,
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
import { useQuery } from "@tanstack/react-query";
import { getWallets } from "../actions";

export function NavWallets() {
  const isMobile = useIsMobile();
  // const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["wallets"],
    queryFn: () => getWallets(),
  });

  // const mutation = useMutation({
  //   mutationFn: createWallet,
  //   onSuccess: () => {
  //     // Invalidate and refetch
  //     queryClient.invalidateQueries({ queryKey: ["wallets"] });
  //   },
  // });
  return (
    <SidebarGroup>
      <SidebarGroupLabel>e-Wallets</SidebarGroupLabel>
      <SidebarGroupAction title="Add e-wallet">
        <PlusIcon /> <span className="sr-only">Add Project</span>
      </SidebarGroupAction>
      <SidebarMenu>
        {query.data?.map((wallet) => (
          <SidebarMenuItem key={wallet.id}>
            <SidebarMenuButton asChild tooltip={wallet.name}>
              <a href={wallet.url}>
                <WalletIcon />
                <span>{wallet.name}</span>
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
                  <span>{`Edit ${wallet.name}`}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2Icon className="text-destructive" />
                  <span>{`Delete ${wallet.name}`}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
