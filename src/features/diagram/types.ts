export type DiagramDirection = "TD" | "LR";

export interface DiagramNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
}

export interface DiagramDocument {
  direction: DiagramDirection;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  document: DiagramDocument;
  errors: ParseError[];
}
