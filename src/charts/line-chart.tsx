"use client";

import * as React from "react";

import { ChartFrame, ChartTooltip, useSeriesVisibility, type ChartFrameProps } from "./chart-frame";
import {
  approxTextWidth,
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

type Point = [number, number];

export interface LineChartProps<T> extends Omit<ChartFrameProps, "legend" | "table" | "children" | "empty"> {
  data: readonly T[];
  /** Field for the x axis: dates, labels or numbers, in order. */
  x: keyof T & string;
  series: ChartSeries<T>[];
  /** Height of the plot including the x-axis labels, in px. */
  height?: number;
  /** Formats values in the tooltip, labels and table. Axis ticks use a compact form. */
  formatValue?: (value: number) => string;
  formatX?: (value: T[keyof T], row: T) => string;
  /** "smooth" uses a monotone curve, which never overshoots the data. */
  curve?: "linear" | "smooth";
  /** Start the y axis at 0. */
  zeroBaseline?: boolean;
  /** Label each line's end with its name (or its value, for one series). Dropped if labels would collide. */
  endLabels?: boolean;
  /** Dots on every point, for print or low-vision readers. */
  markers?: boolean;
}

export interface AreaChartProps<T> extends LineChartProps<T> {
  /** Stack series on top of each other, for part-to-whole over time. */
  stacked?: boolean;
}

function linearPath(points: Point[]) {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("");
}

// Monotone cubic interpolation (Fritsch–Carlson): smooth, but never invents a
// peak or dip between two points.
function smoothPath(points: Point[], continuing = false) {
  const n = points.length;
  if (n < 3) return continuing ? points.map(([x, y]) => `L${x},${y}`).join("") : linearPath(points);
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0];
    slope[i] = (points[i + 1][1] - points[i][1]) / (dx[i] || 1);
  }
  const tangent: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    tangent[i] =
      slope[i - 1] * slope[i] <= 0
        ? 0
        : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]);
  }
  tangent[n - 1] = slope[n - 2];
  let d = continuing ? `L${points[0][0]},${points[0][1]}` : `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += `C${x0 + h},${y0 + tangent[i] * h} ${x1 - h},${y1 - tangent[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}

/** Splits at missing values, so a gap in the data is a gap in the line. */
function segments(values: (number | null)[]) {
  const result: number[][] = [];
  let current: number[] = [];
  values.forEach((v, i) => {
    if (v === null) {
      if (current.length) result.push(current);
      current = [];
    } else current.push(i);
  });
  if (current.length) result.push(current);
  return result;
}

const PAD_TOP = 10;
const X_AXIS = 26;
const END_LABEL_GAP = 14;

function CartesianLines<T>({
  variant,
  stacked = false,
  data,
  x,
  series,
  height = 260,
  formatValue = formatFull,
  formatX,
  curve = "linear",
  zeroBaseline,
  endLabels = true,
  markers = false,
  ...frame
}: AreaChartProps<T> & { variant: "line" | "area" }) {
  const resolved = React.useMemo(() => resolveSeries(series), [series]);
  const { hidden, toggle, isolate } = useSeriesVisibility(resolved.map((s) => s.key));
  const visible = resolved.filter((s) => !hidden.has(s.key));
  const [wrapperRef, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = React.useState<number | null>(null);
  const isStacked = variant === "area" && stacked;
  const zero = zeroBaseline ?? variant === "area";
  const n = data.length;

  const labelOf = (i: number) => (formatX ? formatX(data[i][x], data[i]) : formatCategory(data[i][x]));

  // Per visible series: the drawn top values, and the base for stacked areas.
  const layers = React.useMemo(() => {
    const running = new Array<number>(n).fill(0);
    return visible.map((s) => {
      const raw = data.map((row) => readNumber(row, s.key));
      if (!isStacked) return { series: s, raw, top: raw, base: null as number[] | null };
      const base = [...running];
      const top = raw.map((v, i) => (running[i] += v ?? 0));
      return { series: s, raw, top: top as (number | null)[], base };
    });
  }, [data, visible.map((s) => s.key).join(), isStacked, n]); // eslint-disable-line react-hooks/exhaustive-deps

  const all = layers.flatMap((l) => l.top.filter((v): v is number => v !== null));
  let min = all.length ? Math.min(...all) : 0;
  let max = all.length ? Math.max(...all) : 1;
  if (zero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  const plotBottom = height - X_AXIS;
  const ticks = niceTicks(min, max, Math.max(3, Math.round((plotBottom - PAD_TOP) / 56)));
  const y = linear([ticks[0], ticks[ticks.length - 1]], [plotBottom, PAD_TOP]);

  // End labels: name for several series, value for one. Skip them when they'd collide.
  const ends = endLabels
    ? layers
        .map((layer) => {
          let last = layer.top.length - 1;
          while (last >= 0 && layer.top[last] === null) last--;
          if (last < 0) return null;
          const text = resolved.length > 1 ? layer.series.label : formatValue(layer.raw[last]!);
          return { key: layer.series.key, index: last, y: y(layer.top[last]!), text };
        })
        .filter((e): e is NonNullable<typeof e> => e !== null)
    : [];
  const sortedEnds = [...ends].sort((a, b) => a.y - b.y);
  const collide = sortedEnds.some((e, i) => i > 0 && e.y - sortedEnds[i - 1].y < 13);
  const showEnds = ends.length > 0 && ends.length <= 4 && !collide;

  const tickLabel = (t: number) => (formatValue === formatFull ? formatCompact(t) : formatValue(t));
  const left = Math.max(...ticks.map((t) => approxTextWidth(tickLabel(t)))) + 12;
  const right = width - (showEnds ? Math.max(...ends.map((e) => approxTextWidth(e.text))) + END_LABEL_GAP + 6 : 10);
  const xAt = (i: number) => (n <= 1 ? (left + right) / 2 : left + (i * (right - left)) / (n - 1));

  // X labels: thin them out so they never overlap.
  const labelWidth = Math.max(0, ...data.map((_, i) => approxTextWidth(labelOf(i)))) + 12;
  const spacing = n > 1 ? (right - left) / (n - 1) : right - left;
  const every = Math.max(1, Math.ceil(labelWidth / Math.max(spacing, 1)));

  const pathFor = (indices: number[], values: (number | null)[]) => {
    const points = indices.map((i) => [xAt(i), y(values[i]!)] as Point);
    return curve === "smooth" ? smoothPath(points) : linearPath(points);
  };

  const pick = (clientX: number, rect: DOMRect) => {
    if (n === 0) return;
    const px = clientX - rect.left;
    setActive(Math.max(0, Math.min(n - 1, Math.round(((px - left) / Math.max(right - left, 1)) * (n - 1)))));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
    if (e.key === "Escape") return setActive(null);
    if (!(e.key in keys)) return;
    e.preventDefault();
    const step = keys[e.key];
    setActive((current) =>
      Math.max(0, Math.min(n - 1, Number.isFinite(step) ? (current ?? (step > 0 ? -1 : n)) + step : step > 0 ? n - 1 : 0)),
    );
  };

  const tooltipRows =
    active === null
      ? []
      : layers.map((layer) => ({
          key: layer.series.key,
          label: layer.series.label,
          color: layer.series.color,
          value: layer.raw[active] === null ? "–" : formatValue(layer.raw[active]!),
          muted: layer.raw[active] === null,
        }));
  const total =
    isStacked && active !== null && layers.length > 1
      ? layers.reduce((sum, l) => sum + (l.raw[active] ?? 0), 0)
      : null;

  const table = {
    columns: [
      { key: "__x", label: String(x) },
      ...resolved.map((s) => ({ key: s.key, label: s.label, numeric: true })),
    ],
    rows: data.map((row, i) => ({
      __x: labelOf(i),
      ...Object.fromEntries(
        resolved.map((s) => {
          const v = readNumber(row, s.key);
          return [s.key, v === null ? "–" : formatValue(v)];
        }),
      ),
    })),
  };

  const readout =
    active === null
      ? ""
      : `${labelOf(active)}: ${tooltipRows.map((r) => `${r.label} ${r.value}`).join(", ")}`;

  return (
    <ChartFrame
      {...frame}
      empty={n === 0}
      table={table}
      legend={{
        items: resolved.map((s) => ({ key: s.key, label: s.label, color: s.color, hidden: hidden.has(s.key) })),
        shape: variant === "line" ? "line" : "rect",
        onToggle: toggle,
        onIsolate: isolate,
      }}
    >
      <div
        ref={wrapperRef}
        role="group"
        aria-roledescription="chart"
        aria-label={`${variant === "line" ? "Line" : "Area"} chart, ${n} points. Use the arrow keys to read values.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        className="focus-visible:ring-ring/50 relative rounded-md outline-none focus-visible:ring-2"
        style={{ height }}
      >
        {width > 0 && (
          <svg
            width={width}
            height={height}
            className="block touch-pan-y overflow-visible"
            onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
            onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
            onPointerLeave={() => setActive(null)}
          >
            {/* Grid and y ticks */}
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={left}
                  x2={right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"}
                  strokeWidth={1}
                  shapeRendering="crispEdges"
                />
                <text
                  x={left - 8}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px] tabular-nums"
                >
                  {tickLabel(t)}
                </text>
              </g>
            ))}

            {/* X labels */}
            {data.map((_, i) =>
              i % every === 0 ? (
                <text
                  key={i}
                  x={xAt(i)}
                  y={plotBottom + 18}
                  // Centred under the point; only pulled inward where it would leave the chart.
                  textAnchor={
                    xAt(i) - approxTextWidth(labelOf(i)) / 2 < 0
                      ? "start"
                      : xAt(i) + approxTextWidth(labelOf(i)) / 2 > width
                        ? "end"
                        : "middle"
                  }
                  className="fill-muted-foreground text-[11px]"
                >
                  {labelOf(i)}
                </text>
              ) : null,
            )}

            {/* Area washes */}
            {variant === "area" &&
              layers.map((layer) =>
                segments(layer.top).map((indices) => {
                  const top = pathFor(indices, layer.top);
                  // Stacked: down to the layer below. Otherwise: down to 0, or the nearest edge of the axis.
                  const floor = Math.min(Math.max(0, ticks[0]), ticks.at(-1)!);
                  const basePoints = [...indices]
                    .reverse()
                    .map((i) => [xAt(i), y(layer.base ? layer.base[i] : floor)] as Point);
                  const base =
                    curve === "smooth" && layer.base
                      ? smoothPath(basePoints, true)
                      : basePoints.map(([px, py]) => `L${px},${py}`).join("");
                  return (
                    <path
                      key={`${layer.series.key}-${indices[0]}`}
                      d={`${top}${base}Z`}
                      fill={layer.series.color}
                      fillOpacity={isStacked ? 0.16 : 0.1}
                    />
                  );
                }),
              )}

            {/* Lines */}
            {layers.map((layer) =>
              segments(layer.top).map((indices) => (
                <path
                  key={`${layer.series.key}-${indices[0]}`}
                  d={pathFor(indices, layer.top)}
                  fill="none"
                  stroke={layer.series.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )),
            )}

            {markers &&
              layers.map((layer) =>
                layer.top.map((v, i) =>
                  v === null ? null : (
                    <circle
                      key={`${layer.series.key}-m${i}`}
                      cx={xAt(i)}
                      cy={y(v)}
                      r={3.5}
                      fill={layer.series.color}
                      stroke="var(--card)"
                      strokeWidth={2}
                    />
                  ),
                ),
              )}

            {/* End labels, with an end dot so the label reads as attached */}
            {showEnds &&
              ends.map((end) => {
                const layer = layers.find((l) => l.series.key === end.key)!;
                return (
                  <g key={end.key}>
                    <circle cx={xAt(end.index)} cy={end.y} r={4} fill={layer.series.color} stroke="var(--card)" strokeWidth={2} />
                    <text
                      x={xAt(end.index) + END_LABEL_GAP - 4}
                      y={end.y}
                      dy="0.32em"
                      className="fill-foreground text-[11px] font-medium"
                    >
                      {end.text}
                    </text>
                  </g>
                );
              })}

            {/* Crosshair */}
            {active !== null && (
              <g pointerEvents="none">
                <line
                  x1={xAt(active)}
                  x2={xAt(active)}
                  y1={PAD_TOP}
                  y2={plotBottom}
                  className="stroke-foreground/25"
                  strokeWidth={1}
                  shapeRendering="crispEdges"
                />
                {layers.map((layer) =>
                  layer.top[active] === null ? null : (
                    <circle
                      key={layer.series.key}
                      cx={xAt(active)}
                      cy={y(layer.top[active]!)}
                      r={4.5}
                      fill={layer.series.color}
                      stroke="var(--card)"
                      strokeWidth={2}
                    />
                  ),
                )}
              </g>
            )}

            {/* Hit area: the whole plot, so the reader aims at a date, not a 2px line. */}
            <rect x={0} y={0} width={width} height={height} fill="transparent" />
          </svg>
        )}

        {active !== null && width > 0 && (
          <ChartTooltip
            title={labelOf(active)}
            rows={tooltipRows}
            x={xAt(active)}
            y={Math.min(
              ...layers.map((l) => (l.top[active] === null ? plotBottom : y(l.top[active]!))),
              plotBottom - 20,
            )}
            containerWidth={width}
            footer={
              total !== null ? (
                <span>
                  Total <span className="text-foreground font-semibold tabular-nums">{formatValue(total)}</span>
                </span>
              ) : undefined
            }
          />
        )}
        <span aria-live="polite" className="sr-only">
          {readout}
        </span>
      </div>
    </ChartFrame>
  );
}

function LineChart<T>(props: LineChartProps<T>) {
  return <CartesianLines {...props} variant="line" />;
}

function AreaChart<T>(props: AreaChartProps<T>) {
  return <CartesianLines {...props} variant="area" />;
}

export { LineChart, AreaChart };
