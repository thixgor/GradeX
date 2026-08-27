/**
 * Acesso à ementa gerada por `scripts/cronogramas/construir-ementas.mjs`.
 *
 * Só o servidor entra aqui. Os quatro JSON somam ~500 KB; mandá-los para o
 * navegador para exibir UM período seria pagar o acervo inteiro por página.
 * A rota `/api/cronogramas/ementa` devolve só o período pedido, e o índice
 * (que é pequeno) viaja separado para o seletor de seção.
 */

import 'server-only'

import indiceBruto from '@/data/cronogramas/ementas/indice.json'
import type { EmentaTopico, IndiceCurso, SecaoCurso } from './tipos'
import { SECOES_IDS } from './tipos'

/**
 * `import()` estático por curso: o file-tracing da Vercel não segue caminho
 * montado em runtime, e um JSON que não é rastreado simplesmente não existe no
 * deploy — o erro aparece só em produção, no primeiro aluno que abre a ementa.
 */
const CARREGADORES: Record<SecaoCurso, () => Promise<any>> = {
  medicina: () => import('@/data/cronogramas/ementas/medicina.json'),
  psicologia: () => import('@/data/cronogramas/ementas/psicologia.json'),
  biomedicina: () => import('@/data/cronogramas/ementas/biomedicina.json'),
  odontologia: () => import('@/data/cronogramas/ementas/odontologia.json'),
}

/** Cache de processo: o JSON é imutável entre deploys, então relê-lo é desperdício. */
const cache = new Map<SecaoCurso, Record<string, EmentaTopico[]>>()

export const INDICE_EMENTAS = indiceBruto as unknown as IndiceCurso[]

async function carregarCurso(secao: SecaoCurso): Promise<Record<string, EmentaTopico[]>> {
  const emCache = cache.get(secao)
  if (emCache) return emCache

  const modulo = await CARREGADORES[secao]()
  const dados = (modulo.default ?? modulo) as Record<string, EmentaTopico[]>
  cache.set(secao, dados)
  return dados
}

/** Tópicos de um período. Devolve `[]` quando o período não existe na ementa. */
export async function getEmenta(secao: SecaoCurso, periodo: number): Promise<EmentaTopico[]> {
  if (!(SECOES_IDS as string[]).includes(secao)) return []
  const curso = await carregarCurso(secao)
  return curso[String(periodo)] ?? []
}

/** Períodos com ementa publicada, em ordem. */
export function getPeriodosDisponiveis(secao: SecaoCurso): number[] {
  const curso = INDICE_EMENTAS.find(c => c.id === secao)
  return curso ? curso.periodos.map(p => p.periodo) : []
}

/**
 * Resolve nomes legíveis para um punhado de ids da ementa. O admin marca
 * "conteúdo cobrado" por id; quem lê a avaliação (aluno e painel) precisa do
 * nome, e guardar o nome junto do id no banco criaria uma cópia que envelhece
 * sozinha na primeira correção da ementa.
 */
export async function resolverNomesDaEmenta(
  secao: SecaoCurso,
  periodo: number,
  ids: string[],
): Promise<Record<string, string>> {
  if (ids.length === 0) return {}
  const alvo = new Set(ids)
  const nomes: Record<string, string> = {}
  const topicos = await getEmenta(secao, periodo)

  for (const topico of topicos) {
    if (alvo.has(topico.id)) nomes[topico.id] = topico.nome
    for (const sub of topico.subtopicos) {
      if (alvo.has(sub.id)) nomes[sub.id] = sub.nome
      for (const modulo of sub.modulos) {
        if (alvo.has(modulo.id)) nomes[modulo.id] = modulo.nome
      }
    }
  }

  return nomes
}
