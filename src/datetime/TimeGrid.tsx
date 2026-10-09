"use client";

import * as React from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { cn } from "../lib/utils";
import { Input } from "../components/input";
import { applyDateTimeFormatMask } from "../lib/datetime";

dayjs.extend(customParseFormat);

export interface TimeGridProps {
  format: string;
  value?: Date;
  onValueChange?: (value: Date) => void;
  className?: string;
  showInput: boolean;
}

function parseFormat(format: string) {
  const segments: Array<"hour" | "minute" | "second" | "meridiem"> = [];
  if (/HH/.test(format)) segments.push("hour");
  else if (/hh/.test(format)) segments.push("hour");
  if (/mm/.test(format)) segments.push("minute");
  if (/ss/.test(format)) segments.push("second");
  if (/[Aa]/.test(format)) segments.push("meridiem");
  return { segments, is24Hour: /HH/.test(format) };
}

function parseDateToSegments(date: Date, is24Hour: boolean) {
  const d = dayjs(date);
  const hour24 = d.hour();
  return {
    hour: is24Hour ? hour24 : hour24 % 12 || 12,
    minute: d.minute(),
    second: d.second(),
    meridiem: hour24 >= 12 ? "PM" : "AM",
  };
}

export function TimeGrid({
  format,
  value,
  onValueChange,
  className,
  showInput = false,
}: TimeGridProps) {
  const { segments, is24Hour } = React.useMemo(
    () => parseFormat(format),
    [format],
  );

  const [inputValue, setInputValue] = React.useState(() =>
    value ? dayjs(value).format(format) : "",
  );

  React.useEffect(() => {
    setInputValue(value ? dayjs(value).format(format) : "");
  }, [value, format]);

  const selectedParts = React.useMemo(() => {
    const parsed = dayjs(inputValue, format, true);
    if (!parsed.isValid()) return null;
    return parseDateToSegments(parsed.toDate(), is24Hour);
  }, [inputValue, format, is24Hour]);

  const hourRef = React.useRef<HTMLDivElement>(null);
  const minuteRef = React.useRef<HTMLDivElement>(null);
  const secondRef = React.useRef<HTMLDivElement>(null);
  const meridiemRef = React.useRef<HTMLDivElement>(null);
  const containerRefs = React.useMemo(
    () => ({
      hour: hourRef,
      minute: minuteRef,
      second: secondRef,
      meridiem: meridiemRef,
    }),
    [],
  );

  // Centre the selected item within its own column. scrollIntoView would also
  // scroll the popover and the page behind it.
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      segments.forEach((segment) => {
        const column = containerRefs[segment].current;
        const el = column?.querySelector<HTMLButtonElement>(
          "button[aria-selected='true']",
        );
        if (!column || !el) return;
        column.scrollTo({
          top: el.offsetTop - column.clientHeight / 2 + el.clientHeight / 2,
        });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [containerRefs, segments, value]);

  function handleSegmentChange(segment: string, val: number | string) {
    const base = dayjs(inputValue, format, true).isValid()
      ? dayjs(inputValue, format, true)
      : dayjs();
    let updated = base;

    if (segment === "meridiem") {
      const currentHour = base.hour();
      const isPM = val === "PM";
      const isCurrentlyPM = currentHour >= 12;
      if (isPM && !isCurrentlyPM) updated = base.hour(currentHour + 12);
      else if (!isPM && isCurrentlyPM) updated = base.hour(currentHour - 12);
    } else if (segment === "hour") {
      const hour = Number(val);
      updated = is24Hour
        ? base.hour(hour)
        : base.hour(base.hour() >= 12 ? hour + 12 : hour);
    } else if (segment === "minute") {
      updated = base.minute(Number(val));
    } else if (segment === "second") {
      updated = base.second(Number(val));
    }

    const formatted = updated.format(format);
    setInputValue(formatted);
    onValueChange?.(updated.toDate());
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = applyDateTimeFormatMask(e.target.value, format);
    setInputValue(formatted);
    const parsed = dayjs(formatted, format, true);
    if (parsed.isValid()) onValueChange?.(parsed.toDate());
  }

  const allSegments = [
    ...(["hour", "minute", "second"] as const).filter((s) =>
      segments.includes(s),
    ),
  ];

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {showInput && (
        <div className="pt-2 px-3">
          <Input
            value={inputValue}
            className="focus-ring w-full"
            onChange={handleInputChange}
            placeholder={format}
          />
        </div>
      )}
      <div className="flex flex-1 gap-1 px-1">
        {allSegments.map((segment, i) => {
          const length = segment === "hour" ? (is24Hour ? 24 : 12) : 60;
          const offset = segment === "hour" && !is24Hour ? 1 : 0;
          const segmentRef =
            segment === "hour"
              ? hourRef
              : segment === "minute"
                ? minuteRef
                : secondRef;
          return (
            <React.Fragment key={segment}>
              {i > 0 && <div className="bg-border w-px self-stretch" />}
              <div
                ref={segmentRef}
                className="no-scrollbar relative flex max-h-48 min-w-10 flex-1 flex-col gap-0.5 overflow-y-auto py-2 sm:max-h-68 sm:w-10 sm:flex-none"
              >
                {Array.from({ length }, (_, idx) => idx + offset).map((val) => {
                  const isSelected = selectedParts?.[segment] === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSegmentChange(segment, val)}
                      aria-selected={isSelected}
                      className={cn(
                        "mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-colors focus:outline-none",
                        isSelected
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]",
                      )}
                    >
                      {String(val).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}

        {segments.includes("meridiem") && (
          <>
            {allSegments.length > 0 && (
              <div className="bg-border w-px self-stretch" />
            )}
            <div
              ref={meridiemRef}
              className="flex min-w-10 flex-1 flex-col gap-1 py-2 sm:w-10 sm:flex-none"
            >
              {["AM", "PM"].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => handleSegmentChange("meridiem", period)}
                  aria-selected={selectedParts?.meridiem === period}
                  className={cn(
                    "mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors focus:outline-none",
                    selectedParts?.meridiem === period
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]",
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
