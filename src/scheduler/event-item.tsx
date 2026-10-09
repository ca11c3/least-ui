import * as React from "react";
import { RepeatIcon } from "lucide-react";

import { cn } from "../lib/utils";
import { useScheduler, type DragSurface } from "./context";
import type { Occurrence } from "./types";
import { formatTime, isDayLevel } from "./utils";

function colorStyle(color: string, style?: React.CSSProperties) {
  return { "--event-color": color, ...style } as React.CSSProperties;
}

const tinted =
  "bg-[color-mix(in_srgb,var(--event-color)_16%,var(--color-card))] hover:bg-[color-mix(in_srgb,var(--event-color)_26%,var(--color-card))]";

function ResizeHandle({
  edge,
  axis,
  onPointerDown,
}: {
  edge: "start" | "end";
  axis: "x" | "y";
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  return (
    <span
      aria-hidden
      onPointerDown={onPointerDown}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute z-10 touch-none opacity-0 transition-opacity group-hover/event:opacity-100",
        "after:bg-(--event-color) after:absolute after:rounded-full",
        axis === "y"
          ? "inset-x-0 h-2 cursor-ns-resize after:inset-x-1/3 after:top-0.75 after:h-0.5"
          : "inset-y-0 w-2 cursor-ew-resize after:inset-y-1/4 after:left-0.75 after:w-0.5",
        axis === "y" && (edge === "start" ? "top-0" : "bottom-0"),
        axis === "x" && (edge === "start" ? "left-0" : "right-0"),
      )}
    />
  );
}

function useEventHandlers(occurrence: Occurrence, surface: DragSurface | null) {
  const { canDrag, canResize, beginDrag, openEvent, draggingKey } = useScheduler();
  const { event } = occurrence;
  const draggable = surface !== null && canDrag(event);
  // Day-surface resizing only makes sense for all-day events, whose ends are whole days.
  const resizable = (edge: "start" | "end") =>
    surface !== null && canResize(event, edge) && (surface === "time" || !!event.allDay);

  return {
    isDragging: draggingKey === occurrence.key,
    draggable,
    resizable,
    rootProps: {
      type: "button" as const,
      "data-slot": "scheduler-event",
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        openEvent(occurrence);
      },
      onDoubleClick: (e: React.MouseEvent) => e.stopPropagation(),
      onPointerDown: draggable
        ? (e: React.PointerEvent) => beginDrag(e, occurrence, "move", surface!)
        : undefined,
    },
    resizeProps: (edge: "start" | "end") => ({
      edge,
      onPointerDown: (e: React.PointerEvent) =>
        beginDrag(e, occurrence, edge === "start" ? "resize-start" : "resize-end", surface!),
    }),
  };
}

/** A one-line event for day cells: the month grid, the all-day row, and lists. */
export function EventBar({
  occurrence,
  isStart = true,
  isEnd = true,
  surface = "day",
  className,
  style,
}: {
  occurrence: Occurrence;
  isStart?: boolean;
  isEnd?: boolean;
  /** null disables dragging, e.g. inside the "+N more" popover. */
  surface?: DragSurface | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { colorOf, ampm } = useScheduler();
  const { event } = occurrence;
  const { isDragging, draggable, resizable, rootProps, resizeProps } = useEventHandlers(
    occurrence,
    surface,
  );
  const filled = isDayLevel({ ...occurrence, allDay: event.allDay });

  return (
    <button
      {...rootProps}
      title={event.title}
      style={colorStyle(colorOf(event), style)}
      className={cn(
        "group/event @container/event relative flex h-full min-w-0 items-center gap-1.5 px-2 text-left text-xs leading-none font-medium transition-colors",
        "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
        filled ? tinted : "hover:bg-muted",
        isStart ? "ml-1 rounded-l-md" : "-ml-px",
        isEnd ? "mr-1 rounded-r-md" : "-mr-px",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "ring-(--event-color) z-20 opacity-90 shadow-md ring-2",
        event.className,
        className,
      )}
    >
      {isStart && resizable("start") && <ResizeHandle axis="x" {...resizeProps("start")} />}
      {!filled && <span className="bg-(--event-color) size-2 shrink-0 rounded-full" />}
      {!event.allDay && isStart && (
        // Narrow cells drop the time so the title stays readable.
        <span className="text-muted-foreground shrink-0 font-normal @max-[8rem]/event:hidden">
          {formatTime(occurrence.start, ampm)}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{event.title}</span>
      {event.rrule && <RepeatIcon className="text-muted-foreground size-3 shrink-0 @max-[10rem]/event:hidden" />}
      {isEnd && resizable("end") && <ResizeHandle axis="x" {...resizeProps("end")} />}
    </button>
  );
}

/** A positioned block in a day/week time column. */
export function EventBlock({
  occurrence,
  clippedStart,
  clippedEnd,
  style,
}: {
  occurrence: Occurrence;
  clippedStart: boolean;
  clippedEnd: boolean;
  style: React.CSSProperties;
}) {
  const { colorOf, ampm, hourHeight } = useScheduler();
  const { event } = occurrence;
  const { isDragging, draggable, resizable, rootProps, resizeProps } = useEventHandlers(
    occurrence,
    "time",
  );
  const minutes = (occurrence.end.getTime() - occurrence.start.getTime()) / 60_000;
  const compact = (minutes / 60) * hourHeight < 40;
  const time = `${formatTime(occurrence.start, ampm)} – ${formatTime(occurrence.end, ampm)}`;

  return (
    <button
      {...rootProps}
      title={`${event.title}\n${time}`}
      style={colorStyle(colorOf(event), style)}
      className={cn(
        "group/event @container/event absolute flex min-h-5 flex-col overflow-hidden border-l-3 border-(--event-color) px-1.5 py-0.5 text-left text-xs transition-[background-color,box-shadow]",
        "ring-card focus-visible:ring-ring/50 ring-1 outline-none focus-visible:ring-2",
        tinted,
        !clippedStart && "rounded-t-md",
        !clippedEnd && "rounded-b-md",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "ring-(--event-color) z-20 opacity-90 shadow-lg ring-2",
        event.className,
      )}
    >
      {!clippedStart && resizable("start") && <ResizeHandle axis="y" {...resizeProps("start")} />}
      <span className={cn("flex min-w-0 items-center gap-1", compact && "gap-1.5")}>
        <span className="min-w-0 truncate font-semibold">{event.title}</span>
        {compact && (
          <span className="text-muted-foreground shrink-0 @max-[7rem]/event:hidden">
            {formatTime(occurrence.start, ampm)}
          </span>
        )}
        {event.rrule && <RepeatIcon className="text-muted-foreground size-3 shrink-0" />}
      </span>
      {!compact && <span className="text-muted-foreground truncate">{time}</span>}
      {!compact && event.description && minutes >= 90 && (
        <span className="text-muted-foreground mt-0.5 line-clamp-2 whitespace-normal">
          {event.description}
        </span>
      )}
      {!clippedEnd && resizable("end") && <ResizeHandle axis="y" {...resizeProps("end")} />}
    </button>
  );
}
