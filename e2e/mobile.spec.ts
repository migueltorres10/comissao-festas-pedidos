import { test, expect, type Page } from "@playwright/test";

// Dados sintéticos exclusivamente para testes. Nunca são publicados no catálogo.
const catalog = {
  version: 1,
  categories: Array.from({ length: 12 }, (_, i) => ({
    id: `c${i}`,
    name: `Categoria ${i + 1}`,
    icon: "☕",
    color: "#d9eee5",
    active: true,
    order: i,
  })),
  articles: Array.from({ length: 30 }, (_, i) => ({
    id: `a${i}`,
    categoryId: "c0",
    name: `Artigo ${i + 1}`,
    icon: "☕",
    priceCents: 120,
    active: true,
    order: i,
  })),
};
const state = {
  version: 2,
  catalog,
  orders: [
    {
      id: "order-one",
      number: 1,
      name: "Mesa 1",
      createdAt: 1,
      lines: {
        a0: {
          articleId: "a0",
          name: "Artigo 1",
          priceCents: 120,
          icon: "☕",
          quantity: 2,
        },
      },
    },
    {
      id: "order-two",
      number: 2,
      name: "Mesa 2",
      createdAt: 2,
      lines: {
        a1: {
          articleId: "a1",
          name: "Artigo 2",
          priceCents: 120,
          icon: "☕",
          quantity: 1,
        },
      },
    },
  ],
  activeOrderId: "order-one",
};
async function seed(page: Page) {
  await page.goto("./");
  await expect(page.locator(".category").first()).toBeVisible();
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
  }, state);
  await page.reload();
  await expect(page.locator(".category")).toHaveCount(12);
}
async function metrics(page: Page) {
  return page.evaluate(() => {
    const zone = document.querySelector("#content-scroll")!;
    const rect = zone.getBoundingClientRect();
    return {
      top: zone.scrollTop,
      height: zone.clientHeight,
      full: zone.scrollHeight,
      right: rect.right,
      window: innerWidth,
      pageHeight: document.documentElement.scrollHeight,
      windowHeight: innerHeight,
    };
  });
}
for (const [width, height] of [
  [320, 568],
  [375, 667],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1280, 800],
]) {
  test(`grelhas e scroll real ${width}x${height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await seed(page);
    await page.screenshot({
      path: testInfo.outputPath(`categorias-${width}.png`),
    });
    const header = await page.locator("header").boundingBox();
    const footer = await page.locator(".mobile-bar").boundingBox();
    let m = await metrics(page);
    if (width <= 850) expect(m.right).toBeCloseTo(width, 0);
    expect(m.pageHeight).toBeLessThanOrEqual(height + 1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const first = await page.locator(".category").nth(0).boundingBox();
    const second = await page.locator(".category").nth(1).boundingBox();
    if (width <= 850) expect(first!.y).toBeCloseTo(second!.y, 0);
    // Deslocação por teclado é input real no motor WebKit, não alteração de scrollTop.
    if (m.full > m.height) {
      await page.locator("#content-scroll").focus();
      await page.locator("#content-scroll").press("End");
      await expect
        .poll(async () => (await metrics(page)).top)
        .toBeGreaterThan(0);
    }
    await page.locator('[data-category="c11"]').tap();
    await expect(page.locator(".view-head h2")).toHaveText("Categoria 12");
    await page.locator("#back").tap();
    await page.locator("#content-scroll").focus();
    await page.locator("#content-scroll").press("Home");
    await page.locator('[data-category="c0"]').tap();
    await expect(page.locator(".article")).toHaveCount(30);
    m = await metrics(page);
    expect(m.full).toBeGreaterThan(m.height);
    const a = await page.locator(".article").nth(0).boundingBox();
    const b = await page.locator(".article").nth(1).boundingBox();
    const c = await page.locator(".article").nth(2).boundingBox();
    if (width <= 850) {
      expect(a!.y).toBeCloseTo(b!.y, 0);
      expect(c!.y).toBeGreaterThanOrEqual(a!.y + a!.height + 8);
      expect(a!.height).toBeLessThanOrEqual(140);
    }
    await page.locator("#content-scroll").focus();
    await page.locator("#content-scroll").press("End");
    await expect.poll(async () => (await metrics(page)).top).toBeGreaterThan(0);
    await page.screenshot({
      path: testInfo.outputPath(`artigos-fim-${width}.png`),
    });
    expect(await page.locator("header").boundingBox()).toEqual(header);
    if (width <= 850)
      expect(await page.locator(".mobile-bar").boundingBox()).toEqual(footer);
    const scrollBefore = (await metrics(page)).top;
    testInfo.annotations.push({
      type: "scroll",
      description: JSON.stringify({ ...m, finalScrollTop: scrollBefore }),
    });
    await page.locator('[data-add="a29"]').tap();
    await expect(page.locator("#add-quantity")).toBeVisible();
    await page.locator("#quantity-plus").tap();
    await page.locator("#add-quantity").tap();
    await expect
      .poll(async () => (await metrics(page)).top)
      .toBeCloseTo(scrollBefore, 0);
    await page.screenshot({
      path: testInfo.outputPath(`artigos-adicionados-${width}.png`),
    });
  });
}
test("recebimento numérico, troco destacado e conclusão isolada", async ({
  page,
}, testInfo) => {
  await seed(page);
  const dialogs: string[] = [];
  page.on("dialog", (dialog) => {
    dialogs.push(dialog.type());
    void dialog.dismiss();
  });
  await page.locator("#view-order").tap();
  await page.locator('.order-sheet [data-order-action="finish"]').tap();
  const input = page.getByLabel("Valor recebido", { exact: true });
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("inputmode", "decimal");
  await expect(page.locator(".order-sheet")).toHaveCount(0);
  await input.fill("1,00");
  await expect(page.locator("#confirm-payment")).toBeDisabled();
  await expect(page.locator("#change-label")).toHaveText("Em falta");
  await input.fill("10,00");
  await expect(page.locator("#change-value")).toHaveText(/7,60/);
  expect(
    await page
      .locator("#change-value")
      .evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBeGreaterThanOrEqual(36);
  await expect(input).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("troco-iphone.png") });
  await page.locator("#cancel-checkout").tap();
  await expect(page.locator(".order-sheet")).toBeVisible();
  await page.locator('.order-sheet [data-order-action="finish"]').tap();
  await input.fill("10");
  await page.locator("#confirm-payment").tap();
  await expect(page.locator("header h1")).toHaveText("Mesa 2");
  await expect(page.locator(".footer-total")).toHaveText(/1,20/);
  await page.reload();
  await expect(page.locator("#order-picker")).toHaveText("Pedidos (1)");
  await expect(page.locator("header h1")).toHaveText("Mesa 2");
  expect(dialogs).toEqual([]);
});
test("limpar só o pedido ativo e preservar o outro após reabrir", async ({
  page,
}, testInfo) => {
  await seed(page);
  await page.locator("#view-order").tap();
  await page.locator('.order-sheet [data-order-action="clear"]').tap();
  await page.locator("#cancel-clear").tap();
  await expect(page.locator(".order-sheet .order-row")).toHaveCount(1);
  await page.locator('.order-sheet [data-order-action="clear"]').tap();
  await page.locator("#confirm-clear").tap();
  await expect(page.locator(".order-sheet .empty-order")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("pedido-limpo.png") });
  await page.locator("#close-order").tap();
  await page.locator("#order-picker").tap();
  await page.locator('[data-select-order="order-two"]').tap();
  await expect(page.locator(".footer-total")).toHaveText(/1,20/);
  await page.reload();
  await expect(page.locator(".footer-total")).toHaveText(/1,20/);
  await expect(page.locator("#order-picker")).toHaveText("Pedidos (2)");
});
test("catálogo real compacto, quantidade e recebimento em ecrã reduzido", async ({
  page,
}, testInfo) => {
  await page.goto("./");
  await expect(page.locator(".category")).toHaveCount(6);
  await page.screenshot({
    path: testInfo.outputPath("categorias-reais-iphone.png"),
  });
  await page.getByRole("button", { name: /Cervejaria/ }).tap();
  await page.screenshot({
    path: testInfo.outputPath("artigos-reais-iphone.png"),
  });
  await page.getByRole("button", { name: /Fino/ }).tap();
  await page.locator("#quantity-plus").tap();
  await page.screenshot({ path: testInfo.outputPath("quantidade-iphone.png") });
  await page.locator("#add-quantity").tap();
  await page.locator("#view-order").tap();
  await page.screenshot({ path: testInfo.outputPath("pedido-iphone.png") });
  await page.locator('.order-sheet [data-order-action="finish"]').tap();
  await page.getByLabel("Valor recebido", { exact: true }).fill("10");
  await page.screenshot({ path: testInfo.outputPath("troco-real-iphone.png") });
  await page.setViewportSize({ width: 390, height: 420 });
  await expect(
    page.getByLabel("Valor recebido", { exact: true }),
  ).toBeInViewport();
  await page.locator("#confirm-payment").scrollIntoViewIfNeeded();
  await expect(page.locator("#confirm-payment")).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath("recebimento-espaco-reduzido.png"),
  });
});
