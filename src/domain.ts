export type Category = { id: string; name: string; color: string; icon: string; active: boolean; order: number };
export type Article = { id: string; categoryId: string; name: string; priceCents: number; icon: string; active: boolean; order: number };
export type LineItem = { articleId: string; name: string; priceCents: number; icon: string; quantity: number };
export type Order = { id: string; name: string; number: number; lines: Record<string, LineItem>; createdAt: number };
export type Catalog = { version: 1; categories: Category[]; articles: Article[] };
export type AppState = { version: 2; catalog: Catalog; orders: Order[]; activeOrderId: string };
export type LegacyState = { catalog: Catalog; cart: Record<string, number> };
export const euro = (cents: number) => (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
export const orderTotal = (order: Order) => Object.values(order.lines).reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
export const orderCount = (order: Order) => Object.values(order.lines).reduce((sum, line) => sum + line.quantity, 0);
export const uid = () => crypto.randomUUID();
export const createOrder = (number: number): Order => ({ id: uid(), name: '', number, lines: {}, createdAt: Date.now() });
export const seedCatalog = (): Catalog => {
  const categories: Category[] = [
    { id: uid(), name: 'Bebidas', color: '#d9eee5', icon: '🥤', active: true, order: 0 }, { id: uid(), name: 'Comidas', color: '#f7dfc5', icon: '🍲', active: true, order: 1 }, { id: uid(), name: 'Cafetaria', color: '#e8ddce', icon: '☕', active: true, order: 2 }, { id: uid(), name: 'Sobremesas', color: '#f2d9e5', icon: '🍰', active: true, order: 3 }, { id: uid(), name: 'Outros', color: '#e1e3ed', icon: '✨', active: true, order: 4 }
  ]; const byName = (name: string) => categories.find(c => c.name === name)!.id;
  const items: [string, string, number, string][] = [['Água', 'Bebidas', 100, '💧'], ['Café', 'Cafetaria', 80, '☕'], ['Sopa Seca', 'Comidas', 250, '🥣'], ['Bolo', 'Sobremesas', 150, '🍰']];
  return { version: 1, categories, articles: items.map(([name, cat, price, icon], order) => ({ id: uid(), name, categoryId: byName(cat), priceCents: price, icon, active: true, order })) };
};
export function migrateState(raw: AppState | LegacyState | undefined, fallbackCatalog: Catalog): AppState {
  if (raw && 'orders' in raw && Array.isArray(raw.orders) && raw.orders.length) return { version: 2, catalog: raw.catalog, orders: raw.orders, activeOrderId: raw.orders.some(o => o.id === raw.activeOrderId) ? raw.activeOrderId : raw.orders[0].id };
  const legacy = raw as LegacyState | undefined; const order = createOrder(1);
  if (legacy?.cart) Object.entries(legacy.cart).forEach(([articleId, quantity]) => { const article = legacy.catalog.articles.find(a => a.id === articleId); if (article && quantity > 0) order.lines[articleId] = { articleId, name: article.name, priceCents: article.priceCents, icon: article.icon, quantity }; });
  return { version: 2, catalog: legacy?.catalog ?? fallbackCatalog, orders: [order], activeOrderId: order.id };
}
export function validCatalog(value: unknown): value is Catalog {
  if (!value || typeof value !== 'object') return false; const data = value as Partial<Catalog>;
  return data.version === 1 && Array.isArray(data.categories) && Array.isArray(data.articles) && data.categories.every(c => c && typeof c.id === 'string' && typeof c.name === 'string') && data.articles.every(a => a && typeof a.id === 'string' && typeof a.categoryId === 'string' && typeof a.name === 'string' && Number.isInteger(a.priceCents) && a.priceCents >= 0);
}
