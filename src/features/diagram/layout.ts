import type { DiagramDirection, DiagramEdge, DiagramLayout, DiagramNode } from "./types";

import { calculateNodeSize } from "./nodeSizing";

const HORIZONTAL_GAP = 100;
const VERTICAL_GAP = 100;

const START_X = 100;
const START_Y = 100;

export function calculateLevels(nodes: DiagramNode[], edges: DiagramEdge[]): Map<string, number> {
  const levels = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) {
    outgoing.set(node.id, []);
  }

  for (const edge of edges) {
    const targets = outgoing.get(edge.from);

    if (!targets) {
      continue;
    }

    targets.push(edge.to);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(nodeId: string, level: number) {
    const currentLevel = levels.get(nodeId);

    if (currentLevel === undefined || level > currentLevel) {
      levels.set(nodeId, level);
    }

    if (visiting.has(nodeId)) {
      return;
    }

    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);

    for (const targetId of outgoing.get(nodeId) ?? []) {
      if (visiting.has(targetId)) {
        continue;
      }

      visit(targetId, level + 1);
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      visit(node.id, 0);
    }
  }

  return levels;
}

function findNextAvailableOffset(
  occupied: Array<{
    start: number;
    end: number;
  }>,
  size: number,
  gap: number,
): number {
  if (occupied.length === 0) {
    return 0;
  }

  const sorted = [...occupied].sort((a, b) => a.start - b.start);

  let offset = 0;

  for (const item of sorted) {
    if (offset + size <= item.start - gap) {
      return offset;
    }

    offset = Math.max(offset, item.end + gap);
  }

  return offset;
}

interface LevelSize {
  width: number;
  height: number;
}

export function createNodeLayout(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  direction: DiagramDirection,
  previousLayout: DiagramLayout,
  preservePositions: boolean,
): DiagramLayout {
  const levels = calculateLevels(nodes, edges);

  const nodeSizes = new Map<string, { width: number; height: number }>();

  for (const node of nodes) {
    nodeSizes.set(node.id, calculateNodeSize(node.label));
  }

  const nodesByLevel = new Map<number, DiagramNode[]>();

  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;

    const levelNodes = nodesByLevel.get(level) ?? [];

    levelNodes.push(node);

    nodesByLevel.set(level, levelNodes);
  }

  const levelSizes = new Map<number, LevelSize>();

  for (const [level, levelNodes] of nodesByLevel) {
    let width = 0;
    let height = 0;

    for (const node of levelNodes) {
      const size = nodeSizes.get(node.id);

      if (!size) {
        continue;
      }

      width = Math.max(width, size.width);

      height = Math.max(height, size.height);
    }

    levelSizes.set(level, {
      width,
      height,
    });
  }

  const layout: DiagramLayout = {};

  const maxLevel = Math.max(...nodesByLevel.keys(), 0);

  let primaryOffset = direction === "LR" ? START_X : START_Y;

  for (let level = 0; level <= maxLevel; level += 1) {
    const levelNodes = nodesByLevel.get(level) ?? [];

    if (levelNodes.length === 0) {
      continue;
    }

    const levelSize = levelSizes.get(level);

    if (!levelSize) {
      continue;
    }

    const occupied: Array<{
      start: number;
      end: number;
    }> = [];

    for (const node of levelNodes) {
      const size = nodeSizes.get(node.id);

      if (!size) {
        continue;
      }

      const previous = previousLayout[node.id];

      if (preservePositions && previous) {
        layout[node.id] = {
          ...previous,
          width: size.width,
          height: size.height,
        };

        const crossStart = direction === "LR" ? previous.y : previous.x;

        const crossSize = direction === "LR" ? previous.height : previous.width;

        occupied.push({
          start: crossStart,
          end: crossStart + crossSize,
        });
      }
    }

    for (const node of levelNodes) {
      if (layout[node.id]) {
        continue;
      }

      const size = nodeSizes.get(node.id);

      if (!size) {
        continue;
      }

      const crossSize = direction === "LR" ? size.height : size.width;

      const crossOffset = findNextAvailableOffset(
        occupied,
        crossSize,
        direction === "LR" ? VERTICAL_GAP : HORIZONTAL_GAP,
      );

      const position =
        direction === "LR"
          ? {
              x: primaryOffset,
              y: START_Y + crossOffset,
            }
          : {
              x: START_X + crossOffset,
              y: primaryOffset,
            };

      layout[node.id] = {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      };

      occupied.push({
        start: direction === "LR" ? position.y : position.x,
        end: direction === "LR" ? position.y + size.height : position.x + size.width,
      });
    }

    primaryOffset +=
      direction === "LR" ? levelSize.width + HORIZONTAL_GAP : levelSize.height + VERTICAL_GAP;
  }

  return layout;
}
