import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";

import DiagramsPage from "./DiagramsPage.vue";

import type { SavedDiagram } from "@/features/diagrams/types";

const { deleteDiagram, getAllDiagrams, getDiagram, saveDiagram } = vi.hoisted(() => ({
  deleteDiagram: vi.fn(),
  getAllDiagrams: vi.fn(),
  getDiagram: vi.fn(),
  saveDiagram: vi.fn(),
}));

vi.mock("@/features/diagrams/diagramRepository", () => ({
  deleteDiagram,
  getAllDiagrams,
  getDiagram,
  saveDiagram,
}));

function createDiagram(overrides: Partial<SavedDiagram> = {}): SavedDiagram {
  return {
    id: "diagram-1",
    title: "Test diagram",
    source: "flowchart LR\nA -> B",
    direction: "LR",
    nodes: [],
    sourceMap: {},
    layout: {},
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

async function mountPage() {
  const pinia = createPinia();

  setActivePinia(pinia);

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/diagrams", component: DiagramsPage },
      { path: "/editor", component: { template: "<div />" } },
    ],
  });

  await router.push("/diagrams");
  await router.isReady();

  const wrapper = mount(DiagramsPage, {
    global: { plugins: [pinia, router] },
  });

  await flushPromises();

  return wrapper;
}

describe("DiagramsPage", () => {
  beforeEach(() => {
    getAllDiagrams.mockReset().mockResolvedValue([createDiagram()]);
    deleteDiagram.mockReset().mockResolvedValue(undefined);

    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("removes a diagram from the list on successful delete", async () => {
    const wrapper = await mountPage();

    expect(wrapper.text()).toContain("Test diagram");

    await wrapper.find(".diagram-card__delete").trigger("click");
    await flushPromises();

    expect(deleteDiagram).toHaveBeenCalledWith("diagram-1");
    expect(wrapper.text()).not.toContain("Test diagram");
    expect(wrapper.find(".diagrams-banner--error").exists()).toBe(false);
  });

  it("shows a dismissible error banner without wiping the list when delete fails", async () => {
    deleteDiagram.mockRejectedValue(new DOMException("full", "QuotaExceededError"));

    const wrapper = await mountPage();

    await wrapper.find(".diagram-card__delete").trigger("click");
    await flushPromises();

    const banner = wrapper.find(".diagrams-banner--error");

    expect(banner.exists()).toBe(true);
    expect(banner.text()).toMatch(/enough storage space/i);
    expect(wrapper.text()).toContain("Test diagram");

    await banner.find(".diagrams-banner__dismiss").trigger("click");

    expect(wrapper.find(".diagrams-banner--error").exists()).toBe(false);
  });

  it("does not delete when the confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const wrapper = await mountPage();

    await wrapper.find(".diagram-card__delete").trigger("click");
    await flushPromises();

    expect(deleteDiagram).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Test diagram");
  });
});
