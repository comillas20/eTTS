"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { ChevronDownCircleIcon, Loader2Icon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function NavUser() {
  const { data: session, isPending } = authClient.useSession();

  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative p-px"
          disabled={!session || !session.user}>
          <Avatar className="size-full rounded-sm">
            {session?.user.image && (
              <AvatarImage src={session?.user.image} alt={session?.user.name} />
            )}
            <AvatarFallback className="rounded-none">
              {session && session.user ? (
                session.user.name.charAt(0).toUpperCase()
              ) : (
                <Loader2Icon className="animate-spin" />
              )}
            </AvatarFallback>
          </Avatar>
          {session && session.user && !isPending && (
            <ChevronDownCircleIcon className="fill-primary absolute -right-1 -bottom-1 size-4 stroke-white" />
          )}
        </Button>
      </DropdownMenuTrigger>
      {session && session.user && !isPending && (
        <DropdownMenuContent className="rounded-lg" align="end" sideOffset={4}>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="rounded-lg">
                {session.user.image && (
                  <AvatarImage
                    src={session.user.image}
                    alt={session.user.name}
                  />
                )}
                <AvatarFallback className="rounded-lg">
                  {session.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {session.user.name}
                </span>
                <span className="truncate text-xs">{session.user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/login");
                  },
                },
              })
            }>
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
