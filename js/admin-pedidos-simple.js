/* ============================================================
   PANEL DE ADMINISTRACIÓN DE PEDIDOS - VERSIÓN SIMPLIFICADA
   Sistema directo y eficiente
============================================================ */

'use strict';

// Estado global
let todosPedidos = [];
let filtroActivo = null;

/**
 * INICIALIZAR TODO
 */
async function inicializarPanelAdminPedidos() {
  console.log('🚀 Iniciando panel admin...');
  
  try {
    // Verificar que sea admin (aceptar 'admin' o 'administrador')
    const esAdmin = authState.user && 
                    (authState.user.rol === 'admin' || 
                     authState.user.rol === 'administrador' ||
                     authState.user.role === 'admin' ||
                     authState.user.role === 'administrador');
    
    if (!esAdmin) {
      console.error('❌ No es admin:', authState.user);
      alert('⚠️ Solo administradores pueden acceder a este panel');
      window.location.href = 'index.html';
      return;
    }

    console.log('✅ Admin verificado:', authState.user.email);

    // Configurar botones de filtro
    configurarFiltros();

    // Cargar pedidos
    await cargarPedidos();

  } catch (error) {
    console.error('❌ Error:', error);
    mostrarError('Error al inicializar: ' + error.message);
  }
}

/**
 * CONFIGURAR FILTROS
 */
function configurarFiltros() {
  const botones = document.querySelectorAll('.filter-btn');
  
  botones.forEach(btn => {
    btn.addEventListener('click', function() {
      // Actualizar clases
      botones.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Aplicar filtro
      const estado = this.dataset.estado;
      filtroActivo = estado === 'todos' ? null : estado;
      
      console.log('Filtro:', filtroActivo || 'todos');
      mostrarPedidos();
    });
  });
}

/**
 * CARGAR PEDIDOS DE SUPABASE
 */
async function cargarPedidos() {
  console.log('📦 Cargando pedidos...');
  
  const container = document.getElementById('adminPedidosContainer');
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-3">Cargando pedidos...</p>
    </div>
  `;

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        pedidos_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    todosPedidos = data || [];
    console.log(`✅ ${todosPedidos.length} pedidos cargados`);

    // Actualizar estadísticas
    actualizarEstadisticas();

    // Mostrar pedidos
    mostrarPedidos();

  } catch (error) {
    console.error('❌ Error:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        Error al cargar pedidos: ${error.message}
      </div>
    `;
  }
}

/**
 * ACTUALIZAR ESTADÍSTICAS
 */
function actualizarEstadisticas() {
  const total = todosPedidos.length;
  const pendientes = todosPedidos.filter(p => p.estado === 'pendiente').length;
  const enProceso = todosPedidos.filter(p => p.estado === 'procesando').length;
  const completados = todosPedidos.filter(p => p.estado === 'completado').length;
  const ventas = todosPedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

  document.getElementById('admin-stat-total').textContent = total;
  document.getElementById('admin-stat-pendientes').textContent = pendientes;
  document.getElementById('admin-stat-procesando').textContent = enProceso;
  document.getElementById('admin-stat-completados').textContent = completados;
  document.getElementById('admin-stat-ventas').textContent = `S/ ${ventas.toFixed(2)}`;

  console.log('📊 Stats:', { total, pendientes, enProceso, completados, ventas });
}

/**
 * MOSTRAR PEDIDOS EN TABLA
 */
function mostrarPedidos() {
  const container = document.getElementById('adminPedidosContainer');
  
  // Filtrar pedidos
  let pedidos = todosPedidos;
  if (filtroActivo) {
    pedidos = todosPedidos.filter(p => p.estado === filtroActivo);
  }

  console.log(`📋 Mostrando ${pedidos.length} pedidos`);

  if (pedidos.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-inbox fs-1 text-muted"></i>
        <h5 class="text-muted mt-3">No hay pedidos</h5>
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
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const badge = getBadge(pedido.estado);

    html += `
      <tr>
        <td><code>${pedido.id.substring(0, 8)}...</code></td>
        <td>
          <strong>${pedido.nombre || 'Sin nombre'}</strong><br>
          <small class="text-muted">${pedido.email || 'Sin email'}</small>
        </td>
        <td>${fecha}</td>
        <td><strong class="text-success">S/ ${parseFloat(pedido.total).toFixed(2)}</strong></td>
        <td>${badge}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="verDetalle('${pedido.id}')">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-warning" onclick="cambiarEstado('${pedido.id}')">
            <i class="bi bi-arrow-repeat"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="eliminar('${pedido.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

/**
 * OBTENER BADGE DE ESTADO
 */
function getBadge(estado) {
  const badges = {
    'pendiente': '<span class="badge bg-warning text-dark"><i class="bi bi-clock"></i> Pendiente</span>',
    'procesando': '<span class="badge bg-info"><i class="bi bi-arrow-repeat"></i> Procesando</span>',
    'completado': '<span class="badge bg-success"><i class="bi bi-check-all"></i> Completado</span>',
    'cancelado': '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Cancelado</span>',
    'reembolsado': '<span class="badge bg-secondary"><i class="bi bi-cash-stack"></i> Reembolsado</span>'
  };
  return badges[estado] || `<span class="badge bg-secondary">${estado}</span>`;
}

/**
 * VER DETALLE DEL PEDIDO
 */
function verDetalle(id) {
  const pedido = todosPedidos.find(p => p.id === id);
  if (!pedido) return;

  console.log('👁️ Ver detalle:', id);

  let itemsHtml = '';
  if (pedido.pedidos_items && pedido.pedidos_items.length > 0) {
    itemsHtml = '<table class="table table-sm table-dark table-striped"><thead class="table-secondary"><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>';
    pedido.pedidos_items.forEach(item => {
      itemsHtml += `
        <tr>
          <td>${item.nombre_producto}</td>
          <td>${item.cantidad}</td>
          <td>S/ ${parseFloat(item.precio).toFixed(2)}</td>
          <td class="text-success">S/ ${parseFloat(item.subtotal).toFixed(2)}</td>
        </tr>
      `;
    });
    itemsHtml += '</tbody></table>';
  } else {
    itemsHtml = '<p class="text-muted fst-italic">No hay productos en este pedido</p>';
  }

  const content = `
    <div class="mb-3">
      <strong class="text-info">ID:</strong> <code class="bg-secondary text-light px-2 py-1 rounded">${pedido.id}</code>
    </div>
    <div class="row mb-3">
      <div class="col-md-6">
        <strong class="text-info">Cliente:</strong><br>
        <span class="text-light">${pedido.nombre || 'Sin nombre'}</span>
      </div>
      <div class="col-md-6">
        <strong class="text-info">Email:</strong><br>
        <span class="text-light">${pedido.email || 'Sin email'}</span>
      </div>
    </div>
    <div class="row mb-3">
      <div class="col-md-6">
        <strong class="text-info">Teléfono:</strong><br>
        <span class="text-light">${pedido.telefono || 'Sin teléfono'}</span>
      </div>
      <div class="col-md-6">
        <strong class="text-info">Estado:</strong><br>${getBadge(pedido.estado)}
      </div>
    </div>
    ${pedido.notas ? `<div class="mb-3"><strong class="text-info">Notas:</strong><br><span class="text-light">${pedido.notas}</span></div>` : ''}
    <hr class="border-secondary">
    <h6 class="text-info"><i class="bi bi-box-seam me-2"></i>Productos:</h6>
    ${itemsHtml}
    <div class="mt-3 p-3 bg-secondary bg-opacity-25 rounded border border-secondary">
      <h5 class="mb-0 text-light">Total: <strong class="text-success">S/ ${parseFloat(pedido.total).toFixed(2)}</strong></h5>
    </div>
  `;

  document.getElementById('adminDetallePedidoContent').innerHTML = content;
  new bootstrap.Modal(document.getElementById('adminDetallePedidoModal')).show();
}

/**
 * CAMBIAR ESTADO
 */
let pedidoTemporal = null;

function cambiarEstado(id) {
  const pedido = todosPedidos.find(p => p.id === id);
  if (!pedido) return;

  console.log('🔄 Cambiar estado:', id);
  pedidoTemporal = pedido;

  // Limpiar alerta anterior
  const alertaAnterior = document.querySelector('#cambiarEstadoModal .alert-info');
  if (alertaAnterior) alertaAnterior.remove();

  // Agregar info
  const modalBody = document.querySelector('#cambiarEstadoModal .modal-body');
  const info = `
    <div class="alert alert-info">
      <strong>Pedido:</strong> ${pedido.id.substring(0, 8)}...<br>
      <strong>Cliente:</strong> ${pedido.nombre || 'Sin nombre'}<br>
      <strong>Total:</strong> S/ ${parseFloat(pedido.total).toFixed(2)}<br>
      <strong>Estado actual:</strong> ${getBadge(pedido.estado)}
    </div>
  `;
  modalBody.insertAdjacentHTML('afterbegin', info);

  // Establecer estado actual
  document.getElementById('nuevoEstadoSelect').value = pedido.estado;

  new bootstrap.Modal(document.getElementById('cambiarEstadoModal')).show();
}

/**
 * CONFIRMAR CAMBIO DE ESTADO
 */
async function confirmarCambioEstado() {
  if (!pedidoTemporal) return;

  const nuevoEstado = document.getElementById('nuevoEstadoSelect').value;
  
  if (nuevoEstado === pedidoTemporal.estado) {
    alert('⚠️ El estado es el mismo');
    return;
  }

  console.log(`🔄 Actualizando estado a: ${nuevoEstado}`);

  try {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoTemporal.id);

    if (error) throw error;

    console.log('✅ Estado actualizado');
    
    // Cerrar modal
    bootstrap.Modal.getInstance(document.getElementById('cambiarEstadoModal')).hide();
    
    // Recargar
    await cargarPedidos();
    
    alert('✅ Estado actualizado correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error: ' + error.message);
  }
}

/**
 * ELIMINAR PEDIDO
 */
async function eliminar(id) {
  const pedido = todosPedidos.find(p => p.id === id);
  if (!pedido) return;

  const confirmar = confirm(`¿Eliminar pedido de ${pedido.nombre}?\n\nTotal: S/ ${pedido.total}\n\nEsta acción no se puede deshacer.`);
  if (!confirmar) return;

  console.log('🗑️ Eliminando:', id);

  try {
    // Eliminar items
    await supabase.from('pedidos_items').delete().eq('pedido_id', id);
    
    // Eliminar pedido
    const { error } = await supabase.from('pedidos').delete().eq('id', id);
    
    if (error) throw error;

    console.log('✅ Eliminado');
    await cargarPedidos();
    alert('✅ Pedido eliminado');

  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error: ' + error.message);
  }
}

/**
 * EXPORTAR CSV
 */
function exportarPedidosCSV() {
  if (todosPedidos.length === 0) {
    alert('No hay pedidos para exportar');
    return;
  }

  let csv = 'ID,Cliente,Email,Teléfono,Fecha,Total,Estado\n';
  
  todosPedidos.forEach(p => {
    const fecha = new Date(p.created_at).toLocaleString('es-PE');
    csv += `${p.id},${p.nombre || ''},${p.email || ''},${p.telefono || ''},${fecha},${p.total},${p.estado}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pedidos_${Date.now()}.csv`;
  link.click();
  
  console.log('📥 CSV exportado');
}

/**
 * MOSTRAR ERROR
 */
function mostrarError(mensaje) {
  const container = document.getElementById('adminPedidosContainer');
  container.innerHTML = `
    <div class="alert alert-danger">
      <i class="bi bi-exclamation-triangle me-2"></i>
      ${mensaje}
    </div>
  `;
}

// Exponer funciones globalmente
window.inicializarPanelAdminPedidos = inicializarPanelAdminPedidos;
window.cargarPedidosAdmin = cargarPedidos;
window.verDetalle = verDetalle;
window.cambiarEstado = cambiarEstado;
window.confirmarCambioEstado = confirmarCambioEstado;
window.eliminar = eliminar;
window.exportarPedidosCSV = exportarPedidosCSV;

console.log('✅ Módulo admin cargado');
