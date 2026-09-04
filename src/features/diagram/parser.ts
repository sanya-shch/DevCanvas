import type {
  DiagramDocument,
  DiagramDirection,
  DiagramEdge,
  DiagramLayout,
  DiagramNode,
  DiagramSourceMap,
  ParseError,
  ParseResult,
} from "./types";

import { calculateNodeSize } from "./nodeSizing";

const HORIZONTAL_GAP = 100;
const VERTICAL_GAP = 100;

const START_X = 100;
const START_Y = 100;

const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]+/;

type NodeReference = {
  sourceId: string;
  label?: string;
  nextIndex: number;
};

type ParsedString = {
  value: string;
  nextIndex: number;
};

function generateNodeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `node_${crypto.randomUUID().slice(0, 8)}`;
  }

  return `node_${Math.random().toString(36).slice(2, 10)}`;
}

function generateEdgeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `edge_${crypto.randomUUID().slice(0, 8)}`;
  }

  return `edge_${Math.random().toString(36).slice(2, 10)}`;
}

function isWhitespace(value: string): boolean {
  return /\s/.test(value);
}

function skipWhitespace(input: string, index: number): number {
  let current = index;

  while (current < input.length && isWhitespace(input[current])) {
    current += 1;
  }

  return current;
}

function parseQuotedString(input: string, startIndex: number): ParsedString | null {
  const quote = input[startIndex];

  if (quote !== '"' && quote !== "'") {
    return null;
  }

  let value = "";
  let index = startIndex + 1;

  while (index < input.length) {
    const char = input[index];

    if (char === "\\") {
      const next = input[index + 1];

      if (next === undefined) {
        return null;
      }

      switch (next) {
        case "n":
          value += "\n";
          break;

        case "r":
          value += "\r";
          break;

        case "t":
          value += "\t";
          break;

        case "\\":
          value += "\\";
          break;

        case '"':
          value += '"';
          break;

        case "'":
          value += "'";
          break;

        default:
          value += next;
          break;
      }

      index += 2;
      continue;
    }

    if (char === quote) {
      return {
        value,
        nextIndex: index + 1,
      };
    }

    value += char;
    index += 1;
  }

  return null;
}

function readBracketContent(
  input: string,
  startIndex: number,
): {
  content: string;
  nextIndex: number;
} | null {
  const open = input[startIndex];

  const close = open === "[" ? "]" : open === "{" ? "}" : open === "(" ? ")" : null;

  if (!close) {
    return null;
  }

  let index = startIndex + 1;
  let content = "";

  let quote: '"' | "'" | null = null;

  while (index < input.length) {
    const char = input[index];

    if (quote) {
      content += char;

      if (char === "\\") {
        const next = input[index + 1];

        if (next !== undefined) {
          content += next;
          index += 2;
          continue;
        }
      }

      if (char === quote) {
        quote = null;
      }

      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      content += char;
      index += 1;
      continue;
    }

    if (char === close) {
      return {
        content,
        nextIndex: index + 1,
      };
    }

    content += char;
    index += 1;
  }

  return null;
}

function decodeLabel(content: string): string | null {
  const value = content.trim();

  if (!value) {
    return "";
  }

  const first = value[0];

  if (first !== '"' && first !== "'") {
    return value;
  }

  const parsed = parseQuotedString(value, 0);

  if (!parsed) {
    return null;
  }

  if (value.slice(parsed.nextIndex).trim()) {
    return null;
  }

  return parsed.value;
}

function parseNodeReference(
  input: string,
  startIndex: number,
):
  | NodeReference
  | {
      error: string;
    } {
  let index = skipWhitespace(input, startIndex);

  const identifierMatch = input.slice(index).match(IDENTIFIER_PATTERN);

  if (!identifierMatch) {
    return {
      error: "Expected a node identifier.",
    };
  }

  const sourceId = identifierMatch[0];

  index += sourceId.length;

  index = skipWhitespace(input, index);

  let label: string | undefined;

  const bracket = input[index];

  if (bracket === "[" || bracket === "{" || bracket === "(") {
    const result = readBracketContent(input, index);

    if (!result) {
      return {
        error: "Unclosed node label.",
      };
    }

    const decoded = decodeLabel(result.content);

    if (decoded === null) {
      return {
        error: "Invalid node label.",
      };
    }

    label = decoded;

    index = result.nextIndex;
  }

  return {
    sourceId,
    label,
    nextIndex: index,
  };
}

function findArrow(input: string, startIndex: number): number {
  let index = startIndex;

  let quote: '"' | "'" | null = null;

  while (index < input.length - 1) {
    const char = input[index];

    if (quote) {
      if (char === "\\") {
        index += 2;
        continue;
      }

      if (char === quote) {
        quote = null;
      }

      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      index += 1;
      continue;
    }

    if (input[index] === "-" && input[index + 1] === ">") {
      return index;
    }

    index += 1;
  }

  return -1;
}

function parseEdgeLabel(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const decoded = decodeLabel(trimmed);

  return decoded;
}

function getOrCreateNode(
  sourceId: string,
  label: string | undefined,
  nodes: Map<string, DiagramNode>,
  sourceMap: DiagramSourceMap,
  previousSourceMap?: DiagramSourceMap,
  explicitLabels?: Map<string, string>,
  line?: number,
  errors?: ParseError[],
): DiagramNode {
  let node = nodes.get(sourceId);

  if (!node) {
    const existingId = previousSourceMap?.[sourceId];

    const id = existingId ?? generateNodeId();

    node = {
      id,
      label: label ?? sourceId,
    };

    nodes.set(sourceId, node);
    sourceMap[sourceId] = id;

    if (label !== undefined) {
      explicitLabels?.set(sourceId, label);
    }

    return node;
  }

  sourceMap[sourceId] = node.id;

  if (label !== undefined) {
    const previousExplicit = explicitLabels?.get(sourceId);

    if (previousExplicit !== undefined && previousExplicit !== label) {
      errors?.push({
        line: line ?? 0,
        message: `Conflicting labels for node "${sourceId}".`,
      });

      return node;
    }

    if (previousExplicit === undefined) {
      explicitLabels?.set(sourceId, label);

      node.label = label;
    }
  }

  return node;
}

function parseEdgeStatement(
  line: string,
  lineNumber: number,
  nodes: Map<string, DiagramNode>,
  edges: DiagramEdge[],
  sourceMap: DiagramSourceMap,
  previousSourceMap?: DiagramSourceMap,
  explicitLabels?: Map<string, string>,
  errors?: ParseError[],
): void {
  const fromResult = parseNodeReference(line, 0);

  if ("error" in fromResult) {
    errors?.push({
      line: lineNumber,
      message: fromResult.error,
    });

    return;
  }

  let index = skipWhitespace(line, fromResult.nextIndex);

  if (line.startsWith("->", index)) {
    index += 2;
  } else if (line.startsWith("--", index)) {
    index += 2;

    const arrowIndex = findArrow(line, index);

    if (arrowIndex === -1) {
      errors?.push({
        line: lineNumber,
        message: "Expected '->' after edge label.",
      });

      return;
    }

    const rawLabel = line.slice(index, arrowIndex);

    const edgeLabel = parseEdgeLabel(rawLabel);

    if (edgeLabel === null) {
      errors?.push({
        line: lineNumber,
        message: "Invalid edge label.",
      });

      return;
    }

    index = arrowIndex + 2;

    const toResult = parseNodeReference(line, index);

    if ("error" in toResult) {
      errors?.push({
        line: lineNumber,
        message: toResult.error,
      });

      return;
    }

    const afterTarget = skipWhitespace(line, toResult.nextIndex);

    if (afterTarget !== line.length) {
      errors?.push({
        line: lineNumber,
        message: "Unexpected content after target node.",
      });

      return;
    }

    const fromNode = getOrCreateNode(
      fromResult.sourceId,
      fromResult.label,
      nodes,
      sourceMap,
      previousSourceMap,
      explicitLabels,
      lineNumber,
      errors,
    );

    const toNode = getOrCreateNode(
      toResult.sourceId,
      toResult.label,
      nodes,
      sourceMap,
      previousSourceMap,
      explicitLabels,
      lineNumber,
      errors,
    );

    const duplicate = edges.some(
      (edge) => edge.from === fromNode.id && edge.to === toNode.id && edge.label === edgeLabel,
    );

    if (!duplicate) {
      edges.push({
        id: generateEdgeId(),
        from: fromNode.id,
        to: toNode.id,
        label: edgeLabel,
      });
    }

    return;
  } else {
    errors?.push({
      line: lineNumber,
      message: "Expected '->' or '-- label ->'.",
    });

    return;
  }

  const toResult = parseNodeReference(line, index);

  if ("error" in toResult) {
    errors?.push({
      line: lineNumber,
      message: toResult.error,
    });

    return;
  }

  const afterTarget = skipWhitespace(line, toResult.nextIndex);

  if (afterTarget !== line.length) {
    errors?.push({
      line: lineNumber,
      message: "Unexpected content after target node.",
    });

    return;
  }

  const fromNode = getOrCreateNode(
    fromResult.sourceId,
    fromResult.label,
    nodes,
    sourceMap,
    previousSourceMap,
    explicitLabels,
    lineNumber,
    errors,
  );

  const toNode = getOrCreateNode(
    toResult.sourceId,
    toResult.label,
    nodes,
    sourceMap,
    previousSourceMap,
    explicitLabels,
    lineNumber,
    errors,
  );

  const duplicate = edges.some(
    (edge) => edge.from === fromNode.id && edge.to === toNode.id && edge.label === undefined,
  );

  if (!duplicate) {
    edges.push({
      id: generateEdgeId(),
      from: fromNode.id,
      to: toNode.id,
    });
  }
}

function calculateLevels(nodes: DiagramNode[], edges: DiagramEdge[]): Map<string, number> {
  const levels = new Map<string, number>();

  const indegree = new Map<string, number>();

  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    levels.set(node.id, 0);
    indegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    const children = adjacency.get(edge.from);

    if (!children) {
      continue;
    }

    children.push(edge.to);

    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }

  const queue: string[] = [];

  for (const node of nodes) {
    if ((indegree.get(node.id) ?? 0) === 0) {
      queue.push(node.id);
    }
  }

  let index = 0;

  while (index < queue.length) {
    const nodeId = queue[index];
    index += 1;

    const currentLevel = levels.get(nodeId) ?? 0;

    const children = adjacency.get(nodeId) ?? [];

    for (const childId of children) {
      const nextLevel = Math.max(levels.get(childId) ?? 0, currentLevel + 1);

      levels.set(childId, nextLevel);

      const nextIndegree = (indegree.get(childId) ?? 0) - 1;

      indegree.set(childId, nextIndegree);

      if (nextIndegree === 0) {
        queue.push(childId);
      }
    }
  }

  return levels;
}

function createNodeLayout(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  direction: DiagramDirection,
  previousLayout?: DiagramLayout,
  preservePositions = false,
): DiagramLayout {
  const layout: DiagramLayout = {};

  const levels = calculateLevels(nodes, edges);

  const groups = new Map<number, DiagramNode[]>();

  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;

    const group = groups.get(level);

    if (group) {
      group.push(node);
    } else {
      groups.set(level, [node]);
    }
  }

  const sortedLevels = [...groups.keys()].sort((a, b) => a - b);

  const levelSizes = new Map<
    number,
    {
      width: number;
      height: number;
    }
  >();

  for (const level of sortedLevels) {
    const group = groups.get(level) ?? [];

    let width = 0;
    let height = 0;

    for (const node of group) {
      const size = calculateNodeSize(node.label);

      width = Math.max(width, size.width);

      height = Math.max(height, size.height);
    }

    levelSizes.set(level, {
      width,
      height,
    });
  }

  const levelOffsets = new Map<number, number>();

  let accumulated = 0;

  for (const level of sortedLevels) {
    levelOffsets.set(level, accumulated);

    const size = levelSizes.get(level);

    if (!size) {
      continue;
    }

    accumulated += direction === "LR" ? size.width + HORIZONTAL_GAP : size.height + VERTICAL_GAP;
  }

  for (const level of sortedLevels) {
    const group = groups.get(level) ?? [];

    const levelOffset = levelOffsets.get(level) ?? 0;

    let groupOffset = 0;

    for (const node of group) {
      const size = calculateNodeSize(node.label);

      const previous = previousLayout?.[node.id];

      if (preservePositions && previous) {
        layout[node.id] = {
          ...previous,
          width: size.width,
          height: size.height,
        };

        continue;
      }

      if (direction === "LR") {
        layout[node.id] = {
          x: START_X + levelOffset,
          y: START_Y + groupOffset,
          width: size.width,
          height: size.height,
        };

        groupOffset += size.height + VERTICAL_GAP;
      } else {
        layout[node.id] = {
          x: START_X + groupOffset,
          y: START_Y + levelOffset,
          width: size.width,
          height: size.height,
        };

        groupOffset += size.width + HORIZONTAL_GAP;
      }
    }
  }

  return layout;
}

export function parseDiagram(source: string, previousDocument?: DiagramDocument): ParseResult {
  const lines = source.split(/\r?\n/);

  const errors: ParseError[] = [];

  let direction: DiagramDirection = "TD";

  const nodes = new Map<string, DiagramNode>();

  const edges: DiagramEdge[] = [];

  const sourceMap: DiagramSourceMap = {};

  const explicitLabels = new Map<string, string>();

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;

    const line = lines[index].trim();

    if (!line || line.startsWith("//")) {
      continue;
    }

    const directionMatch = line.match(/^flowchart\s+(TD|LR)$/);

    if (directionMatch) {
      direction = directionMatch[1] as DiagramDirection;

      continue;
    }

    parseEdgeStatement(
      line,
      lineNumber,
      nodes,
      edges,
      sourceMap,
      previousDocument?.sourceMap,
      explicitLabels,
      errors,
    );
  }

  const nodeList = [...nodes.values()];

  const preservePositions = previousDocument?.direction === direction;

  const layout = createNodeLayout(
    nodeList,
    edges,
    direction,
    previousDocument?.layout,
    preservePositions,
  );

  const document: DiagramDocument = {
    direction,
    nodes: nodeList,
    edges,
    layout,
    sourceMap,
  };

  return {
    document,
    errors,
  };
}
