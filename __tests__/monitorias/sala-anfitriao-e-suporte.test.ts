import { describe, expect, it } from 'vitest'
import { avaliarAcessoSala, CONFIG_SALA_PADRAO, statusHttpDaRecusa, type EntradaDoAcesso } from '@/lib/monitorias/sala/regras'
import { lerMensagemDoCanal } from '@/lib/monitorias/sala/mensagens'
import { podeTransitar, STATUS_FINAIS } from '@/lib/monitorias/estado'
import { validarLinkDeMaterial, validarLinkExterno } from '@/lib/monitorias/links'
import { nomeVisivel } from '@/lib/monitorias/sala/servidor'
import type { StatusReserva } from '@/lib/monitorias/tipos'

const min = (n: number) => n * 60_000
const inicio = new Date('2026-10-20T17:00:00Z')
const fim = new Date('2026-10-20T18:00:00Z')
function entrada(extra: Partial<EntradaDoAcesso> = {}): EntradaDoAcesso {
  return {
    ehMonitor: false,
    assento: { status: 'paga', ativo: true },
    status: 'confirmada',
    inicio,
    fim,
    agora: new Date(inicio.getTime() + min(5)),
    config: CONFIG_SALA_PADRAO,
    ...extra,
  }
}

describe('sala: tirado da sala e encerrada pelo suporte', () => {
  it('aluno tirado pelo monitor não entra (403) e a mensagem diz que o monitor pode liberar', () => {
    const r = avaliarAcessoSala(entrada({ removido: { por: 'monitor' } }))
    expect(!r.ok && r.motivo).toBe('removido')
    expect(!r.ok && r.mensagem).toMatch(/monitor/)
    expect(statusHttpDaRecusa('removido')).toBe(403)
  })

  it('tirado pelo suporte: mensagem manda falar com o suporte', () => {
    const r = avaliarAcessoSala(entrada({ removido: { por: 'suporte' } }))
    expect(!r.ok && r.mensagem).toMatch(/suporte/)
  })

  it('o monitor nunca é barrado por "removido"', () => {
    expect(avaliarAcessoSala(entrada({ ehMonitor: true, assento: null, removido: { por: 'suporte' } })).ok).toBe(true)
  })

  it('encerrada pelo monitor: aluno fica fora, monitor entra (pode reabrir)', () => {
    expect(avaliarAcessoSala(entrada({ encerradaEm: inicio })).ok).toBe(false)
    expect(avaliarAcessoSala(entrada({ ehMonitor: true, assento: null, encerradaEm: inicio })).ok).toBe(true)
  })

  it('encerrada pelo suporte: ninguém entra, nem o monitor', () => {
    const r = avaliarAcessoSala(entrada({ ehMonitor: true, assento: null, encerradaEm: inicio, encerradaPeloSuporte: true }))
    expect(!r.ok && r.motivo).toBe('encerrada')
    expect(!r.ok && r.mensagem).toMatch(/suporte/)
  })
})

describe('canal P2P: pedidos do monitor', () => {
  it('aceita só os pedidos conhecidos', () => {
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'pedido', acao: 'silenciar' }))).toEqual({ t: 'pedido', acao: 'silenciar' })
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'pedido', acao: 'ligar_microfone_a_forca' }))).toBeNull()
  })

  it('remoção precisa de um id opaco válido', () => {
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'removido', pid: 'abcdefghijklmnop' }))).toEqual({ t: 'removido', pid: 'abcdefghijklmnop' })
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'removido', pid: '../../x' }))).toBeNull()
  })

  it('permissões exigem os dois campos booleanos', () => {
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'permissoes', telaAlunos: false, chatAlunos: true }))).toEqual({ t: 'permissoes', telaAlunos: false, chatAlunos: true })
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'permissoes', telaAlunos: 'nao' }))).toBeNull()
  })

  it('estado carrega a mão levantada (ausente = baixada)', () => {
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'estado', mic: true, cam: false, tela: false, mao: true }))).toMatchObject({ mao: true })
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'estado', mic: true, cam: false, tela: false }))).toMatchObject({ mao: false })
  })
})

describe('reserva: cancelada pelo suporte', () => {
  it('o suporte cancela qualquer reserva ainda não concluída', () => {
    const abertas: StatusReserva[] = ['solicitada', 'em_negociacao', 'aguardando_assinaturas', 'aguardando_pagamento', 'confirmada', 'realizada', 'em_disputa']
    for (const s of abertas) expect(podeTransitar(s, 'cancelada_suporte')).toBe(true)
  })

  it('concluída e finais não voltam; cancelada_suporte é final', () => {
    expect(podeTransitar('concluida', 'cancelada_suporte')).toBe(false)
    expect(podeTransitar('reembolsada', 'cancelada_suporte')).toBe(false)
    expect(STATUS_FINAIS).toContain('cancelada_suporte')
    expect(podeTransitar('cancelada_suporte', 'confirmada')).toBe(false)
  })
})

describe('materiais: nada de contato disfarçado de link', () => {
  it.each(['https://wa.me/5521987654321', 'https://chat.whatsapp.com/abc', 'https://t.me/fulano', 'https://www.instagram.com/fulano', 'https://bit.ly/x', 'https://linktr.ee/fulano', 'https://calendly.com/fulano'])(
    'recusa %s',
    (url) => {
      expect(validarLinkExterno(url)).not.toBeNull()
      expect(validarLinkDeMaterial(url)).toBeNull()
    },
  )

  it.each(['https://drive.google.com/file/d/abc/view', 'https://www.notion.so/resumo', 'https://www.youtube.com/watch?v=abc', 'https://www.canva.com/design/x'])('aceita %s', (url) => {
    expect(validarLinkDeMaterial(url)).not.toBeNull()
  })
})

describe('nome na sala', () => {
  it('aluno vê só o primeiro nome dos colegas; monitor vê o completo', () => {
    expect(nomeVisivel('Bruno Lima Souza', 'aluno', 'aluno')).toBe('Bruno')
    expect(nomeVisivel('Bruno Lima Souza', 'aluno', 'monitor')).toBe('Bruno Lima Souza')
    expect(nomeVisivel('Carla Mendes', 'monitor', 'aluno')).toBe('Carla Mendes')
  })

  it('nome de cadastro com telefone ou @ não aparece na sala', () => {
    expect(nomeVisivel('Carla 21 98765-4321', 'monitor', 'aluno')).toBe('Carla')
    expect(nomeVisivel('@carla.med23', 'monitor', 'aluno')).toBe('Monitor')
    expect(nomeVisivel('21987654321', 'aluno', 'monitor')).toBe('Aluno')
  })
})
