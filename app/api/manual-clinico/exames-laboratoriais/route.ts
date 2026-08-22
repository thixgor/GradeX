import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'
import { EXAMES, MARCADORES, SISTEMAS, resumoDoAcervo } from '@/lib/exames-laboratoriais'

export const dynamic = 'force-dynamic'

export interface ItemDoCatalogo {
  id: string
  nome: string
  sigla?: string
  /** O que o marcador é, em uma linha — é o que a vitrine promete. */
  resumo: string
  grupo: string
}

export interface ResumoDosExames {
  marcadores: number
  exames: number
  sistemas: number
  padroes: number
  doencas: number
  comparacoes: number
  mecanismos: number
  cadeias: number
  /** Nome e resumo de cada marcador — a lista do que se recebe. */
  lista: ItemDoCatalogo[]
  /** Os painéis, para a vitrine mostrar o que existe montado. */
  paineis: { id: string; nome: string; total: number }[]
  sistemasDoCorpo: { id: string; nome: string; chamada: string }[]
}

/**
 * Catálogo público da central de Exames Laboratoriais.
 *
 * A seção é privativa, mas a lista do que existe não. Quem está decidindo se
 * assina precisa saber exatamente o que vai receber — marcador por marcador,
 * com o resumo de cada um — e não uma contagem redonda. O que fica do outro
 * lado do pagamento é o que constitui o produto: a fisiologia, os mecanismos de
 * alteração, as cadeias causais, os diferenciais, os padrões e o Laboratório
 * Virtual.
 *
 * Cache de módulo: o catálogo é estático e derivado de arquivos do repositório.
 * Recalcular a cada requisição significaria varrer o acervo inteiro à toa.
 */
let cacheResumo: ResumoDosExames | null = null

function montarResumo(): ResumoDosExames {
  if (cacheResumo) return cacheResumo

  const numeros = resumoDoAcervo()
  cacheResumo = {
    ...numeros,
    lista: MARCADORES.map((m) => ({
      id: m.id,
      nome: m.nome,
      sigla: m.sigla,
      resumo: m.resumo,
      grupo: m.grupo,
    })),
    paineis: EXAMES.map((e) => ({
      id: e.id,
      nome: e.nome,
      total: e.blocos.reduce((n, b) => n + b.marcadores.length, 0),
    })),
    sistemasDoCorpo: SISTEMAS.map((s) => ({ id: s.id, nome: s.nome, chamada: s.chamada })),
  }
  return cacheResumo
}

/**
 * Verificação de acesso aos Exames Laboratoriais.
 *
 * Mesma regra das demais seções privativas do Manual Clínico: liberada para
 * quem comprou o Manual e para contas Plus+, ambos cobertos por
 * `hasFullAccess`. A decisão vive num lugar só — `getManualClinicoAccess` — e
 * esta rota apenas a repassa.
 */
export async function GET() {
  try {
    const [db, session] = await Promise.all([getDb(), getSession()])
    const config = await getManualClinicoConfig(db)
    const access = await getManualClinicoAccess(db, session, config, 'exames')

    return NextResponse.json({
      isAuthenticated: !!session?.userId,
      access: {
        hasFullAccess: access.hasFullAccess,
        reason: access.reason,
        includedPlan: access.includedPlan ?? null,
      },
      product: serializeManualClinicoProduct(config),
      resumo: montarResumo(),
    })
  } catch (error) {
    console.error('Erro ao verificar acesso aos Exames Laboratoriais:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
