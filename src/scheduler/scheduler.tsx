"use client";

import * as React from "react";
import dayjs, { type Dayjs } from "dayjs";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";

import { Button } from "../components/button";
import { Checkbox } from "../components/checkbox";
import { Label } from "../components/label";
import { Tabs, TabsList, TabsTrigger } from "../components/tabs";
import { cn } from "../lib/utils";
import { AgendaView } from "./agenda-view";
import { SchedulerContext, useDragController, type SchedulerContextValue } from "./context";
import { EventDialog, type DialogState, type EventDraft } from "./event-dialog";
import { MonthView, monthRange } from "./month-view";
import { TimeGridView } from "./time-grid-view";
import type {
  Occurrence,
  SchedulerEvent,
  SchedulerEventColor,
  SchedulerResource,
  SchedulerView,
} from "./types";
import { expandEvent, resolveColor } from "./utils";

export type * from "./types";
export { parseRRule, resolveColor } from "./utils";

export interface SchedulerProps {
  /** Controlled events. Pair with `onEventsChange` to apply drags and edits. */
  events?: SchedulerEvent[];
  defaultEvents?: SchedulerEvent[];
  /** Called with the full new list after any create, edit, move, resize or delete. */
  onEventsChange?: (events: SchedulerEvent[]) => void;
  resources?: SchedulerResource[];
  /** Controlled list of resource ids whose events are shown. */
  visibleResources?: string[];
  onVisibleResourcesChange?: (ids: string[]) => void;

  view?: SchedulerView;
  defaultView?: SchedulerView;
  onViewChange?: (view: SchedulerView) => void;
  /** Views offered in the switcher, in order. */
  views?: SchedulerView[];

  /** Any day inside the period to show. */
  visibleDate?: Date;
  defaultVisibleDate?: Date;
  onVisibleDateChange?: (date: Date) => void;

  /** Colour for events that set none, and whose resource sets none. */
  eventColor?: SchedulerEventColor;
  /** Disables every edit: no dragging, resizing, creating or editing. */
  readOnly?: boolean;
  areEventsDraggable?: boolean;
  areEventsResizable?: boolean | "start" | "end";
  /**
   * Create events by clicking an empty slot. `duration` is the length in
   * minutes of an event created in the day/week views.
   */
  eventCreation?: boolean | { interaction?: "click" | "double-click"; duration?: number };
  /** Called on every event click, before the dialog opens. */
  onEventClick?: (event: SchedulerEvent, occurrence: Occurrence) => void;
  /** false keeps the built-in dialog closed, e.g. to show your own. */
  eventDialog?: boolean;

  /** 0 starts weeks on Sunday, 1 on Monday. */
  weekStartsOn?: 0 | 1;
  /** 12-hour times ("2pm") instead of 24-hour ("14:00"). */
  ampm?: boolean;
  /** Pixel height of one hour in the day and week views. */
  hourHeight?: number;
  /** Minutes that drags and resizes snap to. */
  snapMinutes?: number;
  /** The hour the day and week views scroll to when opened. */
  scrollToHour?: number;
  /** Event rows per month cell before the rest collapse into "+N more". */
  maxEventsPerDay?: number;
  /** Show the resource filter panel. Defaults to true when there are resources. */
  sidePanel?: boolean;
  /** Extra controls for the toolbar. */
  toolbar?: React.ReactNode;
  className?: string;
}

const VIEW_LABELS: Record<SchedulerView, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  agenda: "Agenda",
};

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (value: T) => void) {
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const set = React.useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [current, set] as const;
}

function weekStart(date: Dayjs, weekStartsOn: 0 | 1) {
  const day = date.startOf("day");
  return day.subtract((day.day() - weekStartsOn + 7) % 7, "day");
}

function visibleRange(view: SchedulerView, date: Dayjs, weekStartsOn: 0 | 1) {
  if (view === "day") {
    const start = date.startOf("day");
    return { start, end: start.add(1, "day") };
  }
  if (view === "month") return monthRange(date, weekStartsOn);
  const start = weekStart(date, weekStartsOn);
  return { start, end: start.add(1, "week") };
}

function periodTitle(view: SchedulerView, date: Dayjs, weekStartsOn: 0 | 1) {
  if (view === "day") return date.format("dddd, D MMMM YYYY");
  if (view === "month") return date.format("MMMM YYYY");
  const start = weekStart(date, weekStartsOn);
  const end = start.add(6, "day");
  if (start.isSame(end, "month")) return `${start.format("D")} – ${end.format("D MMMM YYYY")}`;
  if (start.isSame(end, "year")) return `${start.format("D MMM")} – ${end.format("D MMM YYYY")}`;
  return `${start.format("D MMM YYYY")} – ${end.format("D MMM YYYY")}`;
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Moves an event (the whole series, if recurring) so `occurrence` lands on [start, end). */
function moveSeries(
  event: SchedulerEvent,
  occurrence: Occurrence,
  start: Date,
  end: Date,
  patch: Partial<SchedulerEvent> = {},
): SchedulerEvent {
  const shift = start.getTime() - occurrence.start.getTime();
  const seriesStart = new Date(event.start.getTime() + shift);
  return {
    ...event,
    ...patch,
    start: seriesStart,
    end: new Date(seriesStart.getTime() + (end.getTime() - start.getTime())),
  };
}

function Scheduler({
  events: eventsProp,
  defaultEvents = [],
  onEventsChange,
  resources = [],
  visibleResources: visibleResourcesProp,
  onVisibleResourcesChange,
  view: viewProp,
  defaultView = "week",
  onViewChange,
  views = ["day", "week", "month", "agenda"],
  visibleDate: visibleDateProp,
  defaultVisibleDate,
  onVisibleDateChange,
  eventColor = "primary",
  readOnly = false,
  areEventsDraggable = true,
  areEventsResizable = true,
  eventCreation = true,
  onEventClick,
  eventDialog = true,
  weekStartsOn = 0,
  ampm = true,
  hourHeight = 48,
  snapMinutes = 15,
  scrollToHour = 7,
  maxEventsPerDay = 3,
  sidePanel,
  toolbar,
  className,
}: SchedulerProps) {
  const [events, setEvents] = useControllable(eventsProp, defaultEvents, onEventsChange);
  const [view, setView] = useControllable(viewProp, defaultView, onViewChange);
  const [visibleDate, setVisibleDate] = useControllable(
    visibleDateProp,
    defaultVisibleDate ?? new Date(),
    onVisibleDateChange,
  );
  const [visibleResources, setVisibleResources] = useControllable(
    visibleResourcesProp,
    resources.map((r) => r.id),
    onVisibleResourcesChange,
  );
  const [dialog, setDialog] = React.useState<DialogState>(null);

  const date = dayjs(visibleDate);
  const range = visibleRange(view, date, weekStartsOn);

  const resourceById = React.useMemo(() => new Map(resources.map((r) => [r.id, r])), [resources]);
  const colorOf = React.useCallback(
    (event: Pick<SchedulerEvent, "color" | "resource">) =>
      resolveColor(
        event.color ?? (event.resource ? resourceById.get(event.resource)?.eventColor : undefined) ?? eventColor,
      ),
    [resourceById, eventColor],
  );
  const isReadOnly = (event: SchedulerEvent) => readOnly || !!event.readOnly;

  const commitMove = (occurrence: Occurrence, start: Date, end: Date) =>
    setEvents(
      events.map((event) =>
        event.id === occurrence.event.id ? moveSeries(event, occurrence, start, end) : event,
      ),
    );
  const { preview, beginDrag, justDragged } = useDragController({ snapMinutes, onCommit: commitMove });

  const rangeStart = range.start.valueOf();
  const rangeEnd = range.end.valueOf();
  const baseOccurrences = React.useMemo(() => {
    const shown = new Set(visibleResources);
    return events
      .filter((event) => !event.resource || !resourceById.has(event.resource) || shown.has(event.resource))
      .flatMap((event) => expandEvent(event, dayjs(rangeStart), dayjs(rangeEnd)));
  }, [events, visibleResources, resourceById, rangeStart, rangeEnd]);

  const occurrences = preview
    ? baseOccurrences.map((o) => (o.key === preview.key ? { ...o, start: preview.start, end: preview.end } : o))
    : baseOccurrences;

  const goToDay = (day: Date) => {
    setVisibleDate(day);
    if (views.includes("day")) setView("day");
  };

  const creation =
    readOnly || eventCreation === false
      ? null
      : {
          interaction: (typeof eventCreation === "object" && eventCreation.interaction) || "double-click",
          duration: (typeof eventCreation === "object" && eventCreation.duration) || 60,
        };

  const context: SchedulerContextValue = {
    ampm,
    weekStartsOn,
    hourHeight,
    maxEventsPerDay,
    creation,
    colorOf,
    canDrag: (event) => !isReadOnly(event) && (event.draggable ?? areEventsDraggable),
    canResize: (event, edge) => {
      if (isReadOnly(event)) return false;
      const resizable = event.resizable ?? areEventsResizable;
      return resizable === true || resizable === edge;
    },
    draggingKey: preview?.key ?? null,
    beginDrag,
    openEvent: (occurrence) => {
      if (justDragged.current) return;
      onEventClick?.(occurrence.event, occurrence);
      if (eventDialog) setDialog({ kind: "edit", occurrence });
    },
    createEvent: (start, end, allDay) => {
      if (!creation) return;
      const onlyResource = visibleResources.length === 1 ? visibleResources[0] : undefined;
      setDialog({ kind: "create", draft: { title: "", start, end, allDay, resource: onlyResource } });
    },
    goToDay,
  };

  const save = (values: EventDraft) => {
    if (dialog?.kind === "create") {
      setEvents([...events, { ...values, id: newId() }]);
    } else if (dialog?.kind === "edit") {
      const { occurrence } = dialog;
      const { start, end, ...patch } = values;
      setEvents(
        events.map((event) =>
          event.id === occurrence.event.id ? moveSeries(event, occurrence, start, end, patch) : event,
        ),
      );
    }
    setDialog(null);
  };

  const remove = (occurrence: Occurrence) => {
    setEvents(events.filter((event) => event.id !== occurrence.event.id));
    setDialog(null);
  };

  const step = (direction: 1 | -1) => {
    const unit = view === "day" ? "day" : view === "month" ? "month" : "week";
    setVisibleDate(date.add(direction, unit).toDate());
  };

  const newEvent = () => {
    const start = (view === "day" ? date : dayjs()).add(1, "hour").startOf("hour");
    context.createEvent(start.toDate(), start.add(creation?.duration ?? 60, "minute").toDate(), false);
  };

  const showPanel = sidePanel ?? resources.length > 0;
  const toggleResource = (id: string, checked: boolean) =>
    setVisibleResources(checked ? [...visibleResources, id] : visibleResources.filter((r) => r !== id));

  return (
    <SchedulerContext.Provider value={context}>
      <div
        data-slot="scheduler"
        className={cn(
          "bg-card text-card-foreground flex h-180 flex-col overflow-hidden rounded-xl border",
          className,
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5 sm:px-4">
          <Button variant="outline" size="sm" onClick={() => setVisibleDate(new Date())}>
            Today
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="size-8" aria-label={`Previous ${view}`} onClick={() => step(-1)}>
              <ChevronLeftIcon />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" aria-label={`Next ${view}`} onClick={() => step(1)}>
              <ChevronRightIcon />
            </Button>
          </div>
          <h2 className="mr-auto text-base font-semibold sm:text-lg" aria-live="polite">
            {periodTitle(view, date, weekStartsOn)}
          </h2>
          {toolbar}
          {creation && (
            <Button size="sm" onClick={newEvent}>
              <PlusIcon />
              New event
            </Button>
          )}
          {views.length > 1 && (
            <Tabs value={view} onValueChange={(value) => setView(value as SchedulerView)}>
              <TabsList>
                {views.map((v) => (
                  <TabsTrigger key={v} value={v} className="px-3">
                    {VIEW_LABELS[v]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {showPanel && (
            <aside className="flex shrink-0 flex-wrap gap-x-4 gap-y-2 border-b p-3 md:w-48 md:flex-col md:flex-nowrap md:gap-2.5 md:border-r md:border-b-0 md:p-4">
              <p className="text-muted-foreground w-full text-xs font-medium tracking-wide uppercase">Resources</p>
              {resources.map((resource) => {
                const color = resolveColor(resource.eventColor ?? eventColor);
                return (
                <div key={resource.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`scheduler-resource-${resource.id}`}
                    checked={visibleResources.includes(resource.id)}
                    onCheckedChange={(checked) => toggleResource(resource.id, checked === true)}
                    // Tint the box with the resource colour; the theme primary needs no override.
                    style={color === resolveColor("primary") ? undefined : ({ "--primary": color } as React.CSSProperties)}
                  />
                  <Label htmlFor={`scheduler-resource-${resource.id}`} className="font-normal">
                    {resource.title}
                  </Label>
                </div>
                );
              })}
            </aside>
          )}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {(view === "day" || view === "week") && (
              <TimeGridView
                start={range.start}
                days={view === "day" ? 1 : 7}
                occurrences={occurrences}
                scrollToHour={scrollToHour}
              />
            )}
            {view === "month" && <MonthView date={date} occurrences={occurrences} />}
            {view === "agenda" && (
              <AgendaView start={range.start} days={7} occurrences={occurrences} resources={resources} />
            )}
          </div>
        </div>
      </div>

      <EventDialog
        state={dialog}
        resources={resources}
        ampm={ampm}
        isReadOnly={isReadOnly}
        colorOf={colorOf}
        onClose={() => setDialog(null)}
        onSave={save}
        onDelete={remove}
      />
    </SchedulerContext.Provider>
  );
}

export { Scheduler };
