import type { DiagramDocument, DiagramLayout, DiagramSourceMap } from "@/features/diagram/types";

export function cloneDocument(value: DiagramDocument): DiagramDocument {
  return JSON.parse(JSON.stringify(value)) as DiagramDocument;
}

export function documentsEqual(first: DiagramDocument, second: DiagramDocument): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

export function cloneLayout(layout: DiagramLayout): DiagramLayout {
  return Object.fromEntries(
    Object.entries(layout).map(([nodeId, value]) => [nodeId, { ...value }]),
  );
}

export function cloneSourceMap(sourceMap: DiagramSourceMap): DiagramSourceMap {
  return {
    ...sourceMap,
  };
}
