"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "../lib/utils";

function Switch({
  className,
  size = "default",
  color,
  style,
  thumbContent,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default" | "lg";
  color?: string;
  thumbContent?: React.ReactNode;
}) {
  const colorStyle = color
    ? ({
        "--switch-color": color,
      } as React.CSSProperties)
    : undefined;

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      style={{ ...colorStyle, ...style }}
      className={cn(
        "peer group/switch inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-all outline-none hover:shadow-md focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=lg]:h-6 data-[size=lg]:w-11 data-[size=sm]:h-4 data-[size=sm]:w-7 data-[state=checked]:bg-[var(--switch-color,var(--color-primary))] data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none flex items-center justify-center rounded-full bg-accent-foreground ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=default]/switch:data-[state=checked]:translate-x-4 group-data-[size=lg]/switch:size-5 group-data-[size=lg]/switch:data-[state=checked]:translate-x-5 group-data-[size=sm]/switch:size-3 group-data-[size=sm]/switch:data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground",
        )}
      >
        {thumbContent}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
