"use client";

import * as React from "react";
import {
  Position,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { Redo2Icon, SearchIcon, Undo2Icon, WandSparklesIcon } from "lucide-react";

import { cn } from "../lib/utils";
import type { SeriesColor } from "../charts/utils";
import {
  accentColor,
  DRAG_HANDLE_CLASS,
  FlowCanvas,
  FlowToolbarButton,
  FlowToolbarGroup,
  simulationEdgeStyle,
  takenEdges,
  type FlowNodeType,
  type HandleSpec,
} from "./flow-canvas";
import { visitsOf, type EvaluateResult, type SimulationView } from "./simulation";
import { layeredLayout, reaches } from "./graph";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any;

export type EditorNode<D = Record<string, unknown>> = {
  id: string;
  /** Key into `nodeTypes`. Defaults to "default". */
  type?: string;
  position: { x: number; y: number };
  /** Yours: whatever the node needs. `label` is used as its title if present. */
  data: D;
};

export type EditorEdge = {
  id: string;
  source: string;
  target: string;
  /** The output / input the edge uses, for nodes with several. */
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
};

export type EditorGraph<D = Record<string, unknown>> = { nodes: EditorNode<D>[]; edges: EditorEdge[] };

export type NodeRenderProps<D> = {
  id: string;
  data: D;
  selected: boolean;
  readOnly: boolean;
  /** Changes this node's data, e.g. from an input inside it. */
  update: (patch: Partial<D> | ((data: D) => D)) => void;
  remove: () => void;
};

/** Connection points: a count, or named handles (labels show under the node). */
export type HandlesOption = number | (string | HandleSpec)[];

export type NodeType<D = AnyData> = {
  /** Name in the palette. */
  label: string;
  description?: string;
  icon?: React.ReactNode;
  /** Palette slot 1–8 or any CSS colour. */
  color?: SeriesColor;
  /** What the node shows under its title. Return anything: text, fields, a chart. */
  render?: (props: NodeRenderProps<D>) => React.ReactNode;
  /** The node's title. Defaults to `data.label`, then the type's `label`. */
  title?: (data: D) => string;
  /** "card" (default): title header plus your content. "terminal": a pill. "none": your content only. */
  frame?: "card" | "terminal" | "none";
  /** Incoming connection points. Default 1; 0 for none. */
  inputs?: HandlesOption;
  /** Outgoing connection points. Default 1; 0 for none; `["yes", "no"]` for named branches. */
  outputs?: HandlesOption;
  /** Data for a node added from the palette. */
  defaultData?: D | (() => D);
  /** Most nodes of this type on the canvas, e.g. 1 for a Start node. */
  maxCount?: number;
  /** List it in the palette. Default true. */
  palette?: boolean;
  /**
   * For `simulateGraph`: what this node does with a test input, and which
   * output to follow. Types without one pass straight through.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluate?: (data: D, input: any) => EvaluateResult;
};

export interface NodeEditorProps<D = AnyData> {
  /** Your node types. Without any, every node is a plain card titled by `data.label`. */
  nodeTypes?: Record<string, NodeType<D>>;
  value?: EditorGraph<D>;
  defaultValue?: EditorGraph<D>;
  onValueChange?: (graph: EditorGraph<D>) => void;
  /** View only: no palette, dragging, connecting, editing or deleting. */
  readOnly?: boolean;
  /** Which way flows run: top to bottom, or left to right. */
  direction?: "vertical" | "horizontal";
  /** Allow connections that create a loop. Off by default. */
  allowCycles?: boolean;
  /** Extra rule for new connections; return false to refuse one. */
  validateConnection?: (
    connection: { source: EditorNode<D>; target: EditorNode<D>; sourceHandle?: string | null; targetHandle?: string | null },
    graph: EditorGraph<D>,
  ) => boolean;
  onNodeClick?: (node: EditorNode<D>) => void;
  /**
   * Highlights a run: visited nodes show their result, the path taken glows,
   * the rest fades. Pair with `useSimulationPlayback` to step through it.
   */
  simulation?: SimulationView;
  /** Show the palette. Defaults to true when there are types to add and it isn't read-only. */
  palette?: boolean;
  /** Show the minimap toggle. */
  minimap?: boolean;
  /** Height of the editor. */
  height?: number | string;
  labels?: { palette?: string; search?: string; empty?: React.ReactNode };
  className?: string;
}

const NODE_MIME = "application/x-leastui-node";
const NODE_SIZE = { width: 224, height: 64 };
const DEFAULT_TYPE = "default";
const DEFAULT_TYPES: Record<string, NodeType> = { [DEFAULT_TYPE]: { label: "Node" } };

function newId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10)}`;
}

function toHandles(option: HandlesOption | undefined): HandleSpec[] | undefined {
  if (option === undefined || option === 1) return undefined; // one unnamed handle
  if (typeof option === "number") return Array.from({ length: option }, (_, i) => ({ id: `h${i}` }));
  return option.map((h) => (typeof h === "string" ? { id: h, label: h } : h));
}

function handleCount(option: HandlesOption | undefined) {
  if (option === undefined) return 1;
  return typeof option === "number" ? option : option.length;
}

function Palette({
  types,
  counts,
  onAdd,
  title,
  searchLabel,
}: {
  types: [string, NodeType][];
  counts: Map<string, number>;
  onAdd: (type: string) => void;
  title: string;
  searchLabel: string;
}) {
  const [query, setQuery] = React.useState("");
  const entries = types.filter(([, t]) =>
    `${t.label} ${t.description ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <aside className="bg-muted/20 flex shrink-0 flex-col gap-2 border-b p-3 md:w-60 md:border-r md:border-b-0">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</p>
      {types.length > 5 && (
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="border-input bg-card focus-visible:ring-ring/50 h-8 w-full rounded-md border pr-2 pl-8 text-sm outline-none focus-visible:ring-2"
          />
        </div>
      )}
      <ul className="flex gap-2 overflow-x-auto md:flex-col md:overflow-x-visible md:overflow-y-auto">
        {entries.map(([key, type]) => {
          const full = type.maxCount !== undefined && (counts.get(key) ?? 0) >= type.maxCount;
          return (
            <li key={key} className="shrink-0 md:shrink">
              {/* A div, not a button: browsers won't start an HTML5 drag on form controls. */}
              <div
                role="button"
                tabIndex={full ? -1 : 0}
                aria-disabled={full || undefined}
                title={full ? `Only ${type.maxCount} allowed` : "Drag onto the canvas, or press Enter to add"}
                draggable={!full}
                onDragStart={(e) => {
                  e.dataTransfer.setData(NODE_MIME, key);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => !full && onAdd(key)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !full) {
                    e.preventDefault();
                    onAdd(key);
                  }
                }}
                style={{ "--node-accent": accentColor(type.color) } as React.CSSProperties}
                className={cn(
                  "bg-card focus-visible:ring-ring/50 flex w-52 items-center gap-2.5 rounded-lg border p-2 text-left outline-none focus-visible:ring-2 md:w-full",
                  full ? "opacity-45" : "hover:border-foreground/20 cursor-grab hover:shadow-md active:cursor-grabbing",
                )}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[color-mix(in_srgb,var(--node-accent)_14%,transparent)] text-(--node-accent) [&_svg]:size-4">
                  {type.icon ?? <span className="bg-(--node-accent) size-2 rounded-full" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{type.label}</span>
                  {type.description && <span className="text-muted-foreground block truncate text-xs">{type.description}</span>}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Editor<D>({
  nodeTypes: typesProp,
  value,
  defaultValue,
  onValueChange,
  readOnly = false,
  direction = "vertical",
  allowCycles = false,
  validateConnection,
  onNodeClick,
  simulation,
  palette,
  minimap = true,
  height = 520,
  labels,
  className,
}: NodeEditorProps<D>) {
  const types = (typesProp ?? DEFAULT_TYPES) as Record<string, NodeType<D>>;
  const typeOf = (node: EditorNode<D>): NodeType<D> => types[node.type ?? DEFAULT_TYPE] ?? { label: node.type ?? "Node" };
  const paletteTypes = Object.entries(types).filter(([, t]) => t.palette !== false) as [string, NodeType][];
  const showPalette = palette ?? (!readOnly && typesProp !== undefined && paletteTypes.length > 0);

  const { screenToFlowPosition, fitView, getViewport, setCenter } = useReactFlow();
  const [internal, setInternal] = React.useState<EditorGraph<D>>(defaultValue ?? { nodes: [], edges: [] });
  const graph = value ?? internal;
  const graphRef = React.useRef(graph);
  graphRef.current = graph;
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [measured, setMeasured] = React.useState<Record<string, { width: number; height: number }>>({});
  const history = React.useRef<{ past: EditorGraph<D>[]; future: EditorGraph<D>[] }>({ past: [], future: [] });
  const lastEdit = React.useRef<{ id: string; at: number } | null>(null);
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const set = (next: EditorGraph<D>) => {
    // Updated now, so two changes in one tick compose instead of clobbering.
    graphRef.current = next;
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  /** Applies a change and records it for undo. */
  const commit = (next: EditorGraph<D>) => {
    history.current.past.push(graphRef.current);
    history.current.future = [];
    lastEdit.current = null;
    set(next);
    rerender();
  };
  const undo = () => {
    const previous = history.current.past.pop();
    if (!previous) return;
    history.current.future.push(graphRef.current);
    set(previous);
    rerender();
  };
  const redo = () => {
    const next = history.current.future.pop();
    if (!next) return;
    history.current.past.push(graphRef.current);
    set(next);
    rerender();
  };

  const vertical = direction === "vertical";
  const counts = new Map<string, number>();
  for (const n of graph.nodes) counts.set(n.type ?? DEFAULT_TYPE, (counts.get(n.type ?? DEFAULT_TYPE) ?? 0) + 1);

  const keepFocus = () =>
    requestAnimationFrame(() => {
      if (!rootRef.current?.contains(document.activeElement)) rootRef.current?.focus({ preventScroll: true });
    });

  const removeNodes = (ids: string[]) => {
    const gone = new Set(ids);
    keepFocus();
    commit({
      nodes: graphRef.current.nodes.filter((n) => !gone.has(n.id)),
      edges: graphRef.current.edges.filter((e) => !gone.has(e.source) && !gone.has(e.target)),
    });
  };

  /** Edits from inside a node. A burst of typing in one node is one undo step. */
  const updateData = (id: string, patch: Partial<D> | ((data: D) => D)) => {
    const now = Date.now();
    const continuing = lastEdit.current?.id === id && now - lastEdit.current.at < 1000;
    const next = {
      ...graphRef.current,
      nodes: graphRef.current.nodes.map((n) =>
        n.id === id ? { ...n, data: typeof patch === "function" ? patch(n.data) : { ...n.data, ...patch } } : n,
      ),
    };
    if (continuing) set(next);
    else commit(next);
    lastEdit.current = { id, at: now };
  };

  const run = visitsOf(simulation);
  const taken = run ? takenEdges(run.shown) : null;

  const nodes: FlowNodeType[] = graph.nodes.map((node) => {
    const type = typeOf(node);
    const isSelected = selected.has(node.id);
    const frame = type.frame ?? "card";
    const body = type.render?.({
      id: node.id,
      data: node.data,
      selected: isSelected,
      readOnly,
      update: (patch) => !readOnly && updateData(node.id, patch),
      remove: () => !readOnly && removeNodes([node.id]),
    });
    const dataLabel = (node.data as { label?: unknown } | null)?.label;
    return {
      id: node.id,
      type: "flow",
      position: node.position,
      selected: isSelected,
      measured: measured[node.id],
      deletable: !readOnly,
      // With controls in the body, only the header drags; a frameless node drags anywhere
      // outside elements marked "nodrag".
      dragHandle: frame === "card" && body != null ? `.${DRAG_HANDLE_CLASS}` : undefined,
      sourcePosition: vertical ? Position.Bottom : Position.Right,
      targetPosition: vertical ? Position.Top : Position.Left,
      data: {
        label: type.title?.(node.data) ?? (typeof dataLabel === "string" ? dataLabel : type.label),
        icon: type.icon,
        color: type.color,
        variant: frame,
        description: body == null ? type.description : undefined,
        inputs: handleCount(type.inputs) === 0 ? [] : toHandles(type.inputs),
        outputs: handleCount(type.outputs) === 0 ? [] : toHandles(type.outputs),
        body,
        onRemove: readOnly || frame !== "card" ? undefined : () => removeNodes([node.id]),
        visit: run ? (run.visits.get(node.id) ?? { state: "unvisited" }) : undefined,
      },
    };
  });

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
    label: edge.label,
    selected: selected.has(edge.id),
    deletable: !readOnly,
    ...simulationEdgeStyle(edge, taken),
  }));

  const onNodesChange = (changes: NodeChange<FlowNodeType>[]) => {
    let next = graphRef.current;
    let moved = false;
    const sizes: typeof measured = {};
    const selection = new Set(selected);
    for (const change of changes) {
      if (change.type === "dimensions" && change.dimensions) sizes[change.id] = change.dimensions;
      else if (change.type === "select") change.selected ? selection.add(change.id) : selection.delete(change.id);
      else if (change.type === "position" && change.position) {
        const position = change.position;
        next = { ...next, nodes: next.nodes.map((n) => (n.id === change.id ? { ...n, position } : n)) };
        moved = true;
      }
    }
    if (Object.keys(sizes).length) setMeasured((m) => ({ ...m, ...sizes }));
    if (changes.some((c) => c.type === "select")) setSelected(selection);
    // Drags stream positions without recording; the snapshot was taken at drag start.
    if (moved) set(next);
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    if (!changes.some((c) => c.type === "select")) return;
    const selection = new Set(selected);
    for (const change of changes) {
      if (change.type === "select") change.selected ? selection.add(change.id) : selection.delete(change.id);
    }
    setSelected(selection);
  };

  // Removals arrive here once, nodes and edges together, so one delete is one undo step.
  const onDelete = ({ nodes: goneNodes, edges: goneEdges }: { nodes: FlowNodeType[]; edges: Edge[] }) => {
    const nodeIds = new Set(goneNodes.map((n) => n.id));
    const edgeIds = new Set(goneEdges.map((e) => e.id));
    if (nodeIds.size) keepFocus();
    commit({
      nodes: graphRef.current.nodes.filter((n) => !nodeIds.has(n.id)),
      edges: graphRef.current.edges.filter((e) => !edgeIds.has(e.id) && !nodeIds.has(e.source) && !nodeIds.has(e.target)),
    });
  };

  const isValidConnection = (connection: Connection | Edge) => {
    const { source, target } = connection;
    const g = graphRef.current;
    const s = g.nodes.find((n) => n.id === source);
    const t = g.nodes.find((n) => n.id === target);
    if (!s || !t || s.id === t.id) return false;
    if (handleCount(typeOf(s).outputs) === 0 || handleCount(typeOf(t).inputs) === 0) return false;
    const sourceHandle = connection.sourceHandle ?? null;
    if (g.edges.some((e) => e.source === source && e.target === target && (e.sourceHandle ?? null) === sourceHandle)) return false;
    if (!allowCycles && reaches(g.edges, t.id, s.id)) return false;
    return validateConnection
      ? validateConnection({ source: s, target: t, sourceHandle, targetHandle: connection.targetHandle ?? null }, g)
      : true;
  };

  const onConnect = (connection: Connection) => {
    if (readOnly || !isValidConnection(connection)) return;
    const source = graphRef.current.nodes.find((n) => n.id === connection.source);
    // An edge out of a named output carries that name.
    const label = source
      ? toHandles(typeOf(source).outputs)?.find((h) => h.id === connection.sourceHandle)?.label
      : undefined;
    commit({
      ...graphRef.current,
      edges: [
        ...graphRef.current.edges,
        {
          id: newId("e"),
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          label,
        },
      ],
    });
  };

  /** The nearest spot to `start` that doesn't cover an existing node, searching outward in rings. */
  const freeSpot = (start: { x: number; y: number }) => {
    const pad = 16;
    const taken = graphRef.current.nodes.map((n) => ({
      ...n.position,
      w: measured[n.id]?.width ?? NODE_SIZE.width,
      h: measured[n.id]?.height ?? NODE_SIZE.height,
    }));
    const free = (p: { x: number; y: number }) =>
      taken.every(
        (t) =>
          p.x + NODE_SIZE.width + pad <= t.x ||
          t.x + t.w + pad <= p.x ||
          p.y + NODE_SIZE.height + pad <= t.y ||
          t.y + t.h + pad <= p.y,
      );
    const stepX = NODE_SIZE.width + pad;
    const stepY = NODE_SIZE.height + pad;
    for (let ring = 0; ring < 8; ring++) {
      for (let dy = -ring; dy <= ring; dy++) {
        for (let dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const p = { x: start.x + dx * stepX, y: start.y + dy * stepY };
          if (free(p)) return p;
        }
      }
    }
    return start;
  };

  const addNode = (typeKey: string, at?: { x: number; y: number }) => {
    const type = types[typeKey];
    if (!type || readOnly) return;
    if (type.maxCount !== undefined && (counts.get(typeKey) ?? 0) >= type.maxCount) return;
    let position = at;
    if (!position) {
      const rect = canvasRef.current?.getBoundingClientRect();
      const center = rect
        ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        : { x: 0, y: 0 };
      position = freeSpot({ x: center.x - NODE_SIZE.width / 2, y: center.y - NODE_SIZE.height / 2 });
    }
    const id = newId(typeKey);
    const data = (typeof type.defaultData === "function" ? (type.defaultData as () => D)() : type.defaultData) ?? ({} as D);
    commit({ ...graphRef.current, nodes: [...graphRef.current.nodes, { id, type: typeKey, position, data }] });
    setSelected(new Set([id]));
    // A crowded centre can push the new node off screen: bring it into view.
    if (!at) {
      const rect = canvasRef.current?.getBoundingClientRect();
      const topLeft = rect && screenToFlowPosition({ x: rect.left, y: rect.top });
      const bottomRight = rect && screenToFlowPosition({ x: rect.right, y: rect.bottom });
      const placed = position;
      if (
        topLeft &&
        bottomRight &&
        (placed.x < topLeft.x || placed.y < topLeft.y || placed.x + NODE_SIZE.width > bottomRight.x || placed.y + NODE_SIZE.height > bottomRight.y)
      ) {
        setCenter(placed.x + NODE_SIZE.width / 2, placed.y + NODE_SIZE.height / 2, { zoom: getViewport().zoom, duration: 250 });
      }
    }
  };

  const tidy = () => {
    commit({
      ...graphRef.current,
      nodes: layeredLayout(graphRef.current.nodes, graphRef.current.edges, {
        direction,
        nodeWidth: NODE_SIZE.width,
        // Leave room for the tallest node, since bodies can hold anything.
        nodeHeight: Math.max(NODE_SIZE.height, ...Object.values(measured).map((m) => m.height)),
      }),
    });
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly || !(e.metaKey || e.ctrlKey)) return;
    // Let text fields keep their own undo.
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const key = e.key.toLowerCase();
    if (key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((key === "z" && e.shiftKey) || key === "y") {
      e.preventDefault();
      redo();
    }
  };

  return (
    <div
      ref={rootRef}
      data-slot="node-editor"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      // The canvas background can't take focus; focus the editor so ⌘Z reaches it.
      onPointerDownCapture={(e) => {
        if (!rootRef.current?.contains(document.activeElement) && !(e.target instanceof HTMLInputElement)) {
          rootRef.current?.focus({ preventScroll: true });
        }
      }}
      className={cn("bg-card flex flex-col overflow-hidden rounded-xl border outline-none md:flex-row", className)}
      style={{ height }}
    >
      {showPalette && (
        <Palette
          types={paletteTypes}
          counts={counts}
          onAdd={(type) => addNode(type)}
          title={labels?.palette ?? "Nodes"}
          searchLabel={labels?.search ?? "Search nodes…"}
        />
      )}
      <div
        ref={canvasRef}
        className="min-h-0 min-w-0 flex-1"
        onDragOver={(e) => {
          if (readOnly || !e.dataTransfer.types.includes(NODE_MIME)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          const type = e.dataTransfer.getData(NODE_MIME);
          if (!type || readOnly) return;
          e.preventDefault();
          const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
          addNode(type, { x: p.x - NODE_SIZE.width / 2, y: p.y - NODE_SIZE.height / 2 });
        }}
      >
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          readOnly={readOnly}
          minimap={minimap}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onDelete={onDelete}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onNodeDragStart={() => {
            history.current.past.push(graphRef.current);
            history.current.future = [];
            lastEdit.current = null;
            rerender();
          }}
          onNodeClick={(_, node) => {
            const found = graphRef.current.nodes.find((n) => n.id === node.id);
            if (found) onNodeClick?.(found);
          }}
          elementsSelectable
          emptyState={labels?.empty ?? (readOnly ? "Nothing here yet." : showPalette ? "Drag a node from the panel to start." : "No nodes yet.")}
          toolbar={
            readOnly ? undefined : (
              <FlowToolbarGroup>
                <FlowToolbarButton label="Undo (⌘Z)" onClick={undo} disabled={!history.current.past.length}>
                  <Undo2Icon />
                </FlowToolbarButton>
                <FlowToolbarButton label="Redo (⇧⌘Z)" onClick={redo} disabled={!history.current.future.length}>
                  <Redo2Icon />
                </FlowToolbarButton>
                <FlowToolbarButton label="Tidy up" onClick={tidy} disabled={graph.nodes.length < 2}>
                  <WandSparklesIcon />
                </FlowToolbarButton>
              </FlowToolbarGroup>
            )
          }
        />
      </div>
    </div>
  );
}

/**
 * A node-based editor built on xyflow. You decide what nodes show: give each
 * type a `render` function, or just put a `label` in a node's data.
 */
function NodeEditor<D = AnyData>(props: NodeEditorProps<D>) {
  return (
    <ReactFlowProvider>
      <Editor {...props} />
    </ReactFlowProvider>
  );
}

export { NodeEditor, layeredLayout };
export type { HandleSpec };
