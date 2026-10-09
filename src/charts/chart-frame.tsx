"use client";

import * as React from "react";
import { BarChart3Icon, TableIcon } from "lucide-react";

import { cn } from "../lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/table";

export type LegendShape = "line" | "rect";

export type LegendItem = { key: string; label: string; color: string; hidden?: boolean };

/** Which series are hidden. Click toggles one; double-click isolates it (again to restore all). */
export function useSeriesVisibility(keys: readonly string[]) {
  const [hidden, setHidden] = React.useState<Set<string>>(() => new Set());
  const toggle = (key: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      // Never hide the last visible series; an empty plot reads as "no data".
      else if (keys.length - next.size > 1) next.add(key);
      return next;
    });
  const isolate = (key: string) =>
    setHidden((current) => {
      const isolated = current.size === keys.length - 1 && !current.has(key);
      return isolated ? new Set() : new Set(keys.filter((k) => k !== key));
    });
  return { hidden, toggle, isolate };
}

export function ChartLegend({
  items,
  shape,
  onToggle,
  onIsolate,
}: {
  items: LegendItem[];
  shape: LegendShape;
  onToggle?: (key: string) => void;
  onIsolate?: (key: string) => void;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-1 gap-y-1" aria-label="Series">
      {items.map((item) => (
        <li key={item.key}>
          <button
            type="button"
            aria-pressed={!item.hidden}
            title="Click to show or hide · double-click to isolate"
            onClick={() => onToggle?.(item.key)}
            onDoubleClick={() => onIsolate?.(item.key)}
            className={cn(
              "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs transition-colors outline-none select-none focus-visible:ring-2",
              item.hidden && "opacity-45",
            )}
          >
            <span
              aria-hidden
              className={cn("shrink-0", shape === "line" ? "h-0.5 w-3 rounded-full" : "size-2.5 rounded-[3px]")}
              style={
                item.hidden
                  ? { boxShadow: `inset 0 0 0 1.5px ${item.color}` }
                  : { background: item.color }
              }
            />
            <span className={cn(item.hidden && "line-through")}>{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export type TooltipRow = { key: string; label: string; value: string; color: string; muted?: boolean };

/** Values lead, labels follow; rows are keyed by a short line in the series colour. */
export function ChartTooltip({
  title,
  rows,
  x,
  y,
  containerWidth,
  footer,
}: {
  title: React.ReactNode;
  rows: TooltipRow[];
  x: number;
  y: number;
  containerWidth: number;
  footer?: React.ReactNode;
}) {
  // Sit right of the anchor; flip left near the right edge.
  const flip = x > containerWidth * 0.6;
  return (
    <div
      role="presentation"
      className="bg-popover text-popover-foreground pointer-events-none absolute z-10 min-w-36 rounded-lg border px-2.5 py-2 text-xs shadow-lg"
      style={{
        left: x,
        top: y,
        transform: `translate(${flip ? "calc(-100% - 12px)" : "12px"}, -50%)`,
      }}
    >
      <p className="text-muted-foreground mb-1.5 font-medium">{title}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.key} className={cn("flex items-center gap-2", row.muted && "opacity-50")}>
            <span aria-hidden className="h-0.5 w-2.5 shrink-0 rounded-full" style={{ background: row.color }} />
            <span className="text-foreground font-semibold tabular-nums">{row.value}</span>
            <span className="text-muted-foreground truncate">{row.label}</span>
          </li>
        ))}
      </ul>
      {footer && <div className="text-muted-foreground mt-1.5 border-t pt-1.5">{footer}</div>}
    </div>
  );
}

export type ChartTable = {
  columns: { key: string; label: string; numeric?: boolean }[];
  rows: Record<string, React.ReactNode>[];
};

export interface ChartFrameProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** A headline figure above the plot, e.g. the period total. */
  headline?: React.ReactNode;
  /** Controls at the top right, before the view switch. */
  actions?: React.ReactNode;
  legend?: { items: LegendItem[]; shape: LegendShape; onToggle: (key: string) => void; onIsolate: (key: string) => void };
  /** The accessible twin of the chart. */
  table: ChartTable;
  /** Dims the current render while new data loads, instead of a skeleton. */
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: React.ReactNode;
  /** Hide the card chrome (border, background, padding) to embed the chart in your own card. */
  bare?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ChartFrame({
  title,
  description,
  headline,
  actions,
  legend,
  table,
  loading,
  empty,
  emptyMessage = "No data for this period.",
  bare,
  className,
  children,
}: ChartFrameProps) {
  const [view, setView] = React.useState<"chart" | "table">("chart");
  const headingId = React.useId();

  return (
    <figure
      data-slot="chart"
      aria-labelledby={title ? headingId : undefined}
      className={cn(
        "text-card-foreground flex min-w-0 flex-col gap-3",
        !bare && "bg-card rounded-xl border p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          {title && (
            <figcaption id={headingId} className="text-sm font-semibold">
              {title}
            </figcaption>
          )}
          {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
          {headline && <div className="mt-2">{headline}</div>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <div role="group" aria-label="View" className="bg-muted flex rounded-md p-0.5">
            {(
              [
                ["chart", BarChart3Icon, "Chart view"],
                ["table", TableIcon, "Table view"],
              ] as const
            ).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                aria-label={label}
                title={label}
                onClick={() => setView(value)}
                className={cn(
                  "text-muted-foreground focus-visible:ring-ring/50 grid size-6 place-items-center rounded-[5px] transition-colors outline-none focus-visible:ring-2",
                  view === value ? "bg-card text-foreground shadow-xs" : "hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {legend && legend.items.length > 1 && (
        <ChartLegend
          items={legend.items}
          shape={legend.shape}
          onToggle={legend.onToggle}
          onIsolate={legend.onIsolate}
        />
      )}

      <div
        aria-busy={loading || undefined}
        className={cn("relative min-w-0 transition-opacity duration-300", loading && "opacity-50")}
      >
        {empty ? (
          <div className="text-muted-foreground grid min-h-40 place-items-center rounded-md border border-dashed text-sm">
            {emptyMessage}
          </div>
        ) : view === "chart" ? (
          children
        ) : (
          <div className="max-h-80 overflow-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  {table.columns.map((column) => (
                    <TableHead key={column.key} className={cn("h-8 text-xs", column.numeric && "text-right")}>
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map((row, i) => (
                  <TableRow key={i}>
                    {table.columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn("py-1.5 text-xs", column.numeric && "text-right tabular-nums")}
                      >
                        {row[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </figure>
  );
}
