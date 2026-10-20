import { test, expect } from "@playwright/test";

test("PWA reabre offline com artigos e pedido preservados", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("./");
  await expect(page.locator(".category")).toHaveCount(6);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open("pedidos-v13");
    return (await cache.keys()).map((r) => new URL(r.url).pathname);
  });
  expect(cached.some((p) => /assets\/.*\.js$/.test(p))).toBe(true);
  expect(cached.some((p) => /assets\/.*\.css$/.test(p))).toBe(true);
  await page.getByRole("button", { name: /Cafetaria/ }).tap();
  await page.getByRole("button", { name: /^☕ Café / }).tap();
  await page.locator("#quantity-plus").tap();
  await page.locator("#add-quantity").tap();
  await expect(page.locator(".footer-total")).toHaveText(/1,80/);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".footer-total")).toHaveText(/1,80/);
  await expect(page.locator(".category")).toHaveCount(6);
  await page.getByRole("button", { name: /Cafetaria/ }).tap();
  await page.getByRole("button", { name: /^☕ Café / }).tap();
  await expect(page.locator("#add-quantity")).toBeVisible();
  await page.locator("#close-sheet").tap();
  await page.locator("#view-order").tap();
  await page.locator('.order-sheet [data-order-action="finish"]').tap();
  await page.getByLabel("Valor recebido", { exact: true }).fill("5");
  await expect(page.locator("#change-value")).toHaveText(/3,20/);
  await page.screenshot({ path: testInfo.outputPath("offline-troco.png") });
  await context.setOffline(false);
});
