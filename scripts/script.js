/* ===============================
   Digital Loot – script.js
   (Popup SIEMPRE, catálogo, mini-carrito, efectos)
   =============================== */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 0) Helpers ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ================================================================
     1) POPUP DE ENTRADA (SIEMPRE) + CTA "Ver más" → #productos
  ================================================================== */
  (function promoAlways() {
    const el = document.getElementById('promoIn');
    if (!el || !window.bootstrap?.Modal) return;

    const modal = new bootstrap.Modal(el);  // cierre con fondo/ESC activo
    setTimeout(() => modal.show(), 120);    // pequeño delay post-DOM

    // CTA botón (id="ctaVerMas"): cierra y luego hace scroll a #productos
    const ctaBtn = document.getElementById('ctaVerMas');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        el.addEventListener('hidden.bs.modal', () => {
          document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
        }, { once: true });
      });
    }

    // Fallback: si usas <a href="#productos" data-bs-dismiss="modal">
    document.addEventListener('click', (e) => {
      const a = e.target.closest('#promoIn a[href="#productos"][data-bs-dismiss="modal"]');
      if (!a) return;
      el.addEventListener('hidden.bs.modal', () => {
        document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
      }, { once: true });
    });
  })();

  /* ================================================================
     2) POPUP "PROMO DEL MES" (#promoMes): Copiar cupón + countdown
  ================================================================== */
  (function promoMesExtras() {
    const promo = document.getElementById('promoMes');
    if (!promo) return;

    // Copiar cupón
    const coupon = $('.coupon-badge', promo);
    if (coupon && navigator.clipboard) {
      coupon.style.cursor = 'pointer';
      coupon.title = 'Copiar cupón';
      coupon.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(coupon.textContent.trim());
          const old = coupon.textContent;
          coupon.textContent = '¡Copiado!';
          setTimeout(() => (coupon.textContent = old), 900);
        } catch { /* noop */ }
      });
    }

    // Countdown fin de mes
    let spot = $('#promoCountdown', promo);
    if (!spot) {
      spot = document.createElement('small');
      spot.id = 'promoCountdown';
      spot.className = 'text-muted d-block mt-2';
      ( $('.coupon-badge', promo)?.parentElement || $('.p-4, .p-md-5', promo) || promo ).appendChild(spot);
    }
    const endOfMonth = () => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    };
    const tick = () => {
      const now = new Date();
      const end = endOfMonth();
      let diff = end - now; if (diff < 0) diff = 0;
      const dd = Math.floor(diff / 86400000);
      const hh = Math.floor(diff / 3600000) % 24;
      const mm = Math.floor(diff / 60000) % 60;
      spot.textContent = `Termina en ${dd}d ${String(hh).padStart(2,'0')}h ${String(mm).padStart(2,'0')}m`;
    };
    tick();
    setInterval(tick, 30000);
  })();

  /* ================================================================
     3) CATÁLOGO: filtros por categoría + búsqueda en navbar
  ================================================================== */
  (function catalogFilters() {
    const grid = $('#productos .row');
    if (!grid) return;

    const cols = $$('#productos .row .col');
    cols.forEach((col, idx) => col.dataset.index = idx); // orden original

    const platformOf = (title) => {
      title = title.toLowerCase();
      if (/\bgift\b|\bgift card\b/.test(title)) return 'gift';
      if (/\bdlc\b|\(dlc\)/.test(title)) return 'dlc';
      if (/\bxbox\b/.test(title)) return 'xbox';
      if (/\bps\b|\bplaystation\b/.test(title)) return 'playstation';
      if (/\bsteam\b|\bpc\b/.test(title)) return 'pc';
      return 'other';
    };

    let activeCategory = 'todo';
    let query = '';

    const applyFilters = () => {
      const q = query.trim().toLowerCase();
      cols.forEach(col => {
        const title = $('.game-card h3', col)?.textContent || '';
        const platform = platformOf(title);
        const matchCat = (activeCategory === 'todo') || (platform === activeCategory);
        const matchSearch = !q || title.toLowerCase().includes(q);
        col.style.display = (matchCat && matchSearch) ? '' : 'none';
      });
    };

    // Tabs de categorías (botones)
    const tabBtns = $$('.border-top ~ .container .btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const map = { 'todo':'todo', 'pc':'pc', 'xbox':'xbox', 'playstation':'playstation', 'gift cards':'gift', 'gift':'gift', 'dlc':'dlc' };
        activeCategory = map[btn.textContent.trim().toLowerCase()] || 'todo';
        applyFilters();
      });
    });

    // Búsqueda
    const searchInput = $('.navbar input[type="search"]');
    searchInput?.addEventListener('input', () => {
      query = searchInput.value || '';
      applyFilters();
    });
  })();

  /* ================================================================
     4) ORDENAR catálogo (select)
  ================================================================== */
  (function sortCatalog() {
    const grid = $('#productos .row');
    const select = $('#productos select');
    if (!grid || !select) return;

    const cols = $$('#productos .row .col');
    const byPrice = (col) => {
      const txt = $('.price', col)?.textContent || '';
      return parseFloat(txt.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    };
    const byTitle = (col) => ($('.game-card h3', col)?.textContent || '').toLowerCase();

    select.addEventListener('change', () => {
      const val = select.value.toLowerCase();
      let sorted = [...cols];

      if (val.includes('precio') && val.includes('↑')) {
        sorted.sort((a, b) => byPrice(a) - byPrice(b));
      } else if (val.includes('precio') && val.includes('↓')) {
        sorted.sort((a, b) => byPrice(b) - byPrice(a));
      } else if (val === 'a-z') {
        sorted.sort((a, b) => byTitle(a).localeCompare(byTitle(b)));
      } else if (val === 'z-a') {
        sorted.sort((a, b) => byTitle(b).localeCompare(byTitle(a)));
      } else {
        sorted.sort((a, b) => (a.dataset.index | 0) - (b.dataset.index | 0)); // Relevancia
      }
      sorted.forEach(col => grid.appendChild(col));
    });
  })();

  /* ================================================================
     5) Lazy para portadas
  ================================================================== */
  (function lazyCovers() {
    $$('img.game-cover:not([loading])').forEach(img => img.loading = 'lazy');
  })();

  /* ================================================================
     6) MINI-CARRITO - DESHABILITADO (ahora se usa carrito.js)
  ================================================================== */
  /*
  // CARRITO ANTIGUO COMENTADO - Ahora se usa js/carrito.js
  (function miniCart() {
    const KEY = 'cartItems';
    const currency = n => `S/ ${Number(n || 0).toFixed(2)}`;

    const cartBtn     = $('.navbar .btn.position-relative');
    const badge       = $('.badge', cartBtn);
    const list        = $('#cartList');
    const subtotalEl  = $('#cartSubtotal');
    const offcanvasEl = $('#miniCart');

    let cart = [];

    const load = () => {
      try { cart = JSON.parse(localStorage.getItem(KEY) || '[]'); }
      catch { cart = []; }
    };
    const save = () => localStorage.setItem(KEY, JSON.stringify(cart));
    const countItems = () => cart.reduce((s, i) => s + (i.qty || 0), 0);
    const subtotal   = () => cart.reduce((s, i) => s + i.price * i.qty, 0);

    const render = () => {
      // Validar que los elementos existan antes de actualizar
      if (badge) badge.textContent = countItems();
      if (subtotalEl) subtotalEl.textContent = currency(subtotal());
      if (!list) return; // Si no hay lista, no renderizar
      
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

    const addItemFromCard = (btn) => {
      const card = btn.closest('.game-card');
      if (!card) return;
      const title   = card.querySelector('h3')?.textContent.trim() || 'Producto';
      const priceTx = card.querySelector('.price')?.textContent || 'S/ 0';
      const image   = card.querySelector('img')?.src || '';
      const price   = parseFloat(priceTx.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      const id      = title.toLowerCase().replace(/[^\w]+/g, '-');

      const found = cart.find(i => i.id === id);
      if (found) found.qty += 1;
      else cart.push({ id, title, price, image, qty: 1 });

      save(); render();

      if (window.bootstrap?.Offcanvas && offcanvasEl) {
        new bootstrap.Offcanvas(offcanvasEl).show();
      }
      // micro animación del botón carrito
      if (cartBtn) {
        cartBtn.classList.add('shake');
        setTimeout(() => cartBtn.classList.remove('shake'), 400);
      }
    };

    // Delegación: + / − / eliminar
    list?.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      if (!id) return;

      if (e.target.classList.contains('inc')) {
        const it = cart.find(i => i.id === id); if (it) it.qty++;
      } else if (e.target.classList.contains('dec')) {
        const it = cart.find(i => i.id === id);
        if (it && it.qty > 1) it.qty--;
        else cart = cart.filter(i => i.id !== id);
      } else if (e.target.classList.contains('remove')) {
        cart = cart.filter(i => i.id !== id);
      }
      save(); render();
    });

    // Vaciar
    $('#btnClearCart')?.addEventListener('click', () => {
      cart = []; save(); render();
    });
    // Hook a todos los "Agregar"
    $$('.btn.btn-buy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        addItemFromCard(btn);
      });
    });

    // Init
    load(); render();
  })();
  */

  /* ================================================================
     7) SCROLL REVEAL (IntersectionObserver)
  ================================================================== */
  (function scrollReveal() {
    const els = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || !els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-shown');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  })();

  /* ================================================================
     8) BOTÓN "VOLVER ARRIBA": visible cuando se hace scroll
  ================================================================== */
  (function toTopButton() {
    const btn = document.getElementById('toTop');
    if (!btn) return;

    // Mostrar/ocultar basado en scroll
    const toggleBtn = () => {
      if (window.scrollY > 300) {
        btn.classList.add('show');
      } else {
        btn.classList.remove('show');
      }
    };

    // Scroll suave al hacer click
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    // Escuchar scroll con throttle
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          toggleBtn();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Inicializar
    toggleBtn();
  })();

  /* ================================================================
     9) CSS-in-JS: micro-animación del carrito (shake)
  ================================================================== */
  (function injectCartShake() {
    const css = `
      .navbar .btn.position-relative.shake { animation: cartShake .35s ease; }
      @keyframes cartShake {
        0%{ transform: translateY(0); }
        30%{ transform: translateY(-2px); }
        60%{ transform: translateY(1px); }
        100%{ transform: translateY(0); }
      }`;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  })();

});
