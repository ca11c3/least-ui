"use client";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { DateRange } from "react-day-picker";

import { Button } from "../components/button";
import { Calendar } from "../components/calendar";
import { Input } from "../components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/popover";
import { Sheet, SheetContent, SheetTrigger } from "../components/sheet";
import { useIsMobile } from "../hooks/useMobile";
import { applyDateFormatMask } from "../lib/datetime";
import { cn } from "../lib/utils";
import { Shortcut, ShortcutItem, defaultShortcuts } from "./Shortcut";

dayjs.extend(customParseFormat);

export interface DateRangePickerProps {
  value?: DateRange;
  onValueChange?: (value: DateRange) => void;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  format?: {
    from: string;
    to: string;
  };
  /** Pass false to hide shortcuts, or a custom array to override defaults */
  shortcuts?: ShortcutItem[] | false;
}

function applyRangeMask(
  digits: string,
  formatFrom: string,
  formatTo: string,
  isDeleting: boolean,
) {
  const fromMaxDigits = formatFrom.replace(/[^YMDymd]/g, "").length;
  const toMaxDigits = formatTo.replace(/[^YMDymd]/g, "").length;

  const fromDigits = digits.slice(0, fromMaxDigits);
  const toDigits = digits.slice(fromMaxDigits, fromMaxDigits + toMaxDigits);

  const formattedFrom = applyDateFormatMask(fromDigits, formatFrom);

  if (digits.length < fromMaxDigits) {
    return formattedFrom;
  }

  if (digits.length === fromMaxDigits && !isDeleting) {
    return `${formattedFrom} - `;
  }

  if (digits.length === fromMaxDigits && isDeleting) {
    return formattedFrom;
  }

  const formattedTo = applyDateFormatMask(toDigits, formatTo);
  return `${formattedFrom} - ${formattedTo}`;
}

export type { DateRange };

export function DateRangePicker({
  value,
  onValueChange,
  className,
  disabled,
  readOnly = false,
  format = {
    from: "YYYY-MM-DD",
    to: "YYYY-MM-DD",
  },
  shortcuts = defaultShortcuts,
}: DateRangePickerProps) {
  const isMobile = useIsMobile();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = React.useState<Date | undefined>(
    undefined,
  );
  const [inputValue, setInputValue] = React.useState("");
  const [activeSlot, setActiveSlot] = React.useState<"from" | "to">("from");

  const placeholder = `${format.from} - ${format.to}`;
  const maxInputLength = placeholder.length;
  const fromFormattedLen = format.from.length;
  const toFormattedLen = format.to.length;

  React.useEffect(() => {
    if (isMobile) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (activeSlot === "from") {
      input.setSelectionRange(0, Math.min(fromFormattedLen, inputValue.length));
    } else {
      const toStart = Math.min(fromFormattedLen + 3, inputValue.length);
      input.setSelectionRange(
        toStart,
        Math.min(toStart + toFormattedLen, inputValue.length),
      );
    }
  }, [activeSlot, open, isMobile]);

  React.useEffect(() => {
    if (!value?.from) {
      setRange(undefined);
      setInputValue("");
      return;
    }

    const parsedFrom = dayjs(value.from, format.from, true);
    const parsedTo = value.to ? dayjs(value.to, format.to, true) : null;

    if (!parsedFrom.isValid()) return;

    const fromDate = parsedFrom.toDate();
    const toDate = parsedTo?.isValid() ? parsedTo.toDate() : undefined;

    setRange({ from: fromDate, to: toDate });

    if (parsedTo?.isValid()) {
      setInputValue(
        `${parsedFrom.format(format.from)} - ${parsedTo.format(format.to)}`,
      );
    } else {
      setInputValue(parsedFrom.format(format.from));
    }
  }, [value, format]);

  function handleCalendarSelect(selectedRange: DateRange | undefined) {
    setRange(selectedRange);

    if (!selectedRange?.from) {
      setInputValue("");
      setActiveSlot("from");
      onValueChange?.({ from: undefined, to: undefined });
      return;
    }

    if (selectedRange.from && !selectedRange.to) {
      setActiveSlot("to");
    }

    const fromStr = dayjs(selectedRange.from).format(format.from);
    let inputStr = fromStr;

    if (selectedRange.to) {
      const toStr = dayjs(selectedRange.to).format(format.to);
      inputStr = `${fromStr} - ${toStr}`;
    }

    setInputValue(inputStr);
    onValueChange?.({ from: selectedRange.from, to: selectedRange.to });
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value;

    const isDeleting =
      (event.nativeEvent as InputEvent).inputType === "deleteContentBackward" ||
      (event.nativeEvent as InputEvent).inputType === "deleteContentForward";

    const digits = rawValue.replace(/\D/g, "");
    const formatted = applyRangeMask(
      digits,
      format.from,
      format.to,
      isDeleting,
    );
    setInputValue(formatted);

    const parts = formatted.split(" - ");
    const fromPart = parts[0] || "";
    const toPart = parts[1] || "";

    let fromDate: Date | undefined = undefined;
    let toDate: Date | undefined = undefined;

    if (fromPart.length === format.from.length) {
      const parsedFrom = dayjs(fromPart, format.from, true);
      if (parsedFrom.isValid()) {
        fromDate = parsedFrom.toDate();
        setCalendarMonth(fromDate);
      }
    }

    if (toPart.length === format.to.length) {
      const parsedTo = dayjs(toPart, format.to, true);
      if (parsedTo.isValid()) toDate = parsedTo.toDate();
    }

    const toBeforeFrom = !!(
      fromDate &&
      toDate &&
      dayjs(toDate).isBefore(dayjs(fromDate), "day")
    );
    setRange({ from: fromDate, to: toBeforeFrom ? undefined : toDate });

    if (
      fromPart.length === format.from.length &&
      toPart.length === format.to.length
    ) {
      if (fromDate && toDate && !toBeforeFrom) {
        onValueChange?.({ from: fromDate, to: toDate });
      }
    } else if (digits.length === 0) {
      onValueChange?.({ from: undefined, to: undefined });
    }
  }

  function handleInputClick() {
    const input = inputRef.current;
    if (input) {
      const pos = input.selectionStart ?? 0;
      setActiveSlot(pos <= fromFormattedLen ? "from" : "to");
    }
    if (!open) setOpen(true);
  }

  function handleShortcutSelect(selectedRange: DateRange) {
    setRange(selectedRange);
    setCalendarMonth(selectedRange.from);

    const fromStr = dayjs(selectedRange.from).format(format.from);
    const toStr = selectedRange.to
      ? dayjs(selectedRange.to).format(format.to)
      : "";
    setInputValue(toStr ? `${fromStr} - ${toStr}` : fromStr);
    onValueChange?.(selectedRange);
  }

  function handleInputBlur() {
    if (!range?.from) {
      setInputValue("");
      return;
    }

    const fromStr = dayjs(range.from).format(format.from);

    if (range.to && dayjs(range.to).isBefore(dayjs(range.from), "day")) {
      setRange({ from: range.from, to: undefined });
      setInputValue(fromStr);
    }

    if (range.to) {
      setInputValue(`${fromStr} - ${dayjs(range.to).format(format.to)}`);
    } else {
      setInputValue(fromStr);
    }
  }

  // ── Mobile: bottom sheet ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <div className={cn("relative w-full", className)}>
          <Input
            ref={inputRef}
            value={inputValue}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={disabled}
            inputMode="numeric"
            autoComplete="off"
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onClick={handleInputClick}
            maxLength={maxInputLength}
            className="focus-ring h-10 placeholder:font-mono placeholder:text-xs"
          />
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="text-muted-foreground size-4" />
            </Button>
          </SheetTrigger>
        </div>

        <SheetContent
          side="bottom"
          showCloseButton={false}
          title="Select date range"
          className="max-h-[85dvh] gap-0 overflow-hidden rounded-t-2xl p-0"
        >
          {shortcuts !== false && (
            <Shortcut
              shortcuts={shortcuts}
              value={range}
              onSelect={handleShortcutSelect}
              variant="horizontal"
              className="border-b"
            />
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            <Calendar
              mode="range"
              selected={range}
              numberOfMonths={1}
              onSelectRange={handleCalendarSelect}
              disabled={disabled}
              showOutsideDays={false}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              className="w-screen lg:w-full"
            />
          </div>

          <div className="shrink-0">
            <div className="flex items-center justify-end gap-1 border-t px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary font-semibold"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // ── Desktop: popover ──────────────────────────────────────────────────────
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative w-full", className)}>
        <Input
          ref={inputRef}
          value={inputValue}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="off"
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onClick={handleInputClick}
          maxLength={maxInputLength}
          className="focus-ring h-10 placeholder:font-mono placeholder:text-xs"
        />

        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
          >
            <CalendarIcon className="text-muted-foreground size-4" />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-auto overflow-hidden p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onFocusOutside={(e) => {
          if (inputRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <div className={cn("relative", shortcuts !== false && "pl-36")}>
          {shortcuts !== false && (
            <Shortcut
              shortcuts={shortcuts}
              value={range}
              onSelect={handleShortcutSelect}
              variant="vertical"
              className="absolute inset-y-0 left-0"
            />
          )}
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={range}
            onSelectRange={handleCalendarSelect}
            disabled={disabled}
            showOutsideDays={false}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            className="rounded-none"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
