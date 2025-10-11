/* ============================================================
   PARCHE: Fallback de "Agregar" → Mini-carrito
   (solo actúa si el listener original no corrió)
============================================================ */
(function addToCartFallback(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  const KEY = 'cartItems';
  const currency = n => `S/ ${Number(n || 0).toFixed(2)}`;

  const cartBtn     = $('.navbar .btn.position-relative');
  const badge       = cartBtn ? $('.badge', cartBtn) : null;
  const list        = $('#cartList');
  const subtotalEl  = $('#cartSubtotal');
  const offcanvasEl = $('#miniCart');

  // Helpers del fallback (idénticos a tu script.js)
  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  };
  const save = (cart) => localStorage.setItem(KEY, JSON.stringify(cart));
  const countItems = (cart) => cart.reduce((s, i) => s + (i.qty || 0), 0);
  const subtotal   = (cart) => cart.reduce((s, i) => s + i.price * i.qty, 0);

  const render = (cart) => {
    if (badge)      badge.textContent = countItems(cart);
    if (subtotalEl) subtotalEl.textContent = currency(subtotal(cart));
    if (!list) return;

    list.innerHTML = '';
    if (cart.length === 0) {
      list.innerHTML = `<li class="list-group-item text-center py-4 text-muted">Tu carrito está vacío</li>`;
      return;
    }
    cart.forEach(item => {
      list.insertAdjacentHTML('beforeend', `
        <li class="list-group-item d-flex align-items-center gap-2">
          <img class="thumb" src="${item.image}" alt="${item.title}">
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start">
              <strong class="small">${item.title}</strong>
              <button class="btn-close btn-close-white remove" data-id="${item.id}" aria-label="Eliminar"></button>
            </div>
            <div class="d-flex align-items-center gap-2 mt-2">
              <div class="btn-group btn-group-sm" role="group" aria-label="Cantidad">
                <button class="btn btn-outline-light qty-btn dec" data-id="${item.id}">−</button>
                <span class="px-2">${item.qty}</span>
                <button class="btn btn-outline-light qty-btn inc" data-id="${item.id}">+</button>
              </div>
              <span class="ms-auto price-line">${currency(item.price * item.qty)}</span>
            </div>
          </div>
        </li>
      `);
    });
  };

  // Toma datos desde la card
  const itemFromCard = (btn) => {
    const card = btn.closest('.game-card');
    if (!card) return null;
    const title   = card.querySelector('h3')?.textContent.trim() || 'Producto';
    const priceTx = card.querySelector('.price')?.textContent || 'S/ 0';
    const image   = card.querySelector('img')?.src || '';
    const price   = parseFloat(priceTx.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const id      = title.toLowerCase().replace(/[^\w]+/g, '-');
    return { id, title, price, image, qty: 1 };
  };

  // Delegación global: solo interviene si NO cambió el badge tras el click
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn.btn-buy');
    if (!btn) return;

    // Le damos prioridad al listener original (de script.js)
    const before = badge ? (parseInt(badge.textContent || '0', 10) || 0) : null;

    // Dejamos que otros listeners corran primero en el mismo tick
    setTimeout(() => {
      const after = badge ? (parseInt(badge.textContent || '0', 10) || 0) : null;

      // Si no hay badge o no cambió, aplicamos fallback
      const needsFallback = (before !== null && after === before) || (badge === null);

      if (needsFallback) {
        e.preventDefault();

        let cart = load();
        const item = itemFromCard(btn);
        if (!item) return;

        const found = cart.find(i => i.id === item.id);
        if (found) found.qty += 1;
        else cart.push(item);

        save(cart);
        render(cart);

        // Abrimos el offcanvas si está disponible (mismo comportamiento que el original)
        if (window.bootstrap?.Offcanvas && offcanvasEl) {
          new bootstrap.Offcanvas(offcanvasEl).show();
        }

        // Mini animación del botón carrito
        if (cartBtn) {
          cartBtn.classList.add('shake');
          setTimeout(() => cartBtn.classList.remove('shake'), 400);
        }
      }
    }, 0);
  });

  // También parchea los botones +/- y eliminar si el original no está
  list?.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    let cart = load();
    if (e.target.classList.contains('inc')) {
      const it = cart.find(i => i.id === id); if (it) it.qty++;
    } else if (e.target.classList.contains('dec')) {
      const it = cart.find(i => i.id === id);
      if (it && it.qty > 1) it.qty--;
      else cart = cart.filter(i => i.id !== id);
    } else if (e.target.classList.contains('remove')) {
      cart = cart.filter(i => i.id !== id);
    }
    save(cart); render(cart);
  });

  $('#btnClearCart')?.addEventListener('click', () => { save([]); render([]); });

  // Sincroniza UI al cargar (por si llegas con items previos)
  render(load());
})();
