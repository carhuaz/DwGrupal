/**
 * Cliente de Supabase para Digital Loot
 * Este archivo inicializa la conexión con Supabase
 */

// Configuración de Supabase
const SUPABASE_URL = 'https://bkvizvvpwkstggwplbkz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdml6dnZwd2tzdGdnd3BsYmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjQxNzEsImV4cCI6MjA3OTc0MDE3MX0.ZJZA_OB_PYLsgVe27RfsquWyx0i2pVFR9hxJtv9HOkc';

// Variable global para el cliente
let supabase;

// Función para inicializar Supabase
function initSupabase() {
  // Verificar que la librería de Supabase esté cargada
  if (typeof window.supabase === 'undefined') {
    console.error('❌ Error: La librería de Supabase no está cargada');
    console.error('Asegúrate de incluir el script de Supabase antes de este archivo');
    return false;
  }

  try {
    // Crear cliente usando window.supabase con persistencia de sesión
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
    
    console.log('✅ Cliente de Supabase inicializado correctamente');
    console.log('🔗 URL:', SUPABASE_URL);
    console.log('🔐 Persistencia de sesión: ACTIVADA');
    
    // Escuchar cambios en el estado de autenticación
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Estado de auth cambió:', event);
      if (session) {
        console.log('👤 Usuario autenticado:', session.user.email);
      } else {
        console.log('👤 Usuario no autenticado');
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar el cliente de Supabase:', error);
    return false;
  }
}

// Inicializar inmediatamente
const initialized = initSupabase();

// Listener simple para cambios de autenticación
if (initialized && supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Estado de auth:', event);
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('digitalLoot_user');
      localStorage.removeItem('digitalLoot_role');
      if (typeof updateUserUI === 'function') updateUserUI();
    }
  });
}

// Función para verificar la conexión
async function verificarConexion() {
  if (!supabase) {
    console.error('❌ Cliente de Supabase no inicializado');
    return false;
  }

  try {
    console.log('🔍 Verificando conexión con Supabase...');
    
    const { data, error, count } = await supabase
      .from('productos')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error al conectar con Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexión exitosa con Supabase');
    console.log(`📦 Total de productos en la base de datos: ${count}`);
    return true;
  } catch (error) {
    console.error('❌ Error al verificar conexión:', error);
    return false;
  }
}

// Verificar conexión solo si se inicializó correctamente
if (initialized) {
  verificarConexion();
}

// Función helper para obtener la URL de una imagen
function getImageUrl(imagePath) {
  if (!imagePath) return 'img/placeholder.jpg';
  
  // Si la imagen ya es una URL completa, devolverla tal cual
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Si es una imagen de Supabase Storage
  if (imagePath.startsWith('productos/')) {
    return `${SUPABASE_URL}/storage/v1/object/public/${imagePath}`;
  }
  
  // Si es una imagen local (mantener compatibilidad)
  return imagePath;
}

// Función helper para manejar errores de Supabase
function handleSupabaseError(error, contexto = '') {
  console.error(`❌ Error en ${contexto}:`, error);
  
  if (!error) return { success: false, error: 'Error desconocido' };
  
  // Mostrar mensaje específico según el tipo de error
  if (error.code === 'PGRST116') {
    console.error('📋 La tabla no existe en la base de datos');
  } else if (error.code === '42P01') {
    console.error('📋 Error de sintaxis SQL o tabla no encontrada');
  } else if (error.message && error.message.includes('JWT')) {
    console.error('🔐 Error de autenticación: Token inválido o expirado');
  } else if (error.message && error.message.includes('fetch')) {
    console.error('🌐 Error de red: No se puede conectar con Supabase');
  }
  
  return {
    success: false,
    error: error.message || 'Error desconocido',
    code: error.code
  };
}

console.log('📦 Módulo supabaseClient.js cargado');

// Exportar para uso global
window.supabase = supabase;
window.getImageUrl = getImageUrl;
window.handleSupabaseError = handleSupabaseError;