// ============================================================
// CATALOGOS (API publica de Mimir/Bysmax)
// ------------------------------------------------------------
// Son DOS catalogos independientes, cada uno con sus productos:
//   - florella      -> tienda general, se muestra en la raiz (/)
//   - soloOfrendas  -> catalogo funerario, en /solo-ofrendas
//
// La API devuelve { categories: [...] } y cada producto trae:
// id, name, price, featured, available, position e images[]
// ({ width, height, url }).
//
// Las paginas se generan en build. Si la API no responde se usa
// el snapshot local de cada catalogo como respaldo, para que el
// build nunca se caiga.
//
// Para cambiar un catalogo, actualiza su `id` aqui.
// ============================================================
import snapshotFlorella from './florella.snapshot.json';
import snapshotSoloOfrendas from './solo-ofrendas.snapshot.json';

const BASE_URL = 'https://mimir.bysmax.com/public/catalog';

const CATALOGOS = {
  florella: {
    id: 'cat_s0D5tDDUOIs7gwy4M8hJrqvYhoWs-syU',
    snapshot: snapshotFlorella,
    slugOverrides: {},
  },
  soloOfrendas: {
    id: 'cat_hI3DcBZRTZld1yTUC27djSPfZp3hr2Ev',
    snapshot: snapshotSoloOfrendas,
    // Orden en el que se muestran las secciones.
    orden: ['coronas', 'ofrenda-floral', 'canastillas'],
    // Slugs "bonitos" para las categorias conocidas del catalogo funerario.
    // Se mantienen los nombres viejos por si el catalogo vuelve atras.
    slugOverrides: {
      'Coronas': 'coronas',
      'Coronas Fúnebres': 'coronas',
      'Ofrenda Floral': 'ofrenda-floral',
      'Arreglos Fúnebres': 'ofrenda-floral',
      'Canastillas de Peregrinación': 'canastillas',
    },
  },
};

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizar(data, config) {
  const slugOverrides = config.slugOverrides || {};
  const categorias = (data && data.categories) || [];
  const usados = new Set();

  const items = categorias
    // Oculta las categorias sin nombre (productos sueltos).
    .filter((cat) => cat.name && cat.name.trim())
    .map((cat) => {
      const nombre = cat.name.trim();

      // Slug unico (dos categorias pueden normalizar al mismo).
      const base = slugOverrides[cat.name] || slugify(nombre) || 'seccion';
      let slug = base;
      let n = 2;
      while (usados.has(slug)) slug = `${base}-${n++}`;
      usados.add(slug);

      const productos = (cat.products || [])
        .map((prod) => {
          const img = prod.images && prod.images[0];
          return {
            id: prod.id,
            nombre: prod.name,
            precio: Number(prod.price) || 0,
            disponible: prod.available !== false,
            imagen: img ? img.url : null,
          };
        })
        // Precio: del mas caro al mas barato por defecto.
        .sort((a, b) => b.precio - a.precio);

      return { id: cat.id, nombre, slug, productos };
    })
    .filter((cat) => cat.productos.length > 0);

  // Orden personalizado de secciones (las no listadas van al final).
  if (config.orden && config.orden.length) {
    const rank = (slug) => {
      const i = config.orden.indexOf(slug);
      return i === -1 ? config.orden.length : i;
    };
    items.sort((a, b) => rank(a.slug) - rank(b.slug));
  }

  return items;
}

const cache = new Map();

// En desarrollo NO cacheamos: asi ves al instante lo que cambies en Mimir
// (precios, fotos) sin reiniciar el servidor. En el build si se cachea para
// pedir cada catalogo una sola vez.
const CACHEAR = !import.meta.env?.DEV;

/**
 * Devuelve las categorias normalizadas de un catalogo.
 * @param {'florella'|'soloOfrendas'} nombre
 * @returns {Promise<Array<{id:string,nombre:string,slug:string,productos:Array}>>}
 */
export async function getCatalogo(nombre) {
  const config = CATALOGOS[nombre];
  if (!config) throw new Error(`Catalogo desconocido: ${nombre}`);
  if (CACHEAR && cache.has(nombre)) return cache.get(nombre);

  const promesa = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/${config.id}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return normalizar(await res.json(), config);
    } catch (err) {
      console.warn(
        `[catalogo:${nombre}] API no disponible (${err.message}); usando snapshot local.`,
      );
      return normalizar(config.snapshot, config);
    }
  })();

  if (CACHEAR) cache.set(nombre, promesa);
  return promesa;
}

/** Catalogo general de Florella (raiz). */
export const getCategoriasFlorella = () => getCatalogo('florella');

/** Catalogo funerario Solo Ofrendas. */
export const getCategoriasSoloOfrendas = () => getCatalogo('soloOfrendas');

/** Formatea un precio como "$1,300 MXN". */
export function formatearPrecio(precio) {
  return '$' + Number(precio).toLocaleString('es-MX') + ' MXN';
}
