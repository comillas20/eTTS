"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

type Navigation = {
  name: string;
  url: string;
  icon: LucideIcon;
};

const navigations: Navigation[] = [];

export function NavUtilities() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Utilities</SidebarGroupLabel>
      <SidebarMenu>
        {navigations.map((navigation) => (
          <SidebarMenuItem key={navigation.name}>
            <SidebarMenuButton asChild>
              <Link href={navigation.url}>
                <navigation.icon />
                <span>{navigation.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
