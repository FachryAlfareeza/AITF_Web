import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const frontendDirectory = fileURLToPath(new URL('.', import.meta.url));
const projectDirectory = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig(() => {
  return {
    // Base public path for GitHub Pages project site:
    // https://<user>.github.io/AITF_Web/. Override with VITE_BASE if the
    // repo/site path ever changes. Use '/' for local dev and root hosting.
    base: process.env.VITE_BASE ?? '/AITF_Web/',
    root: frontendDirectory,
    envDir: projectDirectory,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': frontendDirectory,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
