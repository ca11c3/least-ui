"use client";

// DataTable — the shared table used by every list page in the dashboard.
//
// It is a thin shell around TanStack Table (headless: it owns row models,
// sorting and selection, but renders nothing) drawn with TableGrid, which is
// CSS grid rather than <table>. That choice shapes most of this file:
//
//   • Every row is its own grid element. Rows do not share a table layout
//     algorithm, so the column widths have to be computed here and handed to
//     each row as the same `gridTemplateColumns` string. Anything that would
//     resolve per row — `max-content`, `auto` — would let the header drift
//     out of line with the cells, which is why widths that depend on content
//     are measured from the DOM instead (see the action-column measurement
//     and `fitColumnToContent`).
//   • Grid lets a cell be `position: sticky` and lets rows carry hover and
//     selection state as a group, which a table layout makes awkward.
//
// State lives here, not in the caller: column sizing, sorting, row selection
// and page size. The caller supplies data and column definitions, and is told
// about selection through `onSelectionChange`.
//
// Columns fall into roles that decide how they size and where they sit —
// see the column-role helpers below.

import { CopyButton } from "../components/copy-button";
import {
  TableGrid,
  TableGridBody,
  TableGridCell,
  TableGridHead,
  TableGridHeader,
  TableGridRow,
  type TableGridDensity,
} from "../components/table-grid";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useIsMobile } from "../hooks/useMobile";
import { cn } from "../lib/utils";
import { Checkbox } from "../components/checkbox";
import {
  Column,
  ColumnDef,
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowSelectionState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/button";
import ExtraInfoHint from "../components/extra-info-hint";
import { LinearProgress } from "../components/linear-progress";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";
import Spinner from "../components/spinner";

// Per-column options a caller attaches via `columnDef.meta`. These are the
// knobs DataTable reads that TanStack Table itself knows nothing about.
export type DataTableMeta = {
  whiteSpace?: "nowrap" | "normal";
  /** Shows a copy-to-clipboard button on hover, carrying the cell's value. */
  copyable?: boolean;
  /** Pins the column to the right edge. Also opts a column out of the
   *  name-based role guess — see `isStickyColumn`. */
  isSticky?: boolean;
  /** Width in px to use instead of `size` on small viewports. */
  mobileSize?: number;
  /** Renders a hint popover beside the header label. */
  renderExtraInfo?: () => React.ReactNode;
};
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  whiteSpace?: "nowrap" | "normal";
  pagination?: {
    enabled?: boolean;
    rowsPerPage?: number;
    mode?: "infinite" | "paginated";
  };
  isScrollTop?: boolean;
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string | undefined;
  enableRowSelection?: boolean;
  selectVisibleRowsOnly?: boolean;
  onSelectionChange?: (rows: TData[]) => void;
  onDeleteSelected?: (rows: TData[]) => void;
  isRowSelectable?: (row: TData) => boolean;
  getRowId?: (row: TData, index: number) => string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  totalRecords?: number;
  error?: string | React.ReactNode;
  toolbar?: React.ReactNode;
  viewportClassName?: string;
  /** Row padding: "sm" for compact lists, "lg" for roomier tables. */
  density?: TableGridDensity;
  /** Record count, pagination and scroll-to-top bar under the table. */
  showFooter?: boolean;
}

type SorterProps<TData> = {
  column: Column<TData, unknown>;
};

// Builds the page-number strip, collapsing long ranges with ellipses so the
// control keeps a fixed width: every page up to 7, otherwise a window around
// the current page with the first and last page always reachable.
function getPaginationItems(currentPage: number, pageCount: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", pageCount];
  }

  if (currentPage >= pageCount - 2) {
    return [
      1,
      "ellipsis",
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    pageCount,
  ];
}

/* ── Column roles ───────────────────────────────────────────────────────────
 *
 * A column is one of: the injected selection checkbox ("select"), a
 * row-actions column (buttons that act on the row), or a data column. The
 * role decides how the column is sized and whether it is pinned.
 *
 * Role is guessed from the column id — an id of "action" or "actions" is
 * taken to be row actions — because most callers name that column the same
 * way and would otherwise have to declare it every time. The guess is wrong
 * for a data column that happens to be called "Action", so `meta.isSticky:
 * false` is the opt-out: it says "this is ordinary data", and both helpers
 * below honour it.
 * ────────────────────────────────────────────────────────────────────────── */

// Whether the column is pinned to the right edge while the grid scrolls
// horizontally. Explicit meta wins over the name-based guess.
function isStickyColumn<TData>(
  column: Column<TData, unknown>,
  isMobile: boolean,
) {
  const columnId = column.id.toLowerCase();
  const meta = (column.columnDef.meta as DataTableMeta) ?? {};

  // Action columns should scroll naturally on small screens instead of
  // covering narrow data columns, even when they are explicitly sticky on
  // larger viewports.
  if (isMobile && (columnId === "action" || columnId === "actions")) {
    return false;
  }

  if (meta.isSticky === false) return false;
  if (meta.isSticky === true) return true;

  return columnId === "action" || columnId === "actions";
}

// Whether the column holds row actions. Separate from stickiness because the
// two answers differ on mobile, where an actions column stops being pinned
// but is still sized to its buttons rather than given a share of the grid.
function isRowActionsColumn<TData>(column: Column<TData, unknown>) {
  const columnId = column.id.toLowerCase();
  const meta = (column.columnDef.meta as DataTableMeta) ?? {};

  if (meta.isSticky === false) return false;

  return columnId === "action" || columnId === "actions";
}

function getColumnMeta<TData>(column: Column<TData, unknown>): DataTableMeta {
  return (column.columnDef.meta as DataTableMeta) ?? {};
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  whiteSpace = "normal",
  pagination,
  isScrollTop = true,
  onLoadMore,
  hasMore,
  totalRecords,
  onRowClick,
  getRowClassName,
  enableRowSelection = false,
  selectVisibleRowsOnly = true,
  onSelectionChange,
  onDeleteSelected,
  isRowSelectable,
  getRowId,
  error,
  toolbar,
  viewportClassName,
  density = "default",
  showFooter = true,
}: DataTableProps<TData, TValue>) {
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [rowsPerPage, setRowsPerPage] = useState(pagination?.rowsPerPage || 10);
  const isMobile = useIsMobile();

  const isPaginationEnabled = pagination?.enabled ?? false;
  const showLoadingBar = isLoading ?? false;

  // The selection checkbox is injected rather than asked of every caller.
  // `selectVisibleRowsOnly` decides whether the header checkbox acts on the
  // current page or on every loaded row — the distinction matters once the
  // table is paginated, where "select all" is ambiguous.
  const tableColumns = useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableRowSelection) return columns;

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      size: 50,
      minSize: 50,
      maxSize: 50,
      enableSorting: false,
      enableResizing: false,
      meta: { isSticky: false },
      header: ({ table }) => {
        const selectableRows = selectVisibleRowsOnly
          ? table.getRowModel().rows
          : table.getPrePaginationRowModel().rows;
        const selectableRowCount = selectableRows.filter((row) =>
          row.getCanSelect(),
        ).length;
        const selectAllLabel = selectVisibleRowsOnly
          ? `Select all ${selectableRowCount} rows on this page`
          : `Select all ${selectableRowCount} rows`;

        return (
          <Checkbox
            className="mx-auto"
            aria-label={selectAllLabel}
            title={selectAllLabel}
            checked={
              (
                selectVisibleRowsOnly
                  ? table.getIsAllPageRowsSelected()
                  : table.getIsAllRowsSelected()
              )
                ? true
                : (
                      selectVisibleRowsOnly
                        ? table.getIsSomePageRowsSelected()
                        : table.getIsSomeRowsSelected()
                    )
                  ? "indeterminate"
                  : false
            }
            disabled={selectableRowCount === 0}
            onCheckedChange={(checked) =>
              selectVisibleRowsOnly
                ? table.toggleAllPageRowsSelected(checked === true)
                : table.toggleAllRowsSelected(checked === true)
            }
            onClick={(event) => event.stopPropagation()}
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          className="mx-auto"
          aria-label={`Select row ${row.index + 1}`}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          onClick={(event) => event.stopPropagation()}
        />
      ),
    };

    return [selectionColumn, ...columns];
  }, [columns, enableRowSelection, selectVisibleRowsOnly]);

  // `autoResetPageIndex: false` keeps the viewer on their page when the data
  // array is replaced (a refetch, a filter that returns the same page count);
  // the effect below handles the case where the page no longer exists.
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { columnSizing, sorting, rowSelection },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: (row) => isRowSelectable?.(row.original) ?? true,
    getRowId: getRowId ? (row, index) => getRowId(row, index) : undefined,
    columnResizeMode: "onChange",
    defaultColumn: {
      minSize: 80,
      size: 240,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isPaginationEnabled
      ? getPaginationRowModel()
      : getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
    autoResetPageIndex: false,
    initialState: {
      pagination: {
        pageSize: rowsPerPage,
      },
    },
  });

  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(
      table.getSelectedRowModel().rows.map((row) => row.original),
    );
  }, [onSelectionChange, rowSelection, table]);

  const selectedRowCount = table.getSelectedRowModel().rows.length;
  const selectedRows = table
    .getSelectedRowModel()
    .rows.map((row) => row.original);
  const handleRowsPerPageChange = (value: string) => {
    const newSize = Number(value);
    setRowsPerPage(newSize);
    table.setPageSize(newSize);
    table.setPageIndex(0);
  };

  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageCount = table.getPageCount();
  const paginationItems = getPaginationItems(currentPage, pageCount);

  // Rows can disappear beneath the viewer — a delete, a narrower filter — and
  // leave them on a page past the end, which renders as an empty table.
  useEffect(() => {
    const lastPageIndex = Math.max(pageCount - 1, 0);
    if (table.getState().pagination.pageIndex > lastPageIndex) {
      table.setPageIndex(lastPageIndex);
    }
  }, [data.length, pageCount, table]);

  const tableViewportRef = useRef<HTMLDivElement>(null);
  // Each row is its own grid, so a "max-content" action track would resolve
  // per row and the header would drift out of line with the cells. Measure the
  // widest action cell once and pin every row to it.
  const [actionColumnWidth, setActionColumnWidth] = useState<number | null>(
    null,
  );
  const [isScrolledVertically, setIsScrolledVertically] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // The viewport publishes how far it is scrolled as data attributes, which
  // the stylesheet turns into edge shadows: a shadow under a stuck header, and
  // one beside a pinned column while there is more to scroll toward. Tracked
  // in state rather than CSS because scroll position is not expressible there.
  const updateScrollState = useCallback((container: HTMLDivElement) => {
    const maxScrollLeft = Math.max(
      container.scrollWidth - container.clientWidth,
      0,
    );

    setIsScrolledVertically(container.scrollTop > 1);
    setCanScrollLeft(container.scrollLeft > 1);
    setCanScrollRight(container.scrollLeft < maxScrollLeft - 1);
  }, []);

  // Two ways to page: "paginated" hands out a page at a time, "infinite"
  // renders everything loaded so far and asks for more as the last row nears
  // the viewport. Infinite mode works by setting the page size to effectively
  // unbounded, so the row model stops slicing.
  const mode: "paginated" | "infinite" =
    pagination?.mode ?? (isPaginationEnabled ? "paginated" : "infinite");

  useEffect(() => {
    if (mode === "infinite") {
      table.setPageSize(Number.MAX_SAFE_INTEGER);
      table.setPageIndex(0);
    } else {
      table.setPageSize(rowsPerPage);
    }
  }, [mode, rowsPerPage, table]);

  const scrollRef = useInfiniteScroll<HTMLDivElement>({
    onLoadMore: () => {
      if (mode === "infinite" && hasMore) {
        try {
          onLoadMore?.();
        } catch (error) {
          console.error("Error loading more data:", error);
        }
      }
    },

    enabled: mode === "infinite" && hasMore,
    isLoading,
  });

  const scrollToTop = () => {
    tableViewportRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

    tableViewportRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /* ── Column sizing ─────────────────────────────────────────────────────────
   *
   * One `gridTemplateColumns` string is shared by the header row and every
   * body row, so all of them agree on where the column boundaries fall.
   * Tracks are built per role:
   *
   *   data column   minmax(minSize, size fr) — takes a weighted share of the
   *                 leftover width and never drops below its minimum, so the
   *                 table fills the viewport and stays readable when narrow.
   *                 `size` doubles as the resize handle's value.
   *   utility       a fixed pixel width (`mobileSize` when it is set and the
   *                 viewport is small), since a checkbox or a pinned column
   *                 should not stretch.
   *   row actions   the measured width of the widest actions cell.
   * ──────────────────────────────────────────────────────────────────────── */
  const visibleColumns = table.getVisibleLeafColumns();
  const gridTemplateColumns = visibleColumns
    .map((column) => {
      const meta = getColumnMeta(column);
      const isActionColumn = isRowActionsColumn(column);
      const isUtilityColumn =
        column.id === "select" ||
        isActionColumn ||
        isStickyColumn(column, isMobile);

      // Buttons vary in number per table, so the width is discovered rather
      // than hand-tuned. Until the measurement lands, "max-content" is a
      // close first guess.
      if (isActionColumn && !(isMobile && meta.mobileSize)) {
        return actionColumnWidth ? `${actionColumnWidth}px` : "max-content";
      }

      if (isUtilityColumn) {
        const size =
          isMobile && meta.mobileSize ? meta.mobileSize : column.getSize();
        return `${size}px`;
      }

      return `minmax(${column.columnDef.minSize}px, ${column.getSize()}fr)`;
    })
    .join(" ");
  const gridStyle = { gridTemplateColumns };

  const renderedRowCount = table.getRowModel().rows.length;

  // Measure every actions cell and pin the track to the widest. This is the
  // DOM round-trip that stands in for the `max-content` the grid cannot use:
  // rows are separate grids, so each would resolve `max-content` on its own
  // content and the boundaries would not line up. Re-runs when the data or
  // the column set changes; the 1px tolerance stops sub-pixel measurements
  // from ping-ponging between renders.
  useEffect(() => {
    const container = tableViewportRef.current;
    if (!container) return;

    const cells = container.querySelectorAll<HTMLElement>(
      '[data-row-actions="true"]',
    );
    if (cells.length === 0) {
      setActionColumnWidth(null);
      return;
    }

    let widest = 0;
    cells.forEach((cell) => {
      const styles = window.getComputedStyle(cell);
      const padding =
        parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const content = Array.from(cell.children).reduce(
        (total, child) => total + child.getBoundingClientRect().width,
        0,
      );
      widest = Math.max(widest, Math.ceil(content + padding));
    });

    setActionColumnWidth((previous) =>
      previous !== null && Math.abs(previous - widest) <= 1 ? previous : widest,
    );
  }, [data, isMobile, renderedRowCount, visibleColumns.length]);

  // Scrollability changes without a scroll event — the window resizes, a
  // column is dragged wider, rows arrive — so the viewport and the grid are
  // both observed.
  useEffect(() => {
    const container = tableViewportRef.current;
    if (!container) return;

    updateScrollState(container);

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState(container);
    });

    resizeObserver.observe(container);

    const grid = container.querySelector<HTMLElement>(
      '[data-slot="table-grid"]',
    );
    if (grid) resizeObserver.observe(grid);

    return () => resizeObserver.disconnect();
  }, [columnSizing, data.length, updateScrollState, visibleColumns.length]);

  // Double-clicking a resize handle sizes the column to its content. The
  // width is computed by measuring the text on a canvas rather than by
  // laying the cells out, which would mean writing to the DOM and reading it
  // back for every cell. The extra 32px covers the sort button and padding
  // the text measurement does not see; the result is clamped to the column's
  // own min/max.
  const fitColumnToContent = (column: Column<TData, unknown>) => {
    const cells = Array.from(
      tableViewportRef.current?.querySelectorAll<HTMLElement>(
        `[data-column-id="${column.id}"]`,
      ) ?? [],
    );

    if (cells.length === 0) return;

    const context = document.createElement("canvas").getContext("2d");
    if (!context) return;

    const contentWidth = cells.reduce((widest, cell) => {
      const styles = window.getComputedStyle(cell);
      context.font = styles.font;

      const horizontalPadding =
        Number.parseFloat(styles.paddingLeft) +
        Number.parseFloat(styles.paddingRight);
      const textWidth = context.measureText(
        cell.textContent?.trim() ?? "",
      ).width;

      return Math.max(widest, Math.ceil(textWidth + horizontalPadding + 32));
    }, 0);

    const minSize = column.columnDef.minSize ?? 80;
    const maxSize = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER;

    setColumnSizing((previous) => ({
      ...previous,
      [column.id]: Math.min(Math.max(contentWidth, minSize), maxSize),
    }));
  };

  return (
    <div className="">
      {(toolbar || (enableRowSelection && selectedRowCount > 0)) && (
        <div className="border-border flex min-h-12 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <div className="flex items-center gap-2">
            {enableRowSelection && selectedRowCount > 0 && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => table.resetRowSelection()}
                >
                  <X className="size-4" />
                  Clear
                </Button>
                {onDeleteSelected && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeleteSelected(selectedRows)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
          {toolbar && (
            <div className="ml-auto flex w-full min-w-0 items-center gap-2 sm:w-auto">
              {toolbar}
            </div>
          )}
        </div>
      )}
      <div
        data-slot="table-container"
        data-scrolled={isScrolledVertically ? "true" : "false"}
        data-can-scroll-left={canScrollLeft ? "true" : "false"}
        data-can-scroll-right={canScrollRight ? "true" : "false"}
        className={cn(
          "relative max-h-screen w-full overflow-auto border-b",
          viewportClassName,
        )}
        ref={tableViewportRef}
        onScroll={(event) => updateScrollState(event.currentTarget)}
      >
        <TableGrid
          density={density}
          data-can-scroll-left={canScrollLeft ? "true" : "false"}
          data-can-scroll-right={canScrollRight ? "true" : "false"}
          style={{ width: `max(100%, ${table.getTotalSize()}px)` }}
        >
          {/* Header */}
          <TableGridHeader className="select-none">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableGridRow
                key={headerGroup.id}
                style={gridStyle}
                className="h-12 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  const isSticky = isStickyColumn(header.column, isMobile);
                  const isSelectionColumn = header.column.id === "select";

                  return (
                    <TableGridHead
                      key={header.id}
                      data-column-id={header.column.id}
                      data-action={isSticky ? "true" : "false"}
                      data-row-actions={
                        isRowActionsColumn(header.column) ? "true" : "false"
                      }
                      className={cn(
                        isSticky && "bg-card sticky right-0 z-20",
                        isSelectionColumn && "grid place-items-center p-0",
                      )}
                    >
                      <div
                        className={cn(
                          "relative flex h-full w-full min-w-0 items-center gap-x-1",
                          isSelectionColumn
                            ? "justify-center"
                            : "justify-between",
                        )}
                      >
                        <div className="inline-flex min-w-0 flex-1 items-center overflow-hidden">
                          <div
                            className={cn(
                              "flex min-w-0 w-full max-w-full items-center gap-x-2 overflow-hidden",
                              isSelectionColumn && "justify-center",
                            )}
                          >
                            <div className="min-w-0 truncate">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </div>
                            {header.column.getCanSort() ? (
                              <div className="shrink-0">
                                <Sorter column={header.column} />
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {isSelectionColumn ? (
                          <Resizer
                            isResizing={false}
                            isInteractive={false}
                            aria-hidden="true"
                          />
                        ) : (
                          <div className="relative flex h-full shrink-0 items-center justify-end">
                            <div className="pr-2">
                              {getColumnMeta(header.column).renderExtraInfo && (
                                <ExtraInfoHint>
                                  {getColumnMeta(header.column)
                                    .renderExtraInfo!()}
                                </ExtraInfoHint>
                              )}
                            </div>
                            {!isSticky && header.column.getCanResize() && (
                              <Resizer
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                isResizing={header.column.getIsResizing()}
                                title="Double-click to fit content or reset."
                                onDoubleClick={() => {
                                  if (header.column.id in columnSizing) {
                                    setColumnSizing((previous) => {
                                      const next = { ...previous };
                                      delete next[header.column.id];
                                      return next;
                                    });
                                  } else {
                                    fitColumnToContent(header.column);
                                  }
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </TableGridHead>
                  );
                })}
              </TableGridRow>
            ))}
            {showLoadingBar ? (
              <LinearProgress className="h-1 w-full rounded-none" />
            ) : null}
          </TableGridHeader>
          {/* Body */}
          <TableGridBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => {
                return (
                  <TableGridRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    style={gridStyle}
                    className={cn("group", getRowClassName?.(row.original))}
                    onClick={(e) => {
                      // Selecting text inside a row should not also navigate,
                      // so a click that ends a selection within this row is
                      // treated as text selection rather than a row click.
                      const selection = window.getSelection();
                      if (
                        selection?.toString() &&
                        e.currentTarget.contains(selection.anchorNode)
                      ) {
                        return;
                      }
                      onRowClick?.(row.original);
                    }}
                    ref={
                      index === table.getRowModel().rows.length - 1
                        ? scrollRef
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = getColumnMeta(cell.column);
                      const isSticky = isStickyColumn(cell.column, isMobile);
                      const isSelectionColumn = cell.column.id === "select";
                      const isRowActions = isRowActionsColumn(cell.column);

                      return (
                        <TableGridCell
                          key={cell.id}
                          data-column-id={cell.column.id}
                          style={{
                            whiteSpace:
                              whiteSpace === "nowrap" ? "nowrap" : undefined,
                          }}
                          data-action={isSticky ? "true" : "false"}
                          data-row-actions={isRowActions ? "true" : "false"}
                          className={cn(
                            isSelectionColumn
                              ? "grid place-items-center p-0 whitespace-nowrap"
                              : isSticky
                                ? cn(
                                    "bg-card group-hover:bg-muted sticky right-0 flex-wrap transition-colors",
                                    // A row's own background/hover (e.g. a
                                    // flagged/error tint) should win over the
                                    // defaults above — it must use
                                    // group-hover: (not hover:) to affect this
                                    // sticky cell, since only the row itself
                                    // carries the "group" class.
                                    getRowClassName?.(row.original),
                                    "group-data-[state=selected]:bg-muted",
                                  )
                                : cn(
                                    "overflow-hidden pr-5 text-ellipsis whitespace-nowrap [&>*]:max-w-full [&>*]:truncate",
                                  ),
                            // Body cells only: the header keeps the default
                            // padding so its label and resize handle stay put.
                            // The action-width measurement reads computed
                            // padding, so the track follows this value.
                            isRowActions && "px-2",
                          )}
                        >
                          {/* The copy button is revealed on hover of the
                              cell's own group, so several copyable cells in
                              one row do not all light up together. */}
                          {meta.copyable ? (
                            <div className="group/copy inline">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                              <CopyButton
                                value={String(cell.getValue() ?? "")}
                                className="invisible ml-1.5 group-hover/copy:visible"
                              />
                            </div>
                          ) : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )
                          )}
                        </TableGridCell>
                      );
                    })}
                  </TableGridRow>
                );
              })
            ) : error ? (
              <div className="text-destructive flex h-24 items-center justify-center text-center whitespace-pre-line">
                {error}
              </div>
            ) : tableColumns.length === 0 && !isLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Spinner className="size-6" />
              </div>
            ) : (
              <div className="text-muted-foreground flex h-24 items-center justify-center text-center">
                No results.
              </div>
            )}
          </TableGridBody>
        </TableGrid>
      </div>

      {showFooter ? (
        <div className="flex flex-col justify-between items-center gap-4 px-2 py-3 sm:flex-row sm:items-center sm:gap-x-8">
          <div className="flex min-w-0 items-center">
            <span className="text-muted-foreground flex shrink-0 flex-col items-start gap-1 text-sm sm:flex-row sm:items-center sm:gap-2">
              {enableRowSelection && selectedRowCount > 0 && (
                <>
                  <span className="whitespace-nowrap">
                    <span className="text-foreground font-medium tabular-nums">
                      {selectedRowCount}
                    </span>{" "}
                    selected
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline">
                    •
                  </span>
                </>
              )}
              <span className="whitespace-nowrap">
                Showing{" "}
                <span className="text-foreground font-medium tabular-nums">
                  {data.length}
                </span>{" "}
                {typeof totalRecords === "number"
                  ? `of ${totalRecords}`
                  : hasMore
                    ? "of more"
                    : "of all"}{" "}
                records
              </span>
            </span>
          </div>

          {mode === "paginated" && isPaginationEnabled ? (
            pageCount > 1 ? (
              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
                <div className="flex w-full items-center gap-4 sm:w-fit">
                  <span className="text-sm leading-none font-medium select-none">
                    Rows per page
                  </span>
                  <Select
                    value={String(rowsPerPage)}
                    onValueChange={handleRowsPerPageChange}
                  >
                    <SelectTrigger className="w-20" id="select-rows-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3 sm:hidden">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground text-sm">Page</span>
                    <Select
                      value={String(currentPage)}
                      onValueChange={(value) =>
                        table.setPageIndex(Number(value) - 1)
                      }
                    >
                      <SelectTrigger className="w-18" aria-label="Select page">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          {Array.from(
                            { length: pageCount },
                            (_, index) => index + 1,
                          ).map((page) => (
                            <SelectItem key={page} value={String(page)}>
                              {page}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      of {pageCount}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        aria-label="Previous page"
                        disabled={!table.getCanPreviousPage()}
                        onClick={() => table.previousPage()}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        aria-label="Next page"
                        disabled={!table.getCanNextPage()}
                        onClick={() => table.nextPage()}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="hidden items-center gap-3 sm:flex">
                  <span className="text-muted-foreground text-sm whitespace-nowrap">
                    Page {currentPage} of {pageCount}
                  </span>
                  <Pagination className="mx-0 w-auto justify-start">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            table.previousPage();
                          }}
                          aria-disabled={!table.getCanPreviousPage()}
                          className={cn(
                            !table.getCanPreviousPage() &&
                              "pointer-events-none opacity-50",
                          )}
                        />
                      </PaginationItem>
                      {paginationItems.map((item, index) =>
                        item === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={item}>
                            <PaginationLink
                              href="#"
                              isActive={item === currentPage}
                              onClick={(event) => {
                                event.preventDefault();
                                table.setPageIndex(Number(item) - 1);
                              }}
                            >
                              {item}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            table.nextPage();
                          }}
                          aria-disabled={!table.getCanNextPage()}
                          className={cn(
                            !table.getCanNextPage() &&
                              "pointer-events-none opacity-50",
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            ) : null
          ) : (
            isScrollTop && (
              <Button
                variant="secondary"
                color="var(--info)"
                onClick={scrollToTop}
                size="sm"
              >
                <ArrowUp /> Top
              </Button>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}

// The drag handle between two columns. It sets the cursor and suppresses text
// selection on the document while dragging, because the pointer regularly
// leaves the handle mid-drag and styles scoped to the element would flicker.
// Cleanup is bound to window mouseup for the same reason. Rendered
// non-interactive for columns that cannot be resized, where it is a divider.
const Resizer = ({
  isResizing = false,
  isInteractive = true,
  className,
  onMouseDown,
  ...props
}: React.ComponentProps<"div"> & {
  isResizing?: boolean;
  isInteractive?: boolean;
}) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive) return;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    onMouseDown?.(e);

    const cleanup = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mouseup", cleanup);
    };

    window.addEventListener("mouseup", cleanup);
  };

  return (
    <div
      className={cn(
        "absolute top-1/2 right-0 z-10 h-6 w-3 translate-x-1/2 -translate-y-1/2 touch-none",
        "after:bg-border after:absolute after:top-1/2 after:left-1/2 after:h-4 after:w-0.5 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
        isInteractive
          ? "cursor-col-resize hover:after:bg-primary hover:after:h-6 hover:after:w-1"
          : "pointer-events-none",
        isResizing && "after:bg-primary after:h-6 after:w-1",
        className,
      )}
      onMouseDown={handleMouseDown}
      {...props}
    />
  );
};

// Sort toggle with a three-step cycle — ascending, descending, unsorted — so
// a viewer can get back to the data's natural order without reloading. One
// arrow rotates to show the direction rather than swapping icons, which keeps
// the header from shifting as the state changes.
function Sorter<TData>({ column }: SorterProps<TData>) {
  const sorted = column.getIsSorted();

  const handleSort = () => {
    if (sorted === false) {
      // First click: default to asc
      column.toggleSorting(false);
    } else if (sorted === "asc") {
      // Second click: switch to desc
      column.toggleSorting(true);
    } else {
      // Third click: remove sorting
      column.clearSorting();
    }
  };

  return (
    <Button
      variant={"ghost"}
      onClick={handleSort}
      className="flex h-full w-full items-center justify-center rounded-md p-1"
      color="var(--primary)"
    >
      <ArrowDown
        className={cn(
          `size-4 transition-transform duration-150 ease-out`,
          sorted === "desc" ? "rotate-180" : "",
          sorted ? "scale-110" : "scale-100",
        )}
      />
    </Button>
  );
}
