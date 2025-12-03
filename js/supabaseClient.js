/**
 * Cliente de Supabase para Digital Loot
 * Este archivo inicializa la conexión con Supabase
 */

// Configuración de Supabase
const SUPABASE_URL = 'https://bkvizvvpwkstggwplbkz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdml6dnZwd2tzdGdnd3BsYmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjQxNzEsImV4cCI6MjA3OTc0MDE3MX0.ZJZA_OB_PYLsgVe27RfsquWyx0i2pVFR9hxJtv9HOkc';

// Cliente de Supabase (variable global)
var supabase = null;

// Inicialización
(function initializeSupabase() {
  console.log('📦 Inicializando Supabase...');
  
  // Buscar la función createClient - primero en _supabaseLib (guardada antes)
  let createClientFn = null;
  
  // Opción 1: Referencia guardada en _supabaseLib
  if (window._supabaseLib && typeof window._supabaseLib.createClient === 'function') {
    createClientFn = window._supabaseLib.createClient;
    console.log('📦 Usando window._supabaseLib.createClient');
  }
  // Opción 2: window.supabase.createClient (CDN estándar)
  else if (window.supabase && typeof window.supabase.createClient === 'function') {
    createClientFn = window.supabase.createClient;
    console.log('📦 Usando window.supabase.createClient');
  }
  
  if (createClientFn) {
    try {
      supabase = createClientFn(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      });
      
      window.supabase = supabase;
      
      console.log('✅ Supabase inicializado correctamente');
      console.log('🔗 URL:', SUPABASE_URL);
      
      // Listener de auth
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Auth:', event);
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('digitalLoot_user');
          localStorage.removeItem('digitalLoot_role');
        }
      });
      
    } catch (error) {
      console.error('❌ Error al crear cliente:', error);
    }
  } else {
    console.error('❌ No se encontró createClient de Supabase');
    console.log('window._supabaseLib:', window._supabaseLib);
    console.log('window.supabase:', window.supabase);
  }
})();

// Función para obtener el cliente (útil para otros módulos)
function getSupabaseClient() {
  return supabase;
}

// Función para verificar la conexión
async function verificarConexion() {
  if (!supabase) {
    console.error('❌ Cliente no inicializado');
    return false;
  }
  try {
    const { count, error } = await supabase
      .from('productos')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error conexión:', error.message);
      return false;
    }
    console.log('✅ Conexión OK - Productos:', count);
    return true;
  } catch (e) {
    console.error('❌ Error:', e);
    return false;
  }
}

// Función helper para obtener la URL de una imagen
function getImageUrl(imagePath) {
  if (!imagePath) return 'img/placeholder.jpg';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('productos/')) {
    return `${SUPABASE_URL}/storage/v1/object/public/${imagePath}`;
  }
  return imagePath;
}

// Función helper para manejar errores
function handleSupabaseError(error, contexto = '') {
  console.error(`❌ Error en ${contexto}:`, error);
  return {
    success: false,
    error: error?.message || 'Error desconocido',
    code: error?.code
  };
}

// Verificar conexión al cargar
if (supabase) {
  verificarConexion();
}

// Exportar funciones globalmente
window.getSupabaseClient = getSupabaseClient;
window.getImageUrl = getImageUrl;
window.handleSupabaseError = handleSupabaseError;
window.verificarConexion = verificarConexion;

console.log('📦 Módulo supabaseClient.js listo');