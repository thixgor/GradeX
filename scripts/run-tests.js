#!/usr/bin/env node
/**
 * Runner de testes sem dependencia nova.
 *
 * O Node 22 executa TypeScript nativamente, mas so resolve imports
 * com extensao explicita (`./normalize.ts`) — e o codigo do projeto
 * usa imports sem extensao, como exige o bundler do Next. Entao aqui
 * compilamos os modulos puros para CommonJS num diretorio temporario
 * e rodamos o test runner nativo (`node --test`) em cima do JS.
 *
 * Uso: npm test
 */

const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const TSC = path.join(
  ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsc.cmd' : 'tsc',
)

// Modulos puros (sem acesso a banco) cobertos por teste.
const SOURCES = [
  'lib/manual-clinico/normalize.ts',
  'lib/manual-clinico/catalog.ts',
  'lib/manual-clinico/__tests__/normalize.test.ts',
  'lib/manual-clinico/__tests__/catalog.test.ts',
  'lib/utils/slug.ts',
]

if (!fs.existsSync(TSC)) {
  console.error('tsc nao encontrado. Rode `npm install` antes de `npm test`.')
  process.exit(1)
}

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gradex-tests-'))

try {
  execFileSync(
    TSC,
    [
      ...SOURCES,
      '--outDir', outDir,
      '--rootDir', 'lib',
      '--module', 'commonjs',
      '--moduleResolution', 'node',
      '--target', 'es2022',
      '--strict',
      '--esModuleInterop',
      '--skipLibCheck',
      '--noEmit', 'false',
    ],
    { cwd: ROOT, stdio: 'inherit' },
  )

  const testFiles = []
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (full.endsWith('.test.js')) testFiles.push(full)
    }
  }
  walk(outDir)

  if (testFiles.length === 0) {
    console.error('Nenhum arquivo de teste compilado foi encontrado.')
    process.exit(1)
  }

  execFileSync(process.execPath, ['--test', ...testFiles], {
    cwd: ROOT,
    stdio: 'inherit',
  })
} catch (error) {
  process.exit(typeof error.status === 'number' ? error.status : 1)
} finally {
  fs.rmSync(outDir, { recursive: true, force: true })
}
