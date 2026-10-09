import { BanIcon, CheckIcon, CircleIcon, TriangleAlertIcon } from "lucide-react";

import { cn } from "../lib/utils";
import type { TraceTone } from "./simulation";

// Kept apart from the canvas so list views can use it without loading xyflow.

export const toneColor: Record<TraceTone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
  neutral: "var(--muted-foreground)",
};

/** A tone is never colour alone: each has its own icon. */
export function ToneIcon({ tone = "neutral", className }: { tone?: TraceTone; className?: string }) {
  const Icon = { success: CheckIcon, warning: TriangleAlertIcon, danger: BanIcon, neutral: CircleIcon }[tone];
  return (
    <Icon
      aria-hidden
      className={cn("shrink-0", tone === "neutral" && "fill-current", className)}
      style={{ color: toneColor[tone] }}
    />
  );
}
