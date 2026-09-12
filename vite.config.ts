import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  // Auto-detect GitHub Pages repository base in CI, fallback to relative for static hosting or '/' in dev
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : (process.env.NODE_ENV === 'production' ? './' : '/'),
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
});
