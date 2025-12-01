/* ============================================================
   MÓDULO DE GESTIÓN DE PERFIL Y PANEL DE ADMIN
   Gestiona datos del usuario y funciones administrativas
============================================================ */

'use strict';

// ============================================================
// PERFIL DE USUARIO
// ============================================================

/**
 * Abrir modal de perfil y cargar datos del usuario
 */
async function abrirPerfilModal() {
  const modal = new bootstrap.Modal(document.getElementById('perfilModal'));
  modal.show();
  
  // Cargar datos del perfil
  await cargarDatosPerfil();
}

/**
 * Cargar datos del perfil actual
 */
async function cargarDatosPerfil() {
  try {
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Error al obtener usuario:', userError);
      return;
    }
    
    // Obtener perfil desde la base de datos
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (perfilError) {
      console.error('❌ Error al cargar perfil:', perfilError);
      return;
    }
    
    // Rellenar formulario con datos
    document.getElementById('perfilEmail').textContent = perfil.email || user.email;
    document.getElementById('perfilNombre').value = perfil.nombre_completo || '';
    document.getElementById('perfilTelefono').value = perfil.telefono || '';
    document.getElementById('perfilFechaNacimiento').value = perfil.fecha_nacimiento || '';
    document.getElementById('perfilPais').value = perfil.pais || '';
    document.getElementById('perfilCiudad').value = perfil.ciudad || '';
    document.getElementById('perfilDireccion').value = perfil.direccion || '';
    document.getElementById('perfilBio').value = perfil.bio || '';
    
    // Avatar
    const avatarUrl = perfil.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(perfil.nombre_completo || 'Usuario')}&background=6e57ff&color=fff&size=120`;
    document.getElementById('perfilAvatar').src = avatarUrl;
    
    // Cargar preferencias
    const prefs = perfil.preferencias || {};
    document.getElementById('prefTemaOscuro').checked = prefs.tema === 'dark';
    document.getElementById('prefNotifEmail').checked = prefs.notificaciones !== false;
    document.getElementById('prefNotifOfertas').checked = prefs.ofertas !== false;
    document.getElementById('prefNotifLanzamientos').checked = prefs.lanzamientos === true;
    document.getElementById('prefIdioma').value = prefs.idioma || 'es';
    document.getElementById('prefMoneda').value = prefs.moneda || 'PEN';
    
    console.log('✅ Perfil cargado');
  } catch (error) {
    console.error('❌ Error al cargar perfil:', error);
  }
}

/**
 * Guardar cambios del perfil
 */
document.getElementById('perfilForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const datosActualizados = {
      nombre_completo: document.getElementById('perfilNombre').value.trim(),
      telefono: document.getElementById('perfilTelefono').value.trim(),
      fecha_nacimiento: document.getElementById('perfilFechaNacimiento').value || null,
      pais: document.getElementById('perfilPais').value,
      ciudad: document.getElementById('perfilCiudad').value.trim(),
      direccion: document.getElementById('perfilDireccion').value.trim(),
      bio: document.getElementById('perfilBio').value.trim(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('perfiles')
      .update(datosActualizados)
      .eq('id', user.id);
    
    if (error) {
      console.error('❌ Error al actualizar perfil:', error);
      alert('Error al guardar cambios: ' + error.message);
      return;
    }
    
    alert('✅ Perfil actualizado correctamente');
    console.log('✅ Perfil actualizado');
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al guardar cambios');
  }
});

/**
 * Guardar preferencias
 */
document.getElementById('preferenciasForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const preferencias = {
      tema: document.getElementById('prefTemaOscuro').checked ? 'dark' : 'light',
      notificaciones: document.getElementById('prefNotifEmail').checked,
      ofertas: document.getElementById('prefNotifOfertas').checked,
      lanzamientos: document.getElementById('prefNotifLanzamientos').checked,
      idioma: document.getElementById('prefIdioma').value,
      moneda: document.getElementById('prefMoneda').value
    };
    
    const { error } = await supabase
      .from('perfiles')
      .update({ 
        preferencias: preferencias,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (error) {
      console.error('❌ Error al actualizar preferencias:', error);
      alert('Error al guardar preferencias: ' + error.message);
      return;
    }
    
    alert('✅ Preferencias guardadas correctamente');
    console.log('✅ Preferencias actualizadas');
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al guardar preferencias');
  }
});

/**
 * Cambiar contraseña
 */
document.getElementById('cambiarPasswordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const passwordNueva = document.getElementById('passwordNueva').value;
  const passwordConfirmar = document.getElementById('passwordConfirmar').value;
  
  if (passwordNueva !== passwordConfirmar) {
    alert('❌ Las contraseñas no coinciden');
    return;
  }
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: passwordNueva
    });
    
    if (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      alert('Error al cambiar contraseña: ' + error.message);
      return;
    }
    
    alert('✅ Contraseña actualizada correctamente');
    document.getElementById('cambiarPasswordForm').reset();
    console.log('✅ Contraseña cambiada');
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al cambiar contraseña');
  }
});

/**
 * Cambiar avatar
 */
function cambiarAvatar() {
  const nombre = document.getElementById('perfilNombre').value || 'Usuario';
  const colores = ['6e57ff', 'dc2626', '059669', 'ea580c', '2563eb', '7c3aed'];
  const colorAleatorio = colores[Math.floor(Math.random() * colores.length)];
  
  const nuevoAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=${colorAleatorio}&color=fff&size=120`;
  
  document.getElementById('perfilAvatar').src = nuevoAvatar;
  
  // Guardar en base de datos
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;
    
    supabase
      .from('perfiles')
      .update({ avatar_url: nuevoAvatar })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) {
          console.error('❌ Error al actualizar avatar:', error);
        } else {
          console.log('✅ Avatar actualizado');
        }
      });
  });
}

/**
 * Confirmar eliminación de cuenta
 */
function confirmarEliminarCuenta() {
  const confirmacion = confirm(
    '⚠️ ¿Estás seguro de que deseas eliminar tu cuenta?\n\n' +
    'Esta acción es PERMANENTE y no se puede deshacer.\n' +
    'Perderás todos tus datos, pedidos y favoritos.\n\n' +
    'Escribe "ELIMINAR" para confirmar:'
  );
  
  if (confirmacion) {
    const texto = prompt('Escribe "ELIMINAR" para confirmar:');
    if (texto === 'ELIMINAR') {
      eliminarCuenta();
    } else {
      alert('Cancelado. Tu cuenta NO ha sido eliminada.');
    }
  }
}

/**
 * Eliminar cuenta de usuario
 */
async function eliminarCuenta() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Eliminar perfil de la base de datos
    const { error: deleteError } = await supabase
      .from('perfiles')
      .delete()
      .eq('id', user.id);
    
    if (deleteError) {
      console.error('❌ Error al eliminar perfil:', deleteError);
      alert('Error al eliminar cuenta: ' + deleteError.message);
      return;
    }
    
    // Cerrar sesión
    await supabase.auth.signOut();
    
    alert('✅ Tu cuenta ha sido eliminada correctamente');
    window.location.reload();
  } catch (error) {
    console.error('❌ Error al eliminar cuenta:', error);
    alert('Error al eliminar cuenta');
  }
}

// ============================================================
// PANEL DE ADMINISTRACIÓN
// ============================================================

/**
 * Abrir panel de administración
 */
async function abrirAdminPanel() {
  const modal = new bootstrap.Modal(document.getElementById('adminModalMejorado'));
  modal.show();
  
  // Cargar datos
  await cargarEstadisticasAdmin();
  await cargarUsuariosAdmin();
  await cargarAdministradores();
}

/**
 * Cargar estadísticas del sistema
 */
async function cargarEstadisticasAdmin() {
  const container = document.getElementById('adminStatsContent');
  
  try {
    // Llamar a la función SQL de estadísticas
    const { data, error } = await supabase
      .rpc('estadisticas_generales');
    
    if (error) {
      console.error('❌ Error al cargar estadísticas:', error);
      container.innerHTML = '<p class="text-danger">Error al cargar estadísticas</p>';
      return;
    }
    
    const stats = data;
    
    container.innerHTML = `
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <h6 class="card-title"><i class="bi bi-people me-2"></i>Usuarios</h6>
            <h2 class="mb-0">${stats.total_usuarios || 0}</h2>
            <small>${stats.total_administradores || 0} administradores</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <h6 class="card-title"><i class="bi bi-box-seam me-2"></i>Productos</h6>
            <h2 class="mb-0">${stats.total_productos || 0}</h2>
            <small>${stats.productos_vendidos || 0} vendidos</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <h6 class="card-title"><i class="bi bi-cart me-2"></i>Pedidos</h6>
            <h2 class="mb-0">${stats.total_pedidos || 0}</h2>
            <small>${stats.pedidos_completados || 0} completados / ${stats.pedidos_pendientes || 0} pendientes</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-dark">
          <div class="card-body">
            <h6 class="card-title"><i class="bi bi-currency-dollar me-2"></i>Ingresos</h6>
            <h2 class="mb-0">S/ ${Number(stats.ingresos_totales || 0).toFixed(2)}</h2>
            <small>Total generado</small>
          </div>
        </div>
      </div>
    `;
    
    console.log('✅ Estadísticas cargadas:', stats);
  } catch (error) {
    console.error('❌ Error:', error);
    container.innerHTML = '<p class="text-danger">Error al cargar estadísticas</p>';
  }
}

/**
 * Cargar lista de usuarios
 */
async function cargarUsuariosAdmin() {
  const tbody = document.getElementById('usuariosTableBody');
  
  try {
    const { data: usuarios, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error al cargar usuarios:', error);
      tbody.innerHTML = '<tr><td colspan="7" class="text-danger">Error al cargar usuarios</td></tr>';
      return;
    }
    
    if (!usuarios || usuarios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay usuarios registrados</td></tr>';
      return;
    }
    
    tbody.innerHTML = usuarios.map(user => {
      const avatar = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre_completo || 'U')}&background=6e57ff&color=fff&size=40`;
      const fechaRegistro = new Date(user.created_at).toLocaleDateString('es-PE');
      const ultimaConexion = user.ultima_conexion ? new Date(user.ultima_conexion).toLocaleDateString('es-PE') : 'Nunca';
      const rolBadge = user.rol === 'admin' 
        ? '<span class="badge bg-danger">Admin</span>' 
        : '<span class="badge bg-secondary">Usuario</span>';
      
      return `
        <tr>
          <td><img src="${avatar}" alt="${user.nombre_completo}" class="rounded-circle" width="40" height="40"></td>
          <td>${user.nombre_completo || 'Sin nombre'}</td>
          <td>${user.email}</td>
          <td>${rolBadge}</td>
          <td>${fechaRegistro}</td>
          <td>${ultimaConexion}</td>
          <td>
            <button class="btn btn-sm btn-outline-info" onclick="verDetallesUsuario('${user.id}')" title="Ver detalles">
              <i class="bi bi-eye"></i>
            </button>
            ${user.rol !== 'admin' ? `
              <button class="btn btn-sm btn-outline-success" onclick="promoverAAdmin('${user.email}')" title="Promover a admin">
                <i class="bi bi-shield-plus"></i>
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
    
    console.log(`✅ ${usuarios.length} usuarios cargados`);
  } catch (error) {
    console.error('❌ Error:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="text-danger">Error al cargar usuarios</td></tr>';
  }
}

/**
 * Cargar lista de administradores
 */
async function cargarAdministradores() {
  const tbody = document.getElementById('adminsTableBody');
  
  try {
    const { data: admins, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'admin')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Error al cargar admins:', error);
      tbody.innerHTML = '<tr><td colspan="5" class="text-danger">Error al cargar administradores</td></tr>';
      return;
    }
    
    if (!admins || admins.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay administradores</td></tr>';
      return;
    }
    
    tbody.innerHTML = admins.map(admin => {
      const fechaRegistro = new Date(admin.created_at).toLocaleDateString('es-PE');
      const ultimaConexion = admin.ultima_conexion ? new Date(admin.ultima_conexion).toLocaleDateString('es-PE') : 'Nunca';
      
      return `
        <tr>
          <td>${admin.nombre_completo || 'Sin nombre'}</td>
          <td>${admin.email}</td>
          <td>${fechaRegistro}</td>
          <td>${ultimaConexion}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger" onclick="degradarAdmin('${admin.email}')" title="Quitar permisos de admin">
              <i class="bi bi-shield-x"></i> Degradar
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    console.log(`✅ ${admins.length} administradores cargados`);
  } catch (error) {
    console.error('❌ Error:', error);
    tbody.innerHTML = '<tr><td colspan="5" class="text-danger">Error al cargar administradores</td></tr>';
  }
}

/**
 * Formulario para crear admin
 */
document.getElementById('crearAdminForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('adminEmail').value.trim();
  await promoverAAdmin(email);
  
  document.getElementById('adminEmail').value = '';
});

/**
 * Promover usuario a administrador
 */
async function promoverAAdmin(email) {
  try {
    const confirmacion = confirm(`¿Promover a ${email} como administrador?\n\nEsta persona tendrá acceso completo al sistema.`);
    
    if (!confirmacion) return;
    
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: 'admin', updated_at: new Date().toISOString() })
      .eq('email', email);
    
    if (error) {
      console.error('❌ Error al promover usuario:', error);
      alert('Error: ' + error.message);
      return;
    }
    
    alert(`✅ ${email} ha sido promovido a administrador`);
    await cargarUsuariosAdmin();
    await cargarAdministradores();
    await cargarEstadisticasAdmin();
    
    console.log(`✅ Usuario ${email} promovido a admin`);
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al promover usuario');
  }
}

/**
 * Degradar admin a usuario normal
 */
async function degradarAdmin(email) {
  try {
    const confirmacion = confirm(`¿Quitar permisos de administrador a ${email}?\n\nEsta persona volverá a ser un usuario normal.`);
    
    if (!confirmacion) return;
    
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: 'usuario', updated_at: new Date().toISOString() })
      .eq('email', email);
    
    if (error) {
      console.error('❌ Error al degradar admin:', error);
      alert('Error: ' + error.message);
      return;
    }
    
    alert(`✅ ${email} ya no es administrador`);
    await cargarUsuariosAdmin();
    await cargarAdministradores();
    await cargarEstadisticasAdmin();
    
    console.log(`✅ Admin ${email} degradado a usuario`);
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al degradar administrador');
  }
}

/**
 * Ver detalles de usuario
 */
function verDetallesUsuario(userId) {
  supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error:', error);
        return;
      }
      
      const info = `
📋 INFORMACIÓN DEL USUARIO

👤 Nombre: ${data.nombre_completo || 'No especificado'}
📧 Email: ${data.email}
🎭 Rol: ${data.rol}
📱 Teléfono: ${data.telefono || 'No especificado'}
🏠 Dirección: ${data.direccion || 'No especificado'}
🌆 Ciudad: ${data.ciudad || 'No especificado'}
🌍 País: ${data.pais || 'No especificado'}
📝 Bio: ${data.bio || 'No especificado'}
📅 Fecha de nacimiento: ${data.fecha_nacimiento || 'No especificado'}
🕐 Registrado: ${new Date(data.created_at).toLocaleString('es-PE')}
🕐 Última conexión: ${data.ultima_conexion ? new Date(data.ultima_conexion).toLocaleString('es-PE') : 'Nunca'}
      `;
      
      alert(info);
    });
}

/**
 * Recargar usuarios
 */
function recargarUsuarios() {
  cargarUsuariosAdmin();
}

// Exportar funciones globales
window.abrirPerfilModal = abrirPerfilModal;
window.cambiarAvatar = cambiarAvatar;
window.confirmarEliminarCuenta = confirmarEliminarCuenta;
window.abrirAdminPanel = abrirAdminPanel;
window.promoverAAdmin = promoverAAdmin;
window.degradarAdmin = degradarAdmin;
window.verDetallesUsuario = verDetallesUsuario;
window.recargarUsuarios = recargarUsuarios;

console.log('📦 Módulo de perfil y admin cargado');
