import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  checkCatalogNames,
  parseCatalogCheckKind,
  resolveAdminAccess,
  validateCatalogCheckNames,
} from '@/lib/manual-clinico/catalog'

export const dynamic = 'force-dynamic'

// Somente identidade: a verificacao nao devolve conteudo medico.
const CHECK_PROJECTION = { _id: 1, nome: 1, sinonimos: 1, slug: 1 }

// POST - Verificar quais nomes ja existem no catalogo (somente leitura)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const access = resolveAdminAccess(session)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
    }

    const kind = parseCatalogCheckKind((body as any).kind)
    if (!kind) {
      return NextResponse.json(
        { error: 'Parametro "kind" invalido. Use pathology ou drug.' },
        { status: 400 },
      )
    }

    const names = validateCatalogCheckNames((body as any).names)
    if (!names.ok) {
      return NextResponse.json({ error: names.error }, { status: 400 })
    }

    const db = await getDb()
    const collection = kind === 'pathology' ? 'patologias' : 'medicamentos'
    const docs = await db
      .collection(collection)
      .find({}, { projection: CHECK_PROJECTION })
      .toArray()

    return NextResponse.json(
      checkCatalogNames(names.names, docs as Record<string, any>[]),
    )
  } catch (error) {
    console.error('Erro ao verificar catalogo do Manual Clinico:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
