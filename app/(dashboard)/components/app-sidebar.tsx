"use client";

import { CommandIcon } from "lucide-react";

// import { NavWallets } from "@/app/(dashboard)/components/nav-wallets";
import { NavUser } from "@/app/(dashboard)/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUtilities } from "./nav-utilities";
import { fakeLinks, fakeUserData, fakeWalletsData } from "../data";
import { NavWallets } from "./nav-wallets";

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <CommandIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Jinance</span>
                  <span className="truncate text-xs">Finance made easy</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavWallets wallets={fakeWalletsData} />
        <NavUtilities utilities={fakeLinks} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={fakeUserData} />
      </SidebarFooter>
    </Sidebar>
  );
}
