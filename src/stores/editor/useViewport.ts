import { ref, type Ref } from "vue";

import type { DiagramDocument } from "@/features/diagram/types";

const INITIAL_ZOOM = 1;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

export function useViewport(document: Ref<DiagramDocument>) {
  const zoom = ref(INITIAL_ZOOM);

  const offset = ref({
    x: 0,
    y: 0,
  });

  function setZoom(value: number) {
    zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }

  function zoomIn() {
    setZoom(zoom.value + 0.1);
  }

  function zoomOut() {
    setZoom(zoom.value - 0.1);
  }

  function resetViewport() {
    zoom.value = INITIAL_ZOOM;

    offset.value = {
      x: 0,
      y: 0,
    };
  }

  function setOffset(x: number, y: number) {
    offset.value = {
      x,
      y,
    };
  }

  function updateViewport(deltaX: number, deltaY: number) {
    offset.value = {
      x: offset.value.x + deltaX,
      y: offset.value.y + deltaY,
    };
  }

  function fitToScreen(width: number, height: number, padding = 80) {
    const nodes = document.value.nodes;

    if (!nodes.length) {
      resetViewport();
      return;
    }

    const layouts = nodes.map((node) => document.value.layout[node.id]).filter(Boolean);

    if (!layouts.length) {
      resetViewport();
      return;
    }

    const minX = Math.min(...layouts.map((layout) => layout.x));

    const minY = Math.min(...layouts.map((layout) => layout.y));

    const maxX = Math.max(...layouts.map((layout) => layout.x + layout.width));

    const maxY = Math.max(...layouts.map((layout) => layout.y + layout.height));

    const contentWidth = maxX - minX;

    const contentHeight = maxY - minY;

    if (contentWidth <= 0 || contentHeight <= 0) {
      resetViewport();
      return;
    }

    const availableWidth = Math.max(width - padding * 2, 1);

    const availableHeight = Math.max(height - padding * 2, 1);

    const scaleX = availableWidth / contentWidth;

    const scaleY = availableHeight / contentHeight;

    const newZoom = Math.min(scaleX, scaleY, MAX_ZOOM);

    setZoom(Math.max(MIN_ZOOM, newZoom));

    const scaledWidth = contentWidth * zoom.value;

    const scaledHeight = contentHeight * zoom.value;

    offset.value = {
      x: (width - scaledWidth) / 2 - minX * zoom.value,

      y: (height - scaledHeight) / 2 - minY * zoom.value,
    };
  }

  return {
    zoom,
    offset,
    setZoom,
    zoomIn,
    zoomOut,
    resetViewport,
    setOffset,
    updateViewport,
    fitToScreen,
  };
}

export type Viewport = ReturnType<typeof useViewport>;
