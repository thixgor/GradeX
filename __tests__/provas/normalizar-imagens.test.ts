import { describe, expect, it } from 'vitest'
import {
  normalizarImagensDaQuestao,
  normalizarImagensDasQuestoes,
} from '@/lib/provas/normalizar-imagens'
import { TAMANHO_MAXIMO_DA_IMAGEM, TAMANHO_MINIMO_DA_IMAGEM } from '@/lib/questoes/imagens'
import type { Question } from '@/lib/types'

function questao(parcial: Partial<Question>): Question {
  return {
    id: 'q1',
    number: 1,
    type: 'multiple-choice',
    statement: 'Enunciado',
    command: '',
    alternatives: [],
    ...parcial,
  } as Question
}

describe('normalizarImagensDaQuestao', () => {
  it('não toca na questão que não mandou lista nenhuma', () => {
    // É a garantia de que o acervo inteiro sai ileso de um salvamento: um
    // endereço que a validação de hoje recusaria continua onde está.
    const antiga = questao({ imageUrl: 'uploads/sem-barra.png', imageSource: 'Atlas' })
    expect(normalizarImagensDaQuestao(antiga)).toBe(antiga)
  })

  it('sincroniza imageUrl e imageSource com a primeira imagem da lista', () => {
    const arrumada = normalizarImagensDaQuestao(
      questao({
        imageUrl: 'https://x/velha.png',
        imageSource: 'antiga',
        images: [
          { url: 'https://x/1.png', fonte: 'Netter' },
          { url: 'https://x/2.png' },
        ],
      }),
    )
    expect(arrumada.imageUrl).toBe('https://x/1.png')
    expect(arrumada.imageSource).toBe('Netter')
    expect(arrumada.images).toHaveLength(2)
  })

  it('apagar todas as imagens limpa o campo antigo', () => {
    const arrumada = normalizarImagensDaQuestao(
      questao({ imageUrl: 'https://x/velha.png', imageSource: 'antiga', images: [] }),
    )
    expect(arrumada.imageUrl).toBe('')
    expect(arrumada.imageSource).toBe('')
    expect(arrumada.images).toEqual([])
  })

  it('descarta endereço que não é imagem', () => {
    const arrumada = normalizarImagensDaQuestao(
      questao({ images: [{ url: 'javascript:alert(1)' }, { url: 'https://x/ok.png' }] }),
    )
    expect(arrumada.images?.map((i) => i.url)).toEqual(['https://x/ok.png'])
  })

  it('prende o tamanho aos limites', () => {
    const arrumada = normalizarImagensDaQuestao(
      questao({
        images: [
          { url: 'https://x/1.png', tamanho: -40 },
          { url: 'https://x/2.png', tamanho: 9999 },
        ],
      }),
    )
    expect(arrumada.images?.[0].tamanho).toBe(TAMANHO_MINIMO_DA_IMAGEM)
    expect(arrumada.images?.[1].tamanho).toBe(TAMANHO_MAXIMO_DA_IMAGEM)
  })

  it('um layout desconhecido vira o padrão', () => {
    const arrumada = normalizarImagensDaQuestao(
      questao({ images: [{ url: 'https://x/1.png' }], imagesLayout: 'grade' as never }),
    )
    expect(arrumada.imagesLayout).toBe('empilhado')
  })

  it('arruma a resposta comentada sem mexer no enunciado', () => {
    const arrumada = normalizarImagensDaQuestao(
      questao({
        imageUrl: 'uploads/sem-barra.png',
        explanationImages: [{ url: 'https://x/3.png', tamanho: 999 }],
      }),
    )
    // O enunciado não mandou lista: o campo antigo fica como estava.
    expect(arrumada.imageUrl).toBe('uploads/sem-barra.png')
    expect(arrumada.explanationImages?.[0].tamanho).toBe(TAMANHO_MAXIMO_DA_IMAGEM)
    expect(arrumada.explanationImagesLayout).toBe('empilhado')
  })
})

describe('normalizarImagensDasQuestoes', () => {
  it('corpo sem array vira lista vazia', () => {
    expect(normalizarImagensDasQuestoes(undefined)).toEqual([])
    expect(normalizarImagensDasQuestoes('nada' as never)).toEqual([])
  })

  it('arruma cada questão do array', () => {
    const arrumadas = normalizarImagensDasQuestoes([
      questao({ images: [{ url: 'https://x/1.png' }] }),
      questao({ id: 'q2', imageUrl: 'https://x/2.png' }),
    ])
    expect(arrumadas[0].imageUrl).toBe('https://x/1.png')
    expect(arrumadas[1].imageUrl).toBe('https://x/2.png')
    expect(arrumadas[1].images).toBeUndefined()
  })
})
