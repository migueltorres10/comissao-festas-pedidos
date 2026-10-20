import { describe, expect, it } from "vitest";
import { CATALOG_REVISION } from "./catalog-data";
import {
  createOrder,
  migrateState,
  orderTotal,
  seedCatalog,
  type AppState,
  type Catalog,
} from "./domain";

describe("catálogo fornecido em 20/10/2026", () => {
  it("mantém as seis categorias e os 75 artigos/preços, incluindo variantes", () => {
    const catalog = seedCatalog();
    expect(catalog.categories.map((c) => c.name)).toEqual([
      "Cafetaria",
      "Cervejaria",
      "Destilados e Vinhos",
      "Sumos e Águas",
      "Snack",
      "Petiscos",
    ]);
    expect(catalog.articles).toHaveLength(75);
    expect(new Set(catalog.articles.map((a) => a.id)).size).toBe(75);
    expect(
      catalog.articles.every(
        (a) => Number.isInteger(a.priceCents) && a.priceCents! > 0,
      ),
    ).toBe(true);
    expect(
      catalog.categories.map(
        (c) => catalog.articles.filter((a) => a.categoryId === c.id).length,
      ),
    ).toEqual([9, 8, 22, 5, 16, 15]);
    const price = (name: string) =>
      catalog.articles.find((a) => a.name === name)?.priceCents;
    for (const [name, cents] of [
      ["Café", 90],
      ["Carioca", 50],
      ["Fino", 130],
      ["Favaios com cerveja", 150],
      ["Favaios com cerveja (pequeno)", 130],
      ["Beirão", 300],
      ["Beirão (2,5 cl)", 150],
      ["CRF", 400],
      ["CRF (2,5 cl)", 200],
      ["Croft", 300],
      ["Croft (2,5 cl)", 150],
      ["Whisky", 400],
      ["Whisky (2,5 cl)", 200],
      ["Moet & Chandon", 8000],
      ["Chiclas", 10],
      ["Chupas", 30],
      ["Gomas", 10],
      ["Rebuçados", 10],
      ["Cachorro", 400],
      ["Bifanas", 250],
      ["Pica pau", 400],
    ] as const)
      expect(price(name), name).toBe(cents);
  });
  it("atualiza instalações antigas, preservando categorias, IDs, pedidos e PIN", () => {
    const catalog: Catalog = {
      version: 1,
      categories: seedCatalog().categories.map((c) => ({
        ...c,
        id: `old-${c.name}`,
        color: "#abcdef",
      })),
      articles: [],
    };
    const category = catalog.categories[0];
    catalog.articles = [
      {
        id: "coffee-existing",
        name: "Café",
        priceCents: 80,
        categoryId: category.id,
        icon: "☕",
        active: true,
        order: 0,
      },
      {
        id: "demo-obsolete",
        name: "Abatanado",
        priceCents: 100,
        categoryId: category.id,
        icon: "☕",
        active: true,
        order: 1,
      },
      {
        id: "custom",
        name: "Especial local",
        priceCents: 325,
        categoryId: category.id,
        icon: "✨",
        active: true,
        order: 2,
      },
    ];
    const order = createOrder(5);
    order.name = "Mesa 5";
    order.lines["coffee-existing"] = {
      articleId: "coffee-existing",
      name: "Café",
      priceCents: 80,
      icon: "☕",
      quantity: 3,
    };
    order.lines["demo-obsolete"] = {
      articleId: "demo-obsolete",
      name: "Abatanado",
      priceCents: 100,
      icon: "☕",
      quantity: 1,
    };
    const raw: AppState = {
      version: 2,
      catalog,
      orders: [order],
      activeOrderId: order.id,
      adminPinHash: "existing-hash",
    };
    const next = migrateState(raw, seedCatalog());
    expect(next.catalogRevision).toBe(CATALOG_REVISION);
    expect(next.catalog.categories).toEqual(catalog.categories);
    expect(
      next.catalog.articles.find((a) => a.id === "coffee-existing")?.priceCents,
    ).toBe(90);
    expect(
      next.catalog.articles.find((a) => a.id === "demo-obsolete"),
    ).toBeUndefined();
    expect(
      next.catalog.articles.find((a) => a.id === "custom")?.priceCents,
    ).toBe(325);
    expect(next.orders).toEqual(raw.orders);
    expect(orderTotal(next.orders[0])).toBe(340);
    expect(next.activeOrderId).toBe(order.id);
    expect(next.adminPinHash).toBe("existing-hash");
  });
  it("aplica a revisão uma só vez e mantém posteriores edições administrativas", () => {
    const state = migrateState(undefined, seedCatalog());
    const coffee = state.catalog.articles.find((a) => a.name === "Café")!;
    coffee.priceCents = 125;
    const again = migrateState(state, seedCatalog());
    expect(
      again.catalog.articles.find((a) => a.id === coffee.id)?.priceCents,
    ).toBe(125);
    expect(again.catalog.articles).toHaveLength(75);
  });
});
