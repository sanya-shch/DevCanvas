import type { NodeShape } from "./types";

export const DEFAULT_NODE_SHAPE: NodeShape = "rectangle";

export function normalizeNodeShape(shape: NodeShape | undefined): NodeShape {
  switch (shape) {
    case "rectangle":
    case "rounded":
    case "circle":
    case "diamond":
      return shape;

    default:
      return DEFAULT_NODE_SHAPE;
  }
}
