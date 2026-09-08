import { expect, test } from "@playwright/test";

test.describe("Save and reload", () => {
  test("saves a renamed diagram and restores it after a page reload", async ({ page }) => {
    await page.goto("/editor");

    await page.getByTitle("Rename diagram").click();
    await page.locator(".diagram-title-input").fill("E2E Test Diagram");
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 5000 });

    await expect(page).toHaveURL(/[?&]id=/);

    await page.reload();

    await expect(page.getByTitle("Rename diagram")).toContainText("E2E Test Diagram");
    await expect(page.locator(".diagram-node")).toHaveCount(2);
  });

  test("a saved diagram appears on the diagrams list page", async ({ page }) => {
    await page.goto("/editor");

    await page.getByTitle("Rename diagram").click();
    await page.locator(".diagram-title-input").fill("Listed Diagram");
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 5000 });

    await page.goto("/diagrams");

    await expect(page.getByText("Listed Diagram")).toBeVisible();
  });
});
