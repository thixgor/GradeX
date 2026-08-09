import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Testes do Manual da Histologia.
 *
 * O escopo é deliberadamente restrito a `__tests__/`: o repositório não tinha
 * runner de testes antes desta seção, e varrer a árvore inteira só produziria
 * ruído de arquivos que nunca foram escritos para serem testados.
 */
export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
