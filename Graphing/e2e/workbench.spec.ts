import { test, expect } from "@playwright/test";

test.describe("plot workbench", () => {
  test("opens formula assistant sheet", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("plot-workbench")).toBeVisible({ timeout: 60_000 });

    await page.getByTitle("打开公式面板").click();
    await expect(page.getByTestId("formula-assistant-panel")).toBeVisible();
    await expect(page.getByRole("heading", { name: "公式对话" })).toBeVisible();

    await page.getByTitle("关闭公式面板").click();
    await expect(page.getByTestId("formula-assistant-panel")).toBeHidden();
  });

  test("top menu exposes new sheet action", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("plot-workbench")).toBeVisible({ timeout: 60_000 });

    await page.getByTitle("菜单").click();
    await expect(page.getByText("新建图纸")).toBeVisible();
  });
});
