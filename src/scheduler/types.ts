export type SchedulerView = "day" | "week" | "month" | "agenda";

/** A palette name, or any CSS colour. */
export type SchedulerEventColor =
  | "primary"
  | "purple"
  | "teal"
  | "lime"
  | "orange"
  | "green"
  | "pink"
  | "indigo"
  | "amber"
  | "blue"
  | "red"
  | (string & {});

export type SchedulerEvent = {
  id: string;
  title: string;
  description?: string;
  start: Date;
  /**
   * Exclusive end for timed events. For all-day events the event covers every
   * day from `start` to `end`, inclusive.
   */
  end: Date;
  allDay?: boolean;
  /** Id of the resource the event belongs to. */
  resource?: string;
  /** Wins over the resource's and the scheduler's `eventColor`. */
  color?: SchedulerEventColor;
  className?: string;
  /** Overrides `areEventsDraggable` for this event. */
  draggable?: boolean;
  /** Overrides `areEventsResizable`; "start" or "end" allows one edge only. */
  resizable?: boolean | "start" | "end";
  /** Can't be moved, resized, edited or deleted. */
  readOnly?: boolean;
  /**
   * An RFC 5545 recurrence rule, e.g. "FREQ=WEEKLY;BYDAY=MO,WE". Supports
   * FREQ, INTERVAL, COUNT, UNTIL, BYDAY and BYMONTHDAY.
   */
  rrule?: string;
};

export type SchedulerResource = {
  id: string;
  title: string;
  eventColor?: SchedulerEventColor;
};

/** One drawn instance of an event; recurring events yield many. */
export type Occurrence = {
  key: string;
  event: SchedulerEvent;
  start: Date;
  end: Date;
};
