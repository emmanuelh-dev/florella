import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

// Las categorías se descubren del propio build, sin rutas fijas: si renombras
// o agregas categorías en Mimir, el test se adapta solo.
const dist = new URL('../dist/', import.meta.url);
const categorias = readdirSync(new URL('solo-ofrendas/', dist), { withFileTypes: true })
  .filter((entrada) => entrada.isDirectory())
  .map((entrada) => `solo-ofrendas/${entrada.name}/index.html`);

const paginas = ['index.html', 'solo-ofrendas/index.html', ...categorias];

test('el build generó al menos una categoría de Solo Ofrendas', () => {
  assert.ok(categorias.length > 0, 'no se generó ninguna categoría');
});

for (const pagina of paginas) {
  test(`Imágenes responsivas locales en ${pagina}`, () => {
    const html = readFileSync(new URL(`../dist/${pagina}`, import.meta.url), 'utf8');
    const fotos = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag)
      .filter((tag) => /group-hover:scale/.test(tag));
    assert.ok(fotos.length > 0);
    for (const foto of fotos) {
      assert.match(foto, /srcset="[^"]+\.webp/);
      assert.match(foto, /sizes="/);
      const src = foto.match(/\ssrc="([^"]+)"/)[1];
      assert.ok(src.startsWith('/_astro/'), src);
      assert.ok(existsSync(new URL(`../dist${src}`, import.meta.url)));
    }
    for (const [, src] of html.matchAll(/data-image="([^"]+)"/g)) {
      assert.ok(src.startsWith('/_astro/') && src.endsWith('.webp'), src);
      assert.ok(existsSync(new URL(`../dist${src}`, import.meta.url)));
    }
    for (const [tag] of html.matchAll(/<img\b[^>]*h-14 w-14[^>]*>/g)) {
      assert.match(tag, /sizes="56px"/);
      assert.match(tag, /srcset="[^"]+112w/);
    }
  });
}
