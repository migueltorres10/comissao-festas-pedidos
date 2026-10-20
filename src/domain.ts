import {
  CATEGORY_DATA,
  CATALOG_REVISION,
  LEGACY_DEMO_NAMES,
  MENU_ITEMS,
  menuId,
  normalizeName,
} from "./catalog-data";

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  active: boolean;
  order: number;
};
export type Article = {
  id: string;
  categoryId: string;
  name: string;
  priceCents: number | null;
  icon: string;
  active: boolean;
  order: number;
};
export type LineItem = {
  articleId: string;
  name: string;
  priceCents: number;
  icon: string;
  quantity: number;
};
export type Order = {
  id: string;
  name: string;
  number: number;
  lines: Record<string, LineItem>;
  createdAt: number;
};
export type Catalog = {
  version: 1;
  categories: Category[];
  articles: Article[];
};
export type AppState = {
  version: 2;
  catalog: Catalog;
  orders: Order[];
  activeOrderId: string;
  adminPinHash?: string;
  catalogRevision?: string;
};
export type LegacyState = { catalog: Catalog; cart: Record<string, number> };
export const euro = (cents: number) =>
  (cents / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
export const priceLabel = (cents: number | null) =>
  cents === null ? "Preço por definir" : euro(cents);
export const orderTotal = (order: Order) =>
  Object.values(order.lines).reduce(
    (sum, line) => sum + line.priceCents * line.quantity,
    0,
  );
export const orderCount = (order: Order) =>
  Object.values(order.lines).reduce((sum, line) => sum + line.quantity, 0);
export const uid = () => crypto.randomUUID();
export const createOrder = (number: number): Order => ({
  id: uid(),
  name: "",
  number,
  lines: {},
  createdAt: Date.now(),
});

export function seedCatalog(): Catalog {
  const categories = CATEGORY_DATA.map((c, order) => ({
    ...c,
    id: `category-${normalizeName(c.name)}`,
    active: true,
    order,
  }));
  return {
    version: 1,
    categories,
    articles: MENU_ITEMS.map((a, order) => ({
      id: menuId(a.name),
      categoryId: categories.find((c) => c.name === a.category)!.id,
      name: a.name,
      priceCents: a.priceCents,
      icon: a.icon,
      active: true,
      order,
    })),
  };
}

function normalizeCatalog(catalog: Catalog): Catalog {
  return {
    version: 1,
    categories: catalog.categories.map((c, i) => ({
      ...c,
      order: Number.isFinite(c.order) ? c.order : i,
    })),
    articles: catalog.articles.map((a, i) => ({
      ...a,
      priceCents:
        typeof a.priceCents === "number" &&
        Number.isInteger(a.priceCents) &&
        a.priceCents >= 0
          ? a.priceCents
          : null,
      order: Number.isFinite(a.order) ? a.order : i,
    })),
  };
}

// Run this release once per device. Existing order lines are snapshots and never
// read their price/name from the updated catalog.
export function applyPublishedCatalog(catalog: Catalog): Catalog {
  const knownCategories = new Set(
    CATEGORY_DATA.map((c) => normalizeName(c.name)),
  );
  if (
    !catalog.categories.some((c) => knownCategories.has(normalizeName(c.name)))
  )
    return catalog;
  const categories = catalog.categories.map((c) => ({ ...c }));
  const categoryIds = new Map<string, string>();
  for (const definition of CATEGORY_DATA) {
    let category = categories.find(
      (c) => normalizeName(c.name) === normalizeName(definition.name),
    );
    if (!category) {
      category = {
        ...definition,
        id: `category-${normalizeName(definition.name)}`,
        active: true,
        order: Math.max(-1, ...categories.map((c) => c.order)) + 1,
      };
      categories.push(category);
    }
    categoryIds.set(definition.name, category.id);
  }
  const used = new Set<string>();
  const articles: Article[] = MENU_ITEMS.map((definition, order) => {
    const names = new Set(
      [definition.name, ...definition.aliases].map(normalizeName),
    );
    const previous = catalog.articles.find(
      (a) => !used.has(a.id) && names.has(normalizeName(a.name)),
    );
    if (previous) used.add(previous.id);
    return {
      id: previous?.id ?? menuId(definition.name),
      name: definition.name,
      categoryId: categoryIds.get(definition.category)!,
      priceCents: definition.priceCents,
      icon: previous?.icon || definition.icon,
      active: true,
      order,
    };
  });
  const publishedNames = new Set(MENU_ITEMS.map((a) => normalizeName(a.name)));
  const custom = catalog.articles.filter(
    (a) =>
      !used.has(a.id) &&
      !LEGACY_DEMO_NAMES.has(normalizeName(a.name)) &&
      !publishedNames.has(normalizeName(a.name)),
  );
  articles.push(
    ...custom.map((a, i) => ({ ...a, order: articles.length + i })),
  );
  return { version: 1, categories, articles };
}

export function migrateState(
  raw: AppState | LegacyState | undefined,
  fallbackCatalog: Catalog,
): AppState {
  let state: AppState;
  if (
    raw &&
    "orders" in raw &&
    Array.isArray(raw.orders) &&
    raw.orders.length
  ) {
    state = {
      ...raw,
      version: 2,
      catalog: normalizeCatalog(raw.catalog),
      activeOrderId: raw.orders.some((o) => o.id === raw.activeOrderId)
        ? raw.activeOrderId
        : raw.orders[0].id,
    };
  } else {
    const legacy = raw as LegacyState | undefined;
    const order = createOrder(1);
    if (legacy?.cart)
      Object.entries(legacy.cart).forEach(([articleId, quantity]) => {
        const article = legacy.catalog.articles.find((a) => a.id === articleId);
        if (article && typeof article.priceCents === "number" && quantity > 0)
          order.lines[articleId] = {
            articleId,
            name: article.name,
            priceCents: article.priceCents,
            icon: article.icon,
            quantity,
          };
      });
    state = {
      version: 2,
      catalog: normalizeCatalog(legacy?.catalog ?? fallbackCatalog),
      orders: [order],
      activeOrderId: order.id,
    };
  }
  if (state.catalogRevision !== CATALOG_REVISION) {
    state.catalog = applyPublishedCatalog(state.catalog);
    state.catalogRevision = CATALOG_REVISION;
  }
  return state;
}

export function validCatalog(value: unknown): value is Catalog {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<Catalog>;
  return (
    data.version === 1 &&
    Array.isArray(data.categories) &&
    Array.isArray(data.articles) &&
    data.categories.every(
      (c) => c && typeof c.id === "string" && typeof c.name === "string",
    ) &&
    data.articles.every(
      (a) =>
        a &&
        typeof a.id === "string" &&
        typeof a.categoryId === "string" &&
        typeof a.name === "string" &&
        (a.priceCents === null ||
          (Number.isInteger(a.priceCents) && a.priceCents >= 0)),
    )
  );
}
