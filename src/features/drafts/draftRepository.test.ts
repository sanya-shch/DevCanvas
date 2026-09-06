import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import { deleteDraft, getAllDrafts, getDraft, saveDraft } from "./draftRepository";

import type { DiagramDraft } from "./types";

function createDraft(overrides: Partial<DiagramDraft> = {}): DiagramDraft {
  return {
    id: "draft-1",
    diagramId: null,
    title: "Test diagram",
    source: "flowchart LR\nA -> B",
    document: {
      direction: "LR",
      nodes: [],
      edges: [],
      layout: {},
      sourceMap: {},
    },
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("draftRepository", () => {
  beforeEach(async () => {
    const drafts = await getAllDrafts();

    await Promise.all(drafts.map((draft) => deleteDraft(draft.id)));
  });

  it("saves and retrieves a draft", async () => {
    const draft = createDraft();

    await saveDraft(draft);

    await expect(getDraft(draft.id)).resolves.toEqual(draft);
  });

  it("returns null for a missing draft", async () => {
    await expect(getDraft("missing")).resolves.toBeNull();
  });

  it("returns drafts sorted by updatedAt", async () => {
    const older = createDraft({
      id: "older",
      updatedAt: 100,
    });

    const newer = createDraft({
      id: "newer",
      updatedAt: 200,
    });

    await saveDraft(older);
    await saveDraft(newer);

    const drafts = await getAllDrafts();

    expect(drafts.map((draft) => draft.id)).toEqual(["newer", "older"]);
  });

  it("deletes a draft", async () => {
    const draft = createDraft();

    await saveDraft(draft);
    await deleteDraft(draft.id);

    await expect(getDraft(draft.id)).resolves.toBeNull();
  });

  it("updates an existing draft", async () => {
    await saveDraft(
      createDraft({
        title: "Initial",
      }),
    );

    await saveDraft(
      createDraft({
        title: "Updated",
      }),
    );

    const draft = await getDraft("draft-1");

    expect(draft?.title).toBe("Updated");
  });
});
