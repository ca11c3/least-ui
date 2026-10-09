"use client";

import * as React from "react";
import {
  Position,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
} from "@xyflow/react";

import { DRAG_HANDLE_CLASS, FlowCanvas, simulationEdgeStyle, takenEdges, type FlowNodeType } from "./flow-canvas";
import { visitsOf, type NodeVisit, type SimulationView } from "./simulation";

const STEP_Y = 120;
const CARD_WIDTH = 224; // matches the card frame's w-56
const TERMINAL_WIDTH = 128;
const START = "__start__";
const END = "__end__";

export interface SequenceFlowProps<T> {
  value: string[];
  itemByKey: Map<string, T>;
  getLabel: (item: T) => string;
  getDescription?: (item: T) => React.ReactNode;
  /** Your content for a step; shown under a "Step n" header, as in the list. */
  renderStep?: (item: T, index: number) => React.ReactNode;
  readOnly: boolean;
  onChange: (keys: string[]) => void;
  onItemClick?: (item: T) => void;
  /** Data-transfer type the editor's panel drags with. */
  dragType: string;
  /** Changing this refits the view (e.g. entering full screen). */
  fitKey?: unknown;
  emptyState?: React.ReactNode;
  simulation?: SimulationView;
}

function Flow<T>({
  value,
  itemByKey,
  getLabel,
  getDescription,
  renderStep,
  readOnly,
  onChange,
  onItemClick,
  dragType,
  fitKey,
  emptyState,
  simulation,
}: SequenceFlowProps<T>) {
  const run = visitsOf(simulation);
  // Start lights up once a run begins; End only if every step ran without stopping.
  const reachedEnd = !!run && run.done && run.shown.length === value.length && value.length > 0;
  const path = run ? [START, ...run.shown.map((s) => s.nodeId), ...(reachedEnd ? [END] : [])] : [];
  const visitOf = (id: string): NodeVisit | undefined => {
    if (!run) return undefined;
    if (id === START) return run.shown.length ? { state: "visited" } : { state: "unvisited" };
    if (id === END) return reachedEnd ? { state: "visited" } : { state: "unvisited" };
    return run.visits.get(id) ?? { state: "unvisited" };
  };
  const { screenToFlowPosition } = useReactFlow();
  // Steps with your own content are taller: space them further apart.
  const stepY = renderStep ? 170 : STEP_Y;
  const without = (key: string) => value.filter((k) => k !== key);

  const derived = React.useMemo<FlowNodeType[]>(() => {
    const terminalX = (CARD_WIDTH - TERMINAL_WIDTH) / 2;
    const steps: FlowNodeType[] = value.map((key, index) => {
      const item = itemByKey.get(key);
      const body = item && renderStep ? renderStep(item, index) : undefined;
      return {
        id: key,
        type: "flow",
        // A vertical chain: rank by y, everything in one column.
        position: { x: 0, y: (index + 1) * stepY },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        draggable: !readOnly,
        // Custom content may hold controls: drag by the header only.
        dragHandle: body != null ? `.${DRAG_HANDLE_CLASS}` : undefined,
        data: body != null
          ? {
              label: `Step ${index + 1}`,
              body,
              onRemove: readOnly ? undefined : () => onChange(value.filter((k) => k !== key)),
              visit: visitOf(key),
            }
          : {
              eyebrow: `Step ${index + 1}`,
              label: item ? getLabel(item) : key,
              description: item ? getDescription?.(item) : undefined,
              onRemove: readOnly ? undefined : () => onChange(value.filter((k) => k !== key)),
              visit: visitOf(key),
            },
      };
    });
    const terminal = (id: string, label: string, y: number): FlowNodeType => ({
      id,
      type: "flow",
      position: { x: terminalX, y },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      draggable: false,
      selectable: false,
      deletable: false,
      data: {
        label,
        variant: "terminal",
        inputs: id === END ? undefined : [],
        outputs: id === START ? undefined : [],
        visit: visitOf(id),
      },
    });
    return [
      terminal(START, "Start", 0),
      ...steps,
      terminal(END, "End", (value.length + (value.length ? 1 : 2)) * stepY),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, itemByKey, getLabel, getDescription, renderStep, readOnly, onChange, stepY, simulation]);

  // Local copy so nodes follow the pointer while dragging; reset whenever the sequence changes.
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeType>(derived);
  React.useEffect(() => setNodes(derived), [derived, setNodes]);

  const taken = run ? takenEdges(path.map((nodeId) => ({ nodeId }))) : null;
  const edges = React.useMemo<Edge[]>(() => {
    // An empty sequence doesn't flow: leave Start and End apart.
    if (value.length === 0) return [];
    const chain = [START, ...value, END];
    return chain.slice(0, -1).map((source, i) => ({
      id: `${source}->${chain[i + 1]}`,
      source,
      target: chain[i + 1],
      animated: true,
      deletable: false,
      ...simulationEdgeStyle({ source, target: chain[i + 1] }, taken),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, simulation]);

  // Drawing an edge re-ranks: the target lands straight after the source, so
  // Start → X makes X first and X → End makes X last.
  const connect = ({ source, target }: Connection) => {
    if (readOnly || !source || !target || source === target) return;
    if (source === START) {
      if (value.includes(target)) onChange([target, ...without(target)]);
      return;
    }
    if (target === END) {
      if (value.includes(source)) onChange([...without(source), source]);
      return;
    }
    if (!value.includes(source) || !value.includes(target)) return;
    const next = without(target);
    next.splice(next.indexOf(source) + 1, 0, target);
    onChange(next);
  };

  return (
    <div
      className="h-full w-full"
      onDragOver={
        readOnly
          ? undefined
          : (event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }
      }
      onDrop={
        readOnly
          ? undefined
          : (event) => {
              event.preventDefault();
              const key = event.dataTransfer.getData(dragType);
              if (!key || !itemByKey.has(key) || value.includes(key)) return;
              const { y } = screenToFlowPosition({ x: event.clientX, y: event.clientY });
              // Insert above the first step whose slot is below the drop point.
              const index = value.findIndex((_, i) => y < (i + 1) * stepY + stepY / 2);
              const next = [...value];
              next.splice(index < 0 ? next.length : index, 0, key);
              onChange(next);
            }
      }
    >
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        readOnly={readOnly}
        onNodesChange={onNodesChange}
        onConnect={connect}
        fitKey={`${value.length}:${String(fitKey)}`}
        deleteKeyCode={null}
        onNodeClick={(_, node) => {
          const item = itemByKey.get(node.id);
          if (item) onItemClick?.(item);
        }}
        onNodeDragStop={(_, dragged) => {
          if (readOnly || dragged.id.startsWith("__")) return;
          // Dropping a step between two others moves it there: order by height.
          const order = nodes
            .map((n) => (n.id === dragged.id ? dragged : n))
            .filter((n) => !n.id.startsWith("__"))
            .sort((a, b) => a.position.y - b.position.y)
            .map((n) => n.id);
          if (order.some((k, i) => k !== value[i])) onChange(order);
          else setNodes(derived); // Snap back into the column.
        }}
      >
        {value.length === 0 && emptyState && (
          <div className="text-muted-foreground pointer-events-none absolute inset-x-0 bottom-6 z-10 text-center text-sm">
            {emptyState}
          </div>
        )}
      </FlowCanvas>
    </div>
  );
}

/** The sequence editor's flow view. Loaded lazily, so list-only editors never load xyflow. */
export default function SequenceFlow<T>(props: SequenceFlowProps<T>) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}
