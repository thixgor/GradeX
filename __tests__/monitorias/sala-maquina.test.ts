import { describe, expect, it } from 'vitest'
import { faseDeSinal, PAR_NOVO, podeIrPara, transicaoDoPar, type EstadoDoPar, type EventoDoPar } from '@/lib/monitorias/sala/maquina'
import { lerMensagemDoCanal, sdpValido } from '@/lib/monitorias/sala/mensagens'

function rodar(eventos: Array<[EventoDoPar['tipo'], number]>, inicial: EstadoDoPar = PAR_NOVO) {
  let e = inicial
  const acoes: Array<string | null> = []
  for (const [tipo, t] of eventos) {
    const r = transicaoDoPar(e, { tipo } as EventoDoPar, t)
    e = r.estado
    acoes.push(r.acao)
  }
  return { e, acoes }
}

describe('sala: máquina do par', () => {
  it('caminho feliz', () => {
    const { e } = rodar([['negociacao_iniciada', 0], ['conectou', 1_000]])
    expect(e.fase).toBe('conectado')
  })

  it('oscilação espera antes de reiniciar e volta sozinha se reconectar', () => {
    const { e, acoes } = rodar([['negociacao_iniciada', 0], ['conectou', 1], ['oscilou', 2], ['conectou', 3]])
    expect(acoes[2]).toBe('agendar_espera')
    expect(e.fase).toBe('conectado')
    expect(e.reinicios).toEqual([])
  })

  it('espera vencida reinicia o ICE', () => {
    const { e, acoes } = rodar([['negociacao_iniciada', 0], ['conectou', 1], ['oscilou', 2], ['espera_venceu', 3_002]])
    expect(acoes.at(-1)).toBe('reiniciar_ice')
    expect(e.fase).toBe('reiniciando')
  })

  it('no máximo 3 reinícios em 2 min, uma reconstrução e então desiste (sem laço)', () => {
    const ev: Array<[EventoDoPar['tipo'], number]> = [['negociacao_iniciada', 0]]
    for (let i = 1; i <= 8; i++) ev.push(['falhou', i * 1_000])
    const { e, acoes } = rodar(ev)
    expect(acoes.slice(1)).toEqual(['reiniciar_ice', 'reiniciar_ice', 'reiniciar_ice', 'reconstruir', 'reiniciar_ice', 'reiniciar_ice', 'reiniciar_ice', 'desistir'])
    expect(e.fase).toBe('perdido')
    // Perdido ignora tudo, menos uma negociação nova ("Tentar de novo").
    expect(transicaoDoPar(e, { tipo: 'falhou' }, 100_000).acao).toBeNull()
    expect(transicaoDoPar(e, { tipo: 'negociacao_iniciada' }, 100_000).estado.fase).toBe('negociando')
  })

  it('reinícios antigos saem da janela', () => {
    const { acoes } = rodar([['negociacao_iniciada', 0], ['falhou', 1], ['falhou', 2], ['falhou', 3], ['falhou', 200_000]])
    expect(acoes.at(-1)).toBe('reiniciar_ice')
  })

  it('negociação que expira conta como tentativa', () => {
    const { acoes } = rodar([['negociacao_iniciada', 0], ['negociacao_expirou', 20_000]])
    expect(acoes.at(-1)).toBe('reiniciar_ice')
  })

  it('o outro saiu: perdido sem tentar nada', () => {
    const { e, acoes } = rodar([['negociacao_iniciada', 0], ['conectou', 1], ['saiu', 2]])
    expect(e.fase).toBe('perdido')
    expect(acoes.at(-1)).toBeNull()
  })
})

describe('sala: fase de sinalização', () => {
  it('ninguém: sozinho; alguém presente sem par ainda: negociando', () => {
    expect(faseDeSinal({ pares: [], outrosPresentes: 0, esperados: 2 })).toBe('sozinho')
    expect(faseDeSinal({ pares: [], outrosPresentes: 1, esperados: 2 })).toBe('negociando')
  })

  it('1:1 conectado: em aula (só pulso)', () => {
    expect(faseDeSinal({ pares: ['conectado'], outrosPresentes: 1, esperados: 2 })).toBe('em_aula')
  })

  it('grupo com gente faltando: incompleta', () => {
    expect(faseDeSinal({ pares: ['conectado'], outrosPresentes: 1, esperados: 4 })).toBe('incompleta')
    expect(faseDeSinal({ pares: ['conectado', 'conectado', 'conectado'], outrosPresentes: 3, esperados: 4 })).toBe('em_aula')
  })

  it('par caído manda reconectar; par perdido não acelera a sala', () => {
    expect(faseDeSinal({ pares: ['conectado', 'reiniciando'], outrosPresentes: 2, esperados: 3 })).toBe('reconectando')
    expect(faseDeSinal({ pares: ['perdido'], outrosPresentes: 1, esperados: 2 })).toBe('sozinho')
  })
})

describe('sala: fases da tela', () => {
  it('sem suporte é final; fora permite voltar', () => {
    expect(podeIrPara('sem_suporte', 'saguao')).toBe(false)
    expect(podeIrPara('fora', 'entrando')).toBe(true)
    expect(podeIrPara('na_sala', 'saguao')).toBe(false)
    expect(podeIrPara('verificando', 'na_sala')).toBe(false)
  })
})

describe('sala: mensagens do canal P2P (dado não confiável)', () => {
  const sdp = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n'

  it('aceita o formato certo', () => {
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'estado', mic: true, cam: false, tela: false }))).toEqual({ t: 'estado', mic: true, cam: false, tela: false, videoPausado: false })
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'chat', id: 'a1', texto: 'oi', em: '2026-11-10T17:00:00Z' }))?.t).toBe('chat')
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'sdp', tipo: 'offer', sdp, neg: 'n1' }))?.t).toBe('sdp')
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'tchau' }))).toEqual({ t: 'tchau' })
  })

  it('descarta lixo, tipos errados, campos gigantes e tipos desconhecidos', () => {
    expect(lerMensagemDoCanal('não é json')).toBeNull()
    expect(lerMensagemDoCanal(JSON.stringify([1, 2]))).toBeNull()
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'estado', mic: 'sim', cam: false, tela: false }))).toBeNull()
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'chat', id: 'a', texto: 'x'.repeat(2_001), em: 'e' }))).toBeNull()
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'chat', id: 'a', texto: '   ', em: 'e' }))).toBeNull()
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'admin' }))).toBeNull()
    expect(lerMensagemDoCanal('x'.repeat(30_000))).toBeNull()
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'ice', neg: 'n', lista: Array.from({ length: 31 }, () => ({ candidate: 'c' })) }))).toBeNull()
  })

  it('SDP: começa com v=0, tamanho e número de seções limitados', () => {
    expect(sdpValido(sdp)).toBe(true)
    expect(sdpValido('m=audio')).toBe(false)
    expect(sdpValido('v=0\r\n')).toBe(false)
    expect(sdpValido('v=0\r\n' + 'm=video 9\r\n'.repeat(7))).toBe(false)
    expect(sdpValido('v=0\r\nm=audio\r\n' + 'a'.repeat(16_000))).toBe(false)
  })
})
