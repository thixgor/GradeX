import { cache } from 'react'
import { ObjectId } from 'mongodb'
import { acervoArredondado } from '@/lib/banco/acervo-publico'
import { montarArvoreDoBanco } from '@/lib/banco/arvore'
import { carregarIdsDeGruposOcultos } from '@/lib/provas/grupos-ocultos-servidor'

/**
 * O que as vitrines de `/provas`, `/banco-questoes` e `/exam/[id]` mostram a
 * quem chega SEM conta — lido do banco quando a página é gerada (ISR), nunca
 * por visita.
 *
 * Regra de tudo aqui: a vitrine mostra o que qualquer pessoa logada já vê no
 * catálogo, e nada além. Prova pessoal, prova oculta e prova em grupo oculto
 * ou restrito a cargo não aparecem — nem título, nem capa. Módulo e tópico do
 * Banco seguem a mesma regra (ver lib/banco/visibilidade.ts).
 *
 * Toda leitura tem prazo e cai num "não sei" honesto: a página sai sem o
 * número ou sem a capa, nunca quebrada. Uma vitrine a menos de um número é
 * melhor do que uma vitrine fora do ar.
 */

const PRAZO_MS = 3000

function comPrazo<T>(promessa: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), PRAZO_MS)
    promessa.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

async function banco() {
  const { getDb } = await import('@/lib/mongodb')
  return comPrazo(getDb())
}

/** Prova que todo mundo logado pode ver no catálogo (antes do recorte por período). */
const FILTRO_DE_PROVA_GERAL = {
  isPersonalExam: { $ne: true },
  isHidden: { $ne: true },
}

export interface CapaDeProvaPublica {
  id: string
  titulo: string
  capa: string
}

/**
 * As capas das provas gerais mais recentes, para o mosaico da vitrine.
 *
 * Só capa em https ou caminho local: `http://` seria bloqueado como conteúdo
 * misto, e uma célula vazia no mosaico é pior do que uma célula de cor.
 */
export async function capasDeProvasPublicas(limite = 6): Promise<CapaDeProvaPublica[]> {
  try {
    const db = await banco()
    const [provas, gruposFora] = await Promise.all([
      comPrazo(
        db
          .collection('exams')
          .find(
            { ...FILTRO_DE_PROVA_GERAL, coverImage: { $regex: '^(https://|/[^/])' } },
            { projection: { title: 1, coverImage: 1, groupId: 1 } },
          )
          .sort({ _id: -1 })
          .limit(limite * 4)
          .toArray(),
      ),
      comPrazo(carregarIdsDeGruposOcultos()),
    ])

    const vistas = new Set<string>()
    const capas: CapaDeProvaPublica[] = []
    for (const prova of provas) {
      if (prova.groupId && gruposFora.has(String(prova.groupId))) continue
      const capa = String(prova.coverImage)
      if (vistas.has(capa)) continue
      vistas.add(capa)
      capas.push({ id: String(prova._id), titulo: String(prova.title || ''), capa })
      if (capas.length >= limite) break
    }
    return capas
  } catch (erro) {
    console.error('[vitrine] capas das provas:', erro)
    return []
  }
}

/**
 * Quantas provas gerais existem, arredondado para a dezena de baixo.
 *
 * Mesmo motivo do acervo do Banco (`lib/banco/acervo-publico.ts`): o número
 * redondo é um piso que o catálogo sempre cumpre. Abaixo de 20, `0` — e `0`
 * quer dizer "não fale número".
 */
export async function provasGeraisArredondado(): Promise<number> {
  try {
    const db = await banco()
    const total = await comPrazo(db.collection('exams').countDocuments(FILTRO_DE_PROVA_GERAL))
    const redondo = Math.floor(total / 10) * 10
    return redondo >= 20 ? redondo : 0
  } catch (erro) {
    console.error('[vitrine] contagem de provas:', erro)
    return 0
  }
}

/** O acervo do Banco já arredondado para o milhar de baixo (`0` = sem número). */
export async function acervoDoBancoArredondado(): Promise<number> {
  try {
    const db = await banco()
    return acervoArredondado(await comPrazo(db.collection('banco_questoes').estimatedDocumentCount()))
  } catch (erro) {
    console.error('[vitrine] acervo do banco:', erro)
    return 0
  }
}

export interface ModuloPublico {
  id: string
  nome: string
  total: number
  topicos: Array<{ id: string; nome: string; total: number; subtopicos: number }>
}

/** Nó sem marcação de oculto nem de cargo — o que uma conta gratuita vê. */
function aberto(no: { isHidden?: boolean; allowedGroups?: string[] }): boolean {
  return no.isHidden !== true && !(Array.isArray(no.allowedGroups) && no.allowedGroups.length > 0)
}

/**
 * O catálogo do Banco como a conta gratuita o vê: módulos e tópicos com
 * contagem, sem enunciado nenhum. É exatamente a árvore que a tela do Banco
 * mostra a quem não assina — aqui, recortada para a vitrine.
 */
export async function catalogoPublicoDoBanco(maxModulos = 8, maxTopicos = 8): Promise<ModuloPublico[]> {
  try {
    const arvore = await comPrazo(montarArvoreDoBanco())
    const subtopicosPorTopico = new Map<string, number>()
    for (const s of arvore.subtopicos) {
      if (s.totalQuestoes > 0) subtopicosPorTopico.set(s.topicoId, (subtopicosPorTopico.get(s.topicoId) || 0) + 1)
    }

    return arvore.modulos
      .filter((m) => aberto(m) && m.totalQuestoes > 0)
      .sort((a, b) => b.totalQuestoes - a.totalQuestoes)
      .slice(0, maxModulos)
      .map((m) => ({
        id: m._id,
        nome: m.nome,
        total: m.totalQuestoes,
        topicos: arvore.topicos
          .filter((t) => t.moduloId === m._id && aberto(t) && t.totalQuestoes > 0)
          .sort((a, b) => b.totalQuestoes - a.totalQuestoes)
          .slice(0, maxTopicos)
          .map((t) => ({
            id: t._id,
            nome: t.nome,
            total: t.totalQuestoes,
            subtopicos: subtopicosPorTopico.get(t._id) || 0,
          })),
      }))
      .filter((m) => m.topicos.length > 0)
  } catch (erro) {
    console.error('[vitrine] catálogo do banco:', erro)
    return []
  }
}

export interface ProvaPublica {
  titulo: string
  capa: string | null
  questoes: number | null
  duracao: number | null
  treino: boolean
}

/**
 * A prova de `/exam/[id]` como o visitante sem conta pode vê-la: nome, capa e
 * os dois números do cartão de entrada. `null` quando ela não existe ou não é
 * de ver em público — e a vitrine então fala da prova sem dizer qual é, o que
 * não confirma nem a existência dela.
 *
 * `cache` do React: `generateMetadata` e a página pedem a mesma prova na mesma
 * renderização, e a leitura sai uma vez só.
 */
export const provaPublica = cache(async (id: string): Promise<ProvaPublica | null> => {
  if (!ObjectId.isValid(id)) return null
  try {
    const db = await banco()
    const [prova, gruposFora] = await Promise.all([
      comPrazo(
        db.collection('exams').findOne(
          { _id: new ObjectId(id), ...FILTRO_DE_PROVA_GERAL },
          {
            projection: {
              title: 1,
              coverImage: 1,
              numberOfQuestions: 1,
              duration: 1,
              groupId: 1,
              isPracticeExam: 1,
            },
          },
        ),
      ),
      comPrazo(carregarIdsDeGruposOcultos()),
    ])
    if (!prova) return null
    if (prova.groupId && gruposFora.has(String(prova.groupId))) return null

    const capa = typeof prova.coverImage === 'string' && prova.coverImage.trim() ? prova.coverImage.trim() : null
    const questoes = Number(prova.numberOfQuestions)
    const duracao = Number(prova.duration)
    return {
      titulo: String(prova.title || 'Prova'),
      capa,
      questoes: Number.isFinite(questoes) && questoes > 0 ? questoes : null,
      duracao: Number.isFinite(duracao) && duracao > 0 ? duracao : null,
      treino: prova.isPracticeExam === true,
    }
  } catch (erro) {
    console.error('[vitrine] prova pública:', erro)
    return null
  }
})
