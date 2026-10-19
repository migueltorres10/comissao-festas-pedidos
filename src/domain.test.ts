import { describe, expect, it } from 'vitest';
import { total, euro, seedCatalog } from './domain';
describe('domínio de pedidos', () => { it('calcula totais em cêntimos', () => { const c = seedCatalog(); const a = c.articles[0]; expect(total({ [a.id]: 3 }, c.articles)).toBe(a.priceCents * 3); }); it('formata moeda portuguesa', () => expect(euro(1250)).toContain('12,50')); it('cria catálogo inicial coerente', () => { const c = seedCatalog(); expect(c.categories).toHaveLength(5); expect(c.articles.every(a => c.categories.some(cat => cat.id === a.categoryId))).toBe(true); }); });
