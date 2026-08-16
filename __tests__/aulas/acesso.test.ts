import { describe, expect, it } from 'vitest'

import {
  avaliarAcessoAula,
  ocultarConteudoRestrito,
  regrasDaAula,
  type ContextoDoUsuario,
} from '@/lib/aulas/acesso'

/**
 * O que estes testes protegem: o cadeado das aulas.
 *
 * Antes desta camada, a regra de acesso vivia no navegador e a API devolvia o
 * documento inteiro — `videoEmbed` incluído — para qualquer um. Cada caso aqui
 * é uma forma de o conteúdo pago escapar, ou de um aluno que PAGOU levar
 * cadeado na cara. Os dois erros custam caro, em direções opostas.
 */

const VISITANTE: ContextoDoUsuario = { logado: false }
const ALUNO: ContextoDoUsuario = { logado: true }
const PLUS: ContextoDoUsuario = { logado: true, ehPlus: true }
const ADMIN: ContextoDoUsuario = { logado: true, isAdmin: true }

function aula(overrides: Record<string, any> = {}) {
  return {
    visibilidade: 'gratuita' as const,
    oculta: false,
    dataLiberacao: new Date('2026-01-01'),
    ...overrides,
  }
}

const AGORA = new Date('2026-06-01T12:00:00Z')

describe('compatibilidade com o modelo antigo', () => {
  it('aula "plus" antiga continua exigindo assinatura, sem migração', () => {
    const regras = regrasDaAula({ visibilidade: 'plus' })
    expect(regras.liberarPara).toEqual([{ tipo: 'plus' }])
  })

  it('trata os rótulos legados "premium" e "essential" como assinatura', () => {
    expect(regrasDaAula({ visibilidade: 'premium' }).liberarPara).toEqual([{ tipo: 'plus' }])
    expect(regrasDaAula({ visibilidade: 'essential' as any }).liberarPara).toEqual([{ tipo: 'plus' }])
  })

  it('aula gratuita antiga exige apenas conta', () => {
    expect(regrasDaAula({ visibilidade: 'gratuita' }).liberarPara).toEqual([{ tipo: 'cadastrado' }])
  })

  it('regras novas têm precedência sobre a visibilidade antiga', () => {
    const regras = regrasDaAula({
      visibilidade: 'plus',
      regrasAcesso: { liberarPara: [{ tipo: 'publico' }] },
    })
    expect(regras.liberarPara).toEqual([{ tipo: 'publico' }])
  })
})

describe('o conteúdo pago não escapa', () => {
  it('visitante deslogado não abre aula de assinante', () => {
    const veredito = avaliarAcessoAula(aula({ visibilidade: 'plus' }), VISITANTE, AGORA)
    expect(veredito.liberado).toBe(false)
  })

  it('aluno sem assinatura não abre aula de assinante', () => {
    const veredito = avaliarAcessoAula(aula({ visibilidade: 'plus' }), ALUNO, AGORA)
    expect(veredito.liberado).toBe(false)
    expect(veredito.requisito?.motivo).toBe('precisa-plus')
  })

  it('o vídeo é removido do payload de quem está bloqueado', () => {
    const documento = {
      titulo: 'Fibrilação Atrial',
      videoEmbed: '<iframe src="segredo">',
      linkOuEmbed: 'https://zoom.us/j/123',
      pdfs: [{ nome: 'slides.pdf', url: 'x', tamanho: 1 }],
    }
    const veredito = avaliarAcessoAula(aula({ visibilidade: 'plus' }), ALUNO, AGORA)
    const limpo = ocultarConteudoRestrito(documento, veredito)

    expect(limpo.titulo).toBe('Fibrilação Atrial')
    expect(limpo.videoEmbed).toBeUndefined()
    expect(limpo.linkOuEmbed).toBeUndefined()
    expect(limpo.pdfs).toBeUndefined()
  })

  it('quem tem acesso continua recebendo o vídeo intacto', () => {
    const documento = { titulo: 'Aula', videoEmbed: '<iframe>' }
    const veredito = avaliarAcessoAula(aula({ visibilidade: 'plus' }), PLUS, AGORA)
    expect(ocultarConteudoRestrito(documento, veredito).videoEmbed).toBe('<iframe>')
  })
})

describe('quem pagou não leva cadeado', () => {
  it('assinante Plus+ abre aula de assinante', () => {
    expect(avaliarAcessoAula(aula({ visibilidade: 'plus' }), PLUS, AGORA).liberado).toBe(true)
  })

  it('comprador do material abre a aula vinculada a ele', () => {
    const conteudo = aula({
      regrasAcesso: { liberarPara: [{ tipo: 'material', itemId: 'mat-1', titulo: 'Combo SOI III' }] },
    })
    expect(avaliarAcessoAula(conteudo, { logado: true, materiais: ['mat-1'] }, AGORA).liberado).toBe(true)
    expect(avaliarAcessoAula(conteudo, { logado: true, materiais: ['mat-9'] }, AGORA).liberado).toBe(false)
  })

  it('condições são "OU": Plus+ OU comprador do combo', () => {
    const conteudo = aula({
      regrasAcesso: {
        liberarPara: [{ tipo: 'plus' }, { tipo: 'material', itemId: 'mat-1' }],
      },
    })
    expect(avaliarAcessoAula(conteudo, PLUS, AGORA).liberado).toBe(true)
    expect(avaliarAcessoAula(conteudo, { logado: true, materiais: ['mat-1'] }, AGORA).liberado).toBe(true)
    expect(avaliarAcessoAula(conteudo, ALUNO, AGORA).liberado).toBe(false)
  })

  it('exigirTambem é "E": turma trava até quem é Plus+', () => {
    const conteudo = aula({
      regrasAcesso: {
        liberarPara: [{ tipo: 'plus' }],
        exigirTambem: [{ tipo: 'grupo', grupoId: 'turma-a', titulo: 'Turma A' }],
      },
    })
    expect(avaliarAcessoAula(conteudo, PLUS, AGORA).liberado).toBe(false)
    expect(avaliarAcessoAula(conteudo, { ...PLUS, grupos: ['turma-a'] }, AGORA).liberado).toBe(true)
  })

  it('admin e monitor enxergam tudo — base do "visualizar como aluno"', () => {
    expect(avaliarAcessoAula(aula({ visibilidade: 'plus', oculta: true }), ADMIN, AGORA).liberado).toBe(true)
    expect(avaliarAcessoAula(aula({ visibilidade: 'plus' }), { logado: true, isMonitor: true }, AGORA).liberado).toBe(true)
  })
})

describe('cadeado explica o caminho certo', () => {
  it('manda o deslogado entrar antes de mandar assinar', () => {
    // Quem já assina e só não fez login não pode ser empurrado para a página de
    // vendas — é o jeito mais rápido de perder um aluno que já pagou.
    const veredito = avaliarAcessoAula(aula({ visibilidade: 'plus' }), VISITANTE, AGORA)
    expect(veredito.requisito?.motivo).toBe('precisa-login')
    expect(veredito.requisito?.acaoHref).toBe('/auth/login')
  })

  it('nomeia o material e leva para a página dele', () => {
    const conteudo = aula({
      regrasAcesso: { liberarPara: [{ tipo: 'material', itemId: 'mat-1', titulo: 'Combo SOI III' }] },
    })
    const veredito = avaliarAcessoAula(conteudo, ALUNO, AGORA)
    expect(veredito.requisito?.titulo).toBe('Esta aula faz parte de Combo SOI III')
    expect(veredito.requisito?.acaoHref).toBe('/materiais/mat-1')
  })

  it('nunca devolve bloqueio sem explicação', () => {
    const casos = [
      aula({ visibilidade: 'plus' }),
      aula({ regrasAcesso: { liberarPara: [{ tipo: 'manual-clinico' }] } }),
      aula({ regrasAcesso: { liberarPara: [{ tipo: 'grupo', grupoId: 'x' }] } }),
    ]
    for (const caso of casos) {
      const veredito = avaliarAcessoAula(caso, ALUNO, AGORA)
      expect(veredito.liberado).toBe(false)
      expect(veredito.requisito?.titulo?.length).toBeGreaterThan(0)
    }
  })
})

describe('janela de publicação', () => {
  it('aula agendada não abre antes da hora', () => {
    const conteudo = aula({ dataLiberacao: new Date('2026-08-16T08:00:00Z') })
    const veredito = avaliarAcessoAula(conteudo, PLUS, AGORA)
    expect(veredito.liberado).toBe(false)
    expect(veredito.requisito?.motivo).toBe('agendada')
    expect(veredito.requisito?.liberaEm?.toISOString()).toBe('2026-08-16T08:00:00.000Z')
  })

  it('agendada aparece como "em breve" ou some, conforme a escolha do admin', () => {
    const base = { dataLiberacao: new Date('2026-08-16T08:00:00Z') }
    expect(avaliarAcessoAula(aula(base), ALUNO, AGORA).invisivel).toBe(false)
    expect(avaliarAcessoAula(aula({ ...base, ocultarAteLiberacao: true }), ALUNO, AGORA).invisivel).toBe(true)
  })

  it('aula temporária fecha na data de encerramento', () => {
    const conteudo = aula({ ocultarEm: new Date('2026-05-01T00:00:00Z') })
    const veredito = avaliarAcessoAula(conteudo, PLUS, AGORA)
    expect(veredito.liberado).toBe(false)
    expect(veredito.requisito?.motivo).toBe('encerrada')
  })

  it('rascunho não vaza para a listagem do aluno', () => {
    const veredito = avaliarAcessoAula(aula({ oculta: true }), PLUS, AGORA)
    expect(veredito.liberado).toBe(false)
    expect(veredito.invisivel).toBe(true)
  })
})

describe('aula demonstrativa', () => {
  it('libera sem cumprir a regra paga, mas se identifica como amostra', () => {
    const conteudo = aula({
      visibilidade: 'plus',
      regrasAcesso: { liberarPara: [{ tipo: 'plus' }], amostra: true },
    })
    const veredito = avaliarAcessoAula(conteudo, ALUNO, AGORA)
    expect(veredito.liberado).toBe(true)
    expect(veredito.porAmostra).toBe(true)
  })

  it('amostra não driblar agendamento — data continua mandando', () => {
    const conteudo = aula({
      dataLiberacao: new Date('2026-08-16T08:00:00Z'),
      regrasAcesso: { liberarPara: [{ tipo: 'plus' }], amostra: true },
    })
    expect(avaliarAcessoAula(conteudo, ALUNO, AGORA).liberado).toBe(false)
  })

  it('quem cumpre a regra de verdade não é marcado como amostra', () => {
    const conteudo = aula({
      regrasAcesso: { liberarPara: [{ tipo: 'plus' }], amostra: true },
    })
    expect(avaliarAcessoAula(conteudo, PLUS, AGORA).porAmostra).toBe(false)
  })

  it('aula pública abre para visitante deslogado (demonstração da plataforma)', () => {
    const conteudo = aula({ regrasAcesso: { liberarPara: [{ tipo: 'publico' }] } })
    expect(avaliarAcessoAula(conteudo, VISITANTE, AGORA).liberado).toBe(true)
  })
})
