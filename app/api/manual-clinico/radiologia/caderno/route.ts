import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
} from '@/lib/manual-clinico-product'

export const dynamic = 'force-dynamic'

/**
 * Caderno radiográfico — as anotações do aluno dentro do Manual de Radiologia.
 *
 * Uma folha por seção do atlas: cada série de tomografia e cada incidência de
 * Raio-X tem a sua, e dentro dela cada ficha pode ficar ancorada numa estrutura
 * (`secao`). A chave é `escopo + chave`, que é o endereço do exame — assim a
 * anotação reaparece exatamente onde foi escrita.
 *
 * Fica na conta, e não no `localStorage`, porque a promessa é justamente
 * atravessar dispositivos: anota-se no notebook estudando e revê-se no celular
 * antes da prova. O portão de acesso é o mesmo do atlas — quem não assina não
 * escreve aqui.
 */

const ESCOPOS = ['raio-x', 'tomografia'] as const
type Escopo = (typeof ESCOPOS)[number]

const CORES = ['papel', 'amarelo', 'verde', 'azul', 'rosa'] as const
type Cor = (typeof CORES)[number]

/** Teto por folha: o caderno é de anotação, não de armazenamento de texto. */
const MAX_FICHAS_POR_FOLHA = 60
const MAX_CARACTERES = 4000

interface FichaCaderno {
  _id?: ObjectId
  userId: ObjectId
  escopo: Escopo
  /** Slug do exame: `thoraxBones`, `tc-torax-coracao`… */
  chave: string
  /** Estrutura ou bloco a que a ficha se refere. */
  secao: string
  secaoRotulo: string
  texto: string
  cor: Cor
  criadoEm: Date
  atualizadoEm: Date
}

interface FichaSerializada {
  id: string
  secao: string
  secaoRotulo: string
  texto: string
  cor: Cor
  criadoEm: string
  atualizadoEm: string
}

function serializar(ficha: FichaCaderno): FichaSerializada {
  return {
    id: String(ficha._id),
    secao: ficha.secao,
    secaoRotulo: ficha.secaoRotulo,
    texto: ficha.texto,
    cor: ficha.cor,
    criadoEm: ficha.criadoEm.toISOString(),
    atualizadoEm: ficha.atualizadoEm.toISOString(),
  }
}

function ehEscopo(valor: unknown): valor is Escopo {
  return typeof valor === 'string' && (ESCOPOS as readonly string[]).includes(valor)
}

/** Aceita só o formato de slug que as rotas do atlas produzem. */
function chaveValida(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0 && valor.length <= 80 && /^[\w-]+$/.test(valor)
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.slice(0, MAX_CARACTERES).trim() : ''
}

function rotulo(valor: unknown): string {
  return typeof valor === 'string' ? valor.slice(0, 120).trim() : ''
}

function cor(valor: unknown): Cor {
  return typeof valor === 'string' && (CORES as readonly string[]).includes(valor)
    ? (valor as Cor)
    : 'papel'
}

/**
 * Portão do caderno: mesma regra do atlas. Devolve o id do usuário quando ele
 * pode escrever, e a resposta de erro pronta quando não pode.
 */
async function autorizar() {
  const session = await getSession()
  if (!session?.userId) {
    return { erro: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }
  const db = await getDb()
  const config = await getManualClinicoConfig(db)
  const access = await getManualClinicoAccess(db, session, config, 'radiologia')
  if (!access.hasFullAccess) {
    return { erro: NextResponse.json({ error: 'Acesso não liberado' }, { status: 403 }) }
  }
  return { db, userId: new ObjectId(session.userId) }
}

export async function GET(request: NextRequest) {
  try {
    const autorizado = await autorizar()
    if ('erro' in autorizado) return autorizado.erro
    const { db, userId } = autorizado

    const { searchParams } = new URL(request.url)
    const escopo = searchParams.get('escopo')
    const chave = searchParams.get('chave')

    const filtro: Record<string, unknown> = { userId }
    if (ehEscopo(escopo)) filtro.escopo = escopo
    if (chaveValida(chave)) filtro.chave = chave

    const fichas = await db
      .collection<FichaCaderno>('radiologia_caderno')
      .find(filtro)
      .sort({ atualizadoEm: -1 })
      .limit(MAX_FICHAS_POR_FOLHA)
      .toArray()

    return NextResponse.json({ fichas: fichas.map(serializar) })
  } catch (error) {
    console.error('Erro ao ler o caderno de radiologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const autorizado = await autorizar()
    if ('erro' in autorizado) return autorizado.erro
    const { db, userId } = autorizado

    const corpo = await request.json()
    const { escopo, chave, secao } = corpo
    const conteudo = texto(corpo.texto)

    if (!ehEscopo(escopo) || !chaveValida(chave) || !chaveValida(secao)) {
      return NextResponse.json({ error: 'Exame ou seção inválidos' }, { status: 400 })
    }
    if (!conteudo) {
      return NextResponse.json({ error: 'A ficha está vazia' }, { status: 400 })
    }

    const colecao = db.collection<FichaCaderno>('radiologia_caderno')
    const agora = new Date()
    const id = typeof corpo.id === 'string' && ObjectId.isValid(corpo.id) ? new ObjectId(corpo.id) : null

    if (id) {
      // Edição: o filtro carrega o `userId`, então uma ficha de outra conta
      // simplesmente não é encontrada.
      const atualizada = await colecao.findOneAndUpdate(
        { _id: id, userId },
        { $set: { texto: conteudo, cor: cor(corpo.cor), atualizadoEm: agora } },
        { returnDocument: 'after' },
      )
      if (!atualizada) {
        return NextResponse.json({ error: 'Ficha não encontrada' }, { status: 404 })
      }
      return NextResponse.json({ ficha: serializar(atualizada) })
    }

    const total = await colecao.countDocuments({ userId, escopo, chave })
    if (total >= MAX_FICHAS_POR_FOLHA) {
      return NextResponse.json(
        { error: `Esta folha chegou ao limite de ${MAX_FICHAS_POR_FOLHA} fichas.` },
        { status: 409 },
      )
    }

    const ficha: FichaCaderno = {
      userId,
      escopo,
      chave,
      secao,
      secaoRotulo: rotulo(corpo.secaoRotulo) || secao,
      texto: conteudo,
      cor: cor(corpo.cor),
      criadoEm: agora,
      atualizadoEm: agora,
    }
    const resultado = await colecao.insertOne(ficha)

    return NextResponse.json({ ficha: serializar({ ...ficha, _id: resultado.insertedId }) })
  } catch (error) {
    console.error('Erro ao salvar ficha do caderno de radiologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const autorizado = await autorizar()
    if ('erro' in autorizado) return autorizado.erro
    const { db, userId } = autorizado

    const id = new URL(request.url).searchParams.get('id')
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ficha inválida' }, { status: 400 })
    }

    const resultado = await db
      .collection<FichaCaderno>('radiologia_caderno')
      .deleteOne({ _id: new ObjectId(id), userId })

    if (resultado.deletedCount === 0) {
      return NextResponse.json({ error: 'Ficha não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao apagar ficha do caderno de radiologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
