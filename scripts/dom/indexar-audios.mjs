#!/usr/bin/env node
/**
 * Lê `public/dom/audio/v1/*.mp3` e reescreve `components/dom/audios-gravados.ts`
 * com os ids encontrados. Rode depois de copiar áudios novos do ElevenLabs:
 *
 *   node scripts/dom/indexar-audios.mjs
 *
 * O nome do arquivo é o id da fala (ex.: `bom-dia-03.mp3`), como está no
 * roteiro (`docs/dom/roteiro-elevenlabs.md`). Avisa sobre arquivo cujo id não
 * existe no catálogo (erro de digitação no nome).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const PASTA = join(RAIZ, 'public', 'dom', 'audio', 'v1')
const SAIDA = join(RAIZ, 'components', 'dom', 'audios-gravados.ts')
const CATALOGO = readFileSync(join(RAIZ, 'components', 'dom', 'falas.ts'), 'utf8')
const conhecidos = new Set([...CATALOGO.matchAll(/f\('([a-z0-9-]+)'/g)].map((m) => m[1]))

const ids = existsSync(PASTA)
  ? readdirSync(PASTA)
      .filter((n) => n.endsWith('.mp3'))
      .map((n) => n.slice(0, -4))
      .sort()
  : []
const desconhecidos = ids.filter((id) => !conhecidos.has(id))
if (desconhecidos.length) console.warn('Arquivos sem fala no catálogo (confira o nome):', desconhecidos.join(', '))

const corpo = readFileSync(SAIDA, 'utf8').replace(
  /new Set<string>\(\[[\s\S]*?\]\)/,
  `new Set<string>([${ids.filter((id) => conhecidos.has(id)).map((id) => `\n  '${id}',`).join('')}${ids.length ? '\n' : ''}])`,
)
writeFileSync(SAIDA, corpo)
console.log(`${ids.length - desconhecidos.length} de ${conhecidos.size} falas com áudio.`)
