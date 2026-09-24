import { describe, expect, it } from 'vitest'
import {
  argumentoDaOferta,
  cargoDoPlano,
  decidirModo,
  destinoDaOferta,
  escolherPlanoDaOferta,
  itensInclusos,
  type PlanoParaOferta,
} from '@/lib/plus-oferta'
import { permissoesLiberadas } from '@/lib/plan-entitlements'

/**
 * A chamada do Plus+ nos checkouts.
 *
 * O que estes testes seguram são as três promessas do cabeçalho de
 * `lib/plus-oferta.ts`: Plus+ nunca é incomodado, Quest+ vê upgrade, e a
 * oferta nunca anuncia o que o plano não entrega.
 */

const plano = (p: Partial<PlanoParaOferta>): PlanoParaOferta => ({
  tipo: 'x',
  preco: 100,
  role: 'plus',
  ...p,
})

describe('escolherPlanoDaOferta', () => {
  it('prefere o Semestral do Plus+', () => {
    const escolhido = escolherPlanoDaOferta([
      plano({ tipo: 'mensal', durationMonths: 1, destaque: true }),
      plano({ tipo: 'semestral', durationMonths: 6 }),
      plano({ tipo: 'anual', durationMonths: 12 }),
    ])
    expect(escolhido?.tipo).toBe('semestral')
  })

  it('acha o semestral renomeado pela duração', () => {
    const escolhido = escolherPlanoDaOferta([
      plano({ tipo: 'anual', durationMonths: 12 }),
      plano({ tipo: 'seis-meses', durationMonths: 6 }),
    ])
    expect(escolhido?.tipo).toBe('seis-meses')
  })

  it('nunca oferece plano oculto, sem preço ou do Quest+', () => {
    const escolhido = escolherPlanoDaOferta([
      plano({ tipo: 'semestral', oculto: true }),
      plano({ tipo: 'quest-semestral', role: 'quest', durationMonths: 6 }),
      plano({ tipo: 'gratis', preco: 0, durationMonths: 6 }),
      plano({ tipo: 'anual', durationMonths: 12 }),
    ])
    expect(escolhido?.tipo).toBe('anual')
  })

  it('devolve null sem nenhum Plus+ vendável', () => {
    expect(escolherPlanoDaOferta([plano({ role: 'quest' })])).toBeNull()
    expect(escolherPlanoDaOferta([])).toBeNull()
    expect(escolherPlanoDaOferta(null)).toBeNull()
  })

  it('plano sem cargo vale Plus+, como na compra sem login', () => {
    expect(cargoDoPlano({ role: undefined })).toBe('plus')
    expect(cargoDoPlano({ role: 'premium' })).toBe('plus')
    expect(cargoDoPlano({ role: 'quest' })).toBe('quest')
  })
})

describe('itensInclusos', () => {
  it('plano sem permissões moduladas vale tudo', () => {
    const itens = itensInclusos(plano({}), { manualIncluidoNoPlus: true })
    const chaves = itens.map((i) => i.chave)
    expect(chaves).toEqual(
      expect.arrayContaining([
        'materiais', 'flashcards', 'anatomia3d', 'histologia', 'semiologia',
        'radiologia', 'farmacologia', 'patologias', 'ferramentas', 'exames',
      ]),
    )
  })

  it('Manual fora do Plus+ tira todos os manuais da lista', () => {
    const chaves = itensInclusos(plano({}), { manualIncluidoNoPlus: false }).map((i) => i.chave)
    expect(chaves).toContain('materiais')
    expect(chaves).not.toContain('patologias')
    expect(chaves).not.toContain('histologia')
    expect(chaves).not.toContain('anatomia3d')
  })

  it('respeita área e módulo fechados pelo admin', () => {
    const permissoes = permissoesLiberadas()
    permissoes.ativo = true
    permissoes.regras.materiais.liberado = false
    permissoes.manualClinicoModulos.radiologia = false
    const chaves = itensInclusos(plano({ permissoes }), { manualIncluidoNoPlus: true }).map((i) => i.chave)
    expect(chaves).not.toContain('materiais')
    expect(chaves).not.toContain('flashcards')
    expect(chaves).not.toContain('radiologia')
    expect(chaves).toContain('histologia')
  })

  it('permissões gravadas mas desligadas não fecham nada', () => {
    const permissoes = permissoesLiberadas()
    permissoes.ativo = false
    permissoes.regras.materiais.liberado = false
    const chaves = itensInclusos(plano({ permissoes }), { manualIncluidoNoPlus: true }).map((i) => i.chave)
    expect(chaves).toContain('materiais')
  })
})

describe('decidirModo', () => {
  const tudo = itensInclusos(plano({}), { manualIncluidoNoPlus: true })
  const semManual = itensInclusos(plano({}), { manualIncluidoNoPlus: false })
  const base = { temPlano: true, inclusos: tudo }

  it('Plus+ (e cargo pago personalizado) nunca vê a oferta', () => {
    for (const contexto of ['material', 'flashcard', 'pacote', 'carrinho', 'manual_clinico', 'plano'] as const) {
      expect(decidirModo({ ...base, perfil: 'plus', contexto, cargoDoPlanoAtual: 'quest' })).toBe('nenhuma')
      expect(decidirModo({ ...base, perfil: 'outro', contexto })).toBe('nenhuma')
    }
  })

  it('Quest+ vê upgrade em compra avulsa', () => {
    expect(decidirModo({ ...base, perfil: 'quest', contexto: 'material' })).toBe('upgrade')
    expect(decidirModo({ ...base, perfil: 'quest', contexto: 'manual_clinico' })).toBe('upgrade')
  })

  it('visitante e conta gratuita veem a oferta', () => {
    expect(decidirModo({ ...base, perfil: 'visitante', contexto: 'carrinho' })).toBe('oferta')
    expect(decidirModo({ ...base, perfil: 'gratuito', contexto: 'flashcard' })).toBe('oferta')
  })

  it('checkout de plano: só o Quest+ tem para onde subir', () => {
    expect(decidirModo({ ...base, perfil: 'gratuito', contexto: 'plano', cargoDoPlanoAtual: 'plus' })).toBe('nenhuma')
    expect(decidirModo({ ...base, perfil: 'quest', contexto: 'plano', cargoDoPlanoAtual: 'premium' })).toBe('nenhuma')
    expect(decidirModo({ ...base, perfil: 'visitante', contexto: 'plano', cargoDoPlanoAtual: null })).toBe('nenhuma')
    expect(decidirModo({ ...base, perfil: 'visitante', contexto: 'plano', cargoDoPlanoAtual: 'quest' })).toBe('upgrade')
    expect(decidirModo({ ...base, perfil: 'quest', contexto: 'plano', cargoDoPlanoAtual: 'quest' })).toBe('upgrade')
  })

  it('some quando o plano não cobre o que está sendo comprado', () => {
    expect(decidirModo({ perfil: 'gratuito', contexto: 'manual_clinico', temPlano: true, inclusos: semManual })).toBe('nenhuma')
    expect(decidirModo({ perfil: 'gratuito', contexto: 'material', temPlano: true, inclusos: semManual })).toBe('oferta')
  })

  it('sem plano Plus+ no catálogo, nada', () => {
    expect(decidirModo({ perfil: 'gratuito', contexto: 'material', temPlano: false, inclusos: tudo })).toBe('nenhuma')
  })
})

describe('argumentoDaOferta', () => {
  it('compra maior que o Plus+ → "mais barato", com a economia', () => {
    const arg = argumentoDaOferta({ valorAtual: 120, precoPlus: 99.9, meses: 6 })
    expect(arg.tipo).toBe('mais-barato')
    expect(arg.economia).toBe(20.1)
    expect(arg.diferenca).toBe(0)
  })

  it('compra que já é boa fatia do Plus+ → "só X a mais"', () => {
    const arg = argumentoDaOferta({ valorAtual: 59.9, precoPlus: 99.9, meses: 6 })
    expect(arg.tipo).toBe('quase-o-mesmo')
    expect(arg.diferenca).toBe(40)
  })

  it('compra pequena → custo por mês e por dia', () => {
    const arg = argumentoDaOferta({ valorAtual: 9.9, precoPlus: 99.9, meses: 6 })
    expect(arg.tipo).toBe('por-mes')
    expect(arg.porMes).toBe(16.65)
    expect(arg.porDia).toBe(0.56)
  })

  it('plano sem duração (vitalício) não inventa mensalidade', () => {
    const arg = argumentoDaOferta({ valorAtual: 10, precoPlus: 299.9, meses: null })
    expect(arg.porMes).toBeNull()
    expect(arg.porDia).toBeNull()
  })
})

describe('destinoDaOferta', () => {
  it('logado paga no checkout de plano; visitante, por Serial Key', () => {
    expect(destinoDaOferta('semestral', true)).toBe('/buy/checkout?plan=semestral')
    expect(destinoDaOferta('semestral', false)).toBe('/comprar?productType=premium&productId=semestral')
  })
})
