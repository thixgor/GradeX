#!/usr/bin/env node
/**
 * Insere o bloco `conduta` em ferramentas que ainda não o têm.
 *
 * Existe porque duas edições anteriores, feitas por busca de texto solta,
 * quebraram arquivos: uma consumiu o `}` que fechava o `Resultado` e outra
 * vazou para a ferramenta seguinte, gerando duas chaves `conduta` no mesmo
 * objeto. Os dois casos passaram batido na auditoria, que lê texto e não
 * compila. Aqui a regra é o contrário: qualquer ambiguidade aborta a
 * inserção daquela ferramenta e nada é escrito.
 *
 * Uso: node scripts/inserir-conduta.mjs <arquivo.json>
 * O JSON é { "<arquivo-alvo>": { "<id-da-ferramenta>": ["linha", ...] } }
 *
 * Âncora: a linha `interpretacao:` do objeto retornado. Serve tanto para
 * `interpretacao: [` quanto para `interpretacao: interp,` — as duas formas
 * usadas no catálogo. O bloco entra imediatamente antes dela, com a mesma
 * indentação, de modo que `conduta` fica irmã de `interpretacao` dentro do
 * `Resultado` sem tocar em nenhum delimitador existente.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

const arquivoDeEntrada = process.argv[2]
if (!arquivoDeEntrada) {
  console.error('uso: node scripts/inserir-conduta.mjs <arquivo.json>')
  process.exit(1)
}

/** Reproduz o literal de string do TypeScript com aspas simples. */
function aspas(texto) {
  return `'${texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

/**
 * Delimita o trecho de uma ferramenta: do seu `id:` até o `id:` seguinte.
 * O catálogo usa duas formas de declaração (constante nomeada e objeto
 * anônimo dentro de um array), e as duas começam pelo par id/nome.
 */
function trechoDaFerramenta(linhas, id) {
  const inicio = linhas.findIndex((l) => l.trim() === `id: '${id}',`)
  if (inicio === -1) return null
  let fim = linhas.length
  for (let i = inicio + 1; i < linhas.length; i += 1) {
    if (/^\s*id: '[a-z0-9-]+',$/.test(linhas[i])) {
      fim = i
      break
    }
  }
  return { inicio, fim }
}

const plano = JSON.parse(readFileSync(arquivoDeEntrada, 'utf8'))
let inseridas = 0
const recusadas = []

for (const [caminho, porFerramenta] of Object.entries(plano)) {
  const linhas = readFileSync(caminho, 'utf8').split('\n')
  // Da última para a primeira: inserir de trás para frente mantém válidos
  // os índices ainda não usados.
  const ids = Object.keys(porFerramenta)
  const alvos = []

  for (const id of ids) {
    const trecho = trechoDaFerramenta(linhas, id)
    if (!trecho) {
      recusadas.push(`${id}: id não encontrado em ${caminho}`)
      continue
    }
    const corpo = linhas.slice(trecho.inicio, trecho.fim)
    if (corpo.some((l) => /^\s*conduta: \[/.test(l))) {
      recusadas.push(`${id}: já tem conduta`)
      continue
    }
    const ancoras = []
    for (let i = 0; i < corpo.length; i += 1) {
      if (/^\s*interpretacao:/.test(corpo[i])) ancoras.push(i)
    }
    if (ancoras.length !== 1) {
      recusadas.push(`${id}: ${ancoras.length} âncoras 'interpretacao:' — inserção manual`)
      continue
    }
    const linhaAncora = trecho.inicio + ancoras[0]
    const indentacao = linhas[linhaAncora].match(/^\s*/)[0]
    alvos.push({ id, linhaAncora, indentacao })
  }

  alvos.sort((a, b) => b.linhaAncora - a.linhaAncora)
  for (const alvo of alvos) {
    const itens = porFerramenta[alvo.id]
    const bloco = [
      `${alvo.indentacao}conduta: [`,
      ...itens.map((t) => `${alvo.indentacao}  ${aspas(t)},`),
      `${alvo.indentacao}],`,
    ]
    linhas.splice(alvo.linhaAncora, 0, ...bloco)
    inseridas += 1
  }

  if (alvos.length > 0) writeFileSync(caminho, linhas.join('\n'), 'utf8')
}

console.log(`condutas inseridas: ${inseridas}`)
if (recusadas.length > 0) {
  console.log('recusadas (nada foi escrito para estas):')
  for (const r of recusadas) console.log(`  - ${r}`)
}
