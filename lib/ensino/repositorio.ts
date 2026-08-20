import 'server-only'
import { ObjectId, type Db } from 'mongodb'

import { avaliarAcessoAula, ocultarConteudoRestrito, type ContextoDoUsuario } from '@/lib/aulas/acesso'
import { aplicarVinculo, resolverVinculosEmLote } from '@/lib/aulas/resolver-vinculo'
import { lerProgressoEmLote } from '@/lib/aulas/repositorio-progresso'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import { duracaoLegivel, recursosDaAula, type AulaDoEnsino } from '@/lib/ensino/aula'
import { caminhoAte, type NoDeEnsino } from '@/lib/ensino/taxonomia'
import {
  calcularProgressoDaTrilha,
  type ProgressoConhecido,
  type TrilhaDeEnsino,
} from '@/lib/ensino/trilha'

/**
 * A ida ao banco do subsistema de Ensino.
 *
 * A REGRA QUE ESTE ARQUIVO EXISTE PARA GARANTIR
 *
 * Toda aula que sai daqui passou pelo MESMO motor de acesso que já protegia a
 * área antiga (`lib/aulas/acesso.ts`). Nenhuma tela nova inventa a própria
 * regra de cadeado, e nenhuma rota nova devolve `videoEmbed` de aula paga. A
 * reformulação da interface não podia reabrir o vazamento que aquele motor
 * fechou — e a única forma de garantir isso é ter um caminho só para montar o
 * cartão de uma aula, que é `montarCartoes`.
 *
 * TUDO EM LOTE
 *
 * A home carrega Trilhas, retomada, novidades e navegação numa tela. Se cada
 * cartão custasse uma consulta, a abertura da área de Ensino custaria dezenas
 * de idas ao Mongo. Toda função aqui recebe e devolve listas.
 */

/* =================== TAXONOMIA =================== */

export interface DocumentoDeNo extends Omit<NoDeEnsino, '_id'> {
  _id?: ObjectId
}

const comId = <T extends { _id?: any }>(doc: T) => ({ ...doc, _id: String(doc._id) })

export async function lerNos(db: Db): Promise<NoDeEnsino[]> {
  const docs = await db
    .collection<DocumentoDeNo>(COLECOES.nos)
    .find({})
    .sort({ ordem: 1 })
    .toArray()
  return docs.map((d) => comId(d) as NoDeEnsino)
}

/** Quantas aulas visíveis penduram em cada nó — alimenta a navegação (§14). */
export function contarAulasPorNo(aulas: Array<Pick<AulaDoEnsino, 'ensino'>>): Map<string, number> {
  const contagem = new Map<string, number>()
  for (const aula of aulas) {
    const e = aula.ensino
    if (!e) continue
    // A aula conta no nó MAIS ESPECÍFICO que declara. Contá-la também nos
    // ancestrais duplicaria o número, porque `montarArvore` já acumula de baixo
    // para cima.
    const alvo = e.subtopicoId || e.topicoId || e.moduloId || e.areaId
    if (!alvo) continue
    const chave = String(alvo)
    contagem.set(chave, (contagem.get(chave) || 0) + 1)
  }
  return contagem
}

/* =================== CARTÕES DE AULA =================== */

/** O que toda tela do Ensino recebe sobre uma aula. Nunca mais que isto. */
export interface CartaoDeAula {
  _id: string
  titulo: string
  descricao?: string
  capa?: any
  href: string
  duracaoSegundos?: number
  duracaoLabel: string
  profundidade?: string
  tags?: string[]
  tipo: 'aula' | 'resumo'
  localizacao: string
  localizacaoIds: string[]
  recursos: { resumo: boolean; pdf: boolean; flashcards: boolean }
  resumoId?: string | null
  progresso: { percentual: number; concluida: boolean; posicaoSegundos?: number } | null
  acesso: { liberado: boolean; porAmostra?: boolean; requisito?: any }
}

interface OpcoesDeCartao {
  usuarioId?: string | null
  /** Nós já carregados, para escrever a localização sem outra consulta. */
  nos?: NoDeEnsino[]
  /** Anexa `?trilha=` aos endereços — é o que dá contexto à tela de assistir. */
  trilhaSlug?: string
}

/**
 * Transforma documentos de aula em cartões prontos para a tela.
 *
 * Aula invisível (rascunho, encerrada, agendada-com-ocultar) some da lista;
 * aula bloqueada FICA, sem conteúdo e com o motivo do cadeado — é assim que
 * ela vira convite em vez de erro, como já era na área antiga.
 */
export async function montarCartoes(
  db: Db,
  documentos: AulaDoEnsino[],
  usuario: ContextoDoUsuario,
  opcoes: OpcoesDeCartao = {},
): Promise<CartaoDeAula[]> {
  if (documentos.length === 0) return []

  const vinculos = await resolverVinculosEmLote(db, documentos as any)
  const agora = new Date()

  const visiveis: Array<{ doc: any; veredito: any }> = []
  for (const documento of documentos) {
    const resolvida = aplicarVinculo(documento as any, vinculos)
    const veredito = avaliarAcessoAula(resolvida as any, usuario, agora)
    if (veredito.invisivel) continue
    visiveis.push({ doc: ocultarConteudoRestrito(resolvida, veredito), veredito })
  }

  const progressos = opcoes.usuarioId
    ? await lerProgressoEmLote(
        db,
        opcoes.usuarioId,
        visiveis.map((v) => String(v.doc._id)),
      )
    : new Map()

  const nomeDoNo = new Map((opcoes.nos || []).map((n) => [String(n._id), n.nome]))

  return visiveis.map(({ doc, veredito }) => {
    const ensino = doc.ensino || {}
    const ids = [ensino.moduloId, ensino.topicoId, ensino.subtopicoId]
      .filter(Boolean)
      .map((id: any) => String(id))
    const progresso = progressos.get(String(doc._id))
    const recursos = recursosDaAula(doc, { logado: Boolean(opcoes.usuarioId) })

    return {
      _id: String(doc._id),
      titulo: doc.titulo,
      descricao: doc.descricao,
      capa: doc.capa || null,
      href: opcoes.trilhaSlug
        ? `/aulas/${doc._id}?trilha=${encodeURIComponent(opcoes.trilhaSlug)}`
        : `/aulas/${doc._id}`,
      duracaoSegundos: ensino.duracaoSegundos,
      duracaoLabel: duracaoLegivel(ensino.duracaoSegundos),
      profundidade: ensino.profundidade,
      tags: ensino.tags || [],
      tipo: ensino.tipo === 'resumo' ? 'resumo' : 'aula',
      // A localização é escrita aqui, com os nós já em memória: resolvê-la na
      // tela exigiria baixar a taxonomia inteira só para escrever três palavras
      // embaixo de cada cartão.
      localizacao: ids.map((id) => nomeDoNo.get(id)).filter(Boolean).join(' · '),
      localizacaoIds: ids,
      recursos: { resumo: recursos.resumo, pdf: recursos.pdf, flashcards: recursos.flashcards },
      resumoId: ensino.resumoId || null,
      progresso: progresso
        ? {
            percentual: progresso.percentual,
            concluida: progresso.concluida,
            posicaoSegundos: progresso.posicaoSegundos,
          }
        : null,
      acesso: {
        liberado: veredito.liberado,
        porAmostra: veredito.porAmostra,
        requisito: veredito.requisito,
      },
    }
  })
}

/**
 * O caminho legível de uma aula: "Medicina › Ciclo Clínico › Cardiologia".
 *
 * Usa o nó mais específico e sobe: é a mesma migalha da página de exploração,
 * escrita uma vez.
 */
export function caminhoDaAula(aula: Pick<AulaDoEnsino, 'ensino'>, nos: NoDeEnsino[]): NoDeEnsino[] {
  const e = aula.ensino
  const folha = e?.subtopicoId || e?.topicoId || e?.moduloId || e?.areaId
  return folha ? caminhoAte(nos, String(folha)) : []
}

/* =================== TRILHAS =================== */

export interface DocumentoDeTrilha extends Omit<TrilhaDeEnsino, '_id'> {
  _id?: ObjectId
}

export async function lerTrilhas(
  db: Db,
  filtro: Record<string, any> = {},
): Promise<TrilhaDeEnsino[]> {
  const docs = await db
    .collection<DocumentoDeTrilha>(COLECOES.trilhas)
    .find(filtro)
    .sort({ destaque: -1, ordem: 1, criadoEm: -1 })
    .toArray()
  return docs.map((d) => comId(d) as unknown as TrilhaDeEnsino)
}

/** Só o que está no ar — o filtro que separa a vitrine do rascunho. */
export const PUBLICADAS = { situacao: 'publicada' as const }

export async function lerTrilhaPorSlug(db: Db, slug: string): Promise<TrilhaDeEnsino | null> {
  const doc = await db
    .collection<DocumentoDeTrilha>(COLECOES.trilhas)
    // Aceita id também: o painel abre a Trilha por id antes de ela ter slug
    // definitivo, e obrigar dois endereços diferentes duplicaria a rota.
    .findOne(ObjectId.isValid(slug) ? { $or: [{ slug }, { _id: new ObjectId(slug) }] } : { slug })
  return doc ? (comId(doc) as unknown as TrilhaDeEnsino) : null
}

/**
 * O progresso de várias Trilhas de uma vez.
 *
 * A home mostra seis Trilhas com barra de progresso. Calcular cada uma com sua
 * própria consulta de progresso seria seis idas ao banco para desenhar seis
 * barras; aqui é uma só, com todas as aulas de todas as Trilhas.
 */
export async function progressoDeTrilhas(
  db: Db,
  trilhas: TrilhaDeEnsino[],
  usuarioId?: string | null,
): Promise<Map<string, ReturnType<typeof calcularProgressoDaTrilha>>> {
  const saida = new Map<string, ReturnType<typeof calcularProgressoDaTrilha>>()
  if (trilhas.length === 0) return saida

  const todasAsAulas = new Set<string>()
  for (const trilha of trilhas) {
    for (const etapa of trilha.etapas || []) {
      for (const item of etapa.itens || []) {
        if (item.tipo === 'aula' && item.refId) todasAsAulas.add(item.refId)
      }
    }
  }

  const progresso: Map<string, ProgressoConhecido> = usuarioId
    ? await lerProgressoEmLote(db, usuarioId, Array.from(todasAsAulas))
    : new Map()

  for (const trilha of trilhas) {
    saida.set(String(trilha._id), calcularProgressoDaTrilha(trilha, progresso))
  }
  return saida
}

/* =================== ÍNDICES =================== */

/**
 * Índices do subsistema. Idempotente — chamada pelas rotas de escrita.
 *
 * `slug` é único porque ele É a identidade pública de um nó e de uma Trilha: é
 * o que aparece no endereço e o que a importação usa para reencontrar o
 * registro em vez de duplicá-lo.
 */
export async function garantirIndicesDeEnsino(db: Db) {
  await Promise.all([
    db.collection(COLECOES.nos).createIndex({ slug: 1 }, { unique: true }),
    db.collection(COLECOES.nos).createIndex({ paiId: 1, ordem: 1 }),
    db.collection(COLECOES.nos).createIndex({ nivel: 1 }),
    db.collection(COLECOES.trilhas).createIndex({ slug: 1 }, { unique: true }),
    db.collection(COLECOES.trilhas).createIndex({ situacao: 1, ordem: 1 }),
    db.collection(COLECOES.trilhaEstado).createIndex(
      { usuarioId: 1, trilhaId: 1 },
      { unique: true },
    ),
    db.collection(COLECOES.professores).createIndex({ slug: 1 }, { unique: true }),
    // Consultas da navegação por taxonomia e do catálogo administrativo.
    db.collection(COLECOES.aulas).createIndex({ 'ensino.topicoId': 1 }),
    db.collection(COLECOES.aulas).createIndex({ 'ensino.subtopicoId': 1 }),
    db.collection(COLECOES.aulas).createIndex({ 'ensino.moduloId': 1 }),
    db.collection(COLECOES.aulas).createIndex({ 'ensino.tipo': 1 }),
  ]).catch((erro) => {
    // Índice é otimização, não requisito de correção: uma falha aqui não pode
    // derrubar a escrita que o admin acabou de pedir.
    console.error('[ensino] índices:', erro)
  })
}

/* =================== PERMISSÃO =================== */

export interface SessaoDeEdicao {
  userId?: string
  role?: string
  secondaryRole?: string
}

/**
 * Quem edita o acervo de Ensino: admin e monitor.
 *
 * Mesma dupla que já editava as aulas na área antiga — o subsistema novo não
 * inventa um papel próprio, para não existirem duas respostas para "quem pode
 * mexer no conteúdo".
 */
export async function podeEditarEnsino(db: Db, sessao: SessaoDeEdicao | null): Promise<boolean> {
  if (!sessao?.userId) return false
  if (sessao.role === 'admin') return true
  if (sessao.secondaryRole === 'monitor') return true
  if (!ObjectId.isValid(sessao.userId)) return false
  const usuario = await db
    .collection('users')
    .findOne({ _id: new ObjectId(sessao.userId) }, { projection: { secondaryRole: 1, role: 1 } })
  return usuario?.role === 'admin' || usuario?.secondaryRole === 'monitor'
}
