import { defineStore } from "pinia";

import { createEditorState } from "./editor/state";
import { useViewport } from "./editor/useViewport";
import { useDiagramParsing } from "./editor/useDiagramParsing";
import { useHistoryController } from "./editor/useHistoryController";
import { useDiagramPersistence } from "./editor/useDiagramPersistence";
import { useDiagramHistory } from "./editor/useDiagramHistory";
import { useDocumentEditing } from "./editor/useDocumentEditing";

export const useEditorStore = defineStore("editor", () => {
  const state = createEditorState();

  const viewport = useViewport(state.document);

  const parsing = useDiagramParsing(state);

  const historyController = useHistoryController();

  const persistence = useDiagramPersistence(state, {
    resetViewport: viewport.resetViewport,
    parse: parsing.parse,
    resetHistory: historyController.clear,
  });

  const history = useDiagramHistory(state, historyController, {
    markDirty: persistence.markDirty,
    updateSourceFromDocument: parsing.updateSourceFromDocument,
  });

  const documentEditing = useDocumentEditing(state, {
    commitDocument: history.commitDocument,
  });

  return {
    // document / selection state
    source: state.source,
    document: state.document,
    errors: state.errors,
    selectedNodeId: state.selectedNodeId,
    selectedNode: state.selectedNode,
    hasErrors: state.hasErrors,
    selectNode: state.selectNode,

    // parsing
    parse: parsing.parse,
    setSource: parsing.setSource,
    updateSourceFromDocument: parsing.updateSourceFromDocument,

    // viewport
    zoom: viewport.zoom,
    offset: viewport.offset,
    setZoom: viewport.setZoom,
    zoomIn: viewport.zoomIn,
    zoomOut: viewport.zoomOut,
    resetViewport: viewport.resetViewport,
    setOffset: viewport.setOffset,
    updateViewport: viewport.updateViewport,
    fitToScreen: viewport.fitToScreen,

    // node editing
    updateNodePosition: documentEditing.updateNodePosition,
    updateNodeShape: documentEditing.updateNodeShape,
    updateNodeLabel: documentEditing.updateNodeLabel,
    deleteNode: documentEditing.deleteNode,

    // history
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: history.undo,
    redo: history.redo,
    beginHistoryTransaction: history.beginHistoryTransaction,
    endHistoryTransaction: history.endHistoryTransaction,

    // persistence
    diagramId: persistence.diagramId,
    diagramTitle: persistence.diagramTitle,
    isSaving: persistence.isSaving,
    isDirty: persistence.isDirty,
    autosaveError: persistence.autosaveError,
    lastSavedAt: persistence.lastSavedAt,
    setDiagramTitle: persistence.setDiagramTitle,
    createNewDiagram: persistence.createNewDiagram,
    saveDiagram: persistence.saveDiagram,
    loadDiagram: persistence.loadDiagram,
    loadDocument: persistence.loadDocument,
    findRecoveryDraft: persistence.findRecoveryDraft,
    recoverDraft: persistence.recoverDraft,
    discardDraft: persistence.discardDraft,
  };
});
