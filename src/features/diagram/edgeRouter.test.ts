import { describe, expect, it } from "vitest";

import { routeEdge } from "./edgeRouter";

import type { DiagramEdge, DiagramLayout } from "./types";

function createLayout(): DiagramLayout {
  return {
    a: {
      x: 0,
      y: 0,
      width: 140,
      height: 56,
    },
    b: {
      x: 300,
      y: 0,
      width: 140,
      height: 56,
    },
    c: {
      x: 600,
      y: 0,
      width: 140,
      height: 56,
    },
  };
}

function createEdge(from: string, to: string): DiagramEdge {
  return {
    id: `${from}-${to}`,
    from,
    to,
  };
}

describe("routeEdge", () => {
  describe("LR", () => {
    it("creates a direct route for a normal forward edge", () => {
      const layout = createLayout();

      const route = routeEdge(createEdge("a", "b"), layout, new Map(), "LR");

      expect(route).not.toBeNull();

      expect(route!.points.length).toBeGreaterThanOrEqual(2);

      const start = route!.points[0];
      const end = route!.points[route!.points.length - 1];

      expect(start.x).toBe(140);
      expect(end.x).toBe(300);
    });

    it("starts a forward LR edge from the right side", () => {
      const layout = createLayout();

      const route = routeEdge(createEdge("a", "b"), layout, new Map(), "LR");

      expect(route!.points[0]).toEqual({
        x: 140,
        y: 28,
      });
    });

    it("arrives at a forward LR target from the left", () => {
      const layout = createLayout();

      const route = routeEdge(createEdge("a", "b"), layout, new Map(), "LR");

      const end = route!.points[route!.points.length - 1];

      expect(end).toEqual({
        x: 300,
        y: 28,
      });
    });

    it("routes a back edge above nodes", () => {
      const layout = createLayout();

      layout.a.x = 600;
      layout.b.x = 300;

      const levels = new Map([
        ["a", 1],
        ["b", 0],
      ]);

      const route = routeEdge(createEdge("a", "b"), layout, levels, "LR");

      expect(route).not.toBeNull();

      expect(route!.points.some((point) => point.y < 0)).toBe(true);
    });

    it("arrives at a back-edge target perpendicularly", () => {
      const layout = createLayout();

      layout.a.x = 600;
      layout.b.x = 300;

      const levels = new Map([
        ["a", 1],
        ["b", 0],
      ]);

      const route = routeEdge(createEdge("a", "b"), layout, levels, "LR");

      expect(route).not.toBeNull();

      const points = route!.points;

      const end = points[points.length - 1];
      const previous = points[points.length - 2];

      expect(end).toEqual({
        x: 370,
        y: 0,
      });

      // Final segment must be vertical.
      expect(previous.x).toBe(end.x);
    });

    it("routes a complete LR cycle", () => {
      const layout: DiagramLayout = {
        a: {
          x: 0,
          y: 0,
          width: 140,
          height: 56,
        },
        b: {
          x: 300,
          y: 0,
          width: 140,
          height: 56,
        },
        c: {
          x: 600,
          y: 0,
          width: 140,
          height: 56,
        },
      };

      const levels = new Map([
        ["a", 0],
        ["b", 1],
        ["c", 2],
      ]);

      const edges = [createEdge("a", "b"), createEdge("b", "c"), createEdge("c", "a")];

      const routes = edges.map((edge) => routeEdge(edge, layout, levels, "LR"));

      expect(routes.every((route) => route !== null)).toBe(true);

      expect(routes[0]!.points.length).toBeGreaterThanOrEqual(2);

      expect(routes[1]!.points.length).toBeGreaterThanOrEqual(2);

      expect(routes[2]!.points.length).toBeGreaterThan(2);
    });

    it("uses normal LR routing for a forward edge", () => {
      const layout = createLayout();

      const levels = new Map([
        ["a", 0],
        ["b", 1],
      ]);

      const route = routeEdge(createEdge("a", "b"), layout, levels, "LR");

      expect(route).not.toBeNull();

      expect(route!.points[0]).toEqual({
        x: 140,
        y: 28,
      });

      expect(route!.points[route!.points.length - 1]).toEqual({
        x: 300,
        y: 28,
      });
    });
  });

  describe("TD", () => {
    it("creates a direct route for a normal forward edge", () => {
      const layout: DiagramLayout = {
        a: {
          x: 0,
          y: 0,
          width: 140,
          height: 56,
        },
        b: {
          x: 0,
          y: 200,
          width: 140,
          height: 56,
        },
      };

      const route = routeEdge(createEdge("a", "b"), layout, new Map(), "TD");

      expect(route).not.toBeNull();

      expect(route!.points[0]).toEqual({
        x: 70,
        y: 56,
      });

      const end = route!.points[route!.points.length - 1];

      expect(end).toEqual({
        x: 70,
        y: 200,
      });
    });

    it("routes a back edge around the left side", () => {
      const layout: DiagramLayout = {
        a: {
          x: 0,
          y: 300,
          width: 140,
          height: 56,
        },
        b: {
          x: 0,
          y: 100,
          width: 140,
          height: 56,
        },
      };

      const levels = new Map([
        ["a", 1],
        ["b", 0],
      ]);

      const route = routeEdge(createEdge("a", "b"), layout, levels, "TD");

      expect(route).not.toBeNull();

      expect(route!.points.some((point) => point.x < 0)).toBe(true);
    });

    it("arrives at a TD back edge perpendicularly", () => {
      const layout: DiagramLayout = {
        a: {
          x: 0,
          y: 300,
          width: 140,
          height: 56,
        },
        b: {
          x: 0,
          y: 100,
          width: 140,
          height: 56,
        },
      };

      const levels = new Map([
        ["a", 1],
        ["b", 0],
      ]);

      const route = routeEdge(createEdge("a", "b"), layout, levels, "TD");

      expect(route).not.toBeNull();

      const points = route!.points;

      const end = points[points.length - 1];
      const previous = points[points.length - 2];

      expect(end).toEqual({
        x: 0,
        y: 128,
      });

      // Final segment must be horizontal.
      expect(previous.y).toBe(end.y);
    });
  });

  it("returns null for missing source node", () => {
    const layout = createLayout();

    const route = routeEdge(createEdge("missing", "b"), layout, new Map(), "LR");

    expect(route).toBeNull();
  });

  it("returns null for missing target node", () => {
    const layout = createLayout();

    const route = routeEdge(createEdge("a", "missing"), layout, new Map(), "LR");

    expect(route).toBeNull();
  });

  it("handles self-loop", () => {
    const layout = createLayout();

    const route = routeEdge(createEdge("a", "a"), layout, new Map(), "LR");

    expect(route).not.toBeNull();
    expect(route!.points.length).toBeGreaterThan(2);
  });

  it("handles self-loop in TD mode", () => {
    const layout = createLayout();

    const route = routeEdge(createEdge("a", "a"), layout, new Map(), "TD");

    expect(route).not.toBeNull();
    expect(route!.points.length).toBeGreaterThan(2);
  });

  it("uses normal TD routing for a forward edge", () => {
    const layout: DiagramLayout = {
      a: {
        x: 0,
        y: 0,
        width: 140,
        height: 56,
      },
      b: {
        x: 0,
        y: 200,
        width: 140,
        height: 56,
      },
    };

    const levels = new Map([
      ["a", 0],
      ["b", 1],
    ]);

    const route = routeEdge(createEdge("a", "b"), layout, levels, "TD");

    expect(route).not.toBeNull();

    expect(route!.points[0]).toEqual({
      x: 70,
      y: 56,
    });

    expect(route!.points[route!.points.length - 1]).toEqual({
      x: 70,
      y: 200,
    });
  });
});
