/* ============================================================
   SISTEMA DE AUTENTICACIÓN
   Gestiona login, registro y sesión de usuario
============================================================ */

'use strict';

// Estado global de autenticación
const authState = {
  isLoggedIn: false,
  user: null,
  role: 'user' // 'user' o 'admin'
};

// Inicializar módulo de autenticación
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});

/**
 * Inicializar funcionalidades de autenticación
 */
async function initAuth() {
  console.log('🔄 Inicializando autenticación...');
  
  // Esperar a que Supabase esté listo (máximo 3 segundos)
  let intentos = 0;
  while (typeof supabase === 'undefined' && intentos < 30) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  
  // Verificar sesión existente
  await checkExistingSession();
  
  // Configurar formularios
  setupLoginForm();
  setupRegisterForm();
  setupPasswordToggles();
  setupSocialLogin();
  
  console.log('✅ Módulo de autenticación cargado');
}

/**
 * Verificar si existe una sesión guardada
 */
async function checkExistingSession() {
  try {
    // Verificar sesión activa en Supabase
    if (typeof supabase !== 'undefined') {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ Sesión activa en Supabase:', session.user.email);
        
        // Obtener perfil del usuario
        const { data: profile } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          const user = {
            id: session.user.id,
            email: session.user.email,
            name: profile.nombre_completo || session.user.email.split('@')[0],
            role: profile.rol || 'usuario',
            avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email.split('@')[0])}&background=6e57ff&color=fff`,
            telefono: profile.telefono || '',
            direccion: profile.direccion || '',
            ciudad: profile.ciudad || '',
            pais: profile.pais || 'Perú'
          };
          
          loginUser(user, true);
          return;
        }
      }
    }
  } catch (error) {
    console.error('❌ Error al verificar sesión:', error);
  }
}

/**
 * Configurar formulario de login
 */
function setupLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;
    
    // Validación básica
    if (!email || !password) {
      showAuthMessage('Por favor completa todos los campos', 'error');
      return;
    }
    
    // Autenticación real con Supabase
    await loginWithSupabase(email, password, remember);
  });
}

/**
 * Configurar formulario de registro
 */
function setupRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const acceptTerms = document.getElementById('acceptTerms').checked;
    
    // Validaciones
    if (!name || !email || !password || !passwordConfirm) {
      showAuthMessage('Por favor completa todos los campos', 'error');
      return;
    }
    
    if (password.length < 6) {
      showAuthMessage('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    
    if (password !== passwordConfirm) {
      showAuthMessage('Las contraseñas no coinciden', 'error');
      return;
    }
    
    if (!acceptTerms) {
      showAuthMessage('Debes aceptar los términos y condiciones', 'error');
      return;
    }
    
    // Registro real con Supabase
    await registerWithSupabase(name, email, password);
  });
}

/**
 * Configurar botones de mostrar/ocultar contraseña
 */
function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.toggle-password');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);
      const icon = button.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
      }
    });
  });
}

/**
 * Configurar botones de login social
 */
function setupSocialLogin() {
  const socialButtons = document.querySelectorAll('.social-login-btn');
  
  socialButtons.forEach(button => {
    button.addEventListener('click', () => {
      const provider = button.textContent.trim();
      showAuthMessage(`Login con ${provider} estará disponible próximamente`, 'info');
    });
  });
}

/**
 * Login real con Supabase Auth
 */
async function loginWithSupabase(email, password, remember) {
  try {
    showAuthMessage('Iniciando sesión...', 'info');
    
    // Autenticación con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      showAuthMessage(error.message || 'Error al iniciar sesión', 'error');
      return;
    }
    
    // Obtener datos del perfil del usuario (incluyendo rol)
    // El perfil se crea automáticamente con el trigger
    const { data: profile, error: profileError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.warn('⚠️ Perfil no encontrado, puede que el trigger no esté activo:', profileError);
      // Intentar crear perfil manualmente si no existe
      const { error: insertError } = await supabase
        .from('perfiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          nombre_completo: data.user.user_metadata?.nombre || email.split('@')[0],
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=0ea5e9&color=fff&size=128`,
          rol: 'usuario',
          preferencias: {}
        });
      
      if (insertError) {
        console.error('❌ Error al crear perfil:', insertError);
      }
    }
    
    // Actualizar última conexión
    await supabase
      .from('perfiles')
      .update({ ultima_conexion: new Date().toISOString() })
      .eq('id', data.user.id);
    
    const user = {
      id: data.user.id,
      email: data.user.email,
      name: profile?.nombre_completo || data.user.user_metadata?.nombre || email.split('@')[0],
      role: profile?.rol || 'usuario',
      avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=6e57ff&color=fff`,
      telefono: profile?.telefono || '',
      direccion: profile?.direccion || '',
      ciudad: profile?.ciudad || '',
      pais: profile?.pais || 'Perú',
      bio: profile?.bio || '',
      fecha_nacimiento: profile?.fecha_nacimiento || null,
      preferencias: profile?.preferencias || {},
      ultima_conexion: profile?.ultima_conexion || null
    };
    
    console.log('👤 Usuario logueado:', user.email, '| Rol:', user.role);
    
    loginUser(user, remember);
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (modal) modal.hide();
    
    showAuthMessage(`¡Bienvenido, ${user.name}!`, 'success');
  } catch (error) {
    console.error('❌ Error en login:', error);
    showAuthMessage('Error al iniciar sesión. Intenta nuevamente.', 'error');
  }
}

/**
 * Registro real con Supabase Auth
 */
async function registerWithSupabase(name, email, password) {
  try {
    showAuthMessage('Creando cuenta...', 'info');
    
    // Registro con Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nombre: name
        }
      }
    });
    
    if (error) {
      showAuthMessage(error.message || 'Error al crear cuenta', 'error');
      return;
    }
    
    // Crear perfil en tabla perfiles (el trigger debería hacerlo automáticamente)
    // Pero lo hacemos manualmente por si acaso
    const { error: profileError } = await supabase
      .from('perfiles')
      .insert([
        {
          id: data.user.id,
          email: email,
          nombre_completo: name,
          rol: 'usuario',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6e57ff&color=fff&size=128`,
          preferencias: {
            tema: 'dark',
            notificaciones: true,
            idioma: 'es'
          },
          ultima_conexion: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (profileError) {
      console.error('⚠️ Error al crear perfil:', profileError);
    }
    
    const user = {
      id: data.user.id,
      email: email,
      name: name,
      role: 'usuario',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6e57ff&color=fff&size=128`,
      bio: '',
      preferencias: { tema: 'dark', notificaciones: true, idioma: 'es' }
    };
    
    loginUser(user, true);
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (modal) modal.hide();
    
    showAuthMessage(`¡Cuenta creada! Bienvenido, ${name}!`, 'success');
  } catch (error) {
    console.error('❌ Error en registro:', error);
    showAuthMessage('Error al crear cuenta. Intenta nuevamente.', 'error');
  }
}

/**
 * Simular login (fallback si Supabase falla)
 */
async function simulateLogin(email, password, remember) {
  // Mostrar cargando
  showAuthMessage('Iniciando sesión...', 'info');
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Usuario simulado
  const user = {
    id: Date.now(),
    name: email.split('@')[0],
    email: email,
    avatar: `https://ui-avatars.com/api/?name=${email}&background=6e57ff&color=fff`
  };
  
  loginUser(user, remember);
  
  // Cerrar modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
  if (modal) modal.hide();
  
  showAuthMessage(`¡Bienvenido, ${user.name}!`, 'success');
}

/**
 * Simular registro (temporal - reemplazar con Supabase)
 */
async function simulateRegister(name, email, password) {
  // Mostrar cargando
  showAuthMessage('Creando cuenta...', 'info');
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Usuario simulado
  const user = {
    id: Date.now(),
    name: name,
    email: email,
    avatar: `https://ui-avatars.com/api/?name=${name}&background=6e57ff&color=fff`
  };
  
  loginUser(user, true);
  
  // Cerrar modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
  if (modal) modal.hide();
  
  showAuthMessage(`¡Cuenta creada! Bienvenido, ${user.name}!`, 'success');
}

/**
 * Iniciar sesión de usuario
 */
function loginUser(user, saveSession = true) {
  authState.isLoggedIn = true;
  authState.user = user;
  authState.role = user.role || 'usuario';
  
  if (saveSession) {
    localStorage.setItem('digitalLoot_user', JSON.stringify(user));
    localStorage.setItem('digitalLoot_role', user.role || 'usuario');
  }
  
  updateUserUI();
  
  // Mostrar panel admin si es administrador
  if (user.role === 'admin' || user.role === 'administrador') {
    showAdminPanel();
  }
  
  console.log('✅ Usuario logueado:', user.email, '| Rol:', user.role);
}

/**
 * Cerrar sesión de usuario
 */
async function logoutUser() {
  try {
    // Cerrar sesión en Supabase
    if (typeof supabase !== 'undefined') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('⚠️ Error al cerrar sesión en Supabase:', error);
      } else {
        console.log('✅ Sesión cerrada en Supabase');
      }
    }
    
    // Limpiar estado local
    authState.isLoggedIn = false;
    authState.user = null;
    authState.role = 'usuario';
    
    // Limpiar localStorage
    localStorage.removeItem('digitalLoot_user');
    localStorage.removeItem('digitalLoot_role');
    
    // Actualizar UI
    updateUserUI();
    hideAdminPanel();
    
    showAuthMessage('Sesión cerrada correctamente', 'info');
    console.log('🔓 Sesión cerrada completamente');
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    showAuthMessage('Error al cerrar sesión', 'error');
  }
}

/**
 * Actualizar UI según estado de autenticación
 */
function updateUserUI() {
  const userBtn = document.querySelector('.user-btn');
  if (!userBtn) return;
  
  if (authState.isLoggedIn && authState.user) {
    // Cambiar ícono a avatar
    userBtn.innerHTML = `
      <img src="${authState.user.avatar}" 
           alt="${authState.user.name}" 
           class="user-avatar"
           title="${authState.user.name}">
    `;
    
    // Cambiar acción a menú de usuario
    userBtn.removeAttribute('data-bs-toggle');
    userBtn.removeAttribute('data-bs-target');
    userBtn.onclick = showUserMenu;
  } else {
    // Mostrar ícono de login
    userBtn.innerHTML = '<i class="bi bi-person"></i>';
    userBtn.setAttribute('data-bs-toggle', 'modal');
    userBtn.setAttribute('data-bs-target', '#loginModal');
    userBtn.onclick = null;
  }
}

/**
 * Mostrar menú de usuario
 */
function showUserMenu(event) {
  event?.preventDefault();
  if (!authState.user) return;
  
  console.log('🔍 Mostrando menú para:', authState.user.email, '| Rol:', authState.user.role);
  
  // Crear menú contextual
  const menuHTML = `
    <div class="dropdown-menu dropdown-menu-end show" style="position: fixed; right: 20px; top: 60px; z-index: 9999; background: #1a1a1a; border: 1px solid #333;">
      <div class="px-3 py-2 border-bottom" style="border-color: #333 !important;">
        <strong style="color: #fff;">${authState.user.name}</strong><br>
        <small class="text-muted">${authState.user.email}</small><br>
        <small class="badge ${authState.user.role === 'admin' ? 'bg-danger' : 'bg-secondary'}">${authState.user.role}</small>
      </div>
      <button class="dropdown-item" onclick="abrirPerfilModal(); cerrarMenuUsuario();" style="color: #fff;">
        <i class="bi bi-person-circle me-2"></i>Mi Perfil
      </button>
      <button class="dropdown-item" onclick="abrirMisPedidos(); cerrarMenuUsuario();" style="color: #fff;">
        <i class="bi bi-bag-check me-2"></i>Mis Pedidos
      </button>
      <button class="dropdown-item" onclick="window.location.href='#favoritos'; cerrarMenuUsuario();" style="color: #fff;">
        <i class="bi bi-heart me-2"></i>Favoritos
      </button>
      ${authState.user.role === 'admin' || authState.user.role === 'administrador' ? `
        <div class="dropdown-divider" style="border-color: #333;"></div>
        <button class="dropdown-item text-warning" onclick="abrirAdminPanel(); cerrarMenuUsuario();" style="background-color: rgba(220, 38, 38, 0.1);">
          <i class="bi bi-shield-lock me-2"></i>Panel de Admin
        </button>
      ` : ''}
      <div class="dropdown-divider" style="border-color: #333;"></div>
      <button class="dropdown-item text-danger" onclick="logoutUser(); cerrarMenuUsuario();">
        <i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
      </button>
    </div>
  `;
  
  // Remover menú existente si lo hay
  const menuExistente = document.getElementById('userMenuDropdown');
  if (menuExistente) {
    menuExistente.remove();
    return;
  }
  
  // Crear y agregar menú
  const menuDiv = document.createElement('div');
  menuDiv.id = 'userMenuDropdown';
  menuDiv.innerHTML = menuHTML;
  document.body.appendChild(menuDiv);
  
  // Cerrar al hacer clic fuera
  setTimeout(() => {
    document.addEventListener('click', cerrarMenuUsuario, { once: true });
  }, 10);
}

/**
 * Cerrar menú de usuario
 */
function cerrarMenuUsuario() {
  const menu = document.getElementById('userMenuDropdown');
  if (menu) menu.remove();
}

/**
 * Mostrar mensaje de autenticación
 */
function showAuthMessage(message, type = 'info') {
  const bgColors = {
    success: 'bg-success',
    error: 'bg-danger',
    info: 'bg-primary'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white ${bgColors[type]} border-0 position-fixed top-0 end-0 m-3`;
  toast.style.zIndex = '9999';
  
  const dFlex = document.createElement('div');
  dFlex.className = 'd-flex';
  
  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'toast-body';
  
  const icon = document.createElement('i');
  icon.className = type === 'success' ? 'bi bi-check-circle me-2' : 
                   type === 'error' ? 'bi bi-exclamation-circle me-2' : 
                   'bi bi-info-circle me-2';
  
  bodyDiv.appendChild(icon);
  bodyDiv.appendChild(document.createTextNode(message));
  
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn-close btn-close-white me-2 m-auto';
  closeBtn.setAttribute('data-bs-dismiss', 'toast');
  
  dFlex.appendChild(bodyDiv);
  dFlex.appendChild(closeBtn);
  toast.appendChild(dFlex);
  
  document.body.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();
  
  toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

/* ============================================================
   SISTEMA DE ADMINISTRACIÓN
============================================================ */

/**
 * Verificar si el usuario actual es admin
 */
function isAdmin() {
  return authState.role === 'admin' || authState.role === 'administrador';
}

/**
 * Mostrar panel de administración
 */
function showAdminPanel() {
  const adminBtn = document.getElementById('adminPanelBtn');
  if (adminBtn) {
    adminBtn.style.display = 'block';
  }
}

/**
 * Ocultar panel de administración
 */
function hideAdminPanel() {
  const adminBtn = document.getElementById('adminPanelBtn');
  if (adminBtn) {
    adminBtn.style.display = 'none';
  }
}

/**
 * Abrir modal de administración
 */
async function openAdminModal() {
  if (!isAdmin()) {
    showAuthMessage('No tienes permisos de administrador', 'error');
    return;
  }
  
  const modal = new bootstrap.Modal(document.getElementById('adminModal'));
  modal.show();
  
  // Cargar datos de administración
  await loadAdminData();
}

/**
 * Cargar datos del panel de administración
 */
async function loadAdminData() {
  try {
    // Cargar perfiles
    const { data: perfiles, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    renderUsersList(perfiles);
    
    // Cargar estadísticas
    await loadAdminStats();
  } catch (error) {
    console.error('❌ Error al cargar datos de admin:', error);
    showAuthMessage('Error al cargar datos de administración', 'error');
  }
}

/**
 * Renderizar lista de usuarios
 */
function renderUsersList(perfiles) {
  const container = document.getElementById('usuariosListAdmin');
  if (!container) return;
  
  container.innerHTML = '';
  
  perfiles.forEach(perfil => {
    const row = document.createElement('tr');
    const esAdmin = perfil.rol === 'admin' || perfil.rol === 'administrador';
    const ultimaConexion = perfil.ultima_conexion 
      ? new Date(perfil.ultima_conexion).toLocaleDateString('es-PE', { 
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        })
      : 'Nunca';
    
    row.innerHTML = `
      <td>
        <img src="${perfil.avatar_url || 'img/default-avatar.png'}" 
             alt="${perfil.nombre_completo}" 
             class="rounded-circle me-2" 
             style="width: 32px; height: 32px; object-fit: cover;">
        <div class="d-inline-block">
          <div>${perfil.nombre_completo || 'Sin nombre'}</div>
          ${perfil.bio ? `<small class="text-muted">${perfil.bio.substring(0, 30)}${perfil.bio.length > 30 ? '...' : ''}</small>` : ''}
        </div>
      </td>
      <td>
        ${perfil.email}
        <br><small class="text-muted">Última conexión: ${ultimaConexion}</small>
      </td>
      <td>
        <span class="badge ${esAdmin ? 'bg-danger' : 'bg-primary'}">
          ${esAdmin ? 'Admin' : 'Usuario'}
        </span>
      </td>
      <td>${new Date(perfil.created_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
      <td>
        ${!esAdmin ? `
          <button class="btn btn-sm btn-outline-primary" onclick="promoteToAdmin('${perfil.id}')">
            <i class="bi bi-shield-check"></i> Hacer Admin
          </button>
        ` : `
          <button class="btn btn-sm btn-outline-secondary" onclick="demoteFromAdmin('${perfil.id}')">
            <i class="bi bi-shield-x"></i> Quitar Admin
          </button>
        `}
      </td>
    `;
    container.appendChild(row);
  });
}

/**
 * Promover usuario a administrador
 */
async function promoteToAdmin(userId) {
  if (!confirm('¿Estás seguro de promover este usuario a administrador?')) return;
  
  try {
    const { error } = await supabase
      .from('perfiles')
      .update({ 
        rol: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    showAuthMessage('Usuario promovido a administrador exitosamente', 'success');
    await loadAdminData();
  } catch (error) {
    console.error('❌ Error al promover usuario:', error);
    showAuthMessage('Error al promover usuario: ' + error.message, 'error');
  }
}

/**
 * Quitar rol de administrador
 */
async function demoteFromAdmin(userId) {
  if (!confirm('¿Estás seguro de quitar el rol de administrador?')) return;
  
  // No permitir que el admin se quite su propio rol
  if (userId === authState.user.id) {
    showAuthMessage('No puedes quitarte tu propio rol de admin', 'error');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('perfiles')
      .update({ 
        rol: 'usuario',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    showAuthMessage('Rol de administrador removido exitosamente', 'success');
    await loadAdminData();
  } catch (error) {
    console.error('❌ Error al remover admin:', error);
    showAuthMessage('Error al remover rol de admin: ' + error.message, 'error');
  }
}

/**
 * Cargar estadísticas del panel admin
 */
async function loadAdminStats() {
  try {
    // Usar la función estadisticas_generales() de Supabase
    const { data: stats, error: statsError } = await supabase
      .rpc('estadisticas_generales');
    
    let totalUsers = 0, totalProducts = 0, totalAdmins = 0, totalPedidos = 0;
    
    if (statsError || !stats || stats.length === 0) {
      // Fallback: cargar manualmente si la función no existe
      const { count: users } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: products } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true });
      
      const { count: admins } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'admin');
      
      const { count: pedidos } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true });
      
      totalUsers = users || 0;
      totalProducts = products || 0;
      totalAdmins = admins || 0;
      totalPedidos = pedidos || 0;
    } else {
      const stat = stats[0];
      totalUsers = stat.total_usuarios || 0;
      totalProducts = stat.total_productos || 0;
      totalAdmins = stat.total_admins || 0;
      totalPedidos = stat.total_pedidos || 0;
    }
    
    // Actualizar UI
    const statsContainer = document.getElementById('adminStats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <h6 class="mb-0">Usuarios</h6>
                  <h2 class="mb-0">${totalUsers}</h2>
                </div>
                <i class="bi bi-people-fill fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <h6 class="mb-0">Productos</h6>
                  <h2 class="mb-0">${totalProducts}</h2>
                </div>
                <i class="bi bi-bag-fill fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-danger text-white">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <h6 class="mb-0">Admins</h6>
                  <h2 class="mb-0">${totalAdmins}</h2>
                </div>
                <i class="bi bi-shield-lock-fill fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <h6 class="mb-0">Pedidos</h6>
                  <h2 class="mb-0">${totalPedidos}</h2>
                </div>
                <i class="bi bi-cart-fill fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('❌ Error al cargar estadísticas:', error);
  }
}

// Exportar funciones globales
window.logoutUser = logoutUser;
window.authState = authState;
window.isAdmin = isAdmin;
window.openAdminModal = openAdminModal;
window.promoteToAdmin = promoteToAdmin;
window.demoteFromAdmin = demoteFromAdmin;
window.showUserMenu = showUserMenu;
window.cerrarMenuUsuario = cerrarMenuUsuario;
window.updateUserUI = updateUserUI;
window.loginUser = loginUser;
window.checkExistingSession = checkExistingSession;

console.log('📦 Módulo auth.js cargado');
console.log('🌐 Funciones globales exportadas:', Object.keys(window).filter(k => ['logoutUser', 'authState', 'isAdmin', 'updateUserUI'].includes(k)));
