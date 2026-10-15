/**
 * Crea una copia HTML autónoma para ver el diseño sin instalar Astro.
 * Este generador es específico para esta página; no reemplaza `astro build`.
 * No requiere dependencias. Ejecuta: node scripts/crear-vista-previa.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (name) => readFile(join(root, name), 'utf8');
let html = (await load('src/pages/index.astro')).replace(/^---[\s\S]*?---\s*/, '');
const { SECCIONES } = await import('../src/data/articulos.js');
const money = (v) => '$' + Number(v).toLocaleString('es-MX');
const cardsHtml = SECCIONES.flatMap((sec) => sec.articulos.map((a) => [
  '<article data-product data-id="' + a.id + '" data-name="' + a.nombre + '" data-price="' + a.precio + '" data-occasions="' + a.occasions.join('|') + '" class="group overflow-hidden rounded-xl border border-line bg-white transition hover:shadow-lg">',
  '<div class="relative aspect-[294/228] overflow-hidden bg-card">',
  '<img src="' + a.imagen + '" alt="' + a.alt + '" width="294" height="228" loading="eager" class="h-full w-full object-cover transition group-hover:scale-105" />',
  '<button type="button" data-favorite="' + a.id + '" aria-label="Guardar ' + a.nombre + ' en favoritos" aria-pressed="false" class="absolute top-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:text-wine"><svg class="h-[18px] w-[18px]" aria-hidden="true"><use href="#i-heart"></use></svg></button>',
  '</div>',
  '<div class="p-3 sm:p-4"><h3 class="text-[13px] font-semibold text-ink sm:text-sm">' + a.nombre + '</h3>',
  '<p class="mt-1 text-[13px] font-bold text-wine sm:text-sm">' + money(a.precio) + ' MXN</p></div>',
  '</article>',
].join(''))).join('\n');
html = html.replace(/\{SECCIONES\.flatMap[\s\S]*?(<\/div>\s*<div id="empty-products")/, (_m, tail) => cardsHtml + tail);
try {
  html = html.replace('<CarritoAnimado />', await load('src/components/CarritoAnimado.astro'));
} catch {
  html = html.replace('<CarritoAnimado />', '');
}
let css;
try {
  css = await load('.preview-tailwind.css');
} catch {
  css = (await load('src/styles/global.css')).replace(/^@import\s+["']tailwindcss["'];\s*/m, '');
}
html = html.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
for (const name of ['config', 'tienda']) {
  const code = await load(`public/scripts/${name}.js`);
  html = html.replace(`<script is:inline defer src="/scripts/${name}.js"></script>`, () => `<script>\n${code}\n</script>`);
}
const paths = [...new Set(Array.from(html.matchAll(/(?:src|href)="(\/(?:imagenes\/[^"\s]+|favicon\.svg))"/g), (match) => match[1]))];
for (const path of paths) {
  const bytes = await readFile(join(root, 'public', path.slice(1)));
  const mime = { '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' }[extname(path)];
  if (!mime) throw new Error(`Tipo de imagen desconocido: ${path}`);
  html = html.replaceAll(`="${path}"`, `="data:${mime};base64,${bytes.toString('base64')}"`);
}
html = '<!-- Vista autónoma generada desde el proyecto Astro. Edita src/ y public/, no este archivo. -->\n' + html;
await writeFile(join(root, 'ABRIR-DISENO.html'), html);
console.log('Vista lista: ABRIR-DISENO.html');
