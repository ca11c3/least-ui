"use client";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { CalendarClock } from "lucide-react";
import * as React from "react";

import { Button } from "../components/button";
import { Calendar, DateTimeFormat } from "../components/calendar";
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

dayjs.extend(customParseFormat);

export interface DateTimePickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  format?: DateTimeFormat;
}

export function DateTimePicker({
  value,
  onValueChange,
  className,
  disabled,
  readOnly = false,
  format = "YYYY-MM-DD hh:mm:ss A",
}: DateTimePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState<Date | undefined>(
    value ? dayjs(value, format, true).toDate() : undefined,
  );
  const [calendarMonth, setCalendarMonth] = React.useState<Date | undefined>(
    currentDate,
  );
  const [inputValue, setInputValue] = React.useState<string>(
    value ? dayjs(value, format).format(format) : "",
  );
  const [mobileTimeValue, setMobileTimeValue] = React.useState<string>(
    value && dayjs(value, format, true).isValid()
      ? dayjs(value, format, true).format(format.split(" ").slice(1).join(" "))
      : "",
  );

  const timeFormat = React.useMemo(
    () => format.split(" ").slice(1).join(" "),
    [format],
  );
  const hasTime = !!timeFormat;

  React.useEffect(() => {
    if (!value) {
      setCurrentDate(undefined);
      setInputValue("");
      setMobileTimeValue("");
      return;
    }
    const parsed = dayjs(value, format, true);
    if (parsed.isValid()) {
      const d = parsed.toDate();
      setCurrentDate(d);
      setCalendarMonth(d);
      setInputValue(parsed.format(format));
      setMobileTimeValue(timeFormat ? parsed.format(timeFormat) : "");
    }
  }, [value, format, timeFormat]);

  const maxInputLength = React.useMemo(
    () => dayjs().format(format).length,
    [format],
  );
  const needsTextKeyboard = /[aA]/.test(format);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const formatted = applyDateTimeFormatMask(event.target.value, format);
    setInputValue(formatted);

    const parsed = dayjs(formatted, format, true);
    if (parsed.isValid()) {
      const d = parsed.toDate();
      setCurrentDate(d);
      setCalendarMonth(d);
      onValueChange?.(formatted);
    }
  }

  function handleInputBlur() {
    const parsed = dayjs(inputValue, format, true);
    if (!parsed.isValid()) {
      setInputValue(currentDate ? dayjs(currentDate).format(format) : "");
    }
  }

  function handleCalendarSelect(newDate: Date | undefined) {
    if (!newDate) return;
    const formatted = dayjs(newDate).format(format);
    setCurrentDate(newDate);
    setInputValue(formatted);
    setMobileTimeValue(timeFormat ? dayjs(newDate).format(timeFormat) : "");
    onValueChange?.(formatted);
  }

  function handleMobileTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = applyDateTimeFormatMask(e.target.value, timeFormat);
    setMobileTimeValue(val);
    const parsed = dayjs(val, timeFormat, true);
    if (!currentDate || !parsed.isValid()) return;

    const merged = dayjs(currentDate)
      .hour(parsed.hour())
      .minute(parsed.minute())
      .second(parsed.second())
      .toDate();
    const mergedFormatted = dayjs(merged).format(format);
    setCurrentDate(merged);
    setInputValue(mergedFormatted);
    onValueChange?.(mergedFormatted);
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
            onClick={() => !open && setOpen(true)}
            inputMode={needsTextKeyboard ? "text" : "numeric"}
            autoComplete="off"
            onChange={handleInputChange}
            onBlur={handleInputBlur}
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
          title="Select date"
          className="max-h-[85dvh] gap-0 overflow-hidden rounded-t-2xl p-0"
        >
          {/* Scrollable middle: calendar */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Calendar
              mode="single"
              format={format}
              selected={currentDate}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onSelect={handleCalendarSelect}
              enabledTimeSelection={false}
              className="w-screen lg:w-full"
            />
          </div>

          {/* Sticky bottom: time input + footer */}
          <div className="shrink-0">
            {hasTime && (
              <>
                <Separator />
                <div className="px-4 py-3">
                  <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
                    Time
                  </p>
                  <Input
                    value={mobileTimeValue}
                    onChange={handleMobileTimeChange}
                    placeholder={timeFormat}
                    className="focus-ring h-10 placeholder:font-mono placeholder:text-xs"
                    inputMode={/[aA]/.test(timeFormat) ? "text" : "numeric"}
                    autoComplete="off"
                    maxLength={dayjs().format(timeFormat).length}
                  />
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
    <Popover open={open} onOpenChange={() => setOpen(!open)}>
      <div className={cn("relative w-full", className)}>
        <Input
          value={inputValue}
          placeholder={format}
          readOnly={readOnly}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          inputMode={needsTextKeyboard ? "text" : "numeric"}
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
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
          >
            <CalendarClock className="text-muted-foreground size-4" />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="bg-card max-h-(--radix-popper-available-height) w-auto max-w-(--radix-popper-available-width) overflow-y-auto p-0"
      >
        <Calendar
          mode="single"
          format={format}
          selected={currentDate}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          onSelect={handleCalendarSelect}
          enabledTimeSelection={true}
        />
      </PopoverContent>
    </Popover>
  );
}
