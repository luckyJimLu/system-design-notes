import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project site is served from /system-design-notes/.
  // Keep local development at / while using the repository path in CI builds.
  base: process.env.GITHUB_ACTIONS ? '/system-design-notes/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    fs: {
      allow: ['.'],
    },
  },
});
