"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import { ChartFrame, ChartTooltip, useSeriesVisibility, type ChartFrameProps } from "./chart-frame";
import {
  approxTextWidth,
  arcPath,
  formatCategory,
  formatCompact,
  formatFull,
  niceTicks,
  polar,
  readNumber,
  resolveSeries,
  sectorPath,
  useElementWidth,
  type ChartSeries,
  type SeriesColor,
} from "./utils";

type FrameProps = Omit<ChartFrameProps, "legend" | "table" | "children" | "empty">;

const TAU = Math.PI * 2;
const percentFormat = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 });

function slotColor(color: SeriesColor | undefined, index: number) {
  if (typeof color === "number") return `var(--viz-${color})`;
  return color ?? `var(--viz-${(index % 8) + 1})`;
}

/** Arrow keys cycle through `count` items; Escape clears. */
function cycleKeys(count: number, setActive: React.Dispatch<React.SetStateAction<number | null>>) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setActive(null);
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step || count === 0) return;
    e.preventDefault();
    setActive((current) => ((current ?? (step > 0 ? -1 : 0)) + step + count) % count);
  };
}

// ---------------------------------------------------------------------------
// Pie / donut

export interface PieChartProps<T> extends FrameProps {
  data: readonly T[];
  /** Field naming each slice. */
  label: keyof T & string;
  /** Field holding each slice's value. */
  value: keyof T & string;
  /** Per-slice colours, by label. Defaults to palette slots in data order. */
  colors?: Record<string, SeriesColor>;
  /** A ring with the total in the middle. Set false for a full pie. */
  donut?: boolean;
  /** Text under the total in the centre. */
  centerLabel?: string;
  /**
   * Slices past this fold into "Other", since more segments stop reading as
   * part-to-whole. Defaults to 6.
   */
  maxSlices?: number;
  formatValue?: (value: number) => string;
  /** Diameter in px; shrinks to fit narrow containers. */
  size?: number;
}

type Slice = { key: string; label: string; value: number; color: string };

function PieChart<T>({
  data,
  label,
  value,
  colors,
  donut = true,
  centerLabel = "Total",
  maxSlices = 6,
  formatValue = formatFull,
  size = 220,
  ...frame
}: PieChartProps<T>) {
  const [wrapperRef, width] = useElementWidth<HTMLDivElement>();
  // By key, not position: hiding a slice must not move the highlight to its neighbour.
  const [activeKey, setActiveKey] = React.useState<string | null>(null);

  const slices = React.useMemo<Slice[]>(() => {
    const all = data
      .map((row, index) => {
        const name = formatCategory(row[label]);
        return { key: name, label: name, value: Math.max(readNumber(row, value) ?? 0, 0), color: slotColor(colors?.[name], index) };
      })
      .filter((s) => s.value > 0);
    if (all.length <= maxSlices) return all;
    // Keep the largest, in their original order (so colours don't move), and fold the rest.
    const keep = new Set([...all].sort((a, b) => b.value - a.value).slice(0, maxSlices - 1).map((s) => s.key));
    const rest = all.filter((s) => !keep.has(s.key));
    return [
      ...all.filter((s) => keep.has(s.key)),
      { key: "__other", label: `Other (${rest.length})`, value: rest.reduce((sum, s) => sum + s.value, 0), color: "var(--viz-muted)" },
    ];
  }, [data, label, value, colors, maxSlices]);

  const { hidden, toggle, isolate } = useSeriesVisibility(slices.map((s) => s.key));
  const shown = slices.filter((s) => !hidden.has(s.key));
  const total = shown.reduce((sum, s) => sum + s.value, 0);

  const diameter = Math.max(120, Math.min(size, width || size));
  const cx = diameter / 2;
  const r1 = diameter / 2 - 6; // room for the hovered slice to grow
  const r0 = donut ? r1 * 0.64 : 0;

  let angle = 0;
  const arcs = shown.map((slice) => {
    const a0 = angle;
    angle += (slice.value / (total || 1)) * TAU;
    return { slice, a0, a1: angle };
  });
  const active = activeKey === null ? -1 : arcs.findIndex((a) => a.slice.key === activeKey);
  const activeSlice = active < 0 ? null : arcs[active];
  const setActive: React.Dispatch<React.SetStateAction<number | null>> = (next) => {
    const index = typeof next === "function" ? next(active < 0 ? null : active) : next;
    setActiveKey(index === null ? null : (arcs[index]?.slice.key ?? null));
  };

  const table = {
    columns: [
      { key: "label", label: String(label) },
      { key: "value", label: String(value), numeric: true },
      { key: "share", label: "Share", numeric: true },
    ],
    rows: slices.map((s) => ({
      label: s.label,
      value: formatValue(s.value),
      share: percentFormat.format(s.value / (slices.reduce((sum, x) => sum + x.value, 0) || 1)),
    })),
  };

  return (
    <ChartFrame {...frame} empty={slices.length === 0} table={table}>
      <div ref={wrapperRef} className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
        <div
          role="group"
          aria-roledescription="chart"
          aria-label={`${donut ? "Donut" : "Pie"} chart, ${shown.length} slices. Use the arrow keys to read each slice.`}
          tabIndex={0}
          onKeyDown={cycleKeys(arcs.length, setActive)}
          onBlur={() => setActive(null)}
          className="focus-visible:ring-ring/50 relative shrink-0 rounded-full outline-none focus-visible:ring-2"
          style={{ width: diameter, height: diameter }}
        >
          <svg width={diameter} height={diameter} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
            {arcs.map(({ slice, a0, a1 }, i) => (
              <path
                key={slice.key}
                d={sectorPath(cx, cx, r0, r1 + (active === i ? 5 : 0), a0, a1, arcs.length > 1 ? 2 : 0)}
                fill={slice.color}
                style={{ opacity: activeSlice && active !== i ? 0.45 : 1, transition: "opacity 120ms" }}
                onPointerEnter={() => setActive(i)}
                onPointerDown={() => setActive(i)}
              />
            ))}
          </svg>
          {/* The centre answers the hover: no floating tooltip covering the ring. */}
          {donut && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div className="max-w-[60%]">
                <p className="truncate text-xl font-semibold tracking-tight">
                  {formatValue(activeSlice ? activeSlice.slice.value : total)}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {activeSlice
                    ? `${activeSlice.slice.label} · ${percentFormat.format(activeSlice.slice.value / (total || 1))}`
                    : centerLabel}
                </p>
              </div>
            </div>
          )}
          {!donut && activeSlice && (
            <ChartTooltip
              title={activeSlice.slice.label}
              rows={[
                {
                  key: activeSlice.slice.key,
                  label: percentFormat.format(activeSlice.slice.value / (total || 1)),
                  value: formatValue(activeSlice.slice.value),
                  color: activeSlice.slice.color,
                },
              ]}
              x={polar(cx, cx, r1 * 0.6, (activeSlice.a0 + activeSlice.a1) / 2)[0]}
              y={polar(cx, cx, r1 * 0.6, (activeSlice.a0 + activeSlice.a1) / 2)[1]}
              containerWidth={diameter}
            />
          )}
          <span aria-live="polite" className="sr-only">
            {activeSlice
              ? `${activeSlice.slice.label}: ${formatValue(activeSlice.slice.value)}, ${percentFormat.format(activeSlice.slice.value / (total || 1))}`
              : ""}
          </span>
        </div>

        {/* The legend doubles as the direct labels: every slice with its value and share. */}
        <ul className="flex w-full min-w-0 flex-col gap-0.5 sm:max-w-72" aria-label="Slices">
          {slices.map((slice) => {
            const index = arcs.findIndex((a) => a.slice.key === slice.key);
            const isHidden = hidden.has(slice.key);
            return (
              <li key={slice.key}>
                <button
                  type="button"
                  aria-pressed={!isHidden}
                  title="Click to show or hide · double-click to isolate"
                  onClick={() => toggle(slice.key)}
                  onDoubleClick={() => isolate(slice.key)}
                  onPointerEnter={() => setActiveKey(index >= 0 ? slice.key : null)}
                  onPointerLeave={() => setActiveKey(null)}
                  className={cn(
                    "hover:bg-muted focus-visible:ring-ring/50 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm outline-none select-none focus-visible:ring-2",
                    activeKey === slice.key && index >= 0 && "bg-muted",
                    isHidden && "opacity-45",
                  )}
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={isHidden ? { boxShadow: `inset 0 0 0 1.5px ${slice.color}` } : { background: slice.color }}
                  />
                  <span className={cn("min-w-0 flex-1 truncate", isHidden && "line-through")}>{slice.label}</span>
                  <span className="font-medium tabular-nums">{formatValue(slice.value)}</span>
                  <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">
                    {isHidden ? "–" : percentFormat.format(slice.value / (total || 1))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </ChartFrame>
  );
}

// ---------------------------------------------------------------------------
// Radar

export interface RadarChartProps<T> extends FrameProps {
  /** One row per axis (spoke). */
  data: readonly T[];
  /** Field naming each axis. */
  x: keyof T & string;
  series: ChartSeries<T>[];
  /** Top of the scale. Defaults to a round number above the largest value. */
  max?: number;
  formatValue?: (value: number) => string;
  height?: number;
}

function RadarChart<T>({ data, x, series, max: maxProp, formatValue = formatFull, height = 320, ...frame }: RadarChartProps<T>) {
  const resolved = React.useMemo(() => resolveSeries(series), [series]);
  React.useEffect(() => {
    if (resolved.length > 3) {
      console.warn("RadarChart: past 3 series the overlapping shapes stop being distinguishable; use a bar chart or small multiples.");
    }
  }, [resolved.length]);
  const { hidden, toggle, isolate } = useSeriesVisibility(resolved.map((s) => s.key));
  const visible = resolved.filter((s) => !hidden.has(s.key));
  const [wrapperRef, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = React.useState<number | null>(null);
  const n = data.length;

  const labelOf = (i: number) => formatCategory(data[i][x]);
  const values = visible.map((s) => data.map((row) => readNumber(row, s.key)));
  const dataMax = Math.max(0, ...values.flat().filter((v): v is number => v !== null));
  const ticks = niceTicks(0, maxProp ?? dataMax, 4).filter((t) => t > 0);
  const max = maxProp ?? ticks.at(-1) ?? 1;
  const levels = maxProp ? niceTicks(0, maxProp, 4).filter((t) => t > 0 && t <= maxProp) : ticks;

  const labelRoom = Math.min(90, Math.max(30, ...data.map((_, i) => approxTextWidth(labelOf(i)))) + 10);
  const radius = Math.max(40, Math.min(width / 2 - labelRoom, height / 2 - 28));
  // Shrink to the shape on narrow screens instead of leaving empty bands.
  const plotHeight = Math.min(height, radius * 2 + 56);
  const cx = width / 2;
  const cy = plotHeight / 2;
  const angleAt = (i: number) => (i / Math.max(n, 1)) * TAU;
  const point = (i: number, v: number) => polar(cx, cy, (Math.max(0, Math.min(v, max)) / max) * radius, angleAt(i));

  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - rect.left - cx;
    const dy = e.clientY - rect.top - cy;
    if (Math.hypot(dx, dy) > radius + labelRoom) return setActive(null);
    const angle = (Math.atan2(dx, -dy) + TAU) % TAU;
    setActive(Math.round(angle / (TAU / n)) % n);
  };

  const table = {
    columns: [{ key: "__x", label: String(x) }, ...resolved.map((s) => ({ key: s.key, label: s.label, numeric: true }))],
    rows: data.map((row, i) => ({
      __x: labelOf(i),
      ...Object.fromEntries(resolved.map((s) => [s.key, readNumber(row, s.key) === null ? "–" : formatValue(readNumber(row, s.key)!)])),
    })),
  };

  const rows =
    active === null
      ? []
      : visible.map((s, j) => ({
          key: s.key,
          label: s.label,
          color: s.color,
          value: values[j][active] === null ? "–" : formatValue(values[j][active]!),
          muted: values[j][active] === null,
        }));

  return (
    <ChartFrame
      {...frame}
      empty={n < 3}
      emptyMessage={n < 3 ? "A radar chart needs at least three axes." : frame.emptyMessage}
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
        aria-label={`Radar chart, ${n} axes. Use the arrow keys to read each axis.`}
        tabIndex={0}
        onKeyDown={cycleKeys(n, setActive)}
        onBlur={() => setActive(null)}
        className="focus-visible:ring-ring/50 relative rounded-md outline-none focus-visible:ring-2"
        style={{ height: width > 0 ? plotHeight : height }}
      >
        {width > 0 && (
          <svg width={width} height={plotHeight} className="block overflow-visible" onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setActive(null)}>
            {/* Level rings and spokes */}
            {levels.map((level) => (
              <polygon
                key={level}
                points={data.map((_, i) => point(i, level).join(",")).join(" ")}
                fill="none"
                stroke={level === levels.at(-1) ? "var(--viz-axis)" : "var(--viz-grid)"}
              />
            ))}
            {data.map((_, i) => {
              const [ex, ey] = polar(cx, cy, radius, angleAt(i));
              return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke={active === i ? "var(--viz-axis)" : "var(--viz-grid)"} />;
            })}
            {/* Scale labels sit midway along the first edge, clear of the axis labels. */}
            {levels.map((level) => {
              const half = Math.PI / Math.max(n, 1);
              const [lx, ly] = polar(cx, cy, (level / max) * radius * Math.cos(half), half);
              return (
                <text key={level} x={lx + 3} y={ly} dy="0.32em" className="fill-muted-foreground text-[10px] tabular-nums">
                  {formatValue === formatFull ? formatCompact(level) : formatValue(level)}
                </text>
              );
            })}

            {/* Shapes: a 10% wash with a 2px edge */}
            {visible.map((s, j) => (
              <polygon
                key={s.key}
                points={data.map((_, i) => point(i, values[j][i] ?? 0).join(",")).join(" ")}
                fill={s.color}
                fillOpacity={0.12}
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            ))}

            {/* Axis labels, anchored away from the centre */}
            {data.map((_, i) => {
              const a = angleAt(i);
              const [lx, ly] = polar(cx, cy, radius + 10, a);
              const sin = Math.sin(a);
              const cos = Math.cos(a);
              return (
                <text
                  key={i}
                  x={lx}
                  y={ly}
                  dy={cos > 0.5 ? "-0.2em" : cos < -0.5 ? "0.9em" : "0.32em"}
                  textAnchor={sin > 0.25 ? "start" : sin < -0.25 ? "end" : "middle"}
                  className={cn("text-[11px]", active === i ? "fill-foreground font-medium" : "fill-muted-foreground")}
                >
                  {labelOf(i)}
                </text>
              );
            })}

            {active !== null &&
              visible.map((s, j) =>
                values[j][active] === null ? null : (
                  <circle
                    key={s.key}
                    cx={point(active, values[j][active]!)[0]}
                    cy={point(active, values[j][active]!)[1]}
                    r={4.5}
                    fill={s.color}
                    stroke="var(--card)"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                ),
              )}
            <rect width={width} height={plotHeight} fill="transparent" />
          </svg>
        )}
        {active !== null && width > 0 && (
          <ChartTooltip
            title={labelOf(active)}
            rows={rows}
            x={polar(cx, cy, radius * 0.55, angleAt(active))[0]}
            y={polar(cx, cy, radius * 0.55, angleAt(active))[1]}
            containerWidth={width}
          />
        )}
        <span aria-live="polite" className="sr-only">
          {active === null ? "" : `${labelOf(active)}: ${rows.map((r) => `${r.label} ${r.value}`).join(", ")}`}
        </span>
      </div>
    </ChartFrame>
  );
}

// ---------------------------------------------------------------------------
// Radial bars

export interface RadialChartProps<T> extends FrameProps {
  /** One ring per row, outermost first. */
  data: readonly T[];
  label: keyof T & string;
  value: keyof T & string;
  /** The value of a full sweep. Defaults to the largest value. */
  max?: number;
  /** Degrees of arc a full value covers: 270 for rings, 180 for a gauge. */
  sweep?: number;
  colors?: Record<string, SeriesColor>;
  formatValue?: (value: number) => string;
  /** Text under the centre value, for a single ring or gauge. */
  centerLabel?: string;
  size?: number;
}

function RadialChart<T>({
  data,
  label,
  value,
  max: maxProp,
  sweep = 270,
  colors,
  formatValue = formatFull,
  centerLabel,
  size = 240,
  ...frame
}: RadialChartProps<T>) {
  const [wrapperRef, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = React.useState<number | null>(null);
  const rings = data.map((row, index) => {
    const name = formatCategory(row[label]);
    return { key: name, label: name, value: readNumber(row, value) ?? 0, color: slotColor(colors?.[name], index) };
  });
  const max = maxProp ?? Math.max(1, ...rings.map((r) => r.value));
  const single = rings.length === 1;

  const diameter = Math.max(140, Math.min(size, width || size));
  const sweepRad = (Math.min(Math.max(sweep, 30), 360) / 180) * Math.PI;
  // Rings start at 12 o'clock, leaving the top-left quadrant for their labels; a gauge is centred.
  const start = sweep >= 270 ? 0 : -sweepRad / 2;
  const isGauge = sweep <= 180;
  const cx = diameter / 2;
  const cy = isGauge ? diameter / 2 + 4 : diameter / 2;
  const svgHeight = isGauge ? diameter / 2 + 16 : diameter;
  const outer = diameter / 2 - 6;
  const gap = 5;
  const thickness = single ? Math.max(12, outer * 0.16) : Math.min(16, (outer * 0.62 - gap * (rings.length - 1)) / rings.length);
  const radiusAt = (i: number) => outer - thickness / 2 - i * (thickness + gap);
  const showRingLabels = !single && sweep >= 270;

  const table = {
    columns: [
      { key: "label", label: String(label) },
      { key: "value", label: String(value), numeric: true },
      { key: "share", label: `Of ${formatValue(max)}`, numeric: true },
    ],
    rows: rings.map((r) => ({ label: r.label, value: formatValue(r.value), share: percentFormat.format(r.value / max) })),
  };
  const activeRing = active === null ? null : rings[active];
  const endAngle = (i: number) => start + sweepRad * Math.max(0, Math.min(1, rings[i].value / max));

  return (
    <ChartFrame {...frame} empty={rings.length === 0} table={table}>
      <div ref={wrapperRef} className="flex justify-center">
        <div
          role="group"
          aria-roledescription="chart"
          aria-label={`${isGauge ? "Gauge" : "Radial bar chart"}, ${rings.length} ${rings.length === 1 ? "value" : "rings"}. Use the arrow keys to read each.`}
          tabIndex={0}
          onKeyDown={cycleKeys(rings.length, setActive)}
          onBlur={() => setActive(null)}
          className="focus-visible:ring-ring/50 relative rounded-md outline-none focus-visible:ring-2"
          style={{ width: diameter, height: svgHeight }}
        >
          <svg width={diameter} height={svgHeight} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
            {rings.map((ring, i) => {
              const r = radiusAt(i);
              const track = `color-mix(in srgb, ${ring.color} 16%, var(--card))`;
              const valueArc = endAngle(i) - start;
              return (
                <g
                  key={ring.key}
                  style={{ opacity: active !== null && active !== i ? 0.45 : 1, transition: "opacity 120ms" }}
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={() => setActive(i)}
                >
                  {/* The track is a lighter step of the ring's own colour. */}
                  <path d={arcPath(cx, cy, r, start, start + sweepRad)} fill="none" stroke={track} strokeWidth={thickness} strokeLinecap="round" />
                  {valueArc > 0.001 && (
                    <path d={arcPath(cx, cy, r, start, start + valueArc)} fill="none" stroke={ring.color} strokeWidth={thickness} strokeLinecap="round" />
                  )}
                  {/* A wider transparent stroke is the hit target. */}
                  <path d={arcPath(cx, cy, r, start, start + sweepRad)} fill="none" stroke="transparent" strokeWidth={thickness + gap} />
                  {showRingLabels && (
                    <text x={cx - 10} y={cy - r} dy="0.32em" textAnchor="end" className={cn("text-[11px]", active === i ? "fill-foreground font-medium" : "fill-muted-foreground")}>
                      {ring.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {(single || isGauge) && (
            <div
              className="pointer-events-none absolute inset-x-0 text-center"
              style={isGauge ? { bottom: 4 } : { top: "50%", transform: "translateY(-50%)" }}
            >
              <p className="text-2xl font-semibold tracking-tight">{formatValue((activeRing ?? rings[0]).value)}</p>
              <p className="text-muted-foreground text-xs">
                {activeRing && !single ? activeRing.label : (centerLabel ?? `of ${formatValue(max)}`)}
              </p>
            </div>
          )}

          {!single && !isGauge && activeRing && active !== null && (
            <ChartTooltip
              title={activeRing.label}
              rows={[
                { key: activeRing.key, label: `${percentFormat.format(activeRing.value / max)} of ${formatValue(max)}`, value: formatValue(activeRing.value), color: activeRing.color },
              ]}
              x={polar(cx, cy, radiusAt(active), endAngle(active))[0]}
              y={polar(cx, cy, radiusAt(active), endAngle(active))[1]}
              containerWidth={diameter}
            />
          )}
          <span aria-live="polite" className="sr-only">
            {activeRing ? `${activeRing.label}: ${formatValue(activeRing.value)} of ${formatValue(max)}` : ""}
          </span>
        </div>
      </div>
    </ChartFrame>
  );
}

export { PieChart, RadarChart, RadialChart };
