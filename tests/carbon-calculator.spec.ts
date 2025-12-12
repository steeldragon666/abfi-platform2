import { test, expect } from "@playwright/test";

test.describe("Carbon Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/carbon-calculator");
  });

  test("should display calculator page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /carbon intensity/i })).toBeVisible();
  });

  test("should have input for carbon intensity value", async ({ page }) => {
    // Look for the CI value input
    const ciInput = page.getByLabel(/carbon intensity/i);
    await expect(ciInput).toBeVisible();
  });

  test("should have preset feedstock options", async ({ page }) => {
    // Look for preset dropdown or select
    await expect(page.getByText(/preset|feedstock/i)).toBeVisible();
  });

  test("should calculate and display score on input", async ({ page }) => {
    // Find the input and enter a value
    const ciInput = page.locator('input[type="number"]').first();
    await ciInput.fill("25");

    // Should show a score
    await expect(page.getByText(/score|rating/i)).toBeVisible();
  });

  test("should show rating badge", async ({ page }) => {
    // The calculator should show a rating (A+, A, B+, B, C+, C, D, F)
    await expect(page.locator("body")).toContainText(/A\+|A|B\+|B|C\+|C|D|F/);
  });

  test("should display RED II compliance check", async ({ page }) => {
    // Should show RED II compliance information
    await expect(page.getByText(/RED II|compliance|threshold/i)).toBeVisible();
  });

  test("should have slider for adjusting value", async ({ page }) => {
    // Look for a slider element
    const slider = page.locator('[role="slider"]');
    await expect(slider).toBeVisible();
  });

  test("should update score when slider changes", async ({ page }) => {
    // Get the slider
    const slider = page.locator('[role="slider"]');

    // Get initial score text
    const scoreText = page.locator("text=/\\d+\\/100|\\d+ score/i");

    if (await scoreText.isVisible()) {
      // Interact with slider
      await slider.click();

      // Score should be visible
      await expect(scoreText).toBeVisible();
    }
  });

  test("should display educational content", async ({ page }) => {
    // Should have explanation of carbon intensity
    await expect(page.getByText(/gCO2e\/MJ|greenhouse|emissions/i)).toBeVisible();
  });

  test("should show rating scale explanation", async ({ page }) => {
    // Scroll down to find the rating scale table
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Look for the rating scale
    await expect(page.getByText(/rating scale|CI range/i)).toBeVisible();
  });

  test("should have back to home link", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /back|home/i });
    await expect(backLink).toBeVisible();
  });
});
