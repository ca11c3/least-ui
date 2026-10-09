"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  GitBranch,
  GripVertical,
  ListOrdered,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { useIsDesktop } from "../hooks/useMobile";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Input } from "./input";
import Spinner from "./spinner";
import type { SequenceFlowProps } from "../node-editor/sequence-flow";
import { visitsOf, type NodeVisit, type SimulationView } from "../node-editor/simulation";
import { ToneIcon, toneColor } from "../node-editor/tone";

// Loaded on first use, so editors that only show the list never pull in xyflow.
const SequenceFlow = React.lazy(() => import("../node-editor/sequence-flow")) as unknown as <T>(
  props: SequenceFlowProps<T>,
) => React.ReactElement;

const DEFAULT_PANEL_WIDTH = 304;
const MIN_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 480;
const MIN_WORKSPACE_WIDTH = 480;

export type SequenceEditorLabels = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  workspaceTitle?: React.ReactNode;
  workspaceDescription?: React.ReactNode;
  searchPlaceholder?: string;
  /** Shown in the sequence while it's empty. */
  empty?: React.ReactNode;
  noMatches?: React.ReactNode;
  /** Singular noun for an item, used in accessible labels, e.g. "rule". */
  itemNoun?: string;
  /** Mobile pane switcher labels. */
  panelTab?: string;
  sequenceTab?: string;
  /** View switch labels. */
  listView?: string;
  flowView?: string;
};

export type SequenceItemState = {
  /** Whether the item is in the sequence. */
  selected: boolean;
  /** Zero-based position in the sequence, or -1. */
  index: number;
};

export interface SequenceEditorProps<T> {
  /** The pool of items that can be added to the sequence. */
  items: readonly T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  /** Secondary line under the label in the sequence. */
  getDescription?: (item: T) => React.ReactNode;
  /** Text the panel search matches against. Defaults to the label. */
  getSearchText?: (item: T) => string;
  /** Body of a panel card. Defaults to the label and description. */
  renderItem?: (item: T, state: SequenceItemState) => React.ReactNode;
  /** Body of a sequence row (after the step number). Defaults to the label and description. */
  renderStep?: (item: T, index: number) => React.ReactNode;

  /** Ordered item keys. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (keys: string[]) => void;

  /** Called when an item card or step is clicked, e.g. to open its details. */
  onItemClick?: (item: T) => void;
  /** In read-only mode, steps become links to this URL. */
  getItemHref?: (item: T) => string;
  /** Element for those links, e.g. Next.js `Link`. Defaults to `a`. */
  linkComponent?: React.ElementType;

  /** Shows the sequence only, in a collapsible section. */
  readOnly?: boolean;
  /** Top divider in read-only mode; set false when it sits right under a section header. */
  bordered?: boolean;
  /** Initial open state of the read-only section. */
  defaultOpen?: boolean;
  /** Show the full-screen toggle. */
  allowFullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
  /**
   * Views of the sequence: an ordered list, and a flow diagram (needs the
   * optional `@xyflow/react` peer). Both edit the same order.
   */
  views?: ("list" | "flow")[];
  defaultView?: "list" | "flow";
  /**
   * Highlights a run through the sequence, in both views: each step's result,
   * and the steps it never reached faded. Build one with `simulateSequence`.
   */
  simulation?: SimulationView;
  /** Extra controls for the workspace toolbar. */
  toolbar?: React.ReactNode;
  labels?: SequenceEditorLabels;
  className?: string;
}

/** Adds `key` to the end of `keys`, or removes it if present. */
export function toggleSequenceKey(keys: readonly string[], key: string) {
  return keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key];
}

/** Moves `key` (or inserts it, if absent) so it ends up at `targetIndex`. */
export function moveSequenceKey(keys: readonly string[], key: string, targetIndex: number) {
  const next = keys.filter((k) => k !== key);
  next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, key);
  return next;
}

/** Keys to `{ key, priority }` rows numbered from 1, a common API shape. */
export function withPriority(keys: readonly string[]) {
  return keys.map((key, index) => ({ key, priority: index + 1 }));
}

const DRAG_TYPE = "text/plain";

function SequenceEditor<T>({
  items,
  getKey,
  getLabel,
  getDescription,
  getSearchText,
  renderItem,
  renderStep,
  value: valueProp,
  defaultValue,
  onValueChange,
  onItemClick,
  getItemHref,
  linkComponent: LinkComponent = "a",
  readOnly = false,
  bordered = true,
  defaultOpen = true,
  allowFullscreen = true,
  views = ["list", "flow"],
  defaultView,
  simulation,
  onFullscreenChange,
  toolbar,
  labels: labelsProp,
  className,
}: SequenceEditorProps<T>) {
  const labels = {
    title: "Sequence",
    description: "Drag items from the panel into the sequence, then arrange the order they run in.",
    workspaceTitle: "Sequence workspace",
    workspaceDescription: "Items run in the order shown.",
    searchPlaceholder: "Search…",
    empty: "Drag items from the panel to build the sequence.",
    noMatches: "No matching items.",
    itemNoun: "item",
    panelTab: "Items",
    sequenceTab: "Sequence",
    listView: "List",
    flowView: "Flow",
    ...labelsProp,
  };

  const [internalValue, setInternalValue] = React.useState(defaultValue ?? []);
  const value = valueProp ?? internalValue;
  const setValue = (next: string[]) => {
    if (valueProp === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  const [draggedKey, setDraggedKey] = React.useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [isPanelOpen, setIsPanelOpen] = React.useState(true);
  const [mobileView, setMobileView] = React.useState<"items" | "sequence">("sequence");
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [view, setView] = React.useState<"list" | "flow">(defaultView ?? views[0] ?? "list");
  const activeView = views.includes(view) ? view : (views[0] ?? "list");
  const isDesktop = useIsDesktop();
  // On mobile the segmented control picks the visible pane; on desktop the panel toggle wins.
  const effectiveIsPanelOpen = isDesktop ? isPanelOpen : mobileView === "items";
  const showMobileSwitcher = !readOnly && !isDesktop;
  const editorRef = React.useRef<HTMLDivElement>(null);
  const panelId = React.useId();

  const itemByKey = React.useMemo(() => new Map(items.map((item) => [getKey(item), item])), [items, getKey]);
  const canEdit = !readOnly;

  const toggleItem = (key: string) => {
    if (canEdit) setValue(toggleSequenceKey(value, key));
  };

  const moveItem = (key: string, targetIndex: number) => {
    if (!canEdit) return;
    // Dragged straight from the panel: only insert keys that exist.
    if (!value.includes(key) && !itemByKey.has(key)) return;
    const next = moveSequenceKey(value, key, targetIndex);
    if (next.some((k, i) => k !== value[i]) || next.length !== value.length) setValue(next);
  };

  const beginDrag = (event: React.DragEvent<HTMLElement>, key: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(DRAG_TYPE, key);
    setDraggedKey(key);
  };

  const finishDrag = () => {
    setDraggedKey(null);
    setDragOverIndex(null);
  };

  const dropAt = (event: React.DragEvent<HTMLElement>, targetIndex: number) => {
    event.preventDefault();
    const key = draggedKey ?? event.dataTransfer.getData(DRAG_TYPE);
    if (key) moveItem(key, targetIndex);
    finishDrag();
  };

  const setFullscreen = (next: boolean) => {
    setIsFullscreen(next);
    onFullscreenChange?.(next);
  };

  React.useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
        onFullscreenChange?.(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  const describe = (item: T | undefined, key: string) => (item ? getLabel(item) : key);

  return (
    <Collapsible
      data-slot="sequence-editor"
      open={readOnly ? isOpen : true}
      onOpenChange={readOnly ? setIsOpen : undefined}
      className={cn(readOnly ? bordered && "border-t pt-4" : "space-y-4", className)}
    >
      <div className="flex min-w-0 items-center gap-2">
        {readOnly && (
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="bg-primary/10 text-primary hover:bg-primary/15 size-8 shrink-0"
              aria-label={isOpen ? "Collapse sequence" : "Expand sequence"}
            >
              <ChevronRight className={cn("size-4 transition-transform", isOpen && "rotate-90")} />
            </Button>
          </CollapsibleTrigger>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold">{labels.title}</p>
          {!readOnly && labels.description && (
            <p className="text-muted-foreground text-xs">{labels.description}</p>
          )}
        </div>
      </div>

      <CollapsibleContent
        className={cn(
          "data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden rounded-md border",
          readOnly && "bg-muted/15 mt-3",
          isFullscreen && "bg-background fixed inset-0 z-100 mt-0 flex h-dvh w-screen flex-col rounded-none border-0",
        )}
      >
        {showMobileSwitcher && (
          <div role="tablist" aria-label="Editor view" className="flex gap-1 border-b p-2 lg:hidden">
            <Button
              type="button"
              role="tab"
              aria-selected={mobileView === "items"}
              variant={mobileView === "items" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setMobileView("items")}
            >
              {labels.panelTab} · {items.length}
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={mobileView === "sequence"}
              variant={mobileView === "sequence" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setMobileView("sequence")}
            >
              {labels.sequenceTab} · {value.length}
            </Button>
          </div>
        )}

        <div
          ref={editorRef}
          className={cn(
            readOnly ? "min-h-0" : "grid min-h-112 lg:flex",
            isFullscreen && "h-full min-h-0 flex-1 lg:flex",
          )}
        >
          {!readOnly && (
            <ItemPanel
              id={panelId}
              isOpen={effectiveIsPanelOpen}
              isDesktop={isDesktop}
              isFullscreen={isFullscreen}
              editorRef={editorRef}
              items={items}
              value={value}
              getKey={getKey}
              getLabel={getLabel}
              getDescription={getDescription}
              getSearchText={getSearchText}
              renderItem={renderItem}
              labels={labels}
              onItemClick={onItemClick}
              onAdd={toggleItem}
              onDrop={(event) => dropAt(event, value.length)}
              onBeginDrag={beginDrag}
              onFinishDrag={finishDrag}
            />
          )}

          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col transition-colors",
              // Dim the workspace while an item is dragged, from the panel or within the sequence.
              draggedKey ? "bg-muted/35" : "bg-card",
              showMobileSwitcher && mobileView === "items" && "hidden lg:flex",
            )}
          >
            <div className={cn("flex flex-wrap items-center gap-3 border-b px-3 py-2", readOnly ? "justify-end" : "justify-between")}>
              {!readOnly && (
                <div className="flex min-w-0 items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="hidden size-8 shrink-0 lg:inline-flex"
                    aria-expanded={isPanelOpen}
                    aria-controls={panelId}
                    aria-label={isPanelOpen ? "Collapse panel" : "Expand panel"}
                    onClick={() => setIsPanelOpen((prev) => !prev)}
                  >
                    {isPanelOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
                  </Button>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{labels.workspaceTitle}</p>
                    {labels.workspaceDescription && (
                      <p className="text-muted-foreground text-xs">{labels.workspaceDescription}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                {toolbar}
                {views.length > 1 && (
                  <div role="group" aria-label="View" className="bg-muted flex rounded-md p-0.5">
                    {views.map((v) => {
                      const Icon = v === "list" ? ListOrdered : GitBranch;
                      return (
                        <button
                          key={v}
                          type="button"
                          aria-pressed={activeView === v}
                          onClick={() => setView(v)}
                          className={cn(
                            "text-muted-foreground focus-visible:ring-ring/50 flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2",
                            activeView === v ? "bg-card text-foreground shadow-xs" : "hover:text-foreground",
                          )}
                        >
                          <Icon className="size-3.5" />
                          {v === "list" ? labels.listView : labels.flowView}
                        </button>
                      );
                    })}
                  </div>
                )}
                {allowFullscreen && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                    aria-label={isFullscreen ? "Exit full screen" : "Open full screen"}
                    title={isFullscreen ? "Exit full screen" : "Full screen"}
                    onClick={() => setFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                  </Button>
                )}
              </div>
            </div>

            {activeView === "flow" ? (
              <div className={cn("min-h-0", isFullscreen ? "flex-1" : "h-112")}>
                <React.Suspense
                  fallback={
                    <div className="text-muted-foreground grid h-full place-items-center">
                      <Spinner className="size-5" />
                    </div>
                  }
                >
                  <SequenceFlow
                    value={value}
                    itemByKey={itemByKey}
                    getLabel={getLabel}
                    getDescription={getDescription}
                    renderStep={renderStep}
                    readOnly={readOnly}
                    onChange={(keys) => canEdit && setValue(keys)}
                    onItemClick={onItemClick}
                    dragType={DRAG_TYPE}
                    fitKey={isFullscreen}
                    emptyState={labels.empty}
                    simulation={simulation}
                  />
                </React.Suspense>
              </div>
            ) : (
            <div className={cn("flex flex-1 flex-col p-3", isFullscreen && "min-h-0 overflow-y-auto")}>
              <SequenceList
                value={value}
                itemByKey={itemByKey}
                readOnly={readOnly}
                draggedKey={draggedKey}
                dragOverIndex={dragOverIndex}
                labels={labels}
                describe={describe}
                getDescription={getDescription}
                renderStep={renderStep}
                getItemHref={getItemHref}
                LinkComponent={LinkComponent}
                onBeginDrag={beginDrag}
                onFinishDrag={finishDrag}
                onDragEnter={setDragOverIndex}
                onDrop={dropAt}
                onMove={moveItem}
                onRemove={toggleItem}
                onItemClick={onItemClick}
                visits={visitsOf(simulation)?.visits ?? null}
              />
            </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

type ResolvedLabels = Required<SequenceEditorLabels>;

function DefaultBody({ label, description }: { label: string; description?: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{label}</p>
      {description != null && description !== "" && (
        <p className="text-muted-foreground truncate text-xs">{description}</p>
      )}
    </div>
  );
}

function ItemPanel<T>({
  id,
  isOpen,
  isDesktop,
  isFullscreen,
  editorRef,
  items,
  value,
  getKey,
  getLabel,
  getDescription,
  getSearchText,
  renderItem,
  labels,
  onItemClick,
  onAdd,
  onDrop,
  onBeginDrag,
  onFinishDrag,
}: {
  id: string;
  isOpen: boolean;
  isDesktop: boolean;
  isFullscreen: boolean;
  editorRef: React.RefObject<HTMLDivElement | null>;
  items: readonly T[];
  value: string[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  getDescription?: (item: T) => React.ReactNode;
  getSearchText?: (item: T) => string;
  renderItem?: (item: T, state: SequenceItemState) => React.ReactNode;
  labels: ResolvedLabels;
  onItemClick?: (item: T) => void;
  onAdd: (key: string) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onBeginDrag: (event: React.DragEvent<HTMLElement>, key: string) => void;
  onFinishDrag: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const [panelWidth, setPanelWidth] = React.useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = React.useState(false);
  const resizeStart = React.useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  React.useEffect(
    () => () => {
      if (resizeStart.current) {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    },
    [],
  );

  const query = search.trim().toLowerCase();
  const filtered = query
    ? items.filter((item) => (getSearchText ?? getLabel)(item).toLowerCase().includes(query))
    : items;

  const maxPanelWidth = () =>
    Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, (editorRef.current?.clientWidth ?? 960) - MIN_WORKSPACE_WIDTH));
  const clampWidth = (width: number) => Math.min(maxPanelWidth(), Math.max(MIN_PANEL_WIDTH, width));

  const endResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resizeStart.current = null;
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  const easing = "cubic-bezier(0.32, 0.72, 0, 1)";

  return (
    <aside
      id={id}
      aria-hidden={!isOpen}
      inert={!isOpen}
      style={
        isDesktop
          ? {
              width: isOpen ? panelWidth : 0,
              flexBasis: isOpen ? panelWidth : 0,
              transitionProperty: "width, flex-basis, border-color, box-shadow",
              transitionDuration: isResizing ? "0ms" : isOpen ? "500ms" : "300ms",
              transitionTimingFunction: easing,
            }
          : undefined
      }
      className={cn(
        "bg-muted/20 relative min-w-0 overflow-hidden transition-[max-height,border-color,box-shadow] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[width,flex-basis] lg:shrink-0 lg:border-r lg:border-b-0",
        isOpen
          ? "border-border max-h-160 border-b duration-500 lg:max-h-none lg:shadow-[4px_0_12px_-10px_rgb(15_23_42/0.35)]"
          : "pointer-events-none max-h-0 border-transparent duration-300 lg:max-h-none",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        event.stopPropagation();
        onDrop(event);
      }}
    >
      <div
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          opacity: isOpen ? 1 : 0,
          transitionProperty: "transform, opacity",
          transitionDuration: isOpen ? "500ms" : "300ms",
          transitionTimingFunction: easing,
          width: isDesktop ? panelWidth : undefined,
        }}
        className="w-full p-3 will-change-transform"
      >
        <div className="relative mb-3">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            className="h-9 pl-8"
          />
        </div>

        <div className={cn("max-h-80 space-y-2 overflow-y-auto pr-1", isFullscreen ? "lg:max-h-[calc(100dvh-6rem)]" : "lg:max-h-136")}>
          {filtered.map((item) => {
            const key = getKey(item);
            const index = value.indexOf(key);
            const selected = index >= 0;
            const label = getLabel(item);
            return (
              // A div, not a button: browsers won't start an HTML5 drag on form controls.
              <div
                key={key}
                role="button"
                tabIndex={0}
                aria-label={
                  selected
                    ? `${label}, already at step ${index + 1}`
                    : `${label}, drag into the sequence to add`
                }
                title={selected ? `Already at step ${index + 1}` : "Drag into the sequence"}
                onClick={() => onItemClick?.(item)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  onItemClick?.(item);
                }}
                draggable={!selected}
                onDragStart={selected ? undefined : (event) => onBeginDrag(event, key)}
                onDragEnd={selected ? undefined : onFinishDrag}
                className={cn(
                  "relative flex w-full items-center gap-2.5 overflow-hidden rounded-md border p-2.5 text-left transition-[border-color,box-shadow,background-color]",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                  !selected && "cursor-grab active:cursor-grabbing",
                  selected
                    ? "border-primary bg-card/35 shadow-[0_2px_8px_rgb(15_23_42/0.08)]"
                    : "hover:border-foreground/20 hover:bg-card hover:shadow-lg",
                )}
              >
                {renderItem ? (
                  <div className="min-w-0 flex-1">{renderItem(item, { selected, index })}</div>
                ) : (
                  <DefaultBody label={label} description={getDescription?.(item)} />
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  color={selected ? "var(--success)" : "var(--accent)"}
                  className="size-8 shrink-0"
                  disabled={selected}
                  aria-label={selected ? `${label} is already at step ${index + 1}` : `Add ${label} to the sequence`}
                  title={selected ? `Already at step ${index + 1}` : "Add to sequence"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onAdd(key);
                  }}
                >
                  {selected ? <Check className="text-success size-4" /> : <Plus className="size-4" />}
                </Button>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-muted-foreground px-2 py-8 text-center text-sm">{labels.noMatches}</p>
          )}
        </div>
      </div>

      {isOpen && isDesktop && (
        <div
          role="separator"
          aria-label="Resize panel"
          aria-orientation="vertical"
          aria-valuemin={MIN_PANEL_WIDTH}
          aria-valuemax={MAX_PANEL_WIDTH}
          aria-valuenow={Math.round(panelWidth)}
          tabIndex={0}
          title="Drag to resize"
          onPointerDown={(event) => {
            event.preventDefault();
            resizeStart.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: panelWidth };
            event.currentTarget.setPointerCapture(event.pointerId);
            setIsResizing(true);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
          onPointerMove={(event) => {
            const start = resizeStart.current;
            if (!start || start.pointerId !== event.pointerId) return;
            setPanelWidth(clampWidth(start.startWidth + event.clientX - start.startX));
          }}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          onKeyDown={(event) => {
            let next = panelWidth;
            if (event.key === "ArrowLeft") next -= 16;
            else if (event.key === "ArrowRight") next += 16;
            else if (event.key === "Home") next = MIN_PANEL_WIDTH;
            else if (event.key === "End") next = maxPanelWidth();
            else return;
            event.preventDefault();
            setPanelWidth(clampWidth(next));
          }}
          className="group absolute inset-y-0 right-0 z-20 hidden w-3 cursor-col-resize touch-none items-center justify-center outline-none lg:flex"
        >
          <span
            className={cn(
              "bg-border group-hover:bg-primary group-focus-visible:bg-primary h-10 w-1 rounded-full transition-[height,background-color] group-hover:h-14 group-focus-visible:h-14",
              isResizing && "bg-primary h-14",
            )}
          />
        </div>
      )}
    </aside>
  );
}

function SequenceList<T>({
  value,
  itemByKey,
  readOnly,
  draggedKey,
  dragOverIndex,
  labels,
  describe,
  getDescription,
  renderStep,
  getItemHref,
  LinkComponent,
  onBeginDrag,
  onFinishDrag,
  onDragEnter,
  onDrop,
  onMove,
  onRemove,
  onItemClick,
  visits,
}: {
  visits: Map<string, NodeVisit> | null;
  value: string[];
  itemByKey: Map<string, T>;
  readOnly: boolean;
  draggedKey: string | null;
  dragOverIndex: number | null;
  labels: ResolvedLabels;
  describe: (item: T | undefined, key: string) => string;
  getDescription?: (item: T) => React.ReactNode;
  renderStep?: (item: T, index: number) => React.ReactNode;
  getItemHref?: (item: T) => string;
  LinkComponent: React.ElementType;
  onBeginDrag: (event: React.DragEvent<HTMLElement>, key: string) => void;
  onFinishDrag: () => void;
  onDragEnter: (index: number) => void;
  onDrop: (event: React.DragEvent<HTMLElement>, index: number) => void;
  onMove: (key: string, targetIndex: number) => void;
  onRemove: (key: string) => void;
  onItemClick?: (item: T) => void;
}) {
  if (!value.length) {
    return (
      <div
        onDragOver={readOnly ? undefined : (event) => event.preventDefault()}
        onDrop={readOnly ? undefined : (event) => onDrop(event, 0)}
        className="text-muted-foreground grid min-h-72 flex-1 place-items-center rounded-md border border-dashed p-4 text-center text-sm"
      >
        <div>
          <ListOrdered className="mx-auto mb-2 size-6 opacity-50" />
          {labels.empty}
        </div>
      </div>
    );
  }

  return (
    <ol
      className="flex flex-1 flex-col gap-2"
      onDragOver={
        readOnly
          ? undefined
          : (event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }
      }
      onDrop={readOnly ? undefined : (event) => onDrop(event, value.length)}
    >
      {value.map((key, index) => {
        const item = itemByKey.get(key);
        const label = describe(item, key);
        const visit = visits ? (visits.get(key) ?? { state: "unvisited" as const }) : null;
        const rowClassName = cn(
          "@container/row flex shrink-0 items-center gap-3 overflow-hidden rounded-md border p-2.5 transition-[border-color,box-shadow,background-color,opacity]",
          draggedKey && draggedKey !== key && dragOverIndex === index && "border-primary bg-primary/5 ring-primary/25 ring-2",
          visit?.state === "unvisited" && "opacity-40",
          visit && visit.state !== "unvisited" && "border-2 border-(--visit-color)",
          visit?.state === "current" && "shadow-[0_0_0_3px_color-mix(in_srgb,var(--visit-color)_20%,transparent)]",
        );
        const visitStyle = visit && visit.state !== "unvisited"
          ? ({ "--visit-color": toneColor[visit.tone ?? "neutral"] } as React.CSSProperties)
          : undefined;
        const visitBadge = visit && visit.state !== "unvisited" && visit.note && (
          <span
            title={visit.note}
            className="bg-card flex max-w-40 shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium @min-[22rem]/row:px-2"
          >
            <ToneIcon tone={visit.tone} className="size-3" />
            {/* Narrow rows keep the icon only, so the item's name keeps its room. */}
            <span className="hidden truncate @min-[22rem]/row:inline">{visit.note}</span>
          </span>
        );
        const body = (
          <>
            {!readOnly && <GripVertical className="text-muted-foreground size-4 shrink-0 cursor-grab" />}
            <span className="bg-primary text-primary-foreground grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold">
              {index + 1}
            </span>
            {item && renderStep ? (
              <div className="min-w-0 flex-1">{renderStep(item, index)}</div>
            ) : (
              <DefaultBody label={label} description={item ? getDescription?.(item) : undefined} />
            )}
            {visitBadge}
          </>
        );

        if (readOnly) {
          const href = item && getItemHref?.(item);
          const interactive =
            "hover:border-foreground/20 hover:bg-muted/20 focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none";
          return (
            <li key={key}>
              {href ? (
                <LinkComponent href={href} aria-label={`View ${label}`} className={cn(rowClassName, interactive)} style={visitStyle}>
                  {body}
                </LinkComponent>
              ) : item && onItemClick ? (
                <button type="button" onClick={() => onItemClick(item)} className={cn(rowClassName, interactive, "w-full text-left")} style={visitStyle}>
                  {body}
                </button>
              ) : (
                <div className={rowClassName} style={visitStyle}>{body}</div>
              )}
            </li>
          );
        }

        return (
          <li
            key={key}
            draggable
            onDragStart={(event) => onBeginDrag(event, key)}
            onDragEnd={onFinishDrag}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDragEnter={() => onDragEnter(index)}
            onDrop={(event) => {
              event.stopPropagation();
              onDrop(event, index);
            }}
            onClick={() => item && onItemClick?.(item)}
            className={cn(rowClassName, onItemClick && item && "cursor-pointer")}
            style={visitStyle}
          >
            {body}
            <div className="flex shrink-0 items-center">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                disabled={index === 0}
                aria-label={`Move ${label} up`}
                onClick={(event) => {
                  event.stopPropagation();
                  onMove(key, index - 1);
                }}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                disabled={index === value.length - 1}
                aria-label={`Move ${label} down`}
                onClick={(event) => {
                  event.stopPropagation();
                  onMove(key, index + 1);
                }}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                color="var(--destructive)"
                className="size-8"
                aria-label={`Remove ${label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(key);
                }}
              >
                <Trash2 className="text-destructive size-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { SequenceEditor };
