import { describe, expect, it } from "vitest";

import { parseDiagram } from "./parser";
import { routeEdge } from "./edgeRouter";

describe("cyclic diagram routing", () => {
  it("routes LR cycle without failing", () => {
    const result = parseDiagram(`
      flowchart LR
      A -> B
      B -> C
      C -> A
    `);

    expect(result.errors).toEqual([]);

    const routes = result.document.edges.map((edge) =>
      routeEdge(edge, result.document.layout, new Map(), "LR"),
    );

    expect(routes.every((route) => route !== null)).toBe(true);
  });

  it("routes TD cycle without failing", () => {
    const result = parseDiagram(`
      flowchart TD
      A -> B
      B -> C
      C -> A
    `);

    expect(result.errors).toEqual([]);

    const routes = result.document.edges.map((edge) =>
      routeEdge(edge, result.document.layout, new Map(), "TD"),
    );

    expect(routes.every((route) => route !== null)).toBe(true);
  });
});
