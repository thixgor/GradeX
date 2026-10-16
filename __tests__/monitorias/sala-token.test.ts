import { beforeEach, describe, expect, it } from 'vitest'
import { SignJWT } from 'jose'
import { _esquecerSegredo, emitirTokenDaSala, pidDe, verificarTokenDaSala, vinculoDaSessao, type ClaimsDaSala } from '@/lib/monitorias/sala/token'
import { etagDaSala, retratoDaSala, usoPlausivel } from '@/lib/monitorias/sala/servidor'
import type { ParticipanteSala } from '@/lib/monitorias/tipos'

const claims: ClaimsDaSala = {
  sala: '65f0c0ffee0000000000aaaa',
  uid: '65f0c0ffee0000000000bbbb',
  pid: 'AbCdEfGhIjKlMnOp',
  papel: 'aluno',
  cx: 'conexao-123',
  ep: 2,
  sj: '0123456789abcdef',
}

beforeEach(() => {
  process.env.MONITORIAS_SALA_SECRET = 'x'.repeat(40)
  _esquecerSegredo()
})

describe('sala: token', () => {
  it('ida e volta', async () => {
    const t = await emitirTokenDaSala(claims, new Date(Date.now() + 60_000))
    expect(await verificarTokenDaSala(t)).toEqual(claims)
  })

  it('vencido não vale; a saída pelo beacon tolera até 1 h', async () => {
    const t = await emitirTokenDaSala(claims, new Date(Date.now() - 10 * 60_000))
    expect(await verificarTokenDaSala(t)).toBeNull()
    expect(await verificarTokenDaSala(t, { toleranciaS: 3600 })).toEqual(claims)
  })

  it('outro segredo, outra audiência, campos faltando ou papel inventado: nulo', async () => {
    const t = await emitirTokenDaSala(claims, new Date(Date.now() + 60_000))
    process.env.MONITORIAS_SALA_SECRET = 'y'.repeat(40)
    _esquecerSegredo()
    expect(await verificarTokenDaSala(t)).toBeNull()

    const chave = new TextEncoder().encode(process.env.MONITORIAS_SALA_SECRET)
    const semAud = await new SignJWT({ ...claims }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1m').sign(chave)
    expect(await verificarTokenDaSala(semAud)).toBeNull()
    const admin = await new SignJWT({ ...claims, papel: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setAudience('monitorias-sala').setExpirationTime('1m').sign(chave)
    expect(await verificarTokenDaSala(admin)).toBeNull()
    const semCx = await new SignJWT({ ...claims, cx: '' }).setProtectedHeader({ alg: 'HS256' }).setAudience('monitorias-sala').setExpirationTime('1m').sign(chave)
    expect(await verificarTokenDaSala(semCx)).toBeNull()
    expect(await verificarTokenDaSala('lixo')).toBeNull()
    expect(await verificarTokenDaSala(null)).toBeNull()
  })

  it('token de sessão (sem a audiência da sala) não vale como token de sala', async () => {
    const chave = new TextEncoder().encode(process.env.MONITORIAS_SALA_SECRET)
    const sessao = await new SignJWT({ userId: claims.uid, role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(chave)
    expect(await verificarTokenDaSala(sessao)).toBeNull()
  })

  it('pid é estável, opaco e diferente por sala', () => {
    const a = pidDe('sala1', 'user1')
    expect(a).toMatch(/^[A-Za-z0-9_-]{16}$/)
    expect(pidDe('sala1', 'user1')).toBe(a)
    expect(pidDe('sala2', 'user1')).not.toBe(a)
    expect(a).not.toContain('user1')
  })

  it('vínculo com a sessão muda com o jti', () => {
    expect(vinculoDaSessao({ userId: 'u', jti: 'a' })).not.toBe(vinculoDaSessao({ userId: 'u', jti: 'b' }))
    expect(vinculoDaSessao({ userId: 'u', iat: 1 })).toHaveLength(16)
  })
})

describe('sala: retrato e consumo', () => {
  const agora = new Date('2026-11-10T17:10:00Z')
  const p = (papel: 'monitor' | 'aluno', nome: string, vistoHaMs = 1_000, conexao: string | null = 'cx'): ParticipanteSala => ({
    uid: 'u-' + nome, papel, nome, conexao, epoca: 1, entrouEm: agora, vistoEm: new Date(agora.getTime() - vistoHaMs), turnUsuario: 'segredo-turn',
  })
  const sala = {
    participantes: { m: p('monitor', 'Carla Mendes'), a: p('aluno', 'Ana Souza'), b: p('aluno', 'Bruno Lima'), z: p('aluno', 'Zeca Saiu', 200_000) },
    versao: 3,
    seq: 9,
    esperados: 4,
    encerradaEm: null,
    fim: new Date('2026-11-10T18:00:00Z'),
  }

  it('aluno vê o primeiro nome dos colegas e o nome do monitor; ninguém vê userId nem TURN', () => {
    const r = retratoDaSala(sala as any, 'a', 'aluno', agora)
    const nomes = Object.fromEntries(r.participantes.map((x) => [x.pid, x.nome]))
    expect(nomes).toEqual({ m: 'Carla Mendes', a: 'Ana', b: 'Bruno' })
    expect(JSON.stringify(r)).not.toContain('u-')
    expect(JSON.stringify(r)).not.toContain('segredo-turn')
    expect(r.participantes.find((x) => x.pid === 'a')?.eu).toBe(true)
  })

  it('monitor vê o nome completo; ausente não aparece', () => {
    const r = retratoDaSala(sala as any, 'm', 'monitor', agora)
    expect(r.participantes.map((x) => x.nome).sort()).toEqual(['Ana Souza', 'Bruno Lima', 'Carla Mendes'])
    expect(r.fechaEm).toBe('2026-11-10T18:30:00.000Z')
  })

  it('ETag muda com sequência, versão e encerramento', () => {
    expect(etagDaSala({ seq: 1, versao: 1, encerrada: false })).not.toBe(etagDaSala({ seq: 2, versao: 1, encerrada: false }))
    expect(etagDaSala({ seq: 1, versao: 1, encerrada: false })).not.toBe(etagDaSala({ seq: 1, versao: 1, encerrada: true }))
  })

  it('relato de consumo inflado é cortado ao plausível; conexão direta não conta relé', () => {
    expect(usoPlausivel({ tipo: 'retransmitida', bytesRelay: 50_000_000_000, segundos: 600 })).toEqual({ tipo: 'retransmitida', bytesRelay: 187_500_000, segundos: 600 })
    expect(usoPlausivel({ tipo: 'direta', bytesRelay: 999, segundos: 600 })?.bytesRelay).toBe(0)
    expect(usoPlausivel({ tipo: null, bytesRelay: 0, segundos: 0 })).toBeNull()
    expect(usoPlausivel({ tipo: 'retransmitida', bytesRelay: 1, segundos: 99_999 })?.segundos).toBe(1200)
  })
})
