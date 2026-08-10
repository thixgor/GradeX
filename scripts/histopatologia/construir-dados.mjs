/**
 * Pipeline de ingestão da Histopatologia.
 *
 *   node --experimental-strip-types --no-warnings scripts/histopatologia/construir-dados.mjs
 *
 * Lê o catálogo versionado em `public/patologia/catalogo` — 18 fragmentos gzip
 * com 202.593 referências de mídia — e escreve derivados enxutos em
 * `data/histopatologia/`.
 *
 * Cinco decisões que valem explicação:
 *
 * 1. **Nenhuma imagem é tocada.** O script lê JSON comprimido, nunca bytes de
 *    imagem, e não faz uma única requisição de rede. As URLs são copiadas como
 *    texto para os derivados das doenças curadas e descartadas do resto. Se este
 *    arquivo algum dia contiver `fetch`, `http` ou `sharp`, a regra central do
 *    módulo foi quebrada — e há teste que verifica isso.
 *
 * 2. **O catálogo-fonte é imutável.** Abrimos os `.json.gz` em modo leitura e
 *    conferimos o SHA-256 de cada um contra o manifesto antes de descompactar.
 *    Divergência de hash aborta: dado que não confere não vira interface.
 *
 * 3. **O inventário completo não é duplicado.** Gerar `data/` com as 202.593
 *    referências acrescentaria dezenas de megabytes de JSON que já existem,
 *    comprimidos, em `public/patologia`. Os derivados guardam **contadores** por
 *    entrada; a lista de mídias de uma entrada não curada é lida sob demanda
 *    pelo servidor, a partir do próprio catálogo (`lib/histopatologia/acervo.ts`).
 *    Só as doenças do mapa editorial recebem fragmento com URLs.
 *
 * 4. **A allowlist é aplicada aqui.** Vinte URLs do catálogo apontam para selos
 *    de repositório e contadores de visita capturados junto das lâminas. Elas
 *    continuam contabilizadas na conciliação — sumir com elas em silêncio
 *    esconderia divergência — mas ficam fora de tudo que a interface consome.
 *
 * 5. **Determinismo.** Toda coleção é ordenada por chave estável antes de ser
 *    escrita. Rodar duas vezes sobre o mesmo catálogo produz arquivos byte a
 *    byte idênticos; sem isso, cada execução geraria um diff no Git.
 *
 * O script termina imprimindo a conciliação e sai com código 1 diante de
 * qualquer divergência.
 */

import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'

import {
  esquemaDoencaCanonica,
  esquemaEntradaCatalogada,
  esquemaMidiaCatalogada,
  esquemaRelatorio,
  validarPublicacao,
} from '../../lib/histopatologia/esquemas.ts'
import { FONTES, hostPermitido, resolverDireitos } from '../../lib/histopatologia/direitos.ts'
import { chaveDeIndice, pareceTituloDeEntidade, resumir } from '../../lib/histopatologia/texto.ts'
import {
  DOENCAS,
  ENTRADAS_NAO_NOSOLOGICAS,
  VERSAO_DO_MAPA,
} from '../../lib/histopatologia/editorial/index.ts'
import { MECANISMOS } from '../../lib/histopatologia/editorial/mecanismos.ts'
import { SISTEMAS, sistemaIdDoCatalogado } from '../../lib/histopatologia/editorial/sistemas.ts'
import {
  BASE,
  rotaDaDoenca,
  rotaDaEntradaCatalogada,
  rotaDoMecanismo,
  rotaDoSistema,
} from '../../lib/histopatologia/rotas.ts'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const dirCatalogo = path.join(raiz, 'public/patologia/catalogo')
const dirSaida = path.join(raiz, 'data/histopatologia')
const arquivoDeCarregadores = path.join(raiz, 'lib/histopatologia/carregadores.gerado.ts')

/** Divergências acumuladas. Vazio é o único estado que permite sair com 0. */
const divergencias = []
const anotar = (mensagem) => divergencias.push(mensagem)

const lerJson = async (relativo) => JSON.parse(await readFile(path.join(dirCatalogo, relativo), 'utf8'))

async function escrever(destino, dados) {
  await mkdir(path.dirname(destino), { recursive: true })
  const texto = `${JSON.stringify(dados)}\n`
  await writeFile(destino, texto, 'utf8')
  return Buffer.byteLength(texto)
}

/* ══════════════════════ 1. Manifesto e índice ══════════════════════ */

console.log('Lendo manifesto e índice do catálogo…')

const manifesto = await lerJson('manifesto.json')
const fontesDoCatalogo = await lerJson('fontes.json')
const patologiasBrutas = await lerJson('patologias.json')
const falhasDeColeta = await lerJson('falhas-de-coleta.json')

if (!manifesto?.arquivos?.fragmentosDeMidia?.length) {
  throw new Error('Manifesto sem fragmentos de mídia — catálogo inválido.')
}

// As fontes do catálogo precisam existir no registro de direitos. Uma fonte
// catalogada sem escopo de direitos registrado seria mídia sem portão.
for (const fonte of fontesDoCatalogo) {
  if (!FONTES[fonte.id]) anotar(`Fonte catalogada sem registro de direitos: ${fonte.id}`)
}

const patologias = []
for (const bruta of patologiasBrutas) {
  const resultado = esquemaEntradaCatalogada.safeParse(bruta)
  if (!resultado.success) {
    anotar(`Entrada catalogada inválida (${bruta?.id}): ${resultado.error.issues[0]?.message}`)
    continue
  }
  patologias.push(resultado.data)
}

if (patologias.length !== manifesto.totais.patologias) {
  anotar(
    `Patologias: manifesto declara ${manifesto.totais.patologias}, validadas ${patologias.length}.`,
  )
}

const porId = new Map(patologias.map((p) => [p.id, p]))

/* ══════════════════════ 2. Fragmentos: hash e leitura ══════════════════════ */

/** Entradas catalogadas cujas mídias precisam ser retidas na memória. */
const idsCurados = new Set()
for (const doenca of DOENCAS) {
  for (const id of doenca.catalogoIds ?? []) idsCurados.add(id)
}

const acumulado = new Map() // patologiaId → contadores
const midiasCuradas = new Map() // patologiaId → MidiaCatalogada[]
const hostsForaDaAllowlist = {}
const midiasPorFonte = {}
const midiasPorModalidade = {}
let totalMidias = 0
let midiasForaDaAllowlist = 0
let midiasSemDestinoElegivel = 0
let midiasInvalidas = 0

const contadoresDe = (patologiaId) => {
  let atual = acumulado.get(patologiaId)
  if (!atual) {
    atual = {
      total: 0,
      elegiveis: 0,
      modalidades: new Set(),
      coloracoes: new Set(),
      temLaminaVirtual: false,
    }
    acumulado.set(patologiaId, atual)
  }
  return atual
}

for (const parte of manifesto.arquivos.fragmentosDeMidia) {
  const arquivo = path.join(dirCatalogo, parte.arquivo)
  const compactado = await readFile(arquivo)

  const sha256 = createHash('sha256').update(compactado).digest('hex')
  if (sha256 !== parte.sha256) {
    throw new Error(
      `SHA-256 divergente em ${parte.arquivo}: manifesto=${parte.sha256}, arquivo=${sha256}. ` +
        'O catálogo-fonte foi alterado; a ingestão não prossegue.',
    )
  }

  const registros = JSON.parse(gunzipSync(compactado).toString('utf8'))
  if (registros.length !== parte.registros) {
    anotar(`${parte.arquivo}: manifesto declara ${parte.registros} registros, arquivo tem ${registros.length}.`)
  }

  for (const bruta of registros) {
    const resultado = esquemaMidiaCatalogada.safeParse(bruta)
    if (!resultado.success) {
      midiasInvalidas += 1
      anotar(`Mídia inválida (${bruta?.id}): ${resultado.error.issues[0]?.message}`)
      continue
    }
    const midia = resultado.data
    totalMidias += 1
    midiasPorFonte[midia.fonteId] = (midiasPorFonte[midia.fonteId] ?? 0) + 1
    midiasPorModalidade[midia.modalidade] = (midiasPorModalidade[midia.modalidade] ?? 0) + 1

    const entrada = porId.get(midia.patologiaId)
    if (!entrada) {
      anotar(`Mídia ${midia.id} aponta para entrada inexistente: ${midia.patologiaId}`)
      continue
    }
    if (!entrada.fragmentosDeMidia.includes(parte.arquivo)) {
      anotar(`Índice de ${midia.patologiaId} não declara o fragmento ${parte.arquivo}.`)
    }

    // Allowlist: contabiliza o que ficou de fora em vez de apagá-lo em silêncio.
    let elegivel = false
    for (const url of [midia.urlImagem, midia.urlMiniatura, midia.urlVisualizador]) {
      if (!url) continue
      if (hostPermitido(midia.fonteId, url)) {
        elegivel = true
      } else {
        let host = 'url-invalida'
        try {
          host = new URL(url).host
        } catch {
          /* mantém o rótulo de URL inválida */
        }
        hostsForaDaAllowlist[host] = (hostsForaDaAllowlist[host] ?? 0) + 1
        midiasForaDaAllowlist += 1
      }
    }
    if (!elegivel) midiasSemDestinoElegivel += 1

    const contadores = contadoresDe(midia.patologiaId)
    contadores.total += 1
    if (elegivel) contadores.elegiveis += 1
    contadores.modalidades.add(midia.modalidade)
    if (midia.coloracao && midia.coloracao !== 'Não informado') {
      contadores.coloracoes.add(midia.coloracao)
    }
    if (midia.modalidade === 'Lâmina virtual (WSI)') contadores.temLaminaVirtual = true

    if (idsCurados.has(midia.patologiaId) && elegivel) {
      const lista = midiasCuradas.get(midia.patologiaId) ?? []
      lista.push(midia)
      midiasCuradas.set(midia.patologiaId, lista)
    }
  }
}

/* ══════════════════════ 3. Conciliação ══════════════════════ */

if (totalMidias !== manifesto.totais.midias) {
  anotar(`Mídias: manifesto declara ${manifesto.totais.midias}, lidas ${totalMidias}.`)
}
for (const entrada of patologias) {
  const real = acumulado.get(entrada.id)?.total ?? 0
  if (real !== entrada.quantidadeMidias) {
    anotar(`Mídias de ${entrada.id}: índice declara ${entrada.quantidadeMidias}, lidas ${real}.`)
  }
}
const vinculadas = [...acumulado.values()].reduce((n, c) => n + c.total, 0)
if (vinculadas !== totalMidias) {
  anotar(`Vinculação: ${vinculadas} de ${totalMidias} mídias ficaram ligadas a uma entrada.`)
}

/* ══════════════════════ 4. Camada editorial ══════════════════════ */

console.log('Aplicando o mapa editorial de consolidação…')

const doencas = []
const doencaPorCatalogoId = new Map()

for (const bruta of DOENCAS) {
  const resultado = esquemaDoencaCanonica.safeParse(bruta)
  if (!resultado.success) {
    anotar(`Doença editorial inválida (${bruta?.slug}): ${resultado.error.issues[0]?.message}`)
    continue
  }
  const doenca = resultado.data

  // Portão de publicação: estado `publicado` exige o conjunto mínimo do plano.
  const faltas = validarPublicacao(doenca)
  if (faltas.length > 0) {
    anotar(`Doença ${doenca.slug} marcada como publicada sem: ${faltas.join(', ')}.`)
  }

  for (const catalogoId of doenca.catalogoIds) {
    if (!porId.has(catalogoId)) {
      anotar(`Doença ${doenca.slug} referencia entrada inexistente: ${catalogoId}`)
      continue
    }
    const jaUsada = doencaPorCatalogoId.get(catalogoId)
    if (jaUsada) {
      anotar(`Entrada ${catalogoId} consolidada em duas doenças: ${jaUsada} e ${doenca.slug}.`)
      continue
    }
    doencaPorCatalogoId.set(catalogoId, doenca.slug)
  }

  for (const mecanismoId of doenca.mecanismoIds) {
    if (!MECANISMOS.some((m) => m.id === mecanismoId)) {
      anotar(`Doença ${doenca.slug} referencia mecanismo inexistente: ${mecanismoId}`)
    }
  }
  if (!SISTEMAS.some((s) => s.id === doenca.sistemaId)) {
    anotar(`Doença ${doenca.slug} referencia sistema inexistente: ${doenca.sistemaId}`)
  }

  doencas.push(doenca)
}

for (const registro of ENTRADAS_NAO_NOSOLOGICAS) {
  if (!porId.has(registro.catalogoId)) {
    anotar(`Registro de exclusão aponta para entrada inexistente: ${registro.catalogoId}`)
  }
}

const slugsDuplicados = doencas.map((d) => d.slug).filter((s, i, a) => a.indexOf(s) !== i)
if (slugsDuplicados.length > 0) anotar(`Slugs de doença duplicados: ${slugsDuplicados.join(', ')}`)

doencas.sort((a, b) => a.slug.localeCompare(b.slug, 'pt-BR'))

/* ══════════════════════ 5. Inventário por sistema ══════════════════════ */

console.log('Gerando inventário por sistema…')

const resumoDeEntrada = (entrada) => {
  const contadores = acumulado.get(entrada.id) ?? {
    total: 0,
    elegiveis: 0,
    modalidades: new Set(),
    coloracoes: new Set(),
    temLaminaVirtual: false,
  }
  return {
    id: entrada.id,
    fonteId: entrada.fonteId,
    nome: resumir(entrada.nomeCatalogado, 120),
    nomeCompleto: entrada.nomeCatalogado,
    sistemaId: sistemaIdDoCatalogado(entrada.sistemaCatalogado),
    sistemaCatalogado: entrada.sistemaCatalogado,
    midias: contadores.total,
    midiasElegiveis: contadores.elegiveis,
    modalidades: [...contadores.modalidades].sort(),
    coloracoes: [...contadores.coloracoes].sort().slice(0, 12),
    temLaminaVirtual: contadores.temLaminaVirtual,
    ...(doencaPorCatalogoId.has(entrada.id) ? { doencaSlug: doencaPorCatalogoId.get(entrada.id) } : {}),
    tituloConfiavel: pareceTituloDeEntidade(entrada.nomeCatalogado),
    paginasFonte: entrada.paginasFonte.slice(0, 4),
    fragmentosDeMidia: entrada.fragmentosDeMidia,
  }
}

const inventarioPorSistema = new Map()
for (const entrada of patologias) {
  const resumo = resumoDeEntrada(entrada)
  const lista = inventarioPorSistema.get(resumo.sistemaId) ?? []
  lista.push(resumo)
  inventarioPorSistema.set(resumo.sistemaId, lista)
}
for (const lista of inventarioPorSistema.values()) {
  // Ordenação didática: mais mídias primeiro, desempate alfabético estável.
  lista.sort((a, b) => b.midias - a.midias || a.id.localeCompare(b.id))
}

for (const sistemaId of inventarioPorSistema.keys()) {
  if (!SISTEMAS.some((s) => s.id === sistemaId)) {
    anotar(`Inventário aponta para sistema não declarado: ${sistemaId}`)
  }
}

/* ══════════════════════ 6. Fragmentos por doença ══════════════════════ */

console.log('Montando fragmentos por doença…')

let midiasSelecionadas = 0
let midiasBloqueadas = 0
const fragmentos = []

for (const doenca of doencas) {
  const entradas = doenca.catalogoIds
    .map((id) => porId.get(id))
    .filter(Boolean)
    .map(resumoDeEntrada)

  const bloqueadas = new Set(doenca.midiasBloqueadas.map((m) => m.midiaId))
  midiasBloqueadas += bloqueadas.size

  const disponiveis = []
  for (const catalogoId of doenca.catalogoIds) {
    for (const midia of midiasCuradas.get(catalogoId) ?? []) {
      if (bloqueadas.has(midia.id)) continue
      disponiveis.push(midia)
    }
  }

  const ordemEditorial = new Map(doenca.midiasPrincipais.map((m, i) => [m.midiaId, m.ordem || i]))
  for (const selecao of doenca.midiasPrincipais) {
    if (!disponiveis.some((m) => m.id === selecao.midiaId)) {
      anotar(`Doença ${doenca.slug} seleciona mídia inexistente ou inelegível: ${selecao.midiaId}`)
    }
  }
  midiasSelecionadas += doenca.midiasPrincipais.length

  disponiveis.sort((a, b) => {
    const pa = ordemEditorial.has(a.id) ? ordemEditorial.get(a.id) : Number.MAX_SAFE_INTEGER
    const pb = ordemEditorial.has(b.id) ? ordemEditorial.get(b.id) : Number.MAX_SAFE_INTEGER
    return pa - pb || a.id.localeCompare(b.id)
  })

  /*
   * Teto por doença. Sem ele, uma doença que consolidasse uma entrada de 5.000
   * mídias entregaria um fragmento de vários megabytes ao servidor a cada
   * requisição — e a página renderizaria uma galeria que ninguém percorre. O
   * inventário completo continua acessível pela rota de acervo, sob demanda.
   */
  const TETO_POR_DOENCA = 120
  const galeria = disponiveis.slice(0, TETO_POR_DOENCA)

  fragmentos.push({ doenca, entradas, galeria })
}

/* ══════════════════════ 7. Índices e busca ══════════════════════ */

const modalidadesDe = (doenca) => {
  const contagem = {}
  for (const catalogoId of doenca.catalogoIds) {
    const contadores = acumulado.get(catalogoId)
    if (!contadores) continue
    for (const modalidade of contadores.modalidades) {
      contagem[modalidade] = (contagem[modalidade] ?? 0) + 0
    }
  }
  // Contagem real por modalidade só existe nas mídias curadas; para as demais
  // registramos presença. Números inventados seriam piores que presença.
  for (const catalogoId of doenca.catalogoIds) {
    for (const midia of midiasCuradas.get(catalogoId) ?? []) {
      contagem[midia.modalidade] = (contagem[midia.modalidade] ?? 0) + 1
    }
  }
  return contagem
}

const resumosDeDoenca = doencas.map((doenca) => ({
  slug: doenca.slug,
  nome: doenca.nome,
  sistemaId: doenca.sistemaId,
  natureza: doenca.natureza,
  mecanismoIds: doenca.mecanismoIds,
  orgaos: doenca.orgaos,
  estadoDeRevisao: doenca.revisao.estado,
  definicaoCurta: resumir(doenca.conteudo.definicao, 200),
  midias: modalidadesDe(doenca),
  temLaminaVirtual: doenca.catalogoIds.some((id) => acumulado.get(id)?.temLaminaVirtual),
  fontes: [...new Set(doenca.catalogoIds.map((id) => porId.get(id)?.fonteId).filter(Boolean))].sort(),
}))

const semPrefixo = (rota) => rota.slice(BASE.length + 1)

const buscaCliente = []
for (const doenca of doencas) {
  buscaCliente.push({
    t: 'd',
    u: semPrefixo(rotaDaDoenca(doenca.slug)),
    n: doenca.nome,
    b: SISTEMAS.find((s) => s.id === doenca.sistemaId)?.nome ?? doenca.sistemaId,
    k: chaveDeIndice(
      [
        doenca.nome,
        ...doenca.sinonimos,
        ...doenca.sinonimosEmIngles,
        ...doenca.orgaos,
        ...doenca.padroesMorfologicos,
        ...doenca.mecanismoIds,
      ].join(' '),
    ),
    r: doenca.revisao.estado,
  })
}
for (const sistema of SISTEMAS) {
  buscaCliente.push({
    t: 's',
    u: semPrefixo(rotaDoSistema(sistema.id)),
    n: sistema.nome,
    b: 'Sistema',
    k: chaveDeIndice([sistema.nome, ...sistema.sistemasCatalogados].join(' ')),
  })
}
for (const mecanismo of MECANISMOS) {
  buscaCliente.push({
    t: 'm',
    u: semPrefixo(rotaDoMecanismo(mecanismo.id)),
    n: mecanismo.nome,
    b: 'Mecanismo geral',
    k: chaveDeIndice([mecanismo.nome, ...mecanismo.sinonimos, mecanismo.familia].join(' ')),
  })
}
buscaCliente.sort((a, b) => a.u.localeCompare(b.u))

/*
 * O índice de servidor acrescenta as 2.917 entradas catalogadas. Ele não vai ao
 * navegador: é consultado pela rota de API, que devolve apenas os resultados.
 * Nem ele nem o de cliente carregam URL de mídia — a busca nunca é um caminho
 * lateral para contornar o portão de direitos.
 */
const buscaServidor = buscaCliente.slice()
for (const entrada of patologias) {
  buscaServidor.push({
    t: 'c',
    u: semPrefixo(rotaDaEntradaCatalogada(entrada.id)),
    n: resumir(entrada.nomeCatalogado, 120),
    b: entrada.sistemaCatalogado,
    k: chaveDeIndice(`${entrada.nomeCatalogado} ${entrada.descricaoCatalogada ?? ''}`),
  })
}
buscaServidor.sort((a, b) => a.u.localeCompare(b.u))

for (const item of [...buscaCliente, ...buscaServidor]) {
  if (/https?:\/\//i.test(`${item.n}${item.k}${item.b}`)) {
    anotar(`Índice de busca contém URL na entrada ${item.u}.`)
  }
}

const sistemasComContagem = SISTEMAS.map((sistema) => {
  const inventario = inventarioPorSistema.get(sistema.id) ?? []
  return {
    ...sistema,
    entradas: inventario.length,
    midias: inventario.reduce((n, e) => n + e.midias, 0),
    doencas: resumosDeDoenca.filter((d) => d.sistemaId === sistema.id).length,
  }
})

/* ══════════════════════ 8. Escrita ══════════════════════ */

console.log('Escrevendo derivados…')

// Limpeza dos derivados antigos: sem isso, um fragmento de doença removida do
// mapa editorial ficaria órfão em `data/` e continuaria sendo servido.
try {
  await rm(path.join(dirSaida, 'doencas'), { recursive: true, force: true })
  await rm(path.join(dirSaida, 'inventario'), { recursive: true, force: true })
} catch {
  /* primeira execução: nada a limpar */
}

let bytes = 0
let arquivos = 0
const escreverContando = async (destino, dados) => {
  bytes += await escrever(destino, dados)
  arquivos += 1
}

await escreverContando(path.join(dirSaida, 'sistemas.json'), sistemasComContagem)
await escreverContando(path.join(dirSaida, 'mecanismos.json'), MECANISMOS)
await escreverContando(path.join(dirSaida, 'doencas.json'), resumosDeDoenca)
await escreverContando(
  path.join(dirSaida, 'fontes.json'),
  fontesDoCatalogo.map((fonte) => ({
    ...fonte,
    dominiosDeMidia: FONTES[fonte.id]?.dominiosDeMidia ?? [],
    estadoDeDireitos: resolverDireitos({
      fonteId: fonte.id,
      midiaId: '—',
      urlPaginaFonte: fonte.url,
    }).estado,
  })),
)
const bytesDoIndiceDeCliente = await escrever(path.join(dirSaida, 'busca-cliente.json'), buscaCliente)
bytes += bytesDoIndiceDeCliente
arquivos += 1
await escreverContando(path.join(dirSaida, 'busca-servidor.json'), buscaServidor)

for (const [sistemaId, lista] of [...inventarioPorSistema.entries()].sort()) {
  await escreverContando(path.join(dirSaida, 'inventario', `${sistemaId}.json`), lista)
}
for (const fragmento of fragmentos) {
  await escreverContando(path.join(dirSaida, 'doencas', `${fragmento.doenca.slug}.json`), fragmento)
}

/* ── mapa literal de carregadores ── */

const linhasDeDoenca = fragmentos
  .map((f) => `  "${f.doenca.slug}": () => import('@/data/histopatologia/doencas/${f.doenca.slug}.json'),`)
  .join('\n')
const linhasDeInventario = [...inventarioPorSistema.keys()]
  .sort()
  .map((id) => `  "${id}": () => import('@/data/histopatologia/inventario/${id}.json'),`)
  .join('\n')

await writeFile(
  arquivoDeCarregadores,
  `/* eslint-disable */
// ARQUIVO GERADO — não edite à mão.
// Origem: scripts/histopatologia/construir-dados.mjs
//
// Mapa literal de \`import()\` por doença e por sistema. É literal porque o
// rastreamento de arquivos da Vercel precisa enxergar cada especificador para
// incluir o JSON no bundle da função; um \`import()\` com caminho montado em
// variável funciona em desenvolvimento e devolve 404 em produção.
//
// Os carregadores são tipados como \`unknown\`: o TypeScript infere dos JSON
// tipos literais (\`estado: string\` em vez da união fechada, por exemplo) e
// afirmar a forma aqui só produziria um \`as\` por linha. A garantia real vem de
// \`__tests__/histopatologia/dados.test.ts\`, que valida cada arquivo contra o
// schema Zod — verificação de valor, não de sintaxe.
type Carregador = () => Promise<{ default: unknown }>

export const FRAGMENTOS_DE_DOENCA: Record<string, Carregador> = {
${linhasDeDoenca}
}

export const INVENTARIO_POR_SISTEMA: Record<string, Carregador> = {
${linhasDeInventario}
}
`,
  'utf8',
)
arquivos += 1

/* ══════════════════════ 9. Relatório ══════════════════════ */

const relatorio = esquemaRelatorio.parse({
  geradoEm: new Date().toISOString().slice(0, 10),
  versaoDoMapaEditorial: VERSAO_DO_MAPA,
  catalogo: {
    patologias: patologias.length,
    midias: totalMidias,
    fragmentos: manifesto.arquivos.fragmentosDeMidia.length,
    falhasDeColeta: Array.isArray(falhasDeColeta) ? falhasDeColeta.length : 0,
  },
  conciliacao: {
    midiasVinculadas: vinculadas,
    midiasPorFonte,
    midiasPorModalidade,
    midiasForaDaAllowlist,
    hostsForaDaAllowlist,
    midiasSemDestinoElegivel,
  },
  editorial: {
    doencas: doencas.length,
    doencasPublicadas: doencas.filter((d) => d.revisao.estado === 'publicado').length,
    doencasEmRevisao: doencas.filter((d) => d.revisao.estado === 'revisao-medica').length,
    entradasConsolidadas: doencaPorCatalogoId.size,
    entradasNaoConsolidadas: patologias.length - doencaPorCatalogoId.size,
    midiasSelecionadas,
    midiasBloqueadas,
  },
  derivados: { arquivos, bytes, bytesDoIndiceDeCliente },
  divergencias,
})

bytes += await escrever(path.join(dirSaida, 'relatorio.json'), relatorio)

/*
 * Guarda de regressão de tamanho. O índice de cliente é baixado inteiro pelo
 * navegador na primeira interação com a busca; se ele começar a crescer — por
 * alguém indexar descrições completas, por exemplo — o custo recai sobre todo
 * aluno que abre a home. 256 KB é folgado para 6 doenças, 14 sistemas e 14
 * mecanismos, e apertado o bastante para acusar a inclusão acidental do
 * inventário.
 */
const TETO_DO_INDICE_DE_CLIENTE = 256 * 1024
if (bytesDoIndiceDeCliente > TETO_DO_INDICE_DE_CLIENTE) {
  anotar(
    `Índice de cliente com ${bytesDoIndiceDeCliente} bytes, acima do teto de ${TETO_DO_INDICE_DE_CLIENTE}.`,
  )
}

/* ══════════════════════ 10. Conciliação impressa ══════════════════════ */

const nf = (n) => n.toLocaleString('pt-BR')
console.log('')
console.log('── Conciliação do catálogo ─────────────────────────────')
console.log(`  entradas catalogadas ....... ${nf(patologias.length)}`)
console.log(`  referências de mídia ....... ${nf(totalMidias)}`)
console.log(`  vinculadas a uma entrada ... ${nf(vinculadas)}`)
console.log(`  fragmentos verificados ..... ${manifesto.arquivos.fragmentosDeMidia.length} (SHA-256 conferido)`)
console.log(`  falhas de coleta ........... ${nf(relatorio.catalogo.falhasDeColeta)}`)
console.log('── Allowlist ───────────────────────────────────────────')
console.log(`  URLs fora da allowlist ..... ${nf(midiasForaDaAllowlist)}`)
console.log(`  mídias sem destino elegível  ${nf(midiasSemDestinoElegivel)}`)
for (const [host, n] of Object.entries(hostsForaDaAllowlist).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${host} — ${nf(n)}`)
}
console.log('── Camada editorial ────────────────────────────────────')
console.log(`  doenças canônicas .......... ${doencas.length}`)
console.log(`  em revisão médica .......... ${relatorio.editorial.doencasEmRevisao}`)
console.log(`  publicadas ................. ${relatorio.editorial.doencasPublicadas}`)
console.log(`  entradas consolidadas ...... ${nf(doencaPorCatalogoId.size)}`)
console.log(`  entradas ainda sem curadoria ${nf(relatorio.editorial.entradasNaoConsolidadas)}`)
console.log('── Derivados ───────────────────────────────────────────')
console.log(`  arquivos ................... ${arquivos}`)
console.log(`  bytes ...................... ${nf(bytes)}`)
console.log(`  índice de cliente .......... ${nf(bytesDoIndiceDeCliente)} bytes`)
console.log('')

if (midiasInvalidas > 0) console.log(`  mídias rejeitadas pelo schema: ${nf(midiasInvalidas)}`)

if (divergencias.length > 0) {
  console.error(`Conciliação falhou com ${divergencias.length} divergência(s):`)
  for (const d of divergencias.slice(0, 40)) console.error(`  • ${d}`)
  if (divergencias.length > 40) console.error(`  … e mais ${divergencias.length - 40}.`)
  process.exit(1)
}

// Sanidade final: nenhum arquivo de imagem pode ter aparecido em `data/`.
const arquivosGerados = await readdir(dirSaida, { recursive: true })
const suspeitos = arquivosGerados.filter((f) => /\.(jpe?g|png|gif|webp|avif|tiff?|svs|ndpi)$/i.test(f))
if (suspeitos.length > 0) {
  console.error(`Arquivos de imagem encontrados em data/histopatologia: ${suspeitos.join(', ')}`)
  process.exit(1)
}

console.log('Conciliação fechada. Nenhuma imagem foi baixada, copiada ou armazenada.')
