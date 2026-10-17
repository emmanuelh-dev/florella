# AGENTS.md — Florella

Tienda de florería **estática** (Astro, sin backend). Los pedidos se envían por WhatsApp.

## Comandos
| Comando | Qué hace |
| --- | --- |
| `bun run dev` | Servidor en http://localhost:4321 (en dev el catálogo no se cachea) |
| `bun run build` | Sincroniza respaldos y compila a `dist/` |
| `bun run sync` | Refresca `src/data/*.snapshot.json` desde la API de Mimir |
| `bun run test` | Pruebas (`node --test`) |
| `bun run preview` | Sirve `dist/` |

El dev server corre en segundo plano: se administra con `astro dev stop`, `astro dev status` y `astro dev logs`.

## Rutas
- `/` — florería general (catálogo Florella).
- `/solo-ofrendas` — catálogo funerario.
- `/solo-ofrendas/<categoria>` — categoría (generada en build).

## Datos: dos catálogos independientes
Definidos en `src/data/catalogo.js`, contra la API pública de Mimir:
- **Florella** → `cat_s0D5tDDUOIs7gwy4M8hJrqvYhoWs-syU` (inicio).
- **Solo Ofrendas** → `cat_hI3DcBZRTZld1yTUC27djSPfZp3hr2Ev` (orden: coronas → arreglos → canastillas).

**Actualizar precios/fotos:** se hace en el panel de Mimir. En dev se ve al refrescar; para publicar, `bun run build`. Los `*.snapshot.json` son solo respaldo si la API falla.

## Convenciones
- Un solo layout: `src/layouts/Layout.astro` (header, carrito, diálogos, scripts y SEO).
- Tarjetas con `src/components/ProductCard.astro` (prop `cta`).
- Estilo con **Tailwind puro y esquinas rectas** (`rounded-none`); sin CSS propio ni `<style>`.
- Iconos: sprite SVG en `Layout.astro`, tomados de https://lucide.dev/icons
- Carrito/favoritos/pedido: `public/scripts/tienda.js` (localStorage + WhatsApp).

## SEO
- `title`/`description` por página; canonical, Open Graph, Twitter y JSON-LD en `Layout.astro`.
- `sitemap.xml` y `robots.txt` se generan en build (`src/pages/*.ts`).
- Dominio: variable **`SITE_URL`** (por defecto `https://florella.mx` en `astro.config.mjs`). Cámbialo al dominio real.

Documentación de Astro: https://docs.astro.build
