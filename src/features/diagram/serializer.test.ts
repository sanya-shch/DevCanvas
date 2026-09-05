import { describe, expect, it } from "vitest";
import { serializeDiagram } from "./serializer";
import type { DiagramDocument } from "./types";

function createDocument(overrides: Partial<DiagramDocument> = {}): DiagramDocument {
  return {
    direction: "LR",
    nodes: [],
    edges: [],
    layout: {},
    sourceMap: {},
    ...overrides,
  };
}

describe("serializeDiagram", () => {
  it("serializes direction", () => {
    const document = createDocument({
      direction: "TD",
    });

    expect(serializeDiagram(document)).toBe("flowchart TD\n");
  });

  it("serializes a simple edge", () => {
    const document = createDocument({
      sourceMap: {
        a: "node_a",
        b: "node_b",
      },
      nodes: [
        {
          id: "node_a",
          label: "a",
        },
        {
          id: "node_b",
          label: "b",
        },
      ],
      edges: [
        {
          id: "edge_a",
          from: "node_a",
          to: "node_b",
        },
      ],
    });

    expect(serializeDiagram(document)).toBe(
      `flowchart LR

a -> b`,
    );
  });

  it("serializes node labels", () => {
    const document = createDocument({
      sourceMap: {
        browser: "node_browser",
        api: "node_api",
      },
      nodes: [
        {
          id: "node_browser",
          label: "Web Browser",
        },
        {
          id: "node_api",
          label: "API Gateway",
        },
      ],
      edges: [
        {
          id: "edge",
          from: "node_browser",
          to: "node_api",
        },
      ],
    });

    expect(serializeDiagram(document)).toBe(
      `flowchart LR

browser["Web Browser"] -> api["API Gateway"]`,
    );
  });

  it("serializes edge labels", () => {
    const document = createDocument({
      sourceMap: {
        a: "node_a",
        b: "node_b",
      },
      nodes: [
        {
          id: "node_a",
          label: "a",
        },
        {
          id: "node_b",
          label: "b",
        },
      ],
      edges: [
        {
          id: "edge",
          from: "node_a",
          to: "node_b",
          label: "HTTP request",
        },
      ],
    });

    expect(serializeDiagram(document)).toContain(`a -- "HTTP request" -> b`);
  });

  it("escapes quotes", () => {
    const document = createDocument({
      sourceMap: {
        a: "node_a",
        b: "node_b",
      },
      nodes: [
        {
          id: "node_a",
          label: 'API "Gateway"',
        },
        {
          id: "node_b",
          label: "Database",
        },
      ],
      edges: [
        {
          id: "edge",
          from: "node_a",
          to: "node_b",
        },
      ],
    });

    expect(serializeDiagram(document)).toContain(`a["API \\"Gateway\\""]`);
  });

  it("escapes backslashes", () => {
    const document = createDocument({
      sourceMap: {
        a: "node_a",
        b: "node_b",
      },
      nodes: [
        {
          id: "node_a",
          label: "C:\\Users\\Admin",
        },
        {
          id: "node_b",
          label: "B",
        },
      ],
      edges: [
        {
          id: "edge",
          from: "node_a",
          to: "node_b",
        },
      ],
    });

    expect(serializeDiagram(document)).toContain(`a["C:\\\\Users\\\\Admin"]`);
  });

  it("serializes isolated nodes", () => {
    const document = createDocument({
      sourceMap: {
        a: "node_a",
      },
      nodes: [
        {
          id: "node_a",
          label: "Browser",
        },
      ],
    });

    expect(serializeDiagram(document)).toContain(`a["Browser"]`);
  });
});
