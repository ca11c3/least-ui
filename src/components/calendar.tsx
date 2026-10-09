"use client";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import {
  ArrowRight,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import * as React from "react";
import {
  DateRange,
  DayPicker,
  getDefaultClassNames,
  MonthProps,
  useDayPicker,
  type DayButton,
} from "react-day-picker";

import { Button, buttonVariants } from "./button";
import { cn } from "../lib/utils";
import { MonthGrid } from "../datetime/MonthGrid";
import { TimeGrid } from "../datetime/TimeGrid";
import { YearGrid } from "../datetime/YearGrid";
import { Separator } from "./separator";
import { TimePicker } from "../datetime/time-picker";

dayjs.extend(customParseFormat);

export type DateTimeFormat =
  | "YYYY-MM-DD HH:mm"
  | "YYYY-MM-DD hh:mm A"
  | "YYYY-MM-DD HH:mm:ss"
  | "YYYY-MM-DD hh:mm:ss A"
  | "MM/DD/YYYY HH:mm"
  | "MM/DD/YYYY hh:mm A"
  | "MM/DD/YYYY HH:mm:ss"
  | "MM/DD/YYYY hh:mm:ss A"
  | "DD/MM/YYYY HH:mm"
  | "DD/MM/YYYY hh:mm A"
  | "DD/MM/YYYY HH:mm:ss"
  | "DD/MM/YYYY hh:mm:ss A"
  | "YYYY/MM/DD HH:mm"
  | "YYYY/MM/DD hh:mm A"
  | "YYYY/MM/DD HH:mm:ss"
  | "YYYY/MM/DD hh:mm:ss A"
  | "MM-DD-YYYY HH:mm"
  | "MM-DD-YYYY hh:mm A"
  | "MM-DD-YYYY HH:mm:ss"
  | "MM-DD-YYYY hh:mm:ss A"
  | "DD-MM-YYYY HH:mm"
  | "DD-MM-YYYY hh:mm A"
  | "DD-MM-YYYY HH:mm:ss"
  | "DD-MM-YYYY hh:mm:ss A"
  | "YYYY-MM-DD"
  | "MM/DD/YYYY"
  | "DD/MM/YYYY"
  | "YYYY/MM/DD"
  | "MM-DD-YYYY"
  | "DD-MM-YYYY";

function splitDateFormateIntoDateAndTime(
  value: string,
): { date: string; time: string } | null {
  const parts = value.split(" ");

  return {
    date: parts[0],
    time: parts.slice(1, parts.length).join(" "),
  };
}

function mergeTime(base: Date, newTime: Date): Date {
  return dayjs(base)
    .hour(newTime.getHours())
    .minute(newTime.getMinutes())
    .second(newTime.getSeconds())
    .millisecond(newTime.getMilliseconds())
    .toDate();
}

function isRange(v: Date | DateRange | null | undefined): v is DateRange {
  return v !== null && v !== undefined && !(v instanceof Date) && "from" in v;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  components,
  enabledTimeSelection = false,
  format = "YYYY-MM-DD hh:mm A",
  onSelect,
  onSelectRange,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  enabledTimeSelection?: boolean;
  format?: DateTimeFormat;
  onSelect?: (date: Date) => void;
  onSelectRange?: (range: DateRange) => void;
  selected?: Date | DateRange;
}) {
  const defaultClassNames = getDefaultClassNames();

  const selectedDate =
    props.mode === "single" && props.selected instanceof Date
      ? props.selected
      : props.selected && "from" in props.selected
        ? (props.selected as DateRange).from
        : undefined;

  const isRangeMode = props.mode === "range";

  const [view, setView] = React.useState<"day" | "month" | "year">("day");
  const [activeDisplayIndex, setActiveDisplayIndex] = React.useState(0);

  // Refs so MonthComponent can read current values without recreating on every change
  const viewRef = React.useRef(view);
  viewRef.current = view;
  const activeDisplayIndexRef = React.useRef(activeDisplayIndex);
  activeDisplayIndexRef.current = activeDisplayIndex;

  const [dateTime, setDateTime] = React.useState<Date | DateRange | null>(
    selectedDate ?? null,
  );

  const displayDate =
    dateTime instanceof Date
      ? dateTime
      : isRange(dateTime)
        ? dateTime.from
        : undefined;

  React.useEffect(() => {
    if (isRangeMode) {
      if (isRange(props.selected)) {
        setDateTime(props.selected);
      }
    } else {
      if (props.selected instanceof Date) {
        setDateTime(props.selected);
        onSelect?.(props.selected);
      }
    }
  }, [selectedDate, props.mode]);

  function handleSingleSelect(clicked: Date | undefined) {
    if (!clicked) return;

    const base =
      dateTime instanceof Date
        ? dateTime
        : (dayjs(dateTime?.from).toDate() ?? new Date());
    const merged = mergeTime(dayjs(clicked).toDate(), base);
    setDateTime(merged);
    onSelect?.(merged);
  }

  function handleRangeSelect(
    range: { from: Date | undefined; to?: Date } | undefined,
  ) {
    if (!range?.from) return;
    const newRange: DateRange = { from: range.from, to: range.to };
    setDateTime(newRange);
    onSelectRange?.(newRange);
  }

  function handleTimeChange(newTime: Date, slot: "from" | "to" = "from") {
    if (!dateTime) return;

    if (isRange(dateTime)) {
      const newRange: DateRange =
        slot === "to"
          ? {
              from: dateTime.from,
              to: mergeTime(
                dateTime.to || dateTime.from || dayjs().toDate(),
                newTime,
              ),
            }
          : {
              from: mergeTime(dateTime.from || dayjs().toDate(), newTime),
              to: dateTime.to,
            };
      setDateTime(newRange);
      onSelectRange?.(newRange);
    } else {
      const merged = mergeTime(dateTime, newTime);
      setDateTime(merged);
      onSelect?.(merged);
    }
  }

  const RootComponent = React.useMemo(
    () =>
      function CalendarRoot({
        className,
        rootRef,
        ...rootProps
      }: React.ComponentProps<"div"> & {
        rootRef?: React.Ref<HTMLDivElement>;
      }) {
        return (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(
              className,
              enabledTimeSelection
                ? "flex h-full w-full gap-x-2 rounded-xl"
                : "",
            )}
            {...rootProps}
          >
            {rootProps.children}
          </div>
        );
      },
    [],
  );

  const MonthComponent = React.useMemo(
    () =>
      function CalendarMonth({
        calendarMonth,
        displayIndex,
        className,
        children,
      }: MonthProps) {
        const { goToMonth } = useDayPicker();
        const currentView = viewRef.current;
        const isActive =
          currentView !== "day" &&
          displayIndex === activeDisplayIndexRef.current;
        const monthDate: Date = calendarMonth?.date;

        return (
          <div
            className={cn(
              className,
              isActive &&
                "relative overflow-hidden [&_.rdp-weekdays]:invisible [&_table]:invisible [&_table]:h-auto [&_table]:max-h-full",
            )}
          >
            {children}
            {isActive && currentView === "month" && (
              <div className="absolute inset-x-0 top-12 bottom-0 overflow-y-auto">
                <MonthGrid
                  className="pb-2"
                  month={monthDate?.getMonth()}
                  onMonthChange={(month) => {
                    goToMonth(dayjs(monthDate).month(month).toDate());
                    setView("day");
                  }}
                />
              </div>
            )}
            {isActive && currentView === "year" && (
              <div className="absolute inset-x-0 top-12 bottom-0 overflow-y-auto">
                <YearGrid
                  className="pb-2"
                  year={monthDate?.getFullYear()}
                  onYearChange={(year) => {
                    goToMonth(dayjs(monthDate).year(year).toDate());
                    setView("month");
                  }}
                  minYear={new Date().getFullYear() - 100}
                  maxYear={new Date().getFullYear() + 100}
                />
              </div>
            )}
          </div>
        );
      },
    [],
  );

  const timeFormat = splitDateFormateIntoDateAndTime(format)?.time || "";
  const rangeValue = isRange(dateTime) ? dateTime : undefined;

  return (
    <div
      className={cn(
        "flex w-auto flex-col overflow-x-hidden rounded-lg",
        enabledTimeSelection ? "items-stretch" : "items-start",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col",
          // range mode puts the start/end times under the calendar
          !isRangeMode && "sm:flex-row sm:items-stretch",
        )}
      >
        <div className="bg-popover flex flex-col">
          <DayPicker
            {...props}
            showOutsideDays={showOutsideDays}
            {...(isRangeMode
              ? {
                  mode: "range",
                  selected: isRange(dateTime) ? dateTime : undefined,
                  onSelect: handleRangeSelect,
                }
              : {
                  mode: "single",
                  selected: dateTime instanceof Date ? dateTime : undefined,
                  onSelect: handleSingleSelect,
                })}
            className={cn(
              "group/calendar bg-popover h-full p-3 [--cell-size:--spacing(8)]",
              String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
              String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
              className,
            )}
            captionLayout={captionLayout}
            classNames={{
              root: cn("", defaultClassNames.root),
              months: cn(
                "relative flex h-full w-full flex-col gap-4 md:flex-row",
                defaultClassNames.months,
              ),
              month: cn(
                "flex w-full h-full flex-col gap-4",
                defaultClassNames.month,
              ),
              nav: cn(
                "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
                defaultClassNames.nav,
              ),
              button_previous: cn(
                buttonVariants({ variant: buttonVariant }),
                "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
                defaultClassNames.button_previous,
              ),
              button_next: cn(
                buttonVariants({ variant: buttonVariant }),
                "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
                defaultClassNames.button_next,
              ),
              month_caption: cn(
                "flex h-(--cell-size) w-full items-center justify-center",
                defaultClassNames.month_caption,
              ),
              dropdowns: cn(
                "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
                defaultClassNames.dropdowns,
              ),
              dropdown_root: cn(
                "relative rounded-md border border-input shadow-xs has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/50",
                defaultClassNames.dropdown_root,
              ),
              dropdown: cn(
                "absolute inset-0 bg-popover opacity-0",
                defaultClassNames.dropdown,
              ),
              caption_label: cn(
                "font-medium select-none",
                captionLayout === "label"
                  ? "text-sm"
                  : "flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
                defaultClassNames.caption_label,
              ),
              // Without this the day table shrinks to its content instead of
              // filling the calendar.
              month_grid: cn("w-full", defaultClassNames.month_grid),
              weekdays: cn("flex", defaultClassNames.weekdays),
              weekday: cn(
                "flex-1 text-center rounded-md text-[0.8rem] font-normal text-muted-foreground select-none",
                defaultClassNames.weekday,
              ),
              week: cn("mt-2 flex w-full", defaultClassNames.week),
              week_number_header: cn(
                "w-(--cell-size) select-none",
                defaultClassNames.week_number_header,
              ),
              week_number: cn(
                "text-[0.8rem] text-muted-foreground select-none",
                defaultClassNames.week_number,
              ),
              day: cn(
                "group/day relative flex-1 aspect-square p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-md",
                props.showWeekNumber
                  ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
                  : "[&:first-child[data-selected=true]_button]:rounded-l-md",
                defaultClassNames.day,
              ),
              // Soft tint behind the range; --accent is a strong brand colour
              // here, not the neutral shadcn expects.
              range_start: cn(
                "rounded-l-md bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]",
                defaultClassNames.range_start,
              ),
              range_middle: cn("rounded-none", defaultClassNames.range_middle),
              range_end: cn(
                "rounded-r-md bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]",
                defaultClassNames.range_end,
              ),
              today: cn(
                "rounded-md bg-[color-mix(in_srgb,var(--primary)_6%,transparent)] data-[selected=true]:rounded-none data-[selected=true]:bg-transparent [&_button]:font-semibold [&_button]:text-primary",
                defaultClassNames.today,
              ),
              outside: cn(
                "text-muted-foreground aria-selected:text-muted-foreground",
                defaultClassNames.outside,
              ),
              disabled: cn(
                "text-muted-foreground opacity-50",
                defaultClassNames.disabled,
              ),
              hidden: cn("invisible", defaultClassNames.hidden),
              ...classNames,
            }}
            components={{
              Root: RootComponent,
              Month: MonthComponent,
              MonthCaption: ({ className, calendarMonth, displayIndex }) => {
                const { goToMonth, nextMonth, previousMonth, months } =
                  useDayPicker();
                const captionDate = calendarMonth?.date
                  ? dayjs(calendarMonth.date)
                  : displayDate
                    ? dayjs(displayDate)
                    : dayjs();
                const isFirst = displayIndex === 0;
                const isLast = displayIndex === months.length - 1;

                return (
                  <div
                    className={cn(
                      className,
                      "flex w-full items-center justify-between",
                    )}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => previousMonth && goToMonth(previousMonth)}
                      disabled={!previousMonth}
                      className={cn(
                        "size-(--cell-size) shrink-0 focus:bg-transparent focus:ring-0",
                        !isFirst && "pointer-events-none invisible",
                      )}
                      aria-label="Go to previous month"
                    >
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    <div className="flex items-center gap-0.5">
                      <Button
                        className="h-8 rounded-full px-2.5 text-sm font-medium focus:bg-transparent focus:ring-0"
                        variant="ghost"
                        onClick={() => {
                          setActiveDisplayIndex(displayIndex);
                          setView(
                            view === "month" &&
                              activeDisplayIndex === displayIndex
                              ? "day"
                              : "month",
                          );
                        }}
                        aria-label="Select month"
                        type="button"
                      >
                        {captionDate.format("MMMM")}
                        <ChevronDownIcon
                          className={cn(
                            "ml-1 size-3.5 transition-transform",
                            view === "month" &&
                              activeDisplayIndex === displayIndex &&
                              "rotate-180",
                          )}
                        />
                      </Button>
                      <Button
                        className="h-8 rounded-full px-2.5 text-sm font-medium focus:bg-transparent focus:ring-0"
                        variant="ghost"
                        onClick={() => {
                          setActiveDisplayIndex(displayIndex);
                          setView(
                            view === "year" &&
                              activeDisplayIndex === displayIndex
                              ? "day"
                              : "year",
                          );
                        }}
                        aria-label="Select year"
                        type="button"
                      >
                        {captionDate.format("YYYY")}
                        <ChevronDownIcon
                          className={cn(
                            "ml-1 size-3.5 transition-transform",
                            view === "year" &&
                              activeDisplayIndex === displayIndex &&
                              "rotate-180",
                          )}
                        />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => nextMonth && goToMonth(nextMonth)}
                      disabled={!nextMonth}
                      className={cn(
                        "size-(--cell-size) shrink-0 focus:bg-transparent focus:ring-0",
                        !isLast && "pointer-events-none invisible",
                      )}
                      aria-label="Go to next month"
                    >
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </div>
                );
              },
              Nav: () => <></>,
              Chevron: ({ className, orientation, ...props }) => {
                if (orientation === "left") {
                  return (
                    <ChevronLeftIcon
                      className={cn("size-4", className)}
                      {...props}
                    />
                  );
                }

                if (orientation === "right") {
                  return (
                    <ChevronRightIcon
                      className={cn("size-4", className)}
                      {...props}
                    />
                  );
                }

                return (
                  <ChevronDownIcon
                    className={cn("size-4", className)}
                    {...props}
                  />
                );
              },
              DayButton: CalendarDayButton,
              WeekNumber: ({ children, ...props }) => {
                return (
                  <td {...props}>
                    <div className="flex size-(--cell-size) items-center justify-center text-center">
                      {children}
                    </div>
                  </td>
                );
              },
              ...components,
            }}
          />
        </div>
        {enabledTimeSelection && (
          <div>
            <div className={cn("hidden", !isRangeMode && "sm:block")}>
              <Separator orientation="vertical" className="" />
            </div>
            <div className={cn(!isRangeMode && "sm:hidden")}>
              <Separator orientation="horizontal" className="" />
            </div>
          </div>
        )}

        {enabledTimeSelection && (
          <div
            className={cn(
              "flex w-full",
              !isRangeMode && "border-l sm:h-full sm:w-auto",
            )}
          >
            {isRangeMode ? (
              <div className="flex w-full items-end gap-2 p-3">
                {(["from", "to"] as const).map((slot) => (
                  <React.Fragment key={slot}>
                    {slot === "to" ? (
                      <ArrowRight className="text-muted-foreground/50 mb-3 size-4 shrink-0" />
                    ) : null}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                        {slot === "from" ? "Start" : "End"}
                      </p>
                      <TimePicker
                        format={timeFormat}
                        value={
                          rangeValue?.[slot]
                            ? dayjs(rangeValue[slot]).format(timeFormat)
                            : ""
                        }
                        onValueChange={(time) => {
                          const parsed = dayjs(time, timeFormat, true);
                          if (parsed.isValid())
                            handleTimeChange(parsed.toDate(), slot);
                        }}
                        className="w-36"
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <TimeGrid
                format={timeFormat}
                value={dateTime instanceof Date ? dateTime : undefined}
                onValueChange={(time) => handleTimeChange(time)}
                showInput={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-outside={modifiers.outside || undefined}
      className={cn(
        "group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] data-[range-middle=true]:text-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[outside=true]:text-muted-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] focus:bg-transparent focus:ring-0 data-[outside=true]:opacity-50 data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
