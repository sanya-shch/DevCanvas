import { describe, expect, it } from "vitest";

import type { DiagramDocument } from "@/features/diagram/types";

import { decodeSharePayload, encodeSharePayload } from "./shareCodec";

function createDocument(): DiagramDocument {
  return {
    direction: "LR",

    nodes: [
      {
        id: "node-a",
        label: "Start",
        shape: "rounded",
      },
      {
        id: "node-b",
        label: "Database",
        shape: "circle",
      },
    ],

    edges: [
      {
        id: "edge-a-b",
        from: "node-a",
        to: "node-b",
        label: "connects",
      },
    ],

    layout: {
      "node-a": {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      },

      "node-b": {
        x: 200,
        y: 0,
        width: 120,
        height: 120,
      },
    },

    sourceMap: {
      A: "node-a",
      B: "node-b",
    },
  };
}

describe("shareCodec", () => {
  it("round-trips a diagram document", () => {
    const document = createDocument();

    const encoded = encodeSharePayload(document);

    const decoded = decodeSharePayload(encoded);

    expect(decoded).toEqual(document);
  });

  it("supports unicode labels", () => {
    const document = createDocument();

    document.nodes[0].label = "Привіт 🌍";

    const encoded = encodeSharePayload(document);

    const decoded = decodeSharePayload(encoded);

    expect(decoded.nodes[0].label).toBe("Привіт 🌍");
  });

  it("produces a URL-safe payload", () => {
    const encoded = encodeSharePayload(createDocument());

    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("rejects corrupted payload", () => {
    expect(() => decodeSharePayload("not-valid-data")).toThrow();
  });

  it("rejects unsupported versions", () => {
    const payload = {
      v: 999,
      document: createDocument(),
    };

    const json = JSON.stringify(payload);

    const bytes = new TextEncoder().encode(json);

    let binary = "";

    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

    expect(() => decodeSharePayload(encoded)).toThrow("Unsupported share version");
  });

  it("rejects invalid documents", () => {
    const payload = {
      v: 1,
      document: {
        direction: "LR",
        nodes: [
          {
            id: "node-a",
            label: "Start",
            shape: "invalid",
          },
        ],
        edges: [],
        layout: {},
        sourceMap: {},
      },
    };

    const json = JSON.stringify(payload);

    const bytes = new TextEncoder().encode(json);

    let binary = "";

    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

    expect(() => decodeSharePayload(encoded)).toThrow("Invalid diagram document");
  });
});
