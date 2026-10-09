import { cn } from "../lib/utils";

type LinearProgressRootProps = React.ComponentProps<"div">;

type LinearProgressIndicatorProps = React.ComponentProps<"div"> & {
  determinate?: boolean;
  width?: string;
};

type LinearProgressProps = LinearProgressRootProps & {
  indicatorClassName?: string;
  secondaryIndicatorClassName?: string;
  value?: number;
  max?: number;
};

function LinearProgressRoot({ className, ...props }: LinearProgressRootProps) {
  return (
    <div
      data-slot="linear-progress"
      className={cn(
        "bg-primary/15 relative h-1 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

function LinearProgressIndicator({
  className,
  determinate = false,
  width,
  style,
  ...props
}: LinearProgressIndicatorProps) {
  return (
    <div
      data-slot="linear-progress-indicator"
      className={cn(
        determinate
          ? "bg-primary absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ease-linear"
          : "bg-primary animate-loading-primary absolute top-0 bottom-0 left-0 rounded-full",
        className,
      )}
      style={determinate ? { ...style, width } : style}
      {...props}
    />
  );
}

function LinearProgress({
  className,
  indicatorClassName,
  secondaryIndicatorClassName,
  value,
  max = 100,
  "aria-label": ariaLabel = "Loading",
  ...props
}: LinearProgressProps) {
  const isDeterminate = typeof value === "number";
  const normalizedMax = max > 0 ? max : 100;
  const clampedValue = isDeterminate
    ? Math.min(Math.max(value, 0), normalizedMax)
    : undefined;
  const progressWidth =
    clampedValue == null
      ? undefined
      : `${(clampedValue / normalizedMax) * 100}%`;

  return (
    <LinearProgressRoot
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={isDeterminate ? 0 : undefined}
      aria-valuemax={isDeterminate ? normalizedMax : undefined}
      aria-valuenow={clampedValue}
      aria-valuetext={isDeterminate ? `${clampedValue}` : ariaLabel}
      className={className}
      {...props}
    >
      <LinearProgressIndicator
        determinate={isDeterminate}
        width={progressWidth}
        className={indicatorClassName}
      />

      {isDeterminate ? null : (
        <LinearProgressIndicator
          aria-hidden="true"
          className={cn(
            "bg-primary/70 animate-loading-secondary",
            secondaryIndicatorClassName ?? indicatorClassName,
          )}
        />
      )}
    </LinearProgressRoot>
  );
}

export { LinearProgress, LinearProgressIndicator, LinearProgressRoot };
