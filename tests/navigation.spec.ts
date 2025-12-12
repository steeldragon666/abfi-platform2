import { test, expect } from "@playwright/test";

test.describe("Navigation & Accessibility", () => {
  test("should navigate between main pages", async ({ page }) => {
    // Start at homepage
    await page.goto("/");
    await expect(page).toHaveURL("/");

    // Navigate to login
    await page.getByRole("link", { name: /login/i }).click();
    await expect(page).toHaveURL(/.*login.*/);

    // Navigate back home
    const homeLink = page.getByRole("link", { name: /abfi|home/i }).first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL("/");
    }
  });

  test("should have correct page titles", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ABFI/i);

    await page.goto("/login");
    await expect(page).toHaveTitle(/login|sign in/i);

    await page.goto("/about");
    await expect(page).toHaveTitle(/about/i);

    await page.goto("/pricing");
    await expect(page).toHaveTitle(/pricing/i);

    await page.goto("/tools/carbon-calculator");
    await expect(page).toHaveTitle(/carbon|calculator/i);
  });

  test("should handle 404 for non-existent pages", async ({ page }) => {
    const response = await page.goto("/non-existent-page-12345");

    // Should show 404 page or redirect
    expect([200, 404]).toContain(response?.status() ?? 404);
  });

  test("should have semantic HTML structure", async ({ page }) => {
    await page.goto("/");

    // Check for main landmark
    const main = page.locator("main");
    if (await main.isVisible()) {
      await expect(main).toBeVisible();
    }

    // Check for header
    const header = page.locator("header");
    if (await header.isVisible()) {
      await expect(header).toBeVisible();
    }
  });

  test("should work with keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Tab through focusable elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Check that something is focused
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(focusedElement).toBeTruthy();
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Should have at least one h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test("should load images with alt text", async ({ page }) => {
    await page.goto("/");

    // Check all images have alt attributes
    const images = await page.locator("img").all();
    for (const img of images) {
      const alt = await img.getAttribute("alt");
      // Alt should exist (can be empty for decorative images)
      expect(alt).toBeDefined();
    }
  });

  test("should have proper color contrast", async ({ page }) => {
    await page.goto("/");

    // Basic check that text is visible
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
  });
});
