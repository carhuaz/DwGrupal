/* ============================================================
   PANEL DE ADMINISTRACIÓN DE PEDIDOS
   Gestionar todos los pedidos del sistema (SOLO ADMIN)
============================================================ */

'use strict';

let pedidosAdmin = [];
let filtroEstadoAdmin = null;

/**
 * Inicializar panel de administración de pedidos
 */
async function inicializarPanelAdminPedidos() {
  console.log('🚀 Inicializando panel de administración de pedidos...');
  
  // Verificar que el usuario sea admin
  if (!authState.user || authState.user.rol !== 'admin') {
    console.error('❌ Acceso denegado: requiere permisos de administrador');
    return;
  }

  console.log('✅ Usuario admin verificado:', authState.user.email);
  
  // Configurar event listeners
  configurarFiltrosAdmin();
  
  // Cargar pedidos
  await cargarPedidosAdmin();
}

/**
 * Configurar filtros de estado
 */
function configurarFiltrosAdmin() {
  const filtros = document.querySelectorAll('.filter-btn');
  filtros.forEach(btn => {
    btn.addEventListener('click', async () => {
      // Remover active de todos
      filtros.forEach(f => f.classList.remove('active'));
      // Agregar active al clickeado
      btn.classList.add('active');
      
      const estado = btn.dataset.estado;
      filtroEstadoAdmin = estado === 'todos' ? null : estado;
      
      console.log('📌 Filtro cambiado a:', estado);
      await cargarPedidosAdmin(filtroEstadoAdmin);
    });
  });
}

/**
 * Cargar todos los pedidos del sistema
 */
async function cargarPedidosAdmin(filtroEstado = null) {
  try {
    console.log('📦 Cargando pedidos del admin...', filtroEstado ? `Filtro: ${filtroEstado}` : 'Sin filtro');
    
    // Mostrar loading
    const container = document.getElementById('adminPedidosContainer');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-3">Cargando pedidos...</p>
        </div>
      `;
    }

    // Obtener pedidos
    console.log('🔍 Llamando a obtenerTodosPedidos...');
    pedidosAdmin = await obtenerTodosPedidos(filtroEstado);
    console.log('✅ Pedidos obtenidos:', pedidosAdmin.length);
    
    // Obtener estadísticas
    console.log('📊 Obteniendo estadísticas...');
    const stats = await obtenerEstadisticasGlobales();
    console.log('✅ Estadísticas:', stats);
    
    // Actualizar estadísticas
    if (stats) {
      actualizarEstadisticasAdmin(stats);
    }

    // Mostrar pedidos
    mostrarPedidosAdmin(pedidosAdmin);

  } catch (error) {
    console.error('❌ Error al cargar pedidos:', error);
    const container = document.getElementById('adminPedidosContainer');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Error: ${error.message}
        </div>
      `;
    }
  }
}

/**
 * Actualizar estadísticas en el dashboard
 */
function actualizarEstadisticasAdmin(stats) {
  console.log('📊 Actualizando estadísticas:', stats);
  
  const elementos = {
    'admin-stat-total': stats.total_pedidos || 0,
    'admin-stat-pendientes': stats.pedidos_pendientes || 0,
    'admin-stat-procesando': stats.pedidos_procesando || 0,
    'admin-stat-completados': stats.pedidos_completados || 0,
    'admin-stat-ventas': `S/ ${parseFloat(stats.total_ventas || 0).toFixed(2)}`
  };

  for (const [id, valor] of Object.entries(elementos)) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
      console.log(`✅ Actualizado ${id}: ${valor}`);
    } else {
      console.warn(`⚠️ No se encontró el elemento: ${id}`);
    }
  }
}

/**
 * Mostrar lista de pedidos en el panel de admin
 */
function mostrarPedidosAdmin(pedidos) {
  const container = document.getElementById('adminPedidosContainer');
  if (!container) return;

  if (!pedidos || pedidos.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">No hay pedidos</h5>
        <p>Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>ID Pedido</th>
            <th>Cliente</th>
            <th>Email</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${pedidos.map(pedido => `
            <tr>
              <td>
                <strong>#${pedido.id.substring(0, 8).toUpperCase()}</strong>
              </td>
              <td>${pedido.nombre || 'N/A'}</td>
              <td>${pedido.email}</td>
              <td><strong class="text-primary">S/ ${parseFloat(pedido.total).toFixed(2)}</strong></td>
              <td>
                <span class="badge ${obtenerClaseBadgeEstado(pedido.estado)}">
                  ${pedido.estado.toUpperCase()}
                </span>
              </td>
              <td>
                <small>${new Date(pedido.created_at).toLocaleDateString('es-ES')}</small>
              </td>
              <td>
                <div class="btn-group btn-group-sm" role="group">
                  <button class="btn btn-outline-primary" onclick="verDetallePedidoAdmin('${pedido.id}')" title="Ver detalles">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-outline-success" onclick="abrirModalCambiarEstado('${pedido.id}', '${pedido.estado}')" title="Cambiar estado">
                    <i class="bi bi-arrow-repeat"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Ver detalle de un pedido (versión admin)
 */
async function verDetallePedidoAdmin(pedidoId) {
  const modal = new bootstrap.Modal(document.getElementById('adminDetallePedidoModal'));
  const content = document.getElementById('adminDetallePedidoContent');
  
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
      <div class="row mb-4">
        <div class="col-md-6">
          <h5>Pedido #${pedido.id.substring(0, 8).toUpperCase()}</h5>
          <p class="text-muted mb-0">
            <i class="bi bi-calendar me-1"></i>
            ${new Date(pedido.created_at).toLocaleString('es-ES')}
          </p>
        </div>
        <div class="col-md-6 text-end">
          <span class="badge ${obtenerClaseBadgeEstado(pedido.estado)} fs-6">
            ${pedido.estado.toUpperCase()}
          </span>
          <div class="mt-2">
            <button class="btn btn-sm btn-primary" onclick="abrirModalCambiarEstado('${pedido.id}', '${pedido.estado}')">
              <i class="bi bi-arrow-repeat me-1"></i>Cambiar Estado
            </button>
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
              <p class="mb-2"><strong>ID Usuario:</strong> ${pedido.usuario_id ? pedido.usuario_id.substring(0, 8) : 'N/A'}</p>
            </div>
          </div>
          ${pedido.notas ? `
            <div class="alert alert-info mt-3 mb-0">
              <strong>Notas del cliente:</strong><br>${pedido.notas}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Productos del Pedido -->
      <div class="card mb-3">
        <div class="card-header">
          <h6 class="mb-0"><i class="bi bi-box-seam me-2"></i>Productos</h6>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-center">Cantidad</th>
                  <th class="text-end">Precio</th>
                  <th class="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${pedido.items && pedido.items.length > 0 ? pedido.items.map(item => `
                  <tr>
                    <td>${item.nombre_producto}</td>
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

      <!-- Total -->
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>Método de pago:</strong>
              <span class="badge bg-secondary">${pedido.metodo_pago || 'No especificado'}</span>
            </div>
            <div>
              <h4 class="mb-0 text-primary">Total: S/ ${parseFloat(pedido.total).toFixed(2)}</h4>
            </div>
          </div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('Error al cargar detalle:', error);
    content.innerHTML = '<div class="alert alert-danger">Error al cargar el detalle del pedido</div>';
  }
}

/**
 * Abrir modal para cambiar estado de pedido
 */
function abrirModalCambiarEstado(pedidoId, estadoActual) {
  const modal = new bootstrap.Modal(document.getElementById('cambiarEstadoModal'));
  
  // Guardar el ID del pedido en el modal
  document.getElementById('cambiarEstadoModal').dataset.pedidoId = pedidoId;
  
  // Mostrar estado actual
  document.getElementById('estadoActualText').textContent = estadoActual.toUpperCase();
  
  // Seleccionar el siguiente estado lógico
  const selectEstado = document.getElementById('nuevoEstadoSelect');
  selectEstado.value = obtenerSiguienteEstado(estadoActual);
  
  modal.show();
}

/**
 * Obtener el siguiente estado lógico
 */
function obtenerSiguienteEstado(estadoActual) {
  const flujo = {
    'pendiente': 'procesando',
    'procesando': 'completado',
    'completado': 'completado',
    'cancelado': 'cancelado',
    'reembolsado': 'reembolsado'
  };
  return flujo[estadoActual] || 'procesando';
}

/**
 * Confirmar cambio de estado
 */
async function confirmarCambioEstado() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('cambiarEstadoModal'));
  const pedidoId = document.getElementById('cambiarEstadoModal').dataset.pedidoId;
  const nuevoEstado = document.getElementById('nuevoEstadoSelect').value;
  
  if (!pedidoId || !nuevoEstado) {
    alert('Error: datos incompletos');
    return;
  }

  // Deshabilitar botón
  const btn = event.target;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Actualizando...';

  try {
    const exito = await actualizarEstadoPedido(pedidoId, nuevoEstado);
    
    if (exito) {
      alert('✅ Estado actualizado exitosamente');
      modal.hide();
      
      // Recargar pedidos
      await cargarPedidosAdmin(filtroEstadoAdmin);
      
      // Cerrar modal de detalle si está abierto
      const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('adminDetallePedidoModal'));
      if (modalDetalle) {
        modalDetalle.hide();
      }
    } else {
      alert('❌ No se pudo actualizar el estado del pedido');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al actualizar el estado');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Confirmar Cambio';
  }
}

/**
 * Filtrar pedidos por estado
 */
function filtrarPedidosAdminPorEstado(estado) {
  filtroEstadoAdmin = estado === 'todos' ? null : estado;
  
  // Actualizar botones activos
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Recargar pedidos con filtro
  cargarPedidosAdmin(filtroEstadoAdmin);
}

/**
 * Exportar pedidos a CSV
 */
function exportarPedidosCSV() {
  if (!pedidosAdmin || pedidosAdmin.length === 0) {
    alert('No hay pedidos para exportar');
    return;
  }

  // Crear CSV
  const headers = ['ID', 'Fecha', 'Cliente', 'Email', 'Teléfono', 'Total', 'Estado', 'Método Pago'];
  const rows = pedidosAdmin.map(p => [
    p.id.substring(0, 8),
    new Date(p.created_at).toLocaleDateString('es-ES'),
    p.nombre || 'N/A',
    p.email,
    p.telefono || 'N/A',
    parseFloat(p.total).toFixed(2),
    p.estado,
    p.metodo_pago || 'N/A'
  ]);

  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(field => `"${field}"`).join(',') + '\n';
  });

  // Descargar archivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

console.log('✅ Módulo de administración de pedidos cargado');
