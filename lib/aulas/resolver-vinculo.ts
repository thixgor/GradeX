import { ObjectId, type Db } from 'mongodb'
import { regrasComVinculo, resolverConteudo, type MaterialDeVideo } from '@/lib/aulas/vinculo-material'
import type { RegrasDeAcessoAula } from '@/lib/aulas/acesso'

/**
 * Resolve os vínculos Aulas ↔ /materiais contra o banco.
 *
 * Fica separado de `vinculo-material.ts` (puro) pelo mesmo motivo de sempre: lá
 * é a regra, aqui é a consulta. O ponto delicado deste arquivo é o custo — ele
 * roda na listagem inteira de aulas, então tudo é resolvido **em lote**. Uma
 * consulta por aula transformaria a abertura da biblioteca em dezenas de idas
 * ao banco.
 */

export interface VinculosResolvidos {
  /** materialId → material (só os campos que interessam). */
  materiais: Map<string, MaterialDeVideo>
  /** materialId → pacotes que o contêm. */
  pacotesPorMaterial: Map<string, string[]>
}

export const VINCULOS_VAZIOS: VinculosResolvidos = {
  materiais: new Map(),
  pacotesPorMaterial: new Map(),
}

/**
 * Carrega, de uma vez, tudo que os vínculos de um conjunto de aulas precisam.
 *
 * Devolve mapas vazios quando não há vínculo nenhum — o caso mais comum hoje,
 * e que assim não custa consulta alguma.
 */
export async function resolverVinculosEmLote(
  db: Db,
  aulas: Array<{ vinculoMaterial?: { materialId?: string } | null }>,
): Promise<VinculosResolvidos> {
  const materialIds = Array.from(
    new Set(
      aulas
        .map((a) => a.vinculoMaterial?.materialId)
        .filter((id): id is string => Boolean(id) && ObjectId.isValid(String(id))),
    ),
  )
  if (materialIds.length === 0) return VINCULOS_VAZIOS

  const objectIds = materialIds.map((id) => new ObjectId(id))

  const [materiais, pacotes] = await Promise.all([
    db.collection('materials')
      .find(
        { _id: { $in: objectIds } as any },
        { projection: { title: 1, type: 1, downloadUrl: 1, previewUrl: 1, coverImage: 1, videoDuration: 1 } },
      )
      .toArray(),
    // Pacotes que contêm qualquer um destes materiais: é o que faz "comprei o
    // combo" liberar a aula sem o admin cadastrar combo por combo.
    db.collection('material_packages')
      .find(
        { materialIds: { $in: materialIds } },
        { projection: { materialIds: 1 } },
      )
      .limit(300)
      .toArray(),
  ])

  const pacotesPorMaterial = new Map<string, string[]>()
  for (const pacote of pacotes) {
    for (const materialId of (pacote as any).materialIds || []) {
      const chave = String(materialId)
      if (!materialIds.includes(chave)) continue
      const atual = pacotesPorMaterial.get(chave) || []
      atual.push(String(pacote._id))
      pacotesPorMaterial.set(chave, atual)
    }
  }

  return {
    materiais: new Map(materiais.map((m) => [String(m._id), m as MaterialDeVideo])),
    pacotesPorMaterial,
  }
}

/**
 * Aplica o vínculo sobre uma aula: regras de acesso somadas e conteúdo
 * resolvido na fonte certa.
 *
 * Devolve a aula pronta para seguir para o motor de acesso — que continua sendo
 * quem decide, sem saber que existe material nenhum.
 */
export function aplicarVinculo<T extends Record<string, any>>(
  aula: T,
  vinculos: VinculosResolvidos,
): T & { regrasAcesso: RegrasDeAcessoAula; origemDoConteudo: 'aula' | 'material' } {
  const materialId = aula.vinculoMaterial?.materialId
  const material = materialId ? vinculos.materiais.get(String(materialId)) : null
  const pacoteIds = materialId ? vinculos.pacotesPorMaterial.get(String(materialId)) || [] : []

  const regrasAcesso = regrasComVinculo(aula as any, pacoteIds)
  const conteudo = resolverConteudo(aula as any, aula.vinculoMaterial, material)

  return {
    ...aula,
    regrasAcesso,
    videoEmbed: conteudo.videoEmbed,
    capa: conteudo.capa ?? aula.capa,
    origemDoConteudo: conteudo.origem,
  }
}
