# Bitácora

Rastro corto de cambios. Lo más reciente arriba.

## 2026-10
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
