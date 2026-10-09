"use client";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "../components/button";
import { Calendar, DateTimeFormat } from "../components/calendar";
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

dayjs.extend(customParseFormat);

export interface DatePickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  format?: DateTimeFormat;
}

export function DatePicker({
  value,
  onValueChange,
  className,
  disabled,
  readOnly = false,
  format = "YYYY-MM-DD",
}: DatePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = React.useState<Date | undefined>(
    undefined,
  );
  const [inputValue, setInputValue] = React.useState(value ?? "");

  React.useEffect(() => {
    if (!value) {
      setDate(undefined);
      setInputValue("");
      return;
    }
    const parsed = dayjs(value, format, true);
    if (!parsed.isValid()) return;
    const d = parsed.toDate();
    setDate(d);
    setCalendarMonth(d);
    setInputValue(parsed.format(format));
  }, [value, format]);

  const maxInputLength = React.useMemo(
    () => dayjs().format(format).length,
    [format],
  );

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "");
    const formatted = applyDateFormatMask(digits, format);
    setInputValue(formatted);

    const parsed = dayjs(formatted, format, true);
    if (parsed.isValid()) {
      const d = parsed.toDate();
      setDate(d);
      setCalendarMonth(d);
      onValueChange?.(formatted);
    }
  }

  function handleInputBlur() {
    const parsed = dayjs(inputValue, format, true);
    if (!parsed.isValid()) {
      setInputValue(date ? dayjs(date).format(format) : "");
    }
  }

  function handleCalendarSelect(selectedDate: Date | undefined) {
    setDate(selectedDate);
    if (!selectedDate) {
      setInputValue("");
      onValueChange?.("");
      return;
    }
    const formatted = dayjs(selectedDate).format(format);
    setInputValue(formatted);
    onValueChange?.(formatted);
  }

  // ── Mobile: bottom sheet ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <div className={cn("relative w-full", className)}>
          <Input
            value={inputValue}
            placeholder={format}
            readOnly={readOnly}
            disabled={disabled}
            inputMode="numeric"
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
              <CalendarIcon className="text-muted-foreground size-4" />
            </Button>
          </SheetTrigger>
        </div>

        <SheetContent
          side="bottom"
          showCloseButton={false}
          title="Select date"
          className="max-h-[85dvh] gap-0 overflow-hidden rounded-t-2xl p-0"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Calendar
              mode="single"
              format={format}
              selected={date}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onSelect={handleCalendarSelect}
              disabled={disabled}
              enabledTimeSelection={false}
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
    <Popover open={open} onOpenChange={() => setOpen(!open)}>
      <div className={cn("relative w-full", className)}>
        <Input
          value={inputValue}
          placeholder={format}
          readOnly={readOnly}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          inputMode="numeric"
          autoComplete="off"
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          maxLength={maxInputLength}
          className="focus-ring h-10 placeholder:font-mono placeholder:text-xs"
        />
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute top-1/2 right-2 size-7 -translate-y-1/2"
          >
            <CalendarIcon className="text-muted-foreground size-4" />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent align="end" sideOffset={10} className="w-auto p-0">
        <Calendar
          mode="single"
          format={format}
          disabled={disabled}
          selected={date}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          onSelect={handleCalendarSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
