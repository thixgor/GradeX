import { describe, it, expect } from 'vitest'
import { campoTextoPreenchido } from '@/lib/banco/filtros-conteudo'

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
