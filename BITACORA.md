# Bitácora

Rastro corto de cambios. Lo más reciente arriba.

## 2026-10
- **Ficha del arreglo**: al tocar la foto se abre un modal con foto, nombre, precio y descripción (si el arreglo tiene); si no tiene, solo la foto. Navegación separada por catálogo (Florella vs Solo Ofrendas).
- **Catálogo**: precios de **mayor a menor** por defecto en todas las vistas; slugs con override + fallback; categorías renombradas en Mimir (`Coronas`, `Ofrenda Floral`); test de build **dinámico** (descubre las categorías del build).
- **Iconos**: arreglado el trazo de los `<use>` (el menú ☰, las flechas, ✕, + y − salían invisibles); ahora todos los iconos de Lucide se ven.
- **SEO**: canonical, Open Graph, Twitter, JSON-LD (Florist), `sitemap.xml` y `robots.txt`; títulos con Monterrey.
- **Catálogo**: en dev sin caché (ves los cambios de Mimir al refrescar); `bun run sync` refresca respaldos; el build sincroniza antes de compilar.
- **Iconos** migrados a Lucide (lucide.dev).
- **Header**: fuera el buscador; menú ☰ a la derecha del carrito en móvil.
- **Carrito**: entra desde la derecha; encabezado fijo y botón "Cerrar carrito"; pedido por WhatsApp.
- **Inicio**: franja de servicio, CATÁLOGO (por flor / por ocasión), secciones curadas y testimonios.
- **Solo Ofrendas**: landing con sus textos, catálogo por categoría y pedido por WhatsApp.
- Layout unificado (`Layout.astro` + `ProductCard.astro`); estilo premium con esquinas rectas.
- Imágenes locales y comprimidas (cabecera, logo).

## 23 de octubre de 2026 — Buscador conectado mediante Worker

Campo de dirección con sugerencias del servicio de Traccar, Secret `TRACCAR_TOKEN` privado y región `Nuevo León` en `worker.js`. Assets conservados mediante Wrangler. Pruebas aisladas, compilación y cuatro perfiles de navegador correctos; permisos productivos y publicación Cloudflare pendientes de verificación. [Configuración y límites](docs/BUSCADOR.md).

### Corrección del buscador y las imágenes guardadas

`worker.js` usa redirección manual compatible con Cloudflare, sin seguir destinos ni reenviar credenciales. El carrito reutiliza la imagen vigente del producto presente en la página al restaurar pedidos guardados. Regresiones reproducidas antes del cambio; 12 pruebas unitarias, 6 de build y navegador en cuatro perfiles con datos sintéticos.

### Referencias de entrega y números exteriores

Campo opcional «Referencia o entrecalles» debajo de la dirección, incluido en el mensaje de WhatsApp. Si la consulta contiene números, seleccionar una sugerencia conserva el texto original, avisa que el número no está confirmado y no guarda coordenadas aproximadas como domicilio exacto. Prueba aislada reproduce «Janina 105» → «Andador Janina», conserva el domicilio y comprueba ambos campos en el mensaje sin abrir WhatsApp. No incluye tarifas automáticas de envío.

### Plazos de entrega de Solo Ofrendas

Franja de servicio actualizada por instrucción del propietario: envío exprés en 1 hora y estándar en 3 horas. No se añadieron tarifas ni selección de modalidad al pedido.

### Microsoft Clarity

Snippet del proyecto `z2e7cyheo6` instalado una vez en el head de `src/layouts/Layout.astro`, compartido por todas las páginas. Carga asíncrona sin dependencias nuevas.
