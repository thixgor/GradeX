import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaPostagem } from '@/lib/types'
import {
  secureApiEndpoint,
  verifyResourceAccess,
  isValidObjectId,
  sanitizeObject
} from '@/lib/api-security'
import { getSession } from '@/lib/auth'
import { avaliarAcessoAula, ocultarConteudoRestrito } from '@/lib/aulas/acesso'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { normalizarRegras, visibilidadeEquivalente } from '@/lib/aulas/regras-edicao'
import { aplicarVinculo, resolverVinculosEmLote } from '@/lib/aulas/resolver-vinculo'

export const dynamic = 'force-dynamic'

/**
 * Detalhe da aula, já filtrado pelo que esta pessoa pode ver.
 *
 * Esta rota devolvia o documento INTEIRO — `videoEmbed`, links de aula ao vivo
 * e PDFs — sem sessão e sem checagem nenhuma. O cadeado das aulas pagas existia
 * só em `app/aulas/[id]/page.tsx`, ou seja, no navegador: bastava abrir
 * /api/aulas/<id> para ler o embed de qualquer aula do Plus+.
 *
 * Agora quem decide é `avaliarAcessoAula`, no servidor, e o conteúdo restrito
 * nunca entra na resposta. Continua respondendo 200 com os metadados (título,
 * capa, motivo do bloqueio) de propósito: a tela precisa desenhar o cadeado
 * explicando o que falta (§17), e um 403 seco viraria a "página quebrada" que
 * não queremos.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar ObjectId para prevenir NoSQL injection/DoS
    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    const aula = await aulasCollection.findOne({
      _id: new ObjectId(params.id)
    })

    if (!aula) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      )
    }

    // "Visualizar como aluno" (§28): o admin abre mão do próprio privilégio
    // para conferir a trava do jeito que ela chega em quem paga.
    const parametros = new URL(request.url).searchParams
    const comoAluno = parametros.get('comoAluno') === '1'
    const comoVisitante = parametros.get('comoAluno') === 'visitante'

    const session = await getSession()
    const [usuario, vinculos] = await Promise.all([
      montarContextoDoUsuario(db, session, { comoAluno, comoVisitante }),
      resolverVinculosEmLote(db, [aula as any]),
    ])

    // O vínculo com /materiais é aplicado ANTES do veredito: é ele que soma
    // "comprou o material" às condições e diz de onde o vídeo vem.
    const resolvida = aplicarVinculo(aula as any, vinculos)
    const veredito = avaliarAcessoAula(resolvida, usuario)

    // Rascunho e aula encerrada não existem para o aluno: responder 404 evita
    // confirmar que aquele endereço guarda alguma coisa.
    if (veredito.invisivel && veredito.requisito?.motivo !== 'agendada') {
      return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      aula: ocultarConteudoRestrito(resolvida, veredito),
      acesso: {
        liberado: veredito.liberado,
        porAmostra: veredito.porAmostra,
        requisito: veredito.requisito,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar aula:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar aula' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar ObjectId primeiro
    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    // Verificar autenticação e rate limit
    const security = await secureApiEndpoint(request, {
      rateLimit: 'WRITE',
      auth: {
        requireAuth: true,
        allowedRoles: ['admin'],
        allowSecondaryRoles: ['monitor']
      }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const session = security.session!
    const db = await getDb()
    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    // Verificar se o monitor tem permissão para editar esta aula
    // (deve ser o criador ou admin)
    if (session.role !== 'admin') {
      const access = await verifyResourceAccess(
        'aulas_postagens',
        params.id,
        session,
        {
          ownerField: 'criadoPor',
          allowAdmin: true,
          allowMonitor: true,
          monitorOwnerField: 'criadoPor'
        }
      )

      if (!access.allowed) {
        return NextResponse.json(
          { error: access.reason || 'Sem permissão para editar esta aula' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()

    // Sanitizar campos de texto contra XSS
    const sanitizedBody = sanitizeObject(body, ['titulo', 'descricao', 'conteudo', 'resumo'])

    // Processar campos que precisam de conversão
    const updateData: any = { ...sanitizedBody }

    // Converter dataLiberacao para Date se for string
    if (updateData.dataLiberacao && typeof updateData.dataLiberacao === 'string') {
      updateData.dataLiberacao = new Date(updateData.dataLiberacao)
    }

    // Vínculo com /materiais: normalizado aqui para o documento nunca guardar
    // uma forma pela metade. `null` (ou id inválido) desfaz o vínculo — é como
    // o admin desliga a venda sem apagar a aula.
    if ('vinculoMaterial' in updateData) {
      const bruto = updateData.vinculoMaterial
      const materialId = String(bruto?.materialId || '')
      updateData.vinculoMaterial = materialId && isValidObjectId(materialId)
        ? {
            materialId,
            materialTitulo: String(bruto?.materialTitulo || '').slice(0, 160),
            liberaPorCompra: bruto?.liberaPorCompra !== false,
            conteudoDoMaterial: bruto?.conteudoDoMaterial === true,
          }
        : null
    }

    // Janela de encerramento (§12) — aula temporária. String vazia limpa.
    if ('ocultarEm' in updateData) {
      const valor = updateData.ocultarEm
      const data = valor ? new Date(valor) : null
      updateData.ocultarEm = data && !Number.isNaN(data.getTime()) ? data : null
    }

    // Regras de acesso (§15). O motor sempre soube avaliá-las, mas o editor só
    // oferecia `visibilidade`: eram regras que ninguém conseguia escrever.
    // `null` volta a aula para o comportamento legado, decidido por
    // `visibilidade` — é a saída de emergência de quem se enrolou no editor.
    if ('regrasAcesso' in updateData) {
      updateData.regrasAcesso = normalizarRegras(updateData.regrasAcesso)

      // `visibilidade` continua sendo escrito em sincronia. Outras partes ainda
      // leem esse campo — os metadados de /aulas/[id] decidem por ele se a
      // página é indexável — e pará-lo faria uma aula recém-trancada seguir se
      // anunciando como gratuita para fora (§45).
      if (updateData.regrasAcesso) {
        updateData.visibilidade = visibilidadeEquivalente(updateData.regrasAcesso)
      }
    }

    /*
     * Campos que podem ser LIMPOS.
     *
     * O laço abaixo apaga tudo que for `null`, o que é certo para campo não
     * enviado — mas errado para estes três, em que `null` é a instrução
     * "desfaz". Sem essa lista, dava para ligar o vínculo com um material e a
     * data de encerramento, e nunca mais desligar: a tela mandava `null`, o
     * laço engolia, e o valor antigo continuava valendo em silêncio.
     */
    const LIMPAVEIS = new Set(['vinculoMaterial', 'ocultarEm', 'regrasAcesso'])

    // Remover campos undefined e null
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || (updateData[key] === null && !LIMPAVEIS.has(key))) {
        delete updateData[key]
      }
    })

    // Buscar aula atual para saber quais campos precisam ser limpos
    const currentAula = await aulasCollection.findOne({ _id: new ObjectId(params.id) })

    // Se setorId foi alterado, limpar tópicos/subtópicos/módulos/submódulos abaixo dele
    if (updateData.setorId !== undefined && updateData.setorId !== currentAula?.setorId) {
      updateData.topicoId = null
      updateData.subtopicoId = null
      updateData.moduloId = null
      updateData.submoduloId = null
    }

    // Se topicoId foi alterado, limpar subtópicos/módulos/submódulos abaixo dele
    if (updateData.topicoId !== undefined && updateData.topicoId !== currentAula?.topicoId) {
      updateData.subtopicoId = null
      updateData.moduloId = null
      updateData.submoduloId = null
    }

    // Se subtopicoId foi alterado, limpar módulos/submódulos abaixo dele
    if (updateData.subtopicoId !== undefined && updateData.subtopicoId !== currentAula?.subtopicoId) {
      updateData.moduloId = null
      updateData.submoduloId = null
    }

    // Se moduloId foi alterado, limpar submódulos abaixo dele
    if (updateData.moduloId !== undefined && updateData.moduloId !== currentAula?.moduloId) {
      updateData.submoduloId = null
    }

    // Separar campos a remover (null) dos campos a atualizar
    const fieldsToUnset: any = {}
    const fieldsToSet: any = { atualizadoEm: new Date() }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null) {
        fieldsToUnset[key] = 1
      } else if (updateData[key] !== undefined) {
        fieldsToSet[key] = updateData[key]
      }
    })

    const updateQuery: any = { $set: fieldsToSet }
    if (Object.keys(fieldsToUnset).length > 0) {
      updateQuery.$unset = fieldsToUnset
    }

    const result = await aulasCollection.updateOne(
      { _id: new ObjectId(params.id) },
      updateQuery
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      )
    }

    const aula = await aulasCollection.findOne({
      _id: new ObjectId(params.id)
    })

    return NextResponse.json({ aula })
  } catch (error) {
    console.error('Erro ao atualizar aula:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar aula' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar ObjectId primeiro
    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    // Verificar autenticação e rate limit
    const security = await secureApiEndpoint(request, {
      rateLimit: 'WRITE',
      auth: {
        requireAuth: true,
        allowedRoles: ['admin'],
        allowSecondaryRoles: ['monitor']
      }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const session = security.session!
    const db = await getDb()
    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    // Verificar se o monitor tem permissão para deletar esta aula
    // (deve ser o criador ou admin)
    if (session.role !== 'admin') {
      const access = await verifyResourceAccess(
        'aulas_postagens',
        params.id,
        session,
        {
          ownerField: 'criadoPor',
          allowAdmin: true,
          allowMonitor: true,
          monitorOwnerField: 'criadoPor'
        }
      )

      if (!access.allowed) {
        return NextResponse.json(
          { error: access.reason || 'Sem permissão para deletar esta aula' },
          { status: 403 }
        )
      }
    }

    const result = await aulasCollection.deleteOne({
      _id: new ObjectId(params.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar aula:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar aula' },
      { status: 500 }
    )
  }
}
