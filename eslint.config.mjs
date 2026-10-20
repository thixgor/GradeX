import { defineConfig } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

/**
 * ESLint em config plana, rodado pelo `npm run lint` (o `next lint` saiu no
 * Next 16). Por que `no-img-element` fica desligada está em
 * `.eslintrc.README.md`.
 */

/**
 * Regras do React Compiler que o `eslint-plugin-react-hooks` 7 passou a ligar
 * no `recommended`.
 *
 * Elas dizem se um componente pode ser compilado pelo React Compiler — que
 * este projeto não usa —, não se ele está errado. Ligadas, viravam ~570 erros
 * novos de uma vez e enterravam o `lint:histologia`, que estava limpo. Ficam
 * desligadas até alguém decidir adotar o compilador; `rules-of-hooks` e
 * `exhaustive-deps`, as duas que já valiam, continuam.
 */
const regrasDoCompilador = [
  'static-components',
  'use-memo',
  'preserve-manual-memoization',
  'incompatible-library',
  'immutability',
  'globals',
  'refs',
  'set-state-in-effect',
  'error-boundaries',
  'purity',
  'set-state-in-render',
  'unsupported-syntax',
  'config',
  'gating',
]

export default defineConfig([
  {
    extends: [...nextCoreWebVitals],
    rules: {
      '@next/next/no-img-element': 'off',
      ...Object.fromEntries(regrasDoCompilador.map((r) => [`react-hooks/${r}`, 'off'])),
    },
    linterOptions: {
      // O ESLint 9 passou a avisar de `eslint-disable` sem uso; o 8 não
      // avisava. Limpar essas diretivas é trabalho à parte.
      reportUnusedDisableDirectives: 'off',
    },
  },
])
