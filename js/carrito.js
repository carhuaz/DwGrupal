/* ============================================================
   CARRITO DE COMPRAS
   Compatible con Supabase y sistema antiguo
   Gestiona items, localStorage y UI del offcanvas
============================================================ */

class Carrito {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('carrito')) || [];
    this.eventosConfigurados = false;
    this.inicializar();
  }

  inicializar() {
    console.log('🛒 Inicializando carrito...');
    this.actualizarUI();
    this.configurarEventos();
    this.escucharBotonesAgregar();
    console.log('✅ Carrito inicializado con', this.items.length, 'items');
  }

  escucharBotonesAgregar() {
    document.addEventListener('click', (e) => {
      const btnSupabase = e.target.closest('.btn-add-cart');
      if (btnSupabase) {
        e.preventDefault();
        e.stopPropagation();
        
        const producto = {
          id: String(btnSupabase.dataset.id),
          nombre: btnSupabase.dataset.nombre,
          precio: parseFloat(btnSupabase.dataset.precio),
          imagen: btnSupabase.dataset.imagen
        };
        
        console.log('➕ Agregando producto:', producto.nombre);
        this.agregar(producto);
        return;
      }

      const btnAntiguo = e.target.closest('.btn-buy');
      if (btnAntiguo) {
        e.preventDefault();
        const producto = this.extraerProductoCard(btnAntiguo);
        if (producto) this.agregar(producto);
      }
    });
  }

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

    return { id, nombre: titulo, precio, imagen };
  }

  agregar(producto) {
    const existe = this.items.find(item => String(item.id) === String(producto.id));
    
    if (existe) {
      existe.cantidad++;
      console.log('📦 Cantidad aumentada:', existe.nombre, '→', existe.cantidad);
    } else {
      this.items.push({
        id: String(producto.id),
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        cantidad: 1
      });
      console.log('🆕 Producto agregado:', producto.nombre);
    }
    
    this.guardar();
    this.actualizarUI();
    this.mostrarNotificacion('✓ Agregado al carrito');
    this.abrirCarrito();
  }
  eliminar(id) {
    console.log('🗑️ Eliminando ID:', id);
    const antes = this.items.length;
    this.items = this.items.filter(item => String(item.id) !== String(id));
    console.log('Productos eliminados:', antes - this.items.length);
    this.guardar();
    this.actualizarUI();
  }

  incrementar(id) {
    console.log('➕ Incrementando ID:', id);
    const item = this.items.find(i => String(i.id) === String(id));
    if (item) {
      item.cantidad++;
      console.log('Nueva cantidad:', item.cantidad);
      this.guardar();
      this.actualizarUI();
    } else {
      console.error('❌ Item no encontrado');
    }
  }

  decrementar(id) {
    console.log('➖ Decrementando ID:', id);
    const item = this.items.find(i => String(i.id) === String(id));
    if (item) {
      if (item.cantidad > 1) {
        item.cantidad--;
        console.log('Nueva cantidad:', item.cantidad);
        this.guardar();
        this.actualizarUI();
      } else {
        console.log('Cantidad = 1, eliminando...');
        this.eliminar(id);
      }
    } else {
      console.error('❌ Item no encontrado');
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

    const totalItems = this.items.reduce((sum, item) => sum + item.cantidad, 0);
    
    // Actualizar badge
    if (badge) {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }

    // Limpiar y recrear lista
    cartList.innerHTML = '';

    if (this.items.length === 0) {
      cartList.innerHTML = `
        <li class="list-group-item text-center text-muted py-5">
          <i class="bi bi-cart-x fs-1 d-block mb-2"></i>
          <div>Tu carrito está vacío</div>
        </li>
      `;
      if (subtotal) subtotal.textContent = 'S/ 0.00';
      return;
    }

    // Crear items
    this.items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.innerHTML = `
        <div class="d-flex gap-2 align-items-center">
          <img src="${item.imagen || 'img/placeholder.jpg'}" 
               width="50" height="50" 
               class="rounded object-fit-cover" 
               alt="${item.nombre}">
          <div class="flex-grow-1">
            <div class="fw-semibold small">${item.nombre}</div>
            <div class="d-flex align-items-center gap-2 mt-1">
              <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-outline-light btn-qty-dec" 
                        data-id="${item.id}" 
                        type="button">−</button>
                <span class="px-2 small">${item.cantidad}</span>
                <button class="btn btn-outline-light btn-qty-inc" 
                        data-id="${item.id}" 
                        type="button">+</button>
              </div>
              <span class="ms-auto text-primary fw-semibold small">
                S/ ${(item.precio * item.cantidad).toFixed(2)}
              </span>
            </div>
          </div>
          <button class="btn btn-sm btn-outline-danger btn-remove" 
                  data-id="${item.id}" 
                  type="button">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
      cartList.appendChild(li);
    });

    if (subtotal) {
      subtotal.textContent = `S/ ${this.calcularTotal().toFixed(2)}`;
    }
  }

  configurarEventos() {
    const cartList = document.getElementById('cartList');
    if (!cartList) return;
    
    // Solo configurar UNA VEZ
    if (this.eventosConfigurados) {
      return;
    }
    
    console.log('🎯 Configurando eventos del carrito...');
    
    // Event delegation en el contenedor padre
    cartList.addEventListener('click', (e) => {
      const btnInc = e.target.closest('.btn-qty-inc');
      const btnDec = e.target.closest('.btn-qty-dec');
      const btnRemove = e.target.closest('.btn-remove');
      
      if (btnInc && btnInc.dataset.id) {
        e.preventDefault();
        this.incrementar(btnInc.dataset.id);
      } else if (btnDec && btnDec.dataset.id) {
        e.preventDefault();
        this.decrementar(btnDec.dataset.id);
      } else if (btnRemove && btnRemove.dataset.id) {
        e.preventDefault();
        this.eliminar(btnRemove.dataset.id);
      }
    });

    // Botón vaciar carrito
    document.getElementById('btnClearCart')?.addEventListener('click', () => {
      if (this.items.length && confirm('¿Vaciar el carrito?')) {
        this.vaciar();
      }
    });

    this.eventosConfigurados = true;
    console.log('✅ Eventos configurados');
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