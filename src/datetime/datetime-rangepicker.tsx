"use client";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { CalendarClock } from "lucide-react";
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
import { Separator } from "../components/separator";
import { Sheet, SheetContent, SheetTrigger } from "../components/sheet";
import { useIsMobile } from "../hooks/useMobile";
import { applyDateTimeFormatMask } from "../lib/datetime";
import { cn } from "../lib/utils";
import { Shortcut, ShortcutItem, defaultShortcuts } from "./Shortcut";
import { TimePicker } from "./time-picker";

dayjs.extend(customParseFormat);

export interface DateTimeRangePickerProps {
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

function getFormatInputLength(format: string) {
  let length = 0;
  for (const ch of format) {
    if (/[YMDdHhmsS]/.test(ch)) {
      length += 1;
    } else if (ch === "a" || ch === "A") {
      length += 2;
    }
  }
  return length;
}

function applyRangeMask(
  inputChars: string,
  formatFrom: string,
  formatTo: string,
  isDeleting: boolean,
) {
  const fromMaxDigits = getFormatInputLength(formatFrom);
  const toMaxDigits = getFormatInputLength(formatTo);

  const fromDigits = inputChars.slice(0, fromMaxDigits);
  const toDigits = inputChars.slice(fromMaxDigits, fromMaxDigits + toMaxDigits);

  const formattedFrom = applyDateTimeFormatMask(fromDigits, formatFrom);

  if (inputChars.length < fromMaxDigits) {
    return formattedFrom;
  }

  if (inputChars.length === fromMaxDigits && !isDeleting) {
    return `${formattedFrom} - `;
  }

  if (inputChars.length === fromMaxDigits && isDeleting) {
    return formattedFrom;
  }

  const formattedTo = applyDateTimeFormatMask(toDigits, formatTo);
  return `${formattedFrom} - ${formattedTo}`;
}

export function DateTimeRangePicker({
  value,
  onValueChange,
  className,
  disabled,
  readOnly = false,
  format = {
    from: "YYYY-MM-DD hh:mm A",
    to: "YYYY-MM-DD hh:mm A",
  },
  shortcuts = defaultShortcuts,
}: DateTimeRangePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>(undefined);
  const [inputValue, setInputValue] = React.useState("");
  const [activeSlot, setActiveSlot] = React.useState<"from" | "to">("from");
  const [calendarMonth, setCalendarMonth] = React.useState<Date | undefined>(
    undefined,
  );
  const [mobileFromTime, setMobileFromTime] = React.useState("");
  const [mobileToTime, setMobileToTime] = React.useState("");

  const placeholder = `${format.from} - ${format.to}`;

  const fromFormattedLen = React.useMemo(
    () => dayjs().format(format.from).length,
    [format.from],
  );
  const toFormattedLen = React.useMemo(
    () => dayjs().format(format.to).length,
    [format.to],
  );
  const maxInputLength = fromFormattedLen + 3 + toFormattedLen;

  const needsTextKeyboard = /[aA]/.test(`${format.from}${format.to}`);

  // Extract time-only format from the full datetime format (e.g. "YYYY-MM-DD hh:mm A" → "hh:mm A")
  const fromTimeFormat = React.useMemo(
    () => format.from.split(" ").slice(1).join(" "),
    [format.from],
  );
  const toTimeFormat = React.useMemo(
    () => format.to.split(" ").slice(1).join(" "),
    [format.to],
  );
  const hasTime = !!fromTimeFormat;

  // Desktop only: select the active slot text range in the input
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

  // Sync external value
  React.useEffect(() => {
    if (!value?.from) {
      setRange(undefined);
      setInputValue("");
      return;
    }

    const parsedFrom = dayjs(value.from);
    const parsedTo = value.to ? dayjs(value.to) : null;

    const fromDate = parsedFrom.toDate();
    const toDate = parsedTo?.isValid() ? parsedTo.toDate() : undefined;

    setRange({ from: fromDate, to: toDate });
    setCalendarMonth(fromDate);
    setMobileFromTime(fromTimeFormat ? parsedFrom.format(fromTimeFormat) : "");
    setMobileToTime(
      parsedTo?.isValid() && toTimeFormat ? parsedTo.format(toTimeFormat) : "",
    );

    if (parsedTo?.isValid()) {
      setInputValue(
        `${parsedFrom.format(format.from)} - ${parsedTo.format(format.to)}`,
      );
    } else {
      setInputValue(parsedFrom.format(format.from));
    }
  }, [value, format]);

  function syncInputFromRange(r: DateRange | undefined) {
    if (!r?.from) {
      setInputValue("");
      return;
    }
    const fromStr = dayjs(r.from).format(format.from);
    setInputValue(
      r.to ? `${fromStr} - ${dayjs(r.to).format(format.to)}` : fromStr,
    );
  }

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

    syncInputFromRange(selectedRange);
    onValueChange?.({ from: selectedRange.from, to: selectedRange.to });
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value;

    const isDeleting =
      (event.nativeEvent as InputEvent).inputType === "deleteContentBackward" ||
      (event.nativeEvent as InputEvent).inputType === "deleteContentForward";

    const inputChars = rawValue.replace(/[^a-zA-Z0-9]/g, "");
    const formatted = applyRangeMask(
      inputChars,
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

    if (fromPart.length === fromFormattedLen) {
      const parsedFrom = dayjs(fromPart, format.from, true);
      if (parsedFrom.isValid()) {
        fromDate = parsedFrom.toDate();
        setCalendarMonth(fromDate);
      }
    }

    if (toPart.length === toFormattedLen) {
      const parsedTo = dayjs(toPart, format.to, true);
      if (parsedTo.isValid()) toDate = parsedTo.toDate();
    }

    setRange({ from: fromDate, to: toDate });

    if (
      fromPart.length === fromFormattedLen &&
      toPart.length === toFormattedLen
    ) {
      if (fromDate && toDate) {
        onValueChange?.({ from: fromDate, to: toDate });
      }
    } else if (inputChars.length === 0) {
      onValueChange?.({ from: undefined, to: undefined });
    }
  }

  function handleInputBlur() {
    if (!range?.from) {
      setInputValue("");
      return;
    }
    syncInputFromRange(range);
  }

  function handleInputClick() {
    if (!open) {
      const input = inputRef.current;
      if (input) {
        const pos = input.selectionStart ?? 0;
        setActiveSlot(pos <= fromFormattedLen ? "from" : "to");
      }
      setOpen(true);
    }
  }

  function handleMobileTimeChange(val: string, slot: "from" | "to") {
    const slotFormat = slot === "from" ? fromTimeFormat : toTimeFormat;

    if (slot === "from") setMobileFromTime(val);
    else setMobileToTime(val);

    const parsed = dayjs(val, slotFormat, true);
    const baseDate = slot === "from" ? range?.from : range?.to;
    if (!baseDate || !parsed.isValid()) return;

    const merged = dayjs(baseDate)
      .hour(parsed.hour())
      .minute(parsed.minute())
      .second(parsed.second())
      .toDate();
    const newRange: DateRange =
      slot === "from"
        ? { from: merged, to: range?.to }
        : { from: range?.from, to: merged };

    setRange(newRange);
    syncInputFromRange(newRange);
    onValueChange?.(newRange);
  }

  function handleShortcutSelect(selectedRange: DateRange) {
    setRange(selectedRange);
    setCalendarMonth(selectedRange.from);
    syncInputFromRange(selectedRange);
    onValueChange?.(selectedRange);
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
            inputMode={needsTextKeyboard ? "text" : "numeric"}
            autoComplete="off"
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onClick={() => !open && setOpen(true)}
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
              <CalendarClock className="text-muted-foreground size-4" />
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

          {/* Scrollable middle: calendar */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Calendar
              mode="range"
              selected={range}
              numberOfMonths={1}
              onSelectRange={handleCalendarSelect}
              disabled={disabled}
              enabledTimeSelection={false}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              showOutsideDays={false}
              className="w-screen lg:w-full"
            />
          </div>

          {/* Sticky bottom: time inputs + footer */}
          <div className="shrink-0">
            {hasTime && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-3 px-4 py-3">
                  <div>
                    <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
                      Start time
                    </p>
                    <TimePicker
                      format={fromTimeFormat}
                      value={mobileFromTime}
                      onValueChange={(val) =>
                        handleMobileTimeChange(val, "from")
                      }
                      disabled={disabled}
                      readOnly={readOnly}
                      portal={false}
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
                      End time
                    </p>
                    <TimePicker
                      format={toTimeFormat}
                      value={mobileToTime}
                      onValueChange={(val) => handleMobileTimeChange(val, "to")}
                      disabled={disabled}
                      readOnly={readOnly}
                      portal={false}
                    />
                  </div>
                </div>
              </>
            )}

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
          inputMode={needsTextKeyboard ? "text" : "numeric"}
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
            <CalendarClock className="text-muted-foreground size-4" />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="max-h-(--radix-popper-available-height) w-auto max-w-(--radix-popper-available-width) overflow-y-auto p-0"
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
            className="rounded-none"
            mode="range"
            selected={range}
            numberOfMonths={1}
            onSelectRange={handleCalendarSelect}
            disabled={disabled}
            enabledTimeSelection={true}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            showOutsideDays={false}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
