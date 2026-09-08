import { expect, test } from "@playwright/test";

test.describe("Keyboard shortcuts", () => {
  test("Delete removes the selected node", async ({ page }) => {
    await page.goto("/editor");

    await expect(page.locator(".diagram-node")).toHaveCount(2);

    await page.locator(".diagram-node").first().click();
    await page.keyboard.press("Delete");

    await expect(page.locator(".diagram-node")).toHaveCount(1);
  });

  test("Backspace also removes the selected node", async ({ page }) => {
    await page.goto("/editor");

    await page.locator(".diagram-node").first().click();
    await page.keyboard.press("Backspace");

    await expect(page.locator(".diagram-node")).toHaveCount(1);
  });

  test("Delete with nothing selected does nothing", async ({ page }) => {
    await page.goto("/editor");

    await page.locator(".diagram-canvas").click({ position: { x: 10, y: 10 } });
    await page.keyboard.press("Delete");

    await expect(page.locator(".diagram-node")).toHaveCount(2);
  });

  test("Cmd/Ctrl+Z undoes a node deletion", async ({ page }) => {
    await page.goto("/editor");

    await page.locator(".diagram-node").first().click();
    await page.keyboard.press("Delete");

    await expect(page.locator(".diagram-node")).toHaveCount(1);

    await page.keyboard.press("ControlOrMeta+Z");

    await expect(page.locator(".diagram-node")).toHaveCount(2);
  });

  test("Cmd/Ctrl+Shift+Z redoes the undone change", async ({ page }) => {
    await page.goto("/editor");

    await page.locator(".diagram-node").first().click();
    await page.keyboard.press("Delete");
    await page.keyboard.press("ControlOrMeta+Z");

    await expect(page.locator(".diagram-node")).toHaveCount(2);

    await page.keyboard.press("ControlOrMeta+Shift+Z");

    await expect(page.locator(".diagram-node")).toHaveCount(1);
  });

  test("? opens the shortcuts help overlay, Escape closes it", async ({ page }) => {
    await page.goto("/editor");

    // Wait for the app to actually be mounted (EditorPage, and with it
    // useEditorShortcuts's keydown listener, loads asynchronously as a
    // separate chunk) before dispatching a global shortcut — otherwise
    // the key press can race the listener registration.
    await expect(page.locator(".diagram-node")).toHaveCount(2);

    const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });

    await expect(dialog).toBeHidden();

    await page.keyboard.press("?");

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Delete or Backspace")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
  });

  test("Escape closes the help overlay without deselecting the node underneath", async ({
    page,
  }) => {
    await page.goto("/editor");

    await page.locator(".diagram-node").first().click();
    await page.keyboard.press("?");

    await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeHidden();

    // the node inspector should still show the previously selected node
    await expect(page.locator(".inspector-panel")).not.toContainText("No node selected");
  });

  test("Arrow keys nudge a focused, selected node", async ({ page }) => {
    await page.goto("/editor");

    const node = page.locator(".diagram-node").first();

    await node.click();
    await node.focus();

    const before = await node.boundingBox();

    if (!before) {
      throw new Error("Expected node bounding box");
    }

    await page.keyboard.press("ArrowRight");

    const after = await node.boundingBox();

    if (!after) {
      throw new Error("Expected node bounding box");
    }

    expect(after.x).toBeGreaterThan(before.x);
  });
});
