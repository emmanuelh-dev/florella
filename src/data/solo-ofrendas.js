// ============================================================
// CATALOGO "SOLO OFRENDAS" (API publica de Mimir/Bysmax)
// ------------------------------------------------------------
// Fuente: API publica de catalogo. Devuelve { categories: [...] }
// y cada producto trae: id, name, price, featured, available,
// position e images[] ({ width, height, url }).
//
// La pagina se genera en build. Si la API no responde se usa el
// snapshot local (src/data/solo-ofrendas.snapshot.json) como
// respaldo, para que el build nunca se caiga.
//
// Para cambiar el catalogo, basta con actualizar CATALOG_ID.
// ============================================================
import snapshot from './solo-ofrendas.snapshot.json';

const CATALOG_ID = 'cat_hI3DcBZRTZld1yTUC27djSPfZp3hr2Ev';

export const CATALOG_URL = `https://mimir.bysmax.com/public/catalog/${CATALOG_ID}`;

// Slugs "bonitos" para las categorias conocidas. Si una categoria
// nueva no esta aqui, se genera el slug a partir del nombre.
const SLUG_OVERRIDES = {
  'Arreglos Fúnebres': 'arreglos',
  'Canastillas de Peregrinación': 'canastillas',
  'Coronas Fúnebres': 'coronas',
};

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizar(data) {
  const categorias = (data && data.categories) || [];
  return categorias
    // Oculta las categorías sin nombre (los productos sueltos de "Otros").
    .filter((cat) => cat.name && cat.name.trim())
    .map((cat) => {
      const nombre = cat.name.trim();
      const productos = (cat.products || []).map((prod) => {
        const img = prod.images && prod.images[0];
        return {
          id: prod.id,
          nombre: prod.name,
          precio: Number(prod.price) || 0,
          disponible: prod.available !== false,
          imagen: img ? img.url : null,
        };
      });
      return {
        id: cat.id,
        nombre,
        slug: SLUG_OVERRIDES[cat.name] || slugify(nombre) || 'otros',
        productos,
      };
    })
    .filter((cat) => cat.productos.length > 0);
}

let promesa = null;

/**
 * Devuelve las categorias normalizadas del catalogo.
 * @returns {Promise<Array<{id:string,nombre:string,slug:string,productos:Array}>>}
 */
export async function getCategorias() {
  if (!promesa) {
    promesa = (async () => {
      try {
        const res = await fetch(CATALOG_URL, {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return normalizar(await res.json());
      } catch (err) {
        console.warn(
          `[solo-ofrendas] API no disponible (${err.message}); usando snapshot local.`,
        );
        return normalizar(snapshot);
      }
    })();
  }
  return promesa;
}

/** Busca una categoria por su slug. */
export async function getCategoria(slug) {
  const categorias = await getCategorias();
  return categorias.find((cat) => cat.slug === slug);
}

/** Formatea un precio como "$1,300 MXN". */
export function formatearPrecio(precio) {
  return '$' + Number(precio).toLocaleString('es-MX') + ' MXN';
}
