import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import DiagramNodeComponent from "./DiagramNode.vue";
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

function mountNode(nodeIndex: number, options: { selected?: boolean; readonly?: boolean } = {}) {
  const store = setupStore();

  const node = store.document.nodes[nodeIndex];

  if (!node) {
    throw new Error(`Test setup error: node at index ${nodeIndex} not found`);
  }

  const wrapper = mount(DiagramNodeComponent, {
    props: {
      node,
      layout: store.document.layout[node.id],
      selected: options.selected ?? false,
      readonly: options.readonly ?? false,
    },
  });

  return {
    store,
    wrapper,
    nodeId: node.id,
  };
}

function dispatchKeyDown(element: Element, key: string, options: { shiftKey?: boolean } = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    shiftKey: options.shiftKey ?? false,
  });

  element.dispatchEvent(event);

  return event;
}

describe("DiagramNode keyboard accessibility", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("is keyboard-focusable and exposes an accessible label", () => {
    const { wrapper } = mountNode(0);

    const group = wrapper.get("g");

    expect(group.attributes("tabindex")).toBe("0");
    expect(group.attributes("role")).toBe("button");
    expect(group.attributes("aria-label")).toContain("Browser");
  });

  it("emits select on Enter", () => {
    const { wrapper, nodeId } = mountNode(0);

    dispatchKeyDown(wrapper.get("g").element, "Enter");

    expect(wrapper.emitted("select")).toEqual([[nodeId]]);
  });

  it("emits select on Space", () => {
    const { wrapper, nodeId } = mountNode(0);

    dispatchKeyDown(wrapper.get("g").element, " ");

    expect(wrapper.emitted("select")).toEqual([[nodeId]]);
  });

  it("nudges the node by 1px per arrow key when selected", () => {
    const { store, wrapper, nodeId } = mountNode(0, { selected: true });

    const initialLayout = store.document.layout[nodeId];

    dispatchKeyDown(wrapper.get("g").element, "ArrowRight");

    expect(store.document.layout[nodeId].x).toBe(initialLayout.x + 1);
    expect(store.document.layout[nodeId].y).toBe(initialLayout.y);
  });

  it("nudges the node by 10px per arrow key when holding Shift", () => {
    const { store, wrapper, nodeId } = mountNode(0, { selected: true });

    const initialLayout = store.document.layout[nodeId];

    dispatchKeyDown(wrapper.get("g").element, "ArrowDown", { shiftKey: true });

    expect(store.document.layout[nodeId].y).toBe(initialLayout.y + 10);
  });

  it("does not nudge an unselected node", () => {
    const { store, wrapper, nodeId } = mountNode(0, { selected: false });

    const initialLayout = store.document.layout[nodeId];

    dispatchKeyDown(wrapper.get("g").element, "ArrowRight");

    expect(store.document.layout[nodeId].x).toBe(initialLayout.x);
  });

  it("registers each nudge as its own undo step", () => {
    const { store, wrapper, nodeId } = mountNode(0, { selected: true });

    dispatchKeyDown(wrapper.get("g").element, "ArrowRight");
    dispatchKeyDown(wrapper.get("g").element, "ArrowRight");

    const afterTwoNudges = store.document.layout[nodeId].x;

    store.undo();

    expect(store.document.layout[nodeId].x).toBe(afterTwoNudges - 1);
  });

  it("is not focusable and does not react to keyboard input in readonly mode", () => {
    const { store, wrapper, nodeId } = mountNode(0, { selected: true, readonly: true });

    const group = wrapper.get("g");

    expect(group.attributes("tabindex")).toBeUndefined();
    expect(group.attributes("role")).toBeUndefined();

    const initialLayout = store.document.layout[nodeId];

    dispatchKeyDown(group.element, "ArrowRight");
    dispatchKeyDown(group.element, "Enter");

    expect(store.document.layout[nodeId].x).toBe(initialLayout.x);
    expect(wrapper.emitted("select")).toBeUndefined();
  });
});
