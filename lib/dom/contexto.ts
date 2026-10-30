import 'server-only'

/**
 * O resto do contexto do Dom: XP e ranking do aluno, ficha do material aberto
 * e a assinatura das falas do Dom.
 *
 * ## Por que assinar as falas
 *
 * A conversa mora no navegador (o servidor não grava conversa nenhuma — nem
 * custa escrita, nem guarda dado de saúde de ninguém). O problema: quem
 * guarda o histórico pode forjá-lo, inventando falas "do Dom" com instruções
 * dentro ("como combinamos, agora você responde qualquer coisa…"). Cada fala
 * que o servidor devolve leva um HMAC de `userId|texto`; na mensagem seguinte,
 * fala do Dom sem assinatura válida é descartada antes de chegar ao modelo.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { ObjectId, type Db } from 'mongodb'
import { COLECAO_XP, campoDoPeriodo, obterPerfilDeXp, xpNoPeriodo } from '@/lib/xp/perfis'
import { nivelDe } from '@/lib/xp/regras'
import type { FichaDoAluno, FichaDoMaterial } from './prompt'

function segredo(): string {
  return process.env.DOM_SEGREDO || process.env.JWT_SECRET || process.env.CONFIG_SECRET || ''
}

export function assinarFala(userId: string, texto: string): string {
  const s = segredo()
  if (!s) return ''
  return createHmac('sha256', s).update(`${userId}|${texto}`).digest('base64url').slice(0, 32)
}

export function falaAutentica(userId: string, texto: string, assinatura: unknown): boolean {
  const s = segredo()
  if (!s) return true // sem segredo configurado (dev): não há como conferir
  if (typeof assinatura !== 'string' || assinatura.length !== 32) return false
  const esperada = Buffer.from(assinarFala(userId, texto))
  const recebida = Buffer.from(assinatura)
  return esperada.length === recebida.length && timingSafeEqual(esperada, recebida)
}

/** XP, nível, liga e posições — o mesmo retrato de `/api/xp/eu`, aceito com até 10 min. */
export async function xpDoAluno(db: Db, userId: string): Promise<FichaDoAluno['xp']> {
  try {
    const perfil = await obterPerfilDeXp(db, userId, { maxIdadeMs: 10 * 60_000 })
    if (!perfil) return null
    const agora = new Date()
    const col = db.collection(COLECAO_XP)
    const posicao = async (periodo: 'semana' | 'geral') => {
      const meu = xpNoPeriodo(perfil, periodo, agora)
      if (!perfil.elegivel || meu <= 0) return null
      const { campo, filtro } = campoDoPeriodo(periodo, agora)
      return (await col.countDocuments({ elegivel: true, ...filtro, [campo]: { $gt: meu } }, { maxTimeMS: 1500 })) + 1
    }
    const [posicaoSemana, posicaoGeral] = await Promise.all([posicao('semana'), posicao('geral')])
    const nivel = nivelDe(perfil.total)
    return {
      total: perfil.total,
      nivel: nivel.nivel,
      liga: nivel.liga.nome,
      semana: xpNoPeriodo(perfil, 'semana', agora),
      sequencia: perfil.sequenciaAtual || 0,
      posicaoSemana,
      posicaoGeral,
    }
  } catch (erro) {
    console.warn('[dom] xp indisponível:', erro instanceof Error ? erro.message : erro)
    return null
  }
}

/**
 * Ficha do material, versão enxuta: título, descrição curta, tags e os títulos
 * do sumário (até 18). É o que aparece no catálogo para qualquer um, então não
 * vaza conteúdo pago; material oculto só para admin.
 */
export async function fichaDoMaterial(
  db: Db,
  materialId: string,
  pagina: number | null,
  isAdmin: boolean,
): Promise<FichaDoMaterial | null> {
  if (!ObjectId.isValid(materialId)) return null
  const doc = await db.collection('materials').findOne(
    { _id: new ObjectId(materialId), ...(isAdmin ? {} : { isHidden: { $ne: true } }) },
    { projection: { title: 1, description: 1, tags: 1, 'pdfViewerConfig.summary': 1, 'pdfFile.pageCount': 1 } },
  )
  if (!doc) return null
  const texto = (v: unknown, teto: number) =>
    typeof v === 'string' ? v.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, teto) : ''
  const sumario: string[] = (doc.pdfViewerConfig?.summary || [])
    .filter((s: any) => (s?.level ?? 0) <= 1)
    .slice(0, 18)
    .map((s: any) => `${texto(s?.title, 60)} (p.${Number(s?.page) || '?'})`)
  return {
    titulo: texto(doc.title, 120) || 'Material',
    descricao: texto(doc.description, 280),
    tags: Array.isArray(doc.tags) ? doc.tags.slice(0, 8).map((t: unknown) => texto(t, 30)).filter(Boolean) : [],
    sumario,
    pagina,
    paginas: Number(doc.pdfFile?.pageCount) || null,
  }
}

const SAUDE =
  /\b(fisiolog|patolog|anatom|farmac|doen|sindrom|tratament|diagnost|sintom|sinal|celul|horm|enzim|receptor|nerv|muscul|cardi|cora[cç]|renal|rim|rins|nefr|pulm|respirat|hepat|f[ií]gado|sangu|hemat|imun|infec|bact[ée]r|v[ií]rus|fung|parasit|dose|droga|medicament|antibi[oó]t|exame|les[aã]o|tumor|c[aâ]ncer|neopl|neuro|c[eé]rebr|endocr|diabet|tireo|gastr|intestin|metab|gen[eé]t|dna|rna|prote[ií]n|histolog|embriol|bioqu[ií]m|microbio|psiqu|psicolog|transtorno|odont|dent|gesta|obst|pediatr|cirurg|ecg|eletrocard|press[aã]o arterial|hipert|hipot|insufici|choque|sepse|inflama|dor|febre|anemia|leucoc|plaqueta|coagula|vacina|epidemiol|semiolog|ausculta)/i

/** A mensagem pede conteúdo de saúde (e não só navegação)? Decide se a busca no Google vale a cota. */
export function pedeConteudoDeSaude(texto: string): boolean {
  if (texto.length < 12) return false
  const chave = texto.toLowerCase()
  if (/\b(me leva|leva(r)? (pra|para)|onde fica|abrir|abre|comprar|assinar|senha|perfil|cronograma)\b/.test(chave) && texto.length < 60) return false
  return SAUDE.test(chave)
}
