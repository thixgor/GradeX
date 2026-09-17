import { describe, expect, it } from 'vitest'
import { buscar, distancia, normalizar, preparar, tokenizar } from '@/lib/semiologia/busca-motor'
import { montarIndiceDeBusca } from '@/lib/semiologia/busca'

const preparado = preparar(montarIndiceDeBusca())
const primeiro = (q: string) => buscar(preparado, q).resultados[0]?.entrada
const titulos = (q: string, n = 5) => buscar(preparado, q).resultados.slice(0, n).map((r) => r.entrada.titulo)

describe('normalização', () => {
  it('ignora acento, caixa e pontuação', () => {
    expect(normalizar('Pneumotórax!')).toBe('pneumotorax')
    expect(tokenizar('Sinal do D')).toEqual(['d'])
  })
  it('distância de edição com transposição', () => {
    expect(distancia('esclerodatilia', 'esclerodactilia', 2)).toBe(1)
    expect(distancia('ictericia', 'icteircia', 2)).toBe(1)
    expect(distancia('abc', 'xyz', 1)).toBeGreaterThan(1)
  })
})

describe('o que o aluno digita', () => {
  it('acha pelo nome oficial', () => {
    expect(primeiro('icterícia')?.titulo).toBe('Icterícia')
    expect(primeiro('pneumotorax')?.titulo).toMatch(/pneumotórax/i)
  })
  it('acha por sinônimo e gíria', () => {
    expect(primeiro('flapping')?.titulo).toBe('Asterixe')
    expect(primeiro('joanete')?.titulo).toBe('Hálux valgo')
    expect(primeiro('boqueira')?.titulo).toBe('Queilite angular')
    expect(primeiro('cobreiro')?.titulo).toBe('Herpes zóster')
  })
  it('acha em inglês', () => {
    expect(primeiro('lung point')?.titulo).toMatch(/ponto pulmonar/i)
    expect(primeiro('clubbing')?.titulo).toMatch(/baqueteamento/i)
    expect(titulos('b-lines').join(' ')).toMatch(/linhas B/i)
  })
  it('tolera erro de digitação', () => {
    expect(primeiro('esclerodatilia')?.titulo).toBe('Esclerodactilia')
    expect(buscar(preparado, 'esclerodatilia').aproximado).toBe(true)
  })
  it('aceita prefixo enquanto digita', () => {
    expect(titulos('hidrone').join(' ')).toMatch(/hidronefrose/i)
  })
  it('agrupa uma doença nos seus sinais', () => {
    const t = titulos('graves', 8).join(' | ')
    expect(t).toMatch(/exoftalmia/i)
    expect(t).toMatch(/bócio/i)
    expect(buscar(preparado, 'graves').traduzido).toBe(true)
  })
  it('pontua título acima de corpo', () => {
    expect(primeiro('ascite')?.titulo).toBe('Ascite')
  })
  it('vazio e ruído não quebram', () => {
    expect(buscar(preparado, '').resultados).toEqual([])
    expect(buscar(preparado, '   ').resultados).toEqual([])
    expect(buscar(preparado, 'zzzzqqq').resultados).toEqual([])
  })
})

describe('índice', () => {
  it('tem href e grupo em toda entrada', () => {
    for (const e of montarIndiceDeBusca()) {
      expect(e.href.startsWith('/manual-clinico/semiologia/')).toBe(true)
      expect(e.grupo.length).toBeGreaterThan(2)
    }
  })
  it('cobre sinais, cenas de ultrassom e comparadores', () => {
    const tipos = new Set(montarIndiceDeBusca().map((e) => e.tipo))
    expect(tipos).toContain('sinal')
    expect(tipos).toContain('cena-ultrassom')
    expect(tipos).toContain('comparador')
  })
})
