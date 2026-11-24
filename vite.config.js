import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Робить збірку, яку можна відкрити подвійним кліком по dist/index.html (file://)
// і яка працює на будь-якому хостингу: звичайний (не module) скрипт, без crossorigin.
const fileProtocolFriendly = () => ({
  name: 'file-protocol-friendly',
  apply: 'build', // тільки для npm run build, не для npm run dev
  enforce: 'post',
  transformIndexHtml(html) {
    const scripts = [];
    html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) => {
      scripts.push(`<script defer src="${src}"></script>`); return '';
    });
    html = html.replace(/ crossorigin/g, '');
    return html.replace('</body>', `${scripts.join('\n')}</body>`);
  },
});

export default defineConfig({
  base: './',
  plugins: [react(), fileProtocolFriendly()],
  build: { rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } } },
});
