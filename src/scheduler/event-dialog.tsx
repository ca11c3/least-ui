import * as React from "react";
import dayjs from "dayjs";
import { CalendarIcon, ClockIcon, RepeatIcon, TextIcon, Trash2Icon, UsersIcon } from "lucide-react";

import { Button } from "../components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/dialog";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select";
import { Switch } from "../components/switch";
import { Textarea } from "../components/textarea";
import { cn } from "../lib/utils";
import type { Occurrence, SchedulerEvent, SchedulerEventColor, SchedulerResource } from "./types";
import { PALETTE_NAMES, formatTime, resolveColor } from "./utils";

export type EventDraft = Omit<SchedulerEvent, "id">;

export type DialogState =
  | { kind: "edit"; occurrence: Occurrence }
  | { kind: "create"; draft: EventDraft }
  | null;

type Repeat = "none" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "custom";

const DATE = "YYYY-MM-DD";
const DATETIME = "YYYY-MM-DDTHH:mm";
const NO_RESOURCE = "__none";

function repeatOf(rrule: string | undefined): Repeat {
  if (!rrule) return "none";
  const m = /^(?:RRULE:)?FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)$/i.exec(rrule.trim());
  return m ? (m[1].toUpperCase() as Repeat) : "custom";
}

function describeTime(item: { start: Date; end: Date; allDay?: boolean }, ampm: boolean) {
  const start = dayjs(item.start);
  const end = dayjs(item.end);
  if (item.allDay) {
    return start.isSame(end, "day")
      ? start.format("dddd, D MMMM YYYY")
      : `${start.format("D MMM")} – ${end.format("D MMM YYYY")}`;
  }
  if (start.isSame(end.subtract(1, "ms"), "day")) {
    return `${start.format("dddd, D MMMM")} · ${formatTime(start, ampm)} – ${formatTime(end, ampm)}`;
  }
  return `${start.format("D MMM")}, ${formatTime(start, ampm)} – ${end.format("D MMM")}, ${formatTime(end, ampm)}`;
}

function EventDetails({
  occurrence,
  resource,
  color,
  ampm,
}: {
  occurrence: Occurrence;
  resource?: SchedulerResource;
  color: string;
  ampm: boolean;
}) {
  const { event } = occurrence;
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 pr-8">
          <span className="size-3 shrink-0 rounded-sm" style={{ background: color }} />
          {event.title}
        </DialogTitle>
        <DialogDescription>{describeTime({ ...occurrence, allDay: event.allDay }, ampm)}</DialogDescription>
      </DialogHeader>
      <dl className="text-muted-foreground flex flex-col gap-2.5 text-sm">
        {event.rrule && (
          <div className="flex gap-2.5">
            <RepeatIcon className="mt-0.5 size-4 shrink-0" />
            <dd className="font-mono text-xs leading-5">{event.rrule}</dd>
          </div>
        )}
        {resource && (
          <div className="flex gap-2.5">
            <UsersIcon className="mt-0.5 size-4 shrink-0" />
            <dd className="text-foreground">{resource.title}</dd>
          </div>
        )}
        {event.description && (
          <div className="flex gap-2.5">
            <TextIcon className="mt-0.5 size-4 shrink-0" />
            <dd className="text-foreground whitespace-pre-wrap">{event.description}</dd>
          </div>
        )}
      </dl>
    </>
  );
}

function EventForm({
  initial,
  isNew,
  resources,
  defaultColor,
  onCancel,
  onSave,
  onDelete,
}: {
  initial: EventDraft;
  isNew: boolean;
  resources: SchedulerResource[];
  defaultColor: string;
  onCancel: () => void;
  onSave: (values: EventDraft) => void;
  onDelete?: () => void;
}) {
  const id = React.useId();
  const [title, setTitle] = React.useState(initial.title);
  const [description, setDescription] = React.useState(initial.description ?? "");
  const [allDay, setAllDay] = React.useState(!!initial.allDay);
  const [start, setStart] = React.useState(dayjs(initial.start).format(initial.allDay ? DATE : DATETIME));
  const [end, setEnd] = React.useState(dayjs(initial.end).format(initial.allDay ? DATE : DATETIME));
  const [resource, setResource] = React.useState(initial.resource ?? NO_RESOURCE);
  const [color, setColor] = React.useState<SchedulerEventColor | undefined>(initial.color);
  const [repeat, setRepeat] = React.useState<Repeat>(repeatOf(initial.rrule));

  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const invalidRange =
    !startDate.isValid() ||
    !endDate.isValid() ||
    (allDay ? endDate.isBefore(startDate, "day") : !endDate.isAfter(startDate));

  const toggleAllDay = (next: boolean) => {
    setAllDay(next);
    if (next) {
      setStart(startDate.format(DATE));
      setEnd((endDate.isBefore(startDate, "day") ? startDate : endDate).format(DATE));
    } else {
      // Coming from whole days, default to a one-hour slot in the morning.
      const from = startDate.hour(9).minute(0);
      setStart(from.format(DATETIME));
      setEnd(from.add(1, "hour").format(DATETIME));
    }
  };

  const changeStart = (value: string) => {
    const next = dayjs(value);
    // Keep the duration when the start moves, like most calendars.
    if (next.isValid() && startDate.isValid() && endDate.isValid()) {
      setEnd(endDate.add(next.diff(startDate), "ms").format(allDay ? DATE : DATETIME));
    }
    setStart(value);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invalidRange) return;
    onSave({
      title: title.trim() || "(No title)",
      description: description.trim() || undefined,
      allDay,
      start: startDate.toDate(),
      end: endDate.toDate(),
      resource: resource === NO_RESOURCE ? undefined : resource,
      color,
      rrule: repeat === "none" ? undefined : repeat === "custom" ? initial.rrule : `FREQ=${repeat}`,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{isNew ? "New event" : "Edit event"}</DialogTitle>
        <DialogDescription className="sr-only">
          {isNew ? "Create an event." : "Change the event's details."}
        </DialogDescription>
      </DialogHeader>

      <Input
        autoFocus
        aria-label="Title"
        placeholder="Add title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-10 text-base font-medium"
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <ClockIcon className="text-muted-foreground size-4 shrink-0" />
          <Label htmlFor={`${id}-allday`} className="font-normal">
            All day
          </Label>
          <Switch id={`${id}-allday`} size="sm" checked={allDay} onCheckedChange={toggleAllDay} />
        </div>
        <div className="grid grid-cols-1 gap-2 pl-6.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-start`} className="text-muted-foreground text-xs font-normal">
              Start
            </Label>
            <Input
              id={`${id}-start`}
              type={allDay ? "date" : "datetime-local"}
              value={start}
              onChange={(e) => changeStart(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-end`} className="text-muted-foreground text-xs font-normal">
              End
            </Label>
            <Input
              id={`${id}-end`}
              type={allDay ? "date" : "datetime-local"}
              value={end}
              aria-invalid={invalidRange || undefined}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          {invalidRange && (
            <p className="text-destructive text-xs sm:col-span-2">The end must come after the start.</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <RepeatIcon className="text-muted-foreground size-4 shrink-0" />
        <Select value={repeat} onValueChange={(value) => setRepeat(value as Repeat)}>
          <SelectTrigger className="w-full" aria-label="Repeat">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Does not repeat</SelectItem>
            <SelectItem value="DAILY">Daily</SelectItem>
            <SelectItem value="WEEKLY">Weekly on {startDate.isValid() ? startDate.format("dddd") : "this day"}</SelectItem>
            <SelectItem value="MONTHLY">Monthly on day {startDate.isValid() ? startDate.date() : ""}</SelectItem>
            <SelectItem value="YEARLY">Yearly on {startDate.isValid() ? startDate.format("D MMMM") : "this day"}</SelectItem>
            {initial.rrule && repeatOf(initial.rrule) === "custom" && (
              <SelectItem value="custom">Custom: {initial.rrule}</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {resources.length > 0 && (
        <div className="flex items-center gap-2.5">
          <UsersIcon className="text-muted-foreground size-4 shrink-0" />
          <Select value={resource} onValueChange={setResource}>
            <SelectTrigger className="w-full" aria-label="Resource">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_RESOURCE}>No resource</SelectItem>
              {resources.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  <span className="size-2.5 rounded-full" style={{ background: resolveColor(r.eventColor) }} />
                  {r.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
        <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-1.5">
          {[undefined, ...PALETTE_NAMES].map((name) => {
            const selected = color === name;
            return (
              <button
                key={name ?? "default"}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={name ?? "Default colour"}
                title={name ?? "Default"}
                onClick={() => setColor(name)}
                className={cn(
                  "ring-offset-background focus-visible:ring-ring/50 size-6 rounded-full ring-offset-2 transition-shadow outline-none focus-visible:ring-2",
                  selected && "ring-foreground ring-2",
                  !name && "border-muted-foreground/50 border border-dashed",
                )}
                style={{ background: name ? resolveColor(name) : `color-mix(in srgb, ${defaultColor} 35%, transparent)` }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex gap-2.5">
        <TextIcon className="text-muted-foreground mt-2.5 size-4 shrink-0" />
        <Textarea
          aria-label="Description"
          placeholder="Add description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        {onDelete ? (
          <Button type="button" variant="ghost" className="text-destructive [--btn-color:var(--color-destructive)]" onClick={onDelete}>
            <Trash2Icon />
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={invalidRange}>
            Save
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function EventDialog({
  state,
  resources,
  ampm,
  isReadOnly,
  colorOf,
  onClose,
  onSave,
  onDelete,
}: {
  state: DialogState;
  resources: SchedulerResource[];
  ampm: boolean;
  isReadOnly: (event: SchedulerEvent) => boolean;
  colorOf: (event: Pick<SchedulerEvent, "color" | "resource">) => string;
  onClose: () => void;
  onSave: (values: EventDraft) => void;
  onDelete: (occurrence: Occurrence) => void;
}) {
  // Keep the last state while the close animation runs.
  const last = React.useRef(state);
  if (state) last.current = state;
  const shown = state ?? last.current;

  let body: React.ReactNode = null;
  if (shown?.kind === "edit") {
    const { occurrence } = shown;
    const { event } = occurrence;
    body = isReadOnly(event) ? (
      <EventDetails
        occurrence={occurrence}
        resource={resources.find((r) => r.id === event.resource)}
        color={colorOf(event)}
        ampm={ampm}
      />
    ) : (
      <EventForm
        key={occurrence.key}
        initial={{ ...event, start: occurrence.start, end: occurrence.end }}
        isNew={false}
        resources={resources}
        defaultColor={colorOf({ resource: event.resource })}
        onCancel={onClose}
        onSave={onSave}
        onDelete={() => onDelete(occurrence)}
      />
    );
  } else if (shown?.kind === "create") {
    body = (
      <EventForm
        key={`new-${shown.draft.start.getTime()}`}
        initial={shown.draft}
        isNew
        resources={resources}
        defaultColor={colorOf({ resource: shown.draft.resource })}
        onCancel={onClose}
        onSave={onSave}
      />
    );
  }

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">{body}</DialogContent>
    </Dialog>
  );
}
