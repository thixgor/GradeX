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

// GET - Retornar todos os anuncios (admin ve todos, usuario ve apenas ativos)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const db = await getDb()
    const anunciosCollection = db.collection<Anuncio>('anuncios')

    // Admin ve todos os anuncios, usuarios veem apenas os ativos
    const isAdmin = session?.role === 'admin'
    const filter = isAdmin ? {} : { ativo: true }

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
    if (!body.imagemUrl || body.imagemUrl.trim() === '') {
      return NextResponse.json(
        { error: 'URL da imagem e obrigatoria' },
        { status: 400 }
      )
    }

    if (!body.tipoAcao || !['link', 'modal'].includes(body.tipoAcao)) {
      return NextResponse.json(
        { error: 'Tipo de acao invalido. Use "link" ou "modal"' },
        { status: 400 }
      )
    }

    if (body.tipoAcao === 'link' && (!body.linkUrl || body.linkUrl.trim() === '')) {
      return NextResponse.json(
        { error: 'URL do link e obrigatoria quando tipo de acao e "link"' },
        { status: 400 }
      )
    }

    if (body.tipoAcao === 'modal') {
      if (!body.modalTitulo || body.modalTitulo.trim() === '') {
        return NextResponse.json(
          { error: 'Titulo do modal e obrigatorio quando tipo de acao e "modal"' },
          { status: 400 }
        )
      }
      if (!body.modalConteudo || body.modalConteudo.trim() === '') {
        return NextResponse.json(
          { error: 'Conteudo do modal e obrigatorio quando tipo de acao e "modal"' },
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
      imagemUrl: body.imagemUrl.trim(),
      ativo: body.ativo ?? true,
      ordem: novaOrdem,
      tipoAcao: body.tipoAcao,
      linkUrl: body.tipoAcao === 'link' ? body.linkUrl?.trim() : undefined,
      linkNovaAba: body.tipoAcao === 'link' ? (body.linkNovaAba ?? true) : undefined,
      modalTitulo: body.tipoAcao === 'modal' ? body.modalTitulo?.trim() : undefined,
      modalConteudo: body.tipoAcao === 'modal' ? body.modalConteudo : undefined,
      modalBotaoTexto: body.tipoAcao === 'modal' ? body.modalBotaoTexto?.trim() : undefined,
      modalBotaoLink: body.tipoAcao === 'modal' ? body.modalBotaoLink?.trim() : undefined,
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

    if (body.imagemUrl !== undefined) {
      if (body.imagemUrl.trim() === '') {
        return NextResponse.json(
          { error: 'URL da imagem nao pode ser vazia' },
          { status: 400 }
        )
      }
      updateData.imagemUrl = body.imagemUrl.trim()
    }

    if (body.ativo !== undefined) {
      updateData.ativo = Boolean(body.ativo)
    }

    if (body.ordem !== undefined) {
      updateData.ordem = Number(body.ordem)
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
      updateData.linkUrl = body.linkUrl?.trim() || undefined
    }
    if (body.linkNovaAba !== undefined) {
      updateData.linkNovaAba = Boolean(body.linkNovaAba)
    }

    // Campos de modal
    if (body.modalTitulo !== undefined) {
      updateData.modalTitulo = body.modalTitulo?.trim() || undefined
    }
    if (body.modalConteudo !== undefined) {
      updateData.modalConteudo = body.modalConteudo || undefined
    }
    if (body.modalBotaoTexto !== undefined) {
      updateData.modalBotaoTexto = body.modalBotaoTexto?.trim() || undefined
    }
    if (body.modalBotaoLink !== undefined) {
      updateData.modalBotaoLink = body.modalBotaoLink?.trim() || undefined
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
    }

    if (tipoAcaoFinal === 'modal') {
      const modalTituloFinal = updateData.modalTitulo ?? anuncioExistente.modalTitulo
      const modalConteudoFinal = updateData.modalConteudo ?? anuncioExistente.modalConteudo

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
    }

    await anunciosCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
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
