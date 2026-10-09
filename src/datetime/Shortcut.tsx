"use client";

import dayjs from "dayjs";
import { DateRange } from "react-day-picker";
import { cn } from "../lib/utils";
import { Button } from "../components/button";

export type ShortcutItem = {
  label: string;
  getValue: () => DateRange;
};

export const defaultShortcuts: ShortcutItem[] = [
  {
    label: "Today",
    getValue: () => {
      const today = dayjs().toDate();
      return { from: today, to: today };
    },
  },
  {
    label: "Yesterday",
    getValue: () => {
      const yesterday = dayjs().subtract(1, "day").toDate();
      return { from: yesterday, to: yesterday };
    },
  },
  {
    label: "Last 7 days",
    getValue: () => ({
      from: dayjs().subtract(6, "day").toDate(),
      to: dayjs().toDate(),
    }),
  },
  {
    label: "Last 14 days",
    getValue: () => ({
      from: dayjs().subtract(13, "day").toDate(),
      to: dayjs().toDate(),
    }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({
      from: dayjs().subtract(29, "day").toDate(),
      to: dayjs().toDate(),
    }),
  },
  {
    label: "This month",
    getValue: () => ({
      from: dayjs().startOf("month").toDate(),
      to: dayjs().endOf("month").toDate(),
    }),
  },
  {
    label: "Last month",
    getValue: () => ({
      from: dayjs().subtract(1, "month").startOf("month").toDate(),
      to: dayjs().subtract(1, "month").endOf("month").toDate(),
    }),
  },
  {
    label: "This year",
    getValue: () => ({
      from: dayjs().startOf("year").toDate(),
      to: dayjs().endOf("year").toDate(),
    }),
  },
];

function isActive(shortcut: ShortcutItem, value?: DateRange): boolean {
  if (!value?.from || !value?.to) return false;
  const { from, to } = shortcut.getValue();
  return (
    dayjs(value.from).isSame(dayjs(from), "day") &&
    dayjs(value.to).isSame(dayjs(to), "day")
  );
}

export interface ShortcutProps {
  shortcuts?: ShortcutItem[];
  value?: DateRange;
  onSelect: (range: DateRange) => void;
  variant?: "vertical" | "horizontal";
  className?: string;
}

export function Shortcut({
  shortcuts = defaultShortcuts,
  value,
  onSelect,
  variant = "vertical",
  className,
}: ShortcutProps) {
  if (variant === "horizontal") {
    return (
      <div className={cn("")}>
        <span className="ext-muted-foreground pt-2 pl-4 text-[8px] font-medium tracking-widest uppercase select-none">
          shortcut
        </span>
        <div
          className={cn(
            "scrollbar-hide flex flex-row gap-2 overflow-x-auto p-2",
            className,
          )}
        >
          {shortcuts.map((shortcut) => {
            const active = isActive(shortcut, value);
            return (
              <Button
                key={shortcut.label}
                type="button"
                variant={active ? "default" : "outline"}
                size="xs"
                className="h-8 shrink-0 rounded-full text-xs"
                onClick={() => onSelect(shortcut.getValue())}
              >
                {shortcut.label}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-36 shrink-0 flex-col overflow-y-auto border-r",
        className,
      )}
    >
      <span className="bg-popover text-muted-foreground sticky top-0 z-10 px-2 pt-2 pb-1 text-[8px] font-medium tracking-widest uppercase select-none">
        shortcut
      </span>
      <div className="flex flex-col gap-1 px-2 pb-2">
        {shortcuts.map((shortcut) => {
          const active = isActive(shortcut, value);
          return (
            <Button
              key={shortcut.label}
              type="button"
              variant={active ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 justify-start truncate text-xs font-normal",
                active && "font-medium",
              )}
              onClick={() => onSelect(shortcut.getValue())}
            >
              {shortcut.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
