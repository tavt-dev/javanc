import { expect, test } from "@playwright/test";
import { installApiMocks } from "../mocks/api";
import { seedAuth } from "../utils/auth";

test("hr sees unassigned company state", async ({ page }) => {
  await installApiMocks(page, { role: "hr", hrUnassigned: true });
  await seedAuth(page, "hr");

  await page.goto("/hr/jobs");

  await expect(
    page.getByRole("heading", {
      name: "HR account has not been assigned to a company",
    }),
  ).toBeVisible();
});

test("hr can create and delete a job", async ({ page }) => {
  await installApiMocks(page, { role: "hr" });
  await seedAuth(page, "hr");

  await page.goto("/hr/jobs");
  await page.getByRole("button", { name: "New job" }).click();
  const form = page.locator("form");
  await form.getByLabel("Title").fill("PHP Platform Engineer");
  await form.getByLabel("Description").fill("Maintain PHP services.");
  await form.getByLabel("Type").selectOption("php");
  await form.getByLabel("Openings").fill("3");
  await page.getByRole("button", { name: "Create job" }).click();

  await expect(page.getByText("PHP Platform Engineer")).toBeVisible();

  await page.getByRole("button", { name: "Delete" }).last().click();
  await page.getByRole("button", { name: "Delete" }).last().click();

  await expect(page.getByText("PHP Platform Engineer")).toHaveCount(0);
});

test("admin self-deactivate action is disabled", async ({ page }) => {
  await installApiMocks(page, { role: "admin" });
  await seedAuth(page, "admin");

  await page.goto("/admin/users");

  const adminRow = page.getByRole("row").filter({ hasText: "admin@example.com" });
  await expect(adminRow.getByRole("button", { name: "Deactivate" })).toBeDisabled();
});
