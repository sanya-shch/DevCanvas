import type {
  DiagramDirection,
  DiagramDocument,
  DiagramEdge,
  DiagramNode,
  ParseResult,
} from "./types";

const NODE_WIDTH = 140;
const NODE_HEIGHT = 60;

const HORIZONTAL_GAP = 100;
const VERTICAL_GAP = 80;

export function parseDiagram(source: string): ParseResult {
  const nodesMap = new Map<string, DiagramNode>();
  const edges: DiagramEdge[] = [];

  const errors: ParseResult["errors"] = [];

  const lines = source.split("\n");

  let direction: DiagramDirection = "TD";
  let hasHeader = false;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line || line.startsWith("//")) {
      return;
    }

    if (line.startsWith("flowchart")) {
      const headerMatch = line.match(/^flowchart\s+(TD|LR)$/);

      if (!headerMatch) {
        errors.push({
          line: lineNumber,
          message: "Expected: flowchart TD or flowchart LR",
        });

        return;
      }

      direction = headerMatch[1] as DiagramDirection;
      hasHeader = true;

      return;
    }

    if (!hasHeader) {
      errors.push({
        line: lineNumber,
        message: "Diagram must start with flowchart TD or flowchart LR",
      });

      return;
    }

    const edgeMatch = line.match(/^(.+?)\s*->\s*(.+?)$/);

    if (!edgeMatch) {
      errors.push({
        line: lineNumber,
        message: "Expected format: A -> B",
      });

      return;
    }

    const [, fromRaw, toRaw] = edgeMatch;

    const from = fromRaw.trim();
    const to = toRaw.trim();

    if (!from || !to) {
      errors.push({
        line: lineNumber,
        message: "Node name cannot be empty",
      });

      return;
    }

    const fromNode = createNode(from);
    const toNode = createNode(to);

    if (!nodesMap.has(from)) {
      nodesMap.set(from, fromNode);
    }

    if (!nodesMap.has(to)) {
      nodesMap.set(to, toNode);
    }

    const edgeId = `${fromNode.id}-${toNode.id}`;

    if (!edges.some((edge) => edge.id === edgeId)) {
      edges.push({
        id: edgeId,
        from: fromNode.id,
        to: toNode.id,
      });
    }
  });

  const nodes = layoutNodes([...nodesMap.values()], edges, direction);

  const document: DiagramDocument = {
    direction,
    nodes,
    edges,
  };

  return {
    document,
    errors,
  };
}

function createNode(label: string): DiagramNode {
  return {
    id: createNodeId(label),
    label,

    x: 0,
    y: 0,

    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  };
}

function createNodeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-");
}

function layoutNodes(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  direction: DiagramDirection,
): DiagramNode[] {
  const levels = calculateLevels(nodes, edges);

  const groups = new Map<number, DiagramNode[]>();

  nodes.forEach((node) => {
    const level = levels.get(node.id) ?? 0;

    if (!groups.has(level)) {
      groups.set(level, []);
    }

    groups.get(level)!.push(node);
  });

  const result: DiagramNode[] = [];

  groups.forEach((group, level) => {
    group.forEach((node, index) => {
      if (direction === "TD") {
        result.push({
          ...node,

          x: index * (NODE_WIDTH + HORIZONTAL_GAP) + 100,

          y: level * (NODE_HEIGHT + VERTICAL_GAP) + 100,
        });
      } else {
        result.push({
          ...node,

          x: level * (NODE_WIDTH + HORIZONTAL_GAP) + 100,

          y: index * (NODE_HEIGHT + VERTICAL_GAP) + 100,
        });
      }
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
