import { parseDiagram } from "@/features/diagram/parser";
import { serializeDiagram } from "@/features/diagram/serializer";

import type { EditorState } from "./state";

/**
 * Owns the source-text <-> document translation: parsing the DSL
 * into a DiagramDocument, and re-serializing a document back to
 * source text after a structural edit (label/shape change, undo/redo).
 */
export function useDiagramParsing(state: EditorState) {
  const { source, document, errors, selectedNodeId } = state;

  function parse() {
    const result = parseDiagram(source.value, document.value);

    if (result.errors.length > 0) {
      errors.value = result.errors;

      return;
    }

    document.value = result.document;

    errors.value = [];

    if (
      selectedNodeId.value &&
      !result.document.nodes.some((node) => node.id === selectedNodeId.value)
    ) {
      selectedNodeId.value = null;
    }
  }

  function setSource(value: string) {
    source.value = value;
  }

  function updateSourceFromDocument() {
    source.value = serializeDiagram(document.value);
  }

  return {
    parse,
    setSource,
    updateSourceFromDocument,
  };
}

export type DiagramParsing = ReturnType<typeof useDiagramParsing>;
