import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

const request = (path, options) => new Request(`https://florella.example${path}`, options);

test('Worker usa el secret y Nuevo León; valida consultas, protege respuesta y sirve assets', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return Response.json([{ label: 'Capillas, Nuevo León', latitude: 25, longitude: -100, private: 'discard' }, null]);
  });
  const env = { TRACCAR_TOKEN: 'test-secret', ASSETS: { fetch: async () => new Response('static') } };
  assert.equal((await worker.fetch(request('/api/address-search?q=ab'), env)).status, 400);
  assert.equal(calls.length, 0);
  const response = await worker.fetch(request('/api/address-search?q=capillas&region=Tijuana&token=evil'), env);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.equal(calls[0].url.searchParams.get('region'), 'Nuevo León');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-secret');
  assert.equal(calls[0].options.redirect, 'manual');
  assert.equal(body.includes('test-secret'), false);
  assert.deepEqual(JSON.parse(body), [{ label: 'Capillas, Nuevo León', latitude: 25, longitude: -100 }]);
  assert.equal(await (await worker.fetch(request('/solo-ofrendas/'), env)).text(), 'static');
  assert.equal((await worker.fetch(request('/api/address-search?q=capillas', { method: 'POST' }), env)).status, 405);
  assert.equal((await worker.fetch(request('/api/address-search?q=capillas'), {})).status, 503);
});

test('errores de autenticación no exponen respuesta interna', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('internal secret', { status: 401 }));
  const response = await worker.fetch(request('/api/address-search?q=capillas'), { TRACCAR_TOKEN: 'private' });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, 'UPSTREAM_HTTP_401');
  assert.equal(JSON.stringify(body).includes('secret'), false);
});

 test('fallos de red tienen diagnóstico sin revelar mensajes ni credenciales', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('private upstream details'); });
  const response = await worker.fetch(request('/api/address-search?q=capillas'), { TRACCAR_TOKEN: 'private' });
  const body = await response.json();
  assert.equal(body.code, 'UPSTREAM_CONNECTION_FAILED');
  assert.equal(JSON.stringify(body).includes('private'), false);
});

 test('redirecciones no se siguen ni se filtran al navegador', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 302, headers: { Location: 'https://other.example' } });
  });
  // Evita que el límite por segundo de los casos anteriores intervenga.
  const { default: isolatedWorker } = await import('../worker.js?redirect-test');
  const response = await isolatedWorker.fetch(request('/api/address-search?q=capillas'), { TRACCAR_TOKEN: 'private' });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'UPSTREAM_HTTP_302');
});
