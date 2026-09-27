import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteDiagram, getAllDiagrams, getDiagram, saveDiagram } from "./diagramRepository";
import type { SavedDiagram } from "./types";

function createDiagram(overrides: Partial<SavedDiagram> = {}): SavedDiagram {
  return {
    id: "diagram-1",
    title: "Test diagram",
    source: "flowchart LR\nA -> B",
    direction: "LR",
    nodes: [],
    sourceMap: {},
    layout: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("diagramRepository", () => {
  beforeEach(async () => {
    const diagrams = await getAllDiagrams();

    await Promise.all(diagrams.map((diagram) => deleteDiagram(diagram.id)));
  });

  it("saves and retrieves a diagram", async () => {
    const diagram = createDiagram();

    await saveDiagram(diagram);

    await expect(getDiagram(diagram.id)).resolves.toEqual(diagram);
  });

  it("returns null for a missing diagram", async () => {
    await expect(getDiagram("missing")).resolves.toBeNull();
  });

  it("returns all saved diagrams", async () => {
    const first = createDiagram({ id: "first" });
    const second = createDiagram({ id: "second" });

    await saveDiagram(first);
    await saveDiagram(second);

    const diagrams = await getAllDiagrams();

    expect(diagrams.map((diagram) => diagram.id).sort()).toEqual(["first", "second"]);
  });

  it("deletes a diagram", async () => {
    const diagram = createDiagram();

    await saveDiagram(diagram);
    await deleteDiagram(diagram.id);

    await expect(getDiagram(diagram.id)).resolves.toBeNull();
  });

  it("overwrites an existing diagram on save", async () => {
    await saveDiagram(createDiagram({ title: "Initial" }));
    await saveDiagram(createDiagram({ title: "Updated" }));

    const diagram = await getDiagram("diagram-1");

    expect(diagram?.title).toBe("Updated");
  });

  it("deleting a missing diagram does not throw", async () => {
    await expect(deleteDiagram("missing")).resolves.not.toThrow();
  });
});
