/**
 * Florella: filtros, búsqueda, favoritos y carrito de demostración.
 * Sin librerías ni peticiones externas. Los datos se guardan en este navegador.
 * No confirma pedidos, no cobra y no descuenta inventario.
 */
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const money = (value) => new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(value);
  const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const cards = $$('[data-product]');
  const products = cards.map((card, index) => ({
    id: card.dataset.id,
    name: card.dataset.name,
    price: Number(card.dataset.price),
    occasions: (card.dataset.occasions || '').split('|'),
    image: card.querySelector('img').getAttribute('src'),
    index,
    card,
  }));
  const productById = new Map(products.map((product) => [product.id, product]));
  const state = { occasion: 'Todas', maxPrice: 2500, query: '', order: 'featured', favoritesOnly: false };
  const CART_KEY = 'florella-cart-v1';
  const FAVORITES_KEY = 'florella-favorites-v1';

  // Safari privado, navegadores restrictivos o datos dañados no deben romper el sitio.
  function readStored(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  }
  function writeStored(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* El carrito sigue funcionando en memoria durante esta visita. */ }
  }
  const storedCart = readStored(CART_KEY, []);
  const cart = new Map();
  if (Array.isArray(storedCart)) {
    storedCart.forEach((item) => {
      if (item && productById.has(item.id) && Number.isSafeInteger(item.quantity) && item.quantity > 0) {
        cart.set(item.id, Math.min(item.quantity, 99));
      }
    });
  }
  const storedFavorites = readStored(FAVORITES_KEY, []);
  const favorites = new Set(Array.isArray(storedFavorites) ? storedFavorites.filter((id) => productById.has(id)) : []);

  let toastTimer;
  function notify(text) {
    const toast = $('#toast');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.querySelector('span').textContent = text;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function applyFilters() {
    const ordered = [...products].sort((a, b) => {
      if (state.order === 'price-asc') return a.price - b.price;
      if (state.order === 'price-desc') return b.price - a.price;
      if (state.order === 'name') return a.name.localeCompare(b.name, 'es');
      return a.index - b.index;
    });
    const query = normalize(state.query);
    let shown = 0;
    ordered.forEach((product) => {
      const matches = (state.occasion === 'Todas' || product.occasions.includes(state.occasion))
        && product.price <= state.maxPrice
        && (!query || normalize(product.name + ' ' + product.occasions.join(' ')).includes(query))
        && (!state.favoritesOnly || favorites.has(product.id));
      product.card.hidden = !matches;
      const grid = $('#product-grid');
      if (grid) grid.append(product.card);
      if (matches) shown += 1;
    });
    $$('[data-occasion]').forEach((button) => {
      const active = button.dataset.occasion === state.occasion;
      button.dataset.active = String(active);
      button.setAttribute('aria-pressed', String(active));
    });
    const maxPriceLabel = $('#max-price-label');
    if (maxPriceLabel) maxPriceLabel.textContent = money(state.maxPrice);
    const maxPriceEl = $('#max-price');
    if (maxPriceEl) maxPriceEl.style.setProperty('--range-fill', (state.maxPrice / 2500 * 100) + '%');
    const resultsCount = $('#results-count');
    if (resultsCount) resultsCount.textContent = shown + (shown === 1 ? ' arreglo' : ' arreglos') + (state.favoritesOnly ? ' en favoritos' : '');
    const resultsBar = $('#results-bar');
    if (resultsBar) resultsBar.hidden = state.occasion === 'Todas' && state.maxPrice === 2500 && !query && !state.favoritesOnly && state.order === 'featured';
    const emptyProducts = $('#empty-products');
    if (emptyProducts) emptyProducts.hidden = shown > 0;
    const favToggleState = $('#favorites-toggle');
    if (favToggleState) favToggleState.setAttribute('aria-pressed', String(state.favoritesOnly));
    if (favToggleState) favToggleState.setAttribute('aria-label', state.favoritesOnly ? 'Mostrar todo el catálogo' : 'Ver mis favoritos');
  }

  function resetFilters() {
    Object.assign(state, { occasion: 'Todas', maxPrice: 2500, query: '', order: 'featured', favoritesOnly: false });
    $('#search-input').value = '';
    const maxPriceInput = $('#max-price');
    if (maxPriceInput) maxPriceInput.value = '2500';
    const sortReset = $('#sort');
    if (sortReset) sortReset.value = 'featured';
    applyFilters();
  }
  $$('[data-occasion]').forEach((button) => button.addEventListener('click', () => {
    state.occasion = button.dataset.occasion;
    applyFilters();
  }));
  const maxPriceRange = $('#max-price');
  if (maxPriceRange) maxPriceRange.addEventListener('input', (event) => {
    state.maxPrice = Number(event.target.value);
    applyFilters();
  });
  const sortEl = $('#sort');
  if (sortEl) sortEl.addEventListener('change', (event) => {
    state.order = event.target.value;
    applyFilters();
  });
  const searchInput = $('#search-input');
  if (searchInput) searchInput.addEventListener('input', (event) => {
    state.query = event.target.value;
    applyFilters();
  });
  const clearFilters = $('#clear-filters');
  if (clearFilters) clearFilters.addEventListener('click', resetFilters);
  const resetEmpty = $('#reset-empty');
  if (resetEmpty) resetEmpty.addEventListener('click', resetFilters);
  const openSearch = $('#open-search');
  if (openSearch) openSearch.addEventListener('click', () => {
    const panel = $('#search-panel');
    panel.hidden = !panel.hidden;
    $('#open-search').setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) $('#search-input').focus();
  });
  function closeSearch() {
    $('#search-panel').hidden = true;
    $('#open-search').setAttribute('aria-expanded', 'false');
    $('#search-input').value = '';
    state.query = '';
    applyFilters();
    $('#open-search').focus();
  }
  const closeSearchBtn = $('#close-search');
  if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeSearch);
  if (searchInput) searchInput.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeSearch(); });

  function renderFavorites() {
    $$('[data-favorite]').forEach((button) => {
      const active = favorites.has(button.dataset.favorite);
      const product = productById.get(button.dataset.favorite);
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', (active ? 'Quitar ' : 'Guardar ') + product.name + (active ? ' de favoritos' : ' en favoritos'));
    });
  }
  $$('[data-favorite]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.favorite;
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    writeStored(FAVORITES_KEY, [...favorites]);
    renderFavorites();
    applyFilters();
  }));
  const favToggle = $('#favorites-toggle');
  if (favToggle) favToggle.addEventListener('click', () => {
    state.favoritesOnly = !state.favoritesOnly;
    applyFilters();
    const catalogoEl = $('#catalogo');
    if (catalogoEl) catalogoEl.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });

  // Un teléfono vacío o inválido mantiene desactivado el contacto comercial.
  const whatsapp = String(window.FLORELLA_CONFIG?.whatsapp || '').replace(/\D/g, '');
  const whatsappReady = /^[1-9]\d{9,14}$/.test(whatsapp);

  function renderCart() {
    const list = $('#cart-items');
    if (!list) return;
    list.replaceChildren();
    let total = 0;
    let count = 0;
    cart.forEach((quantity, id) => {
      const product = productById.get(id);
      if (!product) return;
      count += quantity;
      total += product.price * quantity;
      const row = $('#cart-item-template').content.firstElementChild.cloneNode(true);
      row.dataset.cartItem = id;
      row.querySelector('img').src = product.image;
      row.querySelector('img').alt = product.name;
      row.querySelector('h3').textContent = product.name;
      row.querySelector('[data-cart-price]').textContent = money(product.price) + ' MXN';
      row.querySelector('[data-quantity]').textContent = String(quantity);
      const labels = { decrease: 'Disminuir ', increase: 'Aumentar ', remove: 'Eliminar ' };
      row.querySelectorAll('[data-cart-action]').forEach((button) => {
        button.dataset.id = id;
        button.setAttribute('aria-label', labels[button.dataset.cartAction] + product.name);
        if (button.dataset.cartAction === 'increase') button.disabled = quantity >= 99;
      });
      list.append(row);
    });
    $('[data-cart-count]').textContent = String(count);
    $('[data-open-dialog="cart-dialog"]').setAttribute('aria-label', 'Abrir carrito, ' + count + (count === 1 ? ' producto' : ' productos'));
    $('#cart-total').textContent = money(total) + ' MXN';
    $('#empty-cart').hidden = count > 0;
    $('#cart-summary').hidden = count === 0;
    $('#checkout').disabled = count === 0 || !whatsappReady;
    writeStored(CART_KEY, [...cart].map(([id, quantity]) => ({ id, quantity })));
  }
  $$('[data-add]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.add;
    const current = cart.get(id) || 0;
    if (current >= 99) { notify('El máximo es de 99 unidades por arreglo.'); return; }
    cart.set(id, current + 1);
    renderCart();
    notify(productById.get(id).name + ' se agregó a tu carrito.');
  }));
  const cartItems = $('#cart-items');
  if (cartItems) cartItems.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.cartAction;
    const quantity = cart.get(id) || 0;
    if (action === 'remove' || (action === 'decrease' && quantity <= 1)) cart.delete(id);
    else if (action === 'decrease') cart.set(id, quantity - 1);
    else if (action === 'increase' && quantity < 99) cart.set(id, quantity + 1);
    renderCart();
    // Conserva el foco de teclado después de volver a dibujar la cantidad.
    const next = Array.from($('#cart-items').querySelectorAll('[data-cart-action]')).find((item) => item.dataset.id === id && item.dataset.cartAction === action);
    (next || $('#cart-dialog').querySelector('[data-close-dialog]')).focus();
  });

  $$('[data-open-dialog]').forEach((button) => button.addEventListener('click', () => {
    const dialog = document.getElementById(button.dataset.openDialog);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('overflow-hidden');
  }));
  $$('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
  $$('[data-close-and-browse]').forEach((link) => link.addEventListener('click', () => link.closest('dialog').close()));
  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('close', () => { if (!$('dialog[open]')) document.body.classList.remove('overflow-hidden'); });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });

  function openWhatsApp(message) {
    if (!whatsappReady) return;
    // Abre una conversación; la persona revisa y envía el mensaje por su cuenta.
    window.open('https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
  }
  const checkoutBtn = $('#checkout');
  if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
    if (!cart.size || !whatsappReady) return;
    const lines = ['Hola, Florella. Me gustaría consultar disponibilidad para este pedido:', ''];
    let subtotal = 0;
    cart.forEach((quantity, id) => {
      const product = productById.get(id);
      subtotal += product.price * quantity;
      lines.push(quantity + ' × ' + product.name + ' — ' + money(quantity * product.price) + ' MXN');
    });
    lines.push('', 'Subtotal: ' + money(subtotal) + ' MXN', '¿Me ayudan a confirmar entrega, disponibilidad y total?');
    openWhatsApp(lines.join('\n'));
  });
  if (whatsappReady) {
    const contactWaBtn = $('#contact-whatsapp');
    if (contactWaBtn) contactWaBtn.disabled = false;
    const contactCopy = $('#contact-copy');
    if (contactCopy) contactCopy.textContent = '¿Buscas algo especial? Escríbenos y cuéntanos qué te gustaría regalar. Te ayudamos a encontrar el detalle.';
    const contactDemoNote = $('#contact-demo-note');
    if (contactDemoNote) contactDemoNote.hidden = true;
    const checkoutNote = $('#checkout-note');
    if (checkoutNote) checkoutNote.textContent = 'Se abrirá WhatsApp con tu lista. El pedido se confirma directamente con la florería; aquí no se realizan cobros.';
  }
  const contactWa2 = $('#contact-whatsapp');
  if (contactWa2) contactWa2.addEventListener('click', () => openWhatsApp('Hola, Florella. Me gustaría información sobre sus arreglos.'));




  renderFavorites();
  renderCart();
  applyFilters();
})();
