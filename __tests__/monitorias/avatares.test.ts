import { describe, expect, it } from 'vitest'
import { AVATARES, FILTROS_AVATAR, avatarPorId, creditoDoAvatar } from '@/lib/monitorias/avatares'
import { requisitosDoMonitor } from '@/lib/monitorias/requisitos'

describe('galeria de retratos do monitor (sem envio de foto)', () => {
  it('ids únicos e toda imagem vem do Wikimedia Commons (conteúdo livre, fora do nosso storage)', () => {
    expect(new Set(AVATARES.map((a) => a.id)).size).toBe(AVATARES.length)
    expect(AVATARES.length).toBeGreaterThanOrEqual(40)
    for (const a of AVATARES) {
      expect(a.url).toMatch(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//)
      expect(a.url).not.toMatch(/blob\.vercel-storage|\?/)
      expect(a.nome.length).toBeGreaterThan(2)
      expect(a.legenda).not.toMatch(/[—–]/)
    }
  })

  it('id inventado, vazio ou URL não vira foto (anti-burla)', () => {
    expect(avatarPorId('osler')?.nome).toBe('William Osler')
    expect(avatarPorId('nao-existe')).toBeNull()
    expect(avatarPorId('https://exemplo.com/eu.jpg')).toBeNull()
    expect(avatarPorId('')).toBeNull()
    expect(avatarPorId(undefined)).toBeNull()
    expect(avatarPorId('__proto__')).toBeNull()
  })

  it('tem brasileiros e mulheres, e os filtros cobrem o catálogo', () => {
    const f = (id: string) => AVATARES.filter(FILTROS_AVATAR.find((x) => x.id === id)!.aceita)
    expect(f('brasil').length).toBeGreaterThanOrEqual(10)
    expect(f('mulheres').length).toBeGreaterThanOrEqual(10)
    expect(f('classicos').length + f('seculo20').length + f('brasil').length).toBe(AVATARES.length)
  })

  it('crédito aponta para a página do arquivo no Commons', () => {
    expect(creditoDoAvatar({ arquivo: 'William Osler c1912.jpg' })).toBe('https://commons.wikimedia.org/wiki/File:William_Osler_c1912.jpg')
  })

  it('requisito "foto" só fica ok com retrato válido do catálogo', () => {
    const base = { user: { fullName: 'Ana Paula Souza' } as any, termosAceitos: true, exigirCpfReceita: false, agora: new Date('2026-10-10') }
    const item = (avatar?: string) => requisitosDoMonitor({ ...base, tutor: { avatar, pix: {} as any, status: 'ativo' } }).find((i) => i.chave === 'foto')!
    expect(item('osler').ok).toBe(true)
    expect(item('inventado').ok).toBe(false)
    expect(item(undefined).ok).toBe(false)
  })
})
