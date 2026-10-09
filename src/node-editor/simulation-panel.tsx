"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon, RotateCcwIcon, RouteIcon } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "../components/button";
import Spinner from "../components/spinner";
import type { SimulationTrace, useSimulationPlayback } from "./simulation";
import { ToneIcon, toneColor } from "./tone";

export interface SimulationPanelProps {
  trace: SimulationTrace | null;
  /** From `useSimulationPlayback(trace)`. */
  playback: ReturnType<typeof useSimulationPlayback>;
  /** Display name for a step's node. */
  getLabel: (nodeId: string) => string;
  /** Shows a Run button. */
  onRun?: () => void;
  running?: boolean;
  title?: React.ReactNode;
  /** Your test-input form, above the controls. */
  children?: React.ReactNode;
  /** How the trace is drawn: a node flow (default), or a compact list. */
  view?: "flow" | "list";
  className?: string;
}

/** Test input, playback controls and a step-by-step trace of a simulation run. */
export function SimulationPanel({
  trace,
  playback,
  getLabel,
  onRun,
  running = false,
  title = "Simulation",
  children,
  view = "flow",
  className,
}: SimulationPanelProps) {
  const { step, total, playing, setStep, play, pause } = playback;

  return (
    <section
      data-slot="simulation-panel"
      aria-label="Simulation"
      className={cn("bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-4", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <RouteIcon className="text-muted-foreground size-4" />
          {title}
        </h3>
        {onRun && (
          <Button size="sm" onClick={onRun} disabled={running}>
            {running ? <Spinner className="size-3.5" /> : <PlayIcon />}
            Run
          </Button>
        )}
      </div>

      {children}

      {trace === null ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
          Run a test to see the path it takes.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" aria-label="Back to start" onClick={() => setStep(0)} disabled={step === 0}>
              <RotateCcwIcon />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Previous step" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="size-8"
              aria-label={playing ? "Pause" : "Play"}
              onClick={playing ? pause : play}
              disabled={total === 0}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </Button>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Next step" onClick={() => setStep(step + 1)} disabled={step >= total}>
              <ChevronRightIcon />
            </Button>
            <span className="text-muted-foreground ml-auto text-xs tabular-nums" aria-live="polite">
              Step {step} of {total}
            </span>
          </div>

          {view === "flow" ? (
            <TraceFlow trace={trace} step={step} getLabel={getLabel} onSelect={(i) => setStep(i + 1)} />
          ) : (
            <TraceList trace={trace} step={step} total={total} getLabel={getLabel} onSelect={(i) => setStep(i + 1)} />
          )}
        </>
      )}
    </section>
  );
}

type TraceProps = {
  trace: SimulationTrace;
  step: number;
  getLabel: (nodeId: string) => string;
  onSelect: (index: number) => void;
};

/** A connector between two nodes: lit along the path walked so far, with the branch taken. */
function Connector({ lit, label }: { lit: boolean; label?: string | null }) {
  return (
    <div aria-hidden className="relative flex h-7 justify-center">
      <span className={cn("w-0.5 transition-colors", lit ? "bg-primary" : "bg-border")} />
      <span
        className={cn(
          "absolute bottom-0 size-0 border-x-4 border-t-[6px] border-x-transparent transition-colors",
          lit ? "border-t-primary" : "border-t-border",
        )}
      />
      {label && (
        <span className="bg-card text-muted-foreground absolute top-1/2 left-1/2 ml-2 -translate-y-1/2 rounded-full border px-1.5 text-[10px] leading-4 font-medium">
          {label}
        </span>
      )}
    </div>
  );
}

const handleDot = "bg-card border-primary absolute left-1/2 size-2 -translate-x-1/2 rounded-full border-2";

/** The trace as a node flow: Start, one node per step, and the outcome as End. */
function TraceFlow({ trace, step, getLabel, onSelect }: TraceProps) {
  const total = trace.steps.length;
  const done = step >= total;
  const outcomeTone = trace.outcome?.tone ?? "neutral";

  return (
    <ol aria-label="Path" className="flex flex-col items-stretch">
      <li className="flex justify-center">
        <span className={cn("bg-primary rounded-full px-4 py-1 text-xs font-semibold text-white transition-opacity", step === 0 && "opacity-40")}>
          Start
        </span>
      </li>
      {trace.steps.map((s, i) => {
        const reached = i < step;
        const current = i === step - 1 && !done;
        const color = toneColor[s.tone ?? "neutral"];
        return (
          <li key={`${s.nodeId}-${i}`}>
            <Connector lit={reached} label={i > 0 ? trace.steps[i - 1].output : undefined} />
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={current ? "step" : undefined}
              style={{ "--step-color": color } as React.CSSProperties}
              className={cn(
                "bg-card focus-visible:ring-ring/50 relative w-full rounded-xl border text-left shadow-sm transition-[opacity,box-shadow] outline-none focus-visible:ring-2",
                !reached && "opacity-40",
                reached && "border-(--step-color)",
                current && "shadow-[0_0_0_3px_color-mix(in_srgb,var(--step-color)_20%,transparent)]",
              )}
            >
              <span aria-hidden className={cn(handleDot, "-top-1")} />
              <span aria-hidden className="bg-(--step-color) absolute inset-y-0 left-0 w-1 rounded-l-xl" />
              <span className="flex items-start gap-2 py-2 pr-2.5 pl-3.5">
                <span className="min-w-0 flex-1">
                  <span className="text-muted-foreground block text-[11px] font-semibold">Step {i + 1}</span>
                  <span className="block truncate text-sm font-medium">{getLabel(s.nodeId)}</span>
                  {s.detail && <span className="text-muted-foreground block truncate text-xs">{s.detail}</span>}
                </span>
                {s.note && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                    <ToneIcon tone={s.tone} className="size-3" />
                    {s.note}
                  </span>
                )}
              </span>
              <span aria-hidden className={cn(handleDot, "-bottom-1")} />
            </button>
          </li>
        );
      })}
      {trace.outcome && (
        <li>
          <Connector lit={done} label={trace.steps.at(-1)?.output} />
          {/* The outcome is the End node: its tone, icon and reason. */}
          <div
            className={cn("relative rounded-xl border-2 px-3.5 py-2.5 transition-opacity", !done && "opacity-40")}
            style={{
              borderColor: toneColor[outcomeTone],
              background: `color-mix(in srgb, ${toneColor[outcomeTone]} 8%, var(--card))`,
            }}
          >
            <span aria-hidden className={cn(handleDot, "-top-1")} style={{ borderColor: toneColor[outcomeTone] }} />
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ToneIcon tone={outcomeTone} className="size-4" />
              {trace.outcome.label}
            </p>
            {trace.outcome.detail && <p className="text-muted-foreground mt-0.5 pl-6 text-xs">{trace.outcome.detail}</p>}
          </div>
        </li>
      )}
    </ol>
  );
}

/** The trace as a compact numbered list. */
function TraceList({ trace, step, total, getLabel, onSelect }: TraceProps & { total: number }) {
  const done = step >= total;
  return (
    <>
      <ol className="flex flex-col gap-1">
        {trace.steps.map((s, i) => {
          const reached = i < step;
          const current = i === step - 1 && step < total;
          return (
            <li key={`${s.nodeId}-${i}`}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "hover:bg-muted focus-visible:ring-ring/50 flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2",
                  !reached && "opacity-40",
                  current && "bg-muted",
                )}
              >
                <span className="text-muted-foreground mt-0.5 w-4 shrink-0 text-right text-xs tabular-nums">{i + 1}</span>
                <ToneIcon tone={s.tone} className="mt-0.5 size-4" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{getLabel(s.nodeId)}</span>
                    {s.note && <span className="text-muted-foreground shrink-0 text-xs">{s.note}</span>}
                  </span>
                  {s.detail && <span className="text-muted-foreground block text-xs">{s.detail}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {trace.outcome && (
        <div
          className={cn("flex items-start gap-2.5 rounded-lg border p-3 transition-opacity", !done && "opacity-40")}
          style={{
            borderColor: toneColor[trace.outcome.tone ?? "neutral"],
            background: `color-mix(in srgb, ${toneColor[trace.outcome.tone ?? "neutral"]} 8%, transparent)`,
          }}
        >
          <ToneIcon tone={trace.outcome.tone} className="mt-0.5 size-4" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{trace.outcome.label}</p>
            {trace.outcome.detail && <p className="text-muted-foreground text-xs">{trace.outcome.detail}</p>}
          </div>
        </div>
      )}
    </>
  );
}
