import { SparklesIcon } from "lucide-react";
import { cn } from "leastui";
import type { Tier } from "../registry";

/** Marks Pro components; Basic needs no badge, like MUI X's plan icons. */
export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  if (tier !== "pro") return null;
  return (
    <span
      title="Pro component"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_12%,transparent)] px-1.5 py-px text-[10px] font-semibold tracking-wide text-(--color-secondary) uppercase",
        className,
      )}
    >
      <SparklesIcon className="size-2.5" aria-hidden />
      Pro
    </span>
  );
}
