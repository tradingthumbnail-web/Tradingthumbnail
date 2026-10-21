import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts'],
    setupFiles: ['./tests/setup.ts'],
    // Heavy API/Nuxt imports per file — limit parallelism to reduce heap OOM on full runs.
    pool: 'forks',
    maxWorkers: 2,
  },
  resolve: {
    alias: {
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
      '~/composables': fileURLToPath(new URL('./app/composables', import.meta.url)),
      '~/stores': fileURLToPath(new URL('./app/stores', import.meta.url)),
    }
  }
});