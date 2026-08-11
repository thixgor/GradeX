import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Testes automatizados do projeto.
 *
 * O escopo é deliberadamente restrito a `__tests__/`: o repositório não tinha
 * runner de testes antes da seção do Manual da Histologia, e varrer a árvore
 * inteira só produziria ruído de arquivos que nunca foram escritos para serem
 * testados.
 */
export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    environment: 'node',
    globals: false,
    // `lib/mongodb.ts` lança no import se a variável não existir, e os módulos
    // testados o importam em cadeia. Nenhum teste abre conexão de verdade —
    // este valor só satisfaz a checagem de import time.
    env: {
      MONGODB_URI: 'mongodb://localhost:27017/gradex-test',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
