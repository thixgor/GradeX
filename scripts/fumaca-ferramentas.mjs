#!/usr/bin/env node
/**
 * Carrega de verdade cada módulo de conteúdo e executa `calcular` de todas as
 * ferramentas com os valores padrão dos campos.
 *
 * Existe porque `auditar-ferramentas.mjs` lê texto e não compila, e o
 * `tsc --noEmit` compila mas não executa. Entre os dois sobrava uma faixa
 * onde moram os erros que mais custaram nesta base: bloco inserido no lugar
 * errado que fechou um objeto antes da hora, chave duplicada, campo que o
 * `calcular` lê e não existe. Aqui cada ferramenta é de fato construída e
 * chamada uma vez — se ela explode, o script falha com o id dela.
 *
 * Uso: node --experimental-strip-types --no-warnings scripts/fumaca-ferramentas.mjs
 *
 * O gancho de resolução abaixo é necessário porque o projeto importa sem
 * extensão (resolução de bundler), que o ESM do Node não aceita sozinho.
 */

import { readdirSync } from 'node:fs'
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'
import process from 'node:process'

const ganchoDeResolucao = `
export async function resolve(especificador, contexto, proximo) {
  try {
    return await proximo(especificador, contexto)
  } catch (erro) {
    if (especificador.startsWith('.') && !/\\.[a-z]+$/.test(especificador)) {
      return proximo(especificador + '.ts', contexto)
    }
    throw erro
  }
}
`
register(`data:text/javascript,${encodeURIComponent(ganchoDeResolucao)}`, import.meta.url)

const dir = 'lib/ferramentas-clinicas/conteudo'
const problemas = []
let total = 0

for (const arquivo of readdirSync(dir).filter((f) => f.endsWith('.ts')).sort()) {
  const mod = await import(pathToFileURL(`${dir}/${arquivo}`).href)
  const lista = Object.values(mod).find((v) => Array.isArray(v) && v[0]?.id && v[0]?.nome)
  if (!lista) {
    problemas.push(`${arquivo}: nenhuma lista de ferramentas exportada`)
    continue
  }
  for (const f of lista) {
    total += 1
    const valores = {}
    for (const campo of f.campos ?? []) {
      if (campo.padrao !== undefined) valores[campo.id] = campo.padrao
    }
    try {
      const r = f.calcular(valores)
      // `null` é resposta legítima: significa "faltam dados obrigatórios".
      if (r !== null && !(r && typeof r === 'object' && ('titulo' in r || 'valor' in r))) {
        problemas.push(`${f.id} (${arquivo}): resultado sem titulo nem valor`)
      }
    } catch (erro) {
      problemas.push(`${f.id} (${arquivo}): ${erro.message}`)
    }
  }
}

if (problemas.length > 0) {
  console.error(`\n${problemas.length} problema(s):\n`)
  for (const p of problemas) console.error(`  - ${p}`)
  console.error('')
  process.exitCode = 1
} else {
  console.log(`ferramentas carregadas e executadas: ${total} | nenhum problema`)
}
