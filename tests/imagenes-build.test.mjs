import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

for (const pagina of ['index.html', 'solo-ofrendas/index.html', 'solo-ofrendas/coronas/index.html', 'solo-ofrendas/arreglos/index.html', 'solo-ofrendas/canastillas/index.html']) {
  test(`Imágenes responsivas locales en ${pagina}`, () => {
    const html = readFileSync(new URL(`../dist/${pagina}`, import.meta.url), 'utf8');
    const fotos = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag)
      .filter(tag => /group-hover:scale/.test(tag));
    assert.ok(fotos.length > 0);
    for (const foto of fotos) {
      assert.match(foto, /srcset="[^"]+\.webp/);
      assert.match(foto, /sizes="/);
      const src = foto.match(/\ssrc="([^"]+)"/)[1];
      assert.ok(src.startsWith('/_astro/'), src);
      assert.ok(existsSync(join('dist', src)));
    }
    for (const [, src] of html.matchAll(/data-image="([^"]+)"/g)) {
      assert.ok(src.startsWith('/_astro/') && src.endsWith('.webp'), src);
      assert.ok(existsSync(join('dist', src)));
    }
    for (const [tag] of html.matchAll(/<img\b[^>]*h-14 w-14[^>]*>/g)) {
      assert.match(tag, /sizes="56px"/);
      assert.match(tag, /srcset="[^"]+112w/);
    }
  });
}
