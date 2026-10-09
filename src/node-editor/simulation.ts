import * as React from "react";

/** How a step reads: drives its colour and icon. */
export type TraceTone = "success" | "warning" | "danger" | "neutral";

export type TraceStep = {
  /** The node (or sequence key) this step ran. */
  nodeId: string;
  tone?: TraceTone;
  /** The output it took, for branching nodes (a handle id such as "Yes"). */
  output?: string | null;
  /** A short result shown on the node, e.g. "82 > 80". */
  note?: string;
  /** A longer explanation for the trace panel. */
  detail?: string;
};

export type TraceOutcome = { label: string; tone?: TraceTone; detail?: string };

/**
 * What a run did, step by step. Build it with `simulateGraph` /
 * `simulateSequence`, or map it from your backend's dry-run response so the
 * UI shows exactly what production would do.
 */
export type SimulationTrace = { steps: TraceStep[]; outcome?: TraceOutcome };

/** Pass to an editor to highlight a run. `step` limits it to the first n steps, for playback. */
export type SimulationView = { trace: SimulationTrace; step?: number };

export type NodeVisit = { state: "current" | "visited" | "unvisited"; tone?: TraceTone; note?: string };

/** Per-node highlight state for the steps shown so far. */
export function visitsOf(view: SimulationView | undefined) {
  const visits = new Map<string, NodeVisit>();
  if (!view) return null;
  const shown = view.trace.steps.slice(0, view.step ?? view.trace.steps.length);
  shown.forEach((step, i) =>
    visits.set(step.nodeId, {
      state: i === shown.length - 1 && (view.step ?? Infinity) < view.trace.steps.length ? "current" : "visited",
      tone: step.tone,
      note: step.note,
    }),
  );
  return { visits, shown, done: shown.length === view.trace.steps.length };
}

// ---------------------------------------------------------------------------
// Local evaluation

export type EvaluateResult = {
  tone?: TraceTone;
  /** Which output to follow. Omit for the node's only output; null to stop here. */
  output?: string | null;
  note?: string;
  detail?: string;
  /** End the run after this node. */
  stop?: boolean;
  /** Sets the run's outcome (the last one set wins). */
  outcome?: TraceOutcome;
};

type Graph = {
  nodes: { id: string; type?: string; data: unknown }[];
  edges: { source: string; target: string; sourceHandle?: string | null }[];
};

/**
 * Walks a node-editor graph with a test input, in the browser. Each node type
 * may define `evaluate(data, input)`; types without one pass straight through.
 * For real decisions prefer your backend's dry run, and pass its trace instead.
 */
export function simulateGraph<I>(
  graph: Graph,
  nodeTypes: Record<string, { evaluate?: (data: never, input: I) => EvaluateResult }> | undefined,
  input: I,
  { start, maxSteps = 200 }: { start?: string; maxSteps?: number } = {},
): SimulationTrace {
  const incoming = new Set(graph.edges.map((e) => e.target));
  let current = graph.nodes.find((n) => n.id === start) ?? graph.nodes.find((n) => !incoming.has(n.id));
  const steps: TraceStep[] = [];
  let outcome: TraceOutcome | undefined;

  while (current) {
    if (steps.length >= maxSteps) {
      return { steps, outcome: { label: "Stopped", tone: "danger", detail: `More than ${maxSteps} steps; is there a loop?` } };
    }
    const evaluate = nodeTypes?.[current.type ?? "default"]?.evaluate as ((data: unknown, input: I) => EvaluateResult) | undefined;
    let result: EvaluateResult;
    try {
      result = evaluate ? evaluate(current.data, input) : {};
    } catch (error) {
      result = { tone: "danger", note: "Error", detail: String(error), stop: true, outcome: { label: "Error", tone: "danger" } };
    }
    steps.push({ nodeId: current.id, tone: result.tone, output: result.output, note: result.note, detail: result.detail });
    if (result.outcome) outcome = result.outcome;
    if (result.stop || result.output === null) break;

    const from = current.id;
    const out = graph.edges.filter((e) => e.source === from);
    const next =
      result.output === undefined
        ? out[0]
        : out.find((e) => (e.sourceHandle ?? null) === result.output) ?? undefined;
    current = next ? graph.nodes.find((n) => n.id === next.target) : undefined;
  }
  return { steps, outcome };
}

/**
 * Runs an ordered sequence (e.g. risk rules) with a test input: each item is
 * evaluated in turn until one says `stop`.
 */
export function simulateSequence<T, I>(
  keys: readonly string[],
  itemByKey: (key: string) => T | undefined,
  evaluate: (item: T, input: I) => EvaluateResult,
  input: I,
  fallback?: TraceOutcome,
): SimulationTrace {
  const steps: TraceStep[] = [];
  let outcome: TraceOutcome | undefined;
  for (const key of keys) {
    const item = itemByKey(key);
    if (!item) continue;
    let result: EvaluateResult;
    try {
      result = evaluate(item, input);
    } catch (error) {
      result = { tone: "danger", note: "Error", detail: String(error), stop: true, outcome: { label: "Error", tone: "danger" } };
    }
    steps.push({ nodeId: key, tone: result.tone, note: result.note, detail: result.detail });
    if (result.outcome) outcome = result.outcome;
    if (result.stop) break;
  }
  return { steps, outcome: outcome ?? fallback };
}

// ---------------------------------------------------------------------------
// Playback

/** Step-through state for a trace: starts at the end, plays from the start. */
export function useSimulationPlayback(trace: SimulationTrace | null, { interval = 700 } = {}) {
  const total = trace?.steps.length ?? 0;
  const [step, setStep] = React.useState(total);
  const [playing, setPlaying] = React.useState(false);

  // A new run shows its whole path first.
  React.useEffect(() => {
    setStep(total);
    setPlaying(false);
  }, [trace, total]);

  React.useEffect(() => {
    if (!playing) return;
    if (step >= total) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), interval);
    return () => clearTimeout(id);
  }, [playing, step, total, interval]);

  return {
    step,
    total,
    playing,
    setStep: (n: number) => {
      setPlaying(false);
      setStep(Math.max(0, Math.min(total, n)));
    },
    play: () => {
      if (step >= total) setStep(0);
      setPlaying(true);
    },
    pause: () => setPlaying(false),
  };
}
