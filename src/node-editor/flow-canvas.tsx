"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MapIcon, MaximizeIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";

import { cn } from "../lib/utils";
import type { SeriesColor } from "../charts/utils";
import type { NodeVisit } from "./simulation";
import { ToneIcon, toneColor } from "./tone";

export type HandleSpec = { id: string; label?: string };

export type FlowNodeData = {
  label: string;
  description?: React.ReactNode;
  /** Small text above the label, e.g. "Step 2". */
  eyebrow?: React.ReactNode;
  icon?: React.ReactNode;
  /** Accent: palette slot 1–8 or any CSS colour. */
  color?: SeriesColor;
  /**
   * "card": header plus your content. "terminal": a pill, for Start and End.
   * "none": only your content, no frame.
   */
  variant?: "card" | "terminal" | "none";
  /** Connection points. Omit for one unnamed handle; [] for none. */
  inputs?: HandleSpec[];
  outputs?: HandleSpec[];
  /** Your content, under the header. Interactive: it never starts a drag or a zoom. */
  body?: React.ReactNode;
  /** Renders a remove button in the header. */
  onRemove?: () => void;
  /** Simulation highlight: visited nodes get a ring and a result badge; unvisited ones fade. */
  visit?: NodeVisit;
};

/** Ring, fade and badge for a node in a simulation. Wraps any frame. */
function VisitFrame({ visit, children }: { visit?: NodeVisit; children: React.ReactNode }) {
  if (!visit) return <>{children}</>;
  const color = toneColor[visit.tone ?? "neutral"];
  return (
    <div
      className={cn("relative transition-opacity duration-300", visit.state === "unvisited" && "opacity-35")}
      style={{ "--visit-color": color } as React.CSSProperties}
    >
      {visit.state !== "unvisited" && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-1 rounded-[14px] border-2 border-(--visit-color)",
            visit.state === "current" && "shadow-[0_0_0_4px_color-mix(in_srgb,var(--visit-color)_20%,transparent)]",
          )}
        />
      )}
      {children}
      {visit.state !== "unvisited" && visit.note && (
        <span className="bg-card text-foreground absolute -top-3 right-2 z-10 flex max-w-44 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-sm">
          <ToneIcon tone={visit.tone} className="size-3" />
          <span className="truncate">{visit.note}</span>
        </span>
      )}
    </div>
  );
}

export type FlowNodeType = Node<FlowNodeData, "flow">;

/** Class of the part of a node that drags it, when its body holds controls. */
export const DRAG_HANDLE_CLASS = "flow-drag-handle";

export function accentColor(color: SeriesColor | undefined) {
  if (typeof color === "number") return `var(--viz-${color})`;
  return color ?? "var(--primary)";
}

const handleClass =
  "!size-2.5 !rounded-full !border-2 !border-(--xy-handle-border-color) !bg-(--xy-handle-background-color) transition-transform hover:!scale-125";

/** Handles spread evenly along one side; positions match the label row under a card. */
function Handles({ type, specs, position }: { type: "source" | "target"; specs: HandleSpec[] | undefined; position: Position }) {
  const list = specs ?? [{ id: "" }];
  const horizontalSide = position === Position.Top || position === Position.Bottom;
  return (
    <>
      {list.map((spec, i) => {
        const offset = `${((2 * i + 1) / (2 * list.length)) * 100}%`;
        return (
          <Handle
            key={spec.id || i}
            id={spec.id || undefined}
            type={type}
            position={position}
            className={handleClass}
            style={horizontalSide ? { left: offset } : { top: offset }}
            aria-label={`${type === "source" ? "Outgoing" : "Incoming"} connection${spec.label ? `: ${spec.label}` : ""}`}
          />
        );
      })}
    </>
  );
}

/** The frame every flow node renders in, in both the node editor and the sequence flow. */
export function FlowNode({ data, selected, sourcePosition, targetPosition }: NodeProps<FlowNodeType>) {
  const accent = accentColor(data.color);
  const variant = data.variant ?? "card";
  const out = sourcePosition ?? Position.Bottom;
  const outputLabels = data.outputs?.some((h) => h.label) && (out === Position.Bottom || out === Position.Top);
  const handles = (
    <>
      {data.inputs?.length !== 0 && <Handles type="target" specs={data.inputs} position={targetPosition ?? Position.Top} />}
      {data.outputs?.length !== 0 && <Handles type="source" specs={data.outputs} position={out} />}
    </>
  );

  if (variant === "none") {
    return (
      <VisitFrame visit={data.visit}>
        <div className={cn("relative", selected && "rounded-lg ring-2 ring-(--node-accent) ring-offset-2")} style={{ "--node-accent": accent } as React.CSSProperties}>
          {handles}
          {data.body}
        </div>
      </VisitFrame>
    );
  }

  if (variant === "terminal") {
    return (
      <VisitFrame visit={data.visit}>
      <div
        style={{ "--node-accent": accent } as React.CSSProperties}
        className={cn(
          "bg-(--node-accent) relative grid h-10 w-32 place-items-center rounded-full text-sm font-semibold text-white shadow-sm",
          selected && "ring-2 ring-(--node-accent) ring-offset-2 ring-offset-(--xy-background-color)",
        )}
      >
        {handles}
        {data.label}
      </div>
      </VisitFrame>
    );
  }

  return (
    <VisitFrame visit={data.visit}>
    <div
      style={{ "--node-accent": accent } as React.CSSProperties}
      className={cn(
        "group/node bg-card text-card-foreground relative w-56 rounded-xl border shadow-sm transition-shadow",
        selected && "ring-2 ring-(--node-accent) ring-offset-2 ring-offset-(--xy-background-color)",
      )}
    >
      {handles}
      <span aria-hidden className="bg-(--node-accent) absolute inset-y-0 left-0 w-1 rounded-l-xl" />
      {/* Header: carries the title, and drags the node when the body holds controls. */}
      <div className={cn(DRAG_HANDLE_CLASS, "flex items-start gap-2.5 py-2.5 pr-8 pl-3.5", data.body != null && "border-b")}>
        {data.icon && (
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--node-accent)_14%,transparent)] text-(--node-accent) [&_svg]:size-4">
            {data.icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {data.eyebrow && <p className="text-(--node-accent) mb-0.5 text-[11px] font-semibold">{data.eyebrow}</p>}
          <p className="truncate text-sm leading-5 font-medium">{data.label}</p>
          {data.description && <p className="text-muted-foreground mt-0.5 truncate text-xs">{data.description}</p>}
        </div>
      </div>
      {data.body != null && (
        // nodrag/nowheel: inputs, selects and scrolling inside the body behave normally.
        <div className="nodrag nowheel cursor-default px-3.5 py-3 text-sm">{data.body}</div>
      )}
      {outputLabels && (
        <div className="text-muted-foreground flex border-t text-[11px]">
          {data.outputs!.map((h) => (
            <span key={h.id} className="flex-1 truncate px-1 py-1 text-center">
              {h.label}
            </span>
          ))}
        </div>
      )}
      {data.onRemove && (
        <button
          type="button"
          className="nodrag text-muted-foreground hover:text-destructive hover:bg-muted absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-md opacity-0 transition group-hover/node:opacity-100 focus-visible:opacity-100"
          aria-label={`Remove ${data.label}`}
          title="Remove"
          onClick={(event) => {
            event.stopPropagation();
            data.onRemove!();
          }}
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
    </VisitFrame>
  );
}

const nodeTypes = { flow: FlowNode };

// xyflow reads var(--xy-x, var(--xy-x-default)) and sets the *-default names on
// its own element, so theme the plain names: they win in light and dark.
const themeVars = {
  "--xy-background-color": "color-mix(in srgb, var(--muted) 35%, var(--card))",
  "--xy-background-pattern-color": "var(--border)",
  "--xy-edge-stroke": "color-mix(in srgb, var(--muted-foreground) 70%, transparent)",
  "--xy-edge-stroke-selected": "var(--primary)",
  "--xy-edge-stroke-width": "1.5",
  "--xy-connectionline-stroke": "var(--primary)",
  "--xy-connectionline-stroke-width": "2",
  "--xy-handle-background-color": "var(--card)",
  "--xy-handle-border-color": "var(--primary)",
  "--xy-edge-label-background-color": "var(--card)",
  "--xy-edge-label-color": "var(--muted-foreground)",
  "--xy-minimap-background-color": "var(--card)",
  "--xy-minimap-mask-background-color": "color-mix(in srgb, var(--foreground) 6%, transparent)",
  "--xy-minimap-node-background-color": "var(--muted-foreground)",
  "--xy-attribution-background-color": "transparent",
  "--xy-selection-background-color": "color-mix(in srgb, var(--primary) 8%, transparent)",
  "--xy-selection-border": "1px dashed var(--primary)",
} as React.CSSProperties;

/**
 * Styles edges for a simulation: the path taken glows and animates, the rest fades.
 * `taken` holds "source->target" pairs, optionally with "#output".
 */
export function simulationEdgeStyle(edge: { source: string; target: string; sourceHandle?: string | null }, taken: Set<string> | null) {
  if (!taken) return {};
  const onPath = taken.has(`${edge.source}->${edge.target}`) || taken.has(`${edge.source}->${edge.target}#${edge.sourceHandle ?? ""}`);
  return onPath
    ? { animated: true, style: { stroke: "var(--primary)", strokeWidth: 2.5 }, zIndex: 1 }
    : { animated: false, style: { opacity: 0.25 } };
}

/** The edges a run walked: consecutive steps, through the output each one took. */
export function takenEdges(steps: { nodeId: string; output?: string | null }[]) {
  const taken = new Set<string>();
  steps.slice(0, -1).forEach((step, i) => {
    const next = steps[i + 1].nodeId;
    taken.add(step.output ? `${step.nodeId}->${next}#${step.output}` : `${step.nodeId}->${next}`);
  });
  return taken;
}

export const defaultEdgeOptions: Partial<Edge> = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
};

function ToolbarButton({ label, onClick, disabled, active, children }: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 grid size-8 place-items-center rounded-md transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function FlowToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="bg-card flex items-center gap-0.5 rounded-lg border p-0.5 shadow-sm">{children}</div>;
}

export { ToolbarButton as FlowToolbarButton };

export interface FlowCanvasProps
  extends Omit<ReactFlowProps<FlowNodeType, Edge>, "nodeTypes" | "children" | "className" | "style"> {
  readOnly?: boolean;
  /** Show the minimap toggle (and start with it open). */
  minimap?: boolean | "open";
  /** Extra toolbar buttons, before the zoom controls. */
  toolbar?: React.ReactNode;
  /** Shown centred when there are no nodes. */
  emptyState?: React.ReactNode;
  /** Changing this refits the view, e.g. after the graph is replaced or the container resizes. */
  fitKey?: unknown;
  className?: string;
  children?: React.ReactNode;
}

function CanvasControls({ toolbar, minimap, showMinimap, setShowMinimap }: {
  toolbar?: React.ReactNode;
  minimap: boolean;
  showMinimap: boolean;
  setShowMinimap: (open: boolean) => void;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <Panel position="top-right" className="!m-3 flex gap-2">
      {toolbar}
      <FlowToolbarGroup>
        <ToolbarButton label="Zoom out" onClick={() => zoomOut({ duration: 150 })}>
          <MinusIcon />
        </ToolbarButton>
        <ToolbarButton label="Zoom in" onClick={() => zoomIn({ duration: 150 })}>
          <PlusIcon />
        </ToolbarButton>
        <ToolbarButton label="Fit to view" onClick={() => fitView({ padding: 0.2, duration: 250 })}>
          <MaximizeIcon />
        </ToolbarButton>
        {minimap && (
          <ToolbarButton label="Minimap" active={showMinimap} onClick={() => setShowMinimap(!showMinimap)}>
            <MapIcon />
          </ToolbarButton>
        )}
      </FlowToolbarGroup>
    </Panel>
  );
}

function RefitOn({ fitKey }: { fitKey: unknown }) {
  const { fitView } = useReactFlow();
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => fitView({ padding: 0.2, duration: 250 }));
    return () => cancelAnimationFrame(frame);
  }, [fitKey, fitView]);
  return null;
}

/** xyflow, themed: the canvas under the node editor and the sequence flow. Needs a ReactFlowProvider above it. */
export function FlowCanvas({
  readOnly = false,
  minimap = false,
  toolbar,
  emptyState,
  fitKey,
  className,
  children,
  nodes,
  ...props
}: FlowCanvasProps) {
  const [showMinimap, setShowMinimap] = React.useState(minimap === "open");

  return (
    <div
      data-slot="flow-canvas"
      // Read-only canvases hide their handles: nothing can be connected.
      className={cn(
        "relative h-full w-full [&_.react-flow__attribution]:text-muted-foreground/70",
        readOnly && "[&_.react-flow__handle]:opacity-0",
        className,
      )}
      style={themeVars}
    >
      <ReactFlow<FlowNodeType, Edge>
        nodes={nodes}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.25}
        maxZoom={2}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        edgesReconnectable={false}
        deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
        {...props}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} />
        <CanvasControls
          toolbar={toolbar}
          minimap={!!minimap}
          showMinimap={showMinimap}
          setShowMinimap={setShowMinimap}
        />
        {showMinimap && (
          <MiniMap
            pannable
            zoomable
            className="!m-3 overflow-hidden rounded-lg border shadow-sm"
            nodeColor={(node) => accentColor((node.data as FlowNodeData).color)}
            nodeBorderRadius={6}
          />
        )}
        {fitKey !== undefined && <RefitOn fitKey={fitKey} />}
        {children}
      </ReactFlow>
      {emptyState && (nodes?.length ?? 0) === 0 && (
        <div className="text-muted-foreground pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-sm">
          {emptyState}
        </div>
      )}
    </div>
  );
}
