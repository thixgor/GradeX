import { describe, expect, it } from 'vitest'

import { condicaoDeTexto, listaDeTextos, textoCurto, MAX_TERMOS_MONGO } from '@/lib/busca-plataforma/mongo'

/** Roda o filtro gerado contra um documento, como o Mongo faria. */
function casa(filtro: ReturnType<typeof condicaoDeTexto>, doc: Record<string, unknown>) {
  return filtro.$and.every(bloco =>
    bloco.$or.some(condicao => {
      const [campo, { $regex, $options }] = Object.entries(condicao)[0]
      const valor = doc[campo]
      const regex = new RegExp($regex, $options)
      if (Array.isArray(valor)) return valor.some(v => typeof v === 'string' && regex.test(v))
      return typeof valor === 'string' && regex.test(valor)
    }),
  )
}

describe('filtro de texto do Mongo', () => {
  const filtro = (termos: string[]) => condicaoDeTexto(['nome', 'sinonimos'], termos)

  it('encontra o termo sem acento dentro do texto acentuado', () => {
    expect(casa(filtro(['cardiaca']), { nome: 'Insuficiência cardíaca' })).toBe(true)
  })

  it('encontra pelo começo da palavra, antes de terminar de digitar', () => {
    expect(casa(filtro(['cardio']), { nome: 'Cardiologia intervencionista' })).toBe(true)
  })

  it('procura em todos os campos declarados, inclusive listas', () => {
    expect(casa(filtro(['ic']), { nome: 'Insuficiência cardíaca', sinonimos: ['IC', 'falência'] })).toBe(true)
  })

  it('exige TODOS os termos, ainda que em campos diferentes', () => {
    const doc = { nome: 'Insuficiência cardíaca', sinonimos: ['congestiva'] }
    expect(casa(filtro(['cardiaca', 'congestiva']), doc)).toBe(true)
    expect(casa(filtro(['cardiaca', 'renal']), doc)).toBe(false)
  })

  it('não deixa o usuário injetar expressão regular', () => {
    // Um ponto digitado é um ponto, não "qualquer caractere".
    expect(casa(filtro(['a.c']), { nome: 'abc' })).toBe(false)
    expect(casa(filtro(['a.c']), { nome: 'a.c' })).toBe(true)
  })

  it('limita quantos termos viram varredura', () => {
    const muitos = ['um', 'dois', 'tres', 'quatro', 'cinco', 'seis']
    expect(filtro(muitos).$and).toHaveLength(MAX_TERMOS_MONGO)
  })
})

describe('higiene do texto vindo do banco', () => {
  it('tira marcação e quebra de linha', () => {
    expect(textoCurto('<p>Uma  dúvida\n sobre ECG</p>')).toBe('Uma dúvida sobre ECG')
  })

  it('corta o texto longo com reticências', () => {
    const longo = 'a'.repeat(300)
    const curto = textoCurto(longo, 20)
    expect(curto).toHaveLength(20)
    expect(curto?.endsWith('…')).toBe(true)
  })

  it('devolve indefinido para o que não é texto útil', () => {
    expect(textoCurto('   ')).toBeUndefined()
    expect(textoCurto(null)).toBeUndefined()
    expect(textoCurto(42)).toBeUndefined()
  })

  it('só aceita strings numa lista que veio do banco', () => {
    expect(listaDeTextos(['a', 3, null, 'b'])).toEqual(['a', 'b'])
    expect(listaDeTextos('a')).toEqual([])
  })
})
