export type Category = { id: string; name: string; color: string; icon: string; active: boolean; order: number };
export type Article = { id: string; categoryId: string; name: string; priceCents: number; icon: string; active: boolean; order: number };
export type Cart = Record<string, number>;
export type Catalog = { version: 1; categories: Category[]; articles: Article[] };

export const euro = (cents: number) => (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
export const total = (cart: Cart, articles: Article[]) => Object.entries(cart).reduce((sum, [id, qty]) => sum + (articles.find(a => a.id === id)?.priceCents ?? 0) * qty, 0);
export const uid = () => crypto.randomUUID();

export const seedCatalog = (): Catalog => {
  const categories: Category[] = [
    { id: uid(), name: 'Bebidas', color: '#d9eee5', icon: '🥤', active: true, order: 0 },
    { id: uid(), name: 'Comidas', color: '#f7dfc5', icon: '🍲', active: true, order: 1 },
    { id: uid(), name: 'Cafetaria', color: '#e8ddce', icon: '☕', active: true, order: 2 },
    { id: uid(), name: 'Sobremesas', color: '#f2d9e5', icon: '🍰', active: true, order: 3 },
    { id: uid(), name: 'Outros', color: '#e1e3ed', icon: '✨', active: true, order: 4 }
  ];
  const byName = (name: string) => categories.find(c => c.name === name)!.id;
  const items: [string, string, number, string][] = [['Água', 'Bebidas', 100, '💧'], ['Café', 'Cafetaria', 80, '☕'], ['Sopa Seca', 'Comidas', 250, '🥣'], ['Bolo', 'Sobremesas', 150, '🍰']];
  return { version: 1, categories, articles: items.map(([name, cat, price, icon], order) => ({ id: uid(), name, categoryId: byName(cat), priceCents: price, icon, active: true, order })) };
};
