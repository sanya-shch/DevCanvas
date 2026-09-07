import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";

import EmbedPage from "./EmbedPage.vue";
import DiagramCanvas from "@/components/canvas/DiagramCanvas.vue";
import { useEditorStore } from "@/stores/editor";

async function mountEmbed(query: string) {
  const pinia = createPinia();

  setActivePinia(pinia);

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/embed",
        component: EmbedPage,
      },
    ],
  });

  await router.push(`/embed${query}`);
  await router.isReady();

  const wrapper = mount(EmbedPage, {
    global: {
      plugins: [pinia, router],
    },
  });

  await flushPromises();

  return {
    wrapper,
    store: useEditorStore(),
  };
}

describe("EmbedPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("parses and renders a diagram passed via ?source=", async () => {
    const source = encodeURIComponent('flowchart LR\nA["Start"] -> B["End"]');

    const { store } = await mountEmbed(`?source=${source}`);

    expect(store.document.nodes).toHaveLength(2);
    expect(store.hasErrors).toBe(false);
  });

  it("renders the diagram canvas in readonly mode", async () => {
    const source = encodeURIComponent("flowchart LR\nA -> B");

    const { wrapper } = await mountEmbed(`?source=${source}`);

    const canvas = wrapper.findComponent(DiagramCanvas);

    expect(canvas.exists()).toBe(true);
    expect(canvas.props("readonly")).toBe(true);
  });

  it("renders an empty canvas when no source or shared document is given", async () => {
    const { store } = await mountEmbed("");

    expect(store.document.nodes).toHaveLength(0);
  });

  it("applies the theme from ?theme= without persisting it", async () => {
    localStorage.removeItem("devcanvas-theme");

    await mountEmbed("?source=flowchart+LR&theme=light");

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("devcanvas-theme")).toBeNull();
  });
});
