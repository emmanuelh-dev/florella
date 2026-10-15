import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

import { SECCIONES } from '../src/data/articulos.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (name) => readFileSync(join(root, name), 'utf8');
const source = load('src/pages/index.astro');
const css = load('src/styles/global.css');
const preview = load('ABRIR-DISENO.html');

test('articulos.js tiene cinco productos con datos completos', () => {
  const items = SECCIONES.flatMap((sec) => sec.articulos);
  assert.equal(items.length, 5);
  const ids = items.map((a) => a.id);
  assert.equal(new Set(ids).size, 5);
  for (const a of items) {
    assert.ok(a.id && a.nombre && a.imagen);
    assert.ok(Number.isFinite(a.precio) && a.precio > 0);
    assert.ok(Array.isArray(a.occasions) && a.occasions.length > 0);
  }
});

test('Todas las imagenes referenciadas existen', () => {
  const html = load('src/pages/index.astro');
  const paths = [];
  for (const m of html.matchAll(/src="(\/imagenes\/[^"]+)"/g)) paths.push(m[1]);
  for (const sec of SECCIONES) {
    for (const a of sec.articulos) paths.push(a.imagen);
  }
  assert.ok(paths.length > 0);
  for (const path of new Set(paths)) assert.ok(existsSync(join(root, 'public', path)), path);
});

test('Los dos archivos JavaScript tienen sintaxis valida', () => {
  for (const name of ['config', 'tienda']) new Script(load(`public/scripts/${name}.js`));
});

test('La vista previa trae Tailwind compilado y las imagenes locales', () => {
  assert.ok(preview.includes('bg-wine'));
  assert.ok(!preview.includes('@import "tailwindcss"'));
  const embedded = (preview.match(/src="data:image\//g) || []).length;
  assert.ok(embedded >= 13, 'embebidas: ' + embedded);
  assert.equal((preview.match(/<script[^>]+src=/g) || []).length, 0);
});

test('No hay identificadores HTML duplicados en el inicio', () => {
  const ids = Array.from(source.matchAll(/\sid="([^"]+)"/g), (m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
});

test('Los dialogos que se abren existen', () => {
  const dialogs = new Set(Array.from(source.matchAll(/<dialog\s+id="([^"]+)"/g), (m) => m[1]));
  assert.ok(dialogs.size > 0);
  for (const m of source.matchAll(/data-open-dialog="([^"]+)"/g)) {
    assert.ok(dialogs.has(m[1]), m[1]);
  }
});

test('Todo es Tailwind puro, sin CSS personalizado', () => {
  assert.ok(!load('src/pages/index.astro').includes('<style'));
  assert.ok(!/^\.[a-zA-Z][\w-]*\s*\{/m.test(css));
});

test('El telefono usa el WhatsApp real de la floreria', () => {
  assert.match(load('public/scripts/config.js'), /whatsapp:\s*"528116176724"/);
});
