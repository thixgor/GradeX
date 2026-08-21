import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  auditarReferenciasDeTrilhas,
  indexarAulasPorTitulo,
  resumirAuditoria,
} from '@/lib/ensino/auditoria-trilhas'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import { lerTrilhas, podeEditarEnsino } from '@/lib/ensino/repositorio'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * A auditoria de referências de aula nas Trilhas.
 *
 * GET produz só o relatório — nenhuma escrita. POST aplica correções, uma a
 * uma e sempre explícitas: o corpo lista exatamente quais `(trilhaId,
 * itemId) → refId novo` trocar. Não existe um "corrigir tudo" no servidor
 * sem a lista — é a tela que decide quais sugestões aceitar (todas as
 * inequívocas, de um clique só, ou uma por vez), e manda a lista final; a
 * rota nunca decide sozinha o que é "óbvio o bastante" para aplicar.
 *
 * Ver o comentário longo em lib/ensino/auditoria-trilhas.ts para o raciocínio
 * completo — por que órfão vira "sem título salvo" em vez de apagado, por
 * que a recuperação some quando ambígua, etc.
 */
export async function GET() {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const [trilhas, aulas] = await Promise.all([
      lerTrilhas(db, {}),
      db
        .collection(COLECOES.aulas)
        .find({}, { projection: { titulo: 1 } })
        .toArray(),
    ])

    const idsDeAulasVivas = new Set(aulas.map((a: any) => String(a._id)))
    const indice = indexarAulasPorTitulo(
      aulas.map((a: any) => ({ _id: String(a._id), titulo: a.titulo || '' })),
    )

    const referencias = auditarReferenciasDeTrilhas(
      trilhas.map((t) => ({ _id: t._id, titulo: t.titulo, slug: t.slug, etapas: t.etapas })),
      idsDeAulasVivas,
      indice,
    )

    return NextResponse.json(
      {
        resumo: resumirAuditoria(trilhas.length, referencias),
        // Só o que precisa de atenção — milhares de "válida" não ajudam
        // ninguém a decidir nada, e tornariam a resposta pesada à toa.
        problemas: referencias.filter((r) => r.status !== 'valida'),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (erro) {
    console.error('[ensino/trilhas/auditoria] GET:', erro)
    return NextResponse.json({ error: 'Erro ao auditar as Trilhas' }, { status: 500 })
  }
}

interface Correcao {
  trilhaId: string
  itemId: string
  refIdNovo: string
}

/**
 * Aplica correções de `refId` — nunca apaga item, nunca toca progresso.
 *
 * A ÚNICA coisa que muda no banco é `etapas[].itens[].refId` do item
 * apontado. `aulas_progresso` é indexado por `(usuarioId, aulaId)`, onde
 * `aulaId` é o id da AULA, não a posição dela numa Trilha — trocar qual aula
 * uma etapa referencia não move nem apaga progresso nenhum, porque o
 * progresso nunca esteve ligado à etapa (§14: a relação editorial pode
 * mudar, o histórico do aluno continua na aula).
 */
export async function POST(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const corpo = await request.json().catch(() => ({}))
    const correcoes: Correcao[] = Array.isArray(corpo?.correcoes) ? corpo.correcoes : []
    if (correcoes.length === 0) {
      return NextResponse.json({ error: 'Nenhuma correção enviada.' }, { status: 400 })
    }

    const porTrilha = new Map<string, Correcao[]>()
    for (const c of correcoes) {
      if (!c?.trilhaId || !c?.itemId || !ObjectId.isValid(c?.refIdNovo)) continue
      const lista = porTrilha.get(c.trilhaId) || []
      lista.push(c)
      porTrilha.set(c.trilhaId, lista)
    }

    let itensCorrigidos = 0
    let trilhasAlteradas = 0

    for (const [trilhaId, lista] of porTrilha) {
      if (!ObjectId.isValid(trilhaId)) continue

      const trilha = await db
        .collection(COLECOES.trilhas)
        .findOne({ _id: new ObjectId(trilhaId) })
      if (!trilha) continue

      const porItemId = new Map(lista.map((c) => [c.itemId, c.refIdNovo]))
      let mudou = false

      const etapas = (trilha.etapas || []).map((etapa: any) => ({
        ...etapa,
        itens: (etapa.itens || []).map((item: any) => {
          const novo = porItemId.get(item.id)
          if (!novo || item.refId === novo) return item
          mudou = true
          itensCorrigidos += 1
          return { ...item, refId: novo }
        }),
      }))

      if (mudou) {
        await db
          .collection(COLECOES.trilhas)
          .updateOne({ _id: new ObjectId(trilhaId) }, { $set: { etapas, atualizadoEm: new Date() } })
        trilhasAlteradas += 1
      }
    }

    return NextResponse.json({ ok: true, trilhasAlteradas, itensCorrigidos })
  } catch (erro) {
    console.error('[ensino/trilhas/auditoria] POST:', erro)
    return NextResponse.json({ error: 'Erro ao aplicar as correções' }, { status: 500 })
  }
}
