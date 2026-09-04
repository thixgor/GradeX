import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { campoTextoPreenchido, textoPreenchidoNaExpressao } from '@/lib/banco/filtros-conteudo'
import { ordenarPeriodosLetivos } from '@/lib/banco/periodo-letivo'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * O que EXISTE dentro de um recorte do Banco de Questões.
 *
 * ## O problema que isto resolve
 *
 * O criador de listas oferecia os mesmos filtros sempre: tipo, dificuldade,
 * período letivo, ano, "só com imagem", "com resposta comentada", "só as que
 * errei". Os anos e os períodos vinham do acervo INTEIRO, e os demais eram
 * fixos no código. Só que "o acervo tem questões com imagem" não responde à
 * pergunta que a pessoa está fazendo, que é "o recorte QUE EU ESCOLHI tem
 * questões com imagem".
 *
 * O resultado era o pior desenho possível: a pessoa marcava um módulo, marcava
 * "só com imagem", seguia até o fim, clicava em "Criar lista" — e recebia
 * "nenhuma questão combina com esses filtros". A tela ofereceu o filtro,
 * deixou avançar, e só no fim contou que ele não existia ali. Cada tentativa
 * dessas é uma volta inteira pelos três passos.
 *
 * Esta rota devolve as opções que TÊM questão dentro do recorte de assuntos
 * escolhido, com a contagem de cada uma. O que não tem simplesmente não é
 * desenhado — a frustração deixa de existir porque o caminho para ela deixa de
 * ser oferecido.
 *
 * ## Uma varredura, não sete
 *
 * Tipo, dificuldade e os dois filtros de conteúdo saem de um `$group` único,
 * com somas condicionais; anos e períodos, de dois `$group` por chave. Os três
 * vivem no mesmo `$facet`, então o Mongo lê o recorte uma vez.
 *
 * O que a pessoa já resolveu é a exceção: ele depende de QUEM está perguntando
 * e sai de `banco_resolucoes` (a coleção do usuário, muito menor que o acervo),
 * cruzada com o recorte por `$lookup`. Sem isso, "só as que errei" continuaria
 * sendo oferecido para quem nunca errou nada naquele módulo.
 *
 * Falha em silêncio devolvendo `null` em tudo: quem lê trata `null` como "não
 * sei, mostre tudo". Uma rota de decoração de filtro não pode derrubar a tela
 * de montar lista.
 */

interface Facetas {
  total: number
  tipos: Record<string, number>
  dificuldades: Record<string, number>
  anos: Array<{ ano: number; total: number }>
  periodos: Array<{ periodo: string; total: number }>
  comImagem: number
  comExplicacao: number
  /** Questões do recorte que esta conta já respondeu. */
  jaResolvidas: number
  /** Questões do recorte cuja ÚLTIMA resposta desta conta foi errada. */
  erradas: number
}

const TETO_DE_IDS_POR_FILTRO = 50

function filtroDeIds(param: string | null) {
  if (!param) return null
  const ids = param
    .split(',')
    .slice(0, TETO_DE_IDS_POR_FILTRO)
    .map((id) => id.trim())
    .filter((id) => isValidObjectId(id))
    .map((id) => new ObjectId(id))
  if (ids.length === 0) return null
  return ids.length === 1 ? ids[0] : { $in: ids }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const db = await getDb()

    // O recorte é só de ASSUNTO. Os outros filtros ficam de fora de propósito:
    // se "difícil" entrasse no recorte, marcar "difícil" apagaria da tela as
    // opções de dificuldade — inclusive a que a pessoa acabou de escolher.
    const recorte: Record<string, unknown> = {}
    const modulo = filtroDeIds(searchParams.get('moduloId'))
    if (modulo) recorte.moduloId = modulo
    const topico = filtroDeIds(searchParams.get('topicoId'))
    if (topico) recorte.topicoId = topico
    // `subtopicoid` em minúsculas: é assim que o campo está gravado na coleção
    // (ver app/api/banco/questoes/route.ts, que usa a mesma grafia).
    const subtopico = filtroDeIds(searchParams.get('subtopicoId'))
    if (subtopico) recorte.subtopicoid = subtopico

    const preenchido = campoTextoPreenchido()

    const [agregado] = await db
      .collection('banco_questoes')
      .aggregate([
        { $match: recorte },
        {
          $facet: {
            resumo: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  objetiva: { $sum: { $cond: [{ $eq: ['$tipo', 'objetiva'] }, 1, 0] } },
                  discursiva: { $sum: { $cond: [{ $eq: ['$tipo', 'discursiva'] }, 1, 0] } },
                  facil: { $sum: { $cond: [{ $eq: ['$dificuldade', 'facil'] }, 1, 0] } },
                  medio: { $sum: { $cond: [{ $eq: ['$dificuldade', 'medio'] }, 1, 0] } },
                  dificil: { $sum: { $cond: [{ $eq: ['$dificuldade', 'dificil'] }, 1, 0] } },
                  // A MESMA condição de `campoTextoPreenchido()`, escrita como
                  // expressão: ser string E não ser vazia. Só `$type` deixaria
                  // passar a string vazia, que o filtro real recusa — e o
                  // número anunciaria um recorte que volta sem nada.
                  comImagem: { $sum: { $cond: [textoPreenchidoNaExpressao('$imagemUrl'), 1, 0] } },
                  comExplicacao: { $sum: { $cond: [textoPreenchidoNaExpressao('$explicacao'), 1, 0] } },
                },
              },
            ],
            anos: [
              { $match: { ano: { $ne: null } } },
              { $group: { _id: '$ano', total: { $sum: 1 } } },
            ],
            periodos: [
              { $match: { periodoLetivo: preenchido } },
              { $group: { _id: '$periodoLetivo', total: { $sum: 1 } } },
            ],
          },
        },
      ])
      .toArray()

    const resumo = (agregado?.resumo?.[0] as Record<string, number> | undefined) || {}

    /*
     * O que esta conta já resolveu dentro do recorte.
     *
     * Parte de `banco_resolucoes` filtrada pelo usuário (dezenas ou centenas de
     * documentos), não do acervo: o caminho inverso — varrer as questões e
     * consultar as resoluções de cada uma — roda um sub-pipeline por questão.
     */
    const [resolucoes] = await db
      .collection('banco_resolucoes')
      .aggregate([
        { $match: { userId: new ObjectId(session.userId) } },
        { $sort: { createdAt: -1 } },
        // Uma linha por questão, com o veredito da ÚLTIMA tentativa — a mesma
        // regra que `apenasErradas` aplica na listagem.
        { $group: { _id: '$questaoId', ultimaCorreta: { $first: '$correta' } } },
        {
          $lookup: {
            from: 'banco_questoes',
            localField: '_id',
            foreignField: '_id',
            pipeline: [{ $match: recorte }, { $project: { _id: 1 } }],
            as: 'questao',
          },
        },
        { $match: { 'questao.0': { $exists: true } } },
        {
          $group: {
            _id: null,
            jaResolvidas: { $sum: 1 },
            erradas: { $sum: { $cond: [{ $eq: ['$ultimaCorreta', false] }, 1, 0] } },
          },
        },
      ])
      .toArray()

    const facetas: Facetas = {
      total: Number(resumo.total || 0),
      tipos: {
        objetiva: Number(resumo.objetiva || 0),
        discursiva: Number(resumo.discursiva || 0),
      },
      dificuldades: {
        facil: Number(resumo.facil || 0),
        medio: Number(resumo.medio || 0),
        dificil: Number(resumo.dificil || 0),
      },
      anos: ((agregado?.anos as Array<{ _id: number; total: number }>) || [])
        .filter((a) => Number.isFinite(Number(a._id)))
        .map((a) => ({ ano: Number(a._id), total: Number(a.total || 0) }))
        .sort((a, b) => b.ano - a.ano),
      periodos: [],
      comImagem: Number(resumo.comImagem || 0),
      comExplicacao: Number(resumo.comExplicacao || 0),
      jaResolvidas: Number(resolucoes?.jaResolvidas || 0),
      erradas: Number(resolucoes?.erradas || 0),
    }

    const totalPorPeriodo = new Map<string, number>(
      ((agregado?.periodos as Array<{ _id: string; total: number }>) || []).map((p) => [
        String(p._id),
        Number(p.total || 0),
      ]),
    )
    facetas.periodos = ordenarPeriodosLetivos(Array.from(totalPorPeriodo.keys())).map((rotulo) => ({
      periodo: rotulo,
      total: totalPorPeriodo.get(rotulo) || 0,
    }))

    return NextResponse.json({ facetas })
  } catch (error) {
    console.error('[banco/facetas] erro:', error)
    return NextResponse.json({ facetas: null })
  }
}
