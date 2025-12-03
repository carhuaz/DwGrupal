# 🛒 Sistema de Pedidos - Digital Loot

## 📋 Descripción

Sistema completo de gestión de pedidos integrado con Supabase que permite:

- ✅ **Usuarios**: Realizar compras, ver sus pedidos y cancelar pedidos pendientes
- ✅ **Administradores**: Gestionar todos los pedidos, cambiar estados y ver estadísticas
- ✅ **Validación de sesión**: Solo usuarios autenticados pueden realizar compras

---

## 🗄️ Estructura de la Base de Datos

### Tabla: `pedidos`

```sql
- id (uuid, PK)
- usuario_id (uuid, FK → perfiles.id)
- email (varchar)
- nombre (varchar)
- telefono (varchar)
- total (numeric)
- estado (varchar) - Valores: pendiente, procesando, completado, cancelado, reembolsado
- metodo_pago (varchar)
- transaccion_id (varchar)
- notas (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabla: `pedidos_items`

```sql
- id (uuid, PK)
- pedido_id (uuid, FK → pedidos.id)
- producto_id (uuid, FK → productos.id)
- nombre_producto (varchar)
- precio (numeric)
- cantidad (int)
- subtotal (numeric)
- created_at (timestamp)
```

---

## 🚀 Funcionalidades

### Para Usuarios

#### 1. Realizar Compra

**Ubicación**: Carrito de compras → Botón "Realizar Compra"

**Flujo**:

1. Usuario agrega productos al carrito
2. Click en "Realizar Compra"
3. **Validación**: Si no está autenticado, muestra alerta "Inicia sesión"
4. Si está autenticado, abre modal de confirmación
5. Usuario llena:
   - Nombre completo
   - Teléfono
   - Método de pago
   - Notas (opcional)
6. Click en "Confirmar Pedido"
7. Se crea el pedido en la base de datos
8. Se vacía el carrito automáticamente
9. Mensaje de éxito con ID del pedido

**Código clave**:

```javascript
// js/pedidos-ui.js
function abrirModalFinalizarCompra() {
  if (!authState.isLoggedIn) {
    alert("⚠️ Por favor, inicia sesión para realizar una compra");
    return;
  }
  // ... resto del código
}
```

#### 2. Ver Mis Pedidos

**Ubicación**: Menú de usuario → "Mis Pedidos"

**Características**:

- Lista de todos los pedidos del usuario
- Filtros por estado: Todos, Pendientes, Procesando, Completados
- Estadísticas: Total pedidos, Completados, Enviados, Total gastado
- Ver detalle completo de cada pedido
- Cancelar pedidos en estado "pendiente"

**Código clave**:

```javascript
// js/pedidos.js
async function obtenerMisPedidos() {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("usuario_id", authState.user.id)
    .order("created_at", { ascending: false });
  return data || [];
}
```

### Para Administradores

#### 1. Panel de Administración

**URL**: `admin-pedidos.html`

**Características**:

- ✅ Dashboard con estadísticas globales
- ✅ Ver todos los pedidos del sistema
- ✅ Filtrar por estado
- ✅ Ver detalles completos de cada pedido
- ✅ Cambiar estado de pedidos
- ✅ Exportar pedidos a CSV

**Acceso**:

```javascript
// Solo usuarios con rol === 'admin' pueden acceder
if (authState.user.rol !== "admin") {
  alert("Acceso denegado");
  window.location.href = "index.html";
}
```

#### 2. Gestión de Estados

**Estados disponibles**:

1. **pendiente** → Pedido recién creado
2. **procesando** → Admin está preparando el pedido
3. **completado** → Pedido finalizado exitosamente
4. **cancelado** → Pedido cancelado
5. **reembolsado** → Pedido reembolsado

**Flujo recomendado**:

```
pendiente → procesando → completado
```

**Código clave**:

```javascript
// js/pedidos.js
async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
  if (authState.user.rol !== "admin") {
    throw new Error("No tienes permisos");
  }

  const { error } = await supabase
    .from("pedidos")
    .update({ estado: nuevoEstado })
    .eq("id", pedidoId);

  return !error;
}
```

---

## 📁 Archivos del Sistema

### JavaScript

```
js/
├── pedidos.js          → Lógica backend (CRUD pedidos)
├── pedidos-ui.js       → Interfaz de usuario (modales, UI)
├── admin-pedidos.js    → Panel de administración
├── carrito.js          → Integración con checkout
└── auth.js             → Validación de sesión
```

### HTML

```
├── index.html          → Incluye modal de checkout
├── catalogo.html       → Incluye modal de checkout
├── admin-pedidos.html  → Panel de administración
├── MODAL_PEDIDOS.html  → Modales reutilizables
└── MODALES_AUTH_SIMPLE.html → Modales de autenticación
```

---

## 🔧 Configuración

### 1. Incluir Scripts en HTML

```html
<!-- Orden correcto de carga -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabaseClient.js"></script>
<script src="js/auth.js"></script>
<script src="js/carrito.js"></script>
<script src="js/pedidos.js"></script>
<script src="js/pedidos-ui.js"></script>
```

### 2. Incluir Modal de Checkout

```html
<!-- Antes de cerrar </body> -->
<script>
  // Cargar modal de pedidos
  fetch("MODAL_PEDIDOS.html")
    .then((response) => response.text())
    .then((html) => {
      document.body.insertAdjacentHTML("beforeend", html);
    });
</script>
```

### 3. Políticas de Seguridad en Supabase

**Row Level Security (RLS)**:

```sql
-- Usuarios pueden ver solo sus pedidos
CREATE POLICY "usuarios_ver_propios_pedidos" ON pedidos
  FOR SELECT USING (auth.uid() = usuario_id);

-- Usuarios pueden crear pedidos
CREATE POLICY "usuarios_crear_pedidos" ON pedidos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Solo admins pueden ver todos los pedidos
CREATE POLICY "admins_ver_todos_pedidos" ON pedidos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Solo admins pueden actualizar pedidos
CREATE POLICY "admins_actualizar_pedidos" ON pedidos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );
```

---

## 🎯 Flujo Completo de un Pedido

### Paso 1: Usuario agrega productos al carrito

```javascript
// js/carrito.js
carrito.agregar({
  id: "prod-123",
  nombre: "God of War",
  precio: 59.99,
  imagen: "img/gow.jpg",
  cantidad: 1,
});
```

### Paso 2: Usuario hace checkout

```javascript
// js/pedidos-ui.js
abrirModalFinalizarCompra();
// → Valida sesión
// → Muestra modal con formulario
```

### Paso 3: Usuario confirma pedido

```javascript
// js/pedidos-ui.js
async function procesarCompra() {
  const resultado = await crearPedido(datosEnvio);
  if (resultado.success) {
    alert("Pedido creado: " + resultado.pedido.id);
    carrito.vaciar();
  }
}
```

### Paso 4: Se crea en la base de datos

```javascript
// js/pedidos.js
async function crearPedido(datosEnvio) {
  // Inserta en tabla 'pedidos'
  const { data: pedido } = await supabase
    .from('pedidos')
    .insert([{ usuario_id, email, total, ... }])
    .select()
    .single();

  // Inserta items en 'pedidos_items'
  await supabase
    .from('pedidos_items')
    .insert(items);

  return { success: true, pedido };
}
```

### Paso 5: Admin gestiona el pedido

```javascript
// admin-pedidos.html
// 1. Ve el pedido en el panel
// 2. Click en "Cambiar estado"
// 3. Selecciona: procesando → completado
await actualizarEstadoPedido(pedidoId, "completado");
```

### Paso 6: Usuario ve el estado actualizado

```javascript
// Usuario entra a "Mis Pedidos"
const pedidos = await obtenerMisPedidos();
// Ve su pedido con estado "completado"
```

---

## 🐛 Solución de Problemas

### Error: "Debes iniciar sesión"

**Causa**: Usuario no autenticado intenta comprar
**Solución**: El sistema ya muestra alerta, usuario debe hacer login

### Error: "No tienes permisos"

**Causa**: Usuario normal intenta acceder a funciones de admin
**Solución**: Verificar que el usuario tenga `rol = 'admin'` en la tabla `perfiles`

### Pedidos no se muestran

**Causa**: Problema con políticas RLS en Supabase
**Solución**:

1. Ir a Supabase → Authentication → Policies
2. Verificar que las políticas de `pedidos` estén activas
3. Verificar que el usuario esté autenticado correctamente

### Items del pedido no se guardan

**Causa**: Error en la tabla `pedidos_items`
**Solución**:

1. Verificar que la tabla existe
2. Verificar foreign keys correctas
3. Ver consola del navegador para errores específicos

---

## 📊 Estadísticas y Reportes

### Dashboard de Admin

```javascript
const stats = await obtenerEstadisticasGlobales();
/*
{
  total_pedidos: 150,
  pedidos_pendientes: 12,
  pedidos_procesando: 8,
  pedidos_completados: 125,
  pedidos_cancelados: 5,
  total_ventas: 8950.50
}
*/
```

### Exportar a CSV

```javascript
// Botón en admin-pedidos.html
exportarPedidosCSV();
// Descarga archivo: pedidos_2024-12-02.csv
```

---

## ✅ Checklist de Implementación

- [x] Crear tablas `pedidos` y `pedidos_items` en Supabase
- [x] Configurar políticas RLS
- [x] Implementar validación de sesión en checkout
- [x] Crear modal de confirmación de compra
- [x] Implementar creación de pedidos
- [x] Crear página de "Mis Pedidos" para usuarios
- [x] Crear panel de administración (`admin-pedidos.html`)
- [x] Implementar cambio de estados por admin
- [x] Agregar estadísticas y dashboard
- [x] Implementar exportación a CSV
- [ ] Agregar notificaciones por email (opcional)
- [ ] Agregar historial de cambios de estado (opcional)

---

## 🔐 Seguridad

### Validaciones Implementadas

1. **Autenticación requerida**

   ```javascript
   if (!authState.isLoggedIn) {
     alert("Por favor, inicia sesión");
     return;
   }
   ```

2. **Verificación de rol de admin**

   ```javascript
   if (authState.user.rol !== "admin") {
     throw new Error("No tienes permisos");
   }
   ```

3. **Validación de formularios**

   ```javascript
   if (!form.checkValidity()) {
     form.reportValidity();
     return;
   }
   ```

4. **Row Level Security en Supabase**
   - Usuarios solo ven sus pedidos
   - Admins ven todos los pedidos
   - Solo admins pueden cambiar estados

---

## 📝 Notas Adicionales

- Los pedidos solo pueden ser cancelados por el usuario si están en estado "pendiente"
- El carrito se vacía automáticamente después de crear un pedido exitoso
- Los precios se guardan en el momento de la compra (histórico)
- Todos los pedidos quedan registrados permanentemente en la base de datos

---

## 🎨 Personalización

### Cambiar estados disponibles

Editar en `js/pedidos.js`:

```javascript
const estadosValidos = [
  "pendiente",
  "procesando",
  "completado",
  "cancelado",
  "reembolsado",
];
```

### Cambiar colores de badges

Editar en `js/pedidos.js`:

```javascript
function obtenerClaseBadgeEstado(estado) {
  const clases = {
    pendiente: "bg-warning text-dark",
    procesando: "bg-info",
    // ... agregar más
  };
  return clases[estado];
}
```

---

## 📞 Soporte

Para problemas o dudas sobre el sistema de pedidos, revisar:

1. Consola del navegador (F12)
2. Logs de Supabase
3. Políticas RLS en Supabase

---

**Desarrollado para Digital Loot** 🎮
_Sistema de gestión de pedidos v1.0_
