// Funciones específicas para la página de catálogo

let todosLosProductos = [];
let plataformaActual = 'todos';

// Cargar todos los productos con información de plataformas y categorías
async function cargarTodosLosProductos() {
  try {
    console.log('🔄 Cargando todos los productos...');
    
    // Cargar productos directamente (sin joins)
    const { data: productos, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;

    todosLosProductos = productos;
    mostrarProductos(productos);
    actualizarContador(productos.length);
    console.log(`✅ ${productos.length} productos cargados`);
    return productos;
  } catch (error) {
    console.error('❌ Error al cargar productos:', error);
    mostrarMensajeError();
    return [];
  }
}

// Actualizar contador de productos
function actualizarContador(cantidad) {
  const contador = document.getElementById('totalProductos');
  if (contador) {
    contador.textContent = cantidad;
  }
}

// Filtrar por plataforma
function filtrarPorPlataforma(plataforma) {
  plataformaActual = plataforma;
  
  let productosFiltrados;
  if (plataforma === 'todos' || plataforma === 'Todo') {
    productosFiltrados = todosLosProductos;
  } else {
    // Filtrar por campo directo de plataforma
    productosFiltrados = todosLosProductos.filter(p => {
      return p.plataforma === plataforma || 
             (plataforma === 'DLC' && p.categoria === 'DLC');
    });
  }
  
  mostrarProductos(productosFiltrados);
  actualizarContador(productosFiltrados.length);
  console.log(`✅ Filtrados ${productosFiltrados.length} productos por: ${plataforma}`);
}

// Ordenar productos
function ordenarProductos(criterio) {
  let productosOrdenados = [...todosLosProductos];
  
  // Filtrar primero si hay plataforma seleccionada
  if (plataformaActual !== 'todos' && plataformaActual !== 'Todo') {
    productosOrdenados = productosOrdenados.filter(p => {
      return p.plataforma === plataformaActual || 
             (plataformaActual === 'DLC' && p.categoria === 'DLC');
    });
  }
  
  // Luego ordenar
  switch(criterio) {
    case 'precio_asc':
      productosOrdenados.sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0));
      break;
    case 'precio_desc':
      productosOrdenados.sort((a, b) => Number(b.precio || 0) - Number(a.precio || 0));
      break;
    case 'nombre_asc':
      productosOrdenados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
      break;
    case 'nombre_desc':
      productosOrdenados.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
      break;
    default:
      // relevancia - mantener orden original
      break;
  }
  
  mostrarProductos(productosOrdenados);
  console.log(`✅ Productos ordenados por: ${criterio}`);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar productos
  await cargarTodosLosProductos();
  
  // Renderizar filtros de plataforma
  await renderizarFiltrosPlataforma();
  
  // Filtros de plataforma (después de renderizarlos)
  setTimeout(() => {
    const filtros = document.querySelectorAll('#filtrosPlataforma button');
    filtros.forEach(filtro => {
      filtro.addEventListener('click', (e) => {
        // Remover clase active de todos
        filtros.forEach(f => f.classList.remove('active'));
        // Agregar clase active al clickeado
        e.target.classList.add('active');
        // Filtrar
        const plataforma = e.target.dataset.plataforma;
        filtrarPorPlataforma(plataforma);
      });
    });
  }, 500);
  
  // Select de ordenamiento
  const ordenarSelect = document.getElementById('ordenarSelect');
  if (ordenarSelect) {
    ordenarSelect.addEventListener('change', (e) => {
      ordenarProductos(e.target.value);
    });
  }
  
  console.log('✅ Página de catálogo inicializada');
});