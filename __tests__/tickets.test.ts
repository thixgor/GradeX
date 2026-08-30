import { describe, expect, it } from 'vitest'
import {
  TICKET_MENSAGEM_MAX,
  contarNaoLidas,
  respostasPendentes,
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

  it('avisa por padrão — é o pedido original do recurso', () => {
    expect(devoAvisarPorEmail({}, { agora })).toBe(true)
    expect(devoAvisarPorEmail({ lastEmailAt: minutosAtras(30) }, { agora })).toBe(true)
  })

  it('não deixa a presença no chat engolir o aviso', () => {
    // Regressão: `userLastSeenAt` vem do polling do painel, não de atenção
    // real, e chegou a suprimir todo e-mail de resposta.
    expect(
      devoAvisarPorEmail(
        { userLastSeenAt: minutosAtras(0) } as Parameters<typeof devoAvisarPorEmail>[0],
        { agora },
      ),
    ).toBe(true)
  })

  it('agrupa a rajada: segundo e-mail do mesmo ticket em menos de 5 min espera', () => {
    expect(devoAvisarPorEmail({ lastEmailAt: minutosAtras(2) }, { agora })).toBe(false)
    expect(devoAvisarPorEmail({ lastEmailAt: minutosAtras(6) }, { agora })).toBe(true)
  })

  it('mudança de situação passa por cima do intervalo', () => {
    expect(
      devoAvisarPorEmail({ lastEmailAt: minutosAtras(2) }, { agora, ignorarIntervalo: true }),
    ).toBe(true)
  })
})

describe('respostasPendentes', () => {
  const t = (min: number) => new Date(Date.UTC(2026, 2, 10, 12, min, 0))

  const conversa = [
    { senderId: 'u1', senderRole: 'user' as const, text: 'não consigo entrar', sentAt: t(0) },
    { senderId: 'a1', senderRole: 'admin' as const, text: 'já olho', sentAt: t(1) },
    { senderId: 'system', senderRole: 'system' as const, text: 'aviso automático', sentAt: t(2) },
    { senderId: 'a1', senderRole: 'admin' as const, text: 'achei o erro', sentAt: t(3) },
    { senderId: 'a1', senderRole: 'admin' as const, text: 'corrigido', sentAt: t(4) },
  ]

  it('junta tudo que o admin escreveu depois do último e-mail', () => {
    // Regressão: a trava de rajada precisa AGRUPAR, não descartar — antes
    // as mensagens seguradas nunca chegavam à caixa de entrada.
    expect(respostasPendentes(conversa, t(1)).map((r) => r.texto)).toEqual([
      'achei o erro',
      'corrigido',
    ])
  })

  it('sem e-mail anterior, leva a conversa inteira do admin', () => {
    expect(respostasPendentes(conversa, undefined)).toHaveLength(3)
  })

  it('não leva fala do usuário nem aviso do sistema', () => {
    const textos = respostasPendentes(conversa, undefined).map((r) => r.texto)
    expect(textos).not.toContain('não consigo entrar')
    expect(textos).not.toContain('aviso automático')
  })

  it('nada pendente quando o último e-mail é mais novo que tudo', () => {
    expect(respostasPendentes(conversa, t(10))).toEqual([])
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
