"use server";
import { AppSidebar } from "@/app/(dashboard)/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavBreadcrumb } from "./components/nav-breadcrumb";
import { auth } from "@/lib/auth"; // path to your Better Auth server instance
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NavUser } from "./components/nav-user";
import { ThemeToggle } from "./components/theme-toggle";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  if (!session) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <NavBreadcrumb />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex gap-4">
            <ThemeToggle />
            <NavUser />
          </div>
        </header>
        <div className="flex-1 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
