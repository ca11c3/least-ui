"use client";

import { cn } from "../lib/utils";
import { Button } from "../components/button";

export interface MonthGridProps {
  month: number | undefined;
  onMonthChange: (month: number) => void;
  className?: string;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function MonthGrid({ month, onMonthChange, className }: MonthGridProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-3 gap-1 px-2 py-1">
        {MONTHS.map((name, index) => {
          const isSelected = index === month;
          return (
            <div key={index} className="flex items-center justify-center">
              <Button
                type="button"
                onClick={() => onMonthChange(index)}
                variant="ghost"
                className={cn(
                  "h-8 rounded-full px-4 text-sm font-normal",
                  isSelected
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]",
                )}
                aria-selected={isSelected}
              >
                {name}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
