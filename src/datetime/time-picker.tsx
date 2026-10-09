"use client";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { Clock } from "lucide-react";
import * as React from "react";

import { Button } from "../components/button";
import { Input } from "../components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/popover";
import { applyDateTimeFormatMask } from "../lib/datetime";
import { cn } from "../lib/utils";
import { TimeGrid } from "./TimeGrid";

dayjs.extend(customParseFormat);

export interface TimePickerProps {
  format?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  /** Pass false when used inside a modal Sheet/Dialog so the grid can scroll */
  portal?: boolean;
}

export function TimePicker({
  format = "HH:mm",
  value,
  onValueChange,
  disabled,
  readOnly = false,
  className,
  placeholder,
  portal = true,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value ?? "");

  const maxLength = React.useMemo(
    () => dayjs().format(format).length,
    [format],
  );

  React.useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  const gridDate = React.useMemo(() => {
    const parsed = dayjs(inputValue, format, true);
    return parsed.isValid() ? parsed.toDate() : undefined;
  }, [inputValue, format]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyDateTimeFormatMask(e.target.value, format);
    setInputValue(masked);
    const parsed = dayjs(masked, format, true);
    if (parsed.isValid()) onValueChange?.(masked);
  }

  function handleInputBlur() {
    const parsed = dayjs(inputValue, format, true);
    if (!parsed.isValid()) {
      const fallback = value ?? "";
      setInputValue(fallback);
    }
  }

  function handleGridChange(date: Date) {
    const formatted = dayjs(date).format(format);
    setInputValue(formatted);
    onValueChange?.(formatted);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative w-full", className)}>
        <Input
          value={inputValue}
          placeholder={placeholder ?? format}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete="off"
          maxLength={maxLength}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setOpen(true)}
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
            <Clock className="text-muted-foreground size-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent
        align="end"
        sideOffset={8}
        portal={portal}
        className="w-auto p-0"
      >
        <TimeGrid
          format={format}
          value={gridDate}
          onValueChange={handleGridChange}
          showInput={false}
        />
      </PopoverContent>
    </Popover>
  );
}
