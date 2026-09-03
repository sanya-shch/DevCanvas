import type { DiagramDocument } from "./types";

export interface DiagramBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function calculateBounds(document: DiagramDocument): DiagramBounds {
  if (!document.nodes.length) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
    };
  }

  const minX = Math.min(...document.nodes.map((node) => node.x));
  const minY = Math.min(...document.nodes.map((node) => node.y));

  const maxX = Math.max(...document.nodes.map((node) => node.x + node.width));

  const maxY = Math.max(...document.nodes.map((node) => node.y + node.height));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
