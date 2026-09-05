import type { DiagramDirection, DiagramLayout, DiagramSourceMap } from "@/features/diagram/types";

export interface SavedDiagram {
  id: string;
  title: string;
  source: string;
  direction: DiagramDirection;
  sourceMap: DiagramSourceMap;
  layout: DiagramLayout;
  createdAt: number;
  updatedAt: number;
}
