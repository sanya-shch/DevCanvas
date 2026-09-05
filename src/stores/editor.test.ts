import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useEditorStore } from "./editor";
import { calculateNodeSize } from "@/features/diagram/nodeSizing";

const saveDiagramMock = vi.fn();
const getByIdMock = vi.fn();

vi.mock("./diagrams", () => ({
  useDiagramsStore: () => ({
    saveDiagram: saveDiagramMock,
    getById: getByIdMock,
  }),
}));

vi.mock("@/features/diagrams/diagramStorage", () => ({
  generateDiagramId: () => "diagram_test_123",
}));

describe("editor store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function createStore() {
    return useEditorStore();
  }

  function getNodeBySourceId(store: ReturnType<typeof useEditorStore>, sourceId: string) {
    const nodeId = store.document.sourceMap[sourceId];

    if (!nodeId) {
      throw new Error(`Node "${sourceId}" was not found.`);
    }

    const node = store.document.nodes.find((item) => item.id === nodeId);

    if (!node) {
      throw new Error(`Internal node "${nodeId}" was not found.`);
    }

    return node;
  }

  function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  describe("initial state", () => {
    it("starts with empty document and initial source", () => {
      const store = createStore();

      expect(store.document.nodes).toHaveLength(0);
      expect(store.document.edges).toHaveLength(0);
      expect(store.document.direction).toBe("LR");

      expect(store.source).toContain("flowchart LR");

      expect(store.errors).toEqual([]);
      expect(store.hasErrors).toBe(false);

      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(false);

      expect(store.zoom).toBe(1);
      expect(store.offset).toEqual({
        x: 0,
        y: 0,
      });

      expect(store.selectedNodeId).toBeNull();
      expect(store.selectedNode).toBeNull();
    });
  });

  describe("parse", () => {
    it("parses valid source into a document", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR

        Browser["Web Browser"] -> API["REST API"]
        API -> Database["PostgreSQL"]
      `);

      store.parse();

      expect(store.errors).toEqual([]);
      expect(store.hasErrors).toBe(false);

      expect(store.document.direction).toBe("LR");
      expect(store.document.nodes).toHaveLength(3);
      expect(store.document.edges).toHaveLength(2);

      expect(store.document.sourceMap).toHaveProperty("Browser");
      expect(store.document.sourceMap).toHaveProperty("API");
      expect(store.document.sourceMap).toHaveProperty("Database");

      expect(getNodeBySourceId(store, "Browser").label).toBe("Web Browser");

      expect(getNodeBySourceId(store, "API").label).toBe("REST API");

      expect(getNodeBySourceId(store, "Database").label).toBe("PostgreSQL");
    });

    it("creates layout for parsed nodes", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      for (const node of store.document.nodes) {
        const layout = store.document.layout[node.id];

        expect(layout).toBeDefined();
        expect(layout?.width).toBeGreaterThan(0);
        expect(layout?.height).toBeGreaterThan(0);
      }
    });

    it("stores parse errors without replacing the last valid document", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const previousDocument = clone(store.document);

      store.setSource(`
        flowchart LR
        A ->
      `);

      store.parse();

      expect(store.hasErrors).toBe(true);
      expect(store.errors.length).toBeGreaterThan(0);

      expect(store.document).toEqual(previousDocument);
    });

    it("clears errors after parsing valid source", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A ->
      `);

      store.parse();

      expect(store.hasErrors).toBe(true);

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      expect(store.hasErrors).toBe(false);
      expect(store.errors).toEqual([]);
    });
  });

  describe("selection", () => {
    it("selects an existing node", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.selectNode(node.id);

      expect(store.selectedNodeId).toBe(node.id);
      expect(store.selectedNode).toEqual(node);
    });

    it("clears selection", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.selectNode(node.id);
      expect(store.selectedNode).toEqual(node);

      store.selectNode(null);

      expect(store.selectedNodeId).toBeNull();
      expect(store.selectedNode).toBeNull();
    });

    it("clears selection when the selected node disappears after parsing", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.selectNode(node.id);

      store.setSource(`
        flowchart LR
        B -> C
      `);

      store.parse();

      expect(store.selectedNodeId).toBeNull();
      expect(store.selectedNode).toBeNull();
    });

    it("clears selection when the selected node is deleted", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.selectNode(node.id);

      store.deleteNode(node.id);

      expect(store.selectedNodeId).toBeNull();
      expect(store.selectedNode).toBeNull();
    });
  });

  describe("source synchronization", () => {
    it("serializes the document back into source", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A["First"] -> B["Second"]
      `);

      store.parse();

      store.updateSourceFromDocument();

      expect(store.source).toContain("flowchart LR");
      expect(store.source).toContain('A["First"]');
      expect(store.source).toContain('B["Second"]');
      expect(store.source).toContain("->");
    });
  });

  describe("node position", () => {
    it("updates node position without changing its semantic data", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");
      const previousNode = clone(node);
      const previousLayout = clone(store.document.layout[node.id]);

      store.updateNodePosition(node.id, 500, 300);

      expect(getNodeBySourceId(store, "A")).toEqual(previousNode);

      expect(store.document.layout[node.id]).toEqual({
        ...previousLayout,
        x: 500,
        y: 300,
      });

      expect(store.source).toContain("A");
    });

    it("ignores position updates for an unknown node", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const previousDocument = clone(store.document);

      store.updateNodePosition("unknown-node", 500, 300);

      expect(store.document).toEqual(previousDocument);
    });
  });

  describe("node label", () => {
    it("updates node label", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A["First"] -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.updateNodeLabel(node.id, "Updated");

      expect(getNodeBySourceId(store, "A").label).toBe("Updated");
    });

    it("trims the node label", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A["First"] -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.updateNodeLabel(node.id, "   Updated label   ");

      expect(getNodeBySourceId(store, "A").label).toBe("Updated label");
    });

    it("does not update the node when the label is empty", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A["First"] -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.updateNodeLabel(node.id, "   ");

      expect(getNodeBySourceId(store, "A").label).toBe("First");

      expect(store.canUndo).toBe(false);
    });

    it("recalculates node size after changing the label", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A["First"] -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.updateNodeLabel(node.id, "A much longer node label");

      const expectedSize = calculateNodeSize("A much longer node label");

      expect(store.document.layout[node.id]).toMatchObject({
        width: expectedSize.width,
        height: expectedSize.height,
      });
    });

    it("adds a label change to history", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A["First"] -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.updateNodeLabel(node.id, "Updated");

      expect(store.canUndo).toBe(true);

      store.undo();

      expect(getNodeBySourceId(store, "A").label).toBe("First");
    });

    it("supports redo after undoing a label change", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A["First"] -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.updateNodeLabel(node.id, "Updated");

      store.undo();

      expect(getNodeBySourceId(store, "A").label).toBe("First");

      store.redo();

      expect(getNodeBySourceId(store, "A").label).toBe("Updated");
    });
  });

  describe("delete node", () => {
    it("deletes a node", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
        B -> C
      `);

      store.parse();

      const node = getNodeBySourceId(store, "B");

      store.deleteNode(node.id);

      expect(store.document.nodes).toHaveLength(2);
      expect(store.document.sourceMap.B).toBeUndefined();
    });

    it("deletes edges connected to the node", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
        B -> C
        A -> C
      `);

      store.parse();

      const node = getNodeBySourceId(store, "B");

      store.deleteNode(node.id);

      expect(store.document.edges).toHaveLength(1);

      const remainingEdge = store.document.edges[0];

      const nodeA = getNodeBySourceId(store, "A");
      const nodeC = getNodeBySourceId(store, "C");

      expect(remainingEdge.from).toBe(nodeA.id);
      expect(remainingEdge.to).toBe(nodeC.id);
    });

    it("deletes the node layout", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      expect(store.document.layout[node.id]).toBeDefined();

      store.deleteNode(node.id);

      expect(store.document.layout[node.id]).toBeUndefined();
    });

    it("adds deletion to history", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.deleteNode(node.id);

      expect(store.canUndo).toBe(true);

      store.undo();

      expect(store.document.sourceMap.A).toBeDefined();

      expect(getNodeBySourceId(store, "A").label).toBe("A");
    });

    it("restores deleted node with redo", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.deleteNode(node.id);

      store.undo();

      expect(store.document.sourceMap.A).toBeDefined();

      store.redo();

      expect(store.document.sourceMap.A).toBeUndefined();
    });

    it("does nothing when deleting an unknown node", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const previousDocument = clone(store.document);

      store.deleteNode("unknown-node");

      expect(store.document).toEqual(previousDocument);
      expect(store.canUndo).toBe(false);
    });
  });

  describe("history transactions", () => {
    it("groups multiple position changes into one undo step", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      const initialLayout = clone(store.document.layout[node.id]);

      store.beginHistoryTransaction();

      store.updateNodePosition(node.id, 100, 100);
      store.updateNodePosition(node.id, 200, 200);
      store.updateNodePosition(node.id, 300, 300);

      store.endHistoryTransaction();

      expect(store.document.layout[node.id]).toMatchObject({
        x: 300,
        y: 300,
      });

      expect(store.canUndo).toBe(true);

      store.undo();

      expect(store.document.layout[node.id]).toEqual(initialLayout);

      expect(store.canUndo).toBe(false);
    });

    it("does not create history when a transaction has no changes", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      store.beginHistoryTransaction();
      store.endHistoryTransaction();

      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(false);
    });

    it("does not create duplicate transactions when begin is called twice", () => {
      const store = useEditorStore();

      store.setSource(`
flowchart TD
A -> B
`);

      store.parse();

      const node = getNodeBySourceId(store, "A");
      const initialLayout = clone(store.document.layout[node.id]);

      store.beginHistoryTransaction();
      store.beginHistoryTransaction();

      store.updateNodePosition(node.id, initialLayout.x + 100, initialLayout.y + 100);

      store.endHistoryTransaction();

      expect(store.canUndo).toBe(true);

      store.undo();

      const restoredLayout = store.document.layout[node.id];

      expect(restoredLayout.x).toBe(initialLayout.x);
      expect(restoredLayout.y).toBe(initialLayout.y);

      expect(store.canUndo).toBe(false);
    });
  });

  describe("undo and redo", () => {
    it("does nothing when undo is unavailable", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const previousDocument = clone(store.document);
      const previousSource = store.source;

      store.undo();

      expect(store.document).toEqual(previousDocument);
      expect(store.source).toBe(previousSource);
    });

    it("does nothing when redo is unavailable", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const previousDocument = clone(store.document);
      const previousSource = store.source;

      store.redo();

      expect(store.document).toEqual(previousDocument);
      expect(store.source).toBe(previousSource);
    });

    it("clears errors after undo", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.updateNodeLabel(node.id, "Updated");

      store.setSource(`
        flowchart LR
        A ->
      `);

      store.parse();

      expect(store.hasErrors).toBe(true);

      store.undo();

      expect(store.hasErrors).toBe(false);
    });

    it("clears errors after redo", () => {
      const store = createStore();

      store.setSource(`
        flowchart LR
        A -> B
      `);

      store.parse();

      const node = getNodeBySourceId(store, "A");

      store.updateNodeLabel(node.id, "Updated");

      store.undo();

      store.setSource(`
        flowchart LR
        A ->
      `);

      store.parse();

      expect(store.hasErrors).toBe(true);

      store.redo();

      expect(store.hasErrors).toBe(false);
      expect(getNodeBySourceId(store, "A").label).toBe("Updated");
    });
  });

  describe("zoom", () => {
    it("sets zoom", () => {
      const store = createStore();

      store.setZoom(1.5);

      expect(store.zoom).toBe(1.5);
    });

    it("clamps zoom to minimum", () => {
      const store = createStore();

      store.setZoom(0);

      expect(store.zoom).toBe(0.25);
    });

    it("clamps zoom to maximum", () => {
      const store = createStore();

      store.setZoom(5);

      expect(store.zoom).toBe(2);
    });

    it("zooms in", () => {
      const store = createStore();

      store.setZoom(1);
      store.zoomIn();

      expect(store.zoom).toBeCloseTo(1.1);
    });

    it("zooms out", () => {
      const store = createStore();

      store.setZoom(1);
      store.zoomOut();

      expect(store.zoom).toBeCloseTo(0.9);
    });
  });

  describe("viewport", () => {
    it("sets offset", () => {
      const store = createStore();

      store.setOffset(100, 200);

      expect(store.offset).toEqual({
        x: 100,
        y: 200,
      });
    });

    it("updates offset relative to current value", () => {
      const store = createStore();

      store.setOffset(100, 200);
      store.updateViewport(50, -25);

      expect(store.offset).toEqual({
        x: 150,
        y: 175,
      });
    });

    it("resets viewport", () => {
      const store = createStore();

      store.setZoom(1.5);
      store.setOffset(100, 200);

      store.resetViewport();

      expect(store.zoom).toBe(1);
      expect(store.offset).toEqual({
        x: 0,
        y: 0,
      });
    });
  });

  it("updates node shape", () => {
    const store = useEditorStore();

    store.createNewDiagram();

    const node = store.document.nodes[0];

    expect(node.shape).toBe("rectangle");

    store.updateNodeShape(node.id, "circle");

    expect(node.shape).toBe("circle");
  });

  it("adds shape changes to history", () => {
    const store = useEditorStore();

    store.createNewDiagram();

    const node = store.document.nodes[0];

    store.updateNodeShape(node.id, "diamond");

    expect(store.document.nodes[0].shape).toBe("diamond");

    store.undo();

    expect(store.document.nodes[0].shape).toBe("rectangle");
  });
});

describe("useEditorStore autosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    vi.clearAllMocks();

    getByIdMock.mockResolvedValue(null);
    saveDiagramMock.mockResolvedValue(undefined);

    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("autosaves after the debounce delay", async () => {
    const store = useEditorStore();

    store.source = `${store.source}\nA -> C`;

    expect(saveDiagramMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1199);

    expect(saveDiagramMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(saveDiagramMock).toHaveBeenCalledTimes(1);
    expect(store.diagramId).toBe("diagram_test_123");
    expect(store.isDirty).toBe(false);
    expect(store.isSaving).toBe(false);
    expect(store.lastSavedAt).not.toBeNull();
  });

  it("debounces multiple source changes into a single save", async () => {
    const store = useEditorStore();

    store.source = `${store.source}\nA -> C`;

    await vi.advanceTimersByTimeAsync(500);

    store.source = `${store.source}\nC -> D`;

    await vi.advanceTimersByTimeAsync(500);

    store.source = `${store.source}\nD -> E`;

    expect(saveDiagramMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1199);

    expect(saveDiagramMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(saveDiagramMock).toHaveBeenCalledTimes(1);
  });

  it("does not mark the diagram dirty when loading a saved diagram", async () => {
    getByIdMock.mockResolvedValue({
      id: "diagram_existing",
      title: "Existing Diagram",
      source: `flowchart LR

A -> B
`,
      direction: "LR",
      sourceMap: {},
      layout: {
        A: {
          x: 0,
          y: 0,
          width: 120,
          height: 50,
        },
        B: {
          x: 200,
          y: 0,
          width: 120,
          height: 50,
        },
      },
      createdAt: 1000,
      updatedAt: 2000,
    });

    const store = useEditorStore();

    const loaded = await store.loadDiagram("diagram_existing");

    expect(loaded).toBe(true);
    expect(store.diagramId).toBe("diagram_existing");
    expect(store.lastSavedAt).toBe(2000);
    expect(saveDiagramMock).not.toHaveBeenCalled();
  });

  it("keeps the diagram dirty when a change happens during saving", async () => {
    let resolveSave!: () => void;

    saveDiagramMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );

    const store = useEditorStore();

    store.source = `${store.source}\nA -> C`;

    await vi.advanceTimersByTimeAsync(1200);

    expect(store.isSaving).toBe(true);

    store.source = `${store.source}\nC -> D`;

    expect(store.isDirty).toBe(true);

    resolveSave();

    await vi.runAllTimersAsync();

    expect(store.isDirty).toBe(true);
  });

  it("autosaves changes made after an in-progress save", async () => {
    let resolveFirstSave!: () => void;

    saveDiagramMock
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirstSave = resolve;
          }),
      )
      .mockResolvedValue(undefined);

    const store = useEditorStore();

    store.source = `${store.source}\nA -> C`;

    await vi.advanceTimersByTimeAsync(1200);

    expect(saveDiagramMock).toHaveBeenCalledTimes(1);
    expect(store.isSaving).toBe(true);

    store.source = `${store.source}\nC -> D`;

    resolveFirstSave();

    await vi.runAllTimersAsync();

    expect(saveDiagramMock).toHaveBeenCalledTimes(2);
    expect(store.isDirty).toBe(false);
  });

  it("marks the diagram dirty after undo", async () => {
    const store = useEditorStore();

    store.source = `flowchart LR

A -> B
`;

    store.parse();

    const nodeId = store.document.nodes[0]?.id;

    expect(nodeId).toBeDefined();

    store.updateNodeLabel(nodeId!, "Updated");

    expect(store.isDirty).toBe(true);

    await vi.advanceTimersByTimeAsync(1200);

    expect(store.isDirty).toBe(false);

    store.undo();

    expect(store.isDirty).toBe(true);
  });
});
