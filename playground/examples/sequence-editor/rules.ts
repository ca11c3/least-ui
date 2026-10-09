export type Rule = { key: string; name: string; category: string; action: "BLOCK" | "REVIEW" | "WARN" | "ALLOW" };

export const rules: Rule[] = [
  { key: "velocity-1h", name: "More than 10 payments in an hour", category: "Velocity", action: "BLOCK" },
  { key: "amount-high", name: "Single payment over ₹2,00,000", category: "Amount", action: "REVIEW" },
  { key: "new-device", name: "First payment from a new device", category: "Device", action: "WARN" },
  { key: "geo-mismatch", name: "Location differs from home state", category: "Geolocation", action: "REVIEW" },
  { key: "blocklist-vpa", name: "Payee VPA on the block list", category: "Filter list", action: "BLOCK" },
  { key: "trusted-merchant", name: "Verified merchant", category: "Filter list", action: "ALLOW" },
  { key: "night-time", name: "Payment between 1am and 5am", category: "Time", action: "WARN" },
];

export const actionColor: Record<Rule["action"], string> = {
  BLOCK: "var(--destructive)",
  REVIEW: "var(--warning)",
  WARN: "var(--info)",
  ALLOW: "var(--success)",
};
