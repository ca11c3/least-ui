"use client";
import { CircleQuestionMark } from "lucide-react"; // Removed IconNode
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "../lib/utils";

export default function ExtraInfoHint({
  children,
  color = "var(--info)",
  Icon = CircleQuestionMark,
  triggerClassName,
  ariaLabel = "Extra information",
}: {
  children: React.ReactNode;
  color?: string;
  Icon?: React.ComponentType<{ className?: string }>;
  triggerClassName?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onMouseEnter={() => setOpen(true)}>
        <Button
          size="xs"
          variant="ghost"
          color={color}
          className={cn("ml-1.5 shrink-0 px-1 py-1", triggerClassName)}
          aria-label={ariaLabel}
        >
          <Icon className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={0}
        className="w-105 max-w-[calc(100vw-1.5rem)] max-h-[50vh] overflow-y-auto md:max-h-auto p-5 text-sm rounded-xl"
        collisionPadding={16}
        avoidCollisions
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
