import { describe, expect, it } from "vitest";
import { parseDiagram } from "./parser";
import { serializeDiagram } from "./serializer";

describe("diagram roundtrip", () => {
  it("keeps semantic information after parse → serialize → parse", () => {
    const source = `
      flowchart LR

      Browser["Web Browser"] -> API["API Gateway"]
      API -- "HTTP request" -> Database["PostgreSQL"]
    `;

    const first = parseDiagram(source);

    expect(first.errors).toEqual([]);

    const serialized = serializeDiagram(first.document);

    const second = parseDiagram(serialized);

    expect(second.errors).toEqual([]);

    expect(second.document.direction).toBe(first.document.direction);

    expect(
      second.document.nodes.map((node) => ({
        label: node.label,
        sourceId: Object.entries(second.document.sourceMap).find(
          ([, internalId]) => internalId === node.id,
        )?.[0],
      })),
    ).toEqual(
      first.document.nodes.map((node) => ({
        label: node.label,
        sourceId: Object.entries(first.document.sourceMap).find(
          ([, internalId]) => internalId === node.id,
        )?.[0],
      })),
    );

    expect(
      second.document.edges.map((edge) => ({
        from: Object.entries(second.document.sourceMap).find(
          ([, internalId]) => internalId === edge.from,
        )?.[0],
        to: Object.entries(second.document.sourceMap).find(
          ([, internalId]) => internalId === edge.to,
        )?.[0],
        label: edge.label,
      })),
    ).toEqual(
      first.document.edges.map((edge) => ({
        from: Object.entries(first.document.sourceMap).find(
          ([, internalId]) => internalId === edge.from,
        )?.[0],
        to: Object.entries(first.document.sourceMap).find(
          ([, internalId]) => internalId === edge.to,
        )?.[0],
        label: edge.label,
      })),
    );
  });
});
