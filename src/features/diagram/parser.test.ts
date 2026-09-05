import { describe, expect, it } from "vitest";
import { parseDiagram } from "./parser";

describe("parseDiagram", () => {
  it("parses flowchart direction", () => {
    const result = parseDiagram(`
      flowchart LR
      A["Browser"] -> B["API"]
    `);

    expect(result.errors).toEqual([]);
    expect(result.document.direction).toBe("LR");
  });

  it("parses TD direction", () => {
    const result = parseDiagram(`
      flowchart TD
      A -> B
    `);

    expect(result.errors).toEqual([]);
    expect(result.document.direction).toBe("TD");
  });

  it("ignores empty lines", () => {
    const result = parseDiagram(`
      flowchart LR

      A -> B

      
      B -> C
    `);

    expect(result.errors).toEqual([]);
    expect(result.document.edges).toHaveLength(2);
    expect(result.document.nodes).toHaveLength(3);
  });

  it("ignores comments", () => {
    const result = parseDiagram(`
      flowchart LR

      // Browser to API
      A -> B

      // API to DB
      B -> C
    `);

    expect(result.errors).toEqual([]);
    expect(result.document.edges).toHaveLength(2);
  });

  it("parses a simple edge", () => {
    const result = parseDiagram(`
      flowchart LR
      A -> B
    `);

    expect(result.errors).toEqual([]);

    expect(result.document.nodes).toHaveLength(2);
    expect(result.document.edges).toHaveLength(1);

    const [edge] = result.document.edges;

    expect(edge.from).toBe(result.document.sourceMap.A);

    expect(edge.to).toBe(result.document.sourceMap.B);

    expect(edge.label).toBeUndefined();
  });

  it("parses node labels", () => {
    const result = parseDiagram(`
      flowchart LR
      Browser["Web Browser"] -> API["API Gateway"]
    `);

    expect(result.errors).toEqual([]);

    const browserId = result.document.sourceMap.Browser;
    const apiId = result.document.sourceMap.API;

    const browser = result.document.nodes.find((node) => node.id === browserId);

    const api = result.document.nodes.find((node) => node.id === apiId);

    expect(browser?.label).toBe("Web Browser");
    expect(api?.label).toBe("API Gateway");
  });

  it("supports unquoted labels", () => {
    const result = parseDiagram(`
      flowchart LR
      Browser[Web Browser] -> API[API Gateway]
    `);

    expect(result.errors).toEqual([]);

    const browser = result.document.nodes.find(
      (node) => node.id === result.document.sourceMap.Browser,
    );

    expect(browser?.label).toBe("Web Browser");
  });

  it("supports curly-brace labels", () => {
    const result = parseDiagram(`
      flowchart LR
      A{'Decision'} -> B
    `);

    expect(result.errors).toEqual([]);

    const node = result.document.nodes.find((item) => item.id === result.document.sourceMap.A);

    expect(node?.label).toBe("Decision");
  });

  it("supports parentheses labels", () => {
    const result = parseDiagram(`
      flowchart LR
      A("Browser") -> B
    `);

    expect(result.errors).toEqual([]);

    const node = result.document.nodes.find((item) => item.id === result.document.sourceMap.A);

    expect(node?.label).toBe("Browser");
  });

  it("supports edge labels", () => {
    const result = parseDiagram(`
      flowchart LR
      A -- request -> B
    `);

    expect(result.errors).toEqual([]);

    const [edge] = result.document.edges;

    expect(edge.label).toBe("request");
  });

  it("supports quoted edge labels", () => {
    const result = parseDiagram(`
      flowchart LR
      A -- "HTTP request" -> B
    `);

    expect(result.errors).toEqual([]);

    expect(result.document.edges[0].label).toBe("HTTP request");
  });

  it("supports apostrophe-quoted edge labels", () => {
    const result = parseDiagram(`
      flowchart LR
      A -- 'HTTP request' -> B
    `);

    expect(result.errors).toEqual([]);

    expect(result.document.edges[0].label).toBe("HTTP request");
  });

  it("preserves escaped quotes", () => {
    const result = parseDiagram(`
      flowchart LR
      A["API \\"Gateway\\""] -> B
    `);

    expect(result.errors).toEqual([]);

    const node = result.document.nodes.find((item) => item.id === result.document.sourceMap.A);

    expect(node?.label).toBe('API "Gateway"');
  });

  it("preserves escaped apostrophes", () => {
    const result = parseDiagram(`
      flowchart LR
      A['User\\'s Browser'] -> B
    `);

    expect(result.errors).toEqual([]);

    const node = result.document.nodes.find((item) => item.id === result.document.sourceMap.A);

    expect(node?.label).toBe("User's Browser");
  });

  it("reuses the same internal node id", () => {
    const result = parseDiagram(`
      flowchart LR
      A -> B
      B -> C
      A -> C
    `);

    expect(result.errors).toEqual([]);

    expect(result.document.sourceMap.A).toBeDefined();

    expect(result.document.sourceMap.B).toBeDefined();

    expect(result.document.sourceMap.C).toBeDefined();

    expect(result.document.nodes).toHaveLength(3);

    expect(new Set(Object.values(result.document.sourceMap)).size).toBe(3);
  });

  it("does not create duplicate nodes", () => {
    const result = parseDiagram(`
      flowchart LR
      A["Browser"] -> B
      A -> C
    `);

    expect(result.errors).toEqual([]);
    expect(result.document.nodes).toHaveLength(3);
  });

  it("reports conflicting labels for the same source id", () => {
    const result = parseDiagram(`
      flowchart LR
      A["Browser"] -> B
      A["Different Browser"] -> C
    `);

    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("ignores duplicate edges", () => {
    const result = parseDiagram(`
      flowchart LR
      A -> B
      A -> B
    `);

    expect(result.errors).toEqual([]);
    expect(result.document.edges).toHaveLength(1);
  });

  it("allows differently labeled edges between the same nodes", () => {
    const result = parseDiagram(`
      flowchart LR
      A -- request -> B
      A -- response -> B
    `);

    expect(result.errors).toEqual([]);
    expect(result.document.edges).toHaveLength(2);
  });

  it("reports invalid direction", () => {
    const result = parseDiagram(`
      flowchart XY
      A -> B
    `);

    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("reports malformed edge", () => {
    const result = parseDiagram(`
      flowchart LR
      A B C
    `);

    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("uses rectangle as the default node shape", () => {
    const result = parseDiagram(`
    flowchart LR
    A["Start"] -> B["End"]
  `);

    expect(result.errors).toHaveLength(0);

    expect(result.document.nodes.every((node) => node.shape === "rectangle")).toBe(true);
  });

  it("preserves node shape when reparsing", () => {
    const first = parseDiagram(`
    flowchart LR
    A["Start"] -> B["End"]
  `);

    expect(first.errors).toHaveLength(0);

    const startNode = first.document.nodes.find((node) => first.document.sourceMap.A === node.id);

    expect(startNode).toBeDefined();

    if (!startNode) {
      return;
    }

    startNode.shape = "circle";

    const second = parseDiagram(
      `
      flowchart LR
      A["Updated Start"] -> B["End"]
    `,
      first.document,
    );

    expect(second.errors).toHaveLength(0);

    const updatedNode = second.document.nodes.find((node) => node.id === startNode.id);

    expect(updatedNode?.shape).toBe("circle");
  });
});
