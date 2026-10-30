import { describe, expect, it } from 'vitest'
import { falaDePreco, materiaisComoDestinos } from '@/lib/dom/catalogo'
import { pedeRecomendacao } from '@/lib/dom/descobertas'
import { montarPromptDoSistema } from '@/lib/dom/prompt'

describe('o que o Dom sabe da vitrine', () => {
  it.each(['quanto custa o plus?', 'qual o preço do quest', 'tem desconto no plano anual?'])('"%s" fala de preço', (t) => {
    expect(falaDePreco(t)).toBe(true)
  })
  it('pergunta de estudo não carrega os preços', () => {
    expect(falaDePreco('explica a fisiopatologia da insuficiência cardíaca')).toBe(false)
  })

  it.each(['o que você recomenda pra estudar?', 'que material outros compram junto?', 'vale a pena esse resumo?'])('"%s" pede indicação', (t) => {
    expect(pedeRecomendacao(t)).toBe(true)
  })
  it('dúvida comum não pede indicação', () => {
    expect(pedeRecomendacao('o que é um infarto?')).toBe(false)
  })

  it('materiais viram destinos para /materiais/<id>', () => {
    const [d] = materiaisComoDestinos([{ id: 'abc', titulo: 'Resumo de Histologia', preco: 'R$ 19,90', resumo: '' }])
    expect(d).toMatchObject({ id: 'material:abc', href: '/materiais/abc', exclusivo: false })
  })

  it('o prompt leva histologia, achados da busca, recomendações e preços', () => {
    const p = montarPromptDoSistema({
      modo: 'geral',
      aluno: { primeiroNome: 'Ana', periodo: 2, profissao: null, faculdade: null, plano: 'Plus+', pagante: true, assinaturaAte: null, acessoPorCompraAte: null, xp: null },
      rota: '/dashboard',
      agora: new Date('2026-10-30T15:00:00Z'),
      canario: 'DOM-x',
      destinos: [],
      material: null,
      tema: null,
      precos: ['Plus+ · Mensal: R$ 29,90/mês'],
      achados: [{ id: 'busca:1', titulo: 'Infarto agudo do miocárdio', resumo: 'Patologia' }],
      sugestoes: [{ titulo: 'Pacote Cardio', preco: 'R$ 49,90', motivo: 'Quem leva isto também leva', destino: { id: 'leva:1' } }],
    } as any)
    expect(p).toContain('/manual-clinico/histologia')
    expect(p).toContain('/manual-clinico/histologia/histopatologia')
    expect(p).toContain('busca:1: Infarto agudo do miocárdio')
    expect(p).toContain('leva:1: Pacote Cardio')
    expect(p).toContain('PLANOS E PREÇOS ATUAIS')
  })
})
