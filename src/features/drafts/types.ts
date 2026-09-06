import type { DiagramDocument } from "@/features/diagram/types";

export interface DiagramDraft {
  id: string;
  diagramId: string | null;
  title: string;
  source: string;
  document: DiagramDocument;
  updatedAt: number;
}
