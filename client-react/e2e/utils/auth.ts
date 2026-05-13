import { expect, type Page } from "@playwright/test";
import { sessionFor, type TestRole } from "../fixtures/data";

const dashboardPaths: Record<TestRole, string> = {
  user: "/user/dashboard",
  hr: "/hr/dashboard",
  manager: "/manager/dashboard",
  admin: "/admin/dashboard",
};

export function dashboardPathFor(role: TestRole) {
  return dashboardPaths[role];
}

export async function seedAuth(page: Page, role: TestRole) {
  const session = sessionFor(role);
  await page.addInitScript((value) => {
    localStorage.setItem("access_token", value.accessToken);
    localStorage.setItem("refresh_token", value.refreshToken);
    localStorage.setItem("auth_user", JSON.stringify(value.user));
    localStorage.setItem("auth_expires_in", String(value.expiresInSeconds));
  }, session);
}

export async function loginAs(page: Page, role: TestRole) {
  const session = sessionFor(role);
  await page.goto("/login");
  await page.getByLabel("Email").fill(session.user.email);
  await page.getByRole("textbox", { name: "Password" }).fill("Password1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${dashboardPathFor(role)}$`));
}

export async function expectProtectedRedirect(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login$/);
}
