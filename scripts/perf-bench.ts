import { calculateLevels } from "../src/features/diagram/layout";
import { routeEdge } from "../src/features/diagram/edgeRouter";

import type {
  DiagramDirection,
  DiagramEdge,
  DiagramLayout,
  DiagramNode,
} from "../src/features/diagram/types";

function buildDiagram(nodeCount: number, crossEdgeRatio: number) {
  const columns = Math.ceil(Math.sqrt(nodeCount));

  const nodes: DiagramNode[] = [];
  const layout: DiagramLayout = {};

  for (let i = 0; i < nodeCount; i += 1) {
    const id = `n${i}`;

    nodes.push({ id, label: `Node ${i}`, shape: "rectangle" });

    const col = i % columns;
    const row = Math.floor(i / columns);

    layout[id] = {
      x: col * 220,
      y: row * 140,
      width: 160,
      height: 60,
    };
  }

  const edges: DiagramEdge[] = [];

  // Chain edges: each node to the next (typical flowchart shape).
  for (let i = 0; i < nodeCount - 1; i += 1) {
    edges.push({ id: `e-chain-${i}`, from: `n${i}`, to: `n${i + 1}` });
  }

  // Cross edges: some non-adjacent connections that force obstacle avoidance,
  // matching the kind of diagram a real user would actually draw (branches,
  // merges) rather than a pure straight line.
  const crossEdgeCount = Math.floor(nodeCount * crossEdgeRatio);

  for (let i = 0; i < crossEdgeCount; i += 1) {
    const from = Math.floor(Math.random() * nodeCount);
    const to = Math.floor(Math.random() * nodeCount);

    if (from === to) continue;

    edges.push({ id: `e-cross-${i}`, from: `n${from}`, to: `n${to}` });
  }

  return { nodes, edges, layout };
}

function benchmark(nodeCount: number, direction: DiagramDirection = "LR") {
  const { nodes, edges, layout } = buildDiagram(nodeCount, 0.15);
  const levels = calculateLevels(nodes, edges);

  // Warm up (JIT).
  for (const edge of edges) {
    routeEdge(edge, layout, levels, direction);
  }

  const runs = 5;
  const start = performance.now();

  for (let run = 0; run < runs; run += 1) {
    for (const edge of edges) {
      routeEdge(edge, layout, levels, direction);
    }
  }

  const totalMs = performance.now() - start;
  const perFrameMs = totalMs / runs;

  // eslint-disable-next-line no-console
  console.log(
    `nodes=${nodeCount.toString().padStart(5)}  edges=${edges.length.toString().padStart(5)}  ` +
      `full-reroute=${perFrameMs.toFixed(2).padStart(8)}ms  ${perFrameMs > 16.67 ? "⚠️  below 60fps" : "ok"}`,
  );
}

// eslint-disable-next-line no-console
console.log("Simulating a full edge-reroute pass (what happens on every node drag frame):\n");

for (const nodeCount of [25, 50, 100, 200, 400, 800, 1500]) {
  benchmark(nodeCount);
}
