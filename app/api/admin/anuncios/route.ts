import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { normalizePeriodo } from '@/lib/user-periodo'
import {
  isValidImageUrl,
  isValidNavigationUrl,
  sanitizeDestino,
  type AnuncioDestino,
} from '@/lib/anuncio-destinos'

export const dynamic = 'force-dynamic'

interface Anuncio {
  _id?: ObjectId
  imagemUrl: string
  ativo: boolean
  ordem: number
  tipoAcao: 'link' | 'modal'
  /** Chamada exibida no banner. Sem ela, o título é derivado do destino. */
  titulo?: string
  /** Texto do botão do banner ("Ver agora", "Garantir vaga"...). */
  ctaTexto?: string
  linkUrl?: string
  linkNovaAba?: boolean
  /** Metadados do destino de `linkUrl`: tipo e nome do item escolhido. */
  destino?: AnuncioDestino
  modalTitulo?: string
  modalConteudo?: string
  modalBotaoTexto?: string
  modalBotaoLink?: string
  modalBotaoDestino?: AnuncioDestino
  // Segmentação por período: vazio/ausente = exibe para todos os períodos.
  periodos?: number[]
  criadoEm: Date
  atualizadoEm: Date
  criadoPor: ObjectId
}

const LIMITES = {
  titulo: 120,
  ctaTexto: 32,
  modalTitulo: 160,
  modalConteudo: 8000,
  modalBotaoTexto: 60,
} as const

function getString(value: unknown, maxLength?: number) {
  const text = typeof value === 'string' ? value.trim() : ''
  return maxLength ? text.slice(0, maxLength) : text
}

/**
 * Remove as chaves `undefined` antes de gravar.
 *
 * O driver do Mongo serializa `undefined` como `null` por padrão, e um
 * `linkUrl: null` num anúncio de modal sujava a leitura pública (o campo existe,
 * mas não vale nada) além de atrapalhar qualquer consulta por existência.
 */
function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value
  }
  return out as Partial<T>
}

/** Sanitiza uma lista de períodos: inteiros válidos (1-12), sem duplicatas, ordenados. */
function sanitizePeriodos(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const set = new Set<number>()
  for (const item of value) {
    const p = normalizePeriodo(item)
    if (p !== null) set.add(p)
  }
  return Array.from(set).sort((a, b) => a - b)
}

// GET - Retornar todos os anuncios (admin ve todos, usuario ve apenas ativos)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const db = await getDb()
    const anunciosCollection = db.collection<Anuncio>('anuncios')

    const status = request.nextUrl.searchParams.get('status')
    const activeOnly = status === 'active' || request.nextUrl.searchParams.get('activeOnly') === 'true'

    // Admin ve todos os anuncios, exceto quando a exibicao publica pede apenas ativos.
    const isAdmin = session?.role === 'admin'
    const filter = isAdmin && !activeOnly ? {} : { ativo: true }

    const anuncios = await anunciosCollection
      .find(filter)
      .sort({ ordem: 1, criadoEm: -1 })
      .toArray()

    return NextResponse.json({ anuncios })
  } catch (error) {
    console.error('Erro ao buscar anuncios:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar anuncios' },
      { status: 500 }
    )
  }
}

// POST - Criar anuncio (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()

    // Validacoes
    const imagemUrl = getString(body.imagemUrl)
    const titulo = getString(body.titulo, LIMITES.titulo)
    const ctaTexto = getString(body.ctaTexto, LIMITES.ctaTexto)
    const linkUrl = getString(body.linkUrl)
    const modalTitulo = getString(body.modalTitulo, LIMITES.modalTitulo)
    const modalConteudo =
      typeof body.modalConteudo === 'string' ? body.modalConteudo.slice(0, LIMITES.modalConteudo) : ''
    const modalBotaoTexto = getString(body.modalBotaoTexto, LIMITES.modalBotaoTexto)
    const modalBotaoLink = getString(body.modalBotaoLink)

    if (!imagemUrl) {
      return NextResponse.json(
        { error: 'A imagem do anuncio e obrigatoria' },
        { status: 400 }
      )
    }

    if (!isValidImageUrl(imagemUrl)) {
      return NextResponse.json(
        { error: 'Envie uma imagem ou use uma URL http(s) / caminho interno iniciado por /' },
        { status: 400 }
      )
    }

    if (!body.tipoAcao || !['link', 'modal'].includes(body.tipoAcao)) {
      return NextResponse.json(
        { error: 'Tipo de acao invalido. Use "link" ou "modal"' },
        { status: 400 }
      )
    }

    if (body.tipoAcao === 'link' && !linkUrl) {
      return NextResponse.json(
        { error: 'O destino e obrigatorio quando o tipo de acao e "link"' },
        { status: 400 }
      )
    }

    if (body.tipoAcao === 'link' && !isValidNavigationUrl(linkUrl)) {
      return NextResponse.json(
        { error: 'Destino invalido. Escolha um item interno ou informe uma URL http(s)' },
        { status: 400 }
      )
    }

    if (body.tipoAcao === 'modal') {
      if (!modalTitulo) {
        return NextResponse.json(
          { error: 'Titulo do modal e obrigatorio quando tipo de acao e "modal"' },
          { status: 400 }
        )
      }
      if (!modalConteudo.trim()) {
        return NextResponse.json(
          { error: 'Conteudo do modal e obrigatorio quando tipo de acao e "modal"' },
          { status: 400 }
        )
      }
      if (modalBotaoLink && !isValidNavigationUrl(modalBotaoLink)) {
        return NextResponse.json(
          { error: 'Destino do botao do modal invalido' },
          { status: 400 }
        )
      }
    }

    const db = await getDb()
    const anunciosCollection = db.collection<Anuncio>('anuncios')

    // Obter a maior ordem atual para colocar o novo anuncio no final
    const ultimoAnuncio = await anunciosCollection
      .find({})
      .sort({ ordem: -1 })
      .limit(1)
      .toArray()
    const novaOrdem = body.ordem ?? (ultimoAnuncio.length > 0 ? ultimoAnuncio[0].ordem + 1 : 0)

    const isLink = body.tipoAcao === 'link'

    const novoAnuncio = stripUndefined({
      imagemUrl,
      ativo: body.ativo ?? true,
      ordem: novaOrdem,
      tipoAcao: body.tipoAcao as 'link' | 'modal',
      titulo: titulo || undefined,
      ctaTexto: ctaTexto || undefined,
      linkUrl: isLink ? linkUrl : undefined,
      linkNovaAba: isLink ? (body.linkNovaAba ?? true) : undefined,
      destino: isLink ? sanitizeDestino(body.destino, linkUrl) : undefined,
      modalTitulo: isLink ? undefined : modalTitulo,
      modalConteudo: isLink ? undefined : modalConteudo,
      modalBotaoTexto: isLink ? undefined : modalBotaoTexto || undefined,
      modalBotaoLink: isLink ? undefined : modalBotaoLink || undefined,
      modalBotaoDestino:
        !isLink && modalBotaoLink ? sanitizeDestino(body.modalBotaoDestino, modalBotaoLink) : undefined,
      periodos: sanitizePeriodos(body.periodos),
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      criadoPor: new ObjectId(session.userId),
    }) as Anuncio

    const result = await anunciosCollection.insertOne(novoAnuncio)

    return NextResponse.json({
      sucesso: true,
      anuncio: { ...novoAnuncio, _id: result.insertedId }
    })
  } catch (error) {
    console.error('Erro ao criar anuncio:', error)
    return NextResponse.json(
      { error: 'Erro ao criar anuncio' },
      { status: 500 }
    )
  }
}

// PATCH - Reordenar a lista inteira (apenas admin)
//
// Trocar `ordem` entre dois documentos, como a tela fazia antes, não funciona
// quando dois anúncios compartilham o mesmo valor — o que acontece sempre que
// alguém cria um anúncio informando `ordem` na mão. Reescrever a sequência
// inteira a partir da posição na lista resolve o empate e ainda troca dois PUTs
// concorrentes (que podiam se cruzar) por uma escrita só.
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const ids: unknown = body?.ids

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Informe a nova ordem dos anuncios' }, { status: 400 })
    }

    const validIds = ids.filter((id): id is string => typeof id === 'string' && ObjectId.isValid(id))
    if (validIds.length !== ids.length) {
      return NextResponse.json({ error: 'Lista de ids invalida' }, { status: 400 })
    }

    const db = await getDb()
    const atualizadoEm = new Date()

    await db.collection<Anuncio>('anuncios').bulkWrite(
      validIds.map((id, index) => ({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: { ordem: index, atualizadoEm } },
        },
      })),
    )

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao reordenar anuncios:', error)
    return NextResponse.json({ error: 'Erro ao reordenar anuncios' }, { status: 500 })
  }
}

// PUT - Atualizar anuncio (apenas admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do anuncio e obrigatorio' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    const body = await request.json()
    const db = await getDb()
    const anunciosCollection = db.collection<Anuncio>('anuncios')

    // Verificar se anuncio existe
    const anuncioExistente = await anunciosCollection.findOne({ _id: new ObjectId(id) })
    if (!anuncioExistente) {
      return NextResponse.json(
        { error: 'Anuncio nao encontrado' },
        { status: 404 }
      )
    }

    // Construir objeto de atualizacao
    const updateData: Partial<Anuncio> = {
      atualizadoEm: new Date()
    }
    const unsetData: Partial<Record<keyof Anuncio, ''>> = {}

    if (body.imagemUrl !== undefined) {
      const imagemUrl = getString(body.imagemUrl)
      if (!imagemUrl) {
        return NextResponse.json(
          { error: 'A imagem do anuncio nao pode ficar vazia' },
          { status: 400 }
        )
      }
      if (!isValidImageUrl(imagemUrl)) {
        return NextResponse.json(
          { error: 'Envie uma imagem ou use uma URL http(s) / caminho interno iniciado por /' },
          { status: 400 }
        )
      }
      updateData.imagemUrl = imagemUrl
    }

    if (body.ativo !== undefined) {
      updateData.ativo = Boolean(body.ativo)
    }

    if (body.ordem !== undefined) {
      const ordem = Number(body.ordem)
      if (!Number.isFinite(ordem)) {
        return NextResponse.json({ error: 'Ordem invalida' }, { status: 400 })
      }
      updateData.ordem = ordem
    }

    if (body.periodos !== undefined) {
      updateData.periodos = sanitizePeriodos(body.periodos)
    }

    if (body.titulo !== undefined) {
      updateData.titulo = getString(body.titulo, LIMITES.titulo) || undefined
    }

    if (body.ctaTexto !== undefined) {
      updateData.ctaTexto = getString(body.ctaTexto, LIMITES.ctaTexto) || undefined
    }

    if (body.tipoAcao !== undefined) {
      if (!['link', 'modal'].includes(body.tipoAcao)) {
        return NextResponse.json(
          { error: 'Tipo de acao invalido. Use "link" ou "modal"' },
          { status: 400 }
        )
      }
      updateData.tipoAcao = body.tipoAcao
    }

    // Determinar tipoAcao final (novo ou existente)
    const tipoAcaoFinal = body.tipoAcao ?? anuncioExistente.tipoAcao

    // Campos de link
    if (body.linkUrl !== undefined) {
      updateData.linkUrl = getString(body.linkUrl) || undefined
    }
    if (body.linkNovaAba !== undefined) {
      updateData.linkNovaAba = Boolean(body.linkNovaAba)
    }
    if (body.destino !== undefined) {
      updateData.destino = sanitizeDestino(
        body.destino,
        updateData.linkUrl ?? anuncioExistente.linkUrl,
      )
    }

    // Campos de modal
    if (body.modalTitulo !== undefined) {
      updateData.modalTitulo = getString(body.modalTitulo, LIMITES.modalTitulo) || undefined
    }
    if (body.modalConteudo !== undefined) {
      updateData.modalConteudo =
        typeof body.modalConteudo === 'string'
          ? body.modalConteudo.slice(0, LIMITES.modalConteudo) || undefined
          : undefined
    }
    if (body.modalBotaoTexto !== undefined) {
      updateData.modalBotaoTexto = getString(body.modalBotaoTexto, LIMITES.modalBotaoTexto) || undefined
    }
    if (body.modalBotaoLink !== undefined) {
      updateData.modalBotaoLink = getString(body.modalBotaoLink) || undefined
    }
    if (body.modalBotaoDestino !== undefined) {
      updateData.modalBotaoDestino = sanitizeDestino(
        body.modalBotaoDestino,
        updateData.modalBotaoLink ?? anuncioExistente.modalBotaoLink,
      )
    }

    // Validacoes baseadas no tipoAcao final
    if (tipoAcaoFinal === 'link') {
      const linkUrlFinal = updateData.linkUrl ?? anuncioExistente.linkUrl
      if (!linkUrlFinal || linkUrlFinal.trim() === '') {
        return NextResponse.json(
          { error: 'O destino e obrigatorio quando o tipo de acao e "link"' },
          { status: 400 }
        )
      }
      if (!isValidNavigationUrl(linkUrlFinal)) {
        return NextResponse.json(
          { error: 'Destino invalido. Escolha um item interno ou informe uma URL http(s)' },
          { status: 400 }
        )
      }

      unsetData.modalTitulo = ''
      unsetData.modalConteudo = ''
      unsetData.modalBotaoTexto = ''
      unsetData.modalBotaoLink = ''
      unsetData.modalBotaoDestino = ''
    }

    if (tipoAcaoFinal === 'modal') {
      const modalTituloFinal = updateData.modalTitulo ?? anuncioExistente.modalTitulo
      const modalConteudoFinal = updateData.modalConteudo ?? anuncioExistente.modalConteudo
      const modalBotaoLinkFinal = updateData.modalBotaoLink ?? anuncioExistente.modalBotaoLink

      if (!modalTituloFinal || modalTituloFinal.trim() === '') {
        return NextResponse.json(
          { error: 'Titulo do modal e obrigatorio quando tipo de acao e "modal"' },
          { status: 400 }
        )
      }
      if (!modalConteudoFinal || modalConteudoFinal.trim() === '') {
        return NextResponse.json(
          { error: 'Conteudo do modal e obrigatorio quando tipo de acao e "modal"' },
          { status: 400 }
        )
      }
      if (modalBotaoLinkFinal && !isValidNavigationUrl(modalBotaoLinkFinal)) {
        return NextResponse.json(
          { error: 'Destino do botao do modal invalido' },
          { status: 400 }
        )
      }

      unsetData.linkUrl = ''
      unsetData.linkNovaAba = ''
      unsetData.destino = ''
    }

    // Campo vazio quer dizer "apagar": vira $unset em vez de gravar null.
    for (const key of Object.keys(updateData) as Array<keyof Anuncio>) {
      if (updateData[key] === undefined) {
        unsetData[key] = ''
        delete updateData[key]
      }
    }

    // Um mesmo campo em $set e $unset faz o Mongo recusar a operação inteira
    // ("would create a conflict"), devolvendo 500 numa edição comum. Quem manda
    // é o $unset: ele vem das regras do tipo de ação — um anúncio de link não
    // guarda texto de modal, e vice-versa, mesmo que o corpo tenha mandado um.
    for (const key of Object.keys(unsetData) as Array<keyof Anuncio>) {
      delete updateData[key]
    }

    const updateOperation: { $set: Partial<Anuncio>; $unset?: Partial<Record<keyof Anuncio, ''>> } = {
      $set: updateData
    }

    if (Object.keys(unsetData).length > 0) {
      updateOperation.$unset = unsetData
    }

    await anunciosCollection.updateOne(
      { _id: new ObjectId(id) },
      updateOperation
    )

    // Buscar anuncio atualizado
    const anuncioAtualizado = await anunciosCollection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      sucesso: true,
      anuncio: anuncioAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar anuncio:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar anuncio' },
      { status: 500 }
    )
  }
}

// DELETE - Remover anuncio (apenas admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do anuncio e obrigatorio' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    const db = await getDb()
    const anunciosCollection = db.collection<Anuncio>('anuncios')

    const result = await anunciosCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Anuncio nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao excluir anuncio:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir anuncio' },
      { status: 500 }
    )
  }
}
