import * as React from "react";
import dayjs, { type Dayjs } from "dayjs";

import type { Occurrence, SchedulerEvent } from "./types";
import { DAY_MINUTES, MINUTE } from "./utils";

export type DragMode = "move" | "resize-start" | "resize-end";
/** "time": day columns of a day/week view. "day": month cells and the all-day row. */
export type DragSurface = "time" | "day";
export type DragPreview = { key: string; start: Date; end: Date };

export interface SchedulerContextValue {
  ampm: boolean;
  weekStartsOn: 0 | 1;
  hourHeight: number;
  maxEventsPerDay: number;
  /** null when event creation is off. */
  creation: { interaction: "click" | "double-click"; duration: number } | null;
  colorOf: (event: SchedulerEvent) => string;
  canDrag: (event: SchedulerEvent) => boolean;
  canResize: (event: SchedulerEvent, edge: "start" | "end") => boolean;
  draggingKey: string | null;
  beginDrag: (
    e: React.PointerEvent,
    occurrence: Occurrence,
    mode: DragMode,
    surface: DragSurface,
  ) => void;
  /** Opens the event dialog, unless the click ended a drag. */
  openEvent: (occurrence: Occurrence) => void;
  createEvent: (start: Date, end: Date, allDay: boolean) => void;
  goToDay: (day: Date) => void;
}

export const SchedulerContext = React.createContext<SchedulerContextValue | null>(null);

export function useScheduler() {
  const context = React.useContext(SchedulerContext);
  if (!context) throw new Error("Scheduler parts must be rendered inside <Scheduler>.");
  return context;
}

/** Data attributes the drag controller reads to find what's under the pointer. */
export const COLUMN_ATTR = "data-scheduler-column";
export const DAY_ATTR = "data-scheduler-day";

export const dayKey = (day: Dayjs) => day.format("YYYY-MM-DD");

function hitTest(x: number, y: number, attr: string) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el instanceof HTMLElement && el.hasAttribute(attr)) return el;
  }
  return null;
}

/** The instant under the pointer in a time column, in ms, or null outside one. */
export function timeAtPoint(x: number, y: number) {
  const column = hitTest(x, y, COLUMN_ATTR);
  if (!column) return null;
  const rect = column.getBoundingClientRect();
  const minutes = Math.min(Math.max(((y - rect.top) / rect.height) * DAY_MINUTES, 0), DAY_MINUTES);
  return dayjs(column.getAttribute(COLUMN_ATTR)).valueOf() + minutes * MINUTE;
}

function dayAtPoint(x: number, y: number) {
  const cell = hitTest(x, y, DAY_ATTR);
  return cell ? dayjs(cell.getAttribute(DAY_ATTR)) : null;
}

const DRAG_THRESHOLD = 4;

type DragSession = {
  occurrence: Occurrence;
  mode: DragMode;
  surface: DragSurface;
  originX: number;
  originY: number;
  /** ms for the time surface, start of day for the day surface. */
  grabbed: number | Dayjs;
  moved: boolean;
  preview: DragPreview | null;
};

function nextRange(session: DragSession, x: number, y: number, snapMinutes: number) {
  const { occurrence, mode } = session;
  const start = dayjs(occurrence.start);
  const end = dayjs(occurrence.end);

  if (session.surface === "time") {
    const at = timeAtPoint(x, y);
    if (at === null) return null;
    const snap = snapMinutes * MINUTE;
    const delta = Math.round((at - (session.grabbed as number)) / snap) * snap;
    if (mode === "move") return { start: start.add(delta, "ms"), end: end.add(delta, "ms") };
    if (mode === "resize-end") {
      return { start, end: dayjs(Math.max(end.valueOf() + delta, start.valueOf() + snap)) };
    }
    return { start: dayjs(Math.min(start.valueOf() + delta, end.valueOf() - snap)), end };
  }

  const at = dayAtPoint(x, y);
  if (!at) return null;
  const days = at.diff(session.grabbed as Dayjs, "day");
  if (mode === "move") return { start: start.add(days, "day"), end: end.add(days, "day") };
  // Day-surface resizing is offered for all-day events, whose end is an inclusive day.
  if (mode === "resize-end") {
    const next = end.add(days, "day");
    return { start, end: next.isBefore(start, "day") ? start : next };
  }
  const next = start.add(days, "day");
  return { start: next.isAfter(end, "day") ? end : next, end };
}

/**
 * Pointer-driven move and resize. Listens on window so the dragged element can
 * re-render into another column without losing the gesture.
 */
export function useDragController({
  snapMinutes,
  onCommit,
}: {
  snapMinutes: number;
  onCommit: (occurrence: Occurrence, start: Date, end: Date) => void;
}) {
  const [preview, setPreview] = React.useState<DragPreview | null>(null);
  const justDragged = React.useRef(false);
  const commitRef = React.useRef(onCommit);
  commitRef.current = onCommit;

  const beginDrag = React.useCallback(
    (e: React.PointerEvent, occurrence: Occurrence, mode: DragMode, surface: DragSurface) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const grabbed =
        surface === "time" ? timeAtPoint(e.clientX, e.clientY) : dayAtPoint(e.clientX, e.clientY);
      if (grabbed === null) return;

      const session: DragSession = {
        occurrence,
        mode,
        surface,
        originX: e.clientX,
        originY: e.clientY,
        grabbed,
        moved: false,
        preview: null,
      };

      const onMove = (ev: PointerEvent) => {
        if (
          !session.moved &&
          Math.hypot(ev.clientX - session.originX, ev.clientY - session.originY) < DRAG_THRESHOLD
        ) {
          return;
        }
        session.moved = true;
        ev.preventDefault();
        const range = nextRange(session, ev.clientX, ev.clientY, snapMinutes);
        if (!range) return;
        session.preview = { key: occurrence.key, start: range.start.toDate(), end: range.end.toDate() };
        setPreview(session.preview);
      };

      const finish = (commit: boolean) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        window.removeEventListener("keydown", onKey);
        document.body.style.removeProperty("user-select");
        if (session.moved) {
          // The click that follows pointerup must not open the dialog.
          justDragged.current = true;
          setTimeout(() => (justDragged.current = false), 0);
        }
        const p = session.preview;
        if (
          commit &&
          p &&
          (p.start.getTime() !== occurrence.start.getTime() ||
            p.end.getTime() !== occurrence.end.getTime())
        ) {
          commitRef.current(occurrence, p.start, p.end);
        }
        setPreview(null);
      };
      const onUp = () => finish(true);
      const onCancel = () => finish(false);
      const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && finish(false);

      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      window.addEventListener("keydown", onKey);
    },
    [snapMinutes],
  );

  return { preview, beginDrag, justDragged };
}
