"use client";

import * as React from "react";

import { ChartFrame, ChartTooltip, useSeriesVisibility, type ChartFrameProps } from "./chart-frame";
import {
  approxTextWidth,
  barPath,
  formatCategory,
  formatCompact,
  formatFull,
  linear,
  niceTicks,
  readNumber,
  resolveSeries,
  useElementWidth,
  type ChartSeries,
} from "./utils";

export interface BarChartProps<T> extends Omit<ChartFrameProps, "legend" | "table" | "children" | "empty"> {
  data: readonly T[];
  /** Category field. */
  x: keyof T & string;
  series: ChartSeries<T>[];
  orientation?: "vertical" | "horizontal";
  /** Stack series into one bar per category, for part-to-whole. */
  stacked?: boolean;
  /**
   * Vertical: height of the plot including axis labels. Horizontal: defaults
   * to fit every row.
   */
  height?: number;
  formatValue?: (value: number) => string;
  formatX?: (value: T[keyof T], row: T) => string;
  /** Print each bar's value at its tip (the total, when stacked). */
  showValues?: boolean;
  /** One series only: bars that return false are greyed, to tell one story. */
  highlight?: (row: T) => boolean;
}

const MAX_THICKNESS = 24;
const GAP = 2;
const AXIS = 26;
const PAD = 10;

function truncate(text: string, maxWidth: number) {
  if (approxTextWidth(text) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && approxTextWidth(`${t}…`) > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function BarChart<T>({
  data,
  x,
  series,
  orientation = "vertical",
  stacked = false,
  height: heightProp,
  formatValue = formatFull,
  formatX,
  showValues = false,
  highlight,
  ...frame
}: BarChartProps<T>) {
  const resolved = React.useMemo(() => resolveSeries(series), [series]);
  const { hidden, toggle, isolate } = useSeriesVisibility(resolved.map((s) => s.key));
  const visible = resolved.filter((s) => !hidden.has(s.key));
  const [wrapperRef, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = React.useState<number | null>(null);
  const horizontal = orientation === "horizontal";
  const n = data.length;
  const k = stacked ? 1 : Math.max(visible.length, 1);

  const labelOf = (i: number) => (formatX ? formatX(data[i][x], data[i]) : formatCategory(data[i][x]));
  const values = data.map((row) => visible.map((s) => readNumber(row, s.key)));

  // Value extent: per-bar for grouped; positive and negative stacks for stacked.
  const extents = values.flatMap((vs) => {
    if (!stacked) return vs.filter((v): v is number => v !== null);
    const pos = vs.reduce<number>((sum, v) => sum + Math.max(v ?? 0, 0), 0);
    const neg = vs.reduce<number>((sum, v) => sum + Math.min(v ?? 0, 0), 0);
    return [pos, neg];
  });
  // Fewer value ticks on a narrow horizontal axis, so their labels never touch.
  const tickCount = horizontal ? Math.max(2, Math.min(5, Math.floor(width / 110))) : 5;
  const ticks = niceTicks(Math.min(0, ...extents), Math.max(0, ...extents), tickCount);
  const tickLabel = (t: number) => (formatValue === formatFull ? formatCompact(t) : formatValue(t));
  const totals = values.map((vs) => vs.reduce<number>((sum, v) => sum + (v ?? 0), 0));
  const valueLabels = showValues
    ? values.map((vs, i) => (stacked ? [formatValue(totals[i])] : vs.map((v) => (v === null ? "" : formatValue(v)))))
    : null;
  const longestValueLabel = valueLabels ? Math.max(0, ...valueLabels.flat().map((t) => approxTextWidth(t))) : 0;

  // Band thickness: a row per category when horizontal, fitted to its bars.
  const rowBand = Math.max(32, k * MAX_THICKNESS + (k - 1) * GAP + 14);
  const height = heightProp ?? (horizontal ? n * rowBand + AXIS + PAD : 280);

  // Plot box.
  let left: number, right: number, top: number, bottom: number;
  let categoryLabelWidth = 0;
  if (horizontal) {
    categoryLabelWidth = Math.min(Math.max(0, ...data.map((_, i) => approxTextWidth(labelOf(i)))), width * 0.35);
    left = categoryLabelWidth + 12;
    right = width - Math.max(12, valueLabels ? longestValueLabel + 10 : 0, approxTextWidth(tickLabel(ticks.at(-1)!)) / 2);
    top = 4;
    bottom = height - AXIS;
  } else {
    left = Math.max(...ticks.map((t) => approxTextWidth(tickLabel(t)))) + 12;
    right = width - 8;
    top = valueLabels ? PAD + 14 : PAD;
    bottom = height - AXIS;
  }

  const categoryLength = horizontal ? bottom - top : right - left;
  const band = n ? categoryLength / n : 0;
  const thickness = Math.max(
    2,
    Math.min(MAX_THICKNESS, stacked ? band * 0.6 : (band * 0.72 - (k - 1) * GAP) / k),
  );
  const groupWidth = k * thickness + (k - 1) * GAP;
  const value = horizontal
    ? linear([ticks[0], ticks.at(-1)!], [left, right])
    : linear([ticks[0], ticks.at(-1)!], [bottom, top]);
  const zero = value(0);

  /** A bar from v0 to v1 at category offset `at` (px along the category axis). */
  const bar = (at: number, v0: number, v1: number, rounded: boolean, gapAtBase: boolean) => {
    let p0 = value(v0);
    const p1 = value(v1);
    const sign = Math.sign(p1 - p0) || 1;
    if (gapAtBase) p0 += sign * GAP;
    const lo = Math.min(p0, p1);
    const len = Math.abs(p1 - p0);
    if (len < 0.5) return "";
    const growsPositive = v1 >= v0;
    if (horizontal) {
      return barPath(lo, at, len, thickness, growsPositive ? "right" : "left", rounded ? 4 : 0);
    }
    return barPath(at, lo, thickness, len, growsPositive ? "up" : "down", rounded ? 4 : 0);
  };

  const bandStart = (i: number) => (horizontal ? top : left) + i * band;
  const groupStart = (i: number) => bandStart(i) + (band - groupWidth) / 2;

  // Labels along the category axis (vertical charts): thin out so they never overlap.
  const every = horizontal
    ? 1
    : Math.max(1, Math.ceil((Math.max(0, ...data.map((_, i) => approxTextWidth(labelOf(i)))) + 10) / Math.max(band, 1)));

  const onKeyDown = (e: React.KeyboardEvent) => {
    const next: Record<string, number> = horizontal ? { ArrowDown: 1, ArrowUp: -1 } : { ArrowRight: 1, ArrowLeft: -1 };
    if (e.key === "Escape") return setActive(null);
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      return setActive(e.key === "Home" ? 0 : n - 1);
    }
    const step = next[e.key];
    if (!step) return;
    e.preventDefault();
    setActive((current) => Math.max(0, Math.min(n - 1, (current ?? (step > 0 ? -1 : n)) + step)));
  };

  const tooltipRows =
    active === null
      ? []
      : visible.map((s, j) => ({
          key: s.key,
          label: s.label,
          color: highlight && !highlight(data[active]) ? "var(--viz-muted)" : s.color,
          value: values[active][j] === null ? "–" : formatValue(values[active][j]!),
          muted: values[active][j] === null,
        }));

  const table = {
    columns: [
      { key: "__x", label: String(x) },
      ...resolved.map((s) => ({ key: s.key, label: s.label, numeric: true })),
      ...(stacked && resolved.length > 1 ? [{ key: "__total", label: "Total", numeric: true }] : []),
    ],
    rows: data.map((row, i) => {
      const cells: Record<string, React.ReactNode> = { __x: labelOf(i) };
      let total = 0;
      for (const s of resolved) {
        const v = readNumber(row, s.key);
        total += v ?? 0;
        cells[s.key] = v === null ? "–" : formatValue(v);
      }
      if (stacked) cells.__total = formatValue(total);
      return cells;
    }),
  };

  const anchor =
    active === null
      ? null
      : horizontal
        ? { x: Math.min(value(Math.max(0, stacked ? totals[active] : Math.max(0, ...values[active].map((v) => v ?? 0)))), right), y: bandStart(active) + band / 2 }
        : { x: bandStart(active) + band / 2, y: Math.max(top + 20, value(Math.max(0, stacked ? totals[active] : Math.max(0, ...values[active].map((v) => v ?? 0))))) };

  return (
    <ChartFrame
      {...frame}
      empty={n === 0}
      table={table}
      legend={{
        items: resolved.map((s) => ({ key: s.key, label: s.label, color: s.color, hidden: hidden.has(s.key) })),
        shape: "rect",
        onToggle: toggle,
        onIsolate: isolate,
      }}
    >
      <div
        ref={wrapperRef}
        role="group"
        aria-roledescription="chart"
        aria-label={`Bar chart, ${n} categories. Use the arrow keys to read values.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        className="focus-visible:ring-ring/50 relative rounded-md outline-none focus-visible:ring-2"
        style={{ height }}
      >
        {width > 0 && (
          <svg width={width} height={height} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
            {/* Grid and value ticks */}
            {ticks.map((t) =>
              horizontal ? (
                <g key={t}>
                  <line x1={value(t)} x2={value(t)} y1={top} y2={bottom} stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"} shapeRendering="crispEdges" />
                  <text x={value(t)} y={bottom + 18} textAnchor="middle" className="fill-muted-foreground text-[11px] tabular-nums">
                    {tickLabel(t)}
                  </text>
                </g>
              ) : (
                <g key={t}>
                  <line x1={left} x2={right} y1={value(t)} y2={value(t)} stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"} shapeRendering="crispEdges" />
                  <text x={left - 8} y={value(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                    {tickLabel(t)}
                  </text>
                </g>
              ),
            )}

            {data.map((row, i) => {
              const dimmed = active !== null && active !== i;
              const greyed = highlight ? !highlight(row) : false;
              const bars: React.ReactNode[] = [];

              if (stacked) {
                // Positive and negative stacks grow away from 0 separately.
                let pos = 0;
                let neg = 0;
                const outerPos = values[i].reduce<number>((last, v, j) => ((v ?? 0) > 0 ? j : last), -1);
                const outerNeg = values[i].reduce<number>((last, v, j) => ((v ?? 0) < 0 ? j : last), -1);
                visible.forEach((s, j) => {
                  const v = values[i][j] ?? 0;
                  if (v === 0) return;
                  const from = v > 0 ? pos : neg;
                  const to = from + v;
                  const isFirst = v > 0 ? pos === 0 : neg === 0;
                  if (v > 0) pos = to;
                  else neg = to;
                  bars.push(
                    <path
                      key={s.key}
                      d={bar(groupStart(i), from, to, j === (v > 0 ? outerPos : outerNeg), !isFirst)}
                      fill={greyed ? "var(--viz-muted)" : s.color}
                    />,
                  );
                });
              } else {
                visible.forEach((s, j) => {
                  const v = values[i][j];
                  if (v === null) return;
                  bars.push(
                    <path
                      key={s.key}
                      d={bar(groupStart(i) + j * (thickness + GAP), 0, v, true, false)}
                      fill={greyed ? "var(--viz-muted)" : s.color}
                    />,
                  );
                });
              }

              return (
                <g key={i}>
                  {active === i && (
                    <rect
                      x={horizontal ? left : bandStart(i)}
                      y={horizontal ? bandStart(i) : top}
                      width={horizontal ? right - left : band}
                      height={horizontal ? band : bottom - top}
                      rx={4}
                      className="fill-muted/60"
                    />
                  )}
                  <g style={{ opacity: dimmed ? 0.45 : 1, transition: "opacity 120ms" }}>{bars}</g>

                  {/* Value labels, outside the bar end so they're never clipped. */}
                  {valueLabels &&
                    valueLabels[i].map((text, j) => {
                      if (!text) return null;
                      const v = stacked ? totals[i] : values[i][j]!;
                      const at = stacked ? groupStart(i) + thickness / 2 : groupStart(i) + j * (thickness + GAP) + thickness / 2;
                      const end = value(v);
                      return horizontal ? (
                        <text key={j} x={end + (v >= 0 ? 6 : -6)} y={at} dy="0.32em" textAnchor={v >= 0 ? "start" : "end"} className="fill-foreground text-[11px] font-medium tabular-nums">
                          {text}
                        </text>
                      ) : (
                        <text key={j} x={at} y={end + (v >= 0 ? -6 : 14)} textAnchor="middle" className="fill-foreground text-[11px] font-medium tabular-nums">
                          {text}
                        </text>
                      );
                    })}

                  {/* Category label */}
                  {horizontal ? (
                    <text x={left - 10} y={bandStart(i) + band / 2} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px]">
                      <title>{labelOf(i)}</title>
                      {truncate(labelOf(i), categoryLabelWidth)}
                    </text>
                  ) : i % every === 0 ? (
                    <text x={bandStart(i) + band / 2} y={bottom + 18} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                      {labelOf(i)}
                    </text>
                  ) : null}

                  {/* The whole band is the hit target, never just the painted bar. */}
                  <rect
                    x={horizontal ? 0 : bandStart(i)}
                    y={horizontal ? bandStart(i) : 0}
                    width={horizontal ? width : band}
                    height={horizontal ? band : height}
                    fill="transparent"
                    onPointerEnter={() => setActive(i)}
                    onPointerDown={() => setActive(i)}
                  />
                </g>
              );
            })}

            {/* Redraw the zero line over the bars' square ends. */}
            {horizontal ? (
              <line x1={zero} x2={zero} y1={top} y2={bottom} stroke="var(--viz-axis)" shapeRendering="crispEdges" pointerEvents="none" />
            ) : (
              <line x1={left} x2={right} y1={zero} y2={zero} stroke="var(--viz-axis)" shapeRendering="crispEdges" pointerEvents="none" />
            )}
          </svg>
        )}

        {active !== null && anchor && width > 0 && (
          <ChartTooltip
            title={labelOf(active)}
            rows={tooltipRows}
            x={anchor.x}
            y={anchor.y}
            containerWidth={width}
            footer={
              stacked && visible.length > 1 ? (
                <span>
                  Total <span className="text-foreground font-semibold tabular-nums">{formatValue(totals[active])}</span>
                </span>
              ) : undefined
            }
          />
        )}
        <span aria-live="polite" className="sr-only">
          {active === null ? "" : `${labelOf(active)}: ${tooltipRows.map((r) => `${r.label} ${r.value}`).join(", ")}`}
        </span>
      </div>
    </ChartFrame>
  );
}

export { BarChart };
