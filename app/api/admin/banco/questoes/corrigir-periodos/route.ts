import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  formatarPeriodoLetivo,
  lerAnoDoTitulo,
  lerPeriodoLetivo,
} from '@/lib/banco/periodo-letivo'

export const dynamic = 'force-dynamic'

/** Questões relidas por chamada. A correção anda em ondas, como a importação. */
const POR_ONDA = 1000

/**
 * Reler o período letivo do nome da prova nas questões que já estão no banco.
 *
 * A importação passou a tirar o ano do TÍTULO ("N1 SOI I - 2023.2") em vez da
 * data do documento — a data diz quando a prova foi cadastrada aqui, e o acervo
 * antigo foi digitado anos depois do que aconteceu. Ver
 * lib/banco/periodo-letivo.ts.
 *
 * As questões importadas ANTES disso carregam o ano errado. Reimportar tudo
 * resolveria, mas é caro e mexe em conteúdo que está certo. Aqui a correção é
 * cirúrgica: o título da prova continua guardado em `fonte`, então dá para
 * reler o período sem tocar em enunciado, gabarito ou estatística.
 *
 * Só escreve o que muda: quem já está com o período certo não entra no lote.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const offset = Math.max(0, Number(body?.offset) || 0)

    const db = await getDb()
    const filtro = { fonte: { $type: 'string', $ne: '' } }

    const total = await db.collection('banco_questoes').countDocuments(filtro)

    const docs = await db
      .collection('banco_questoes')
      // A ordem por `_id` é estável entre as ondas: sem ela a onda seguinte
      // repetiria questões e pularia outras.
      .find(filtro, { projection: { fonte: 1, ano: 1, semestre: 1, periodoLetivo: 1 } })
      .sort({ _id: 1 })
      .skip(offset)
      .limit(POR_ONDA)
      .toArray()

    const operacoes: any[] = []
    let semPeriodo = 0

    for (const doc of docs as any[]) {
      const periodo = lerPeriodoLetivo(doc.fonte)
      const ano = periodo ? periodo.ano : lerAnoDoTitulo(doc.fonte)

      if (!ano) {
        // Título que não diz nada: o que estiver gravado continua valendo —
        // apagar um ano vindo da data deixaria a questão sem nenhuma data.
        semPeriodo++
        continue
      }

      const semestre = periodo ? periodo.semestre : null
      const rotulo = periodo ? formatarPeriodoLetivo(periodo) : null

      const igual =
        (doc.ano ?? null) === ano &&
        (doc.semestre ?? null) === semestre &&
        (doc.periodoLetivo ?? null) === rotulo
      if (igual) continue

      operacoes.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { ano, semestre, periodoLetivo: rotulo, updatedAt: new Date() } },
        },
      })
    }

    if (operacoes.length > 0) {
      await db.collection('banco_questoes').bulkWrite(operacoes, { ordered: false })
    }

    const proximoOffset = offset + docs.length

    return NextResponse.json({
      total,
      lidas: docs.length,
      corrigidas: operacoes.length,
      semPeriodo,
      proximoOffset,
      fim: docs.length === 0 || proximoOffset >= total,
    })
  } catch (error) {
    console.error('Erro ao corrigir períodos das questões:', error)
    return NextResponse.json({ error: 'Erro ao corrigir os períodos' }, { status: 500 })
  }
}
