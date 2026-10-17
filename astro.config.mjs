// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Dominio publico del sitio. En el hosting define la variable SITE_URL
// (por ejemplo SITE_URL=https://florella.com). Se usa para el canonical,
// Open Graph y el sitemap.
const site = process.env.SITE_URL || 'https://florella.mx';

// https://astro.build/config
export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
  },
});
