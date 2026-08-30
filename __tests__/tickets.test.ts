import { describe, expect, it } from 'vitest'
import {
  TICKET_MENSAGEM_MAX,
  contarNaoLidas,
  devoAvisarPorEmail,
  ehMensagemDoSistema,
  normalizarTexto,
  previaDaMensagem,
  protocoloDoTicket,
  validarAberturaDeTicket,
} from '@/lib/tickets'

function msg(over: Partial<Parameters<typeof contarNaoLidas>[0][number]> = {}) {
  return {
    senderId: 'u1',
    senderRole: 'user' as const,
    readAt: undefined,
    ...over,
  }
}

describe('validarAberturaDeTicket', () => {
  it('recusa título curto e mensagem vazia', () => {
    expect(validarAberturaDeTicket({ title: 'ab', message: 'oi' })).toMatchObject({ ok: false })
    expect(validarAberturaDeTicket({ title: 'Dúvida', message: '   ' })).toMatchObject({ ok: false })
  })

  it('aceita e normaliza uma abertura válida', () => {
    const r = validarAberturaDeTicket({ title: '  Não consigo entrar  ', message: ' socorro ' })
    expect(r).toEqual({ ok: true, title: 'Não consigo entrar', message: 'socorro' })
  })

  it('corta texto acima do limite em vez de gravar sem controle', () => {
    const r = validarAberturaDeTicket({ title: 'Teste', message: 'x'.repeat(TICKET_MENSAGEM_MAX + 500) })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.message).toHaveLength(TICKET_MENSAGEM_MAX)
  })
})

describe('normalizarTexto', () => {
  it('colapsa a rajada de quebras de linha que esticava o balão da conversa', () => {
    expect(normalizarTexto('a\n\n\n\n\n\nb', 100)).toBe('a\n\n\nb')
  })
})

describe('contarNaoLidas', () => {
  const conversa = [
    msg({ senderRole: 'user' }),
    msg({ senderId: 'admin1', senderRole: 'admin' }),
    msg({ senderId: 'admin1', senderRole: 'admin', readAt: new Date() }),
    msg({ senderId: 'system', senderRole: 'system' }),
  ]

  it('para o usuário, só conta a fala do admin ainda não lida', () => {
    expect(contarNaoLidas(conversa, 'user')).toBe(1)
  })

  it('para o admin, só conta a fala do usuário — nunca o aviso do sistema', () => {
    expect(contarNaoLidas(conversa, 'admin')).toBe(1)
  })
})

describe('ehMensagemDoSistema', () => {
  it('reconhece o formato antigo, que gravava senderRole "user"', () => {
    expect(ehMensagemDoSistema({ senderId: 'system', senderRole: 'user' })).toBe(true)
    expect(ehMensagemDoSistema({ senderId: 'u1', senderRole: 'user' })).toBe(false)
  })
})

describe('devoAvisarPorEmail', () => {
  const agora = new Date('2026-03-10T12:00:00Z')
  const minutosAtras = (n: number) => new Date(agora.getTime() - n * 60_000)

  it('avisa quem está fora da conversa', () => {
    expect(devoAvisarPorEmail({ userLastSeenAt: minutosAtras(60) }, { agora })).toBe(true)
    expect(devoAvisarPorEmail({}, { agora })).toBe(true)
  })

  it('não avisa quem acabou de abrir o chat — a resposta já chegou por lá', () => {
    expect(devoAvisarPorEmail({ userLastSeenAt: minutosAtras(1) }, { agora })).toBe(false)
  })

  it('segura o segundo e-mail do mesmo ticket dentro do intervalo', () => {
    expect(devoAvisarPorEmail({ lastEmailAt: minutosAtras(2) }, { agora })).toBe(false)
    expect(devoAvisarPorEmail({ lastEmailAt: minutosAtras(30) }, { agora })).toBe(true)
  })

  it('mudança de situação passa por cima do intervalo, mas não da presença', () => {
    expect(
      devoAvisarPorEmail({ lastEmailAt: minutosAtras(2) }, { agora, ignorarIntervalo: true }),
    ).toBe(true)
    expect(
      devoAvisarPorEmail({ userLastSeenAt: minutosAtras(1) }, { agora, ignorarIntervalo: true }),
    ).toBe(false)
  })
})

describe('apresentação', () => {
  it('protocolo é o fim do id, em maiúsculas', () => {
    expect(protocoloDoTicket('65f1c2d3e4f5a6b7c8d9e0f1')).toBe('C8D9E0F1')
  })

  it('prévia não estoura o limite e não quebra linha', () => {
    expect(previaDaMensagem('linha 1\nlinha 2', 50)).toBe('linha 1 linha 2')
    expect(previaDaMensagem('x'.repeat(80), 20)).toHaveLength(20)
  })
})
