import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors overflow-hidden disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus:outline-none focus:ring-2 focus:ring-[var(--btn-ring,var(--color-ring))] focus:ring-offset-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--btn-bg,var(--color-primary))] text-[var(--btn-fg,var(--color-primary-foreground))] hover:bg-[color-mix(in_srgb,var(--btn-bg,var(--color-primary))_90%,black)] dark:hover:bg-[color-mix(in_srgb,var(--btn-bg,var(--color-primary))_85%,white)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 dark:hover:bg-destructive/80",
        outline:
          "border border-[var(--btn-color,var(--color-primary))] text-[var(--btn-color,var(--color-primary))] bg-transparent hover:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_8%,transparent)] dark:bg-transparent dark:hover:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_12%,transparent)]",
        secondary:
          "bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_10%,transparent)] text-[var(--btn-color,var(--color-primary))] hover:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_18%,transparent)] dark:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_15%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_22%,transparent)]",
        ghost:
          "text-[var(--btn-color,var(--color-primary))] hover:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_10%,transparent)] focus:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_10%,transparent)] active:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_15%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_15%,transparent)] focus:ring-0",
        link: "text-primary underline-offset-4 hover:underline focus:ring-0",
        selector:
          "border border-[var(--btn-color,var(--color-primary))]/30 bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_8%,transparent)] text-[var(--btn-color,var(--color-primary))] hover:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_14%,transparent)] dark:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_12%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--btn-color,var(--color-primary))_18%,transparent)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-6 px-2 text-xs",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function getRippleColor(
  variant: VariantProps<typeof buttonVariants>["variant"],
): string {
  switch (variant) {
    case "default":
      return "bg-white/20";
    case "destructive":
      return "bg-white/20";
    case "outline":
      return "bg-[var(--btn-color,var(--color-primary))]/10";
    // Tint with the button's own colour rather than the foreground, which is
    // near-black and reads as a dark smear on light surfaces.
    case "secondary":
      return "bg-[var(--btn-color,var(--color-primary))]/15";
    case "ghost":
      return "bg-[var(--btn-color,var(--color-primary))]/15";
    case "link":
      return "bg-primary/10";
    default:
      return "bg-[var(--btn-color,var(--color-primary))]/15";
  }
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  color,
  childClassName: _childClassName,
  onClick,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    color?: string;
    childClassName?: string;
  }) {
  const Comp = asChild ? Slot : "button";
  const [ripples, setRipples] = React.useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const rippleIdRef = React.useRef(0);

  const colorStyle = color
    ? variant === "default"
      ? ({
          "--btn-bg": color,
          "--btn-fg": "#fff",
          "--btn-ring": `color-mix(in srgb, ${color} 40%, transparent)`,
        } as React.CSSProperties)
      : ({
          "--btn-color": color,
          "--btn-ring": `color-mix(in srgb, ${color} 40%, transparent)`,
        } as React.CSSProperties)
    : undefined;

  const noRipple = variant === "selector";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!noRipple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;
      setRipples([{ id, x, y }]);
      setTimeout(() => setRipples([]), 1000);
    }
    onClick?.(e);
  };

  return (
    <Comp
      onClick={handleClick}
      style={{ ...colorStyle, ...style }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {!noRipple &&
        ripples.map((ripple) => (
          <span
            key={ripple.id}
            className={cn(
              "animate-ripple pointer-events-none absolute rounded-full",
              getRippleColor(variant),
            )}
            style={{
              left: ripple.x,
              top: ripple.y,
              width: "1px",
              height: "1px",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      {/* With asChild, Slot needs to know which child to render as; the
          ripples are then placed inside that element. */}
      {asChild ? <Slottable>{props.children}</Slottable> : props.children}
    </Comp>
  );
}

export { Button, buttonVariants };
