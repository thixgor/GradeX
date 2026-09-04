import { describe, it, expect } from 'vitest'
import { campoTextoPreenchido, textoPreenchidoNaExpressao } from '@/lib/banco/filtros-conteudo'

/**
 * A condição não roda contra um banco de verdade aqui — testar contra um
 * MongoDB de teste seria pesado para uma regra tão pequena. Em vez disso,
 * o teste reimplementa o que `$type`/`$ne` decidem, documento por documento,
 * e existe para travar o formato do objeto: se alguém trocar `$type` de volta
 * por `$exists` "para simplificar", o teste some — porque o comportamento
 * verificado abaixo é exatamente o que `$exists` erra.
 */
function casa(condicao: { $type: string; $ne: string }, valor: unknown): boolean {
  const tipoBate = condicao.$type === 'string' ? typeof valor === 'string' : false
  return tipoBate && valor !== condicao.$ne
}

describe('campoTextoPreenchido', () => {
  const condicao = campoTextoPreenchido()

  it('casa com texto de verdade', () => {
    expect(casa(condicao, 'https://exemplo.com/imagem.png')).toBe(true)
  })

  it('não casa com null — o bug real: edição no admin grava null ao limpar o campo', () => {
    expect(casa(condicao, null)).toBe(false)
  })

  it('não casa com string vazia', () => {
    expect(casa(condicao, '')).toBe(false)
  })

  it('não casa com campo ausente', () => {
    expect(casa(condicao, undefined)).toBe(false)
  })

  it('não casa com outro tipo por engano', () => {
    expect(casa(condicao, 42)).toBe(false)
  })
})

/**
 * A versão em expressão, usada dentro do `$cond` que conta as facetas do
 * criador de listas.
 *
 * Ela existe porque a contagem que aparece na tela precisa bater com o que o
 * filtro devolve — e o teste abaixo é o que impede as duas de divergirem:
 * roda os MESMOS valores pelas duas e exige a mesma resposta. Uma expressão só
 * com `$type` (sem o `$ne`) contaria a string vazia e a tela ofereceria um
 * recorte que volta vazio.
 */
function casaExpressao(
  expressao: { $and: [{ $eq: [{ $type: string }, string] }, { $ne: [string, string] }] },
  valor: unknown,
): boolean {
  const [tipo, diferente] = expressao.$and
  const tipoBate = tipo.$eq[1] === 'string' ? typeof valor === 'string' : false
  return tipoBate && valor !== diferente.$ne[1]
}

describe('textoPreenchidoNaExpressao', () => {
  const expressao = textoPreenchidoNaExpressao('$imagemUrl') as any

  it('aponta para o campo que recebeu', () => {
    expect(expressao.$and[0].$eq[0]).toEqual({ $type: '$imagemUrl' })
    expect(expressao.$and[1].$ne[0]).toBe('$imagemUrl')
  })

  it('decide igual à versão de consulta, valor por valor', () => {
    const condicao = campoTextoPreenchido()
    for (const valor of ['https://exemplo.com/a.png', '', null, undefined, 42, {}]) {
      expect(casaExpressao(expressao, valor), String(valor)).toBe(casa(condicao, valor))
    }
  })

  it('não conta a string vazia — o `$ne` é o que separa as duas', () => {
    expect(casaExpressao(expressao, '')).toBe(false)
    expect(casaExpressao(expressao, 'x')).toBe(true)
  })
})
