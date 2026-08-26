import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { secureApiEndpoint } from '@/lib/api-security'
import { audit } from '@/lib/payments/audit'
import {
  CARGOS_EMBUTIDOS_IDS,
  sanitizarRegistroDeCargos,
  slugDeCargo,
  validarIdDeCargo,
} from '@/lib/cargos'
import { invalidarRegistroDeCargos, lerRegistroDeCargos } from '@/lib/cargos-server'

export const dynamic = 'force-dynamic'

/**
 * O registro de cargos, para a tela `/admin/cargos`.
 *
 * A leitura devolve o documento completo (com o bloco de permissões inteiro),
 * ao contrário de `/api/cargos`, que devolve só o recorte que o aluno pode ver.
 */
export async function GET(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'ADMIN',
    auth: { requireAuth: true, allowedRoles: ['admin'] },
  })
  if (!security.success || security.errorResponse) return security.errorResponse

  try {
    const cargos = await lerRegistroDeCargos()
    return NextResponse.json({ cargos })
  } catch (erro) {
    console.error('[admin/cargos] falha ao ler:', erro)
    return NextResponse.json({ error: 'Erro ao carregar os cargos' }, { status: 500 })
  }
}

/**
 * Grava o registro inteiro de uma vez.
 *
 * A tela manda a lista completa, e não um cargo por vez, porque a ordem faz
 * parte do dado e reordenar item a item multiplicaria as chances de o registro
 * ficar num estado intermediário incoerente. `sanitizarRegistroDeCargos` é o
 * que garante que o que entra é válido: normaliza cada campo, remescla os
 * embutidos (que não podem sumir nem virar apagáveis) e renumera a ordem.
 */
export async function PUT(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'ADMIN',
    auth: { requireAuth: true, allowedRoles: ['admin'] },
  })
  if (!security.success || security.errorResponse) return security.errorResponse
  const session = security.session!

  try {
    const body = await request.json()
    const recebidos = body?.cargos

    if (!Array.isArray(recebidos)) {
      return NextResponse.json({ error: 'Envie um array em `cargos`.' }, { status: 400 })
    }

    /*
     * Valida os ids ANTES de sanitizar.
     *
     * `sanitizarRegistroDeCargos` é tolerante de propósito (ele existe para
     * fazer um documento velho do Mongo sobreviver a mudanças de código), então
     * ele descarta silenciosamente o que não entende. Silêncio é o certo na
     * leitura e o errado aqui: quem acabou de digitar um id inválido precisa
     * ver a recusa, não descobrir depois que o cargo não foi salvo.
     */
    const vistos: string[] = []
    for (const bruto of recebidos) {
      const id = slugDeCargo(String(bruto?.id || ''))
      const veredicto = validarIdDeCargo(id, vistos)
      if (!veredicto.valido) {
        return NextResponse.json(
          { error: `Cargo "${bruto?.nome || bruto?.id || '?'}": ${veredicto.motivo}` },
          { status: 400 },
        )
      }
      vistos.push(id)
    }

    // Um embutido que sumiu da lista enviada não é apagado — `mesclar` o traz
    // de volta —, mas vale avisar quem chamou em vez de fingir que obedeceu.
    const embutidosFaltando = CARGOS_EMBUTIDOS_IDS.filter(id => !vistos.includes(id))

    const db = await getDb()
    const anteriores = await lerRegistroDeCargos(db)
    const cargos = sanitizarRegistroDeCargos(recebidos)

    await db.collection('admin_settings').updateOne(
      {},
      { $set: { cargos, atualizadoEm: new Date() } },
      { upsert: true },
    )

    // A tela precisa ver o efeito na requisição seguinte, não daqui a 30s.
    invalidarRegistroDeCargos()

    await audit({
      action: 'cargos_updated',
      actorUserId: session.userId,
      resourceType: 'cargos',
      metadata: {
        total: cargos.length,
        criados: cargos.filter(c => !anteriores.some(a => a.id === c.id)).map(c => c.id),
        apagados: anteriores.filter(a => !cargos.some(c => c.id === a.id)).map(a => a.id),
        modulares: cargos.filter(c => c.permissoes.ativo).map(c => c.id),
      },
    }).catch(() => {})

    return NextResponse.json({
      cargos,
      aviso: embutidosFaltando.length
        ? `Cargos de fábrica não podem ser apagados e foram mantidos: ${embutidosFaltando.join(', ')}.`
        : undefined,
    })
  } catch (erro) {
    console.error('[admin/cargos] falha ao gravar:', erro)
    return NextResponse.json({ error: 'Erro ao salvar os cargos' }, { status: 500 })
  }
}

/**
 * Quantas contas usam cada cargo.
 *
 * A tela precisa disto para poder avisar antes de apagar: "3 alunos estão neste
 * cargo e cairiam para o gratuito". Fica no POST por ser uma consulta cara
 * demais para acompanhar toda leitura do registro.
 */
export async function POST(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'ADMIN',
    auth: { requireAuth: true, allowedRoles: ['admin'] },
  })
  if (!security.success || security.errorResponse) return security.errorResponse

  try {
    const db = await getDb()
    const registro = await lerRegistroDeCargos(db)

    const contagem = await db
      .collection('users')
      .aggregate<{ _id: string | null; total: number }>([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: '$accountType', total: { $sum: 1 } } },
      ])
      .toArray()

    // `accountType` ausente é conta gratuita — o campo só é gravado quando
    // alguém sai do piso, então somar os dois é o que dá o número real.
    const porCargo: Record<string, number> = {}
    for (const linha of contagem) {
      const id = linha._id || 'gratuito'
      porCargo[id] = (porCargo[id] || 0) + linha.total
    }
    // Os aliases legados aparecem como Plus+ na interface; some com eles aqui
    // também, ou o "Plus+" da tela mostraria menos gente do que realmente tem.
    for (const legado of ['premium', 'essential']) {
      if (porCargo[legado]) {
        porCargo.plus = (porCargo.plus || 0) + porCargo[legado]
        delete porCargo[legado]
      }
    }

    /** Contas presas num cargo que não existe mais no registro. */
    const orfaos = Object.keys(porCargo).filter(id => !registro.some(c => c.id === id))

    return NextResponse.json({ porCargo, orfaos })
  } catch (erro) {
    console.error('[admin/cargos] falha ao contar contas:', erro)
    return NextResponse.json({ error: 'Erro ao contar as contas' }, { status: 500 })
  }
}