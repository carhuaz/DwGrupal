/* ============================================================
   UI DE PEDIDOS - Gestión de modales y visualización
============================================================ */

'use strict';

let pedidosCache = [];
let filtroActual = 'todos';

/**
 * Abrir modal de Mis Pedidos y cargar datos
 */
async function abrirMisPedidos() {
  if (!authState.isLoggedIn) {
    alert('Debes iniciar sesión para ver tus pedidos');
    return;
  }

  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById('misPedidosModal'));
  modal.show();

  // Cargar pedidos
  await cargarMisPedidos();
}

/**
 * Cargar lista de pedidos del usuario
 */
async function cargarMisPedidos() {
  const listaPedidos = document.getElementById('listaPedidos');
  
  listaPedidos.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-3">Cargando tus pedidos...</p>
    </div>
  `;

  try {
    // Obtener pedidos
    pedidosCache = await obtenerMisPedidos();
    
    // Obtener estadísticas
    const stats = await obtenerEstadisticasPedidos();
    
    // Actualizar estadísticas
    if (stats) {
      document.getElementById('stat-total-pedidos').textContent = stats.total_pedidos || 0;
      document.getElementById('stat-completados').textContent = stats.pedidos_completados || 0;
      document.getElementById('stat-enviados').textContent = stats.pedidos_enviados || 0;
      document.getElementById('stat-total-gastado').textContent = `S/ ${parseFloat(stats.total_gastado || 0).toFixed(2)}`;
    }

    // Mostrar pedidos
    mostrarPedidos(pedidosCache);

  } catch (error) {
    console.error('Error al cargar pedidos:', error);
    listaPedidos.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Error al cargar los pedidos. Por favor, intenta nuevamente.
      </div>
    `;
  }
}

/**
 * Mostrar lista de pedidos
 * @param {Array} pedidos - Lista de pedidos a mostrar
 */
function mostrarPedidos(pedidos) {
  const listaPedidos = document.getElementById('listaPedidos');

  if (!pedidos || pedidos.length === 0) {
    listaPedidos.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-bag-x fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">No tienes pedidos todavía</h5>
        <p>Cuando realices una compra, aparecerá aquí</p>
        <a href="catalogo.html" class="btn btn-primary mt-3">
          <i class="bi bi-shop me-2"></i>Ir a Catálogo
        </a>
      </div>
    `;
    return;
  }

  // Filtrar pedidos si hay filtro activo
  const pedidosFiltrados = filtroActual === 'todos' 
    ? pedidos 
    : pedidos.filter(p => p.estado === filtroActual);

  if (pedidosFiltrados.length === 0) {
    listaPedidos.innerHTML = `
      <div class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i>
        No hay pedidos con el estado: <strong>${filtroActual}</strong>
      </div>
    `;
    return;
  }

  listaPedidos.innerHTML = pedidosFiltrados.map(pedido => `
    <div class="pedido-item" data-pedido-id="${pedido.id}">
      <div class="row align-items-center">
        <div class="col-md-3">
          <h6 class="mb-1">#${pedido.id.substring(0, 8).toUpperCase()}</h6>
          <small class="text-muted">${formatearFecha(pedido.created_at)}</small>
        </div>
        <div class="col-md-3">
          <div class="d-flex align-items-center">
            <i class="bi ${obtenerIconoEstado(pedido.estado)} fs-4 me-2"></i>
            <div>
              <span class="badge ${obtenerClaseBadgeEstado(pedido.estado)}">
                ${pedido.estado.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div class="col-md-2 text-center">
          <h5 class="mb-0 text-primary">S/ ${parseFloat(pedido.total).toFixed(2)}</h5>
          <small class="text-muted">${pedido.metodo_pago || 'N/A'}</small>
        </div>
        <div class="col-md-2 text-center">
          <small class="text-muted">${pedido.nombre || 'Cliente'}</small>
        </div>
        <div class="col-md-2 text-end">
          <button class="btn btn-outline-primary btn-sm" onclick="verDetallePedido('${pedido.id}')">
            <i class="bi bi-eye me-1"></i>Ver Detalles
          </button>
          ${pedido.estado === 'pendiente' ? `
            <button class="btn btn-outline-warning btn-sm mt-1" onclick="confirmarCancelarPedido('${pedido.id}')">
              <i class="bi bi-x-circle me-1"></i>Cancelar
            </button>
          ` : ''}
          <button class="btn btn-outline-danger btn-sm mt-1" onclick="confirmarEliminarPedido('${pedido.id}')">
            <i class="bi bi-trash me-1"></i>Eliminar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Filtrar pedidos por estado
 * @param {String} estado - Estado a filtrar
 */
function filtrarPedidosPorEstado(estado) {
  filtroActual = estado;
  
  // Actualizar botones activos
  document.querySelectorAll('#misPedidosModal .btn-group button').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Mostrar pedidos filtrados
  mostrarPedidos(pedidosCache);
}

/**
 * Ver detalle completo de un pedido
 * @param {String} pedidoId - ID del pedido
 */
async function verDetallePedido(pedidoId) {
  const modal = new bootstrap.Modal(document.getElementById('detallePedidoModal'));
  const content = document.getElementById('detallePedidoContent');
  
  content.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-3">Cargando detalle...</p>
    </div>
  `;
  
  modal.show();

  try {
    const pedido = await obtenerDetallePedido(pedidoId);
    
    if (!pedido) {
      content.innerHTML = '<div class="alert alert-danger">No se pudo cargar el pedido</div>';
      return;
    }

    content.innerHTML = `
      <!-- Cabecera del Pedido -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 class="mb-0">#${pedido.id.substring(0, 8).toUpperCase()}</h4>
              <small class="text-muted">${formatearFecha(pedido.created_at)}</small>
            </div>
            <span class="badge ${obtenerClaseBadgeEstado(pedido.estado)} fs-6">
              <i class="bi ${obtenerIconoEstado(pedido.estado)} me-1"></i>
              ${pedido.estado.toUpperCase()}
            </span>
          </div>

          <!-- Estado del pedido -->
          <div class="alert alert-info">
            <strong>Estado:</strong> ${pedido.estado}
            ${pedido.notas ? `<br><strong>Notas:</strong> ${pedido.notas}` : ''}
          </div>
        </div>
      </div>

      <!-- Información del Cliente -->
      <div class="card mb-3">
        <div class="card-header">
          <h6 class="mb-0"><i class="bi bi-person me-2"></i>Información del Cliente</h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p class="mb-2"><strong>Nombre:</strong> ${pedido.nombre || 'N/A'}</p>
              <p class="mb-2"><strong>Email:</strong> ${pedido.email}</p>
            </div>
            <div class="col-md-6">
              <p class="mb-2"><strong>Teléfono:</strong> ${pedido.telefono || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Productos del Pedido -->
      <div class="card mb-3">
        <div class="card-header">
          <h6 class="mb-0"><i class="bi bi-box-seam me-2"></i>Productos (${pedido.items ? pedido.items.length : 0})</h6>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-center">Cantidad</th>
                  <th class="text-end">Precio Unit.</th>
                  <th class="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${pedido.items && pedido.items.length > 0 ? pedido.items.map(item => `
                  <tr>
                    <td>
                      <strong>${item.nombre_producto}</strong>
                    </td>
                    <td class="text-center">${item.cantidad}</td>
                    <td class="text-end">S/ ${parseFloat(item.precio).toFixed(2)}</td>
                    <td class="text-end"><strong>S/ ${parseFloat(item.subtotal).toFixed(2)}</strong></td>
                  </tr>
                `).join('') : '<tr><td colspan="4" class="text-center">No hay productos</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Resumen de Pago -->
      <div class="card">
        <div class="card-header">
          <h6 class="mb-0"><i class="bi bi-wallet2 me-2"></i>Resumen de Pago</h6>
        </div>
        <div class="card-body">
          <div class="d-flex justify-content-between fw-bold fs-5">
            <span>Total:</span>
            <span class="text-primary">S/ ${parseFloat(pedido.total).toFixed(2)}</span>
          </div>
          <div class="mt-3">
            <small class="text-muted">
              <i class="bi bi-credit-card me-1"></i>
              Método de pago: <strong>${pedido.metodo_pago || 'No especificado'}</strong>
            </small>
          </div>
        </div>
      </div>

      ${pedido.estado === 'pendiente' ? `
        <div class="text-center mt-4">
          <button class="btn btn-warning me-2" onclick="confirmarCancelarPedido('${pedido.id}')">
            <i class="bi bi-x-circle me-2"></i>Cancelar Pedido
          </button>
          <button class="btn btn-danger" onclick="confirmarEliminarPedido('${pedido.id}')">
            <i class="bi bi-trash me-2"></i>Eliminar Pedido
          </button>
        </div>
      ` : `
        <div class="text-center mt-4">
          <button class="btn btn-danger" onclick="confirmarEliminarPedido('${pedido.id}')">
            <i class="bi bi-trash me-2"></i>Eliminar Pedido
          </button>
        </div>
      `}
    `;

  } catch (error) {
    console.error('Error al cargar detalle:', error);
    content.innerHTML = '<div class="alert alert-danger">Error al cargar el detalle del pedido</div>';
  }
}

/**
 * Confirmar cancelación de pedido
 * @param {String} pedidoId - ID del pedido
 */
function confirmarCancelarPedido(pedidoId) {
  if (confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
    cancelarPedidoUI(pedidoId);
  }
}

/**
 * Confirmar antes de eliminar pedido
 * @param {String} pedidoId - ID del pedido
 */
function confirmarEliminarPedido(pedidoId) {
  eliminarPedidoUI(pedidoId);
}

/**
 * Eliminar pedido con feedback UI
 * @param {String} pedidoId - ID del pedido
 */
async function eliminarPedidoUI(pedidoId) {
  try {
    const exito = await eliminarPedido(pedidoId);
    
    if (exito) {
      alert('✅ Pedido eliminado exitosamente');
      
      // Recargar pedidos
      await cargarMisPedidos();
      
      // Cerrar modal de detalle si está abierto
      const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('detallePedidoModal'));
      if (modalDetalle) {
        modalDetalle.hide();
      }
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al eliminar el pedido');
  }
}

/**
 * Cancelar pedido con feedback UI
 * @param {String} pedidoId - ID del pedido
 */
async function cancelarPedidoUI(pedidoId) {
  try {
    const exito = await cancelarPedido(pedidoId);
    
    if (exito) {
      alert('Pedido cancelado exitosamente');
      
      // Recargar pedidos
      await cargarMisPedidos();
      
      // Cerrar modal de detalle si está abierto
      const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('detallePedidoModal'));
      if (modalDetalle) {
        modalDetalle.hide();
      }
    } else {
      alert('No se pudo cancelar el pedido');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cancelar el pedido');
  }
}

/**
 * Abrir modal para finalizar compra
 */
function abrirModalFinalizarCompra() {
  // Verificar si el usuario está autenticado
  if (!authState.isLoggedIn) {
    alert('⚠️ Por favor, inicia sesión para realizar una compra');
    // Opcionalmente abrir el modal de login
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      const modal = new bootstrap.Modal(loginModal);
      modal.show();
    }
    return;
  }

  // Verificar que el carrito tenga productos
  const itemsCarrito = window.carrito ? window.carrito.items : [];
  if (!itemsCarrito || itemsCarrito.length === 0) {
    alert('⚠️ Tu carrito está vacío. Agrega productos antes de realizar la compra.');
    return;
  }

  // Calcular totales
  const subtotal = itemsCarrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const total = subtotal;

  // Actualizar resumen
  const subtotalElem = document.getElementById('resumen-subtotal');
  const totalElem = document.getElementById('resumen-total');
  
  if (subtotalElem) subtotalElem.textContent = `S/ ${subtotal.toFixed(2)}`;
  if (totalElem) totalElem.textContent = `S/ ${total.toFixed(2)}`;

  // Prellenar con datos del perfil si existen
  if (authState.user) {
    const nombreInput = document.getElementById('compra-nombre');
    const telefonoInput = document.getElementById('compra-telefono');
    
    if (nombreInput) nombreInput.value = authState.user.nombre_completo || '';
    if (telefonoInput) telefonoInput.value = authState.user.telefono || '';
  }

  // Abrir modal
  const modalElem = document.getElementById('confirmarCompraModal');
  if (modalElem) {
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
  } else {
    console.error('❌ No se encontró el modal de confirmar compra');
    alert('Error: No se pudo abrir el formulario de compra');
  }
}

/**
 * Procesar compra y crear pedido
 */
async function procesarCompra() {
  const form = document.getElementById('formConfirmarCompra');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Recopilar datos del formulario
  const datosEnvio = {
    nombre: document.getElementById('compra-nombre').value.trim(),
    telefono: document.getElementById('compra-telefono').value.trim(),
    metodoPago: document.getElementById('compra-metodo-pago').value,
    notas: document.getElementById('compra-notas').value.trim()
  };

  // Mostrar spinner en el botón
  const btnConfirmar = event.target;
  const textoOriginal = btnConfirmar.innerHTML;
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

  try {
    // Crear pedido
    const resultado = await crearPedido(datosEnvio);

    if (resultado.success) {
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('confirmarCompraModal'));
      modal.hide();

      // Mostrar mensaje de éxito
      alert(`¡Pedido creado exitosamente!\n\n${resultado.mensaje}\n\nPuedes ver el estado de tu pedido en "Mis Pedidos"`);

      // Limpiar formulario
      form.reset();

      // Cerrar el carrito si está abierto
      const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('miniCart'));
      if (offcanvas) {
        offcanvas.hide();
      }

    } else {
      alert('Error al crear el pedido: ' + resultado.error);
    }

  } catch (error) {
    console.error('Error al procesar compra:', error);
    alert('Ocurrió un error al procesar tu compra. Por favor, intenta nuevamente.');
  } finally {
    // Restaurar botón
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = textoOriginal;
  }
}

console.log('✅ Módulo de UI de pedidos cargado');

// Exportar funciones al scope global
window.abrirMisPedidos = abrirMisPedidos;
window.cargarMisPedidos = cargarMisPedidos;
window.verDetallePedido = verDetallePedido;
window.filtrarPedidosPorEstado = filtrarPedidosPorEstado;
window.abrirModalFinalizarCompra = abrirModalFinalizarCompra;
window.procesarCompra = procesarCompra;
