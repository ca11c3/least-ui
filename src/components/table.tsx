"use client";

import * as React from "react";

import { cn } from "../lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isScrolledVertically, setIsScrolledVertically] = React.useState(false);
  const [isScrolledHorizontally, setIsScrolledHorizontally] =
    React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollState = React.useCallback((element: HTMLDivElement) => {
    const { scrollTop, scrollLeft, clientWidth, scrollWidth } = element;
    const maxScrollLeft = Math.max(scrollWidth - clientWidth, 0);

    setIsScrolledVertically(scrollTop > 0);
    setIsScrolledHorizontally(maxScrollLeft > 0);
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < maxScrollLeft);
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    updateScrollState(container);

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState(container);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    updateScrollState(e.currentTarget);
  };

  return (
    <div
      ref={containerRef}
      data-slot="table-container"
      data-scrolled={isScrolledVertically ? "true" : "false"}
      data-scrolled-x={isScrolledHorizontally ? "true" : "false"}
      data-can-scroll-left={canScrollLeft ? "true" : "false"}
      data-can-scroll-right={canScrollRight ? "true" : "false"}
      onScroll={handleScroll}
      className={cn(
        "relative max-h-full w-full overflow-x-auto overflow-y-auto",
      )}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm ", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "transition-shadow duration-500 ease-out [&_tr]:border-b",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "max-h-192 min-h-192 overflow-y-auto [&_tr:last-child]:border-0",
        className,
      )}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
export * from "./table-grid";
