import { expect, test } from "@playwright/test";
import { installApiMocks } from "../mocks/api";
import { expectProtectedRedirect, loginAs, seedAuth } from "../utils/auth";

test("guest cannot open protected routes", async ({ page }) => {
  await installApiMocks(page);
  await expectProtectedRedirect(page, "/dashboard");
});

test("login stores a session and opens dashboard", async ({ page }) => {
  await installApiMocks(page, { role: "user" });
  await loginAs(page, "user");

  await expect(page.getByText(/Welcome back/)).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("role navigation shows only the current workspace entries", async ({ page }) => {
  await installApiMocks(page, { role: "admin" });
  await seedAuth(page, "admin");
  await page.goto("/dashboard");

  await expect(page.getByRole("link", { name: /User Management/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Company Mgmt/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Manage Jobs/ })).toHaveCount(0);

  await page.goto("/hr/jobs");
  await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
});

test("hr sees HR workspace navigation", async ({ page }) => {
  await installApiMocks(page, { role: "hr" });
  await seedAuth(page, "hr");
  await page.goto("/dashboard");

  await expect(page.getByRole("link", { name: /Manage Jobs/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /User Management/ })).toHaveCount(0);
});
