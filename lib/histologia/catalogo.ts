import 'server-only'

import capasBrutas from '@/data/histologia/capas.json'
import { MODULOS_DE_LABORATORIO } from '@/lib/histologia/laboratorio'
import { CURRICULO, RESUMO_DE_QUIZZES, RESUMO_DE_QUIZZES_PROPRIOS } from '@/lib/histologia/repositorio'
import { LARGURA_PREVIA, urlDaMidia, urlOtimizada } from '@/lib/histologia/midia'
import { BASE as BASE_HISTOLOGIA, rotaDaPagina } from '@/lib/histologia/rotas'
import { LAMINAS as LAMINAS_ZOOM, laminasDoSistema, resumir } from '@/lib/histologia-zoom/repositorio'
import { BASE_ZOOM, rotaDaLaminaZoom } from '@/lib/histologia-zoom/rotas'
import { SISTEMAS, type Sistema } from '@/lib/histologia-zoom/sistemas'
import type { SistemaId } from '@/lib/histologia-zoom/tipos'
import { DOENCAS_RESUMIDAS, SISTEMAS_COM_CONTAGEM } from '@/lib/histopatologia/repositorio'
import { rotaDaDoenca } from '@/lib/histopatologia/rotas'
import {
  LAMINAS_PATOLOGICAS,
  doencasPublicadas,
  laminasDaDoenca,
  resumirPatologica,
} from '@/lib/histopatologia-zoom/repositorio'
import { rotaDaDoencaZoom, rotaDaLaminaPatologica } from '@/lib/histopatologia-zoom/rotas'
import type { DoencaZoom } from '@/lib/histopatologia-zoom/tipos'

import type { ItemDoCatalogo } from './catalogo-tipos'

/**
 * Catálogo do Manual da Histologia — a camada que transforma os quatro acervos
 * do módulo em **um** catálogo navegável.
 *
 * ## O problema que esta camada resolve
 *
 * O módulo tem quatro fontes de lâmina, cada uma com a sua rota e o seu jeito
 * de organizar: o atlas por assunto (fotomicrografias com estruturas
 * marcadas), a Histologia com Zoom (lâminas inteiras), os capítulos da
 * Histopatologia (texto + atlas visual) e a Histopatologia com Zoom (lâminas
 * de doença). A navegação antiga expunha as quatro como abas irmãs — o aluno
 * tinha de escolher entre "Histopatologia", "Zoom" e "Patologia com Zoom" sem
 * saber o que cada uma tinha.
 *
 * Aqui elas viram dois eixos independentes:
 *
 * - **área** — Histologia (tecido normal) ou Histopatologia (doença);
 * - **modalidade** — a lâmina tem ou não zoom interativo. É um selo no cartão,
 *   nunca uma categoria concorrente.
 *
 * E a mesma doença deixa de aparecer duas vezes: capítulo escrito e lâminas
 * com zoom são **uma** entrada (`doencasDoCatalogo`).
 *
 * Tudo aqui é derivado de dados reais e estáticos do bundle; nada é inventado
 * para preencher fileira.
 */

export type { AreaDoCatalogo, ItemDoCatalogo } from './catalogo-tipos'

/* ────────────────────────── Histologia: atlas por assunto ────────────────────────── */

type Capa = { sha256: string; ext: string; urlOrigem: string }
const CAPAS = capasBrutas as Record<string, Capa>

/** Capa de um assunto numa largura maior — para banners, não para cartões. */
export function imagemDoAssunto(caminho: string, largura: number): string | null {
  const capa = CAPAS[caminho]
  return capa ? urlOtimizada(urlDaMidia(capa), largura, 70) : null
}

/** Os quatro setores do currículo, cada um com seus assuntos como cartões. */
export function assuntosPorSetor(): Array<{ slug: string; titulo: string; caminho: string[]; itens: ItemDoCatalogo[] }> {
  return CURRICULO.map((setor) => ({
    slug: setor.slug,
    titulo: setor.titulo,
    caminho: setor.caminho,
    itens: setor.filhos
      .filter((assunto) => assunto.laminas > 0)
      .map((assunto) => {
        const capa = CAPAS[assunto.caminho.join('/')]
        return {
          id: assunto.caminho.join('/'),
          href: rotaDaPagina(assunto.caminho),
          titulo: assunto.titulo,
          categoria: `Histologia · ${setor.titulo}`,
          area: 'histologia' as const,
          imagem: capa ? urlOtimizada(urlDaMidia(capa), LARGURA_PREVIA, 60) : null,
          zoom: false,
          detalhe: `${assunto.laminas} ${assunto.laminas === 1 ? 'lâmina' : 'lâminas'} · ${assunto.estruturas} estruturas marcadas`,
          icone: 'Layers',
        }
      }),
  }))
}

/* ────────────────────────── Histologia: lâminas com zoom ────────────────────────── */

const NOME_DO_SISTEMA = new Map(SISTEMAS.map((s) => [s.id, s]))

function itemDeLaminaNormal(l: (typeof LAMINAS_ZOOM)[number]): ItemDoCatalogo {
  const r = resumir(l)
  return {
    id: `zoom:${l.slug}`,
    href: rotaDaLaminaZoom(l.sistema, l.slug),
    titulo: l.subtitulo ? `${l.titulo} — ${l.subtitulo}` : l.titulo,
    categoria: `Histologia · ${NOME_DO_SISTEMA.get(l.sistema)?.nome ?? 'Lâmina'}`,
    area: 'histologia',
    imagem: r.miniatura,
    mosaico: r.mosaico,
    zoom: true,
    detalhe: `${l.coloracao} · até ${l.ampliacaoMaxima}×`,
  }
}

/** Lâminas de vitrine: uma de cada grande grupo, escolhidas pela beleza do scan. */
const DESTAQUES_NORMAIS = [
  'medula-espinal-tionina',
  'rim-he',
  'traqueia-pas',
  'figado-he-2',
  'epiglote-orceina',
  'testiculo-he',
  'pulmao-he',
]

export function destaquesNormaisComZoom(): ItemDoCatalogo[] {
  return DESTAQUES_NORMAIS.map((slug) => LAMINAS_ZOOM.find((l) => l.slug === slug))
    .filter((l): l is (typeof LAMINAS_ZOOM)[number] => Boolean(l))
    .map(itemDeLaminaNormal)
}

export function laminasNormaisDoSistema(sistema: SistemaId): ItemDoCatalogo[] {
  return laminasDoSistema(sistema).map(itemDeLaminaNormal)
}

export function laminaNormalEmDestaque(slug: string) {
  return LAMINAS_ZOOM.find((l) => l.slug === slug) ?? null
}

/* ────────────────────────── Histopatologia: uma doença, uma entrada ────────────────────────── */

/**
 * Capítulo escrito de uma doença com lâmina de zoom.
 *
 * `doencaDoManual` é o vínculo declarado; na falta dele vale o mesmo slug, e
 * os três apelidos abaixo cobrem as doenças cujo capítulo tem nome mais
 * específico. Tuberculose fica de fora de propósito: a lâmina de zoom é de
 * linfonodo, o capítulo é pulmonar — juntar as duas ensinaria errado.
 */
const APELIDOS_DO_CAPITULO: Record<string, string> = {
  melanoma: 'melanoma-cutaneo',
  meningioma: 'meningioma-grau-1',
  'hiperplasia-prostatica-benigna': 'hiperplasia-nodular-da-prostata',
}

const CAPITULOS = new Map(DOENCAS_RESUMIDAS.map((d) => [d.slug, d]))

export function capituloDaDoencaZoom(d: Pick<DoencaZoom, 'id' | 'doencaDoManual'>): string | null {
  const slug = d.doencaDoManual ?? APELIDOS_DO_CAPITULO[d.id] ?? d.id
  return CAPITULOS.has(slug) ? slug : null
}

/** A doença de zoom que corresponde a um capítulo — o caminho inverso. */
export function doencaZoomDoCapitulo(slugDoCapitulo: string): DoencaZoom | null {
  return doencasPublicadas().find((d) => capituloDaDoencaZoom(d) === slugDoCapitulo) ?? null
}

/**
 * Sistema da Histopatologia (taxonomia do atlas de patologia) → sistemas da
 * Histologia com Zoom. As duas taxonomias nasceram separadas; esta tabela é o
 * que permite uma página de sistema mostrar o normal e o patológico juntos.
 */
const PATOLOGIA_PARA_ZOOM: Record<string, SistemaId[]> = {
  cardiovascular: ['cardiovascular'],
  respiratorio: ['respiratorio', 'cavidade-oral'],
  gastrointestinal: ['digestorio'],
  hepatobiliopancreatico: ['glandulas-digestivas'],
  'urinario-genital-masculino': ['urinario', 'reprodutor-masculino'],
  'ginecologico-placenta': ['reprodutor-feminino', 'embriologia'],
  mama: ['reprodutor-feminino'],
  endocrino: ['endocrino'],
  pele: ['tegumentar'],
  'sistema-nervoso': ['nervoso', 'sentidos'],
  hematolinfoide: ['linfoide', 'sangue'],
  'ossos-partes-moles': ['esqueletico', 'muscular'],
}

/** Sistemas do atlas de patologia que cobrem um sistema da Histologia com Zoom. */
export function sistemasDePatologiaDe(sistema: SistemaId) {
  return SISTEMAS_COM_CONTAGEM.filter((s) => PATOLOGIA_PARA_ZOOM[s.id]?.includes(sistema))
}

export interface DoencaDoCatalogo extends ItemDoCatalogo {
  sistema: SistemaId | null
  temCapitulo: boolean
  laminasComZoom: number
}

let doencasEmCache: DoencaDoCatalogo[] | null = null

/**
 * Todas as doenças do módulo, uma entrada por doença.
 *
 * O cartão leva ao capítulo quando ele existe — é a página completa, e ela
 * agora abre com as lâminas de zoom da mesma doença. Sem capítulo, leva à
 * página da doença com zoom. Nunca às duas como cartões separados.
 *
 * Ordem: a prioridade editorial das doenças com lâmina (as mais comuns e
 * cobradas primeiro), depois os capítulos que ainda não têm lâmina de zoom.
 */
export function doencasDoCatalogo(): DoencaDoCatalogo[] {
  if (doencasEmCache) return doencasEmCache
  const usados = new Set<string>()
  const saida: DoencaDoCatalogo[] = []

  for (const d of doencasPublicadas()) {
    const laminas = laminasDaDoenca(d.id)
    const capitulo = capituloDaDoencaZoom(d)
    if (capitulo) usados.add(capitulo)
    const capa = laminas[0] ? resumirPatologica(laminas[0]) : null
    const sistema = NOME_DO_SISTEMA.get(d.sistema)
    saida.push({
      id: `doenca:${d.id}`,
      href: capitulo ? rotaDaDoenca(capitulo) : rotaDaDoencaZoom(d.id),
      titulo: d.nome,
      categoria: `Histopatologia · ${sistema?.nome ?? 'Doença'}`,
      area: 'histopatologia',
      imagem: capa?.miniatura ?? null,
      zoom: laminas.length > 0,
      detalhe: [
        `${laminas.length} ${laminas.length === 1 ? 'lâmina' : 'lâminas'} com zoom`,
        capitulo ? 'capítulo aprofundado' : `${d.achados.length} achados`,
      ].join(' · '),
      cor: sistema?.cor,
      sistema: d.sistema,
      temCapitulo: Boolean(capitulo),
      laminasComZoom: laminas.length,
    })
  }

  const nomeDoSistemaDePatologia = new Map(SISTEMAS_COM_CONTAGEM.map((s) => [s.id, s.nome]))
  for (const c of DOENCAS_RESUMIDAS) {
    if (usados.has(c.slug)) continue
    const sistema = PATOLOGIA_PARA_ZOOM[c.sistemaId]?.[0] ?? null
    saida.push({
      id: `doenca:${c.slug}`,
      href: rotaDaDoenca(c.slug),
      titulo: c.nome,
      categoria: `Histopatologia · ${nomeDoSistemaDePatologia.get(c.sistemaId) ?? 'Doença'}`,
      area: 'histopatologia',
      imagem: null,
      zoom: false,
      detalhe: ['capítulo aprofundado', c.orgaos.slice(0, 2).join(', ')].filter(Boolean).join(' · '),
      cor: sistema ? NOME_DO_SISTEMA.get(sistema)?.cor : undefined,
      icone: 'Stethoscope',
      sistema,
      temCapitulo: true,
      laminasComZoom: 0,
    })
  }

  doencasEmCache = saida
  return saida
}

export function doencasDoSistema(sistema: SistemaId): DoencaDoCatalogo[] {
  return doencasDoCatalogo().filter((d) => d.sistema === sistema)
}

/** Lâminas de doença com zoom, uma por cartão — vão direto ao visualizador. */
export function laminasPatologicasComZoom(sistema?: SistemaId): ItemDoCatalogo[] {
  const doencas = new Map(doencasPublicadas().map((d) => [d.id, d]))
  return LAMINAS_PATOLOGICAS.filter((l) => !sistema || doencas.get(l.doenca)?.sistema === sistema).map((l) => {
    const d = doencas.get(l.doenca)
    const r = resumirPatologica(l)
    return {
      id: `patozoom:${l.slug}`,
      href: rotaDaLaminaPatologica(l.doenca, l.slug),
      titulo: l.subtitulo ? `${l.titulo} — ${l.subtitulo}` : l.titulo,
      categoria: `Histopatologia · ${(d && NOME_DO_SISTEMA.get(d.sistema)?.nome) ?? 'Doença'}`,
      area: 'histopatologia' as const,
      imagem: r.miniatura,
      zoom: true,
      detalhe: `${l.coloracao} · ${r.achadosPresentes} achados marcados`,
    }
  })
}

/**
 * Doenças que entraram por último.
 *
 * A curadoria da Histopatologia com Zoom é uma lista em que cada lâmina nova é
 * acrescentada no fim — a ordem do arquivo é a ordem de chegada. Andar dela de
 * trás para frente dá as doenças mais recentes sem inventar data nenhuma.
 */
export function doencasRecentes(limite = 12): DoencaDoCatalogo[] {
  const porId = new Map(doencasDoCatalogo().map((d) => [d.id, d]))
  const vistas = new Set<string>()
  const saida: DoencaDoCatalogo[] = []
  for (let i = LAMINAS_PATOLOGICAS.length - 1; i >= 0 && saida.length < limite; i--) {
    const id = LAMINAS_PATOLOGICAS[i].doenca
    if (vistas.has(id)) continue
    vistas.add(id)
    const item = porId.get(`doenca:${id}`)
    if (item) saida.push(item)
  }
  return saida
}

/* ────────────────────────── Sistemas: normal e patológico juntos ────────────────────────── */

export const BASE_DOS_SISTEMAS = '/manual-clinico/histologia/sistemas'

export function rotaDoSistemaUnificado(sistema: SistemaId): string {
  return `${BASE_DOS_SISTEMAS}/${sistema}`
}

/**
 * Assuntos do atlas por assunto que tratam de cada sistema. O currículo é
 * organizado como o acervo de origem (setor → assunto), não por sistema; esta
 * tabela liga os dois para a página do sistema mostrar também as
 * fotomicrografias com estruturas marcadas.
 */
const ASSUNTOS_DO_SISTEMA: Partial<Record<SistemaId, string[]>> = {
  celula: ['celulas/fundamentos-da-celula', 'celulas/estruturas', 'celulas/divisao-celular'],
  'tecidos-fundamentais': ['tecidos/fundamentos-dos-tecidos', 'tecidos/epitelio', 'tecidos/tecido-conjuntivo'],
  esqueletico: ['tecidos/tecido-conjuntivo'],
  muscular: ['tecidos/tecido-muscular'],
  nervoso: ['tecidos/tecido-nervoso'],
  cardiovascular: ['orgaos-e-sistemas/sistema-cardiovascular'],
  linfoide: ['orgaos-e-sistemas/sistema-linfoide'],
  tegumentar: ['orgaos-e-sistemas/pele'],
  respiratorio: ['orgaos-e-sistemas/sistema-respiratorio'],
  'cavidade-oral': ['orgaos-e-sistemas/sistema-digestorio'],
  digestorio: ['orgaos-e-sistemas/sistema-digestorio'],
  'glandulas-digestivas': ['orgaos-e-sistemas/sistema-digestorio'],
  urinario: ['orgaos-e-sistemas/sistema-urinario'],
  endocrino: ['orgaos-e-sistemas/sistema-endocrino'],
  'reprodutor-masculino': ['orgaos-e-sistemas/sistema-reprodutor'],
  'reprodutor-feminino': ['orgaos-e-sistemas/sistema-reprodutor'],
  sentidos: ['orgaos-e-sistemas/olho', 'orgaos-e-sistemas/ouvido'],
}

export function assuntosDoSistema(sistema: SistemaId): ItemDoCatalogo[] {
  const caminhos = new Set(ASSUNTOS_DO_SISTEMA[sistema] ?? [])
  return assuntosPorSetor()
    .flatMap((s) => s.itens)
    .filter((item) => caminhos.has(item.id))
}

export interface SistemaDoCatalogo extends ItemDoCatalogo {
  sistema: Sistema
  laminasNormais: number
  doencas: number
}

/** Cartões de sistema: capa real (primeira lâmina com zoom) e contagens das duas áreas. */
export function sistemasDoCatalogo(): SistemaDoCatalogo[] {
  return SISTEMAS.map((s) => {
    const normais = laminasDoSistema(s.id)
    const doencas = doencasDoSistema(s.id).length
    const capa = normais[0] ? resumir(normais[0]) : null
    return {
      id: `sistema:${s.id}`,
      href: rotaDoSistemaUnificado(s.id),
      titulo: s.nome,
      area: 'histologia' as const,
      imagem: capa?.miniatura ?? null,
      mosaico: capa?.mosaico,
      zoom: normais.length > 0,
      categoria: [
        `${normais.length} ${normais.length === 1 ? 'lâmina normal' : 'lâminas normais'}`,
        doencas ? `${doencas} ${doencas === 1 ? 'doença' : 'doenças'}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      cor: s.cor,
      icone: s.icone,
      sistema: s,
      laminasNormais: normais.length,
      doencas,
    }
  }).filter((s) => s.laminasNormais > 0 || s.doencas > 0)
}

/* ────────────────────────── Praticar ────────────────────────── */

/** O quiz que usa as lâminas com zoom: a capa é uma lâmina real do próprio acervo do quiz. */
export function quizComZoom(): ItemDoCatalogo {
  const capa = LAMINAS_ZOOM.find((l) => l.slug === 'rim-he') ?? LAMINAS_ZOOM[0]
  const r = capa ? resumir(capa) : null
  return {
    id: 'quiz-zoom',
    href: `${BASE_ZOOM}/quiz`,
    titulo: 'Quiz de identificação com zoom',
    categoria: 'Praticar · Lâminas inteiras',
    area: 'praticar',
    imagem: r?.miniatura ?? null,
    mosaico: r?.mosaico,
    zoom: true,
    detalhe: 'Ache a estrutura na lâmina inteira',
    icone: 'Target',
  }
}

export function quizzesDoCatalogo(): { doAcervo: ItemDoCatalogo[]; porTema: ItemDoCatalogo[] } {
  const item = (q: (typeof RESUMO_DE_QUIZZES)[number], i: number): ItemDoCatalogo => ({
    id: `quiz:${q.slug}`,
    href: `${BASE_HISTOLOGIA}/quizzes/${q.slug}`,
    titulo: q.titulo,
    categoria: q.autoria === 'proprio' ? `Praticar · ${q.trilha ?? 'Quiz por tema'}` : 'Praticar · Quiz do acervo',
    area: 'praticar',
    imagem: null,
    zoom: false,
    detalhe: `${q.questoes} questões${q.comImagem ? ` · ${q.comImagem} com imagem` : ''}`,
    icone: 'ListChecks',
    cor: CORES_DE_PRATICA[i % CORES_DE_PRATICA.length],
  })
  return { doAcervo: RESUMO_DE_QUIZZES.map(item), porTema: RESUMO_DE_QUIZZES_PROPRIOS.map(item) }
}

export function laboratoriosDoCatalogo(): ItemDoCatalogo[] {
  return MODULOS_DE_LABORATORIO.map((m, i) => ({
    id: `lab:${m.id}`,
    href: `${BASE_HISTOLOGIA}/laboratorio/${m.id}`,
    titulo: m.titulo,
    categoria: 'Praticar · Laboratório virtual',
    area: 'praticar' as const,
    imagem: null,
    zoom: false,
    detalhe: `${m.minutos} min · ${m.resumo}`,
    icone: 'FlaskConical',
    cor: CORES_DE_PRATICA[(i + 2) % CORES_DE_PRATICA.length],
  }))
}

/** Capas tipográficas da prática: tons da marca, para a fileira não virar um bloco de uma cor só. */
const CORES_DE_PRATICA = ['#E8763A', '#2E8C6E', '#C9A227', '#B03A7A', '#3E7CB1']
