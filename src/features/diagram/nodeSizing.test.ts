import { describe, expect, it } from "vitest";

import { calculateNodeSize, wrapNodeLabel } from "./nodeSizing";

describe("nodeSizing", () => {
  it("returns minimum size for short labels", () => {
    const size = calculateNodeSize("API");

    expect(size.width).toBe(140);
    expect(size.height).toBe(56);
  });

  it("increases width for long labels", () => {
    const size = calculateNodeSize("This is a relatively long node label");

    expect(size.width).toBeGreaterThan(140);
    expect(size.width).toBeLessThanOrEqual(360);
  });

  it("never exceeds maximum width", () => {
    const size = calculateNodeSize("a".repeat(1000));

    expect(size.width).toBe(360);
  });

  it("wraps long labels", () => {
    const lines = wrapNodeLabel("This is a long node label that should wrap", 140);

    expect(lines.length).toBeGreaterThan(1);
  });

  it("keeps words together when possible", () => {
    const lines = wrapNodeLabel("Web Browser", 200);

    expect(lines).toEqual(["Web Browser"]);
  });

  it("wraps explicit newlines", () => {
    const lines = wrapNodeLabel("Line one\nLine two", 200);

    expect(lines).toEqual(["Line one", "Line two"]);
  });

  it("supports empty paragraphs", () => {
    const lines = wrapNodeLabel("Line one\n\nLine three", 200);

    expect(lines).toContain("");
  });

  it("handles a single very long word", () => {
    const lines = wrapNodeLabel("a".repeat(100), 140);

    expect(lines.length).toBeGreaterThan(1);

    expect(lines.every((line) => line.length <= 13)).toBe(true);
  });

  it("returns minimum height for one line", () => {
    const size = calculateNodeSize("Node");

    expect(size.height).toBe(56);
  });

  it("increases height when label wraps", () => {
    const size = calculateNodeSize("This is a very long label that will require multiple lines");

    expect(size.height).toBeGreaterThan(56);
  });
});
