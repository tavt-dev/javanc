import { expect, test } from "@playwright/test";
import { installApiMocks } from "../mocks/api";
import { seedAuth } from "../utils/auth";

test("missing profile renders onboarding state", async ({ page }) => {
  await installApiMocks(page, { role: "user", profileMissing: true });
  await seedAuth(page, "user");

  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Create your profile" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create profile" }).first()).toBeVisible();
});

test("job board filters jobs and user can apply", async ({ page }) => {
  await installApiMocks(page, { role: "user" });
  await seedAuth(page, "user");

  await page.goto("/jobs");
  await page.getByPlaceholder("Search jobs").fill("Java");

  await expect(page.getByRole("heading", { name: "Java API Engineer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Python Data Engineer" })).toHaveCount(0);

  await page.getByRole("link", { name: /View detail/ }).click();
  await page.getByRole("button", { name: "Apply" }).click();
  await page.getByRole("button", { name: "Apply" }).last().click();

  await expect(page.getByRole("heading", { name: "Pending" })).toBeVisible();
});

test("notifications can be marked read", async ({ page }) => {
  await installApiMocks(page, { role: "user" });
  await seedAuth(page, "user");

  await page.goto("/notifications");
  await expect(page.getByText("Unread", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Mark read" }).first().click();

  await expect(page.getByRole("button", { name: "Mark read" })).toHaveCount(0);
});
