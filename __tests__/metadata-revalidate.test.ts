import { beforeEach, describe, expect, it, vi } from 'vitest'

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath: (path: string) => revalidatePath(path) }))

const {
  materialMetadataPaths,
  packageMetadataPaths,
  revalidateMetadataPaths,
} = await import('@/lib/metadata-revalidate')

/**
 * O preço no metatag vem do `generateMetadata` do layout, que é renderizado
 * junto com o HTML estático da rota. Se a escrita do /admin/materiais não
 * invalidar esses caminhos, o WhatsApp/Google continua lendo o preço antigo.
 */
beforeEach(() => {
  revalidatePath.mockReset()
})

describe('materialMetadataPaths', () => {
  it('inclui a página do material', () => {
    expect(materialMetadataPaths({ _id: '507f1f77bcf86cd799439011' })).toEqual([
      '/materiais/507f1f77bcf86cd799439011',
    ])
  })

  it('inclui o deck vinculado, que expõe o mesmo preço', () => {
    expect(
      materialMetadataPaths({ _id: '507f1f77bcf86cd799439011', linkedDeckSlug: 'anatomia-1' })
    ).toEqual(['/materiais/507f1f77bcf86cd799439011', '/flashcards/d/anatomia-1'])
  })

  it('ignora id e slug ausentes ou malformados', () => {
    expect(materialMetadataPaths(null)).toEqual([])
    expect(materialMetadataPaths({ _id: '', linkedDeckSlug: '' })).toEqual([])
    expect(materialMetadataPaths({ _id: 'abc/../../x', linkedDeckSlug: 'a?b=1' })).toEqual([])
  })
})

describe('packageMetadataPaths', () => {
  it('aponta para a página do pacote', () => {
    expect(packageMetadataPaths('507f1f77bcf86cd799439011')).toEqual([
      '/pacotes/507f1f77bcf86cd799439011',
    ])
  })

  it('devolve vazio sem id', () => {
    expect(packageMetadataPaths(null)).toEqual([])
  })
})

describe('revalidateMetadataPaths', () => {
  it('revalida cada caminho', () => {
    revalidateMetadataPaths(['/materiais/1', '/flashcards/d/x'])
    expect(revalidatePath.mock.calls).toEqual([['/materiais/1'], ['/flashcards/d/x']])
  })

  it('não deixa uma falha de revalidação derrubar a escrita já persistida', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    revalidatePath.mockImplementationOnce(() => {
      throw new Error('sem store de renderização')
    })

    expect(() => revalidateMetadataPaths(['/materiais/1', '/materiais/2'])).not.toThrow()
    expect(revalidatePath).toHaveBeenCalledTimes(2)
    erro.mockRestore()
  })
})
