import type { CategoriaId, Ferramenta } from './tipos'
import { CATEGORIAS } from './categorias'

export * from './tipos'
export * from './helpers'
export { CATEGORIAS, CATEGORIA_POR_ID, IDS_CATEGORIAS, ehCategoria } from './categorias'

/**
 * Carregamento por categoria.
 *
 * Cada arquivo de conteúdo vira um chunk separado do webpack porque só é
 * alcançado por `import()` dinâmico. Isso importa: juntos, os 15 módulos passam
 * de 400 KB de texto, e a página inicial não precisa de nenhum deles — só as
 * categorias, que são leves. A busca global carrega todos, uma vez, sob demanda.
 */
const MODULOS: Record<CategoriaId, () => Promise<{ ferramentas: Ferramenta[] }>> = {
  gasometria: () => import('./conteudo/gasometria'),
  cardiologia: () => import('./conteudo/cardiologia'),
  pneumologia: () => import('./conteudo/pneumologia'),
  nefrologia: () => import('./conteudo/nefrologia'),
  infectologia: () => import('./conteudo/infectologia'),
  neurologia: () => import('./conteudo/neurologia'),
  gastroenterologia: () => import('./conteudo/gastroenterologia'),
  hematologia: () => import('./conteudo/hematologia'),
  endocrinologia: () => import('./conteudo/endocrinologia'),
  pediatria: () => import('./conteudo/pediatria'),
  ginecologia: () => import('./conteudo/ginecologia'),
  emergencia: () => import('./conteudo/emergencia'),
  cirurgia: () => import('./conteudo/cirurgia'),
  farmacologia: () => import('./conteudo/farmacologia'),
  nutricao: () => import('./conteudo/nutricao'),
}

const cache = new Map<CategoriaId, Ferramenta[]>()
let todasCache: Ferramenta[] | null = null

/** Carrega o módulo de uma categoria e devolve todas as ferramentas dele. */
export async function carregarModulo(id: CategoriaId): Promise<Ferramenta[]> {
  const emCache = cache.get(id)
  if (emCache) return emCache
  const mod = await MODULOS[id]()
  cache.set(id, mod.ferramentas)
  return mod.ferramentas
}

/**
 * Carrega todos os módulos e devolve o catálogo completo, sem duplicatas.
 *
 * Uma ferramenta pode aparecer em várias categorias (o ânion gap serve à
 * gasometria e à nefrologia), mas ela existe uma única vez — a deduplicação é
 * por `id` e mantém a primeira ocorrência.
 */
export async function carregarTodas(): Promise<Ferramenta[]> {
  if (todasCache) return todasCache
  const modulos = await Promise.all((Object.keys(MODULOS) as CategoriaId[]).map((id) => carregarModulo(id)))
  const vistos = new Set<string>()
  const todas: Ferramenta[] = []
  for (const lista of modulos) {
    for (const f of lista) {
      if (vistos.has(f.id)) continue
      vistos.add(f.id)
      todas.push(f)
    }
  }
  todasCache = todas
  if (process.env.NODE_ENV === 'development') conferirTotais(todas)
  return todas
}

/** Todas as ferramentas de uma categoria, incluindo as que moram em outra. */
export function ferramentasDaCategoria(todas: Ferramenta[], id: CategoriaId): Ferramenta[] {
  return todas.filter((f) => f.categorias.includes(id))
}

/* ────────────────────────────── Busca ────────────────────────────── */

/** Remove acentos e caixa para que "anion gap" encontre "ânion gap". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export interface ResultadoBusca {
  ferramenta: Ferramenta
  /** Quanto maior, mais relevante. Usado só para ordenar. */
  peso: number
}

/**
 * Busca por nome, sigla, sinônimo e resumo.
 *
 * A ordenação privilegia, nesta ordem: nome que começa com o termo, sigla
 * exata, nome que contém o termo, sinônimo e resumo. É o que faz "gaso" trazer
 * o interpretador de gasometria antes de qualquer outra coisa.
 */
export function buscar(todas: Ferramenta[], termo: string, limite = 40): ResultadoBusca[] {
  const t = normalizar(termo)
  if (t.length < 2) return []
  const palavras = t.split(/\s+/).filter(Boolean)
  const resultados: ResultadoBusca[] = []
  for (const f of todas) {
    const nome = normalizar(f.nome)
    const sigla = f.sigla ? normalizar(f.sigla) : ''
    const sinonimos = (f.sinonimos ?? []).map(normalizar)
    const resumo = normalizar(f.resumo)
    let peso = 0
    if (nome.startsWith(t)) peso = 100
    else if (sigla && sigla === t) peso = 95
    else if (nome.includes(t)) peso = 80
    else if (sinonimos.some((s) => s.startsWith(t))) peso = 70
    else if (sinonimos.some((s) => s.includes(t))) peso = 60
    else if (resumo.includes(t)) peso = 40
    else if (palavras.length > 1 && palavras.every((p) => nome.includes(p) || sinonimos.some((s) => s.includes(p)) || resumo.includes(p))) peso = 30
    if (peso > 0) resultados.push({ ferramenta: f, peso })
  }
  return resultados.sort((a, b) => b.peso - a.peso || a.ferramenta.nome.localeCompare(b.ferramenta.nome)).slice(0, limite)
}

/** Encontra uma ferramenta pelo slug dentro de uma lista já carregada. */
export function porId(lista: Ferramenta[], id: string): Ferramenta | undefined {
  return lista.find((f) => f.id === id)
}

/* ─────────────────────── Conferência em desenvolvimento ─────────────────────── */

function conferirTotais(todas: Ferramenta[]) {
  const contagem = new Map<CategoriaId, number>()
  for (const f of todas) for (const c of f.categorias) contagem.set(c, (contagem.get(c) ?? 0) + 1)
  const divergentes = CATEGORIAS.filter((c) => (contagem.get(c.id) ?? 0) !== c.total)
  if (divergentes.length) {
    // eslint-disable-next-line no-console
    console.warn(
      '[ferramentas-clinicas] Totais declarados divergem do real:\n' +
        divergentes.map((c) => `  ${c.id}: declarado ${c.total}, real ${contagem.get(c.id) ?? 0}`).join('\n') +
        '\nRode `node scripts/contar-ferramentas.js` para corrigir.',
    )
  }
}

/** Soma de ferramentas distintas — usada no hero do índice. */
export function totalDeclarado(): number {
  return TOTAL_FERRAMENTAS
}

/**
 * Número de ferramentas distintas do catálogo.
 * Mantido pelo script `scripts/contar-ferramentas.js`.
 */
export const TOTAL_FERRAMENTAS = 201
