"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavUtilities({
  utilities,
}: {
  utilities: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Utilities</SidebarGroupLabel>
      <SidebarMenu>
        {utilities.map((utility) => (
          <SidebarMenuItem key={utility.name}>
            <SidebarMenuButton asChild>
              <a href={utility.url}>
                <utility.icon />
                <span>{utility.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
