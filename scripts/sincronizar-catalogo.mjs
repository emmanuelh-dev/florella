// Refresca los respaldos locales (src/data/*.snapshot.json) con lo ultimo de
// la API de Mimir. Sirve para compilar sin internet o para dejar al dia los
// datos de respaldo que se usan cuando la API no responde.
//
//   bun run sync
//
// Si la API falla con un catalogo, se conserva su respaldo actual.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_URL = 'https://mimir.bysmax.com/public/catalog';
const CATALOGOS = {
  florella: { id: 'cat_s0D5tDDUOIs7gwy4M8hJrqvYhoWs-syU', archivo: 'florella.snapshot.json' },
  soloOfrendas: {
    id: 'cat_hI3DcBZRTZld1yTUC27djSPfZp3hr2Ev',
    archivo: 'solo-ofrendas.snapshot.json',
  },
};

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const [nombre, config] of Object.entries(CATALOGOS)) {
  try {
    const res = await fetch(`${BASE_URL}/${config.id}`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const categorias = (data.categories || []).length;
    const productos = (data.categories || []).reduce(
      (total, cat) => total + (cat.products?.length || 0),
      0,
    );
    writeFileSync(join(raiz, 'src/data', config.archivo), JSON.stringify(data));
    console.log(`✔ ${nombre}: ${categorias} categorías, ${productos} productos → ${config.archivo}`);
  } catch (err) {
    console.error(`✖ ${nombre}: ${err.message} (se conserva el respaldo actual)`);
    process.exitCode = 1;
  }
}
