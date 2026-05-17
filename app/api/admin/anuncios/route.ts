import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

interface Anuncio {
  _id?: ObjectId
  imagemUrl: string
  ativo: boolean
  ordem: number
  tipoAcao: 'link' | 'modal'
  linkUrl?: string
  linkNovaAba?: boolean
  modalTitulo?: string
  modalConteudo?: string
  modalBotaoTexto?: string
  modalBotaoLink?: string
  criadoEm: Date
  atualizadoEm: Date
  criadoPor: ObjectId
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidImageUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/')) return true

  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidNavigationUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/')) return true

  try {
    const url = new URL(trimmed)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
  } catch {
    return false
  }
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
    const linkUrl = getString(body.linkUrl)
    const modalTitulo = getString(body.modalTitulo)
    const modalConteudo = typeof body.modalConteudo === 'string' ? body.modalConteudo : ''
    const modalBotaoTexto = getString(body.modalBotaoTexto)
    const modalBotaoLink = getString(body.modalBotaoLink)

    if (!imagemUrl) {
      return NextResponse.json(
        { error: 'URL da imagem e obrigatoria' },
        { status: 400 }
      )
    }

    if (!isValidImageUrl(imagemUrl)) {
      return NextResponse.json(
        { error: 'Use uma URL de imagem http(s) ou caminho interno iniciado por /' },
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
        { error: 'URL do link e obrigatoria quando tipo de acao e "link"' },
        { status: 400 }
      )
    }

    if (body.tipoAcao === 'link' && !isValidNavigationUrl(linkUrl)) {
      return NextResponse.json(
        { error: 'URL do link invalida' },
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
          { error: 'URL do botao do modal invalida' },
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

    const novoAnuncio: Omit<Anuncio, '_id'> = {
      imagemUrl,
      ativo: body.ativo ?? true,
      ordem: novaOrdem,
      tipoAcao: body.tipoAcao,
      linkUrl: body.tipoAcao === 'link' ? linkUrl : undefined,
      linkNovaAba: body.tipoAcao === 'link' ? (body.linkNovaAba ?? true) : undefined,
      modalTitulo: body.tipoAcao === 'modal' ? modalTitulo : undefined,
      modalConteudo: body.tipoAcao === 'modal' ? modalConteudo : undefined,
      modalBotaoTexto: body.tipoAcao === 'modal' ? modalBotaoTexto || undefined : undefined,
      modalBotaoLink: body.tipoAcao === 'modal' ? modalBotaoLink || undefined : undefined,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      criadoPor: new ObjectId(session.userId)
    }

    const result = await anunciosCollection.insertOne(novoAnuncio as Anuncio)

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
          { error: 'URL da imagem nao pode ser vazia' },
          { status: 400 }
        )
      }
      if (!isValidImageUrl(imagemUrl)) {
        return NextResponse.json(
          { error: 'Use uma URL de imagem http(s) ou caminho interno iniciado por /' },
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

    // Campos de modal
    if (body.modalTitulo !== undefined) {
      updateData.modalTitulo = getString(body.modalTitulo) || undefined
    }
    if (body.modalConteudo !== undefined) {
      updateData.modalConteudo = typeof body.modalConteudo === 'string' ? body.modalConteudo || undefined : undefined
    }
    if (body.modalBotaoTexto !== undefined) {
      updateData.modalBotaoTexto = getString(body.modalBotaoTexto) || undefined
    }
    if (body.modalBotaoLink !== undefined) {
      updateData.modalBotaoLink = getString(body.modalBotaoLink) || undefined
    }

    // Validacoes baseadas no tipoAcao final
    if (tipoAcaoFinal === 'link') {
      const linkUrlFinal = updateData.linkUrl ?? anuncioExistente.linkUrl
      if (!linkUrlFinal || linkUrlFinal.trim() === '') {
        return NextResponse.json(
          { error: 'URL do link e obrigatoria quando tipo de acao e "link"' },
          { status: 400 }
        )
      }
      if (!isValidNavigationUrl(linkUrlFinal)) {
        return NextResponse.json(
          { error: 'URL do link invalida' },
          { status: 400 }
        )
      }

      unsetData.modalTitulo = ''
      unsetData.modalConteudo = ''
      unsetData.modalBotaoTexto = ''
      unsetData.modalBotaoLink = ''
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
          { error: 'URL do botao do modal invalida' },
          { status: 400 }
        )
      }

      unsetData.linkUrl = ''
      unsetData.linkNovaAba = ''
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
