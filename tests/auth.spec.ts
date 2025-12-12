import { test, expect } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test.describe("Login Page", () => {
    test("should display login form", async ({ page }) => {
      await page.goto("/login");

      // Check form elements
      await expect(page.getByRole("heading", { name: /welcome back|sign in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });

    test("should have link to registration", async ({ page }) => {
      await page.goto("/login");

      await expect(page.getByRole("link", { name: /create account|register/i })).toBeVisible();
    });

    test("should have link to forgot password", async ({ page }) => {
      await page.goto("/login");

      await expect(page.getByRole("link", { name: /forgot/i })).toBeVisible();
    });

    test("should show validation on empty submit", async ({ page }) => {
      await page.goto("/login");

      // Click sign in without filling form
      await page.getByRole("button", { name: /sign in/i }).click();

      // HTML5 validation should prevent form submission
      // The email field should be invalid if empty
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveAttribute("required");
    });

    test("should have Google OAuth option", async ({ page }) => {
      await page.goto("/login");

      await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    });
  });

  test.describe("Registration Page", () => {
    test("should display registration form", async ({ page }) => {
      await page.goto("/register");

      // Check form elements
      await expect(page.getByRole("heading", { name: /create|sign up|register/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
    });

    test("should have role selection", async ({ page }) => {
      await page.goto("/register");

      // Should have supplier and buyer options
      await expect(page.getByText(/supplier|buyer/i)).toBeVisible();
    });

    test("should have link to login", async ({ page }) => {
      await page.goto("/register");

      await expect(page.getByRole("link", { name: /sign in|login/i })).toBeVisible();
    });
  });
});
