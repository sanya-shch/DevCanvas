import type { DiagramDocument, DiagramNode } from "./types";

function escapeLabel(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function createReverseSourceMap(sourceMap: DiagramDocument["sourceMap"]): Map<string, string> {
  const result = new Map<string, string>();

  for (const [sourceId, internalId] of Object.entries(sourceMap)) {
    result.set(internalId, sourceId);
  }

  return result;
}

function serializeNodeReference(
  node: DiagramNode,
  reverseSourceMap: Map<string, string>,
  definedNodes: Set<string>,
): string {
  const sourceId = reverseSourceMap.get(node.id) ?? node.id;

  /*
   * Define every node only once.
   *
   * Example:
   *
   * Browser["Web Browser"] -> API["REST API"]
   * API -> Database["PostgreSQL"]
   */
  if (definedNodes.has(node.id)) {
    return sourceId;
  }

  definedNodes.add(node.id);

  if (node.label === sourceId) {
    return sourceId;
  }

  return `${sourceId}["${escapeLabel(node.label)}"]`;
}

export function serializeDiagram(document: DiagramDocument): string {
  const lines: string[] = [];

  lines.push(`flowchart ${document.direction}`);

  lines.push("");

  const reverseSourceMap = createReverseSourceMap(document.sourceMap);

  const nodesById = new Map(document.nodes.map((node) => [node.id, node]));

  const definedNodes = new Set<string>();

  for (const edge of document.edges) {
    const fromNode = nodesById.get(edge.from);

    const toNode = nodesById.get(edge.to);

    if (!fromNode || !toNode) {
      continue;
    }

    const from = serializeNodeReference(fromNode, reverseSourceMap, definedNodes);

    const to = serializeNodeReference(toNode, reverseSourceMap, definedNodes);

    const edgeOperator = edge.label ? `-- "${escapeLabel(edge.label)}" ->` : "->";

    lines.push(`${from} ${edgeOperator} ${to}`);
  }

  /*
   * Support isolated nodes as well.
   */
  for (const node of document.nodes) {
    if (definedNodes.has(node.id)) {
      continue;
    }

    lines.push(serializeNodeReference(node, reverseSourceMap, definedNodes));
  }

  return lines.join("\n");
}
