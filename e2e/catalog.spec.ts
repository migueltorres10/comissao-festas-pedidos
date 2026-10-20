import { test, expect } from "@playwright/test";
import type { AppState } from "../src/domain";

const categoryCounts = [
  ["Cafetaria", 9],
  ["Cervejaria", 8],
  ["Destilados e Vinhos", 22],
  ["Sumos e Águas", 5],
  ["Snack", 16],
  ["Petiscos", 15],
] as const;

test("75 opções reais em duas colunas, nomes legíveis e scroll até ao fim", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("./");
  await expect(page.locator(".category")).toHaveCount(6);
  for (const [name, count] of categoryCounts) {
    await page
      .locator(".category")
      .filter({ has: page.getByText(name, { exact: true }) })
      .tap();
    await expect(page.locator(".article")).toHaveCount(count);
    const boxes = await page.locator(".article").evaluateAll((cards) =>
      cards.map((card) => {
        const bounds = card.getBoundingClientRect();
        const text = card
          .querySelector(".article-name")!
          .getBoundingClientRect();
        const price = card.querySelector("strong")!.getBoundingClientRect();
        return {
          top: bounds.top,
          textRight: text.right,
          cardRight: bounds.right,
          textBottom: text.bottom,
          priceTop: price.top,
          priceBottom: price.bottom,
          cardBottom: bounds.bottom,
        };
      }),
    );
    expect(boxes[0].top).toBeCloseTo(boxes[1].top, 0);
    for (const box of boxes) {
      expect(box.textRight).toBeLessThanOrEqual(box.cardRight);
      expect(box.textBottom).toBeLessThanOrEqual(box.priceTop);
      expect(box.priceBottom).toBeLessThanOrEqual(box.cardBottom);
    }
    if (name === "Snack" || name === "Destilados e Vinhos") {
      await page.screenshot({
        path: testInfo.outputPath(`${name}-inicio.png`),
      });
    }
    if (name === "Snack") {
      await page
        .locator(".article")
        .filter({ hasText: "Pão misto" })
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: testInfo.outputPath("nomes-compridos.png"),
      });
    }
    await page.locator("#content-scroll").focus();
    await page.locator("#content-scroll").press("End");
    await expect
      .poll(() => page.locator("#content-scroll").evaluate((e) => e.scrollTop))
      .toBeGreaterThan(0);
    await expect(page.locator(".article").last()).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath(`${name}-fim.png`) });
    await page.locator("#back").tap();
  }
});

test("instalação antiga recebe os preços e preserva o pedido e PIN", async ({
  page,
}, testInfo) => {
  await page.goto("./");
  await expect(page.locator(".category")).toHaveCount(6);
  const legacy: AppState = {
    version: 2,
    catalog: {
      version: 1,
      categories: categoryCounts.map(([name], order) => ({
        id: `legacy-${order}`,
        name,
        icon: "☕",
        color: "#e8ddce",
        active: true,
        order,
      })),
      articles: [
        {
          id: "old-coffee",
          name: "Café",
          categoryId: "legacy-0",
          icon: "☕",
          priceCents: 80,
          active: true,
          order: 0,
        },
      ],
    },
    orders: [
      {
        id: "old-order",
        name: "Mesa 5",
        number: 5,
        createdAt: 1,
        lines: {
          "old-coffee": {
            articleId: "old-coffee",
            name: "Café",
            priceCents: 80,
            icon: "☕",
            quantity: 2,
          },
        },
      },
    ],
    activeOrderId: "old-order",
    adminPinHash: "existing-pin-hash",
  };
  await page.evaluate(async (data) => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open("comissao-festas-pedidos", 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("estado", "readwrite");
        tx.objectStore("estado").put(data, "state");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, legacy);
  await page.reload();
  await expect(page.locator("header h1")).toHaveText("Mesa 5");
  await expect(page.locator(".footer-total")).toHaveText(/1,60/);
  await page.getByRole("button", { name: /Cafetaria/ }).tap();
  await expect(page.locator('[data-add="old-coffee"]')).toContainText("0,90");
  const stored = await page.evaluate(
    () =>
      new Promise<AppState>((resolve, reject) => {
        const req = indexedDB.open("comissao-festas-pedidos", 1);
        req.onsuccess = () => {
          const db = req.result;
          const get = db
            .transaction("estado")
            .objectStore("estado")
            .get("state");
          get.onsuccess = () => {
            db.close();
            resolve(get.result);
          };
          get.onerror = () => reject(get.error);
        };
        req.onerror = () => reject(req.error);
      }),
  );
  expect(stored.catalog.articles).toHaveLength(75);
  expect(stored.catalogRevision).toBe("menu-2026-10-20-1");
  expect(stored.adminPinHash).toBe(legacy.adminPinHash);
  expect(stored.orders).toEqual(legacy.orders);
  expect(stored.catalog.categories).toEqual(legacy.catalog.categories);
  await page.screenshot({
    path: testInfo.outputPath("pedido-antigo-preco-preservado.png"),
  });
  await page.locator("#new-order").tap();
  await page
    .getByRole("button", { name: "Sem identificação", exact: true })
    .tap();
  await expect(page.locator(".footer-total")).toHaveText(/0,00/);
  await page.getByRole("button", { name: /Cafetaria/ }).tap();
  await page.locator('[data-add="old-coffee"]').tap();
  await page.locator("#add-quantity").tap();
  await expect(page.locator(".footer-total")).toHaveText(/0,90/);
  await page.reload();
  await expect(page.locator("#order-picker")).toHaveText("Pedidos (2)");
  await expect(page.locator(".footer-total")).toHaveText(/0,90/);
});
