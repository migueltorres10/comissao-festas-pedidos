import { test, expect, devices, chromium } from "@playwright/test";

// Chromium's touch protocol drives real touch input; WebKit mobile exposes tap
// and keyboard scrolling, but not a swipe API. Both engines are covered.
test("gesto tátil move categorias e artigos e mantém as barras estáveis", async ({
  baseURL,
}, testInfo) => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  try {
    await page.goto(baseURL!);
    await expect(page.locator(".category").first()).toBeVisible();
    await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open("comissao-festas-pedidos", 1);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("estado", "readwrite");
        const get = tx.objectStore("estado").get("state");
        get.onsuccess = () => {
          const state = get.result ?? {
            version: 2,
            orders: [
              {
                id: "touch-order",
                number: 1,
                name: "Teste",
                lines: {},
                createdAt: 1,
              },
            ],
            activeOrderId: "touch-order",
          };
          state.catalog = {
            version: 1,
            categories: Array.from({ length: 12 }, (_, i) => ({
              id: `c${i}`,
              name: `Categoria ${i + 1}`,
              color: "#d9eee5",
              icon: "☕",
              active: true,
              order: i,
            })),
            articles: Array.from({ length: 30 }, (_, i) => ({
              id: `a${i}`,
              categoryId: "c0",
              name: `Artigo ${i + 1}`,
              priceCents: 100,
              icon: "☕",
              active: true,
              order: i,
            })),
          };
          tx.objectStore("estado").put(state, "state");
        };
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      });
    });
    await page.reload();
    await expect(page.locator(".category")).toHaveCount(12);
    const session = await context.newCDPSession(page);
    const swipe = async (direction: "up" | "down") => {
      const box = (await page.locator("#content-scroll").boundingBox())!;
      const x = Math.round(box.width / 2),
        start = box.y + box.height * (direction === "up" ? 0.8 : 0.2),
        end = box.y + box.height * (direction === "up" ? 0.2 : 0.8);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y: start }],
      });
      for (let i = 1; i <= 20; i++) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: start + ((end - start) * i) / 20 }],
        });
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            const zone = document.querySelector("#content-scroll")!;
            let last = -1,
              stable = 0;
            const sample = () => {
              const current = zone.scrollTop;
              stable = Math.abs(current - last) < 0.1 ? stable + 1 : 0;
              last = current;
              if (stable >= 24) resolve();
              else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          }),
      );
    };
    const top = () =>
      page.locator("#content-scroll").evaluate((e) => e.scrollTop);
    const header = await page.locator("header").boundingBox();
    const footer = await page.locator(".mobile-bar").boundingBox();
    await swipe("up");
    await expect.poll(top).toBeGreaterThan(0);
    await page.screenshot({
      path: testInfo.outputPath("categorias-gesto-touch.png"),
    });
    await page.locator('[data-category="c11"]').click({ timeout: 5000 });
    await page.locator("#back").click({ timeout: 5000 });
    await swipe("down");
    await page.locator('[data-category="c0"]').scrollIntoViewIfNeeded();
    await page.locator('[data-category="c0"]').click({ timeout: 5000 });
    await swipe("up");
    await expect.poll(top).toBeGreaterThan(0);
    await page.screenshot({
      path: testInfo.outputPath("artigos-gesto-touch.png"),
    });
    expect(await page.locator("header").boundingBox()).toEqual(header);
    expect(await page.locator(".mobile-bar").boundingBox()).toEqual(footer);
    await page.locator('[data-add="a29"]').scrollIntoViewIfNeeded();
    await page.locator('[data-add="a29"]').click({ timeout: 5000 });
    await expect(page.locator("#add-quantity")).toBeVisible();
  } finally {
    await context.close();
    await browser.close();
  }
});
