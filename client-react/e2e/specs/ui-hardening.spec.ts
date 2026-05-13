import { expect, test } from "@playwright/test";
import { installApiMocks } from "../mocks/api";
import { seedAuth } from "../utils/auth";
import { expectNoHorizontalOverflow, setViewport } from "../utils/viewport";

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`dashboard has no horizontal overflow at ${width}px`, async ({ page }) => {
    await installApiMocks(page, { role: "admin" });
    await seedAuth(page, "admin");
    await setViewport(page, width);

    await page.goto("/dashboard");

    await expect(page.getByText(/Welcome back/)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

test("topbar menus close with Escape", async ({ page }) => {
  await installApiMocks(page, { role: "user" });
  await seedAuth(page, "user");

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Change theme" }).click();
  await expect(page.getByRole("menu")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("menu")).toHaveCount(0);
});
