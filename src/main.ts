import "./style.css";
import {
  createOrder,
  euro,
  migrateState,
  orderCount,
  orderTotal,
  priceLabel,
  seedCatalog,
  uid,
  validCatalog,
  type AppState,
  type Article,
  type Category,
  type Order,
} from "./domain";
import { loadState, saveState, flushState } from "./storage";
import { eurosToCents } from "./money";

let state: AppState = migrateState(undefined, seedCatalog());
let selectedCategory = "";
let view: "categories" | "articles" = "categories";
let quantityArticle: Article | null = null;
let quantity = 1;
let orderPanel = false;
let orderPicker = false;
let newOrderPanel = false;
let adminGate = false;
let adminMode = false;
let adminTab: "categories" | "articles" | "catalog" = "categories";
let adminAuthenticated = false;
let editingCategoryId = "";
let editingArticleId = "";
const scrollPositions = new Map<string, number>();
let renderedScrollKey = "categories";
let checkoutOrderId: string | null = null;
let clearOrderId: string | null = null;
const app = document.querySelector<HTMLDivElement>("#app")!;
const esc = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const categories = () =>
  state.catalog.categories
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order);
const articles = () =>
  state.catalog.articles
    .filter((a) => a.active && a.categoryId === selectedCategory)
    .sort((a, b) => a.order - b.order);
const activeOrder = () =>
  state.orders.find((o) => o.id === state.activeOrderId) ?? state.orders[0];
function render() {
  const oldZone = document.querySelector<HTMLElement>("#content-scroll");
  if (oldZone) scrollPositions.set(renderedScrollKey, oldZone.scrollTop);
  const order = activeOrder();
  if (!order) return;
  const cats = categories();
  if (!cats.some((c) => c.id === selectedCategory))
    selectedCategory = cats[0]?.id ?? "";
  const category = state.catalog.categories.find(
    (c) => c.id === selectedCategory,
  );
  const amount = orderTotal(order);
  const count = orderCount(order);
  const content =
    view === "categories"
      ? `<div class="section-heading"><div><span class="eyebrow">CATÁLOGO</span><h2>Escolha uma categoria</h2></div></div><div class="scroll-zone" id="content-scroll" tabindex="0" role="region" aria-label="Categorias"><div class="categories">${cats.map((c) => `<button class="category" data-category="${c.id}" style="--cat:${c.color}"><span>${c.icon}</span><strong>${esc(c.name)}</strong></button>`).join("")}</div></div>`
      : `<div class="view-head"><button class="back" id="back">‹ Voltar às categorias</button><h2>${esc(category?.name ?? "Artigos")}</h2></div><div class="scroll-zone" id="content-scroll" tabindex="0" role="region" aria-label="Artigos"><div class="articles">${
          articles().length
            ? articles()
                .map(
                  (a) =>
                    `<button class="article" data-add="${a.id}"><span class="article-icon">${a.icon || "＋"}</span><span class="article-name">${esc(a.name)}</span><strong>${priceLabel(a.priceCents)}</strong>${a.priceCents === null ? '<small class="price-pending">Indisponível para venda</small>' : ""}${order.lines[a.id] ? `<em>${order.lines[a.id].quantity}</em>` : ""}</button>`,
                )
                .join("")
            : '<p class="empty">Ainda não existem artigos ativos nesta categoria.</p>'
        }</div></div>`;
  app.innerHTML = `<header><div class="brand"><span class="eyebrow">COMISSÃO DE FESTAS · 26/27</span><h1>${esc(order.name || `Pedido ${order.number}`)}</h1></div><div class="header-actions"><button class="order-switch" id="order-picker">Pedidos (${state.orders.length})</button><button class="secondary header-new" id="new-order">+ Novo</button><button class="ghost settings-button" id="settings" aria-label="Administração">⚙</button></div></header><main class="layout"><section class="catalog">${content}</section><aside class="order desktop-order"><div class="order-head"><div><span class="eyebrow">${esc(order.name || `Pedido ${order.number}`)}</span><h2>Pedido atual</h2></div><span class="count">${count} ${count === 1 ? "unidade" : "unidades"}</span></div>${renderOrder(order)}<div class="order-total"><span>Total</span><strong>${euro(amount)}</strong></div><div class="order-actions"><button class="secondary" data-order-action="clear" ${count ? "" : "disabled"}>Limpar</button><button class="primary" data-order-action="finish" ${count ? "" : "disabled"}>Concluir</button></div></aside></main><div class="mobile-bar"><div><strong>${esc(order.name || `Pedido ${order.number}`)}</strong><span class="footer-total">${euro(amount)}</span><small>${count} ${count === 1 ? "unidade" : "unidades"}</small></div><button class="primary" id="view-order">Ver pedido</button></div>${quantityArticle ? renderQuantitySheet() : ""}${orderPanel ? renderOrderPanel(order) : ""}${orderPicker ? renderOrderPicker() : ""}${newOrderPanel ? renderNewOrderSheet() : ""}${adminGate ? renderAdminGate() : ""}${adminMode ? renderAdmin() : ""}${checkoutOrderId ? renderCheckout() : ""}${clearOrderId ? renderClearConfirmation() : ""}`;
  wire();
  renderedScrollKey =
    view === "categories" ? "categories" : `articles:${selectedCategory}`;
  const zone = document.querySelector<HTMLElement>("#content-scroll");
  if (zone) zone.scrollTop = scrollPositions.get(renderedScrollKey) ?? 0;
  const modalOpen = !!(
    quantityArticle ||
    orderPanel ||
    orderPicker ||
    newOrderPanel ||
    adminGate ||
    adminMode ||
    checkoutOrderId ||
    clearOrderId
  );
  document
    .querySelectorAll<HTMLElement>("header, .layout, .mobile-bar")
    .forEach((el) => (el.inert = modalOpen));
}
function renderOrder(order: Order) {
  const lines = Object.values(order.lines);
  if (!lines.length)
    return '<div class="empty-order"><span>🧺</span><p>O pedido está vazio</p><small>Escolha uma categoria para começar.</small></div>';
  return `<div class="order-items">${lines.map((line) => `<div class="order-row"><div><strong>${esc(line.name)}</strong><small>${euro(line.priceCents)} · ${euro(line.priceCents * line.quantity)}</small></div><div class="stepper"><button data-minus="${line.articleId}">−</button><b>${line.quantity}</b><button data-plus="${line.articleId}">+</button></div></div>`).join("")}</div>`;
}
function renderQuantitySheet() {
  return `<div class="sheet-backdrop"><section class="sheet" role="dialog" aria-modal="true"><div class="sheet-grabber"></div><span class="article-icon">${quantityArticle!.icon || "🍽️"}</span><span class="eyebrow">ADICIONAR AO PEDIDO</span><h2>${esc(quantityArticle!.name)}</h2><p class="unit-price">${priceLabel(quantityArticle!.priceCents)} por unidade</p><div class="quantity-control"><button id="quantity-minus">−</button><strong>${quantity}</strong><button id="quantity-plus">＋</button></div><div class="sheet-subtotal"><span>Subtotal</span><strong>${quantityArticle!.priceCents === null ? "Preço por definir" : euro(quantityArticle!.priceCents * quantity)}</strong></div><button class="primary full" id="add-quantity" ${quantityArticle!.priceCents === null ? "disabled" : ""}>Adicionar ao pedido</button><button class="link-button" id="close-sheet">Cancelar</button></section></div>`;
}
function renderOrderPanel(order: Order) {
  return `<div class="sheet-backdrop"><section class="sheet order-sheet" role="dialog" aria-modal="true" aria-label="Pedido atual"><div class="modal-head"><div><span class="eyebrow">${esc(order.name || `Pedido ${order.number}`)}</span><h2>Ver pedido</h2></div><button class="ghost dark" id="close-order">Fechar</button></div>${renderOrder(order)}<div class="order-total"><span>Total</span><strong>${euro(orderTotal(order))}</strong></div><div class="order-actions"><button class="secondary" data-order-action="clear" ${orderCount(order) ? "" : "disabled"}>Limpar</button><button class="primary" data-order-action="finish" ${orderCount(order) ? "" : "disabled"}>Concluir</button></div></section></div>`;
}
function renderOrderPicker() {
  return `<div class="sheet-backdrop"><section class="sheet picker-sheet"><div class="modal-head"><div><span class="eyebrow">PEDIDOS ABERTOS</span><h2>Selecionar pedido</h2></div><button class="ghost dark" id="close-picker">Fechar</button></div><div class="open-orders">${state.orders.map((o) => `<button class="open-order ${o.id === state.activeOrderId ? "active" : ""}" data-select-order="${o.id}"><span><strong>${esc(o.name || `Pedido ${o.number}`)}</strong><small>${orderCount(o)} unidades · ${euro(orderTotal(o))}</small></span>${o.id === state.activeOrderId ? "<b>✓</b>" : ""}</button>`).join("")}</div><form id="rename-form" class="rename-form"><input name="name" placeholder="Nome opcional (ex.: Mesa 1)"><button class="secondary">Atribuir ao pedido atual</button></form><button class="danger-button" id="delete-order">Eliminar pedido atual</button></section></div>`;
}
function renderNewOrderSheet() {
  return `<div class="sheet-backdrop"><section class="sheet new-order-sheet"><div class="modal-head"><div><span class="eyebrow">NOVO PEDIDO</span><h2>Como identificar?</h2></div><button class="ghost dark" id="close-new-order">Fechar</button></div><p class="note">Escolha Mesa, Nome ou crie um pedido sem identificação.</p><form id="new-order-form" class="new-order-form"><label><span>Mesa</span><input name="mesa" inputmode="numeric" placeholder="Número da mesa"></label><label><span>Nome</span><input name="name" placeholder="Ex.: João, Grupo A ou Balcão"></label><div class="new-order-buttons"><button class="secondary" name="anonymous" value="true" type="submit">Sem identificação</button><button class="primary" type="submit">Criar pedido identificado</button></div></form></section></div>`;
}
app.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "[data-order-action]",
  );
  if (!target || target.disabled) return;
  if (target.dataset.orderAction === "clear") {
    clearOrderId = activeOrder().id;
    orderPanel = false;
    render();
  }
  if (target.dataset.orderAction === "finish") finishOrder();
});
async function hashPin(pin: string) {
  const bytes = new TextEncoder().encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
function renderAdminGate() {
  return `<div class="sheet-backdrop"><section class="sheet admin-gate"><div class="modal-head"><div><span class="eyebrow">ACESSO LOCAL</span><h2>${state.adminPinHash ? "Entrar como administrador" : "Definir PIN de administrador"}</h2></div><button class="ghost dark" id="close-admin-gate">Fechar</button></div><p class="note">Este PIN protege apenas este dispositivo. Não substitui autenticação centralizada.</p><form id="pin-form"><input name="pin" type="password" inputmode="numeric" minlength="4" placeholder="PIN com pelo menos 4 dígitos" required>${state.adminPinHash ? "" : '<input name="confirm" type="password" inputmode="numeric" minlength="4" placeholder="Repetir PIN" required>'}<button class="primary full">${state.adminPinHash ? "Entrar" : "Guardar PIN"}</button></form></section></div>`;
}
function renderAdmin() {
  const category = state.catalog.categories.find(
    (c) => c.id === editingCategoryId,
  );
  const article = state.catalog.articles.find((a) => a.id === editingArticleId);
  return `<div class="admin-overlay"><section class="admin-panel"><div class="admin-head"><div><span class="eyebrow">MODO ADMINISTRADOR</span><h2>Gestão do catálogo</h2></div><div><button class="secondary" id="logout-admin">Encerrar sessão</button><button class="ghost dark" id="close-admin">Fechar</button></div></div><nav class="admin-tabs"><button class="${adminTab === "categories" ? "active" : ""}" data-admin-tab="categories">Categorias</button><button class="${adminTab === "articles" ? "active" : ""}" data-admin-tab="articles">Artigos</button><button class="${adminTab === "catalog" ? "active" : ""}" data-admin-tab="catalog">Catálogo</button></nav>${adminTab === "categories" ? renderAdminCategories(category) : adminTab === "articles" ? renderAdminArticles(article) : renderAdminCatalog()}</section></div>`;
}
function renderAdminCategories(editing?: Category) {
  return `<div class="admin-content"><form id="category-admin-form" class="admin-form"><h3>${editing ? "Editar categoria" : "Nova categoria"}</h3><input name="name" value="${esc(editing?.name ?? "")}" placeholder="Nome" required><input name="icon" value="${esc(editing?.icon ?? "✨")}" maxlength="2" placeholder="Ícone"><input name="color" type="color" value="${editing?.color ?? "#d9eee5"}"><div><button class="primary">${editing ? "Guardar alterações" : "Criar categoria"}</button>${editing ? '<button class="secondary" id="cancel-category" type="button">Cancelar</button>' : ""}</div></form><div class="admin-list">${state.catalog.categories
    .sort((a, b) => a.order - b.order)
    .map(
      (c, i) =>
        `<div class="admin-row"><span>${c.icon} <strong>${esc(c.name)}</strong><small>${c.active ? "Ativa" : "Inativa"}</small></span><div><button data-edit-cat="${c.id}">Editar</button><button data-move-cat="${c.id}" data-direction="up" ${i === 0 ? "disabled" : ""}>↑</button><button data-move-cat="${c.id}" data-direction="down" ${i === state.catalog.categories.length - 1 ? "disabled" : ""}>↓</button><button data-toggle-cat="${c.id}">${c.active ? "Desativar" : "Ativar"}</button><button class="danger-button" data-delete-cat="${c.id}">Eliminar</button></div></div>`,
    )
    .join("")}</div></div>`;
}
function renderAdminArticles(editing?: Article) {
  return `<div class="admin-content"><form id="article-admin-form" class="admin-form"><h3>${editing ? "Editar artigo" : "Novo artigo"}</h3><input name="name" value="${esc(editing?.name ?? "")}" placeholder="Nome" required><input name="icon" value="${esc(editing?.icon ?? "🍽️")}" maxlength="2" placeholder="Ícone"><input name="price" type="number" min="0" step="0.01" value="${editing?.priceCents === null || editing?.priceCents === undefined ? "" : (editing.priceCents / 100).toFixed(2)}" placeholder="Preço € (vazio = por definir)"><select name="category">${state.catalog.categories.map((c) => `<option value="${c.id}" ${editing?.categoryId === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select><div><button class="primary">${editing ? "Guardar alterações" : "Criar artigo"}</button>${editing ? '<button class="secondary" id="cancel-article" type="button">Cancelar</button>' : ""}</div></form><div class="admin-list">${state.catalog.articles
    .sort((a, b) => a.order - b.order)
    .map(
      (a) =>
        `<div class="admin-row"><span>${a.icon} <strong>${esc(a.name)}</strong><small>${priceLabel(a.priceCents)} · ${a.active ? "Ativo" : "Inativo"}</small></span><div><button data-edit-article="${a.id}">Editar</button><button data-toggle-article="${a.id}">${a.active ? "Desativar" : "Ativar"}</button><button class="danger-button" data-delete-article="${a.id}">Eliminar</button></div></div>`,
    )
    .join("")}</div></div>`;
}
function renderAdminCatalog() {
  return `<div class="admin-content"><h3>Distribuição do catálogo</h3><p class="note">Exporte o catálogo para o enviar manualmente para outros dispositivos. A importação preserva os pedidos abertos deste dispositivo.</p><div class="catalog-actions"><button class="primary" id="export-admin">Exportar catálogo</button><label class="secondary file">Importar e validar JSON<input id="import-admin" type="file" accept="application/json" hidden></label></div></div>`;
}
let saveRevision = 0;
async function persist() {
  const revision = ++saveRevision;
  try {
    await saveState(state);
    if (revision === saveRevision) render();
  } catch {
    alert(
      "Não foi possível guardar a alteração. Mantenha esta aplicação aberta e tente novamente.",
    );
  }
}
function changeLine(id: string, delta: number) {
  const order = activeOrder();
  const line = order.lines[id];
  if (!line) return;
  line.quantity += delta;
  if (line.quantity <= 0) delete order.lines[id];
  persist();
}
function createNewOrder(name: string, mesa: string) {
  const label = mesa.trim() ? `Mesa ${mesa.trim()}` : name.trim();
  if (
    label &&
    /^mesa\s+/i.test(label) &&
    state.orders.some(
      (o) =>
        (o.name || `Pedido ${o.number}`).toLocaleLowerCase() ===
        label.toLocaleLowerCase(),
    )
  ) {
    const existing = state.orders.find(
      (o) =>
        (o.name || `Pedido ${o.number}`).toLocaleLowerCase() ===
        label.toLocaleLowerCase(),
    )!;
    state.activeOrderId = existing.id;
    newOrderPanel = false;
    orderPicker = true;
    persist();
    alert(
      `${label} já tem um pedido aberto. Foi selecionado o pedido existente.`,
    );
    return;
  }
  const order = createOrder(
    Math.max(0, ...state.orders.map((o) => o.number)) + 1,
  );
  order.name = label;
  state.orders.push(order);
  state.activeOrderId = order.id;
  view = "categories";
  newOrderPanel = false;
  persist();
}
function finishOrder() {
  const order = activeOrder();
  if (!orderCount(order)) return;
  checkoutOrderId = order.id;
  orderPanel = false;
  render();
  // Synchronous focus in the tap handler opens the decimal keypad on iOS.
  document
    .querySelector<HTMLInputElement>("#amount-received")
    ?.focus({ preventScroll: true });
}
function renderCheckout() {
  const order = state.orders.find((o) => o.id === checkoutOrderId);
  if (!order) return "";
  return `<div class="sheet-backdrop"><section class="sheet checkout-sheet" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><div class="modal-head"><div><span class="eyebrow">${esc(order.name || `Pedido ${order.number}`)}</span><h2 id="checkout-title">Receber e concluir</h2></div><button class="ghost dark" id="cancel-checkout">Voltar</button></div><div class="checkout-total"><span>Total do pedido</span><strong>${euro(orderTotal(order))}</strong></div><form id="checkout-form"><label class="received-label" for="amount-received">Valor recebido</label><div class="received-field"><input id="amount-received" name="received" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" placeholder="0,00" aria-describedby="payment-hint" required><span aria-hidden="true">€</span></div><div class="change-box" id="change-box"><span id="change-label">Troco a entregar</span><output id="change-value" for="amount-received" aria-live="polite">—</output></div><p class="payment-hint" id="payment-hint">Introduza o valor recebido para calcular o troco.</p><button class="primary full" id="confirm-payment" disabled>Confirmar e concluir</button></form></section></div>`;
}
function updatePayment() {
  const order = state.orders.find((o) => o.id === checkoutOrderId);
  const input = document.querySelector<HTMLInputElement>("#amount-received");
  if (!input || !order) return;
  const received = eurosToCents(input.value);
  const due = orderTotal(order);
  const valid = received !== null && received >= due;
  document.querySelector<HTMLButtonElement>("#confirm-payment")!.disabled =
    !valid;
  document
    .querySelector("#change-box")!
    .classList.toggle("insufficient", received !== null && received < due);
  document.querySelector("#change-label")!.textContent =
    received !== null && received < due ? "Em falta" : "Troco a entregar";
  document.querySelector("#change-value")!.textContent =
    received === null ? "—" : euro(Math.abs(received - due));
  document.querySelector("#payment-hint")!.textContent =
    received === null
      ? "Introduza um valor em euros, com até duas casas decimais."
      : received < due
        ? "O valor recebido ainda não cobre o pedido."
        : "Entregue o troco e confirme para fechar apenas este pedido.";
}
function renderClearConfirmation() {
  const order = state.orders.find((o) => o.id === clearOrderId);
  if (!order) return "";
  return `<div class="sheet-backdrop"><section class="sheet confirmation-sheet" role="dialog" aria-modal="true" aria-label="Limpar pedido"><h2>Limpar ${esc(order.name || `Pedido ${order.number}`)}?</h2><p>Os artigos deste pedido serão removidos. Os outros pedidos mantêm-se.</p><div class="order-actions"><button class="secondary" id="cancel-clear">Cancelar</button><button class="primary" id="confirm-clear">Limpar pedido</button></div></section></div>`;
}
function deleteOrder() {
  if (state.orders.length === 1)
    return alert("Mantenha pelo menos um pedido aberto.");
  if (!confirm("Eliminar apenas o pedido atual?")) return;
  state.orders = state.orders.filter((o) => o.id !== state.activeOrderId);
  state.activeOrderId = state.orders[0].id;
  orderPicker = false;
  persist();
}
function exportCatalog() {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          version: 1,
          categories: state.catalog.categories,
          articles: state.catalog.articles,
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "catalogo-comissao-festas.json";
  link.click();
  URL.revokeObjectURL(link.href);
}
function wire() {
  document.querySelectorAll<HTMLElement>("[data-category]").forEach(
    (e) =>
      (e.onclick = () => {
        selectedCategory = e.dataset.category!;
        view = "articles";
        render();
      }),
  );
  document.querySelector("#back")?.addEventListener("click", () => {
    view = "categories";
    render();
  });
  document.querySelectorAll<HTMLElement>("[data-add]").forEach(
    (e) =>
      (e.onclick = () => {
        const item = state.catalog.articles.find((a) => a.id === e.dataset.add);
        if (item?.priceCents === null)
          return alert("Este artigo ainda não tem preço definido.");
        quantityArticle = item ?? null;
        quantity = 1;
        render();
      }),
  );
  document
    .querySelectorAll<HTMLElement>("[data-plus]")
    .forEach((e) => (e.onclick = () => changeLine(e.dataset.plus!, 1)));
  document
    .querySelectorAll<HTMLElement>("[data-minus]")
    .forEach((e) => (e.onclick = () => changeLine(e.dataset.minus!, -1)));
  document.querySelector("#quantity-plus")?.addEventListener("click", () => {
    quantity += 1;
    render();
  });
  document.querySelector("#quantity-minus")?.addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1);
    render();
  });
  document.querySelector("#close-sheet")?.addEventListener("click", () => {
    quantityArticle = null;
    render();
  });
  document.querySelector("#add-quantity")?.addEventListener("click", () => {
    const order = activeOrder();
    if (!quantityArticle || quantityArticle.priceCents === null) return;
    const old = order.lines[quantityArticle.id];
    order.lines[quantityArticle.id] = old
      ? { ...old, quantity: old.quantity + quantity }
      : {
          articleId: quantityArticle.id,
          name: quantityArticle.name,
          priceCents: quantityArticle.priceCents,
          icon: quantityArticle.icon,
          quantity,
        };
    quantityArticle = null;
    persist();
  });
  document.querySelector("#view-order")?.addEventListener("click", () => {
    orderPanel = true;
    render();
  });
  document.querySelector("#close-order")?.addEventListener("click", () => {
    orderPanel = false;
    render();
  });
  document.querySelector("#order-picker")?.addEventListener("click", () => {
    orderPicker = true;
    render();
  });
  document.querySelector("#close-picker")?.addEventListener("click", () => {
    orderPicker = false;
    render();
  });
  document.querySelector("#new-order")?.addEventListener("click", () => {
    newOrderPanel = true;
    render();
  });
  document.querySelector("#close-new-order")?.addEventListener("click", () => {
    newOrderPanel = false;
    render();
  });
  document.querySelector("#new-order-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget as HTMLFormElement);
    createNewOrder(
      String(data.get("name") ?? ""),
      String(data.get("mesa") ?? ""),
    );
  });
  document.querySelectorAll<HTMLElement>("[data-select-order]").forEach(
    (e) =>
      (e.onclick = () => {
        state.activeOrderId = e.dataset.selectOrder!;
        orderPicker = false;
        view = "categories";
        persist();
      }),
  );
  document
    .querySelector("#delete-order")
    ?.addEventListener("click", deleteOrder);
  document.querySelector("#rename-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget as HTMLFormElement);
    const name = String(data.get("name") ?? "").trim();
    if (name) activeOrder().name = name;
    persist();
  });
  document
    .querySelector("#amount-received")
    ?.addEventListener("input", updatePayment);
  document.querySelector("#cancel-checkout")?.addEventListener("click", () => {
    checkoutOrderId = null;
    orderPanel = true;
    render();
  });
  document.querySelector("#checkout-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const order = state.orders.find((o) => o.id === checkoutOrderId);
    const received = eurosToCents(
      document.querySelector<HTMLInputElement>("#amount-received")?.value ?? "",
    );
    if (!order || received === null || received < orderTotal(order)) return;
    state.orders = state.orders.filter((o) => o.id !== checkoutOrderId);
    if (!state.orders.length) state.orders.push(createOrder(order.number + 1));
    state.activeOrderId = state.orders[0].id;
    checkoutOrderId = null;
    persist();
  });
  document.querySelector("#cancel-clear")?.addEventListener("click", () => {
    clearOrderId = null;
    orderPanel = true;
    render();
  });
  document.querySelector("#confirm-clear")?.addEventListener("click", () => {
    const order = state.orders.find((o) => o.id === clearOrderId);
    if (order) order.lines = {};
    clearOrderId = null;
    orderPanel = true;
    persist();
  });
  document.querySelector("#settings")?.addEventListener("click", () => {
    if (adminAuthenticated) {
      adminMode = true;
      render();
    } else {
      adminGate = true;
      render();
    }
  });
  document.querySelector("#close-admin-gate")?.addEventListener("click", () => {
    adminGate = false;
    render();
  });
  document.querySelector("#pin-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const pin = String(data.get("pin"));
    if (pin.length < 4) return;
    if (!state.adminPinHash) {
      if (pin !== String(data.get("confirm")))
        return alert("Os PINs não coincidem.");
      state.adminPinHash = await hashPin(pin);
      adminAuthenticated = true;
      adminGate = false;
      adminMode = true;
      persist();
    } else if ((await hashPin(pin)) === state.adminPinHash) {
      adminAuthenticated = true;
      adminGate = false;
      adminMode = true;
      render();
    } else alert("PIN incorreto.");
  });
  if (adminMode) wireAdmin();
}
function wireAdmin() {
  document.querySelectorAll<HTMLElement>("[data-admin-tab]").forEach(
    (e) =>
      (e.onclick = () => {
        adminTab = e.dataset.adminTab as typeof adminTab;
        editingCategoryId = "";
        editingArticleId = "";
        render();
      }),
  );
  document.querySelector("#close-admin")?.addEventListener("click", () => {
    adminMode = false;
    adminAuthenticated = false;
    render();
  });
  document.querySelector("#logout-admin")?.addEventListener("click", () => {
    adminMode = false;
    adminAuthenticated = false;
    render();
  });
  document.querySelectorAll<HTMLElement>("[data-edit-cat]").forEach(
    (e) =>
      (e.onclick = () => {
        editingCategoryId = e.dataset.editCat!;
        render();
      }),
  );
  document.querySelector("#cancel-category")?.addEventListener("click", () => {
    editingCategoryId = "";
    render();
  });
  document
    .querySelector("#category-admin-form")
    ?.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const d = new FormData(form);
      const id = editingCategoryId;
      if (id) {
        const c = state.catalog.categories.find((x) => x.id === id)!;
        c.name = String(d.get("name"));
        c.icon = String(d.get("icon") || "✨");
        c.color = String(d.get("color"));
      } else
        state.catalog.categories.push({
          id: uid(),
          name: String(d.get("name")),
          icon: String(d.get("icon") || "✨"),
          color: String(d.get("color") || "#d9eee5"),
          active: true,
          order: state.catalog.categories.length,
        });
      editingCategoryId = "";
      persist();
    });
  document.querySelectorAll<HTMLElement>("[data-toggle-cat]").forEach(
    (e) =>
      (e.onclick = () => {
        state.catalog.categories.find(
          (x) => x.id === e.dataset.toggleCat,
        )!.active = !state.catalog.categories.find(
          (x) => x.id === e.dataset.toggleCat,
        )!.active;
        persist();
      }),
  );
  document.querySelectorAll<HTMLElement>("[data-delete-cat]").forEach(
    (e) =>
      (e.onclick = () => {
        if (
          confirm(
            "Eliminar esta categoria? Os artigos existentes serão mantidos inativos.",
          )
        ) {
          const id = e.dataset.deleteCat!;
          state.catalog.categories = state.catalog.categories.filter(
            (c) => c.id !== id,
          );
          state.catalog.articles = state.catalog.articles.map((a) =>
            a.categoryId === id ? { ...a, active: false } : a,
          );
          persist();
        }
      }),
  );
  document.querySelectorAll<HTMLElement>("[data-move-cat]").forEach(
    (e) =>
      (e.onclick = () => {
        const list = state.catalog.categories.sort((a, b) => a.order - b.order);
        const i = list.findIndex((c) => c.id === e.dataset.moveCat);
        const j = e.dataset.direction === "up" ? i - 1 : i + 1;
        if (list[j])
          [list[i].order, list[j].order] = [list[j].order, list[i].order];
        persist();
      }),
  );
  document.querySelectorAll<HTMLElement>("[data-edit-article]").forEach(
    (e) =>
      (e.onclick = () => {
        editingArticleId = e.dataset.editArticle!;
        render();
      }),
  );
  document.querySelector("#cancel-article")?.addEventListener("click", () => {
    editingArticleId = "";
    render();
  });
  document
    .querySelector("#article-admin-form")
    ?.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const d = new FormData(form);
      const price = String(d.get("price") ?? "").trim();
      const payload = {
        name: String(d.get("name")),
        icon: String(d.get("icon") || "🍽️"),
        categoryId: String(d.get("category")),
        priceCents: price ? Math.round(Number(price) * 100) : null,
      };
      if (editingArticleId)
        Object.assign(
          state.catalog.articles.find((a) => a.id === editingArticleId)!,
          payload,
        );
      else
        state.catalog.articles.push({
          id: uid(),
          ...payload,
          active: true,
          order: state.catalog.articles.length,
        });
      editingArticleId = "";
      persist();
    });
  document.querySelectorAll<HTMLElement>("[data-toggle-article]").forEach(
    (e) =>
      (e.onclick = () => {
        const a = state.catalog.articles.find(
          (x) => x.id === e.dataset.toggleArticle,
        )!;
        a.active = !a.active;
        persist();
      }),
  );
  document.querySelectorAll<HTMLElement>("[data-delete-article]").forEach(
    (e) =>
      (e.onclick = () => {
        if (confirm("Eliminar este artigo?")) {
          state.catalog.articles = state.catalog.articles.filter(
            (a) => a.id !== e.dataset.deleteArticle,
          );
          persist();
        }
      }),
  );
  document
    .querySelector("#export-admin")
    ?.addEventListener("click", exportCatalog);
  document
    .querySelector("#import-admin")
    ?.addEventListener("change", importCatalog);
}
function importCatalog(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data: unknown = JSON.parse(String(reader.result));
      if (!validCatalog(data)) throw new Error();
      if (
        !confirm(
          `Aplicar catálogo com ${data.categories.length} categorias e ${data.articles.length} artigos? Os pedidos serão preservados.`,
        )
      )
        return;
      state.catalog = data;
      persist();
    } catch {
      alert("Ficheiro inválido. Os pedidos abertos foram preservados.");
    }
  };
  reader.readAsText(file);
}
async function boot() {
  state = await loadState(seedCatalog());
  render();
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    const alreadyControlled = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        if (alreadyControlled) void flushState().then(() => location.reload());
      },
      { once: true },
    );
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: "none" })
      .catch(() => {});
  }
}
function fitVisualViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return;
  document.documentElement.style.setProperty(
    "--visual-height",
    `${viewport.height}px`,
  );
  document.documentElement.style.setProperty(
    "--visual-top",
    `${viewport.offsetTop}px`,
  );
  document.documentElement.classList.toggle(
    "keyboard-open",
    viewport.height < innerHeight * 0.78,
  );
}
window.visualViewport?.addEventListener("resize", fitVisualViewport);
window.visualViewport?.addEventListener("scroll", fitVisualViewport);
fitVisualViewport();
void boot().catch(() => {
  app.innerHTML = '<section class="sheet"><h2>Não foi possível abrir os dados</h2><p>Os dados existentes não foram substituídos. Volte a abrir a aplicação para tentar novamente.</p><button class="primary" id="retry-load">Tentar novamente</button></section>';
  document.querySelector('#retry-load')?.addEventListener('click', () => location.reload());
});
