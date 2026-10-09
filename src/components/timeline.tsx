import * as React from "react";

import { cn } from "../lib/utils";

function Timeline({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="timeline"
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
}

function TimelineItem({
  className,
  color,
  style,
  ...props
}: React.ComponentProps<"li"> & { color?: string }) {
  const colorStyle = color
    ? ({ "--timeline-color": color } as React.CSSProperties)
    : undefined;

  return (
    <li
      data-slot="timeline-item"
      style={{ ...colorStyle, ...style }}
      className={cn("group/timeline-item relative flex gap-3 pb-6 last:pb-0", className)}
      {...props}
    />
  );
}

// The dot, plus the line down to the next item (hidden on the last one).
// Pass an icon as children for a larger, tinted marker.
function TimelineIndicator({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <div className="relative flex w-6 shrink-0 justify-center">
      <span
        data-slot="timeline-indicator"
        className={cn(
          "z-10 flex shrink-0 items-center justify-center rounded-full",
          children
            ? "size-6 bg-[color-mix(in_srgb,var(--timeline-color,var(--color-primary))_12%,var(--color-background))] text-[var(--timeline-color,var(--color-primary))] [&>svg]:size-3.5 [&>svg]:pointer-events-none"
            : "mt-1.75 size-2.5 bg-[var(--timeline-color,var(--color-primary))] ring-4 ring-[color-mix(in_srgb,var(--timeline-color,var(--color-primary))_15%,transparent)]",
          className,
        )}
        {...props}
      >
        {children}
      </span>
      <span
        aria-hidden
        data-slot="timeline-connector"
        className="bg-border absolute top-7 -bottom-5 left-1/2 w-px -translate-x-1/2 group-last/timeline-item:hidden"
      />
    </div>
  );
}

function TimelineContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
      {...props}
    />
  );
}

function TimelineHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-header"
      className={cn("flex flex-wrap items-baseline justify-between gap-x-3", className)}
      {...props}
    />
  );
}

function TimelineTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="timeline-title"
      className={cn("text-sm leading-6 font-medium", className)}
      {...props}
    />
  );
}

function TimelineTime({ className, ...props }: React.ComponentProps<"time">) {
  return (
    <time
      data-slot="timeline-time"
      className={cn("text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

function TimelineDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Timeline,
  TimelineItem,
  TimelineIndicator,
  TimelineContent,
  TimelineHeader,
  TimelineTitle,
  TimelineTime,
  TimelineDescription,
};
