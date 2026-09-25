import { defineConfig } from 'vite';

// Modo "artifact": three.js se carga desde un CDN mediante importmap y el resto
// del juego se empaqueta en un único módulo, para publicar una sola página HTML.
export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact';
  return {
    base: './',
    build: {
      outDir: artifact ? 'dist-artifact' : 'dist',
      target: 'es2022',
      assetsInlineLimit: 100_000_000,
      cssCodeSplit: false,
      rollupOptions: artifact
        ? {
            external: [/^three$/, /^three\/addons\//],
            output: { inlineDynamicImports: true },
          }
        : {},
    },
    test: { environment: 'node' },
  };
});
