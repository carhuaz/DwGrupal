# 🎮 Digital Loot - Tienda de Keys Digitales

> Plataforma e-commerce moderna para la venta de videojuegos digitales con **sistema de autenticación completo**, **perfiles mejorados**, **panel de administración** y **carrito de compras**.

![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.3-purple?style=flat&logo=bootstrap)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=flat&logo=supabase)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat&logo=javascript)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)
![Version](https://img.shields.io/badge/Version-2.0-success?style=flat)

---

## Tabla de Contenidos

- [ Novedades v2.0](#-novedades-v20)
- [Características](#-características)
- [Tecnologías](#️-tecnologías)
- [Quick Start](#-quick-start)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Documentación](#-documentación)
- [Funcionalidades](#-funcionalidades)
- [Roadmap](#️-roadmap)

---

## Novedades v2.0

### Perfiles Mejorados

- **Bio personalizable** - Los usuarios pueden agregar una biografía
- **Preferencias guardadas** - Tema, idioma, notificaciones (JSONB)
- **Última conexión** - Registro automático de última sesión
- **Estadísticas personales** - Pedidos, favoritos, reseñas, gasto total
- **Avatares mejorados** - UI Avatars automáticos

### Panel de Administración

- **Gestión de usuarios** - Promover/degradar administradores
- **Estadísticas en tiempo real** - Usuarios, productos, pedidos
- **Vista completa** - Última conexión y bio de usuarios
- **Funciones SQL** - `crear_admin()`, `listar_admins()`, `estadisticas_generales()`

### Base de Datos Actualizada

- **7 tablas optimizadas** - Perfiles, productos, carrito, pedidos, favoritos, reseñas
- **2 vistas** - `perfiles_completos`, `productos_calificaciones`
- **6 funciones SQL** - Administración y triggers automáticos
- **30+ productos** - Precargados con datos completos

### Bugs Corregidos

- **Error SQL corregido** - Políticas RLS con sintaxis correcta
- **Roles consistentes** - `'usuario'` y `'admin'` estandarizados
- **Última conexión** - Se actualiza automáticamente al hacer login

---

## Características

- **Carrito de Compras** - Sistema completo con persistencia en localStorage
- **Autenticación** - Login/Registro con validación y sesiones
- **Catálogo Dinámico** - Productos cargados desde Supabase
- **Búsqueda y Filtros** - Encuentra juegos por plataforma con debounce
- **Ordenamiento** - Por precio, nombre, relevancia
- **Responsive Design** - Mobile-first con Bootstrap 5
- **Accesibilidad** - WCAG AA compliant con aria-labels
- **Tema Oscuro** - Diseño moderno con gradientes neón
- **Optimizado** - DOM APIs, event delegation, código documentado

---

## Tecnologías

### Frontend

- **HTML5** - Estructura semántica
- **CSS3** - Custom properties, animations, flexbox/grid
- **JavaScript ES6+** - Modules, async/await, classes
- **Bootstrap 5.3.3** - Framework UI con componentes

### Backend

- **Supabase** - Base de datos PostgreSQL
- **Supabase Auth** - Sistema de autenticación (preparado)

### Herramientas

- **VS Code** - Editor de código
- **Git** - Control de versiones
- **Bootstrap Icons** - Iconografía

---

## Estructura del Proyecto

```
DwGrupal-main/
│
├── index.html              # Página principal
├── catalogo.html           # Catálogo completo
├── nosotros.html           # Página sobre nosotros
├── contacto.html           # Formulario de contacto
│
├── estilos/
│   ├── estilos.css         # Estilos globales + componentes
│   ├── catalogo.css        # Estilos específicos del catálogo
│   ├── nosotros.css        # Estilos de la página nosotros
│   └── contacto.css        # Estilos del formulario
│
├── js/
│   ├── supabaseClient.js   # Configuración Supabase
│   ├── productos.js        # Gestión de productos
│   ├── carrito.js          # Lógica del carrito
│   ├── auth.js             # Sistema de autenticación
│   ├── catalogo.js         # Lógica específica del catálogo
│   └── buscador.js         # Búsqueda con debounce
│
├── scripts/
│   ├── script.js           # Scripts generales (scroll-to-top)
│   ├── nosotros.js         # Scripts página nosotros
│   └── contacto.js         # Validación formulario
│
├── img/                    # Imágenes y assets
│
├── README.md               # Este archivo
└── OPTIMIZACIONES.md       # Documento técnico de optimizaciones
```

---

## Instalación

### Prerrequisitos

- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexión a internet (para CDN de Bootstrap y Supabase)
- Editor de código (VS Code recomendado)

### Pasos

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/tu-usuario/digital-loot.git
   cd digital-loot
   ```

2. **Configurar Supabase**

   - Crea un proyecto en [Supabase](https://supabase.com)
   - Copia tu URL y anon key
   - Edita `js/supabaseClient.js`:

   ```javascript
   const SUPABASE_URL = "tu-url-aqui";
   const SUPABASE_ANON_KEY = "tu-key-aqui";
   ```

3. **Crear tabla de productos**

   ```sql
   CREATE TABLE productos (
     id SERIAL PRIMARY KEY,
     nombre VARCHAR(255) NOT NULL,
     precio DECIMAL(10,2) NOT NULL,
     plataforma VARCHAR(50),
     imagen TEXT,
     descripcion TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

4. **Abrir en navegador**
   - Abre `index.html` en tu navegador
   - O usa Live Server en VS Code

---

## Uso

### Navegación

- **Inicio** - Hero carousel + productos destacados
- **Catálogo** - Todos los productos con filtros
- **Nosotros** - Información de la empresa
- **Contacto** - Formulario de contacto

### Carrito de Compras

1. Navega por el catálogo
2. Click en "Agregar al Carrito"
3. Abre el carrito (ícono superior derecha)
4. Ajusta cantidades o elimina productos
5. Procede al checkout

### Sistema de Login

1. Click en el ícono de usuario (👤)
2. Elige entre Login o Registro
3. Completa el formulario
4. Tu sesión se guarda automáticamente
5. El avatar aparece cuando estás logueado

### Filtros y Búsqueda

- **Filtros por plataforma**: PS5, Xbox, PC, Nintendo
- **Búsqueda**: Escribe mínimo 2 caracteres
- **Ordenar**: Precio ↑↓, Nombre A-Z/Z-A, Relevancia

---

## Funcionalidades

### Carrito

- Agregar/eliminar productos
- Ajustar cantidades
- Cálculo automático de totales
- Persistencia con localStorage
- Badge animado con contador
- Mini-cart offcanvas

### Autenticación

- Modal con tabs (Login/Registro)
- Validación de formularios
- Toggle de contraseña
- Botones de login social
- Sesión persistente
- Avatar dinámico
- Preparado para Supabase Auth

### Productos

- Grid responsive
- Hover zoom en imágenes
- Modal de detalles
- Filtros interactivos
- Búsqueda con debounce
- Ordenamiento múltiple
- Contador de productos

### UI/UX

- Animaciones suaves
- Ripple effect en botones
- Scroll-to-top animado
- Gradientes neón
- Tema oscuro consistente
- Feedback visual en acciones

---

## Optimizaciones

Ver documento completo: [OPTIMIZACIONES.md](./OPTIMIZACIONES.md)

### Código

- JSDoc en todas las funciones
- Event delegation
- Uso de `createElement` (no innerHTML)
- Fragmentos de documento
- Estado global centralizado
- Manejo de errores robusto

### Rendimiento

- Debounce en búsqueda (400ms)
- CSS containment
- RequestAnimationFrame
- Lazy loading preparado
- Minificación lista

### Accesibilidad

- Atributos aria-\*
- Navegación por teclado
- Contraste WCAG AA
- Screen reader friendly
- Focus visible

---

## 🗺️ Roadmap

### Fase 1 - MVP

- [x] Estructura básica
- [x] Sistema de carrito
- [x] Catálogo con filtros
- [x] Diseño responsive

### Fase 2 - Optimización

- [x] Sistema de autenticación
- [x] Mejoras de código
- [x] Documentación completa
- [x] Accesibilidad

### Fase 3 - Integración (En Progreso)

- [ ] Supabase Auth real
- [ ] Sistema de pagos (Stripe)
- [ ] Dashboard de usuario
- [ ] Historial de compras

### Fase 4 - Funcionalidades Extra

- [ ] Wishlist / Favoritos
- [ ] Sistema de reviews
- [ ] Cupones de descuento
- [ ] Programa de puntos
- [ ] Chat de soporte
- [ ] PWA con service workers

---

## Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Estilo

- **HTML**: Semántico, comentado, indentado (2 espacios)
- **CSS**: BEM light, secciones comentadas, mobile-first
- **JavaScript**: ES6+, JSDoc, nombres descriptivos

---

## Documentación Técnica

### Carrito de Compras

```javascript
// Clase principal del carrito
class Carrito {
  constructor() {
    this.items = this.cargarCarrito();
  }

  agregar(producto) { ... }
  eliminar(id) { ... }
  actualizarCantidad(id, cantidad) { ... }
  calcularTotal() { ... }
}
```

### Sistema de Filtros

```javascript
// Filtrar por plataforma
function filtrarPorPlataforma(plataforma) {
  if (plataforma === "todos") {
    mostrarProductos(productosActualesIndex);
  } else {
    const filtrados = productosActualesIndex.filter(
      (p) => p.plataforma === plataforma
    );
    mostrarProductos(filtrados);
  }
}
```

### Autenticación

```javascript
// Inicializar sistema de auth
function initAuth() {
  verificarSesion();
  setupLoginForm();
  setupRegisterForm();
  setupPasswordToggles();
}
```

---

## Variables CSS Principales

```css
:root {
  --primary: #00d9ff; /* Cian brillante */
  --accent: #ff3366; /* Rosa neón */
  --bg: #0a0e27; /* Azul muy oscuro */
  --card: #1a1f3a; /* Azul oscuro cards */
  --text: #f5f5f7; /* Texto principal */
}
```

---

## Solución de Problemas

### El carrito no se actualiza

- Verifica que `carrito.js` esté cargado
- Revisa la consola para errores
- Limpia localStorage: `localStorage.clear()`

### Los productos no cargan

- Verifica la configuración de Supabase
- Revisa las políticas RLS en Supabase
- Comprueba la conexión a internet

### El login no funciona

- El sistema actual es simulado
- Para login real, integra Supabase Auth
- Verifica que `auth.js` esté cargado

---

## Estadísticas del Proyecto

- **Líneas de código**: ~3000
- **Archivos JS**: 7
- **Componentes**: 15+
- **Páginas**: 4
- **Tiempo de desarrollo**: En progreso

---

## Contacto

**Digital Loot Team**

- Email: contacto@digitalloot.com
- Website: [digitalloot.com](https://digitalloot.com)
- GitHub: [@digitalloot](https://github.com/digitalloot)

---

## Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## Agradecimientos

- [Bootstrap](https://getbootstrap.com) - Framework UI
- [Supabase](https://supabase.com) - Backend as a Service
- [Bootstrap Icons](https://icons.getbootstrap.com) - Iconografía
- [UI Avatars](https://ui-avatars.com) - Generador de avatars
- Comunidad de desarrolladores web

---

<div align="center">

</div>
