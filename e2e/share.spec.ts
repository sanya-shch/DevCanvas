import { expect, test } from "@playwright/test";

import { setMonacoContent } from "./utils";

test.describe("Share", () => {
  test("copies a share link and opening it renders the same diagram", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/editor");

    await page.getByRole("button", { name: "Share" }).click();

    await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());

    expect(sharedUrl).toContain("#share=");

    const newPage = await context.newPage();

    await newPage.goto(sharedUrl);

    await expect(newPage.locator(".diagram-node")).toHaveCount(2);

    await newPage.close();
  });

  test("Share is disabled when the diagram has a parse error", async ({ page }) => {
    await page.goto("/editor");

    await setMonacoContent(page, "not valid {{{");

    await expect(page.locator(".error-panel")).toBeVisible({ timeout: 5000 });

    await expect(page.getByRole("button", { name: "Share" })).toBeDisabled();
  });
});
