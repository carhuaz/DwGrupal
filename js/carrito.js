/* ============================================================
   CARRITO DE COMPRAS
   Compatible con Supabase y sistema antiguo
   Gestiona items, localStorage y UI del offcanvas
============================================================ */

class Carrito {
  /**
   * Constructor - Inicializa el carrito desde localStorage
   */
  constructor() {
    this.items = JSON.parse(localStorage.getItem('carrito')) || [];
    this.inicializar();
  }

  /**
   * Inicializar funcionalidades del carrito
   */
  inicializar() {
    this.actualizarUI();
    this.configurarEventos();
    this.escucharBotonesAgregar();
  }

  /**
   * Escuchar clicks en botones de agregar al carrito
   * Soporta tanto el sistema nuevo (Supabase) como el antiguo
   */
  escucharBotonesAgregar() {
    document.addEventListener('click', (e) => {
      // Sistema nuevo con Supabase
      const btnSupabase = e.target.closest('.btn-add-cart');
      if (btnSupabase) {
        e.preventDefault();
        const producto = {
          id: parseInt(btnSupabase.dataset.id),
          nombre: btnSupabase.dataset.nombre,
          precio: parseFloat(btnSupabase.dataset.precio),
          imagen: btnSupabase.dataset.imagen,
          cantidad: 1
        };
        this.agregar(producto);
        return;
      }

      // Sistema antiguo (fallback)
      const btnAntiguo = e.target.closest('.btn-buy');
      if (btnAntiguo) {
        e.preventDefault();
        const producto = this.extraerProductoCard(btnAntiguo);
        if (producto) this.agregar(producto);
      }
    });
  }

  /**
   * Extraer datos de producto desde una tarjeta del DOM
   * @param {HTMLElement} btn - Botón de compra
   * @returns {Object|null} Datos del producto o null
   */
  extraerProductoCard(btn) {
    const card = btn.closest('.game-card') || btn.closest('.product-card');
    if (!card) return null;

    const titulo = card.querySelector('h3')?.textContent.trim() || 
                   card.querySelector('.card-title')?.textContent.trim() || 
                   'Producto';
    
    const precioTexto = card.querySelector('.price')?.textContent || 
                        card.querySelector('.text-primary')?.textContent || 
                        'S/ 0';
    
    const imagen = card.querySelector('img')?.src || 'img/placeholder.jpg';
    const precio = parseFloat(precioTexto.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const id = titulo.toLowerCase().replace(/[^\w]+/g, '-') + '-' + Date.now();

    return {
      id: id,
      nombre: titulo,
      precio: precio,
      imagen: imagen,
      cantidad: 1
    };
  }

  agregar(producto) {
    const existe = this.items.find(item => 
      item.id === producto.id || item.nombre === producto.nombre
    );
    
    if (existe) {
      existe.cantidad++;
    } else {
      this.items.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        cantidad: 1
      });
    }
    
    this.guardar();
    this.actualizarUI();
    this.mostrarNotificacion('✓ Agregado al carrito');
    this.abrirCarrito();
  }

  eliminar(id) {
    this.items = this.items.filter(item => item.id != id);
    this.guardar();
    this.actualizarUI();
  }

  incrementar(id) {
    const item = this.items.find(i => i.id == id);
    if (item) {
      item.cantidad++;
      this.guardar();
      this.actualizarUI();
    }
  }

  decrementar(id) {
    const item = this.items.find(i => i.id == id);
    if (item) {
      if (item.cantidad > 1) {
        item.cantidad--;
      } else {
        this.eliminar(id);
        return;
      }
      this.guardar();
      this.actualizarUI();
    }
  }

  vaciar() {
    this.items = [];
    this.guardar();
    this.actualizarUI();
  }

  guardar() {
    localStorage.setItem('carrito', JSON.stringify(this.items));
  }

  calcularTotal() {
    return this.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  }

  actualizarUI() {
    const badge = document.getElementById('cartBadge');
    const cartList = document.getElementById('cartList');
    const subtotal = document.getElementById('cartSubtotal');

    if (!cartList) return;

    // Actualizar badge
    const totalItems = this.items.reduce((sum, item) => sum + item.cantidad, 0);
    if (badge) {
      badge.textContent = totalItems;
      // Animar badge cuando cambia
      badge.style.animation = 'none';
      setTimeout(() => {
        badge.style.animation = 'badgePulse 2s ease infinite';
      }, 10);
    }

    // Actualizar lista
    cartList.innerHTML = '';
    if (this.items.length === 0) {
      const liEmpty = document.createElement('li');
      liEmpty.className = 'list-group-item text-center text-muted py-5';
      const icon = document.createElement('i');
      icon.className = 'bi bi-cart-x fs-1 d-block mb-2';
      liEmpty.appendChild(icon);
      const txt = document.createElement('div');
      txt.textContent = 'Tu carrito está vacío';
      liEmpty.appendChild(txt);
      cartList.appendChild(liEmpty);
      if (subtotal) subtotal.textContent = 'S/ 0.00';
    } else {
      this.items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'list-group-item';

        const row = document.createElement('div');
        row.className = 'd-flex gap-2 align-items-center';

        const img = document.createElement('img');
        img.src = item.imagen || 'img/placeholder.jpg';
        img.width = 50;
        img.height = 50;
        img.className = 'rounded object-fit-cover';
        img.alt = item.nombre;

        const flex = document.createElement('div');
        flex.className = 'flex-grow-1';

        const name = document.createElement('div');
        name.className = 'fw-semibold small';
        name.textContent = item.nombre;

        const controlsRow = document.createElement('div');
        controlsRow.className = 'd-flex align-items-center gap-2 mt-1';

        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group btn-group-sm';
        btnGroup.role = 'group';

        const dec = document.createElement('button');
        dec.className = 'btn btn-outline-light btn-qty-dec';
        dec.dataset.id = item.id;
        dec.type = 'button';
        dec.textContent = '−';

        const qtySpan = document.createElement('span');
        qtySpan.className = 'px-2 small';
        qtySpan.textContent = String(item.cantidad);

        const inc = document.createElement('button');
        inc.className = 'btn btn-outline-light btn-qty-inc';
        inc.dataset.id = item.id;
        inc.type = 'button';
        inc.textContent = '+';

        btnGroup.appendChild(dec);
        btnGroup.appendChild(qtySpan);
        btnGroup.appendChild(inc);

        const price = document.createElement('span');
        price.className = 'ms-auto text-primary fw-semibold small';
        price.textContent = `S/ ${(item.precio * item.cantidad).toFixed(2)}`;

        controlsRow.appendChild(btnGroup);
        controlsRow.appendChild(price);

        flex.appendChild(name);
        flex.appendChild(controlsRow);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-outline-danger btn-remove';
        removeBtn.dataset.id = item.id;
        removeBtn.type = 'button';
        const remIcon = document.createElement('i');
        remIcon.className = 'bi bi-trash';
        removeBtn.appendChild(remIcon);

        row.appendChild(img);
        row.appendChild(flex);
        row.appendChild(removeBtn);

        li.appendChild(row);
        cartList.appendChild(li);
      });

      if (subtotal) subtotal.textContent = `S/ ${this.calcularTotal().toFixed(2)}`;
    }
  }

  configurarEventos() {
    // Botones dentro del carrito
    document.getElementById('cartList')?.addEventListener('click', (e) => {
      const id = e.target.closest('[data-id]')?.dataset.id;
      if (!id) return;

      if (e.target.closest('.btn-qty-inc')) {
        this.incrementar(id);
      } else if (e.target.closest('.btn-qty-dec')) {
        this.decrementar(id);
      } else if (e.target.closest('.btn-remove')) {
        this.eliminar(id);
      }
    });

    // Vaciar carrito
    document.getElementById('btnClearCart')?.addEventListener('click', () => {
      if (this.items.length && confirm('¿Vaciar el carrito?')) {
        this.vaciar();
      }
    });

    // Ir a pagar
    document.getElementById('btnCheckout')?.addEventListener('click', () => {
      if (this.items.length === 0) {
        alert('El carrito está vacío');
      } else {
        alert(`Total a pagar: S/ ${this.calcularTotal().toFixed(2)}\n\n(Sistema de pago en desarrollo)`);
      }
    });
  }

  abrirCarrito() {
    const offcanvasEl = document.getElementById('miniCart');
    if (window.bootstrap?.Offcanvas && offcanvasEl) {
      const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || 
                        new bootstrap.Offcanvas(offcanvasEl);
      offcanvas.show();
    }

    // Animación del botón
    const cartBtn = document.querySelector('.btn-outline-light.position-relative');
    if (cartBtn) {
      cartBtn.classList.add('shake');
      setTimeout(() => cartBtn.classList.remove('shake'), 400);
    }
  }

  mostrarNotificacion(mensaje) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    const dFlex = document.createElement('div');
    dFlex.className = 'd-flex';

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'toast-body';
    const icon = document.createElement('i');
    icon.className = 'bi bi-check-circle me-2';
    bodyDiv.appendChild(icon);
    bodyDiv.appendChild(document.createTextNode(mensaje));

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close btn-close-white me-2 m-auto';
    closeBtn.setAttribute('data-bs-dismiss', 'toast');

    dFlex.appendChild(bodyDiv);
    dFlex.appendChild(closeBtn);
    toast.appendChild(dFlex);
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 2000 });
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
  }
}

// Inicializar carrito globalmente
const carrito = new Carrito();
window.carrito = carrito;