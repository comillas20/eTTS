"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type Option = {
  label: string;
  icon: LucideIcon;
  isSelected: boolean;
  onSelect: () => void;
};

type DatatableColumnFilterHeaderProps = {
  options: Option[];
  header: { title: string; icon?: LucideIcon };
} & React.HTMLAttributes<HTMLDivElement>;

export function DatatableColumnFilterHeader({
  options,
  header,
  className,
}: DatatableColumnFilterHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent -ml-3 h-8">
            {header.icon && <header.icon />}
            {header.title}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {options.map((option, i) => (
            <DropdownMenuCheckboxItem
              key={i}
              checked={option.isSelected}
              onCheckedChange={option.onSelect}>
              <option.icon />
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
