import { describe, expect, it } from 'vitest'
import {
  CONFIG_SALA_PADRAO,
  devoFecharOPar,
  entrouAlemDoLimite,
  NIVEIS_PADRAO,
  niveisDaConfig,
  nivelDeVideo,
  normalizarConfigSala,
  normalizarConfigVideo,
  PERFIS_DE_VIDEO,
} from '@/lib/monitorias/sala/regras'
import { lerMensagemDoCanal } from '@/lib/monitorias/sala/mensagens'
import { aplicarAnotacao, podeAnotar, TRACOS_POR_TELA, type Traco } from '@/lib/monitorias/sala/tela-anotada'
import { retratoQueVence } from '@/lib/monitorias/avatares'
import { EFEITOS_DE_VIDEO, EFEITOS_DE_VOZ, ehEfeitoDeVideo, ehEfeitoDeVoz, espelharPrevia, precisaProcessarVideo } from '@/lib/monitorias/sala/cliente/efeitos'
import { etagDaSala } from '@/lib/monitorias/sala/servidor'
import type { ParticipanteSala } from '@/lib/monitorias/tipos'

describe('vídeo: config do admin vira os níveis', () => {
  it('o padrão é o perfil "fluido" (30 fps, 800 kbps 1:1)', () => {
    expect(CONFIG_SALA_PADRAO.video.perfil).toBe('fluido')
    expect(NIVEIS_PADRAO.individual[0]).toEqual({ maxBitrate: 800_000, escala: 1, maxFramerate: 30 })
    expect(NIVEIS_PADRAO.captura).toEqual({ largura: 640, altura: 360, fps: 30 })
    expect(NIVEIS_PADRAO.individual[3]).toBeNull()
    expect(NIVEIS_PADRAO.adaptativo).toBe(true)
  })

  it('os degraus de rede ruim seguem o teto, sem cair abaixo de 5 fps', () => {
    const n = niveisDaConfig({ ...CONFIG_SALA_PADRAO.video, ...PERFIS_DE_VIDEO.economico })
    expect(n.individual[0]).toEqual({ maxBitrate: 300_000, escala: 1, maxFramerate: 15 })
    expect(n.individual[1]!.maxFramerate).toBe(12)
    expect(n.grupo[2]!.maxFramerate).toBe(5)
    expect(n.grupo[0]!.maxBitrate).toBe(150_000)
    expect(nivelDeVideo('grupo', 0, 'monitor', n)!.maxBitrate).toBeGreaterThan(n.grupo[0]!.maxBitrate)
  })

  it('"nítido" captura em 480p; a tela usa o fps e o teto do admin', () => {
    const n = niveisDaConfig({ ...CONFIG_SALA_PADRAO.video, ...PERFIS_DE_VIDEO.nitido, telaFps: 8, telaBitrateKbps: 2000 })
    expect(n.captura).toEqual({ largura: 854, altura: 480, fps: 24 })
    expect(n.tela.individual).toEqual({ maxBitrate: 2_000_000, maxFramerate: 8 })
    expect(n.tela.grupo.maxBitrate).toBeLessThan(2_000_000)
  })

  it('valores fora da faixa são cercados; registro antigo sem "video" ganha o padrão', () => {
    const v = normalizarConfigVideo({ perfil: 'turbo', fpsMax: 120, bitrateIndividualKbps: 10, resolucao: 1080, adaptativo: 'sim', telaFps: 0 })
    expect(v).toMatchObject({ perfil: 'fluido', fpsMax: 30, bitrateIndividualKbps: 150, resolucao: 360, adaptativo: true, telaFps: 2 })
    expect(normalizarConfigSala({ turnAtivo: false }).video).toEqual(CONFIG_SALA_PADRAO.video)
  })
})

describe('foto: conta e perfil de monitor sincronizados', () => {
  it('a da conta vence; conta sem foto adota a do monitor; iguais ou sem foto = nada', () => {
    expect(retratoQueVence('hipocrates', 'serie-house')?.monitor?.id).toBe('hipocrates')
    expect(retratoQueVence(null, 'hipocrates')?.conta?.id).toBe('hipocrates')
    expect(retratoQueVence('hipocrates', 'hipocrates')).toBeNull()
    expect(retratoQueVence(null, null)).toBeNull()
    expect(retratoQueVence('inventado', 'outro-inventado')).toBeNull()
  })
})

describe('efeitos: catálogo', () => {
  it('ids conhecidos, "nenhum" e o desfoque não criam processador; molduras com texto não espelham', () => {
    expect(EFEITOS_DE_VIDEO.length).toBeGreaterThan(12)
    expect(EFEITOS_DE_VOZ.map((e) => e.id)).toEqual(expect.arrayContaining(['robo', 'esquilo', 'grave', 'eco', 'caverna', 'radio', 'alien']))
    expect(ehEfeitoDeVideo('pb')).toBe(true)
    expect(ehEfeitoDeVideo('<script>')).toBe(false)
    expect(ehEfeitoDeVoz('robo')).toBe(true)
    expect(precisaProcessarVideo('nenhum')).toBe(false)
    expect(precisaProcessarVideo('desfoque')).toBe(false)
    expect(precisaProcessarVideo('raiox')).toBe(true)
    expect(espelharPrevia('moldura-domineaqui')).toBe(false)
    expect(espelharPrevia('pb')).toBe(true)
  })
})

describe('canal P2P: reações e anotações', () => {
  it('reação só do catálogo', () => {
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'reacao', e: '👏' }))).toEqual({ t: 'reacao', e: '👏' })
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'reacao', e: '🖕' }))).toBeNull()
  })

  it('traço conferido: cor da paleta, ferramenta conhecida, pontos pares dentro da tela', () => {
    const ok = { t: 'anotacao', op: 'traco', id: 'abc', ferramenta: 'caneta', cor: '#ef4444', pontos: [0.1, 0.2, 0.3, 0.4], fim: false }
    expect(lerMensagemDoCanal(JSON.stringify(ok))).toEqual(ok)
    expect(lerMensagemDoCanal(JSON.stringify({ ...ok, cor: 'red' }))).toBeNull()
    expect(lerMensagemDoCanal(JSON.stringify({ ...ok, ferramenta: 'spray' }))).toBeNull()
    expect(lerMensagemDoCanal(JSON.stringify({ ...ok, pontos: [0.1, 0.2, 0.3] }))).toBeNull()
    expect(lerMensagemDoCanal(JSON.stringify({ ...ok, pontos: [5, 5] }))).toBeNull()
    expect(lerMensagemDoCanal(JSON.stringify({ ...ok, pontos: new Array(602).fill(0.5) }))).toBeNull()
    expect(lerMensagemDoCanal(JSON.stringify({ t: 'anotacao', op: 'limpar' }))).toEqual({ t: 'anotacao', op: 'limpar' })
  })

  it('monitor risca qualquer tela; aluno só a própria', () => {
    expect(podeAnotar({ papel: 'monitor', donoDaTela: false })).toBe(true)
    expect(podeAnotar({ papel: 'aluno', donoDaTela: true })).toBe(true)
    expect(podeAnotar({ papel: 'aluno', donoDaTela: false })).toBe(false)
  })

  it('traços crescem por pedaços, cada um apaga só o seu, limpar respeita quem pode', () => {
    let t: Traco[] = []
    t = aplicarAnotacao(t, 'a', { t: 'anotacao', op: 'traco', id: '1', ferramenta: 'caneta', cor: '#ef4444', pontos: [0, 0], fim: false }, false)
    t = aplicarAnotacao(t, 'a', { t: 'anotacao', op: 'traco', id: '1', ferramenta: 'caneta', cor: '#ef4444', pontos: [0.5, 0.5], fim: true }, false)
    t = aplicarAnotacao(t, 'b', { t: 'anotacao', op: 'traco', id: '1', ferramenta: 'seta', cor: '#3b82f6', pontos: [0, 0, 1, 1], fim: true }, false)
    expect(t).toHaveLength(2)
    expect(t[0].pontos).toEqual([0, 0, 0.5, 0.5])
    // Traço fechado não cresce mais.
    t = aplicarAnotacao(t, 'a', { t: 'anotacao', op: 'traco', id: '1', ferramenta: 'caneta', cor: '#ef4444', pontos: [0.9, 0.9], fim: true }, false)
    expect(t[0].pontos).toHaveLength(4)
    expect(aplicarAnotacao(t, 'b', { t: 'anotacao', op: 'apagar', id: '1' }, false).map((x) => x.de)).toEqual(['a'])
    expect(aplicarAnotacao(t, 'b', { t: 'anotacao', op: 'limpar' }, false).map((x) => x.de)).toEqual(['a'])
    expect(aplicarAnotacao(t, 'm', { t: 'anotacao', op: 'limpar' }, true)).toEqual([])
  })

  it('limite de traços por tela', () => {
    let t: Traco[] = []
    for (let i = 0; i < TRACOS_POR_TELA + 5; i++) t = aplicarAnotacao(t, 'a', { t: 'anotacao', op: 'traco', id: `x${i}`, ferramenta: 'caneta', cor: '#ffffff', pontos: [0, 0], fim: true }, true)
    expect(t).toHaveLength(TRACOS_POR_TELA)
  })
})

describe('acesso: só fica quem pode', () => {
  const agora = new Date('2026-10-20T15:00:00Z')
  const p = (entrouHaMs: number, vistoHaMs = 1_000): ParticipanteSala => ({
    uid: 'u',
    papel: 'aluno',
    nome: 'X',
    conexao: 'cx',
    epoca: 1,
    entrouEm: new Date(agora.getTime() - entrouHaMs),
    vistoEm: new Date(agora.getTime() - vistoHaMs),
  })

  it('entrada simultânea além do limite desfaz a última', () => {
    const sala = { a: p(60_000), b: p(30_000), c: p(10), eu: p(0) }
    expect(entrouAlemDoLimite(sala, 'eu', 4, agora)).toBe(false)
    expect(entrouAlemDoLimite(sala, 'eu', 3, agora)).toBe(true)
    expect(entrouAlemDoLimite(sala, 'b', 3, agora)).toBe(false)
    // Quem já não está presente não ocupa vaga.
    expect(entrouAlemDoLimite({ ...sala, a: p(60_000, 200_000) }, 'eu', 3, agora)).toBe(false)
  })

  it('par conectado: removido fecha já; fora da lista, só depois de 90 s', () => {
    const t = 1_000_000
    expect(devoFecharOPar({ removido: true, listado: true, ausenteDesde: null, agora: t })).toBe(true)
    expect(devoFecharOPar({ removido: false, listado: true, ausenteDesde: null, agora: t })).toBe(false)
    expect(devoFecharOPar({ removido: false, listado: false, ausenteDesde: t - 60_000, agora: t })).toBe(false)
    expect(devoFecharOPar({ removido: false, listado: false, ausenteDesde: t - 90_000, agora: t })).toBe(true)
  })

  it('a ETag muda quando alguém deixa de estar presente (sem escrita no banco)', () => {
    const base = { seq: 3, versao: 7, encerrada: false }
    const com = etagDaSala({ ...base, participantes: [{ pid: 'a', presente: true } as any, { pid: 'b', presente: true } as any] })
    const sem = etagDaSala({ ...base, participantes: [{ pid: 'a', presente: true } as any, { pid: 'b', presente: false } as any] })
    expect(com).not.toBe(sem)
  })
})
