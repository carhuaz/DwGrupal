/* ============================================================
   MÓDULO DE PERFIL DE USUARIO
   Gestiona visualización y edición de perfiles con campos mejorados
============================================================ */

'use strict';

/**
 * Cargar datos completos del perfil del usuario
 */
async function cargarPerfilCompleto(userId) {
  try {
    const { data: perfil, error } = await supabase
      .from('perfiles_completos')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return perfil;
  } catch (error) {
    console.error('❌ Error al cargar perfil completo:', error);
    return null;
  }
}

/**
 * Actualizar perfil de usuario
 */
async function actualizarPerfil(userId, datos) {
  try {
    const { error } = await supabase
      .from('perfiles')
      .update({
        nombre_completo: datos.nombre_completo,
        telefono: datos.telefono,
        direccion: datos.direccion,
        ciudad: datos.ciudad,
        pais: datos.pais,
        bio: datos.bio,
        fecha_nacimiento: datos.fecha_nacimiento,
        avatar_url: datos.avatar_url,
        preferencias: datos.preferencias,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return { success: true, message: 'Perfil actualizado correctamente' };
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Actualizar preferencias del usuario
 */
async function actualizarPreferencias(userId, preferencias) {
  try {
    const { error } = await supabase
      .from('perfiles')
      .update({
        preferencias: preferencias,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error al actualizar preferencias:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Actualizar avatar del usuario
 */
async function actualizarAvatar(userId, avatarUrl) {
  try {
    const { error } = await supabase
      .from('perfiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error al actualizar avatar:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Obtener estadísticas del usuario
 */
async function obtenerEstadisticasUsuario(userId) {
  try {
    const perfil = await cargarPerfilCompleto(userId);
    
    if (!perfil) {
      return {
        total_pedidos: 0,
        total_favoritos: 0,
        total_resenas: 0,
        total_gastado: 0
      };
    }
    
    return {
      total_pedidos: perfil.total_pedidos || 0,
      total_favoritos: perfil.total_favoritos || 0,
      total_resenas: perfil.total_resenas || 0,
      total_gastado: perfil.total_gastado || 0
    };
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    return {
      total_pedidos: 0,
      total_favoritos: 0,
      total_resenas: 0,
      total_gastado: 0
    };
  }
}

/**
 * Renderizar perfil en modal o página
 */
function renderizarPerfil(perfil) {
  const html = `
    <div class="perfil-usuario">
      <div class="perfil-header text-center mb-4">
        <img src="${perfil.avatar_url || 'img/default-avatar.png'}" 
             alt="${perfil.nombre_completo}" 
             class="rounded-circle mb-3" 
             style="width: 120px; height: 120px; object-fit: cover;">
        <h3>${perfil.nombre_completo}</h3>
        <p class="text-muted">${perfil.email}</p>
        ${perfil.bio ? `<p class="text-muted fst-italic">"${perfil.bio}"</p>` : ''}
        <span class="badge ${perfil.rol === 'admin' ? 'bg-danger' : 'bg-primary'}">
          ${perfil.rol === 'admin' ? 'Administrador' : 'Usuario'}
        </span>
      </div>
      
      <div class="perfil-info row g-3">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-telephone-fill me-2"></i>Teléfono</h6>
              <p class="card-text">${perfil.telefono || 'No registrado'}</p>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-geo-alt-fill me-2"></i>Ubicación</h6>
              <p class="card-text">${perfil.ciudad || 'No registrado'}, ${perfil.pais || 'Perú'}</p>
            </div>
          </div>
        </div>
        
        ${perfil.fecha_nacimiento ? `
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-calendar-fill me-2"></i>Fecha de Nacimiento</h6>
              <p class="card-text">${new Date(perfil.fecha_nacimiento).toLocaleDateString('es-PE')}</p>
            </div>
          </div>
        </div>
        ` : ''}
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-clock-fill me-2"></i>Última Conexión</h6>
              <p class="card-text">${perfil.ultima_conexion ? new Date(perfil.ultima_conexion).toLocaleString('es-PE') : 'Nunca'}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="perfil-stats row g-3 mt-3">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body text-center">
              <i class="bi bi-bag-fill fs-1 mb-2"></i>
              <h4>${perfil.total_pedidos || 0}</h4>
              <p class="mb-0 small">Pedidos</p>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card bg-danger text-white">
            <div class="card-body text-center">
              <i class="bi bi-heart-fill fs-1 mb-2"></i>
              <h4>${perfil.total_favoritos || 0}</h4>
              <p class="mb-0 small">Favoritos</p>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body text-center">
              <i class="bi bi-star-fill fs-1 mb-2"></i>
              <h4>${perfil.total_resenas || 0}</h4>
              <p class="mb-0 small">Reseñas</p>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body text-center">
              <i class="bi bi-currency-dollar fs-1 mb-2"></i>
              <h4>S/ ${Number(perfil.total_gastado || 0).toFixed(2)}</h4>
              <p class="mb-0 small">Gastado</p>
            </div>
          </div>
        </div>
      </div>
      
      ${perfil.preferencias ? `
      <div class="perfil-preferencias mt-4">
        <h5><i class="bi bi-gear-fill me-2"></i>Preferencias</h5>
        <div class="card">
          <div class="card-body">
            <ul class="list-unstyled mb-0">
              ${perfil.preferencias.tema ? `<li><strong>Tema:</strong> ${perfil.preferencias.tema}</li>` : ''}
              ${perfil.preferencias.idioma ? `<li><strong>Idioma:</strong> ${perfil.preferencias.idioma}</li>` : ''}
              ${perfil.preferencias.notificaciones !== undefined ? `<li><strong>Notificaciones:</strong> ${perfil.preferencias.notificaciones ? 'Activadas' : 'Desactivadas'}</li>` : ''}
            </ul>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
  `;
  
  return html;
}

/**
 * Mostrar modal de perfil
 */
async function mostrarModalPerfil(userId) {
  const perfil = await cargarPerfilCompleto(userId);
  
  if (!perfil) {
    alert('Error al cargar el perfil');
    return;
  }
  
  // Crear modal si no existe
  let modal = document.getElementById('perfilModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'perfilModal';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-person-circle me-2"></i>Mi Perfil</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="perfilModalBody">
            <!-- Contenido del perfil -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-primary" onclick="editarPerfil()">
              <i class="bi bi-pencil-fill me-2"></i>Editar Perfil
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  // Actualizar contenido
  document.getElementById('perfilModalBody').innerHTML = renderizarPerfil(perfil);
  
  // Mostrar modal
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

/**
 * Función placeholder para editar perfil
 */
function editarPerfil() {
  alert('Funcionalidad de edición de perfil próximamente');
}

// Exportar funciones globales
window.cargarPerfilCompleto = cargarPerfilCompleto;
window.actualizarPerfil = actualizarPerfil;
window.actualizarPreferencias = actualizarPreferencias;
window.actualizarAvatar = actualizarAvatar;
window.obtenerEstadisticasUsuario = obtenerEstadisticasUsuario;
window.mostrarModalPerfil = mostrarModalPerfil;
window.editarPerfil = editarPerfil;

console.log('📦 Módulo perfil.js cargado');
