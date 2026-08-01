import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  DRUG_COMPLETENESS_FIELDS,
  PATHOLOGY_COMPLETENESS_FIELDS,
  buildCatalogResponse,
  parseCatalogKind,
  parseIncludeCompleteness,
  resolveAdminAccess,
} from '@/lib/manual-clinico/catalog'

export const dynamic = 'force-dynamic'

// Identidade do item: o que a resposta realmente expoe.
const PATHOLOGY_IDENTITY_FIELDS = [
  'nome',
  'sinonimos',
  'slug',
  'cid10',
  'sistema',
  'status',
  'updatedAt',
]

const DRUG_IDENTITY_FIELDS = [
  'nome',
  'sinonimos',
  'slug',
  'classe_principal',
  'subclasse',
  'status',
  'updatedAt',
]

/**
 * Projecao = identidade + campos usados no calculo de completude.
 * Os campos de conteudo sao lidos apenas para verificar se estao
 * preenchidos; nenhum deles vai para a resposta (a serializacao em
 * lib/manual-clinico/catalog monta a saida campo a campo).
 */
function buildProjection(
  identityFields: string[],
  completenessFields: readonly string[],
): Record<string, 1> {
  const projection: Record<string, 1> = { _id: 1 }
  for (const field of [...identityFields, ...completenessFields]) {
    projection[field] = 1
  }
  return projection
}

// GET - Catalogo de patologias e farmacos (somente leitura)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const access = resolveAdminAccess(session)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(request.url)

    const kind = parseCatalogKind(searchParams.get('kind'))
    if (!kind) {
      return NextResponse.json(
        { error: 'Parametro "kind" invalido. Use all, pathology ou drug.' },
        { status: 400 },
      )
    }

    const includeCompleteness = parseIncludeCompleteness(
      searchParams.get('includeCompleteness'),
    )
    if (includeCompleteness === null) {
      return NextResponse.json(
        { error: 'Parametro "includeCompleteness" invalido. Use true ou false.' },
        { status: 400 },
      )
    }

    const db = await getDb()
    const wantsPathologies = kind === 'all' || kind === 'pathology'
    const wantsDrugs = kind === 'all' || kind === 'drug'

    const [pathologyDocs, drugDocs] = await Promise.all([
      wantsPathologies
        ? db
            .collection('patologias')
            .find(
              {},
              {
                projection: buildProjection(
                  PATHOLOGY_IDENTITY_FIELDS,
                  PATHOLOGY_COMPLETENESS_FIELDS,
                ),
              },
            )
            .sort({ nome: 1 })
            .toArray()
        : Promise.resolve([]),
      wantsDrugs
        ? db
            .collection('medicamentos')
            .find(
              {},
              {
                projection: buildProjection(
                  DRUG_IDENTITY_FIELDS,
                  DRUG_COMPLETENESS_FIELDS,
                ),
              },
            )
            .sort({ classe_principal: 1, subclasse: 1, nome: 1 })
            .toArray()
        : Promise.resolve([]),
    ])

    return NextResponse.json(
      buildCatalogResponse({
        kind,
        includeCompleteness,
        pathologyDocs: pathologyDocs as Record<string, any>[],
        drugDocs: drugDocs as Record<string, any>[],
      }),
    )
  } catch (error) {
    console.error('Erro ao montar catalogo do Manual Clinico:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
