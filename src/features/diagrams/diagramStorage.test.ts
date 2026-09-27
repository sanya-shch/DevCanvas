import { describe, expect, it } from "vitest";
import { generateDiagramId } from "./diagramStorage";

describe("generateDiagramId", () => {
  it("prefixes generated ids with 'diagram_'", () => {
    expect(generateDiagramId()).toMatch(/^diagram_/);
  });

  it("generates unique ids on each call", () => {
    const first = generateDiagramId();
    const second = generateDiagramId();

    expect(first).not.toBe(second);
  });
});
