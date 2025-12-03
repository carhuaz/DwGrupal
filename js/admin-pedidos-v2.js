/* ============================================================
   PANEL DE ADMINISTRACIÓN DE PEDIDOS - VERSIÓN 2.0
   Sistema completo para gestionar pedidos con Supabase
============================================================ */

'use strict';

// Variables globales
let pedidosAdmin = [];
let filtroEstadoActual = null;
let pedidoSeleccionado = null;

/**
 * INICIALIZACIÓN DEL PANEL
 */
async function inicializarPanelAdminPedidos() {
  console.log('🚀 [ADMIN] Inicializando panel de pedidos...');
  
  try {
    // Verificar autenticación
    if (!authState.user || authState.user.rol !== 'admin') {
      console.error('❌ [ADMIN] Usuario no autorizado');
      alert('⚠️ Solo administradores pueden acceder a este panel');
      window.location.href = 'index.html';
      return;
    }

    console.log('✅ [ADMIN] Usuario admin verificado:', authState.user.email);

    // Configurar event listeners
    configurarEventListeners();

    // Cargar pedidos iniciales
    await cargarTodosLosPedidos();

  } catch (error) {
    console.error('❌ [ADMIN] Error al inicializar:', error);
    mostrarError('Error al inicializar el panel: ' + error.message);
  }
}

/**
 * CONFIGURAR EVENT LISTENERS
 */
function configurarEventListeners() {
  console.log('🔧 [ADMIN] Configurando event listeners...');

  // Botones de filtro
  const botonesFiltro = document.querySelectorAll('.filter-btn');
  botonesFiltro.forEach(btn => {
    btn.addEventListener('click', function() {
      // Quitar clase active de todos
      botonesFiltro.forEach(b => b.classList.remove('active'));
      // Agregar clase active al clickeado
      this.classList.add('active');
      
      // Obtener el estado del filtro
      const estado = this.dataset.estado;
      filtroEstadoActual = estado === 'todos' ? null : estado;
      
      console.log('🔍 [ADMIN] Filtro cambiado a:', estado);
      
      // Aplicar filtro
      aplicarFiltro();
    });
  });

  console.log('✅ [ADMIN] Event listeners configurados');
}

/**
 * CARGAR TODOS LOS PEDIDOS DESDE SUPABASE
 */
async function cargarTodosLosPedidos() {
  console.log('📦 [ADMIN] Cargando pedidos desde Supabase...');
  
  // Mostrar loading
  mostrarCargando();

  try {
    // Consultar TODOS los pedidos con sus items
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        pedidos_items (
          id,
          producto_id,
          nombre_producto,
          precio,
          cantidad,
          subtotal
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [ADMIN] Error en query:', error);
      throw error;
    }

    pedidosAdmin = pedidos || [];
    console.log(`✅ [ADMIN] ${pedidosAdmin.length} pedidos cargados desde BD`);

    // Actualizar estadísticas
    actualizarEstadisticas();

    // Mostrar pedidos
    aplicarFiltro();

  } catch (error) {
    console.error('❌ [ADMIN] Error al cargar pedidos:', error);
    mostrarError('Error al cargar pedidos: ' + error.message);
  }
}

/**
 * APLICAR FILTRO DE ESTADO
 */
function aplicarFiltro() {
  console.log('🔍 [ADMIN] Aplicando filtro:', filtroEstadoActual || 'todos');

  let pedidosFiltrados = pedidosAdmin;

  if (filtroEstadoActual) {
    pedidosFiltrados = pedidosAdmin.filter(p => p.estado === filtroEstadoActual);
  }

  console.log(`📊 [ADMIN] Mostrando ${pedidosFiltrados.length} pedidos`);
  mostrarPedidosEnTabla(pedidosFiltrados);
}

/**
 * ACTUALIZAR ESTADÍSTICAS
 */
function actualizarEstadisticas() {
  console.log('📊 [ADMIN] Actualizando estadísticas...');

  const total = pedidosAdmin.length;
  const pendientes = pedidosAdmin.filter(p => p.estado === 'pendiente').length;
  const procesando = pedidosAdmin.filter(p => p.estado === 'procesando').length;
  const completados = pedidosAdmin.filter(p => p.estado === 'completado').length;
  const ventasTotales = pedidosAdmin.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

  // Actualizar DOM
  document.getElementById('admin-stat-total').textContent = total;
  document.getElementById('admin-stat-pendientes').textContent = pendientes;
  document.getElementById('admin-stat-procesando').textContent = procesando;
  document.getElementById('admin-stat-completados').textContent = completados;
  document.getElementById('admin-stat-ventas').textContent = `S/ ${ventasTotales.toFixed(2)}`;

  console.log('✅ [ADMIN] Estadísticas actualizadas:', {
    total,
    pendientes,
    procesando,
    completados,
    ventas: ventasTotales
  });
}

/**
 * MOSTRAR PEDIDOS EN TABLA
 */
function mostrarPedidosEnTabla(pedidos) {
  const container = document.getElementById('adminPedidosContainer');
  
  if (!pedidos || pedidos.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-inbox fs-1 text-muted"></i>
        <h5 class="text-muted mt-3">No hay pedidos</h5>
        <p class="text-muted">Los pedidos aparecerán aquí cuando los usuarios realicen compras</p>
      </div>
    `;
    return;
  }

  let html = `
    <table class="table table-hover">
      <thead class="table-dark">
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Fecha</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
  `;

  pedidos.forEach(pedido => {
    const fecha = new Date(pedido.created_at).toLocaleDateString('es-PE', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const nombreCliente = pedido.nombre || 'Sin nombre';
    const emailCliente = pedido.email || 'Sin email';
    const telefonoCliente = pedido.telefono || 'Sin teléfono';
    const cantidadItems = pedido.pedidos_items?.length || 0;
    
    html += `
      <tr>
        <td><code title="${pedido.id}">${pedido.id.substring(0, 8)}...</code></td>
        <td>
          <strong>${nombreCliente}</strong><br>
          <small class="text-muted"><i class="bi bi-envelope"></i> ${emailCliente}</small><br>
          <small class="text-muted"><i class="bi bi-phone"></i> ${telefonoCliente}</small>
        </td>
        <td>
          <small>${fecha}</small><br>
          <span class="badge bg-secondary">${cantidadItems} item${cantidadItems !== 1 ? 's' : ''}</span>
        </td>
        <td><strong class="text-success">S/ ${parseFloat(pedido.total).toFixed(2)}</strong></td>
        <td>${obtenerBadgeEstado(pedido.estado)}</td>
        <td>
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-primary" onclick="verDetallePedido('${pedido.id}')" title="Ver detalles completos">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-warning" onclick="abrirModalCambiarEstado('${pedido.id}')" title="Cambiar estado del pedido">
              <i class="bi bi-arrow-repeat"></i>
            </button>
            <button class="btn btn-danger" onclick="eliminarPedido('${pedido.id}')" title="Eliminar pedido">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

/**
 * OBTENER BADGE DE ESTADO
 */
function obtenerBadgeEstado(estado) {
  const badges = {
    'pendiente': '<span class="badge bg-warning text-dark">Pendiente</span>',
    'procesando': '<span class="badge bg-info">Procesando</span>',
    'completado': '<span class="badge bg-success">Completado</span>',
    'cancelado': '<span class="badge bg-danger">Cancelado</span>',
    'reembolsado': '<span class="badge bg-secondary">Reembolsado</span>'
  };
  return badges[estado] || `<span class="badge bg-secondary">${estado}</span>`;
}

/**
 * VER DETALLE DEL PEDIDO
 */
function verDetallePedido(pedidoId) {
  console.log('👁️ [ADMIN] Viendo detalle del pedido:', pedidoId);

  const pedido = pedidosAdmin.find(p => p.id === pedidoId);
  if (!pedido) {
    alert('❌ Pedido no encontrado');
    return;
  }

  const nombreCliente = pedido.nombre || 'Sin nombre';
  const emailCliente = pedido.email || 'Sin email';
  const telefonoCliente = pedido.telefono || 'Sin teléfono';
  const metodoPago = pedido.metodo_pago || 'No especificado';
  const fecha = new Date(pedido.created_at).toLocaleString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  let itemsHtml = '';
  let subtotalItems = 0;
  
  if (pedido.pedidos_items && pedido.pedidos_items.length > 0) {
    itemsHtml = '<div class="table-responsive"><table class="table table-sm table-hover">';
    itemsHtml += `
      <thead class="table-light">
        <tr>
          <th>Producto</th>
          <th class="text-center">Cantidad</th>
          <th class="text-end">Precio Unit.</th>
          <th class="text-end">Subtotal</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    pedido.pedidos_items.forEach((item, idx) => {
      subtotalItems += parseFloat(item.subtotal || 0);
      itemsHtml += `
        <tr>
          <td>
            <strong>${item.nombre_producto}</strong><br>
            <small class="text-muted">ID: ${item.producto_id?.substring(0, 8)}...</small>
          </td>
          <td class="text-center">
            <span class="badge bg-primary">${item.cantidad}</span>
          </td>
          <td class="text-end">S/ ${parseFloat(item.precio).toFixed(2)}</td>
          <td class="text-end"><strong>S/ ${parseFloat(item.subtotal).toFixed(2)}</strong></td>
        </tr>
      `;
    });
    
    itemsHtml += '</tbody></table></div>';
  } else {
    itemsHtml = '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> No hay items en este pedido</div>';
  }

  const modalContent = `
    <div class="card mb-3">
      <div class="card-header bg-primary text-white">
        <h6 class="mb-0"><i class="bi bi-info-circle"></i> Información del Pedido</h6>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-12 mb-2">
            <small class="text-muted">ID del Pedido:</small><br>
            <code class="user-select-all">${pedido.id}</code>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header bg-info text-white">
        <h6 class="mb-0"><i class="bi bi-person-circle"></i> Datos del Cliente</h6>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6 mb-2">
            <small class="text-muted"><i class="bi bi-person"></i> Nombre:</small><br>
            <strong>${nombreCliente}</strong>
          </div>
          <div class="col-md-6 mb-2">
            <small class="text-muted"><i class="bi bi-envelope"></i> Email:</small><br>
            <span>${emailCliente}</span>
          </div>
          <div class="col-md-6 mb-2">
            <small class="text-muted"><i class="bi bi-phone"></i> Teléfono:</small><br>
            <span>${telefonoCliente}</span>
          </div>
          <div class="col-md-6 mb-2">
            <small class="text-muted"><i class="bi bi-clock"></i> Fecha del Pedido:</small><br>
            <span>${fecha}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header bg-warning text-dark">
        <h6 class="mb-0"><i class="bi bi-tag"></i> Estado y Pago</h6>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6 mb-2">
            <small class="text-muted">Estado Actual:</small><br>
            ${obtenerBadgeEstado(pedido.estado)}
          </div>
          <div class="col-md-6 mb-2">
            <small class="text-muted"><i class="bi bi-credit-card"></i> Método de Pago:</small><br>
            <span class="badge bg-secondary">${metodoPago}</span>
          </div>
        </div>
        ${pedido.notas ? `
          <div class="mt-2">
            <small class="text-muted"><i class="bi bi-chat-left-text"></i> Notas del Cliente:</small><br>
            <div class="alert alert-info mb-0 mt-1">${pedido.notas}</div>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header bg-success text-white">
        <h6 class="mb-0"><i class="bi bi-cart-check"></i> Productos del Pedido</h6>
      </div>
      <div class="card-body p-0">
        ${itemsHtml}
      </div>
    </div>

    <div class="card">
      <div class="card-body bg-light">
        <div class="row">
          <div class="col-6">
            <h6 class="text-muted mb-0">Total de Items:</h6>
            <h5 class="mb-0"><strong>${pedido.pedidos_items?.length || 0}</strong> producto${pedido.pedidos_items?.length !== 1 ? 's' : ''}</h5>
          </div>
          <div class="col-6 text-end">
            <h6 class="text-muted mb-0">Total a Pagar:</h6>
            <h4 class="mb-0"><strong class="text-success">S/ ${parseFloat(pedido.total).toFixed(2)}</strong></h4>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('adminDetallePedidoContent').innerHTML = modalContent;
  
  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById('adminDetallePedidoModal'));
  modal.show();
}

/**
 * ABRIR MODAL PARA CAMBIAR ESTADO
 */
function abrirModalCambiarEstado(pedidoId) {
  console.log('🔄 [ADMIN] Abriendo modal para cambiar estado:', pedidoId);

  const pedido = pedidosAdmin.find(p => p.id === pedidoId);
  if (!pedido) {
    alert('❌ Pedido no encontrado');
    return;
  }

  pedidoSeleccionado = pedido;

  // Obtener información del cliente
  const nombreCliente = pedido.nombre || 'Cliente';
  const estadoActual = pedido.estado;

  // Actualizar modal con información contextual
  const estadoActualBadge = obtenerBadgeEstado(estadoActual);
  
  // Agregar información del pedido en el modal
  const modalBody = document.querySelector('#cambiarEstadoModal .modal-body');
  
  // Eliminar info anterior si existe
  const alertaAnterior = modalBody.querySelector('.alert-info');
  if (alertaAnterior) {
    alertaAnterior.remove();
  }
  
  const infoHTML = `
    <div class="alert alert-info alert-dismissible fade show">
      <strong><i class="bi bi-receipt"></i> Pedido:</strong> <code>${pedido.id.substring(0, 8)}...</code><br>
      <strong><i class="bi bi-person"></i> Cliente:</strong> ${nombreCliente}<br>
      <strong><i class="bi bi-currency-dollar"></i> Total:</strong> S/ ${parseFloat(pedido.total).toFixed(2)}<br>
      <strong><i class="bi bi-tag"></i> Estado actual:</strong> ${estadoActualBadge}
    </div>
  `;
  
  // Insertar al inicio del modal body
  modalBody.insertAdjacentHTML('afterbegin', infoHTML);

  // Sugerir siguiente estado lógico
  const siguienteEstado = obtenerSiguienteEstado(estadoActual);
  document.getElementById('nuevoEstadoSelect').value = siguienteEstado;

  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById('cambiarEstadoModal'));
  modal.show();
}
  document.getElementById('nuevoEstadoSelect').value = siguienteEstado;

  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById('cambiarEstadoModal'));
  modal.show();
}

/**
 * OBTENER SIGUIENTE ESTADO LÓGICO
 */
function obtenerSiguienteEstado(estadoActual) {
  const flujo = {
    'pendiente': 'procesando',
    'procesando': 'completado',
    'completado': 'completado',
    'cancelado': 'cancelado',
    'reembolsado': 'reembolsado'
  };
  return flujo[estadoActual] || estadoActual;
}

/**
 * CONFIRMAR CAMBIO DE ESTADO
 */
async function confirmarCambioEstado() {
  if (!pedidoSeleccionado) {
    alert('❌ No hay pedido seleccionado');
    return;
  }

  const nuevoEstado = document.getElementById('nuevoEstadoSelect').value;
  const estadoAnterior = pedidoSeleccionado.estado;
  
  if (nuevoEstado === estadoAnterior) {
    alert('⚠️ El estado seleccionado es el mismo que el actual');
    return;
  }

  // Mensajes contextuales según el cambio de estado
  const mensajes = {
    'procesando': '📦 El pedido se marcará como "En Proceso". El cliente será notificado.',
    'completado': '✅ El pedido se marcará como "Completado". Indica que fue entregado.',
    'cancelado': '❌ El pedido será CANCELADO. Esta acción es importante.',
    'reembolsado': '💰 Se marcará como "Reembolsado". Indica que se devolvió el dinero.',
    'pendiente': '⏳ El pedido volverá a estado "Pendiente".'
  };

  const confirmacion = confirm(`${mensajes[nuevoEstado] || 'Cambiar estado del pedido'}\n\n¿Continuar?`);
  if (!confirmacion) return;

  console.log(`🔄 [ADMIN] Cambiando estado: ${estadoAnterior} → ${nuevoEstado} (Pedido: ${pedidoSeleccionado.id.substring(0, 8)}...)`);

  try {
    // Actualizar en Supabase
    const { data, error } = await supabase
      .from('pedidos')
      .update({ 
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', pedidoSeleccionado.id)
      .select();

    if (error) {
      console.error('❌ [ADMIN] Error al actualizar estado:', error);
      throw error;
    }

    console.log('✅ [ADMIN] Estado actualizado en BD:', data);

    // Cerrar modal
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('cambiarEstadoModal'));
    if (modalInstance) modalInstance.hide();

    // Mostrar notificación de éxito
    mostrarNotificacionExito(`Estado cambiado: ${estadoAnterior} → ${nuevoEstado.toUpperCase()}`);

    // Recargar pedidos
    await cargarTodosLosPedidos();

  } catch (error) {
    console.error('❌ [ADMIN] Error:', error);
    alert('❌ Error al cambiar el estado: ' + error.message);
  }
}

/**
 * MOSTRAR NOTIFICACIÓN DE ÉXITO
 */
function mostrarNotificacionExito(mensaje) {
  // Crear toast de Bootstrap o alert personalizado
  const toast = document.createElement('div');
  toast.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
  toast.style.zIndex = '9999';
  toast.innerHTML = `
    <i class="bi bi-check-circle-fill me-2"></i>
    <strong>¡Éxito!</strong> ${mensaje}
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/**
 * ELIMINAR PEDIDO
 */
async function eliminarPedido(pedidoId) {
  console.log('🗑️ [ADMIN] Solicitud de eliminar pedido:', pedidoId);

  const pedido = pedidosAdmin.find(p => p.id === pedidoId);
  if (!pedido) {
    alert('❌ Pedido no encontrado');
    return;
  }

  const nombreCliente = pedido.nombre || 'Cliente';
  const total = parseFloat(pedido.total).toFixed(2);

  const confirmar = confirm(
    `⚠️ ELIMINAR PEDIDO\n\n` +
    `Cliente: ${nombreCliente}\n` +
    `Total: S/ ${total}\n` +
    `Estado: ${pedido.estado}\n\n` +
    `Esta acción NO se puede deshacer.\n` +
    `Se eliminarán todos los datos del pedido.\n\n` +
    `¿Estás completamente seguro?`
  );
  
  if (!confirmar) {
    console.log('ℹ️ [ADMIN] Eliminación cancelada por el usuario');
    return;
  }

  console.log(`🗑️ [ADMIN] Eliminando pedido ${pedidoId.substring(0, 8)}... y sus items`);

  try {
    // Primero eliminar los items del pedido
    console.log('1️⃣ Eliminando items del pedido...');
    const { error: errorItems } = await supabase
      .from('pedidos_items')
      .delete()
      .eq('pedido_id', pedidoId);

    if (errorItems) {
      console.error('❌ [ADMIN] Error al eliminar items:', errorItems);
      throw errorItems;
    }
    console.log('✅ Items eliminados');

    // Luego eliminar el pedido
    console.log('2️⃣ Eliminando pedido...');
    const { error: errorPedido } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoId);

    if (errorPedido) {
      console.error('❌ [ADMIN] Error al eliminar pedido:', errorPedido);
      throw errorPedido;
    }

    console.log('✅ [ADMIN] Pedido eliminado exitosamente de la base de datos');
    
    // Mostrar notificación
    mostrarNotificacionExito(`Pedido de ${nombreCliente} eliminado correctamente`);

    // Recargar pedidos
    await cargarTodosLosPedidos();

  } catch (error) {
    console.error('❌ [ADMIN] Error en el proceso de eliminación:', error);
    alert('❌ Error al eliminar el pedido:\n\n' + error.message);
  }
}

/**
 * EXPORTAR PEDIDOS A CSV
 */
function exportarPedidosCSV() {
  console.log('📥 [ADMIN] Exportando pedidos a CSV...');

  if (pedidosAdmin.length === 0) {
    alert('⚠️ No hay pedidos para exportar');
    return;
  }

  // Crear CSV con todos los datos
  let csv = 'ID,Cliente,Email,Teléfono,Fecha,Total,Estado,Método Pago,Items,Notas\n';

  pedidosAdmin.forEach(pedido => {
    const nombre = (pedido.nombre || 'Sin nombre').replace(/,/g, ';');
    const email = (pedido.email || 'Sin email').replace(/,/g, ';');
    const telefono = (pedido.telefono || 'Sin teléfono').replace(/,/g, ';');
    const fecha = new Date(pedido.created_at).toLocaleString('es-PE');
    const items = pedido.pedidos_items?.length || 0;
    const notas = (pedido.notas || '').replace(/,/g, ';').replace(/\n/g, ' ');
    
    csv += `${pedido.id},${nombre},${email},${telefono},${fecha},${pedido.total},${pedido.estado},${pedido.metodo_pago || 'No especificado'},${items},${notas}\n`;
  });

  // Descargar archivo
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log('✅ [ADMIN] CSV descargado');
}

/**
 * UTILIDADES
 */
function mostrarCargando() {
  const container = document.getElementById('adminPedidosContainer');
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-3">Cargando pedidos...</p>
    </div>
  `;
}

function mostrarError(mensaje) {
  const container = document.getElementById('adminPedidosContainer');
  container.innerHTML = `
    <div class="alert alert-danger">
      <i class="bi bi-exclamation-triangle me-2"></i>
      <strong>Error:</strong> ${mensaje}
    </div>
  `;
}

// Exponer funciones globales
window.inicializarPanelAdminPedidos = inicializarPanelAdminPedidos;
window.cargarPedidosAdmin = cargarTodosLosPedidos;
window.verDetallePedido = verDetallePedido;
window.abrirModalCambiarEstado = abrirModalCambiarEstado;
window.confirmarCambioEstado = confirmarCambioEstado;
window.eliminarPedido = eliminarPedido;
window.exportarPedidosCSV = exportarPedidosCSV;

console.log('✅ [ADMIN] Módulo admin-pedidos-v2.js cargado');
