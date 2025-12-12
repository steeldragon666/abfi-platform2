import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should display homepage with hero section", async ({ page }) => {
    await page.goto("/");

    // Check hero section content
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("ABFI")).toBeVisible();

    // Check navigation links
    await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /register|sign up/i })).toBeVisible();
  });

  test("should have working navigation links", async ({ page }) => {
    await page.goto("/");

    // Test About link
    const aboutLink = page.getByRole("link", { name: /about/i });
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL(/.*about.*/);
    }
  });

  test("should display features section", async ({ page }) => {
    await page.goto("/");

    // Look for features content
    await expect(page.locator("body")).toContainText(/feedstock|bioenergy|sustainable/i);
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("body")).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator("body")).toBeVisible();
  });
});
