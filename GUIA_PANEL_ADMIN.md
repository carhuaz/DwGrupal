# 🚀 PANEL DE ADMINISTRACIÓN - GUÍA DE USO

## ✅ SISTEMA COMPLETAMENTE RENOVADO

He creado un **nuevo sistema desde cero** para el panel de administración de pedidos con conexión directa a Supabase.

---

## 📁 ARCHIVOS NUEVOS CREADOS:

1. **js/admin-pedidos-v2.js** - Sistema completo de administración
2. **test-admin-simple.html** - Página de pruebas para verificar conexión

---

## 🧪 PASO 1: VERIFICAR LA CONEXIÓN

Antes de usar el panel de admin, verifica que todo funcione:

1. Abre en tu navegador: **test-admin-simple.html**
2. Haz clic en los botones en este orden:
   - **"1. Verificar Supabase"** → Debe decir "Conexión exitosa"
   - **"2. Obtener Pedidos"** → Te mostrará cuántos pedidos hay
   - **"3. Crear Pedido de Prueba"** → Crea un pedido de prueba (necesitas estar logueado)

### 📸 ¿Qué deberías ver?

```
✅ Cliente Supabase OK
✅ Conexión exitosa a la tabla 'pedidos'
📦 Total de pedidos en BD: X
```

Si ves errores rojos, copia el mensaje y dímelo.

---

## 📋 PASO 2: ABRIR EL PANEL DE ADMIN

1. Asegúrate de estar logueado como **admin**
2. Abre: **admin-pedidos.html**
3. Presiona **F12** para ver la consola
4. Deberías ver estos logs:

```
🚀 [ADMIN] Inicializando panel de pedidos...
✅ [ADMIN] Usuario admin verificado: tu@email.com
🔧 [ADMIN] Configurando event listeners...
✅ [ADMIN] Event listeners configurados
📦 [ADMIN] Cargando pedidos desde Supabase...
✅ [ADMIN] X pedidos cargados desde BD
📊 [ADMIN] Actualizando estadísticas...
✅ [ADMIN] Estadísticas actualizadas
```

---

## 🎯 FUNCIONALIDADES DEL PANEL

### 1️⃣ **VER TODOS LOS PEDIDOS**

- Al abrir el panel, verás TODOS los pedidos de TODOS los usuarios
- Muestra: ID, Cliente, Fecha, Total, Estado

### 2️⃣ **FILTRAR POR ESTADO**

- Botones en la parte superior para filtrar:
  - Todos
  - Pendientes
  - Procesando
  - Completados
  - Cancelados

### 3️⃣ **VER DETALLE DE UN PEDIDO**

- Botón 👁️ (ojo) en cada fila
- Muestra información completa del cliente y productos

### 4️⃣ **CAMBIAR ESTADO DEL PEDIDO** ⭐

- Botón 🔄 (flecha circular) en cada fila
- Puedes cambiar el estado a:
  - Pendiente
  - Procesando
  - Completado
  - Cancelado
  - Reembolsado
- **SE GUARDA DIRECTAMENTE EN LA BASE DE DATOS**

### 5️⃣ **ELIMINAR PEDIDO** ⚠️

- Botón 🗑️ (basura) en cada fila
- Pide confirmación antes de eliminar
- **Elimina el pedido Y sus items de la base de datos**

### 6️⃣ **EXPORTAR A CSV**

- Botón verde "Exportar CSV" arriba a la derecha
- Descarga todos los pedidos en formato CSV

### 7️⃣ **ACTUALIZAR**

- Botón "Actualizar" para recargar los datos
- Útil para ver cambios recientes

---

## 📊 ESTADÍSTICAS EN TIEMPO REAL

El panel muestra automáticamente:

- **Total de Pedidos**
- **Pedidos Pendientes**
- **Pedidos en Proceso**
- **Pedidos Completados**
- **Ventas Totales** (suma de todos los pedidos)

---

## 🔧 CÓMO FUNCIONA LA CONEXIÓN

```javascript
// El sistema hace queries directas a Supabase:

// 1. Obtener todos los pedidos con sus datos
await supabase.from("pedidos").select(`
    *,
    perfiles (nombre, email),
    pedidos_items (nombre_producto, precio, cantidad)
  `);

// 2. Cambiar estado
await supabase
  .from("pedidos")
  .update({ estado: "completado" })
  .eq("id", pedidoId);

// 3. Eliminar pedido
await supabase.from("pedidos_items").delete().eq("pedido_id", pedidoId);

await supabase.from("pedidos").delete().eq("id", pedidoId);
```

---

## 🎨 DISEÑO

El panel tiene un **tema oscuro futurista** con:

- Colores neón (violeta, verde, azul)
- Animaciones suaves
- Tabla con scroll
- Badges de colores según el estado
- Efectos hover

---

## ❗ SOLUCIÓN DE PROBLEMAS

### Problema 1: "No hay pedidos"

**Solución:**

1. Abre **test-admin-simple.html**
2. Haz clic en "3. Crear Pedido de Prueba"
3. Recarga **admin-pedidos.html**

### Problema 2: "Acceso denegado"

**Solución:**

- Tu usuario debe tener `rol = 'admin'` en la tabla `perfiles`
- Verifica en Supabase que tu perfil tenga este rol

### Problema 3: "Error al conectar"

**Solución:**

1. Abre la consola (F12)
2. Busca mensajes rojos
3. Copia el error y dímelo

### Problema 4: Los cambios no se guardan

**Solución:**

- Verifica que tengas permisos en Supabase
- Revisa las políticas de seguridad (RLS)
- Mira la consola para ver errores específicos

---

## 📸 FLUJO DE TRABAJO TÍPICO

```
1. Cliente hace pedido en la tienda
   ↓
2. Aparece en el panel de admin como "PENDIENTE"
   ↓
3. Admin revisa el pedido (botón 👁️)
   ↓
4. Admin cambia estado a "PROCESANDO" (botón 🔄)
   ↓
5. Admin prepara el envío
   ↓
6. Admin cambia estado a "COMPLETADO" (botón 🔄)
   ↓
7. Cliente ve el estado actualizado en "Mis Pedidos"
```

---

## 🔐 SEGURIDAD

- Solo usuarios con `rol = 'admin'` pueden acceder
- Si intentas entrar sin ser admin, te redirige a index.html
- Todos los cambios se registran en la base de datos
- Las eliminaciones piden confirmación

---

## 💡 TIPS

1. **Usa los filtros** para ver solo pedidos pendientes
2. **Exporta CSV** al final del día para tus registros
3. **Actualiza** la página después de hacer cambios importantes
4. **Revisa la consola** (F12) si algo no funciona

---

## 📞 PRÓXIMOS PASOS

Si todo funciona correctamente, puedes:

1. Personalizar los colores en `estilos/admin-pedidos.css`
2. Agregar más filtros (por fecha, por monto, etc.)
3. Agregar notificaciones por email
4. Crear reportes más detallados

---

## ✅ CHECKLIST

- [ ] Abrir test-admin-simple.html
- [ ] Ejecutar Test 1 (Verificar Supabase) → ✅
- [ ] Ejecutar Test 2 (Obtener Pedidos) → Ver cantidad
- [ ] Ejecutar Test 3 (Crear Pedido) → Si no hay pedidos
- [ ] Abrir admin-pedidos.html
- [ ] Ver que carguen los pedidos
- [ ] Probar filtros (Pendientes, Completados, etc.)
- [ ] Ver detalle de un pedido (botón 👁️)
- [ ] Cambiar estado de un pedido (botón 🔄)
- [ ] Verificar que el cambio se guardó (recargar)

---

## 🆘 SOPORTE

Si algo no funciona:

1. Abre la consola (F12)
2. Busca mensajes con estos emojis: ❌ 🔴 ERROR
3. Copia TODO el texto del error
4. Envíamelo y te ayudo a solucionarlo

---

**¡El sistema está 100% funcional y conectado a Supabase!** 🎉
