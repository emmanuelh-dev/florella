// robots.txt generado en build (usa el dominio de astro.config -> SITE_URL).
export const prerender = true;

export function GET({ site }) {
  const base = site ?? new URL('https://florella.mx');
  const sitemap = new URL('sitemap.xml', base).href;
  const cuerpo = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(cuerpo, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
