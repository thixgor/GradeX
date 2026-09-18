import { describe, it, expect } from 'vitest'

import { ensureIndexes } from '@/lib/mongodb-indexes'

/**
 * As coleções de /materiais não tinham índice nenhum além do `_id`.
 *
 * Toda vez que alguém abria a página, as quatro consultas que a montam —
 * acervo, pastas, pacotes e a posse da conta — varriam a coleção inteira. A
 * pior é `material_purchases`: ela cresce a cada compra de cada aluno, então a
 * página ia ficando mais lenta com o tempo mesmo sem entrar material novo.
 *
 * Índice aqui é passo de implantação (`npm run db:indexes`), não de requisição,
 * e por isso é fácil alguém apagar uma linha desta lista sem sentir nada em
 * desenvolvimento, onde a base é pequena. Este teste é o alarme.
 */

type IndiceCriado = { colecao: string; chaves: any; opcoes: any }

async function indicesCriados(): Promise<IndiceCriado[]> {
  const criados: IndiceCriado[] = []
  const db: any = {
    collection: (colecao: string) => ({
      createIndex: async (chaves: any, opcoes: any = {}) => {
        criados.push({ colecao, chaves, opcoes })
      },
    }),
  }
  await ensureIndexes(db)
  return criados
}

function chavesDe(criados: IndiceCriado[], colecao: string): string[] {
  return criados
    .filter((i) => i.colecao === colecao)
    .map((i) => Object.keys(i.chaves).join(','))
}

describe('índices das coleções de materiais', () => {
  it('cobre o acervo com filtro e ordenação no mesmo índice', async () => {
    const chaves = chavesDe(await indicesCriados(), 'materials')
    // A listagem pública filtra por isHidden e ordena por destaque/ordem/data:
    // sem os três no mesmo índice sobra um estágio de ordenação em memória.
    expect(chaves).toContain('isHidden,isFeatured,order,createdAt')
    // Recorte de preço da barra de /materiais.
    expect(chaves).toContain('isHidden,pricing,isFeatured,order,createdAt')
    // O admin lista sem recorte de visibilidade, então precisa do seu próprio.
    expect(chaves).toContain('isFeatured,order,createdAt')
    // Entrar numa pasta e o recorte por módulo.
    expect(chaves).toContain('folderId,isHidden')
    expect(chaves).toContain('moduloId,isHidden')
  })

  it('cobre a posse pelas duas identidades que a gravam', async () => {
    const chaves = chavesDe(await indicesCriados(), 'material_purchases')
    // Id da conta: o caminho normal.
    expect(chaves).toContain('userId,status,itemType')
    // E-mail: a reserva para liberação manual gravada sem userId.
    expect(chaves).toContain('userEmail,status,itemType')
  })

  it('cobre pastas e pacotes', async () => {
    const criados = await indicesCriados()
    expect(chavesDe(criados, 'material_folders')).toContain('isHidden,order,name')
    expect(chavesDe(criados, 'material_folders')).toContain('parentFolderId,order,name')
    expect(chavesDe(criados, 'material_packages')).toContain('isHidden,isFeatured,order,createdAt')
  })

  it('cobre o deck vinculado e a contagem de cartas', async () => {
    const criados = await indicesCriados()
    // Material do tipo flashcard_deck faz o catálogo perguntar pelo deck ligado
    // a ele e contar as cartas — as duas no caminho da página.
    expect(chavesDe(criados, 'flashcardManualDecks')).toContain('linkedMaterialId')
    expect(chavesDe(criados, 'flashcardManualCards')).toContain('deckId')
  })
})
