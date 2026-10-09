// Deterministic sample data, so screenshots and docs stay stable.
const days = 30;
const start = new Date(2026, 8, 9);

function wave(i: number, base: number, amp: number, phase: number) {
  return Math.round(base + amp * Math.sin(i / 3 + phase) + i * base * 0.012 + ((i * 7919) % 13) * amp * 0.04);
}

export const traffic = Array.from({ length: days }, (_, i) => ({
  date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  organic: wave(i, 4200, 600, 0),
  paid: wave(i, 2600, 500, 1.4),
  referral: wave(i, 1200, 260, 2.6),
}));

export const revenueByMonth = [
  { month: "Jan", online: 42000, retail: 31000 },
  { month: "Feb", online: 45500, retail: 29800 },
  { month: "Mar", online: 51200, retail: 33400 },
  { month: "Apr", online: 49800, retail: 35100 },
  { month: "May", online: 56400, retail: 34200 },
  { month: "Jun", online: 61900, retail: 36800 },
];

export const latency = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  p50: 120 + Math.round(30 * Math.sin(i / 4)) + (i % 5) * 3,
  p95: 310 + Math.round(90 * Math.sin(i / 4 + 0.6)) + (i % 7) * 9,
  p99: i === 14 ? null : 640 + Math.round(160 * Math.sin(i / 4 + 1.1)) + (i % 3) * 25,
}));
