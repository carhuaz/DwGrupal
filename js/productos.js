/* ============================================================
   MÓDULO DE PRODUCTOS
   Gestiona carga, filtrado, búsqueda y visualización de productos
   desde Supabase con renderizado optimizado mediante DOM APIs
============================================================ */

/**
 * Obtener URL de imagen del producto
 * Soporta: imagen_url, portada, url_imagen
 * @param {string|object} imagenUrl - URL de la imagen o producto completo
 * @returns {string} URL procesada o placeholder
 */
function getImageUrl(imagenUrl) {
  // Si es un objeto producto, extraer la imagen
  if (typeof imagenUrl === 'object' && imagenUrl !== null) {
    imagenUrl = imagenUrl.imagen_url || imagenUrl.portada || imagenUrl.url_imagen || imagenUrl.imagen;
  }
  
  if (!imagenUrl) return 'img/placeholder.jpg';
  if (imagenUrl.startsWith('http')) return imagenUrl;
  
  // Si es una ruta de Supabase Storage
  if (imagenUrl.includes('supabase')) return imagenUrl;
  
  return imagenUrl;
}

/**
 * Manejar errores de Supabase de forma consistente
 * @param {Error} error - Error de Supabase
 * @param {string} context - Contexto donde ocurrió el error
 * @returns {Array} Array vacío
 */
function handleSupabaseError(error, context) {
  console.error(`❌ Error en ${context}:`, error);
  return [];
}

// Cargar productos destacados (para index.html)
async function cargarProductosDestacados() {
  try {
    console.log('🔄 Cargando productos destacados...');
    
    // Cargar productos destacados directamente (sin joins)
    const { data: productos, error } = await supabase
      .from('productos')
      .select('*')
      .eq('destacado', true)
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Error al cargar productos:', error);
      return handleSupabaseError(error, 'cargarProductosDestacados');
    }

    console.log(`✅ ${productos.length} productos destacados cargados`);
    mostrarProductos(productos);
    return productos;
  } catch (error) {
    console.error('❌ Error al cargar productos destacados:', error);
    mostrarMensajeError();
    return [];
  }
}

// Mostrar productos en el DOM
function mostrarProductos(productos) {
  const container = document.querySelector('#productos .row') || 
                    document.getElementById('productosGrid');
  
  if (!container) {
    console.warn('⚠️ No se encontró el contenedor de productos');
    return;
  }

  // Limpiar spinner o contenido previo
  container.innerHTML = '';

  // Actualizar contador
  actualizarContadorProductos(productos.length);

  // Si no hay productos
  if (!productos || productos.length === 0) {
    const colEmpty = document.createElement('div');
    colEmpty.className = 'col-12 text-center py-5';
    const icon = document.createElement('i');
    icon.className = 'bi bi-inbox fs-1 text-muted d-block mb-3';
    const p = document.createElement('p');
    p.className = 'text-muted';
    p.textContent = 'No se encontraron productos';
    colEmpty.appendChild(icon);
    colEmpty.appendChild(p);
    container.appendChild(colEmpty);
    return;
  }

  // Crear cards de productos
  // Usar creación de nodos DOM en lugar de plantillas HTML largas
  productos.forEach(producto => {
    // Extraer datos con compatibilidad para diferentes nombres de campos
    const imageUrl = getImageUrl(producto.portada || producto.imagen_url || producto.url_imagen || producto.imagen);
    const nombre = producto.nombre || producto.titulo || 'Producto';
    const precio = Number(producto.precio || producto.precio_anterior || 0);
    const precioAnterior = producto.precio_anterior ? Number(producto.precio_anterior) : null;
    const descuento = producto.descuento ? Number(producto.descuento) : 0;
    const descripcion = producto.descripcion || producto.sinopsis || '';
    
    // Obtener plataforma y categoría de campos directos
    const plataforma = producto.plataforma || 'PC';
    const categoria = producto.categoria || '';
    const tags = producto.tags || [];
    const activo = producto.activo !== false;
    
    // Calcular precio con descuento si existe
    let precioFinal = precio;
    if (precioAnterior && precioAnterior > precio) {
      // Si hay precio anterior mayor, calcular descuento
      const descuentoCalculado = Math.round(((precioAnterior - precio) / precioAnterior) * 100);
      precioFinal = precio;
    } else if (descuento > 0) {
      precioFinal = precio * (1 - descuento / 100);
    }

    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'card product-card h-100';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'product-img-wrap position-relative';

    // Mostrar badge de descuento
    if (descuento > 0 || (precioAnterior && precioAnterior > precio)) {
      const badge = document.createElement('span');
      badge.className = 'badge-discount';
      const porcentajeDescuento = descuento > 0 ? descuento : Math.round(((precioAnterior - precio) / precioAnterior) * 100);
      badge.textContent = `-${porcentajeDescuento}%`;
      imgWrap.appendChild(badge);
    }

    const img = document.createElement('img');
    img.className = 'card-img-top';
    img.src = imageUrl;
    img.alt = nombre;
    img.loading = 'lazy';
    img.onerror = function () { this.src = 'img/placeholder.jpg'; };
    imgWrap.appendChild(img);

    card.appendChild(imgWrap);

    const body = document.createElement('div');
    body.className = 'card-body d-flex flex-column';

    const title = document.createElement('h5');
    title.className = 'card-title small mb-2';
    title.textContent = nombre;
    body.appendChild(title);

    const mtAuto = document.createElement('div');
    mtAuto.className = 'mt-auto';

    const topRow = document.createElement('div');
    topRow.className = 'd-flex align-items-center justify-content-between mb-2';

    const spanPlat = document.createElement('span');
    spanPlat.className = 'text-muted small';
    spanPlat.textContent = plataforma;
    topRow.appendChild(spanPlat);
    
    if (precioAnterior && precioAnterior > precio) {
      const old = document.createElement('span');
      old.className = 'text-muted text-decoration-line-through small';
      old.textContent = `S/ ${precioAnterior.toFixed(2)}`;
      topRow.appendChild(old);
    }

    mtAuto.appendChild(topRow);

    const bottomRow = document.createElement('div');
    bottomRow.className = 'd-flex align-items-center justify-content-between';

    const price = document.createElement('span');
    price.className = 'h5 mb-0 text-primary';
    price.textContent = `S/ ${precioFinal.toFixed(2)}`;

    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-primary btn-add-cart';
    btn.dataset.id = producto.id;
    btn.dataset.nombre = nombre;
    btn.dataset.precio = precioFinal;
    btn.dataset.imagen = imageUrl;
    btn.dataset.plataforma = plataforma;
    if (categoria) btn.dataset.categoria = categoria;
    const icon = document.createElement('i');
    icon.className = 'bi bi-cart-plus';
    btn.appendChild(icon);

    bottomRow.appendChild(price);
    bottomRow.appendChild(btn);

    mtAuto.appendChild(bottomRow);
    body.appendChild(mtAuto);
    card.appendChild(body);
    col.appendChild(card);

    // Agregar evento click para abrir modal de detalles
    card.addEventListener('click', (e) => {
      // Solo abrir modal si no se hizo click en el botón de agregar
      if (!e.target.closest('.btn-add-cart')) {
        mostrarDetalleProducto(producto);
      }
    });

    container.appendChild(col);
  });

  console.log(`✅ ${productos.length} productos renderizados en el DOM`);
}

// Mostrar detalles del producto en modal
function mostrarDetalleProducto(producto) {
  const modal = document.getElementById('productDetailModal');
  if (!modal) return;

  const imageUrl = getImageUrl(producto.imagen_url || producto.portada);
  const plataforma = producto.plataforma || 'PC';

  // Actualizar contenido del modal
  document.getElementById('modalProductName').textContent = producto.nombre || 'Producto';
  document.getElementById('modalProductImage').src = imageUrl;
  document.getElementById('modalProductImage').alt = producto.nombre || 'Producto';
  document.getElementById('modalProductPlatform').textContent = plataforma;
  document.getElementById('modalProductPrice').textContent = `S/ ${Number(producto.precio).toFixed(2)}`;

  // Precio anterior y descuento
  const oldPriceEl = document.getElementById('modalProductOldPrice');
  const discountEl = document.getElementById('modalProductDiscount');
  
  if (producto.precio_anterior) {
    oldPriceEl.textContent = `S/ ${Number(producto.precio_anterior).toFixed(2)}`;
    oldPriceEl.classList.remove('d-none');
  } else {
    oldPriceEl.classList.add('d-none');
  }

  if (producto.descuento && Number(producto.descuento) > 0) {
    discountEl.textContent = `-${producto.descuento}%`;
    discountEl.classList.remove('d-none');
  } else {
    discountEl.classList.add('d-none');
  }

  // Descripción
  const descriptionEl = document.getElementById('modalProductDescription');
  const descriptionContainer = document.getElementById('modalProductDescriptionContainer');
  if (producto.descripcion) {
    descriptionEl.textContent = producto.descripcion;
    descriptionContainer.classList.remove('d-none');
  } else {
    descriptionContainer.classList.add('d-none');
  }

  // Configurar botón de agregar al carrito
  const addBtn = document.getElementById('modalAddToCartBtn');
  addBtn.onclick = () => {
    if (window.carrito) {
      window.carrito.agregar({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: imageUrl,
        cantidad: 1
      });
    }
    // Cerrar modal después de agregar
    bootstrap.Modal.getInstance(modal).hide();
  };

  // Mostrar modal
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

// Mostrar mensaje de error
function mostrarMensajeError() {
  const container = document.querySelector('#productos .row') || 
                    document.getElementById('productosGrid');
  if (!container) return;

  const col = document.createElement('div');
  col.className = 'col-12';

  const alert = document.createElement('div');
  alert.className = 'alert alert-warning d-flex align-items-center';
  alert.setAttribute('role', 'alert');

  const icon = document.createElement('i');
  icon.className = 'bi bi-exclamation-triangle fs-4 me-3';

  const wrapper = document.createElement('div');
  const strong = document.createElement('strong');
  strong.textContent = 'Error al cargar productos';
  const p = document.createElement('p');
  p.className = 'mb-0';
  p.textContent = 'No se pudieron cargar los productos. Por favor, intenta más tarde.';

  wrapper.appendChild(strong);
  wrapper.appendChild(p);
  alert.appendChild(icon);
  alert.appendChild(wrapper);

  const center = document.createElement('div');
  center.className = 'text-center';
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.type = 'button';
  btn.addEventListener('click', () => location.reload());
  const btnIcon = document.createElement('i');
  btnIcon.className = 'bi bi-arrow-clockwise me-2';
  btn.appendChild(btnIcon);
  btn.appendChild(document.createTextNode('Reintentar'));

  col.appendChild(alert);
  center.appendChild(btn);
  col.appendChild(center);
  container.appendChild(col);
}

// Buscar productos
async function buscarProductos(termino) {
  try {
    console.log(`🔍 Buscando: "${termino}"`);
    
    // Mostrar indicador de carga
    const container = document.querySelector('#productos .row') || 
                      document.getElementById('productosGrid');
    if (container) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Buscando...</span>
          </div>
          <p class="text-muted">Buscando "${termino}"...</p>
        </div>
      `;
    }
    
    const { data: productos, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .ilike('nombre', `%${termino}%`)
      .order('nombre', { ascending: true });

    if (error) {
      return handleSupabaseError(error, 'buscarProductos');
    }

    console.log(`✅ ${productos.length} productos encontrados`);
    productosActualesIndex = productos || [];
    mostrarProductos(productos);
    return productos;
  } catch (error) {
    console.error('❌ Error al buscar productos:', error);
    mostrarMensajeError();
    return [];
  }
}

// Filtrar por plataforma
async function filtrarPorPlataforma(plataforma) {
  try {
    console.log(`🎮 Filtrando por: ${plataforma}`);
    
    let query = supabase
      .from('productos')
      .select('*')
      .eq('activo', true);

    if (plataforma !== 'Todo') {
      if (plataforma === 'DLC') {
        query = query.eq('categoria', 'DLC');
      } else {
        query = query.eq('plataforma', plataforma);
      }
    }

    const { data: productos, error } = await query.order('nombre', { ascending: true });

    if (error) {
      return handleSupabaseError(error, 'filtrarPorPlataforma');
    }

    console.log(`✅ ${productos.length} productos filtrados`);
    mostrarProductos(productos);
    return productos;
  } catch (error) {
    console.error('❌ Error al filtrar productos:', error);
    mostrarMensajeError();
    return [];
  }
}

// Configurar buscador
function configurarBuscador() {
  const searchInput = document.querySelector('input[type="search"]');
  
  if (!searchInput) {
    console.warn('⚠️ No se encontró el input de búsqueda');
    return;
  }

  let timeoutId;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(timeoutId);
    const termino = e.target.value.trim();
    
    // Mostrar indicador de búsqueda
    if (termino.length > 0) {
      searchInput.classList.add('searching');
    }
    
    timeoutId = setTimeout(async () => {
      if (termino.length >= 2) {
        await buscarProductos(termino);
        searchInput.classList.remove('searching');
      } else if (termino.length === 0) {
        searchInput.classList.remove('searching');
        // Recargar productos según la página
        if (window.location.pathname.includes('catalogo.html')) {
          if (typeof cargarTodosLosProductos === 'function') {
            await cargarTodosLosProductos();
          }
        } else {
          await cargarProductosDestacados();
        }
      }
    }, 400); // Espera 400ms después de que el usuario deje de escribir
  });
  
  // Limpiar búsqueda con Escape
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.blur();
    }
  });

  console.log('✅ Buscador configurado');
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 Página cargada, inicializando productos...');
  
  // Esperar a que Supabase esté listo
  let intentos = 0;
  while ((!window.supabase || !window.supabase.from) && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  
  if (!window.supabase || !window.supabase.from) {
    console.error('❌ Supabase no disponible para productos.js');
    return;
  }
  
  console.log('✅ Supabase listo para productos.js');
  
  // Solo cargar productos destacados si estamos en index.html
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    cargarProductosDestacados();
  }
  
  // Configurar buscador en todas las páginas
  configurarBuscador();
  
  // Configurar filtros de plataforma en index.html
  configurarFiltrosIndex();
  
  // Configurar ordenamiento en index.html
  configurarOrdenamientoIndex();
});

// Configurar filtros de plataforma para index.html
function configurarFiltrosIndex() {
  const filtros = document.querySelectorAll('#filtrosPlataforma button[data-plataforma]');
  
  if (filtros.length === 0) return;
  
  filtros.forEach(filtro => {
    filtro.addEventListener('click', async (e) => {
      // Efecto ripple
      crearRipple(e);
      
      // Remover clase active de todos
      filtros.forEach(f => f.classList.remove('active'));
      // Agregar clase active al clickeado
      e.currentTarget.classList.add('active');
      // Filtrar
      const plataforma = e.currentTarget.dataset.plataforma;
      await filtrarPorPlataforma(plataforma);
    });
  });
  
  console.log('✅ Filtros de plataforma configurados');
}

// Crear efecto ripple en botones
function crearRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();
  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - rect.left - radius}px`;
  ripple.style.top = `${event.clientY - rect.top - radius}px`;
  ripple.classList.add('ripple-effect');

  const existingRipple = button.querySelector('.ripple-effect');
  if (existingRipple) {
    existingRipple.remove();
  }

  button.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

// Configurar ordenamiento para index.html
function configurarOrdenamientoIndex() {
  const ordenarSelect = document.getElementById('ordenarSelect');
  
  if (!ordenarSelect) return;
  
  ordenarSelect.addEventListener('change', async (e) => {
    const criterio = e.target.value;
    await ordenarProductosIndex(criterio);
  });
  
  console.log('✅ Selector de ordenamiento configurado');
}

// Variable global para almacenar productos actuales en index
let productosActualesIndex = [];

// Guardar productos cuando se cargan
const cargarProductosDestacadosOriginal = cargarProductosDestacados;
cargarProductosDestacados = async function() {
  const productos = await cargarProductosDestacadosOriginal();
  productosActualesIndex = productos || [];
  return productos;
};

// Guardar productos cuando se filtran
const filtrarPorPlataformaOriginal = filtrarPorPlataforma;
filtrarPorPlataforma = async function(plataforma) {
  const productos = await filtrarPorPlataformaOriginal(plataforma);
  productosActualesIndex = productos || [];
  return productos;
};

// Ordenar productos en index
async function ordenarProductosIndex(criterio) {
  if (productosActualesIndex.length === 0) return;
  
  let productosOrdenados = [...productosActualesIndex];
  
  switch(criterio) {
    case 'precio_asc':
      productosOrdenados.sort((a, b) => Number(a.precio) - Number(b.precio));
      break;
    case 'precio_desc':
      productosOrdenados.sort((a, b) => Number(b.precio) - Number(a.precio));
      break;
    case 'nombre_asc':
      productosOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
    case 'nombre_desc':
      productosOrdenados.sort((a, b) => b.nombre.localeCompare(a.nombre));
      break;
    default:
      // relevancia - mantener orden original
      break;
  }
  
  mostrarProductos(productosOrdenados);
  console.log(`✅ Productos ordenados por: ${criterio}`);
}

// Actualizar contador de productos
function actualizarContadorProductos(cantidad) {
  const contador = document.getElementById('contadorProductos');
  if (contador) {
    contador.textContent = `${cantidad} producto${cantidad !== 1 ? 's' : ''} encontrado${cantidad !== 1 ? 's' : ''}`;
    // Animación de actualización
    contador.classList.add('updated');
    setTimeout(() => contador.classList.remove('updated'), 400);
  }
}

/* ============================================================
   FUNCIONES PARA CARGAR DATOS DESDE SUPABASE
============================================================ */

/**
 * Obtener plataformas únicas desde los productos
 * @returns {Promise<Array>} Array de plataformas únicas
 */
async function obtenerPlataformasUnicas() {
  try {
    const { data: productos, error } = await supabase
      .from('productos')
      .select('plataforma');

    if (error) {
      console.error('❌ Error al cargar plataformas:', error);
      return ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile'];
    }

    // Extraer plataformas únicas
    const plataformas = [...new Set(productos.map(p => p.plataforma).filter(Boolean))];
    return plataformas.length > 0 ? plataformas : ['PC', 'PlayStation', 'Xbox'];
  } catch (error) {
    console.error('❌ Error al obtener plataformas:', error);
    return ['PC', 'PlayStation', 'Xbox'];
  }
}

/**
 * Renderizar botones de filtro de plataformas dinámicamente
 */
async function renderizarFiltrosPlataforma() {
  const container = document.getElementById('filtrosPlataforma');
  if (!container) return;

  // Obtener plataformas únicas de los productos
  const plataformas = await obtenerPlataformasUnicas();
  
  // Limpiar container
  container.innerHTML = '';

  // Botón "Todas"
  const btnTodo = document.createElement('button');
  btnTodo.className = 'btn btn-outline-light platform-filter active';
  btnTodo.dataset.plataforma = 'todos';
  btnTodo.textContent = 'Todas';
  container.appendChild(btnTodo);

  // Botones dinámicos por cada plataforma
  plataformas.forEach(plat => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-light platform-filter';
    btn.dataset.plataforma = plat;
    btn.textContent = plat;
    container.appendChild(btn);
  });

  console.log('✅ Filtros de plataforma renderizados');
}

console.log('📦 Módulo productos.js cargado');