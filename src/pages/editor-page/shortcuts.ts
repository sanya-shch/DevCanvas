export interface ShortcutDescriptor {
  id: string;
  keys: string;
  description: string;
}

export const EDITOR_SHORTCUTS: ShortcutDescriptor[] = [
  {
    id: "undo",
    keys: "Cmd/Ctrl + Z",
    description: "Undo the last change",
  },
  {
    id: "redo",
    keys: "Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y",
    description: "Redo the last undone change",
  },
  {
    id: "delete-node",
    keys: "Delete or Backspace",
    description: "Delete the selected node",
  },
  {
    id: "nudge-node",
    keys: "Arrow keys (Shift for larger steps)",
    description: "Move the selected (focused) node",
  },
  {
    id: "deselect",
    keys: "Escape",
    description: "Deselect the current node",
  },
  {
    id: "parse",
    keys: "Cmd/Ctrl + Enter",
    description: "Parse the diagram now",
  },
  {
    id: "reset-view",
    keys: "Cmd/Ctrl + 0",
    description: "Reset zoom and pan",
  },
  {
    id: "help",
    keys: "?",
    description: "Show this shortcuts overlay",
  },
];
