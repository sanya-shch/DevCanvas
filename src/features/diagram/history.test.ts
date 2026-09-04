import { describe, expect, it } from "vitest";

import { History } from "./history";

describe("History", () => {
  it("starts with empty undo and redo stacks", () => {
    const history = new History<string>();

    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });

  it("allows undo after pushing snapshots", () => {
    const history = new History<string>();

    history.push("A");
    history.push("B");
    history.push("C");

    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);

    expect(history.undo("D")).toBe("C");
    expect(history.undo("C")).toBe("B");
    expect(history.undo("B")).toBe("A");

    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);
  });

  it("allows redo after undo", () => {
    const history = new History<string>();

    history.push("A");
    history.push("B");
    history.push("C");

    expect(history.undo("D")).toBe("C");
    expect(history.undo("C")).toBe("B");

    expect(history.redo("B")).toBe("C");
    expect(history.redo("C")).toBe("D");

    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });

  it("returns null when undo is not available", () => {
    const history = new History<string>();

    expect(history.undo("A")).toBeNull();
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });

  it("returns null when redo is not available", () => {
    const history = new History<string>();

    history.push("A");

    expect(history.redo("A")).toBeNull();
    expect(history.canRedo).toBe(false);
  });

  it("clears redo history after a new change", () => {
    const history = new History<string>();

    history.push("A");
    history.push("B");
    history.push("C");

    expect(history.undo("D")).toBe("C");
    expect(history.canRedo).toBe(true);

    history.push("C");

    expect(history.canRedo).toBe(false);
  });

  it("does not allow old redo states after a new change", () => {
    const history = new History<string>();

    history.push("A");
    history.push("B");
    history.push("C");

    expect(history.undo("D")).toBe("C");

    history.push("C");

    expect(history.redo("C")).toBeNull();
  });

  it("supports multiple undo and redo operations", () => {
    const history = new History<string>();

    history.push("A");
    history.push("B");
    history.push("C");
    history.push("D");

    expect(history.undo("E")).toBe("D");
    expect(history.undo("D")).toBe("C");

    expect(history.redo("C")).toBe("D");
    expect(history.redo("D")).toBe("E");

    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });

  it("respects the maximum history size", () => {
    const history = new History<string>(3);

    history.push("A");
    history.push("B");
    history.push("C");
    history.push("D");

    expect(history.undo("D")).toBe("D");
    expect(history.undo("D")).toBe("C");
    expect(history.undo("C")).toBe("B");
    expect(history.undo("B")).toBeNull();
  });

  it("clears both undo and redo history", () => {
    const history = new History<string>();

    // States:
    // A → B → C
    // History stores previous states: [A, B]

    history.push("A");
    history.push("B");

    // Current state is C, undo should restore B.
    expect(history.undo("C")).toBe("B");

    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(true);

    history.clear();

    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });

  it("moves states between undo and redo stacks", () => {
    const history = new History<string>();

    history.push("A");
    history.push("B");

    expect(history.undo("C")).toBe("B");
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(true);

    expect(history.redo("B")).toBe("C");
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });
});
