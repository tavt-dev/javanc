import { expect, test } from "@playwright/test";
import { installApiMocks } from "../mocks/api";
import {
  dashboardPathFor,
  expectProtectedRedirect,
  installGoogleIdentityMock,
  loginAs,
  seedAuth,
} from "../utils/auth";
import type { TestRole } from "../fixtures/data";

test("guest cannot open protected routes", async ({ page }) => {
  await installApiMocks(page);
  await expectProtectedRedirect(page, "/dashboard");
});

test("login stores a session and opens dashboard", async ({ page }) => {
  await installApiMocks(page, { role: "user" });
  await loginAs(page, "user");

  await expect(page.getByText(/Welcome back/)).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/user\/dashboard$/);
});

test("google login stores a google session and opens dashboard", async ({ page }) => {
  await installGoogleIdentityMock(page);
  await installApiMocks(page, { role: "user" });
  await page.goto("/login");

  await page.getByText("Continue with Google").click();

  await expect(page).toHaveURL(/\/user\/dashboard$/);
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("auth_user") ?? "{}")),
    )
    .toMatchObject({ provider: "GOOGLE" });
});

test("google session stays google after refresh", async ({ page }) => {
  await installGoogleIdentityMock(page);
  const state = await installApiMocks(page, { role: "user" });
  await page.goto("/login");
  await page.getByText("Continue with Google").click();
  await expect(page).toHaveURL(/\/user\/dashboard$/);

  let profileRequests = 0;
  await page.route("**/profiles/me", async (route) => {
    profileRequests += 1;
    if (profileRequests === 1) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Expired",
          data: null,
        }),
      });
      return;
    }

    await route.fallback();
  });
  await page.goto("/profile");

  await expect.poll(() => state.refreshCount).toBeGreaterThan(0);
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("auth_user") ?? "{}")),
    )
    .toMatchObject({ provider: "GOOGLE" });
});

for (const role of ["user", "hr", "manager", "admin"] as TestRole[]) {
  test(`${role} lands on the correct role dashboard`, async ({ page }) => {
    await installApiMocks(page, { role });
    await seedAuth(page, role);

    await page.goto("/");

    await expect(page).toHaveURL(new RegExp(`${dashboardPathFor(role)}$`));
    await expect(page.locator(`a[href="${dashboardPathFor(role)}"]`).first()).toBeVisible();
  });
}

test("role navigation shows only the current workspace entries", async ({ page }) => {
  await installApiMocks(page, { role: "admin" });
  await seedAuth(page, "admin");
  await page.goto("/dashboard");

  await expect(page.locator('a[href="/admin/users"]').first()).toBeVisible();
  await expect(page.locator('a[href="/admin/companies"]').first()).toBeVisible();
  await expect(page.locator('a[href="/hr/jobs"]')).toHaveCount(0);

  await page.goto("/hr/jobs");
  await expect(page.getByRole("heading")).toBeVisible();
});

test("hr sees HR workspace navigation", async ({ page }) => {
  await installApiMocks(page, { role: "hr" });
  await seedAuth(page, "hr");
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/hr\/dashboard$/);
  await expect(page.locator('a[href="/hr/jobs"]').first()).toBeVisible();
  await expect(page.locator('a[href="/admin/users"]')).toHaveCount(0);
});
