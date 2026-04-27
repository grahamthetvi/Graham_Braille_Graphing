import { test, expect } from "@playwright/test";

test.describe("plot workbench", () => {
  test("opens formula assistant sheet", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("plot-workbench")).toBeVisible({ timeout: 60_000 });

    await page.getByTitle("Open formula panel").click();
    await expect(page.getByTestId("formula-assistant-panel")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Formulas" })).toBeVisible();

    await page.getByTitle("Close formula panel").click();
    await expect(page.getByTestId("formula-assistant-panel")).toBeHidden();
  });

  test("top menu exposes new sheet action", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("plot-workbench")).toBeVisible({ timeout: 60_000 });

    await page.getByTitle("Menu").click();
    await expect(page.getByText("New sheet")).toBeVisible();
  });
});
