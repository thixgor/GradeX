#!/usr/bin/env node
/**
 * Auditoria de qualidade do catálogo de Ferramentas Clínicas.
 *
 * O catálogo promete, em cada ferramenta, quatro coisas além da conta: para que
 * serve, o que fazer com o resultado, por que a conta funciona (fisiologia e
 * fisiopatologia) e o que faz o número mentir. Este script mede se a promessa
 * está cumprida, ferramenta por ferramenta, e aponta exatamente o que falta.
 *
 * A leitura é estática — recorta o texto de cada objeto `Ferramenta` e conta o
 * que há dentro. Isso é deliberado: importar os módulos exigiria transpilar TS e
 * executar `calcular` com valores inventados, e o que se quer medir aqui é a
 * densidade do conteúdo escrito, que é estática por natureza.
 *
 * Uso:
 *   node scripts/auditar-ferramentas.mjs            relatório completo
 *   node scripts/auditar-ferramentas.mjs --check    sai 1 se houver reprovação
 *   node scripts/auditar-ferramentas.mjs --json     saída legível por máquina
 *   node scripts/auditar-ferramentas.mjs --falhas   só as reprovadas
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIR_CONTEUDO = path.join(__dirname, '..', 'lib', 'ferramentas-clinicas', 'conteudo')

const args = process.argv.slice(2)
const modoCheck = args.includes('--check')
const modoJson = args.includes('--json')
const soFalhas = args.includes('--falhas')

/* ─────────────────────── Critérios de qualidade ─────────────────────── */

/**
 * Cada critério vale pontos e tem um mínimo. Os pesos refletem o que o usuário
 * de uma ferramenta clínica precisa, em ordem: saber o que fazer com o número
 * pesa mais do que ter uma tabela bonita.
 */
const CRITERIOS = [
  {
    id: 'resumo',
    rotulo: 'Resumo (para que serve, uma frase)',
    peso: 5,
    minimo: 40,
    medir: (f) => tamanhoDeString(f, 'resumo'),
    unidade: 'caracteres',
  },
  {
    id: 'fundamento',
    rotulo: 'Fundamento (fisiologia, fisiopatologia, origem)',
    peso: 25,
    minimo: 400,
    medir: (f) => tamanhoDeString(f, 'fundamento'),
    unidade: 'caracteres',
  },
  {
    id: 'interpretacao',
    rotulo: 'Interpretação (leitura clínica do resultado)',
    peso: 20,
    minimo: 300,
    medir: (f) => tamanhoDeCampoDeTexto(f, 'interpretacao'),
    unidade: 'caracteres',
  },
  {
    id: 'conduta',
    rotulo: 'Conduta (o que fazer com o resultado)',
    peso: 20,
    minimo: 150,
    medir: (f) => tamanhoDeCampoDeTexto(f, 'conduta'),
    unidade: 'caracteres',
  },
  {
    id: 'armadilhas',
    rotulo: 'Armadilhas (o que faz o número mentir)',
    peso: 12,
    minimo: 2,
    medir: (f) => contarItensDeLista(f, 'armadilhas'),
    unidade: 'itens',
  },
  {
    id: 'alertas',
    rotulo: 'Alertas (limites de validade e risco)',
    peso: 6,
    minimo: 1,
    medir: (f) => contarOcorrencias(f, /alertas:/g),
    unidade: 'ocorrências',
  },
  {
    id: 'referencias',
    rotulo: 'Referências (fonte primária)',
    peso: 8,
    minimo: 2,
    medir: (f) => contarItensDeLista(f, 'referencias'),
    unidade: 'itens',
  },
  {
    id: 'ajudaCampos',
    rotulo: 'Ajuda nos campos (de onde tirar o dado)',
    peso: 4,
    minimo: 120,
    medir: (f) => tamanhoDaAjudaDosCampos(f),
    unidade: 'caracteres',
  },
]

const NOTA_MINIMA = 70

/* ──────────────────────────── Recorte do texto ──────────────────────────── */

/**
 * Divide o arquivo nos blocos de cada ferramenta.
 *
 * Há dois padrões de declaração no catálogo: `const <nome>: Ferramenta = {`
 * (a maioria) e objetos anônimos dentro de `export const ferramentas:
 * Ferramenta[] = [` (é como `gasometria.ts` declara suas 18). Ancorar no par
 * `id: '...'` seguido de `nome:` — a cabeça canônica de toda ferramenta —
 * pega os dois e não depende de contar chaves, que quebraria com as funções
 * `calcular` embutidas.
 */
function recortarFerramentas(texto, arquivo) {
  const marcas = [...texto.matchAll(/\bid:\s*'([a-z0-9-]+)',\s*\n\s*nome:\s*'((?:[^'\\]|\\.)*)'/g)]
  const blocos = []
  for (let i = 0; i < marcas.length; i++) {
    const inicio = marcas[i].index
    const fim = i + 1 < marcas.length ? marcas[i + 1].index : texto.length
    const corpo = texto.slice(inicio, fim)
    blocos.push({
      id: marcas[i][1],
      nome: marcas[i][2].replace(/\\'/g, "'"),
      arquivo: path.basename(arquivo, '.ts'),
      // Uma ferramenta pode delegar `campos` e `calcular` a definições
      // compartilhadas fora do próprio objeto — é o caso do interpretador de
      // gasometria e do DASI. O texto que o usuário lê está lá, e medir só o
      // bloco literal reprovaria a ferramenta por onde o código mora, não por
      // falta de conteúdo.
      corpo: corpo + textoDasReferencias(corpo, texto),
    })
  }
  return blocos
}

/**
 * Texto das definições que a ferramenta referencia por identificador.
 *
 * Procura `campos: <ident>` e `calcular: <ident>` no corpo e devolve o texto
 * da declaração correspondente (`const <ident>` ou `function <ident>`), para
 * que a medição alcance a ajuda dos campos e a interpretação que vivem lá.
 */
function textoDasReferencias(corpo, textoDoArquivo) {
  const idents = new Set()
  // `campos: interpretadorCampos` / `calcular: interpretarGasometria`
  for (const m of corpo.matchAll(/\b(?:campos|calcular):\s*([A-Za-z_][A-Za-z0-9_]*)\s*,/g)) idents.add(m[1])
  // `campos: [CAMPO_PH, CAMPO_PACO2, ...]` — constantes de campo compartilhadas,
  // que carregam a própria `ajuda` e são reusadas por várias ferramentas.
  const arr = corpo.match(/\bcampos:\s*\[([\s\S]*?)\]/)
  if (arr) for (const m of arr[1].matchAll(/(?:^|[,[\s])([A-Z][A-Z0-9_]{2,})(?=[,\]\s])/g)) idents.add(m[1])

  let extra = ''
  for (const ident of idents) {
    const decl = new RegExp(`(?:^|\\n)(?:export\\s+)?(?:const|function)\\s+${ident}\\b`)
    const achou = textoDoArquivo.match(decl)
    if (!achou) continue
    // Até a próxima declaração de topo, que é onde a definição termina.
    const resto = textoDoArquivo.slice(achou.index + 1)
    const proxima = resto.search(/\n(?:export\s+)?(?:const|function)\s+[A-Za-z_]/)
    extra += '\n' + (proxima === -1 ? resto : resto.slice(0, proxima))
  }
  return extra
}

/**
 * Texto de ajuda dos campos, somando as três formas em que ele aparece.
 *
 * `campoNum`, `campoSeg` e `campoOpc` recebem a ajuda em objeto de opções
 * (`{ ajuda: '...' }`) e as alternativas de escore usam `descricao:`, mas
 * `campoSimNao(id, rotulo, pontos, ajuda)` a passa no quarto argumento
 * posicional — medir só pelas chaves subestimava o catálogo em dois terços.
 */
function tamanhoDaAjudaDosCampos(f) {
  let total = 0
  for (const m of f.corpo.matchAll(/\b(?:ajuda|descricao):\s*'((?:[^'\\]|\\.)*)'/g)) total += m[1].length
  const posicional = /campoSimNao\(\s*'[^']*',\s*'(?:[^'\\]|\\.)*',\s*-?[\d.]+\s*,\s*'((?:[^'\\]|\\.)*)'/g
  for (const m of f.corpo.matchAll(posicional)) total += m[1].length
  return total
}

/** Soma o tamanho de uma propriedade string, aceitando concatenação em linhas. */
function tamanhoDeString(f, prop) {
  const re = new RegExp(`\\b${prop}:\\s*\\n?\\s*((?:'(?:[^'\\\\]|\\\\.)*'\\s*\\+?\\s*\\n?\\s*)+)`, 'g')
  let total = 0
  for (const m of f.corpo.matchAll(re)) total += somarLiterais(m[1])
  return total
}

/**
 * Soma o tamanho de todos os literais de texto de uma propriedade-lista.
 *
 * Duas formas contam. A direta, `interpretacao: [ ... ]`, e a construída em
 * etapas, `const interpretacao: string[] = []` seguida de `interpretacao.push(...)`
 * — que é como o interpretador de gasometria monta a leitura dos quatro passos.
 * Medir só a primeira reprovaria a ferramenta pelo estilo do código.
 */
function tamanhoDeCampoDeTexto(f, prop) {
  let total = 0
  for (const m of f.corpo.matchAll(new RegExp(`\\b${prop}:\\s*(\\[|[a-zA-Z])`, 'g'))) {
    const trecho = f.corpo.slice(m.index, m.index + 4000)
    total += somarLiterais(trecho.slice(0, delimitarLista(trecho)))
  }
  for (const m of f.corpo.matchAll(new RegExp(`\\b${prop}\\.push\\(`, 'g'))) {
    const trecho = f.corpo.slice(m.index, m.index + 3000)
    total += somarLiterais(trecho.slice(0, delimitarChamada(trecho)))
  }
  return total
}

/** Encontra o fim de uma chamada a partir do `(` — equilibra parênteses. */
function delimitarChamada(trecho) {
  const abre = trecho.indexOf('(')
  if (abre === -1) return Math.min(trecho.length, 600)
  let nivel = 0
  let dentroDeTexto = null
  for (let i = abre; i < trecho.length; i++) {
    const c = trecho[i]
    if (dentroDeTexto) {
      if (c === '\\') i++
      else if (c === dentroDeTexto) dentroDeTexto = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') dentroDeTexto = c
    else if (c === '(') nivel++
    else if (c === ')') {
      nivel--
      if (nivel === 0) return i + 1
    }
  }
  return trecho.length
}

/** Conta itens de uma lista de literais/objetos. */
function contarItensDeLista(f, prop) {
  const m = f.corpo.match(new RegExp(`\\b${prop}:\\s*\\[`))
  if (!m) return 0
  const trecho = f.corpo.slice(m.index)
  const lista = trecho.slice(0, delimitarLista(trecho))
  // Itens de `armadilhas` são strings; de `referencias`, objetos com `texto:`.
  const objetos = [...lista.matchAll(/\{\s*texto:/g)].length
  if (objetos > 0) return objetos
  return [...lista.matchAll(/(?:^|[[,]\s*\n?\s*)(?:'|")/g)].length
}

function contarOcorrencias(f, re) {
  return [...f.corpo.matchAll(re)].length
}

/** Encontra o fim de uma lista a partir do `[` — equilibra colchetes. */
function delimitarLista(trecho) {
  const abre = trecho.indexOf('[')
  if (abre === -1) return Math.min(trecho.length, 600)
  let nivel = 0
  let dentroDeTexto = null
  for (let i = abre; i < trecho.length; i++) {
    const c = trecho[i]
    if (dentroDeTexto) {
      if (c === '\\') i++
      else if (c === dentroDeTexto) dentroDeTexto = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') dentroDeTexto = c
    else if (c === '[') nivel++
    else if (c === ']') {
      nivel--
      if (nivel === 0) return i + 1
    }
  }
  return trecho.length
}

/** Soma o comprimento dos literais de texto de um trecho, ignorando código. */
function somarLiterais(trecho) {
  let total = 0
  for (const m of trecho.matchAll(/'((?:[^'\\]|\\.)*)'/g)) total += m[1].length
  for (const m of trecho.matchAll(/`((?:[^`\\]|\\.)*)`/g)) total += m[1].length
  return total
}

/* ──────────────────────────── Avaliação ──────────────────────────── */

function avaliar(f) {
  const itens = CRITERIOS.map((c) => {
    const medido = c.medir(f)
    // Crédito proporcional até o mínimo, para distinguir "vazio" de "curto".
    const razao = c.minimo === 0 ? 1 : Math.min(1, medido / c.minimo)
    return {
      id: c.id,
      rotulo: c.rotulo,
      medido,
      minimo: c.minimo,
      unidade: c.unidade,
      peso: c.peso,
      pontos: Math.round(razao * c.peso * 10) / 10,
      ok: medido >= c.minimo,
    }
  })
  const nota = Math.round(itens.reduce((t, i) => t + i.pontos, 0))
  return { ...f, corpo: undefined, itens, nota, aprovada: nota >= NOTA_MINIMA }
}

/**
 * Conferência estrutural: as chaves de cada arquivo precisam fechar.
 *
 * A auditoria lê texto e não compila, então um arquivo sintaticamente quebrado
 * passaria com nota alta — já aconteceu duas vezes ao editar `conduta` no meio
 * de um `return`, comendo o fechamento do `Resultado` e do `calcular`. Esta
 * checagem é barata e falha alto, antes de qualquer nota ser exibida.
 */
function conferirChaves(texto, arquivo) {
  let nivel = 0
  let dentroDeTexto = null
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (dentroDeTexto) {
      if (c === '\\') i++
      else if (c === dentroDeTexto) dentroDeTexto = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') dentroDeTexto = c
    else if (c === '{') nivel++
    else if (c === '}') nivel--
  }
  if (nivel !== 0) {
    console.error(
      `\x1b[31mERRO ESTRUTURAL\x1b[0m em ${arquivo}: saldo de chaves ${nivel > 0 ? '+' : ''}${nivel}.\n` +
        'O arquivo não fecha. Rode `npx tsc --noEmit` para localizar — a auditoria mede conteúdo, não sintaxe.',
    )
    return false
  }
  return true
}

const ferramentas = []
let estruturaOk = true
for (const arquivo of fs.readdirSync(DIR_CONTEUDO).filter((a) => a.endsWith('.ts')).sort()) {
  const texto = fs.readFileSync(path.join(DIR_CONTEUDO, arquivo), 'utf8')
  if (!conferirChaves(texto, arquivo)) estruturaOk = false
  for (const f of recortarFerramentas(texto, arquivo)) ferramentas.push(avaliar(f))
}
if (!estruturaOk) process.exitCode = 1

/* ──────────────────────────── Relatório ──────────────────────────── */

if (modoJson) {
  // `process.exit` trunca escrita pendente em pipe; `exitCode` deixa o Node
  // esvaziar o stdout antes de sair, o que importa porque o JSON completo
  // passa de 60 KB.
  console.log(JSON.stringify({ total: ferramentas.length, notaMinima: NOTA_MINIMA, ferramentas }, null, 2))
  if (modoCheck && ferramentas.some((f) => !f.aprovada)) process.exitCode = 1
} else {

const reprovadas = ferramentas.filter((f) => !f.aprovada)
const media = ferramentas.reduce((t, f) => t + f.nota, 0) / (ferramentas.length || 1)

console.log(`\n\x1b[1mAuditoria de qualidade — Ferramentas Clínicas\x1b[0m`)
console.log(`${ferramentas.length} ferramentas · nota média ${media.toFixed(1)}/100 · mínimo ${NOTA_MINIMA}`)
console.log(`\x1b[32m${ferramentas.length - reprovadas.length} aprovadas\x1b[0m · \x1b[31m${reprovadas.length} reprovadas\x1b[0m\n`)

// Lacunas agregadas: qual critério falha mais vezes no catálogo inteiro.
console.log('\x1b[1mLacunas por critério\x1b[0m')
for (const c of CRITERIOS) {
  const faltando = ferramentas.filter((f) => !f.itens.find((i) => i.id === c.id).ok)
  const pct = ((faltando.length / ferramentas.length) * 100).toFixed(0)
  const barra = '█'.repeat(Math.round(faltando.length / Math.max(1, ferramentas.length / 40)))
  const cor = faltando.length === 0 ? '\x1b[32m' : faltando.length > ferramentas.length / 2 ? '\x1b[31m' : '\x1b[33m'
  console.log(`  ${cor}${String(faltando.length).padStart(4)}\x1b[0m (${pct.padStart(3)}%) ${c.rotulo.padEnd(48)} ${cor}${barra}\x1b[0m`)
}

const porArquivo = new Map()
for (const f of ferramentas) {
  const a = porArquivo.get(f.arquivo) ?? []
  a.push(f)
  porArquivo.set(f.arquivo, a)
}

console.log('\n\x1b[1mPor categoria\x1b[0m')
for (const [arquivo, lista] of [...porArquivo].sort()) {
  const m = lista.reduce((t, f) => t + f.nota, 0) / lista.length
  const ruins = lista.filter((f) => !f.aprovada).length
  const cor = ruins === 0 ? '\x1b[32m' : ruins > lista.length / 2 ? '\x1b[31m' : '\x1b[33m'
  console.log(`  ${arquivo.padEnd(22)} ${String(lista.length).padStart(3)} ferramentas · média ${m.toFixed(0).padStart(3)} · ${cor}${ruins} reprovadas\x1b[0m`)
}

const mostrar = soFalhas ? reprovadas : ferramentas
if (mostrar.length) {
  console.log(`\n\x1b[1m${soFalhas ? 'Reprovadas' : 'Detalhe'} (${mostrar.length})\x1b[0m`)
  for (const f of [...mostrar].sort((a, b) => a.nota - b.nota)) {
    const cor = f.aprovada ? '\x1b[32m' : '\x1b[31m'
    console.log(`\n  ${cor}${String(f.nota).padStart(3)}\x1b[0m  ${f.nome}  \x1b[2m(${f.arquivo} · ${f.id})\x1b[0m`)
    for (const i of f.itens.filter((x) => !x.ok)) {
      console.log(`        \x1b[31mfalta\x1b[0m ${i.rotulo}: ${i.medido}/${i.minimo} ${i.unidade}`)
    }
  }
}

console.log('')
if (modoCheck && reprovadas.length) process.exitCode = 1
}
