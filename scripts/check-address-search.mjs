import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve('dist');
const output = resolve('docs/evidencias/buscador');
await mkdir(output, { recursive: true });
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path.startsWith('/api/')) return res.writeHead(500).end('Unmocked API');
  const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
  if (!file.startsWith(root + '/')) return res.writeHead(403).end();
  try {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [390, 1440]) {
    for (const colorScheme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 950 }, colorScheme });
      const page = await context.newPage();
      let calls = 0;
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname === '/api/address-search') {
          calls += 1;
          assert.equal(url.searchParams.has('token'), false);
          return route.fulfill({ json: [{ label: url.searchParams.get('q').startsWith('Janina') ? 'Andador Janina, Nuevo León' : 'Capillas Demo, Monterrey, Nuevo León', latitude: 25.67, longitude: -100.31 }] });
        }
        if (url.origin !== `http://127.0.0.1:${server.address().port}`) return route.abort();
        return route.continue();
      });
      await page.goto(`http://127.0.0.1:${server.address().port}/solo-ofrendas/`);
      const product = await page.locator('[data-product]').first().evaluate((card) => ({
        id: card.dataset.id, name: card.dataset.name, price: Number(card.dataset.price),
        image: card.querySelector('img').getAttribute('src'), qty: 2,
      }));
      await page.evaluate((product) => localStorage.setItem('florella-cart-v1', JSON.stringify([
        { ...product, image: '/_astro/old-deployment.webp' },
      ])), product);
      await page.reload();
      const cartImage = page.locator('#cart-items img').first();
      assert.equal(await cartImage.getAttribute('src'), product.image);
      assert.equal(await page.locator('#cart-items [data-quantity]').first().textContent(), '2');
      await page.evaluate(() => document.querySelector('#order-form').closest('dialog').showModal());
      const input = page.locator('[name="direccion"]');
      await input.fill('ca');
      await page.waitForTimeout(400);
      assert.equal(calls, 0);
      await input.fill('capillas');
      await page.locator('#address-results button').waitFor({ state: 'visible' });
      await page.locator('#address-results').scrollIntoViewIfNeeded();
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: `${output}/${width}-${colorScheme}.png` });
      await input.press('ArrowDown');
      await page.keyboard.press('Enter');
      assert.equal(await input.inputValue(), 'Capillas Demo, Monterrey, Nuevo León');
      assert.equal(await input.getAttribute('data-latitude'), '25.67');
      await input.fill('Janina 105');
      await page.locator('#address-results button').waitFor({ state: 'visible' });
      await page.locator('#address-results button').first().click();
      assert.equal(await input.inputValue(), 'Janina 105');
      assert.equal(await input.getAttribute('data-latitude'), null);
      await page.getByText('El resultado no confirma el número. Conservamos tu dirección; agrega referencias para la entrega.').waitFor();
      await page.getByLabel('Referencia o entrecalles').fill('Entre Roble y Pino, portón azul');
      await page.getByLabel('Referencia o entrecalles').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/referencia-${width}-${colorScheme}.png` });
      const message = await page.evaluate(() => {
        let target;
        window.open = (url) => { target = url; return null; };
        document.querySelector('#order-form').requestSubmit();
        return new URL(target).searchParams.get('text');
      });
      assert.ok(message.includes('Dirección de envío o Capillas: Janina 105'));
      assert.ok(message.includes('Referencia o entrecalles: Entre Roble y Pino, portón azul'));
      await input.fill('dirección manual');
      assert.equal(await input.getAttribute('data-latitude'), null);
      await page.route('**/api/address-search?*', (route) => route.fulfill({ status: 503, json: { error: 'Demo' } }));
      await input.fill('otra dirección');
      await page.getByText('No pudimos buscar. Puedes escribir la dirección manualmente.').waitFor();
      console.log(`PASS ${width} ${colorScheme}`);
      await context.close();
    }
  }
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
