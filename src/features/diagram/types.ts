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
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ParseError {
  line: number;
  message: string;
}
