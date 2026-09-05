import type {
  DiagramLayout,
  DiagramNode,
  DiagramSourceMap,
  DiagramDirection,
} from "@/features/diagram/types";

export interface SavedDiagram {
  id: string;
  title: string;
  source: string;
  direction: DiagramDirection;
  nodes: DiagramNode[];
  sourceMap: DiagramSourceMap;
  layout: DiagramLayout;
  createdAt: number;
  updatedAt: number;
}
