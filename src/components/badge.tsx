import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-4 py-1 text-xs font-medium w-fit max-w-full whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--badge-bg,var(--color-primary))] text-[var(--badge-fg,var(--color-primary-foreground))] [a&]:hover:bg-[color-mix(in_srgb,var(--badge-bg,var(--color-primary))_90%,black)]",
        secondary:
          "bg-[color-mix(in_srgb,var(--badge-color,var(--color-primary))_10%,transparent)] text-[var(--badge-color,var(--color-primary))] [a&]:hover:bg-[color-mix(in_srgb,var(--badge-color,var(--color-primary))_20%,transparent)]",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-[var(--badge-color,var(--color-border))] text-[var(--badge-color,var(--color-foreground))] [a&]:hover:bg-[color-mix(in_srgb,var(--badge-color,var(--color-primary))_8%,transparent)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  color,
  style,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean; color?: string }) {
  const Comp = asChild ? Slot : "span";

  const colorStyle = color
    ? variant === "default"
      ? ({ "--badge-bg": color, "--badge-fg": "#fff" } as React.CSSProperties)
      : ({ "--badge-color": color } as React.CSSProperties)
    : undefined;

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      style={{ ...colorStyle, ...style }}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {/* Slot needs its single child untouched, so only plain badges wrap
          their text to truncate it when the badge is capped at max-w-full. */}
      {asChild
        ? children
        : React.Children.map(children, (child) =>
            typeof child === "string" || typeof child === "number" ? (
              <span className="min-w-0 max-w-full shrink truncate">
                {child}
              </span>
            ) : (
              child
            ),
          )}
    </Comp>
  );
}

export { Badge, badgeVariants };
