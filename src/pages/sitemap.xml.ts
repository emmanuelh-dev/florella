// Sitemap XML generado en build. Incluye el inicio, Solo Ofrendas y cada
// categoría del catálogo funerario.
import { getCategoriasSoloOfrendas } from '../data/catalogo.js';

export const prerender = true;

export async function GET({ site }) {
  const base = (site ?? new URL('https://florella.mx')).href.replace(/\/$/, '');
  const categorias = await getCategoriasSoloOfrendas();
  const rutas = [
    '/',
    '/solo-ofrendas',
    ...categorias.map((cat) => `/solo-ofrendas/${cat.slug}`),
  ];
  const urls = rutas
    .map((ruta) => `  <url><loc>${base}${ruta === '/' ? '/' : ruta}</loc></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
