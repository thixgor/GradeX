import { describe, expect, it } from 'vitest'
import { montarEmailDeUpgrade, nomeCurtoDoPlano } from '@/lib/upgrade-quest-email'

/**
 * O e-mail da oferta de upgrade. O que importa aqui é que os números batam
 * com a página (preço riscado, preço de upgrade, por mês), que o link leve à
 * /upgrade e que nada digitado no painel vire HTML cru.
 */

const base = {
  descontoPercentual: 30,
  plano: { nome: 'DomineAqui Plus+', periodo: 'Plano Anual', preco: 397, precoUpgrade: 277.9, durationMonths: 12 },
  ganhos: ['Todos os materiais da plataforma', 'Manual de Farmacologia'],
  janelaHoras: 48,
  appUrl: 'https://domineaqui.com.br/',
}

describe('montarEmailDeUpgrade', () => {
  it('assunto pessoal com o desconto', () => {
    expect(montarEmailDeUpgrade(base).assunto).toBe('%nome%, seu upgrade para o Plus+ com 30% OFF chegou')
  })

  it('traz o preço riscado, o de upgrade, o mensal e a economia', () => {
    const { conteudo } = montarEmailDeUpgrade(base)
    expect(conteudo).toContain('<s>R$ 397,00</s> por R$ 277,90')
    expect(conteudo).toContain('Dá R$ 23,16 por mês')
    expect(conteudo).toContain('você economiza R$ 119,10')
    expect(conteudo).toContain('Plus+ Anual')
  })

  it('o botão leva à /upgrade, sem barra dobrada', () => {
    const { conteudo } = montarEmailDeUpgrade(base)
    expect(conteudo).toContain('href="https://domineaqui.com.br/upgrade?utm_source=email')
  })

  it('diz o tamanho da janela; sem contagem, não promete prazo', () => {
    expect(montarEmailDeUpgrade(base).conteudo).toContain('Reservado para você por 48 horas.')
    const semPrazo = montarEmailDeUpgrade({ ...base, janelaHoras: null })
    expect(semPrazo.conteudo).not.toContain('horas.')
  })

  it('escapa o que vem do cadastro', () => {
    const { conteudo } = montarEmailDeUpgrade({ ...base, ganhos: ['<script>alert(1)</script>'] })
    expect(conteudo).not.toContain('<script>')
    expect(conteudo).toContain('&lt;script&gt;')
  })

  it('preço com milhar sai formatado', () => {
    const { conteudo } = montarEmailDeUpgrade({
      ...base,
      plano: { ...base.plano, preco: 3128.99, precoUpgrade: 2190.29, durationMonths: 0 },
    })
    expect(conteudo).toContain('R$ 3.128,99')
    expect(conteudo).not.toContain('por mês')
  })
})

describe('bolsista PROUNI/FIES no e-mail', () => {
  it('com o extra ligado, avisa que o benefício soma', () => {
    const { conteudo } = montarEmailDeUpgrade({ ...base, extraBolsista: 15 })
    expect(conteudo).toContain('É bolsista PROUNI/FIES?')
    expect(conteudo).toContain('+15% extra')
  })

  it('desligado, não fala de bolsista', () => {
    expect(montarEmailDeUpgrade({ ...base, extraBolsista: null }).conteudo).not.toContain('PROUNI')
  })
})

describe('nomeCurtoDoPlano', () => {
  it('junta a marca e o período sem a palavra "Plano"', () => {
    expect(nomeCurtoDoPlano('DomineAqui Plus+', 'Plano Semestral')).toBe('Plus+ Semestral')
    expect(nomeCurtoDoPlano('DomineAqui Plus+', '')).toBe('Plus+')
  })
})
