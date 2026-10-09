import * as React from "react";

/** The validated categorical order. A 9th series should fold into "Other", never a new hue. */
export const SERIES_SLOTS = 8;

/** Slot 1–8, or any CSS colour. */
export type SeriesColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | (string & {});

export type ChartSeries<T> = {
  key: keyof T & string;
  label: string;
  /** Defaults to the slot matching the series' position, so colour follows the entity. */
  color?: SeriesColor;
};

export type ResolvedSeries<T> = ChartSeries<T> & { color: string; index: number };

export function resolveSeries<T>(series: readonly ChartSeries<T>[]): ResolvedSeries<T>[] {
  if (series.length > SERIES_SLOTS) {
    console.warn(
      `Charts support ${SERIES_SLOTS} categorical series; fold the rest into "Other" or use small multiples.`,
    );
  }
  return series.map((s, index) => ({
    ...s,
    index,
    color:
      typeof s.color === "number"
        ? `var(--viz-${s.color})`
        : (s.color ?? `var(--viz-${(index % SERIES_SLOTS) + 1})`),
  }));
}

export function readNumber(row: unknown, key: string): number | null {
  const value = (row as Record<string, unknown>)[key];
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

/** 1,284 · 12.9K · 4.2M */
export function formatCompact(n: number) {
  return Math.abs(n) < 10_000 ? full.format(n) : compact.format(n);
}

export function formatFull(n: number) {
  return full.format(n);
}

const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

export function formatCategory(value: unknown) {
  if (value instanceof Date) return dateFormat.format(value);
  return String(value ?? "");
}

/** Round tick values covering [min, max], e.g. 0 / 250 / 500 / 750. */
export function niceTicks(min: number, max: number, count = 5) {
  if (min === max) {
    const pad = Math.abs(min) || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / Math.max(count - 1, 1);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
}

export function linear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

/** Width of a container, tracked with ResizeObserver. 0 until measured. */
export function useElementWidth<E extends HTMLElement>() {
  const ref = React.useRef<E>(null);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Rough text width for layout decisions; avoids measuring the DOM on every render. */
export function approxTextWidth(text: string, fontSize = 11) {
  return text.length * fontSize * 0.58;
}

/**
 * A rect path rounded only at the data end, square at the baseline.
 * `direction` is the way the bar grows from its baseline.
 */
export function barPath(
  x: number,
  y: number,
  w: number,
  h: number,
  direction: "up" | "down" | "right" | "left",
  radius = 4,
) {
  if (w <= 0 || h <= 0) return "";
  const r = Math.min(radius, direction === "up" || direction === "down" ? w / 2 : h / 2, direction === "up" || direction === "down" ? h : w);
  switch (direction) {
    case "up":
      return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
    case "down":
      return `M${x},${y}V${y + h - r}Q${x},${y + h} ${x + r},${y + h}H${x + w - r}Q${x + w},${y + h} ${x + w},${y + h - r}V${y}Z`;
    case "right":
      return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
    case "left":
      return `M${x + w},${y}H${x + r}Q${x},${y} ${x},${y + r}V${y + h - r}Q${x},${y + h} ${x + r},${y + h}H${x + w}Z`;
  }
}

// ---------------------------------------------------------------------------
// Polar geometry. Angles are radians clockwise from 12 o'clock.

export function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
}

/** An arc centreline from a0 to a1, for stroked arcs (radial bars, tracks). */
export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) a1 = a0 + Math.PI * 2 - 1e-4;
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0},${y0}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1}`;
}

/**
 * A ring segment between radii r0 < r1. `gap` px is cut from each side, at
 * each radius, so neighbouring segments are separated by a constant-width gap.
 */
export function sectorPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, gap = 2): string {
  const full = a1 - a0 >= Math.PI * 2 - 1e-6;
  const padOuter = full ? 0 : gap / 2 / r1;
  const padInner = full || r0 <= 0 ? 0 : gap / 2 / r0;
  const o0 = a0 + padOuter;
  const o1 = Math.max(o0, a1 - padOuter);
  const i0 = a0 + padInner;
  const i1 = Math.max(i0, a1 - padInner);
  if (full) {
    // One arc can't start and end at the same point: draw two half rings.
    const mid = a0 + Math.PI;
    return sectorPath(cx, cy, r0, r1, a0, mid, 0) + sectorPath(cx, cy, r0, r1, mid, a0 + Math.PI * 2 - 1e-4, 0);
  }
  const [ox0, oy0] = polar(cx, cy, r1, o0);
  const [ox1, oy1] = polar(cx, cy, r1, o1);
  const large = (span: number) => (span > Math.PI ? 1 : 0);
  if (r0 <= 0) return `M${cx},${cy}L${ox0},${oy0}A${r1},${r1} 0 ${large(o1 - o0)} 1 ${ox1},${oy1}Z`;
  const [ix1, iy1] = polar(cx, cy, r0, i1);
  const [ix0, iy0] = polar(cx, cy, r0, i0);
  return `M${ox0},${oy0}A${r1},${r1} 0 ${large(o1 - o0)} 1 ${ox1},${oy1}L${ix1},${iy1}A${r0},${r0} 0 ${large(i1 - i0)} 0 ${ix0},${iy0}Z`;
}
