"use client";

import { cn } from "../lib/utils";
import * as React from "react";
import { Button } from "../components/button";

export interface YearGridProps {
  year: number | undefined;
  onYearChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
  className?: string;
}

export function YearGrid({
  year,
  onYearChange,
  minYear = year,
  maxYear = year,
  className,
}: YearGridProps) {
  const selectedYearRef = React.useRef<HTMLButtonElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = minYear ?? 0; y <= (maxYear ?? 0); y += 1) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  React.useEffect(() => {
    const selectedButton =
      containerRef.current?.querySelector<HTMLButtonElement>(
        "button[aria-selected='true']",
      );
    selectedButton?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [year]);

  return (
    <div className={cn("overflow-y-auto", className)}>
      <div className="grid grid-cols-3 gap-1 px-2 py-1" ref={containerRef}>
        {years.map((value) => {
          const isSelected = value === year;
          return (
            <div key={value} className="flex items-center justify-center">
              <Button
                type="button"
                ref={isSelected ? selectedYearRef : undefined}
                onClick={() => onYearChange(value)}
                variant="ghost"
                className={cn(
                  "h-8 rounded-full px-4 text-sm font-normal",
                  isSelected
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]",
                )}
                aria-selected={isSelected}
              >
                {value}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
