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
  await page.locator('input[name="email"]').fill(session.user.email);
  await page.locator('input[name="password"]').fill("Password1");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`${dashboardPathFor(role)}$`));
}

export async function installGoogleIdentityMock(page: Page) {
  await page.addInitScript(() => {
    let credentialCallback:
      | ((response: { credential?: string }) => void)
      | undefined;

    window.google = {
      accounts: {
        id: {
          initialize: ({ callback }) => {
            credentialCallback = callback;
          },
          renderButton: (parent) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "Continue with Google";
            button.addEventListener("click", () => {
              credentialCallback?.({ credential: "google-id-token" });
            });
            parent.appendChild(button);
          },
        },
      },
    };
  });
}

export async function expectProtectedRedirect(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login$/);
}
