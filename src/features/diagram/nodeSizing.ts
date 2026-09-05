import type { NodeShape } from "./types";

const MIN_NODE_WIDTH = 140;
const MAX_NODE_WIDTH = 360;

const MIN_NODE_HEIGHT = 56;

const HORIZONTAL_PADDING = 32;
const VERTICAL_PADDING = 24;

const CHAR_WIDTH = 8;
const LINE_HEIGHT = 20;

const MIN_CHARS_PER_LINE = 8;

export interface NodeSize {
  width: number;
  height: number;
}

export function wrapNodeLabel(label: string, width: number): string[] {
  const maxChars = Math.max(
    MIN_CHARS_PER_LINE,
    Math.floor((width - HORIZONTAL_PADDING) / CHAR_WIDTH),
  );

  const paragraphs = label.split(/\r?\n/);

  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if (!words.length) {
      lines.push("");
      continue;
    }

    let current = "";

    for (const word of words) {
      /*
       * A single very long word cannot be wrapped by
       * whitespace, so split it manually.
       */
      if (word.length > maxChars) {
        if (current) {
          lines.push(current);
          current = "";
        }

        for (let index = 0; index < word.length; index += maxChars) {
          lines.push(word.slice(index, index + maxChars));
        }

        continue;
      }

      const next = current.length === 0 ? word : `${current} ${word}`;

      if (next.length <= maxChars) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length ? lines : [""];
}

/**
 * Calculates the automatic node dimensions from its label.
 */
export function calculateNodeSize(label: string, shape: NodeShape = "rectangle"): NodeSize {
  const normalizedLabel = label.trim() || "Node";

  const longestLine = normalizedLabel
    .split(/\r?\n/)
    .reduce((max, line) => Math.max(max, line.length), 0);

  const naturalWidth = longestLine * CHAR_WIDTH + HORIZONTAL_PADDING;

  const width = Math.min(MAX_NODE_WIDTH, Math.max(MIN_NODE_WIDTH, naturalWidth));

  const lines = wrapNodeLabel(normalizedLabel, width);

  const height = Math.max(MIN_NODE_HEIGHT, lines.length * LINE_HEIGHT + VERTICAL_PADDING);

  if (shape === "circle") {
    const dimension = Math.max(width, height);

    return {
      width: dimension,
      height: dimension,
    };
  }

  return {
    width,
    height,
  };
}
