import { cn } from "../lib/utils";

type TableGridDensity = "sm" | "default" | "lg";

/**
 * Row padding is set here rather than on the cell so a single prop on the grid
 * retunes every row. The descendant selector outranks the cell's own padding.
 */
const densityStyles: Record<TableGridDensity, string> = {
  sm: "[&_[data-slot=table-grid-cell]]:py-2",
  default: "[&_[data-slot=table-grid-cell]]:py-3.5",
  lg: "[&_[data-slot=table-grid-cell]]:py-5",
};

function TableGrid({
  className,
  density = "default",
  ...props
}: React.ComponentProps<"div"> & { density?: TableGridDensity }) {
  return (
    <div
      role="table"
      data-slot="table-grid"
      data-density={density}
      className={cn("min-w-full text-sm", densityStyles[density], className)}
      {...props}
    />
  );
}

function TableGridHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="rowgroup"
      data-slot="table-grid-header"
      className={cn(
        // bg-card, not bg-background: the grid is rendered inside a Card, and a
        // sticky header has to be opaque to cover the rows scrolling beneath it,
        // so it has to match the surface it sits on.
        "bg-card sticky top-0 z-10 transition-shadow duration-500 ease-out",
        className,
      )}
      {...props}
    />
  );
}

function TableGridBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="rowgroup"
      data-slot="table-grid-body"
      className={cn("[&>*:last-child]:border-b-0", className)}
      {...props}
    />
  );
}

function TableGridRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="row"
      data-slot="table-grid-row"
      className={cn(
        "border-border hover:bg-muted/50 data-[state=selected]:bg-muted grid border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableGridHead({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="columnheader"
      data-slot="table-grid-head"
      className={cn(
        "text-foreground relative flex min-w-0 items-center px-2 text-left font-medium whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

function TableGridCell({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="cell"
      data-slot="table-grid-cell"
      className={cn(
        "min-w-0 px-2 py-3.5 align-middle flex items-center",
        className,
      )}
      {...props}
    />
  );
}

export type { TableGridDensity };
export {
  TableGrid,
  TableGridHeader,
  TableGridBody,
  TableGridRow,
  TableGridHead,
  TableGridCell,
};
