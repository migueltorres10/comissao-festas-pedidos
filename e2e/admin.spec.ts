import { test, expect } from "@playwright/test";

test("edição administrativa continua acessível e legível no iPhone", async ({
  page,
}, testInfo) => {
  await page.goto("./");
  await expect(page.locator(".category")).toHaveCount(6);
  await expect(page.locator("[data-edit-article]")).toHaveCount(0);
  await page.getByRole("button", { name: "Administração", exact: true }).tap();
  await page.locator('#pin-form input[name="pin"]').fill("872650");
  await page.locator('#pin-form input[name="confirm"]').fill("872650");
  await page.getByRole("button", { name: "Guardar PIN", exact: true }).tap();
  await page.locator('[data-admin-tab="articles"]').tap();
  await page
    .locator(".admin-row")
    .filter({ has: page.getByText("Café", { exact: true }) })
    .getByRole("button", { name: "Editar", exact: true })
    .tap();
  await page.locator('#article-admin-form input[name="price"]').fill("2.50");
  await page
    .getByRole("button", { name: "Guardar alterações", exact: true })
    .tap();
  await expect(
    page
      .locator(".admin-row")
      .filter({ has: page.getByText("Café", { exact: true }) }),
  ).toContainText("2,50");
  await page.screenshot({
    path: testInfo.outputPath("administracao-iphone.png"),
  });
  await page.locator("#logout-admin").tap();
  await expect(page.locator("[data-edit-article]")).toHaveCount(0);
  await page.getByRole("button", { name: /Cafetaria/ }).tap();
  await expect(page.getByRole("button", { name: /^☕ Café / })).toContainText(
    "2,50",
  );
});
