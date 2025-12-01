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
    const carrito = obtenerCarrito();
    
    if (!carrito || carrito.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // Calcular totales
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const descuento = 0; // Aquí podrías aplicar cupones
    const impuestos = subtotal * 0.18; // 18% IGV (ajustar según tu país)
    const envio = subtotal > 100 ? 0 : 10; // Envío gratis sobre $100
    const total = subtotal - descuento + impuestos + envio;

    // Generar número de pedido (se hará en el backend con la función SQL)
    const numeroPedido = await generarNumeroPedido();

    // Crear objeto del pedido
    const pedido = {
      user_id: authState.user.id,
      email: authState.user.email,
      numero_pedido: numeroPedido,
      estado: 'pendiente',
      
      // Datos del cliente
      nombre_cliente: datosEnvio.nombre || authState.user.nombre || 'Cliente',
      telefono: datosEnvio.telefono || '',
      direccion_envio: datosEnvio.direccion,
      ciudad: datosEnvio.ciudad,
      pais: datosEnvio.pais || 'Perú',
      codigo_postal: datosEnvio.codigoPostal || '',
      
      // Totales
      subtotal: subtotal.toFixed(2),
      descuento: descuento.toFixed(2),
      impuestos: impuestos.toFixed(2),
      envio: envio.toFixed(2),
      total: total.toFixed(2),
      
      // Método de pago
      metodo_pago: datosEnvio.metodoPago || 'tarjeta',
      
      // Notas
      notas_cliente: datosEnvio.notas || '',
      
      fecha_estimada_entrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +7 días
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

    // Insertar items del pedido
    const items = carrito.map(item => ({
      pedido_id: pedidoCreado.id,
      producto_id: item.id,
      nombre_producto: item.nombre,
      precio_unitario: item.precio,
      cantidad: item.cantidad,
      subtotal: (item.precio * item.cantidad).toFixed(2),
      imagen_url: item.imagen,
      categoria: item.categoria || 'General'
    }));

    const { error: errorItems } = await supabase
      .from('pedido_items')
      .insert(items);

    if (errorItems) {
      console.error('Error al insertar items:', errorItems);
      // Intentar eliminar el pedido si los items fallaron
      await supabase.from('pedidos').delete().eq('id', pedidoCreado.id);
      throw new Error('No se pudieron guardar los productos del pedido');
    }

    // Vaciar carrito después de crear el pedido
    vaciarCarrito();

    console.log('✅ Pedido creado exitosamente:', pedidoCreado.numero_pedido);
    
    return {
      success: true,
      pedido: pedidoCreado,
      mensaje: `Pedido ${pedidoCreado.numero_pedido} creado exitosamente`
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
 * Generar número de pedido único
 * @returns {String} - Número de pedido formato DL-YYYYMMDD-XXXX
 */
async function generarNumeroPedido() {
  try {
    const { data, error } = await supabase.rpc('generar_numero_pedido');
    
    if (error) {
      console.error('Error al generar número de pedido:', error);
      // Fallback: generar localmente
      const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `DL-${fecha}-${random}`;
    }
    
    return data;
  } catch (error) {
    console.error('Error:', error);
    // Fallback
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DL-${fecha}-${random}`;
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
      .eq('user_id', authState.user.id)
      .order('fecha_pedido', { ascending: false });

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
      .from('pedido_items')
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
      return null;
    }

    const { data, error } = await supabase
      .rpc('obtener_estadisticas_ventas', { user_id_param: authState.user.id });

    if (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }

    return data;
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
    if (!authState.user || authState.user.role !== 'admin') {
      throw new Error('No tienes permisos para actualizar pedidos');
    }

    const estadosValidos = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error('Estado no válido');
    }

    const updateData = {
      estado: nuevoEstado,
      updated_at: new Date().toISOString()
    };

    // Si el estado es 'entregado', actualizar fecha de entrega
    if (nuevoEstado === 'entregado') {
      updateData.fecha_entrega_real = new Date().toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from('pedidos')
      .update(updateData)
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
    // Verificar que el usuario sea admin
    if (!authState.user || authState.user.role !== 'admin') {
      console.error('No tienes permisos para ver todos los pedidos');
      return [];
    }

    let query = supabase
      .from('pedidos')
      .select('*')
      .order('fecha_pedido', { ascending: false });

    if (filtroEstado) {
      query = query.eq('estado', filtroEstado);
    }

    const { data, error } = await query;

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
 * Obtener estadísticas globales de ventas (SOLO ADMIN)
 * @returns {Object} - Estadísticas globales
 */
async function obtenerEstadisticasGlobales() {
  try {
    // Verificar que el usuario sea admin
    if (!authState.user || authState.user.role !== 'admin') {
      return null;
    }

    const { data, error } = await supabase.rpc('obtener_estadisticas_ventas');

    if (error) {
      console.error('Error al obtener estadísticas globales:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
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
      .select('estado, user_id')
      .eq('id', pedidoId)
      .single();

    if (errorGet || !pedido) {
      throw new Error('No se encontró el pedido');
    }

    // Verificar que el usuario sea el dueño o admin
    if (pedido.user_id !== authState.user.id && authState.user.role !== 'admin') {
      throw new Error('No tienes permisos para cancelar este pedido');
    }

    // Solo se puede cancelar si está pendiente
    if (pedido.estado !== 'pendiente') {
      throw new Error('Solo se pueden cancelar pedidos pendientes');
    }

    const { error } = await supabase
      .from('pedidos')
      .update({ 
        estado: 'cancelado',
        updated_at: new Date().toISOString()
      })
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
    'enviado': 'bg-primary',
    'entregado': 'bg-success',
    'cancelado': 'bg-danger'
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
    'enviado': 'bi-truck',
    'entregado': 'bi-check-circle',
    'cancelado': 'bi-x-circle'
  };
  return iconos[estado] || 'bi-box';
}

console.log('✅ Módulo de pedidos cargado');
