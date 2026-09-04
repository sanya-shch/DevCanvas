import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import DiagramCanvas from "./DiagramCanvas.vue";
import DiagramNode from "./DiagramNode.vue";
import { useEditorStore } from "@/stores/editor";

function setupStore() {
  const store = useEditorStore();

  store.setSource(`
flowchart LR

A["Browser"] -> B["API"]
B -> C["Database"]
`);

  store.parse();

  return store;
}

function mountCanvas() {
  const pinia = createPinia();

  setActivePinia(pinia);

  const store = setupStore();

  const wrapper = mount(DiagramCanvas, {
    global: {
      plugins: [pinia],
    },
  });

  return {
    store,
    wrapper,
  };
}

function getFirstNode(store: ReturnType<typeof useEditorStore>) {
  const node = store.document.nodes[0];

  if (!node) {
    throw new Error("No nodes found");
  }

  return node;
}

function getFirstNodeElement(wrapper: ReturnType<typeof mount>) {
  const nodeWrapper = wrapper.findComponent(DiagramNode);

  if (!nodeWrapper.exists()) {
    throw new Error("No DiagramNode component found");
  }

  return nodeWrapper;
}

function dispatchPointerEvent(
  element: Element,
  type: string,
  options: {
    pointerId?: number;
    button?: number;
    clientX?: number;
    clientY?: number;
  } = {},
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: options.button ?? 0,
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
  });

  Object.defineProperty(event, "pointerId", {
    value: options.pointerId ?? 1,
  });

  element.dispatchEvent(event);
}

describe("DiagramCanvas", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders diagram nodes", () => {
    const { wrapper } = mountCanvas();

    const nodes = wrapper.findAllComponents(DiagramNode);

    expect(nodes).toHaveLength(3);
  });

  it("selects a node when clicked", () => {
    const { store, wrapper } = mountCanvas();

    const node = getFirstNode(store);
    const nodeWrapper = getFirstNodeElement(wrapper);

    expect(store.selectedNodeId).toBeNull();

    dispatchPointerEvent(nodeWrapper.element, "pointerdown", {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });

    expect(store.selectedNodeId).toBe(node.id);
  });

  it("deselects the node when clicking the empty canvas", async () => {
    const { store, wrapper } = mountCanvas();

    const node = getFirstNode(store);

    store.selectNode(node.id);

    expect(store.selectedNodeId).toBe(node.id);

    const svg = wrapper.get("svg");

    await svg.trigger("click");

    expect(store.selectedNodeId).toBeNull();
  });

  it("does not deselect a node when clicking the node itself", () => {
    const { store, wrapper } = mountCanvas();

    const node = getFirstNode(store);
    const nodeWrapper = getFirstNodeElement(wrapper);

    store.selectNode(node.id);

    expect(store.selectedNodeId).toBe(node.id);

    dispatchPointerEvent(nodeWrapper.element, "pointerdown", {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });

    expect(store.selectedNodeId).toBe(node.id);
  });

  it("moves a node after dragging", async () => {
    const { store, wrapper } = mountCanvas();

    const node = getFirstNode(store);
    const nodeWrapper = getFirstNodeElement(wrapper);
    const svg = wrapper.get("svg");

    const initialLayout = store.document.layout[node.id];

    expect(initialLayout).toBeDefined();

    const initialX = initialLayout.x;
    const initialY = initialLayout.y;

    dispatchPointerEvent(nodeWrapper.element, "pointerdown", {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });

    dispatchPointerEvent(svg.element, "pointermove", {
      pointerId: 1,
      clientX: 150,
      clientY: 130,
    });

    dispatchPointerEvent(svg.element, "pointerup", {
      pointerId: 1,
      clientX: 150,
      clientY: 130,
    });

    await wrapper.vm.$nextTick();

    const updatedLayout = store.document.layout[node.id];

    expect(updatedLayout.x).not.toBe(initialX);
    expect(updatedLayout.y).not.toBe(initialY);
  });

  it("does not start a drag below the drag threshold", async () => {
    const { store, wrapper } = mountCanvas();

    const node = getFirstNode(store);
    const nodeWrapper = getFirstNodeElement(wrapper);
    const svg = wrapper.get("svg");

    const initialLayout = store.document.layout[node.id];

    expect(initialLayout).toBeDefined();

    const initialX = initialLayout.x;
    const initialY = initialLayout.y;

    dispatchPointerEvent(nodeWrapper.element, "pointerdown", {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });

    dispatchPointerEvent(svg.element, "pointermove", {
      pointerId: 1,
      clientX: 102,
      clientY: 102,
    });

    dispatchPointerEvent(svg.element, "pointerup", {
      pointerId: 1,
      clientX: 102,
      clientY: 102,
    });

    await wrapper.vm.$nextTick();

    const updatedLayout = store.document.layout[node.id];

    expect(updatedLayout.x).toBe(initialX);
    expect(updatedLayout.y).toBe(initialY);
  });

  it("creates one history entry for a drag", async () => {
    const { store, wrapper } = mountCanvas();

    const nodeWrapper = getFirstNodeElement(wrapper);
    const svg = wrapper.get("svg");

    expect(store.canUndo).toBe(false);

    dispatchPointerEvent(nodeWrapper.element, "pointerdown", {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });

    dispatchPointerEvent(svg.element, "pointermove", {
      pointerId: 1,
      clientX: 150,
      clientY: 130,
    });

    dispatchPointerEvent(svg.element, "pointermove", {
      pointerId: 1,
      clientX: 180,
      clientY: 160,
    });

    dispatchPointerEvent(svg.element, "pointermove", {
      pointerId: 1,
      clientX: 200,
      clientY: 180,
    });

    dispatchPointerEvent(svg.element, "pointerup", {
      pointerId: 1,
      clientX: 200,
      clientY: 180,
    });

    await wrapper.vm.$nextTick();

    expect(store.canUndo).toBe(true);

    store.undo();

    expect(store.canUndo).toBe(false);
  });

  it("keeps source unchanged after dragging a node", async () => {
    const { store, wrapper } = mountCanvas();

    const sourceBeforeDrag = store.source;

    const nodeWrapper = getFirstNodeElement(wrapper);
    const svg = wrapper.get("svg");

    dispatchPointerEvent(nodeWrapper.element, "pointerdown", {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });

    dispatchPointerEvent(svg.element, "pointermove", {
      pointerId: 1,
      clientX: 150,
      clientY: 130,
    });

    dispatchPointerEvent(svg.element, "pointerup", {
      pointerId: 1,
      clientX: 150,
      clientY: 130,
    });

    await wrapper.vm.$nextTick();

    expect(store.source).toBe(sourceBeforeDrag);
  });

  it("pans the canvas when dragging the empty area", async () => {
    const { store, wrapper } = mountCanvas();

    const svg = wrapper.get("svg");

    const initialX = store.offset.x;
    const initialY = store.offset.y;

    dispatchPointerEvent(svg.element, "pointerdown", {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });

    dispatchPointerEvent(svg.element, "pointermove", {
      pointerId: 1,
      clientX: 150,
      clientY: 130,
    });

    dispatchPointerEvent(svg.element, "pointerup", {
      pointerId: 1,
      clientX: 150,
      clientY: 130,
    });

    await wrapper.vm.$nextTick();

    expect(store.offset.x).not.toBe(initialX);
    expect(store.offset.y).not.toBe(initialY);
  });

  it("does not pan when starting on a node", async () => {
    const { store, wrapper } = mountCanvas();

    const nodeWrapper = getFirstNodeElement(wrapper);
    const svg = wrapper.get("svg");

    const initialX = store.offset.x;
    const initialY = store.offset.y;

    dispatchPointerEvent(nodeWrapper.element, "pointerdown", {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });

    dispatchPointerEvent(svg.element, "pointermove", {
      pointerId: 1,
      clientX: 150,
      clientY: 130,
    });

    dispatchPointerEvent(svg.element, "pointerup", {
      pointerId: 1,
      clientX: 150,
      clientY: 130,
    });

    await wrapper.vm.$nextTick();

    expect(store.offset.x).toBe(initialX);
    expect(store.offset.y).toBe(initialY);
  });

  it("zooms in when clicking the zoom in button", async () => {
    const { store, wrapper } = mountCanvas();

    const zoomInButton = wrapper.get('button[title="Zoom in"]');

    const initialZoom = store.zoom;

    await zoomInButton.trigger("click");

    expect(store.zoom).toBeGreaterThan(initialZoom);
  });
});
