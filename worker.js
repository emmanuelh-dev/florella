const REGION = 'Nuevo León';
let windowStart = 0;
let requests = 0;
let active = 0;

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/address-search') return env.ASSETS.fetch(request);
    if (request.method !== 'GET') return json({ error: 'Método no permitido' }, 405);
    const query = (url.searchParams.get('q') || '').trim();
    if (query.length < 3 || query.length > 200) return json({ error: 'Escribe entre 3 y 200 caracteres' }, 400);
    if (!env.TRACCAR_TOKEN) return json({ error: 'Buscador no disponible. Puedes escribir la dirección manualmente.' }, 503);
    if (Date.now() - windowStart > 1000) { windowStart = Date.now(); requests = 0; }
    // Límite por instancia del Worker; el presupuesto global se controla en Traccar.
    if (active >= 4 || requests >= 5) return json({ error: 'Espera un momento y vuelve a buscar' }, 429);
    requests += 1;
    active += 1;
    let failureCode = 'UPSTREAM_CONNECTION_FAILED';
    try {
      const target = new URL('https://gps.bysmax.com/api/routing/search');
      target.search = new URLSearchParams({ q: query, region: REGION }).toString();
      const response = await fetch(target, {
        headers: { Authorization: `Bearer ${env.TRACCAR_TOKEN}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
        redirect: 'manual',
      });
      if (!response.ok) {
        failureCode = `UPSTREAM_HTTP_${response.status}`;
        throw new Error('Proveedor no disponible');
      }
      failureCode = 'UPSTREAM_INVALID_RESPONSE';
      const places = await response.json();
      if (!Array.isArray(places)) throw new Error('Respuesta inválida');
      return json(places.filter((p) => p && typeof p.label === 'string'
        && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)).slice(0, 10)
        .map(({ label, latitude, longitude }) => ({ label, latitude, longitude })));
    } catch (error) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') failureCode = 'UPSTREAM_TIMEOUT';
      console.error('address-search failed', { code: failureCode });
      return json({ error: 'No pudimos consultar las direcciones. Puedes escribirla manualmente.', code: failureCode }, 503);
    } finally {
      active -= 1;
    }
  },
};
