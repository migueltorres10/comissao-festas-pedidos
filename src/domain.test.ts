import { describe, expect, it } from 'vitest';
import { createOrder, euro, migrateState, orderCount, orderTotal, seedCatalog, validCatalog } from './domain';
describe('pedidos simultâneos', () => {
  it('mantém totais independentes', () => { const catalog = seedCatalog(); const a = catalog.articles[0]; a.priceCents = 100; const one = createOrder(1); const two = createOrder(2); one.lines[a.id] = { articleId: a.id, name: a.name, priceCents: a.priceCents, icon: a.icon, quantity: 3 }; expect(orderTotal(one)).toBe(a.priceCents * 3); expect(orderTotal(two)).toBe(0); expect(orderCount(one)).toBe(3); });
  it('migra o carrinho da versão anterior para um pedido', () => { const catalog = seedCatalog(); const a = catalog.articles[0]; a.priceCents = 100; const state = migrateState({ catalog, cart: { [a.id]: 2 } }, catalog); expect(state.version).toBe(2); expect(state.orders).toHaveLength(1); expect(state.orders[0].lines[a.id].quantity).toBe(2); expect(state.orders[0].lines[a.id].priceCents).toBe(a.priceCents); });
  it('preserva o preço guardado quando o catálogo muda', () => { const catalog = seedCatalog(); const a = catalog.articles[0]; a.priceCents = 100; const state = migrateState({ catalog, cart: { [a.id]: 1 } }, catalog); catalog.articles[0].priceCents = 9999; expect(state.orders[0].lines[a.id].priceCents).not.toBe(9999); });
  it('valida catálogos e formata moeda portuguesa', () => { const catalog = seedCatalog(); expect(validCatalog(catalog)).toBe(true); expect(validCatalog({})).toBe(false); expect(euro(1250)).toContain('12,50'); });
});
