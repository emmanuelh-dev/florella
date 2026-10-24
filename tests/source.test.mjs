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
const layout = load('src/layouts/Layout.astro');
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
  const ids = Array.from((source + '\n' + layout).matchAll(/\sid="([^"]+)"/g), (m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
});

test('Los dialogos que se abren existen', () => {
  const page = source + '\n' + layout;
  const dialogs = new Set(Array.from(page.matchAll(/<dialog\s+id="([^"]+)"/g), (m) => m[1]));
  assert.ok(dialogs.size > 0);
  for (const m of page.matchAll(/data-open-dialog="([^"]+)"/g)) {
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

test('checkout solo registra conversiones válidas, sin datos personales ni doble envío', () => {
  const script = load('public/scripts/tienda.js');
  const checkoutSource = script.slice(script.indexOf("  const orderForm = $('#order-form');"), script.indexOf('  if (whatsappReady) {'));
  const handlers = [];
  const conversions = [];
  const opened = [];
  const timers = [];
  let valid = false;
  const button = { disabled: false };
  const form = {
    dataset: {},
    elements: { namedItem: () => null },
    reportValidity: () => valid,
    addEventListener: (type, handler) => handlers.push(handler),
  };
  const context = {
    $: (selector) => selector === '#order-form' ? form : button,
    orderReady: true,
    orderWhatsapp: '528142547600',
    cart: new Map([['product', { name: 'Arreglo de prueba', price: 1000, qty: 2 }]]),
    money: (value) => '$' + value,
    notify: () => {},
    FormData: class { get(key) { return ({ telefono: '8112345678', direccion: 'Dirección privada', fallecido: 'Nombre privado' })[key]; } },
    openWhatsAppTo: (number, message) => opened.push({ number, message }),
    window: { gtag: (...args) => conversions.push(args) },
    setTimeout: (callback) => timers.push(callback),
  };
  const run = new Script('{\n' + checkoutSource + '\n}');
  run.runInNewContext(context);
  run.runInNewContext(context);
  assert.equal(conversions.length, 0);
  const submit = () => handlers.forEach((handler) => handler({ preventDefault() {} }));
  submit();
  assert.equal(opened.length, 0);
  assert.equal(conversions.length, 0);
  valid = true;
  context.orderReady = false;
  submit();
  assert.equal(conversions.length, 0);
  context.orderReady = true;
  submit();
  submit();
  assert.equal(opened.length, 1);
  assert.equal(conversions.length, 1);
  assert.equal(JSON.stringify(conversions[0]), JSON.stringify(['event', 'conversion', { send_to: 'AW-18532000410/g9ZiCOHou6cdEJrF34RF' }]));
  assert.match(opened[0].message, /2 × Arreglo de prueba/);
  assert.match(opened[0].message, /Teléfono de contacto: 8112345678/);
  assert.equal(button.disabled, true);
  timers.forEach((callback) => callback());
  assert.equal(button.disabled, false);
});
