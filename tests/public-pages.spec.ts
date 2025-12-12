import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test.describe("About Page", () => {
    test("should display about content", async ({ page }) => {
      await page.goto("/about");

      // Check for about page content
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("body")).toContainText(/about|mission|bioenergy/i);
    });

    test("should have navigation back to home", async ({ page }) => {
      await page.goto("/about");

      const homeLink = page.getByRole("link", { name: /home|abfi/i }).first();
      await expect(homeLink).toBeVisible();
    });
  });

  test.describe("Pricing Page", () => {
    test("should display pricing plans", async ({ page }) => {
      await page.goto("/pricing");

      // Check for pricing content
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("body")).toContainText(/pricing|plan|price/i);
    });

    test("should display multiple pricing tiers", async ({ page }) => {
      await page.goto("/pricing");

      // Look for pricing tier names (Starter, Professional, Enterprise)
      await expect(page.getByText(/starter/i)).toBeVisible();
      await expect(page.getByText(/professional/i)).toBeVisible();
      await expect(page.getByText(/enterprise/i)).toBeVisible();
    });

    test("should have call-to-action buttons", async ({ page }) => {
      await page.goto("/pricing");

      // Look for signup/get started buttons
      await expect(page.getByRole("link", { name: /get started|sign up|start/i }).first()).toBeVisible();
    });
  });
});
