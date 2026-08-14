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
    alias: {
      '@': path.resolve(__dirname, '.'),
      // `server-only` só é inofensivo quando resolvido pela condição
      // `react-server`, que o Next aplica e o vitest não: pelo caminho padrão o
      // pacote lança no import ("cannot be imported from a Client Component").
      // Apontar para o `empty.js` dele é exatamente o que o Next faz num
      // Server Component, e é o que permite testar módulos de servidor —
      // `lib/histologia/acesso.ts`, por exemplo — sem afrouxar a marcação.
      'server-only': path.resolve(__dirname, 'node_modules/server-only/empty.js'),
    },
  },
})
