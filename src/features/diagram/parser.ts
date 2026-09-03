import type { DiagramDocument, DiagramNode, DiagramEdge, ParseError } from "./types";

export interface ParseResult {
  document: DiagramDocument;
  errors: ParseError[];
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 60;
const HORIZONTAL_GAP = 100;
const VERTICAL_GAP = 80;

export function parseDiagram(source: string): ParseResult {
  const nodesMap = new Map<string, DiagramNode>();
  const edges: DiagramEdge[] = [];
  const errors: ParseError[] = [];

  const lines = source.split("\n");

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line || line.startsWith("//")) {
      return;
    }

    const match = line.match(/^(.+?)\s*->\s*(.+?)$/);

    if (!match) {
      errors.push({
        line: index + 1,
        message: "Expected format: A -> B",
      });

      return;
    }

    const [, fromRaw, toRaw] = match;

    const from = fromRaw.trim();
    const to = toRaw.trim();

    if (!from || !to) {
      errors.push({
        line: index + 1,
        message: "Node name cannot be empty",
      });

      return;
    }

    if (!nodesMap.has(from)) {
      nodesMap.set(from, {
        id: createNodeId(from),
        label: from,
        x: 0,
        y: 0,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    }

    if (!nodesMap.has(to)) {
      nodesMap.set(to, {
        id: createNodeId(to),
        label: to,
        x: 0,
        y: 0,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    }

    edges.push({
      id: `${createNodeId(from)}-${createNodeId(to)}`,
      from: createNodeId(from),
      to: createNodeId(to),
    });
  });

  const nodes = layoutNodes([...nodesMap.values()], edges);

  return {
    document: {
      nodes,
      edges,
    },
    errors,
  };
}

function createNodeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-");
}

function layoutNodes(nodes: DiagramNode[], edges: DiagramEdge[]): DiagramNode[] {
  const levels = calculateLevels(nodes, edges);

  const levelGroups = new Map<number, DiagramNode[]>();

  nodes.forEach((node) => {
    const level = levels.get(node.id) ?? 0;

    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }

    levelGroups.get(level)!.push(node);
  });

  const result: DiagramNode[] = [];

  levelGroups.forEach((group, level) => {
    group.forEach((node, index) => {
      result.push({
        ...node,
        x: index * (NODE_WIDTH + HORIZONTAL_GAP) + 100,
        y: level * (NODE_HEIGHT + VERTICAL_GAP) + 100,
      });
    });
  });

  return result;
}

function calculateLevels(nodes: DiagramNode[], edges: DiagramEdge[]): Map<string, number> {
  const levels = new Map<string, number>();

  nodes.forEach((node) => {
    levels.set(node.id, 0);
  });

  let changed = true;
  let iterations = 0;

  while (changed && iterations < nodes.length) {
    changed = false;
    iterations++;

    edges.forEach((edge) => {
      const fromLevel = levels.get(edge.from) ?? 0;
      const toLevel = levels.get(edge.to) ?? 0;

      if (toLevel <= fromLevel) {
        levels.set(edge.to, fromLevel + 1);
        changed = true;
      }
    });
  }

  return levels;
}
