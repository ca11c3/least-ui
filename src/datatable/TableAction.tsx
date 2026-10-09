"use client";

import React from "react";
import { EllipsisVertical } from "lucide-react";
import { Button } from "../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/tooltip";
import { cn } from "../lib/utils";

export interface TableActionItem {
  key?: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** "destructive" colours the item red, for deletes and other risky actions. */
  variant?: "default" | "destructive";
  className?: string;
  onSelect?: () => void | Promise<void>;
}

interface TableActionPanelProps {
  actions: TableActionItem[];
  align?: React.ComponentProps<typeof DropdownMenuContent>["align"];
  className?: string;
}

type TableActionProps = TableActionPanelProps;

export function TableActionPanel({
  actions,
  align = "end",
  className,
}: TableActionPanelProps) {
  return (
    <DropdownMenuContent
      align={align}
      sideOffset={10}
      // The menu renders in a portal, but React still bubbles its clicks to the
      // row it was opened from; keep them from also triggering onRowClick.
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "data-[state=open]:border-ring data-[state=open]:ring-ring/50 w-48 data-[state=open]:ring-4",
        className,
      )}
    >
      {actions.map((action, index) => (
        <DropdownMenuItem
          key={action.key ?? `action-${index}`}
          disabled={action.disabled}
          variant={action.variant}
          onSelect={action.onSelect}
          className={cn("gap-2", action.className)}
        >
          {action.icon}
          {action.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  );
}

export function TableAction({ actions, align, className }: TableActionProps) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              aria-label="More actions"
              onClick={(event) => event.stopPropagation()}
            >
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>More actions</TooltipContent>
      </Tooltip>
      <TableActionPanel actions={actions} align={align} className={className} />
    </DropdownMenu>
  );
}
