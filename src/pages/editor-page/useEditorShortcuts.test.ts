import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useEditorShortcuts } from "./useEditorShortcuts";
import { useEditorStore } from "@/stores/editor";

function setupStore() {
  const store = useEditorStore();

  store.setSource(`
flowchart LR

A["Browser"] -> B["API"]
`);

  store.parse();

  return store;
}

function mountShortcuts(cancelScheduledParse = vi.fn()) {
  const store = setupStore();

  let shortcuts!: ReturnType<typeof useEditorShortcuts>;

  const Host = defineComponent({
    setup() {
      shortcuts = useEditorShortcuts(store, { cancelScheduledParse });

      return () => h("div");
    },
  });

  const wrapper = mount(Host);

  return {
    store,
    wrapper,
    shortcuts,
  };
}

function dispatchWindowKeyDown(
  key: string,
  options: { metaKey?: boolean; shiftKey?: boolean } = {},
) {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      metaKey: options.metaKey ?? false,
      shiftKey: options.shiftKey ?? false,
    }),
  );
}

describe("useEditorShortcuts", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("deletes the selected node on Delete", () => {
    const { store } = mountShortcuts();

    const nodeId = store.document.nodes[0].id;

    store.selectNode(nodeId);

    dispatchWindowKeyDown("Delete");

    expect(store.document.nodes.some((node) => node.id === nodeId)).toBe(false);
  });

  it("deletes the selected node on Backspace", () => {
    const { store } = mountShortcuts();

    const nodeId = store.document.nodes[0].id;

    store.selectNode(nodeId);

    dispatchWindowKeyDown("Backspace");

    expect(store.document.nodes.some((node) => node.id === nodeId)).toBe(false);
  });

  it("does nothing on Delete when no node is selected", () => {
    const { store } = mountShortcuts();

    const nodeCountBefore = store.document.nodes.length;

    dispatchWindowKeyDown("Delete");

    expect(store.document.nodes.length).toBe(nodeCountBefore);
  });

  it("opens the shortcuts help overlay on ?", () => {
    const { shortcuts } = mountShortcuts();

    expect(shortcuts.isHelpOpen.value).toBe(false);

    dispatchWindowKeyDown("?");

    expect(shortcuts.isHelpOpen.value).toBe(true);
  });

  it("closes the help overlay on Escape instead of deselecting the node underneath", () => {
    const { store, shortcuts } = mountShortcuts();

    const nodeId = store.document.nodes[0].id;

    store.selectNode(nodeId);
    shortcuts.openHelp();

    dispatchWindowKeyDown("Escape");

    expect(shortcuts.isHelpOpen.value).toBe(false);
    expect(store.selectedNodeId).toBe(nodeId);
  });

  it("deselects the node on Escape when the help overlay is closed", () => {
    const { store } = mountShortcuts();

    const nodeId = store.document.nodes[0].id;

    store.selectNode(nodeId);

    dispatchWindowKeyDown("Escape");

    expect(store.selectedNodeId).toBeNull();
  });

  it("ignores shortcuts while typing in an editable element", () => {
    const { store } = mountShortcuts();

    const nodeId = store.document.nodes[0].id;

    store.selectNode(nodeId);

    const input = document.createElement("input");

    document.body.appendChild(input);
    input.focus();

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Delete",
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(store.document.nodes.some((node) => node.id === nodeId)).toBe(true);

    document.body.removeChild(input);
  });
});
