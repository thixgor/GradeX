import { afterEach, describe, expect, it, vi } from 'vitest'
import { regraDeAlterarHorario } from '@/lib/monitorias/politica'
import { capturar } from '@/lib/monitorias/sala/cliente/midia'

const agora = new Date('2026-10-20T15:00:00Z')
const em = (min: number) => new Date(agora.getTime() + min * 60_000)

describe('suporte: alterar horário / iniciar agora', () => {
  it('confirmada: agora (com 5 min de tolerância) e futuro valem; passado não', () => {
    expect(regraDeAlterarHorario('confirmada', agora, agora).ok).toBe(true)
    expect(regraDeAlterarHorario('confirmada', em(-4), agora).ok).toBe(true)
    expect(regraDeAlterarHorario('confirmada', em(-10), agora).ok).toBe(false)
    expect(regraDeAlterarHorario('confirmada', em(60 * 24 * 30), agora).ok).toBe(true)
    expect(regraDeAlterarHorario('confirmada', em(60 * 24 * 91), agora).ok).toBe(false)
  })

  it('aguardando contrato/pagamento: só com 2 h de folga', () => {
    expect(regraDeAlterarHorario('aguardando_pagamento', em(119), agora).ok).toBe(false)
    expect(regraDeAlterarHorario('aguardando_pagamento', em(121), agora).ok).toBe(true)
    expect(regraDeAlterarHorario('aguardando_assinaturas', agora, agora).ok).toBe(false)
  })

  it('negociação, realizada e encerradas: não', () => {
    for (const s of ['em_negociacao', 'realizada', 'concluida', 'cancelada_suporte'] as const) {
      expect(regraDeAlterarHorario(s, em(600), agora).ok).toBe(false)
    }
  })

  it('horário inválido', () => {
    expect(regraDeAlterarHorario('confirmada', new Date('x'), agora).ok).toBe(false)
  })
})

function trilha(kind: 'audio' | 'video') {
  return { kind, stop: vi.fn(), getSettings: () => ({ deviceId: kind + '-1' }) }
}
function stream(audio: boolean, video: boolean) {
  const a = audio ? [trilha('audio')] : []
  const v = video ? [trilha('video')] : []
  return { getAudioTracks: () => a, getVideoTracks: () => v }
}
const negado = Object.assign(new Error('negado'), { name: 'NotAllowedError' })

describe('captura de câmera e microfone', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('a página sem permissão de microfone (navegação interna) não derruba a câmera', async () => {
    const getUserMedia = vi.fn(async (c: MediaStreamConstraints) => {
      if (c.audio) throw negado
      return stream(false, true)
    })
    vi.stubGlobal('document', { permissionsPolicy: { allowsFeature: (f: string) => f !== 'microphone' } })
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    const r = await capturar({ audio: true, video: true })
    expect(r.estadoAudio).toBe('pagina')
    expect(r.estadoVideo).toBe('ligado')
    // Nem pediu o microfone (o navegador recusaria sem perguntar).
    expect(getUserMedia.mock.calls.every(([c]) => !c.audio)).toBe(true)
  })

  it('pedido conjunto negado: descobre qual aparelho foi bloqueado', async () => {
    const getUserMedia = vi.fn(async (c: MediaStreamConstraints) => {
      if (c.audio) throw negado
      return stream(false, true)
    })
    vi.stubGlobal('document', {})
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia },
      permissions: { query: async ({ name }: { name: string }) => ({ state: name === 'camera' ? 'granted' : 'denied' }) },
    })
    const r = await capturar({ audio: true, video: true })
    expect(r.estadoAudio).toBe('negado')
    expect(r.estadoVideo).toBe('ligado')
    expect(r.video).not.toBeNull()
  })

  it('os dois negados (ou sem como saber): não insiste', async () => {
    const getUserMedia = vi.fn(async () => {
      throw negado
    })
    vi.stubGlobal('document', {})
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    const r = await capturar({ audio: true, video: true })
    expect(r).toMatchObject({ estadoAudio: 'negado', estadoVideo: 'negado' })
    expect(getUserMedia).toHaveBeenCalledTimes(1)
  })

  it('tudo certo: um pedido só', async () => {
    const getUserMedia = vi.fn(async () => stream(true, true))
    vi.stubGlobal('document', { permissionsPolicy: { allowsFeature: () => true } })
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    const r = await capturar({ audio: true, video: true })
    expect(r).toMatchObject({ estadoAudio: 'ligado', estadoVideo: 'ligado' })
    expect(getUserMedia).toHaveBeenCalledTimes(1)
  })
})
