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
 * Projecao = identidade, mais os campos de conteudo SO quando a
 * completude foi pedida.
 *
 * Os campos de completude sao os maiores do schema (fisiopatologia,
 * mecanismo_acao_detalhado, tratamento...). Le-los sempre significaria
 * transferir alguns MB do Atlas em toda chamada, inclusive quando o
 * chamador so quer a lista de nomes para deduplicar. Eles continuam
 * servindo apenas para checar se estao preenchidos — nenhum deles vai
 * para a resposta, que e montada campo a campo em lib/manual-clinico.
 */
function buildProjection(
  identityFields: string[],
  completenessFields: readonly string[],
  includeCompleteness: boolean,
): Record<string, 1> {
  const projection: Record<string, 1> = { _id: 1 }
  const fields = includeCompleteness
    ? [...identityFields, ...completenessFields]
    : identityFields
  for (const field of fields) {
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

    // Sem .sort() no Mongo de proposito: nao ha indice em
    // `patologias.nome` e o indice composto de `medicamentos` so e
    // criado no ramo de desenvolvimento de lib/mongodb.ts. Um sort nao
    // indexado e sem limit e um blocking sort com teto de 32 MB, que
    // derruba a query conforme a colecao cresce. A ordenacao acontece
    // em JS, sobre documentos que ja estao em memoria.
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
                  includeCompleteness,
                ),
              },
            )
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
                  includeCompleteness,
                ),
              },
            )
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
