/**
 * Florella: filtros, búsqueda, favoritos y carrito.
 * Sin librerías ni peticiones externas. Los datos se guardan en este navegador.
 * El pedido se envía por WhatsApp; aquí no se cobra ni se descuenta inventario.
 */
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const money = (value) => new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(value);

  const cards = $$('[data-product]');
  const products = cards.map((card, index) => {
    const img = card.querySelector('img');
    return {
      id: card.dataset.id,
      name: card.dataset.name,
      price: Number(card.dataset.price),
      occasions: (card.dataset.occasions || '').split('|'),
      image: img ? img.getAttribute('src') : '',
      index,
      card,
    };
  });
  const productById = new Map(products.map((product) => [product.id, product]));
  // Filtro de precio: el tope lo define la página (atributo max del slider).
  const maxPriceInputEl = $('#max-price');
  const precioMax = maxPriceInputEl ? Number(maxPriceInputEl.max) || 2500 : 2500;
  const hasPriceFilter = !!maxPriceInputEl;
  const state = {
    occasion: 'Todas',
    maxPrice: maxPriceInputEl ? Number(maxPriceInputEl.value) || precioMax : precioMax,
    order: 'price-desc',
    favoritesOnly: false,
  };
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

  // El carrito guarda los datos de cada producto para sobrevivir entre páginas.
  const storedCart = readStored(CART_KEY, []);
  const cart = new Map();
  if (Array.isArray(storedCart)) {
    storedCart.forEach((item) => {
      if (!item || !item.id) return;
      const qty = Number.isSafeInteger(item.qty) ? item.qty : (Number.isSafeInteger(item.quantity) ? item.quantity : 0);
      if (qty <= 0) return;
      const known = productById.get(item.id);
      cart.set(item.id, {
        id: item.id,
        name: item.name || (known ? known.name : 'Arreglo'),
        price: Number.isFinite(Number(item.price)) ? Number(item.price) : (known ? known.price : 0),
        image: (known ? known.image : '') || item.image || '',
        qty: Math.min(qty, 99),
      });
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
    let shown = 0;
    ordered.forEach((product) => {
      const matches = (state.occasion === 'Todas' || product.occasions.includes(state.occasion))
        && (!hasPriceFilter || product.price <= state.maxPrice)
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
    if (maxPriceInputEl) maxPriceInputEl.style.setProperty('--range-fill', (state.maxPrice / precioMax * 100) + '%');
    const resultsCount = $('#results-count');
    if (resultsCount) resultsCount.textContent = shown + (shown === 1 ? ' arreglo' : ' arreglos') + (state.favoritesOnly ? ' en favoritos' : '');
    const resultsBar = $('#results-bar');
    if (resultsBar) resultsBar.hidden = state.occasion === 'Todas' && state.maxPrice === precioMax && !state.favoritesOnly && state.order === 'price-desc';
    const emptyProducts = $('#empty-products');
    if (emptyProducts) emptyProducts.hidden = shown > 0;
    const favToggleState = $('#favorites-toggle');
    if (favToggleState) favToggleState.setAttribute('aria-pressed', String(state.favoritesOnly));
    if (favToggleState) favToggleState.setAttribute('aria-label', state.favoritesOnly ? 'Mostrar todo el catálogo' : 'Ver mis favoritos');
  }

  function resetFilters() {
    Object.assign(state, { occasion: 'Todas', maxPrice: precioMax, order: 'price-desc', favoritesOnly: false });
    if (maxPriceInputEl) maxPriceInputEl.value = String(precioMax);
    const sortReset = $('#sort');
    if (sortReset) sortReset.value = 'price-desc';
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
  const clearFilters = $('#clear-filters');
  if (clearFilters) clearFilters.addEventListener('click', resetFilters);
  const resetEmpty = $('#reset-empty');
  if (resetEmpty) resetEmpty.addEventListener('click', resetFilters);

  function renderFavorites() {
    $$('[data-favorite]').forEach((button) => {
      const active = favorites.has(button.dataset.favorite);
      const product = productById.get(button.dataset.favorite);
      const name = product ? product.name : 'este arreglo';
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', (active ? 'Quitar ' : 'Guardar ') + name + (active ? ' de favoritos' : ' en favoritos'));
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
  const orderWhatsapp = String(window.FLORELLA_CONFIG?.orderWhatsapp || whatsapp || '').replace(/\D/g, '');
  const orderReady = /^[1-9]\d{9,14}$/.test(orderWhatsapp);

  function renderCart() {
    const list = $('#cart-items');
    let total = 0;
    let count = 0;
    if (list) {
      list.replaceChildren();
      cart.forEach((item) => {
        count += item.qty;
        total += item.price * item.qty;
        const template = $('#cart-item-template');
        if (!template) return;
        const row = template.content.firstElementChild.cloneNode(true);
        row.dataset.cartItem = item.id;
        row.querySelector('img').src = item.image;
        row.querySelector('img').alt = item.name;
        row.querySelector('h3').textContent = item.name;
        row.querySelector('[data-cart-price]').textContent = money(item.price) + ' MXN';
        row.querySelector('[data-quantity]').textContent = String(item.qty);
        const labels = { decrease: 'Disminuir ', increase: 'Aumentar ', remove: 'Eliminar ' };
        row.querySelectorAll('[data-cart-action]').forEach((button) => {
          button.dataset.id = item.id;
          button.setAttribute('aria-label', labels[button.dataset.cartAction] + item.name);
          if (button.dataset.cartAction === 'increase') button.disabled = item.qty >= 99;
        });
        list.append(row);
      });
    } else {
      cart.forEach((item) => { count += item.qty; total += item.price * item.qty; });
    }
    const badge = $('[data-cart-count]');
    if (badge) badge.textContent = String(count);
    const continueOrder = $('#continue-order');
    if (continueOrder) continueOrder.hidden = count === 0;
    const floatingOrder = $('#floating-order');
    if (floatingOrder) floatingOrder.hidden = count > 0;
    const cartButton = $('[data-open-dialog="cart-dialog"]');
    if (cartButton) cartButton.setAttribute('aria-label', 'Abrir carrito, ' + count + (count === 1 ? ' producto' : ' productos'));
    const cartTotal = $('#cart-total');
    if (cartTotal) cartTotal.textContent = money(total) + ' MXN';
    const emptyCart = $('#empty-cart');
    if (emptyCart) emptyCart.hidden = count > 0;
    const subtotalEl = $('#cart-subtotal');
    if (subtotalEl) subtotalEl.hidden = count === 0;
    writeStored(CART_KEY, [...cart.values()].map((item) => ({ id: item.id, name: item.name, price: item.price, image: item.image, qty: item.qty })));
  }

  function addToCart(id, fallback) {
    const known = productById.get(id);
    const existing = cart.get(id);
    const qty = existing ? existing.qty : 0;
    if (qty >= 99) { notify('El máximo es de 99 unidades por arreglo.'); return; }
    const base = existing || {
      id,
      name: (fallback && fallback.name) || (known ? known.name : 'Arreglo'),
      price: (fallback && Number(fallback.price)) || (known ? known.price : 0),
      image: (fallback && fallback.image) || (known ? known.image : ''),
      qty: 0,
    };
    base.qty = qty + 1;
    cart.set(id, base);
    renderCart();
    notify(base.name + ' se agregó a tu carrito.');
  }
  $$('[data-add]').forEach((button) => button.addEventListener('click', () => {
    addToCart(button.dataset.add, {
      name: button.dataset.name,
      price: button.dataset.price,
      image: button.dataset.image,
    });
  }));

  // Ficha del arreglo: se abre al tocar la foto.
  const productDialog = $('#product-dialog');
  function openProductDialog(card) {
    if (!productDialog || !card) return;
    const img = card.querySelector('img');
    const imagen = img ? img.getAttribute('src') || '' : '';
    const nombre = card.dataset.name || 'Arreglo';
    const precio = Number(card.dataset.price) || 0;
    const descripcion = (card.dataset.description || '').trim();
    productDialog.querySelector('[data-product-image]').src = imagen;
    productDialog.querySelector('[data-product-image]').alt = nombre;
    productDialog.querySelector('[data-product-name]').textContent = nombre;
    productDialog.querySelector('[data-product-price]').textContent = money(precio) + ' MXN';
    const descEl = productDialog.querySelector('[data-product-description]');
    descEl.textContent = descripcion;
    descEl.hidden = !descripcion;
    const add = productDialog.querySelector('[data-add-product]');
    add.dataset.id = card.dataset.id || '';
    add.dataset.name = nombre;
    add.dataset.price = String(precio);
    add.dataset.image = imagen;
    if (!productDialog.open) productDialog.showModal();
    document.body.classList.add('overflow-hidden');
  }
  document.addEventListener('click', (event) => {
    const opener = event.target.closest ? event.target.closest('[data-open-product]') : null;
    if (opener) openProductDialog(opener.closest('[data-product]'));
  });
  const addFromDialog = productDialog && productDialog.querySelector('[data-add-product]');
  if (addFromDialog) addFromDialog.addEventListener('click', () => {
    addToCart(addFromDialog.dataset.id, {
      name: addFromDialog.dataset.name,
      price: addFromDialog.dataset.price,
      image: addFromDialog.dataset.image,
    });
    productDialog.close();
  });

  const cartItems = $('#cart-items');
  if (cartItems) cartItems.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.cartAction;
    const item = cart.get(id);
    if (!item) return;
    const quantity = item.qty;
    if (action === 'remove' || (action === 'decrease' && quantity <= 1)) cart.delete(id);
    else if (action === 'decrease') item.qty = quantity - 1;
    else if (action === 'increase' && quantity < 99) item.qty = quantity + 1;
    renderCart();
    // Conserva el foco de teclado después de volver a dibujar la cantidad.
    const next = Array.from($('#cart-items').querySelectorAll('[data-cart-action]')).find((el) => el.dataset.id === id && el.dataset.cartAction === action);
    (next || $('#cart-dialog').querySelector('[data-close-dialog]')).focus();
  });

  $$('[data-open-dialog]').forEach((button) => button.addEventListener('click', () => {
    const dialog = document.getElementById(button.dataset.openDialog);
    if (!dialog) return;
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

  function openWhatsAppTo(number, message) {
    if (!/^[1-9]\d{9,14}$/.test(number)) return;
    window.open('https://wa.me/' + number + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
  }
  function openWhatsApp(message) { openWhatsAppTo(whatsapp, message); }

  // Solicitud de ofrenda: carrito + formulario -> WhatsApp.
  const orderForm = $('#order-form');
  const deliveryDate = orderForm?.elements.namedItem('fechaEntrega');
  if (deliveryDate && !deliveryDate.value) {
    const today = new Date();
    deliveryDate.value = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  }
  if (orderForm) orderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!orderReady) { notify('Falta configurar el número de WhatsApp del pedido.'); return; }
    const data = new FormData(orderForm);
    const val = (key) => String(data.get(key) || '').trim();
    const lines = ['Hola, quiero solicitar una ofrenda:', ''];
    let subtotal = 0;
    cart.forEach((item) => {
      subtotal += item.price * item.qty;
      lines.push(item.qty + ' × ' + item.name + ' — ' + money(item.price * item.qty) + ' MXN');
    });
    if (cart.size) lines.push('', 'Subtotal: ' + money(subtotal) + ' MXN');
    lines.push('', 'Datos de entrega:');
    const campos = [
      ['Fecha de entrega', val('fechaEntrega')],
      ['Rango de horario', val('rangoHorario')],
      ['Nombre de la persona fallecida (+)', val('fallecido')],
      ['Dirección de envío o Capillas', val('direccion')],
      ['Referencia o entrecalles', val('referencia')],
      ['Texto en listón', val('liston')],
      ['Teléfono de contacto', val('telefono')],
      ['Rango de horario de servicio/entrega', val('horarioServicio')],
      ['Foto de la ofrenda y combinación de colores', val('fotoColores')],
    ];
    campos.forEach(([label, value]) => { if (value) lines.push(label + ': ' + value); });
    lines.push('', 'Enviaré la foto de referencia por este chat.');
    openWhatsAppTo(orderWhatsapp, lines.join('\n'));
  });

  if (whatsappReady) {
    const contactWaBtn = $('#contact-whatsapp');
    if (contactWaBtn) contactWaBtn.disabled = false;
    const contactCopy = $('#contact-copy');
    if (contactCopy) contactCopy.textContent = '¿Buscas algo especial? Escríbenos y cuéntanos qué te gustaría regalar. Te ayudamos a encontrar el detalle.';
    const contactDemoNote = $('#contact-demo-note');
    if (contactDemoNote) contactDemoNote.hidden = true;
  }
  const contactWa2 = $('#contact-whatsapp');
  if (contactWa2) contactWa2.addEventListener('click', () => openWhatsApp('Hola, Florella. Me gustaría información sobre sus arreglos.'));

  renderFavorites();
  renderCart();
  applyFilters();
})();
