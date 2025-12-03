/* ============================================================
   SISTEMA DE GESTIÓN DE PEDIDOS
   Crear, consultar y gestionar pedidos de usuarios
============================================================ */

'use strict';

/**
 * Crear un nuevo pedido desde el carrito
 * @param {Object} datosEnvio - Información de envío del cliente
 * @returns {Object} - Pedido creado o error
 */
async function crearPedido(datosEnvio) {
  try {
    // Verificar que el usuario esté logueado
    if (!authState.isLoggedIn || !authState.user) {
      throw new Error('Debes iniciar sesión para realizar un pedido');
    }

    // Obtener carrito actual
    const itemsCarrito = window.carrito ? window.carrito.items : [];
    
    if (!itemsCarrito || itemsCarrito.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // Calcular totales
    const subtotal = itemsCarrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const total = subtotal;

    // Crear objeto del pedido (usando nombres de columnas correctos)
    const pedido = {
      usuario_id: authState.user.id,
      email: authState.user.email,
      nombre: datosEnvio.nombre || authState.user.nombre_completo || 'Cliente',
      telefono: datosEnvio.telefono || authState.user.telefono || '',
      total: total,
      estado: 'pendiente',
      metodo_pago: datosEnvio.metodoPago || 'tarjeta',
      notas: datosEnvio.notas || ''
    };

    // Insertar pedido en la base de datos
    const { data: pedidoCreado, error: errorPedido } = await supabase
      .from('pedidos')
      .insert([pedido])
      .select()
      .single();

    if (errorPedido) {
      console.error('Error al crear pedido:', errorPedido);
      throw new Error('No se pudo crear el pedido: ' + errorPedido.message);
    }

    // Insertar items del pedido (usando nombres de columnas correctos)
    const items = itemsCarrito.map(item => {
      // Intentar obtener el producto_id como UUID si existe
      // Si no es UUID válido, usar null (la tabla permite null según el schema)
      let productoId = null;
      
      // Verificar si item.id es un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof item.id === 'string' && uuidRegex.test(item.id)) {
        productoId = item.id;
      } else if (item.producto_id && uuidRegex.test(item.producto_id)) {
        productoId = item.producto_id;
      }
      
      return {
        pedido_id: pedidoCreado.id,
        producto_id: productoId,
        nombre_producto: item.nombre,
        precio: parseFloat(item.precio),
        cantidad: parseInt(item.cantidad),
        subtotal: parseFloat(item.precio * item.cantidad)
      };
    });

    const { error: errorItems } = await supabase
      .from('pedidos_items')
      .insert(items);

    if (errorItems) {
      console.error('Error al insertar items:', errorItems);
      // Intentar eliminar el pedido si los items fallaron
      await supabase.from('pedidos').delete().eq('id', pedidoCreado.id);
      throw new Error('No se pudieron guardar los productos del pedido');
    }

    // Vaciar carrito después de crear el pedido
    if (window.carrito) {
      window.carrito.vaciar();
    }

    console.log('✅ Pedido creado exitosamente:', pedidoCreado.id);
    
    return {
      success: true,
      pedido: pedidoCreado,
      mensaje: `Pedido #${pedidoCreado.id.substring(0, 8)} creado exitosamente`
    };

  } catch (error) {
    console.error('❌ Error al crear pedido:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtener todos los pedidos del usuario actual
 * @returns {Array} - Lista de pedidos
 */
async function obtenerMisPedidos() {
  try {
    if (!authState.isLoggedIn || !authState.user) {
      return [];
    }

    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('usuario_id', authState.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener pedidos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

/**
 * Obtener detalles de un pedido específico con sus items
 * @param {String} pedidoId - ID del pedido
 * @returns {Object} - Pedido con items
 */
async function obtenerDetallePedido(pedidoId) {
  try {
    // Obtener pedido
    const { data: pedido, error: errorPedido } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (errorPedido) {
      console.error('Error al obtener pedido:', errorPedido);
      return null;
    }

    // Obtener items del pedido
    const { data: items, error: errorItems } = await supabase
      .from('pedidos_items')
      .select('*')
      .eq('pedido_id', pedidoId);

    if (errorItems) {
      console.error('Error al obtener items:', errorItems);
      return { ...pedido, items: [] };
    }

    return { ...pedido, items: items || [] };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

/**
 * Obtener estadísticas de pedidos del usuario
 * @returns {Object} - Estadísticas
 */
async function obtenerEstadisticasPedidos() {
  try {
    if (!authState.isLoggedIn || !authState.user) {
      return {
        total_pedidos: 0,
        pedidos_completados: 0,
        pedidos_enviados: 0,
        total_gastado: 0
      };
    }

    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('usuario_id', authState.user.id);

    if (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }

    const stats = {
      total_pedidos: pedidos.length,
      pedidos_completados: pedidos.filter(p => p.estado === 'completado').length,
      pedidos_enviados: pedidos.filter(p => p.estado === 'procesando').length,
      total_gastado: pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0)
    };

    return stats;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

/**
 * Actualizar estado de un pedido (SOLO ADMIN)
 * @param {String} pedidoId - ID del pedido
 * @param {String} nuevoEstado - Nuevo estado del pedido
 * @returns {Boolean} - Éxito de la operación
 */
async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
  try {
    // Verificar que el usuario sea admin
    if (!authState.user || authState.user.rol !== 'admin') {
      throw new Error('No tienes permisos para actualizar pedidos');
    }

    const estadosValidos = ['pendiente', 'procesando', 'completado', 'cancelado', 'reembolsado'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error('Estado no válido');
    }

    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId);

    if (error) {
      console.error('Error al actualizar pedido:', error);
      return false;
    }

    console.log('✅ Pedido actualizado a:', nuevoEstado);
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

/**
 * Obtener todos los pedidos (SOLO ADMIN)
 * @param {String} filtroEstado - Filtrar por estado (opcional)
 * @returns {Array} - Lista de todos los pedidos
 */
async function obtenerTodosPedidos(filtroEstado = null) {
  try {
    console.log('🔐 Verificando permisos de admin...');
    
    // Verificar que el usuario sea admin
    if (!authState.user || authState.user.rol !== 'admin') {
      console.error('❌ No tienes permisos para ver todos los pedidos');
      return [];
    }

    console.log('✅ Usuario admin verificado');
    console.log('🔍 Consultando pedidos en Supabase...', filtroEstado ? `Filtro: ${filtroEstado}` : 'Sin filtro');

    let query = supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (filtroEstado) {
      query = query.eq('estado', filtroEstado);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error de Supabase:', error);
      return [];
    }

    console.log('✅ Pedidos obtenidos de la BD:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error en obtenerTodosPedidos:', error);
    return [];
  }
}

/**
 * Obtener estadísticas globales de ventas (SOLO ADMIN)
 * @returns {Object} - Estadísticas globales
 */
async function obtenerEstadisticasGlobales() {
  try {
    console.log('📊 Obteniendo estadísticas globales...');
    
    // Verificar que el usuario sea admin
    if (!authState.user || authState.user.rol !== 'admin') {
      console.error('❌ No tienes permisos para ver estadísticas');
      return null;
    }

    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*');

    if (error) {
      console.error('❌ Error al obtener estadísticas globales:', error);
      return null;
    }

    console.log('✅ Total de pedidos en BD:', pedidos?.length || 0);

    const stats = {
      total_pedidos: pedidos.length,
      pedidos_pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
      pedidos_procesando: pedidos.filter(p => p.estado === 'procesando').length,
      pedidos_completados: pedidos.filter(p => p.estado === 'completado').length,
      pedidos_cancelados: pedidos.filter(p => p.estado === 'cancelado').length,
      total_ventas: pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0)
    };

    console.log('📊 Estadísticas calculadas:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

/**
 * Cancelar un pedido (solo si está en estado 'pendiente')
 * @param {String} pedidoId - ID del pedido a cancelar
 * @returns {Boolean} - Éxito de la operación
 */
async function cancelarPedido(pedidoId) {
  try {
    // Obtener el pedido primero
    const { data: pedido, error: errorGet } = await supabase
      .from('pedidos')
      .select('estado, usuario_id')
      .eq('id', pedidoId)
      .single();

    if (errorGet || !pedido) {
      throw new Error('No se encontró el pedido');
    }

    // Verificar que el usuario sea el dueño o admin
    if (pedido.usuario_id !== authState.user.id && authState.user.rol !== 'admin') {
      throw new Error('No tienes permisos para cancelar este pedido');
    }

    // Solo se puede cancelar si está pendiente
    if (pedido.estado !== 'pendiente') {
      throw new Error('Solo se pueden cancelar pedidos pendientes');
    }

    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'cancelado' })
      .eq('id', pedidoId);

    if (error) {
      console.error('Error al cancelar pedido:', error);
      return false;
    }

    console.log('✅ Pedido cancelado exitosamente');
    return true;
  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
    return false;
  }
}

/**
 * Eliminar un pedido completamente de la base de datos
 * @param {String} pedidoId - ID del pedido a eliminar
 * @returns {Boolean} - Éxito de la operación
 */
async function eliminarPedido(pedidoId) {
  try {
    if (!confirm('¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
      return false;
    }

    // Obtener el pedido primero
    const { data: pedido, error: errorGet } = await supabase
      .from('pedidos')
      .select('usuario_id')
      .eq('id', pedidoId)
      .single();

    if (errorGet || !pedido) {
      throw new Error('No se encontró el pedido');
    }

    // Verificar que el usuario sea el dueño o admin
    if (pedido.usuario_id !== authState.user.id && authState.user.rol !== 'admin') {
      throw new Error('No tienes permisos para eliminar este pedido');
    }

    // Primero eliminar los items del pedido (por la relación de clave foránea)
    const { error: errorItems } = await supabase
      .from('pedidos_items')
      .delete()
      .eq('pedido_id', pedidoId);

    if (errorItems) {
      console.error('Error al eliminar items del pedido:', errorItems);
      throw new Error('Error al eliminar los productos del pedido');
    }

    // Ahora eliminar el pedido
    const { error: errorPedido } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoId);

    if (errorPedido) {
      console.error('Error al eliminar pedido:', errorPedido);
      throw new Error('Error al eliminar el pedido');
    }

    console.log('✅ Pedido eliminado exitosamente de la base de datos');
    return true;
  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
    return false;
  }
}

/**
 * Formatear fecha para mostrar
 * @param {String} fecha - Fecha en formato ISO
 * @returns {String} - Fecha formateada
 */
function formatearFecha(fecha) {
  if (!fecha) return 'N/A';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Obtener clase de badge según estado
 * @param {String} estado - Estado del pedido
 * @returns {String} - Clase Bootstrap
 */
function obtenerClaseBadgeEstado(estado) {
  const clases = {
    'pendiente': 'bg-warning text-dark',
    'procesando': 'bg-info',
    'completado': 'bg-success',
    'cancelado': 'bg-danger',
    'reembolsado': 'bg-secondary'
  };
  return clases[estado] || 'bg-secondary';
}

/**
 * Obtener icono según estado
 * @param {String} estado - Estado del pedido
 * @returns {String} - Clase de icono Bootstrap
 */
function obtenerIconoEstado(estado) {
  const iconos = {
    'pendiente': 'bi-clock-history',
    'procesando': 'bi-hourglass-split',
    'completado': 'bi-check-circle',
    'cancelado': 'bi-x-circle',
    'reembolsado': 'bi-arrow-counterclockwise'
  };
  return iconos[estado] || 'bi-box';
}

console.log('✅ Módulo de pedidos cargado');
