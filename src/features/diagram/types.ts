export type DiagramDirection = "TD" | "LR";

export type NodeShape = "rectangle" | "rounded" | "circle" | "diamond";

export interface DiagramNode {
  id: string;
  label: string;
  shape: NodeShape;
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  routing?: "direct" | "around";
}

export interface DiagramSourceMap {
  [sourceId: string]: string;
}

export interface DiagramLayout {
  [nodeId: string]: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DiagramDocument {
  direction: DiagramDirection;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  layout: DiagramLayout;

  /**
   * Maps source-level identifiers from the DSL
   * to internal stable node IDs.
   *
   * Example:
   *
   * Browser -> node_a81f3c
   * API     -> node_b72d91
   */
  sourceMap: DiagramSourceMap;
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  document: DiagramDocument;
  errors: ParseError[];
}
