import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { avaliarAcessoAula } from '@/lib/aulas/acesso'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { lerEmAndamento } from '@/lib/aulas/repositorio-progresso'
import { formatarTempo, podeRetomar } from '@/lib/aulas/progresso'
import type { AulaModulo, AulaPostagem, AulaSetor } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * "Continue estudando" (§35) — o que o aluno estava assistindo.
 *
 * A pergunta que esta rota responde é a primeira que a pessoa faz ao abrir a
 * plataforma: "onde eu parei?". Devolve pronto para a tela: título da aula,
 * curso, módulo, percentual e o texto da retomada ("Continuar de 18:42").
 *
 * Reavalia o acesso de cada item: uma assinatura pode ter vencido desde a
 * última sessão, e continuar oferecendo "continuar de 18:42" numa aula que a
 * pessoa não pode mais abrir é prometer uma porta fechada.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ itens: [] })

    const db = await getDb()
    const emAndamento = await lerEmAndamento(db, session.userId, 12)
    if (emAndamento.length === 0) return NextResponse.json({ itens: [] })

    const ids = emAndamento.map((p) => p.aulaId).filter(ObjectId.isValid)
    if (ids.length === 0) return NextResponse.json({ itens: [] })

    const [aulas, usuario] = await Promise.all([
      db.collection<AulaPostagem>('aulas_postagens')
        .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } as any })
        .toArray(),
      montarContextoDoUsuario(db, session),
    ])

    const porId = new Map(aulas.map((a) => [String(a._id), a]))

    // Nomes de curso/módulo saem de uma consulta só, e não uma por aula.
    const setorIds = Array.from(new Set(aulas.map((a) => a.setorId).filter(Boolean) as string[]))
    const moduloIds = Array.from(new Set(aulas.map((a) => a.moduloId).filter(Boolean) as string[]))
    const [setores, modulos] = await Promise.all([
      setorIds.length
        ? db.collection<AulaSetor>('aulas_setores')
            .find({ _id: { $in: setorIds.filter(ObjectId.isValid).map((id) => new ObjectId(id)) } as any })
            .toArray()
        : [],
      moduloIds.length
        ? db.collection<AulaModulo>('aulas_modulos')
            .find({ _id: { $in: moduloIds.filter(ObjectId.isValid).map((id) => new ObjectId(id)) } as any })
            .toArray()
        : [],
    ])
    const nomeSetor = new Map(setores.map((s) => [String(s._id), s.nome]))
    const nomeModulo = new Map(modulos.map((m) => [String(m._id), m.nome]))

    const agora = new Date()
    const itens = emAndamento
      .map((progresso) => {
        const aula = porId.get(progresso.aulaId)
        if (!aula) return null

        const veredito = avaliarAcessoAula(aula as any, usuario, agora)
        if (!veredito.liberado) return null

        return {
          aulaId: progresso.aulaId,
          titulo: aula.titulo,
          capa: aula.capa || null,
          curso: aula.setorId ? nomeSetor.get(aula.setorId) || null : null,
          modulo: aula.moduloId ? nomeModulo.get(aula.moduloId) || null : null,
          percentual: progresso.percentual,
          posicaoSegundos: progresso.posicaoSegundos,
          retomar: podeRetomar(progresso),
          retomarLabel: podeRetomar(progresso)
            ? `Continuar de ${formatarTempo(progresso.posicaoSegundos)}`
            : 'Continuar aula',
          href: `/aulas/${progresso.aulaId}`,
          atualizadoEm: progresso.atualizadoEm,
        }
      })
      .filter(Boolean)
      .slice(0, 6)

    return NextResponse.json({ itens }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[aulas/continuar] erro:', error)
    // A tela inicial não cai por causa da faixa de retomada.
    return NextResponse.json({ itens: [] })
  }
}
