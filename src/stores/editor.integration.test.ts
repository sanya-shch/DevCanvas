import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useEditorStore } from "./editor";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getNodeBySourceId(store: ReturnType<typeof useEditorStore>, sourceId: string) {
  const internalId = store.document.sourceMap[sourceId];

  if (!internalId) {
    throw new Error(`Node "${sourceId}" was not found in sourceMap`);
  }

  const node = store.document.nodes.find((item) => item.id === internalId);

  if (!node) {
    throw new Error(`Node "${sourceId}" with internal id "${internalId}" was not found`);
  }

  return node;
}

function parseSource(store: ReturnType<typeof useEditorStore>, source: string) {
  store.setSource(source);
  store.parse();

  expect(store.hasErrors).toBe(false);
}

describe("editor store integration", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("parses source into the document model", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

Browser["Web Browser"] -> API["API Server"]
API -> Database["PostgreSQL"]`,
    );

    expect(store.document.direction).toBe("LR");

    expect(store.document.nodes).toHaveLength(3);
    expect(store.document.edges).toHaveLength(2);

    const browser = getNodeBySourceId(store, "Browser");
    const api = getNodeBySourceId(store, "API");
    const database = getNodeBySourceId(store, "Database");

    expect(browser.label).toBe("Web Browser");
    expect(api.label).toBe("API Server");
    expect(database.label).toBe("PostgreSQL");

    expect(store.document.sourceMap.Browser).toBe(browser.id);
    expect(store.document.sourceMap.API).toBe(api.id);
    expect(store.document.sourceMap.Database).toBe(database.id);

    expect(store.document.layout[browser.id]).toBeDefined();
    expect(store.document.layout[api.id]).toBeDefined();
    expect(store.document.layout[database.id]).toBeDefined();
  });

  it("serializes semantic changes back to source", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

A["Browser"] -> B["API"]`,
    );

    const browser = getNodeBySourceId(store, "A");

    store.updateNodeLabel(browser.id, "Web Browser");

    expect(browser.label).toBe("Web Browser");

    expect(store.source).toContain('A["Web Browser"]');
  });

  it("changes layout without changing source", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

A["Browser"] -> B["API"]`,
    );

    const browser = getNodeBySourceId(store, "A");

    const initialSource = store.source;

    const initialLayout = clone(store.document.layout[browser.id]);

    store.beginHistoryTransaction();

    store.updateNodePosition(browser.id, initialLayout.x + 200, initialLayout.y + 100);

    store.endHistoryTransaction();

    const nextLayout = store.document.layout[browser.id];

    expect(nextLayout.x).toBe(initialLayout.x + 200);

    expect(nextLayout.y).toBe(initialLayout.y + 100);

    expect(store.source).toBe(initialSource);
  });

  it("creates one history entry for a completed drag transaction", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

A["Browser"] -> B["API"]`,
    );

    const browser = getNodeBySourceId(store, "A");

    const initialLayout = clone(store.document.layout[browser.id]);

    store.beginHistoryTransaction();

    store.updateNodePosition(browser.id, initialLayout.x + 50, initialLayout.y + 25);

    store.updateNodePosition(browser.id, initialLayout.x + 100, initialLayout.y + 50);

    store.updateNodePosition(browser.id, initialLayout.x + 150, initialLayout.y + 75);

    store.endHistoryTransaction();

    expect(store.canUndo).toBe(true);

    store.undo();

    const restoredLayout = store.document.layout[browser.id];

    expect(restoredLayout.x).toBe(initialLayout.x);

    expect(restoredLayout.y).toBe(initialLayout.y);

    expect(store.canUndo).toBe(false);
  });

  it("undoes a semantic label change", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

A["Browser"] -> B["API"]`,
    );

    const browser = getNodeBySourceId(store, "A");
    const initialSource = store.source;

    store.updateNodeLabel(browser.id, "Web Browser");

    expect(browser.label).toBe("Web Browser");

    store.undo();

    const restoredBrowser = getNodeBySourceId(store, "A");

    expect(restoredBrowser.label).toBe("Browser");
    expect(store.source).toBe(initialSource);
  });

  it("redoes a semantic label change", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

A["Browser"] -> B["API"]`,
    );

    const browser = getNodeBySourceId(store, "A");

    store.updateNodeLabel(browser.id, "Web Browser");

    store.undo();

    expect(getNodeBySourceId(store, "A").label).toBe("Browser");

    expect(store.canRedo).toBe(true);

    store.redo();

    expect(getNodeBySourceId(store, "A").label).toBe("Web Browser");

    expect(store.source).toContain('A["Web Browser"]');
  });

  it("undoes a drag transaction and restores the original source", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

A["Browser"] -> B["API"]`,
    );

    const browser = getNodeBySourceId(store, "A");

    const initialSource = store.source;

    const initialLayout = clone(store.document.layout[browser.id]);

    store.beginHistoryTransaction();

    store.updateNodePosition(browser.id, initialLayout.x + 300, initialLayout.y + 150);

    store.endHistoryTransaction();

    expect(store.source).toBe(initialSource);

    store.undo();

    expect(store.document.layout[browser.id]).toEqual(initialLayout);

    expect(store.source).toBe(initialSource);
  });

  it("keeps the last valid document when source becomes invalid", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

A["Browser"] -> B["API"]`,
    );

    const validDocument = clone(store.document);

    store.setSource(
      `flowchart LR

A["Browser" -> B["API"]`,
    );

    store.parse();

    expect(store.hasErrors).toBe(true);

    expect(store.document).toEqual(validDocument);
  });

  it("replaces the document after invalid source is fixed", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

A["Browser"] -> B["API"]`,
    );

    store.setSource(
      `flowchart LR

A["Browser" -> B["API"]`,
    );

    store.parse();

    expect(store.hasErrors).toBe(true);

    store.setSource(
      `flowchart LR

A["Web Browser"] -> B["API Server"]`,
    );

    store.parse();

    expect(store.hasErrors).toBe(false);

    expect(getNodeBySourceId(store, "A").label).toBe("Web Browser");

    expect(getNodeBySourceId(store, "B").label).toBe("API Server");
  });

  it("preserves internal node ids when reparsing the same source ids", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

A["Browser"] -> B["API"]`,
    );

    const browser = getNodeBySourceId(store, "A");
    const api = getNodeBySourceId(store, "B");

    const browserId = browser.id;
    const apiId = api.id;

    store.setSource(
      `flowchart LR

A["Web Browser"] -> B["API Server"]`,
    );

    store.parse();

    expect(getNodeBySourceId(store, "A").id).toBe(browserId);

    expect(getNodeBySourceId(store, "B").id).toBe(apiId);
  });

  it("recalculates layout when diagram direction changes", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

A["Browser"] -> B["API"]
B -> C["Database"]`,
    );

    const browser = getNodeBySourceId(store, "A");
    const api = getNodeBySourceId(store, "B");
    const database = getNodeBySourceId(store, "C");

    const idsBefore = {
      browser: browser.id,
      api: api.id,
      database: database.id,
    };

    const lrBrowser = clone(store.document.layout[browser.id]);

    const lrApi = clone(store.document.layout[api.id]);

    const lrDatabase = clone(store.document.layout[database.id]);

    expect(lrBrowser.x).toBeLessThan(lrApi.x);

    expect(lrApi.x).toBeLessThan(lrDatabase.x);

    store.setSource(
      `flowchart TD

A["Browser"] -> B["API"]
B -> C["Database"]`,
    );

    store.parse();

    expect(store.document.direction).toBe("TD");

    expect(getNodeBySourceId(store, "A").id).toBe(idsBefore.browser);

    expect(getNodeBySourceId(store, "B").id).toBe(idsBefore.api);

    expect(getNodeBySourceId(store, "C").id).toBe(idsBefore.database);

    const tdBrowser = store.document.layout[browser.id];

    const tdApi = store.document.layout[api.id];

    const tdDatabase = store.document.layout[database.id];

    expect(tdBrowser.y).toBeLessThan(tdApi.y);

    expect(tdApi.y).toBeLessThan(tdDatabase.y);

    expect(tdDatabase.y).not.toBe(lrDatabase.y);
  });

  it("supports multiple independent undo steps", () => {
    const store = useEditorStore();

    parseSource(
      store,
      `flowchart LR

A["Browser"] -> B["API"]`,
    );

    const browser = getNodeBySourceId(store, "A");

    const initialLabel = browser.label;

    const initialLayout = clone(store.document.layout[browser.id]);

    store.updateNodeLabel(browser.id, "Web Browser");

    store.beginHistoryTransaction();

    store.updateNodePosition(browser.id, initialLayout.x + 100, initialLayout.y + 50);

    store.endHistoryTransaction();

    expect(browser.label).toBe("Web Browser");

    store.undo();

    expect(getNodeBySourceId(store, "A").label).toBe("Web Browser");

    expect(store.document.layout[browser.id]).toEqual(initialLayout);

    store.undo();

    expect(getNodeBySourceId(store, "A").label).toBe(initialLabel);

    expect(store.canUndo).toBe(false);
  });
});
