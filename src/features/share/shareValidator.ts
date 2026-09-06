import type {
  DiagramDirection,
  DiagramDocument,
  DiagramEdge,
  DiagramLayout,
  DiagramNode,
  DiagramSourceMap,
  NodeShape,
} from "@/features/diagram/types";

const NODE_SHAPES: NodeShape[] = ["rectangle", "rounded", "circle", "diamond"];

const DIRECTIONS: DiagramDirection[] = ["TD", "LR"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNodeShape(value: unknown): value is NodeShape {
  return typeof value === "string" && NODE_SHAPES.includes(value as NodeShape);
}

function isDiagramNode(value: unknown): value is DiagramNode {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" && typeof value.label === "string" && isNodeShape(value.shape)
  );
}

function isDiagramEdge(value: unknown): value is DiagramEdge {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.from !== "string" ||
    typeof value.to !== "string"
  ) {
    return false;
  }

  if (value.label !== undefined && typeof value.label !== "string") {
    return false;
  }

  if (value.routing !== undefined && value.routing !== "direct" && value.routing !== "around") {
    return false;
  }

  return true;
}

function isDiagramLayout(value: unknown): value is DiagramLayout {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((layout) => {
    if (!isRecord(layout)) {
      return false;
    }

    return (
      typeof layout.x === "number" &&
      Number.isFinite(layout.x) &&
      typeof layout.y === "number" &&
      Number.isFinite(layout.y) &&
      typeof layout.width === "number" &&
      Number.isFinite(layout.width) &&
      layout.width > 0 &&
      typeof layout.height === "number" &&
      Number.isFinite(layout.height) &&
      layout.height > 0
    );
  });
}

function isSourceMap(value: unknown): value is DiagramSourceMap {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((nodeId) => typeof nodeId === "string");
}

export function isDiagramDocument(value: unknown): value is DiagramDocument {
  if (!isRecord(value)) {
    return false;
  }

  if (!DIRECTIONS.includes(value.direction as DiagramDirection)) {
    return false;
  }

  if (!Array.isArray(value.nodes) || !value.nodes.every(isDiagramNode)) {
    return false;
  }

  if (!Array.isArray(value.edges) || !value.edges.every(isDiagramEdge)) {
    return false;
  }

  if (!isDiagramLayout(value.layout)) {
    return false;
  }

  if (!isSourceMap(value.sourceMap)) {
    return false;
  }

  const nodeIds = new Set(value.nodes.map((node) => node.id));

  return value.edges.every((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to));
}
