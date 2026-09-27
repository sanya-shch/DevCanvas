import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useDiagramsStore } from "./diagrams";
import type { SavedDiagram } from "@/features/diagrams/types";

const { deleteDiagram, getAllDiagrams, getDiagram, saveDiagram } = vi.hoisted(() => ({
  deleteDiagram: vi.fn(),
  getAllDiagrams: vi.fn(),
  getDiagram: vi.fn(),
  saveDiagram: vi.fn(),
}));

vi.mock("@/features/diagrams/diagramRepository", () => ({
  deleteDiagram,
  getAllDiagrams,
  getDiagram,
  saveDiagram,
}));

function createDiagram(overrides: Partial<SavedDiagram> = {}): SavedDiagram {
  return {
    id: "diagram-1",
    title: "Test diagram",
    source: "flowchart LR\nA -> B",
    direction: "LR",
    nodes: [],
    sourceMap: {},
    layout: {},
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("diagrams store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    deleteDiagram.mockReset().mockResolvedValue(undefined);
    getAllDiagrams.mockReset().mockResolvedValue([]);
    getDiagram.mockReset().mockResolvedValue(null);
    saveDiagram.mockReset().mockResolvedValue(undefined);
  });

  it("loads diagrams from the repository", async () => {
    const diagrams = [createDiagram({ id: "a" }), createDiagram({ id: "b" })];

    getAllDiagrams.mockResolvedValue(diagrams);

    const store = useDiagramsStore();

    await store.loadDiagrams();

    expect(store.diagrams).toEqual(diagrams);
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
  });

  it("sets an error message when loading fails", async () => {
    getAllDiagrams.mockRejectedValue(new Error("boom"));

    const store = useDiagramsStore();

    await store.loadDiagrams();

    expect(store.error).toBe("Something went wrong accessing local storage.");
    expect(store.isLoading).toBe(false);
    expect(store.diagrams).toEqual([]);
  });

  it("sorts diagrams by most recently updated", async () => {
    getAllDiagrams.mockResolvedValue([
      createDiagram({ id: "older", updatedAt: 100 }),
      createDiagram({ id: "newer", updatedAt: 200 }),
    ]);

    const store = useDiagramsStore();

    await store.loadDiagrams();

    expect(store.sortedDiagrams.map((diagram) => diagram.id)).toEqual(["newer", "older"]);
  });

  it("adds a new diagram on save", async () => {
    const store = useDiagramsStore();
    const diagram = createDiagram();

    await store.saveDiagram(diagram);

    expect(saveDiagram).toHaveBeenCalledWith(diagram);
    expect(store.diagrams).toEqual([diagram]);
  });

  it("replaces an existing diagram on save", async () => {
    const store = useDiagramsStore();

    await store.saveDiagram(createDiagram({ title: "Initial" }));
    await store.saveDiagram(createDiagram({ title: "Updated" }));

    expect(store.diagrams).toHaveLength(1);
    expect(store.diagrams[0].title).toBe("Updated");
  });

  it("updates a diagram and refreshes updatedAt", async () => {
    const store = useDiagramsStore();

    await store.saveDiagram(createDiagram({ updatedAt: 0 }));
    await store.updateDiagram(store.diagrams[0]);

    expect(store.diagrams[0].updatedAt).toBeGreaterThan(0);
    expect(saveDiagram).toHaveBeenLastCalledWith(expect.objectContaining({ id: "diagram-1" }));
  });

  it("removes a diagram", async () => {
    const store = useDiagramsStore();

    await store.saveDiagram(createDiagram());
    await store.removeDiagram("diagram-1");

    expect(deleteDiagram).toHaveBeenCalledWith("diagram-1");
    expect(store.diagrams).toEqual([]);
  });

  it("delegates getById to the repository", async () => {
    const diagram = createDiagram();

    getDiagram.mockResolvedValue(diagram);

    const store = useDiagramsStore();

    await expect(store.getById("diagram-1")).resolves.toEqual(diagram);
    expect(getDiagram).toHaveBeenCalledWith("diagram-1");
  });
});
