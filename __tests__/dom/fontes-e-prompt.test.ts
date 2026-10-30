import { describe, expect, it } from 'vitest'
import { fontesDaBusca, fontesDasReferencias, urlDeBusca } from '@/lib/dom/fontes'
import { montarPromptDoSistema } from '@/lib/dom/prompt'
import { temasDoPeriodo, temaPorId } from '@/lib/dom/temas'
import { falaDe, textoDaFala, FALAS } from '@/components/dom/falas'

describe('fontes', () => {
  it('monta busca recente no PubMed e descarta referência incompleta', () => {
    const f = fontesDasReferencias([
      { titulo: 'Fisiologia do potencial de ação', busca: 'action potential physiology', base: 'pubmed' },
      { titulo: '', busca: 'x', base: 'pubmed' },
      { titulo: 'Diretriz', busca: 'insuficiência cardíaca', base: 'inventada' },
    ])
    expect(f).toHaveLength(2)
    expect(f[0].url).toContain('pubmed.ncbi.nlm.nih.gov/?term=action%20potential%20physiology')
    expect(f[0].url).toContain('datesearch.y_5')
    expect(f[1].origem).toBe('pubmed') // base desconhecida cai no PubMed
  })

  it('diretriz filtra pelos últimos 3 anos', () => {
    expect(urlDeBusca('diretriz', 'sepse', new Date('2026-10-30')).url).toContain('as_ylo=2023')
  })

  it('aceita só citações https de domínios conhecidos', () => {
    const dados = {
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc', title: 'nejm.org' } },
              { web: { uri: 'http://inseguro.com/x', title: 'inseguro' } },
              { web: { uri: 'https://blog-aleatorio.com/x', title: 'blog' } },
            ],
          },
        },
      ],
    }
    const f = fontesDaBusca(dados)
    expect(f).toHaveLength(1)
    expect(f[0].origem).toBe('web')
  })
})

describe('prompt', () => {
  const base = {
    aluno: { primeiroNome: 'Ana', periodo: 3, profissao: 'academico', faculdade: 'Afya', plano: 'Plus+', pagante: true, xp: { total: 1200, nivel: 5, liga: 'Bronze', semana: 80, sequencia: 4, posicaoSemana: 12, posicaoGeral: 340 } },
    agora: new Date('2026-10-30T13:00:00Z'),
    canario: 'DOM-teste',
    destinos: [{ id: 'dom:senha', titulo: 'Trocar a senha', href: '/profile?campo=senha', exclusivo: false }],
  }
  it('leva nome, período, XP, ranking, destinos e canário', () => {
    const p = montarPromptDoSistema({ ...base, modo: 'geral' })
    expect(p).toContain('Ana')
    expect(p).toContain('3º período')
    expect(p).toContain('nível 5')
    expect(p).toContain('12º na semana')
    expect(p).toContain('dom:senha')
    expect(p).toContain('DOM-teste')
    expect(p).toContain('bom dia') // 13h UTC = 10h em São Paulo
  })
  it('modo socrático leva a escada e o tema', () => {
    const tema = temasDoPeriodo('medicina', 1)[0]
    const p = montarPromptDoSistema({ ...base, modo: 'socratico', destinos: [], tema: { ...tema, curso: 'medicina', periodo: 1 } })
    expect(p).toContain('MÉTODO SOCRÁTICO')
    expect(p).toContain(tema.titulo)
    expect(p).toContain('porque-do-porque')
  })
})

describe('temas', () => {
  it('achata a grade do período e acha pelo id', () => {
    const temas = temasDoPeriodo('medicina', 1)
    expect(temas.length).toBeGreaterThan(5)
    expect(temaPorId('medicina', 1, temas[0].id)?.titulo).toBe(temas[0].titulo)
    expect(temasDoPeriodo('medicina', 9)).toEqual([])
  })
})

describe('falas', () => {
  it('saudações e momentos do assistente têm várias versões e não repetem em seguida', () => {
    for (const m of ['bomDia', 'boaTarde', 'boaNoite', 'pensando', 'erro', 'tchau'] as const) expect(FALAS[m].length).toBeGreaterThanOrEqual(5)
    const a = falaDe('bomDia')
    const b = falaDe('bomDia')
    expect(a.id).not.toBe(b.id)
    expect(textoDaFala(a)).not.toMatch(/\[/)
  })
})
