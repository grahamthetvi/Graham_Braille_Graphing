import { test, expect } from "@playwright/test";

test.describe("app smoke", () => {
  test("home loads workbench and JSX host", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/");
    await expect(page.getByTestId("plot-workbench")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("workbench-main")).toBeVisible();
    await expect(page.getByTestId("jxg-board-host")).toBeVisible();
    expect(errors, `page errors: ${errors.join("; ")}`).toEqual([]);
  });
});
