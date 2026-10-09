"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "../lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted border text-muted-foreground",
        line: "gap-1 bg-transparent",
      },
      size: {
        default: "group-data-[orientation=horizontal]/tabs:h-9",
        lg: "group-data-[orientation=horizontal]/tabs:h-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function TabsList({
  children,
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] =
    React.useState<React.CSSProperties>();

  React.useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    const updateIndicator = () => {
      const activeTrigger = listEl.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-state="active"]',
      );

      if (!activeTrigger) {
        setIndicatorStyle(undefined);
        return;
      }

      const color = activeTrigger.dataset.color;

      if (variant === "line") {
        setIndicatorStyle({
          width: `${activeTrigger.offsetWidth}px`,
          height: "2px",
          transform: `translateX(${activeTrigger.offsetLeft}px)`,
          ...(color ? { backgroundColor: color } : null),
        });
        return;
      }

      setIndicatorStyle({
        width: `${activeTrigger.offsetWidth}px`,
        height: `${activeTrigger.offsetHeight}px`,
        transform: `translate(${activeTrigger.offsetLeft}px, ${activeTrigger.offsetTop}px)`,
        ...(color ? { backgroundColor: color } : null),
      });
    };

    updateIndicator();

    const observer = new MutationObserver(updateIndicator);
    observer.observe(listEl, {
      attributes: true,
      attributeFilter: ["data-state"],
      subtree: true,
    });

    return () => observer.disconnect();
  }, [variant]);

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      data-variant={variant}
      data-size={size ?? "default"}
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    >
      {indicatorStyle ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 transition-[transform,width,height,background-color] duration-300 ease-in-out",
            variant === "line"
              ? "bottom-0 bg-primary rounded-full"
              : "top-0 rounded-md bg-primary shadow-sm",
          )}
          style={indicatorStyle}
        />
      ) : null}

      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({
  className,
  color,
  style,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { color?: string }) {
  const colorStyle = color
    ? ({ "--tab-color": color } as React.CSSProperties)
    : undefined;

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-color={color}
      style={{ ...colorStyle, ...style }}
      className={cn(
        // Shared trigger layout and interaction.
        "relative z-10 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
        "group-data-[size=lg]/tabs-list:px-4 group-data-[size=lg]/tabs-list:text-sm",
        "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        // Default variant: filled active pill.
        "group-data-[variant=default]/tabs-list:data-[state=active]:text-background group-data-[variant=default]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none",
        "dark:group-data-[variant=default]/tabs-list:data-[state=active]:text-foreground",

        // Line variant: transparent active state with underline indicator.
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:text-(--tab-color,var(--color-primary)) group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none",
        "dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:text-(--tab-color,var(--color-primary))",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
