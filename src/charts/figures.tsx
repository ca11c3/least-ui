"use client";

import * as React from "react";
import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon, OctagonAlertIcon, TriangleAlertIcon } from "lucide-react";

import { cn } from "../lib/utils";
import { formatCompact, linear, useElementWidth } from "./utils";

export interface SparklineProps {
  data: readonly (number | null)[];
  height?: number;
  /** Colour of the latest segment and end dot; the rest of the line recedes. */
  color?: string;
  /** Draw the whole line in `color` instead of receding the history. */
  emphasizeAll?: boolean;
  /** A faint wash under the line. */
  area?: boolean;
  /** Describes the trend for screen readers, e.g. "Revenue over 12 months". */
  label?: string;
  className?: string;
}

/** A word-sized trend line, with the current period in the accent colour. */
export function Sparkline({
  data,
  height = 32,
  color = "var(--viz-1)",
  emphasizeAll = false,
  area = false,
  label,
  className,
}: SparklineProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const points = data.map((v, i) => [i, v] as const).filter((p): p is readonly [number, number] => p[1] !== null);
  const values = points.map((p) => p[1]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 4;
  const x = linear([0, Math.max(data.length - 1, 1)], [pad, width - pad]);
  const y = linear([min, max === min ? min + 1 : max], [height - pad, pad]);
  const d = points.map(([i, v], j) => `${j ? "L" : "M"}${x(i)},${y(v)}`).join("");
  const last = points.at(-1);
  const prev = points.at(-2);
  const summary =
    label ??
    (values.length
      ? `Trend: from ${formatCompact(values[0])} to ${formatCompact(values.at(-1)!)}, low ${formatCompact(min)}, high ${formatCompact(max)}`
      : "No data");

  return (
    <div ref={ref} role="img" aria-label={summary} className={cn("w-full", className)} style={{ height }}>
      {width > 0 && points.length > 0 && (
        <svg width={width} height={height} className="block overflow-visible">
          {area && (
            <path d={`${d}L${x(last![0])},${height}L${x(points[0][0])},${height}Z`} fill={color} fillOpacity={0.1} />
          )}
          <path
            d={d}
            fill="none"
            stroke={emphasizeAll ? color : "var(--viz-muted)"}
            strokeWidth={emphasizeAll ? 2 : 1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {!emphasizeAll && prev && last && (
            <path
              d={`M${x(prev[0])},${y(prev[1])}L${x(last[0])},${y(last[1])}`}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          )}
          {last && <circle cx={x(last[0])} cy={y(last[1])} r={3.5} fill={color} stroke="var(--card)" strokeWidth={2} />}
        </svg>
      )}
    </div>
  );
}

export interface StatTileProps {
  label: React.ReactNode;
  value: number | string;
  /** Formats a numeric `value`. Defaults to a compact form: 1,284 · 12.9K · 4.2M. */
  format?: (value: number) => string;
  /**
   * Change against a named period. `value` is a fraction for "percent"
   * (0.124 → +12.4%) or an absolute change for "number".
   */
  delta?: {
    value: number;
    /** e.g. "vs last month" */
    period?: string;
    format?: "percent" | "number";
    /** Which direction is good news. Defaults to "up"; use "down" for costs, errors, latency. */
    good?: "up" | "down";
  };
  /** Recent values, oldest first; drawn as a sparkline under the figure. */
  trend?: readonly (number | null)[];
  trendColor?: string;
  /** Shows the value as the page's hero figure. */
  size?: "default" | "hero";
  className?: string;
}

const percent = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });
const signed = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, signDisplay: "exceptZero" });

export function StatTile({
  label,
  value,
  format = formatCompact,
  delta,
  trend,
  trendColor,
  size = "default",
  className,
}: StatTileProps) {
  const direction = delta ? Math.sign(delta.value) : 0;
  const good = direction === 0 ? null : (direction > 0) === ((delta?.good ?? "up") === "up");
  const DeltaIcon = direction > 0 ? ArrowUpRightIcon : direction < 0 ? ArrowDownRightIcon : ArrowRightIcon;

  return (
    <div data-slot="stat-tile" className={cn("bg-card text-card-foreground flex min-w-0 flex-col gap-1 rounded-xl border p-4", className)}>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className={cn("font-semibold tracking-tight", size === "hero" ? "text-5xl" : "text-2xl")}>
        {typeof value === "number" ? format(value) : value}
      </p>
      {delta && (
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              good === true && "text-(--viz-good-text)",
              good === false && "text-(--viz-bad-text)",
              good === null && "text-muted-foreground",
            )}
          >
            <DeltaIcon className="size-3.5" aria-hidden />
            {(delta.format ?? "percent") === "percent" ? percent.format(delta.value) : signed.format(delta.value)}
            <span className="sr-only">{good === null ? "(no change)" : good ? "(better)" : "(worse)"}</span>
          </span>
          {delta.period && <span className="text-muted-foreground">{delta.period}</span>}
        </p>
      )}
      {trend && trend.length > 1 && <Sparkline data={trend} color={trendColor} className="mt-2" />}
    </div>
  );
}

export interface MeterProps {
  label: React.ReactNode;
  value: number;
  max?: number;
  /** Values at which the meter turns to warning and critical. */
  thresholds?: { warning?: number; critical?: number };
  /** Whether high values are bad (usage, errors). Set false for goals, where low values are bad. */
  higherIsWorse?: boolean;
  format?: (value: number, max: number) => string;
  /** Text for each state, shown with an icon so state never relies on colour. */
  statusLabels?: { warning?: string; critical?: string };
  className?: string;
}

/** A progress track whose fill carries severity; the track is a lighter step of the same colour. */
export function Meter({
  label,
  value,
  max = 100,
  thresholds = {},
  higherIsWorse = true,
  format = (v, m) => `${Math.round((v / m) * 100)}%`,
  statusLabels = {},
  className,
}: MeterProps) {
  const ratio = Math.max(0, Math.min(1, value / (max || 1)));
  const past = (t: number | undefined) => t !== undefined && (higherIsWorse ? value >= t : value <= t);
  const state = past(thresholds.critical) ? "critical" : past(thresholds.warning) ? "warning" : "normal";
  const color = state === "critical" ? "var(--destructive)" : state === "warning" ? "var(--warning)" : "var(--viz-1)";
  const Icon = state === "critical" ? OctagonAlertIcon : TriangleAlertIcon;
  const labelId = React.useId();

  return (
    <div data-slot="meter" className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span id={labelId} className="text-muted-foreground">
          {label}
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          {state !== "normal" && (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-normal">
              <Icon className="size-3.5" style={{ color }} aria-hidden />
              {state === "critical" ? (statusLabels.critical ?? "Critical") : (statusLabels.warning ?? "Warning")}
            </span>
          )}
          {format(value, max)}
        </span>
      </div>
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={`${format(value, max)}${state === "normal" ? "" : `, ${state}`}`}
        className="h-2 overflow-hidden rounded-full"
        style={{ background: `color-mix(in srgb, ${color} 18%, var(--card))` }}
      >
        <div
          className="h-full rounded-full transition-[width,background-color] duration-500"
          style={{ width: `${ratio * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}
