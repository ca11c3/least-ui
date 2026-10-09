export type GraphNode = { id: string; position: { x: number; y: number } };
export type GraphEdge = { source: string; target: string };

/** Whether `to` can be reached from `from` by following edges. */
export function reaches(edges: readonly GraphEdge[], from: string, to: string) {
  const out = new Map<string, string[]>();
  for (const e of edges) out.set(e.source, [...(out.get(e.source) ?? []), e.target]);
  const seen = new Set<string>();
  const stack = [from];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === to) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...(out.get(id) ?? []));
  }
  return false;
}

/**
 * A layered layout: each node sits one rank below its deepest parent, and
 * nodes in a rank keep their current left-to-right order. Good enough for
 * flows and pipelines without pulling in dagre or elk.
 */
export function layeredLayout<N extends GraphNode>(
  nodes: readonly N[],
  edges: readonly GraphEdge[],
  {
    direction = "vertical",
    nodeWidth = 208,
    nodeHeight = 64,
    rankGap = 72,
    nodeGap = 40,
  }: { direction?: "vertical" | "horizontal"; nodeWidth?: number; nodeHeight?: number; rankGap?: number; nodeGap?: number } = {},
): N[] {
  const ids = new Set(nodes.map((n) => n.id));
  const valid = edges.filter((e) => ids.has(e.source) && ids.has(e.target) && e.source !== e.target);
  const incoming = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const out = new Map<string, string[]>();
  for (const e of valid) {
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
    out.set(e.source, [...(out.get(e.source) ?? []), e.target]);
  }

  // Longest-path ranks via Kahn's algorithm; nodes left over sit on a cycle and keep rank 0.
  const rank = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const queue = nodes.filter((n) => incoming.get(n.id) === 0).map((n) => n.id);
  const remaining = new Map(incoming);
  while (queue.length) {
    const id = queue.shift()!;
    for (const next of out.get(id) ?? []) {
      rank.set(next, Math.max(rank.get(next)!, rank.get(id)! + 1));
      remaining.set(next, remaining.get(next)! - 1);
      if (remaining.get(next) === 0) queue.push(next);
    }
  }

  const vertical = direction === "vertical";
  const across = (n: N) => (vertical ? n.position.x : n.position.y);
  const byRank = new Map<number, N[]>();
  for (const n of nodes) byRank.set(rank.get(n.id)!, [...(byRank.get(rank.get(n.id)!) ?? []), n]);

  const placed = new Map<string, { x: number; y: number }>();
  for (const [r, members] of byRank) {
    members.sort((a, b) => across(a) - across(b));
    const step = (vertical ? nodeWidth : nodeHeight) + nodeGap;
    const offset = -((members.length - 1) * step) / 2;
    members.forEach((n, i) => {
      const along = r * ((vertical ? nodeHeight : nodeWidth) + rankGap);
      const cross = offset + i * step;
      placed.set(n.id, vertical ? { x: cross, y: along } : { x: along, y: cross });
    });
  }
  return nodes.map((n) => ({ ...n, position: placed.get(n.id)! }));
}
