import { test, expect } from "@playwright/test";

test.describe("workbench toolbar", () => {
  test("point tool adds a JSXGraph point under board host", async ({ page }) => {
    await page.goto("/");
    const host = page.getByTestId("jxg-board-host");
    await expect(host).toBeVisible({ timeout: 60_000 });

    const nodeCount = () =>
      host.evaluate((el) => el.querySelectorAll("svg *").length);

    const before = await nodeCount();
    await page.getByTestId("workbench-tool-point").click();
    await expect.poll(async () => nodeCount(), { timeout: 15_000 }).toBeGreaterThan(before);
  });
});
