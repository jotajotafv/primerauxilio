import { defineConfig } from 'vite';

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/primerauxilio/' : '/',
  build: { rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
}));
