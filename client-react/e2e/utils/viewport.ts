import { expect, type Page } from "@playwright/test";

export async function setViewport(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return Math.max(root.scrollWidth, body.scrollWidth) - window.innerWidth;
  });
  expect(overflow).toBeLessThanOrEqual(2);
}
