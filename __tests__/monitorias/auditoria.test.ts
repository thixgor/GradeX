import { describe, expect, it } from 'vitest'
import { decidirCancelamento, dentroDoArrependimento, DIAS_ARREPENDIMENTO } from '@/lib/monitorias/politica'
import { forcaDoAnuncio, type EntradaForca } from '@/lib/monitorias/forca-anuncio'
import { ganhoMensalEstimado } from '@/lib/monitorias/precos'
import { hashDoContrato, intermediadoraAtual, secoesDoContrato, textoDoContrato, VERSAO_CONTRATO } from '@/lib/monitorias/documentos/contrato'
import { PLATAFORMA, textoDosTermos, VERSAO_TERMOS } from '@/lib/monitorias/documentos/termos'
import { requisitosDoAluno, pendentes } from '@/lib/monitorias/requisitos'
import { origemConfiavel } from '@/lib/monitorias/origem'
import type { DadosContrato } from '@/lib/monitorias/tipos'

const H = 3_600_000
const DIA = 24 * H

describe('direito de arrependimento (CDC art. 49)', () => {
  const agora = new Date('2026-10-10T12:00:00Z')

  it('vale por 7 dias contados do pagamento', () => {
    expect(DIAS_ARREPENDIMENTO).toBe(7)
    expect(dentroDoArrependimento(new Date(agora.getTime() - 6 * DIA), agora)).toBe(true)
    expect(dentroDoArrependimento(new Date(agora.getTime() - 7 * DIA), agora)).toBe(true)
    expect(dentroDoArrependimento(new Date(agora.getTime() - 7 * DIA - 1), agora)).toBe(false)
    expect(dentroDoArrependimento(undefined, agora)).toBe(false)
  })

  it('aluno no prazo, mesmo a menos de 24h da aula, recebe 100% (e não vai para o suporte)', () => {
    const r = decidirCancelamento({
      ator: 'aluno',
      status: 'confirmada',
      inicio: new Date(agora.getTime() + 5 * H),
      agora,
      haPagamento: true,
      pagoEm: new Date(agora.getTime() - 2 * DIA),
    })
    expect(r).toEqual({ tipo: 'reembolso_total', arrependimento: true })
  })

  it('fora do prazo e a menos de 24h → suporte; com 24h ou mais → 100% sem ser arrependimento', () => {
    const pagoEm = new Date(agora.getTime() - 10 * DIA)
    expect(decidirCancelamento({ ator: 'aluno', status: 'confirmada', inicio: new Date(agora.getTime() + 5 * H), agora, haPagamento: true, pagoEm })).toEqual({ tipo: 'suporte' })
    expect(decidirCancelamento({ ator: 'aluno', status: 'confirmada', inicio: new Date(agora.getTime() + 30 * H), agora, haPagamento: true, pagoEm })).toEqual({ tipo: 'reembolso_total' })
  })

  it('não vale depois que a aula começou', () => {
    const r = decidirCancelamento({ ator: 'aluno', status: 'confirmada', inicio: new Date(agora.getTime() - H), agora, haPagamento: true, pagoEm: new Date(agora.getTime() - DIA) })
    expect(r.tipo).toBe('proibido')
  })
})

describe('força do anúncio', () => {
  const vazio: EntradaForca = { titulo: '', descricao: '', conteudos: 0, videos: 0, faq: 0, materiais: 0, temMateriais: false, aulaGratis: false, grupo: false, agendaDireta: false }
  const completo: EntradaForca = {
    titulo: 'ECG do zero: leia qualquer traçado em 2 aulas',
    descricao: 'x'.repeat(400),
    conteudos: 4,
    videos: 1,
    faq: 3,
    materiais: 2,
    temMateriais: true,
    aulaGratis: true,
    grupo: true,
    agendaDireta: true,
  }

  it('anúncio vazio é fraco e recebe todas as dicas, a de maior ganho primeiro', () => {
    const f = forcaDoAnuncio(vazio)
    expect(f.pontos).toBe(0)
    expect(f.nivel).toBe('fraco')
    expect(f.dicas[0].ganho).toBe(20)
    expect(f.dicas[0].texto).toMatch(/vídeo/)
    expect(f.dicas.map((d) => d.ganho)).toEqual([...f.dicas.map((d) => d.ganho)].sort((a, b) => b - a))
  })

  it('anúncio completo chega a 100 sem dicas', () => {
    const f = forcaDoAnuncio(completo)
    expect(f).toEqual({ pontos: 100, nivel: 'excelente', dicas: [] })
  })

  it('pontua parcialmente (descrição média, 1 conteúdo, 1 FAQ)', () => {
    const f = forcaDoAnuncio({ ...completo, descricao: 'y'.repeat(150), conteudos: 1, faq: 1 })
    expect(f.pontos).toBe(100 - 7 - 5 - 5)
    expect(f.nivel).toBe('excelente')
  })
})

describe('simulador de ganhos', () => {
  it('R$ 60/h × 4 h/semana → R$ 1.040,00 brutos e R$ 936,00 líquidos por mês', () => {
    expect(ganhoMensalEstimado(6000, 4)).toEqual({ brutoCentavos: 104000, liquidoCentavos: 93600 })
  })
  it('nunca fica negativo', () => {
    expect(ganhoMensalEstimado(-100, -2)).toEqual({ brutoCentavos: 0, liquidoCentavos: 0 })
  })
})

describe('contrato v2', () => {
  const dados: DadosContrato = {
    numero: 'DA-MON-2026-000777',
    modeloVersao: VERSAO_CONTRATO,
    contratante: { userId: 'a', nome: 'Aluna Exemplo', cpf: '52998224725', email: 'aluna@exemplo.com' },
    contratado: { userId: 'm', nome: 'Monitor Exemplo', cpf: '11144477735', email: 'monitor@exemplo.com' },
    anuncio: { id: 'an', titulo: 'ECG do zero', materia: 'Cardiologia' },
    conteudos: ['Eixo'],
    inicio: '2026-10-19T22:30:00.000Z',
    fim: '2026-10-19T23:30:00.000Z',
    duracaoMin: 60,
    vagas: 1,
    valorCentavos: 6000,
    taxaPlataformaCentavos: 600,
    gratis: false,
    origem: 'negociacao',
    emitidoEm: '2026-10-10T12:00:00.000Z',
    intermediadora: intermediadoraAtual(),
  }

  it('não mostra e-mail nem CPF inteiro (o aluno lê antes de pagar: seria convite ao pagamento "por fora")', () => {
    const texto = textoDoContrato(dados)
    expect(texto).toContain('***.982.247-**')
    expect(texto).toContain('***.444.777-**')
    expect(texto).not.toContain('52998224725')
    expect(texto).not.toContain('529.982.247-25')
    expect(texto).not.toContain('111.444.777-35')
    expect(texto).not.toContain('@exemplo.com')
  })

  it('traz arrependimento, art. 413 e foro do consumidor', () => {
    const texto = textoDoContrato(dados)
    expect(texto).toContain('art. 49')
    expect(texto).toContain('art. 413')
    expect(texto).toContain('CDC, art. 101, I')
    expect(texto).toContain(`versão ${VERSAO_TERMOS}`)
  })

  it('o hash é do texto guardado: mudar os dados da empresa depois não altera contrato já emitido', () => {
    const secoes = secoesDoContrato(dados)
    const antes = hashDoContrato(dados, secoes)
    expect(antes).toBe(hashDoContrato(dados))
    const original = PLATAFORMA.razaoSocial
    try {
      ;(PLATAFORMA as { razaoSocial: string }).razaoSocial = 'Outra Empresa LTDA'
      expect(hashDoContrato(dados, secoes)).toBe(antes)
      expect(hashDoContrato(dados)).toBe(antes) // a intermediadora congelada nos dados também segura
    } finally {
      ;(PLATAFORMA as { razaoSocial: string }).razaoSocial = original
    }
  })

  it('qualquer mudança nos dados muda o hash', () => {
    expect(hashDoContrato({ ...dados, valorCentavos: 6001 })).not.toBe(hashDoContrato(dados))
  })
})

describe('termos v2', () => {
  it('aluno: arrependimento, ressalva do CDC e foro do domicílio do aluno', () => {
    const t = textoDosTermos('aluno')
    expect(t).toContain('Cancelamento e reembolso')
    expect(t).toContain('art. 49')
    expect(t).toContain('Nada nestes Termos exclui ou reduz direitos que o Código de Defesa do Consumidor')
    expect(t).toContain('foro do domicílio do Aluno')
    expect(t).toContain('LGPD, art. 18')
  })

  it('monitor: responsabilidade exclusiva, tributos e contestação de suspensão', () => {
    const t = textoDosTermos('monitor')
    expect(t).toContain('Responsabilidade exclusiva do Monitor')
    expect(t).toContain('obrigações fiscais')
    expect(t).toContain('contestá-la')
    expect(t).not.toContain('foro do domicílio do Aluno')
  })

  it('numeração das seções é contínua', () => {
    for (const papel of ['aluno', 'monitor'] as const) {
      const numeros = textoDosTermos(papel)
        .split('\n')
        .map((l) => /^(\d+)\. [A-ZÀ-Ú]/.exec(l)?.[1])
        .filter(Boolean)
        .map(Number)
      expect(numeros).toEqual(numeros.map((_, i) => i + 1))
    }
  })
})

describe('maioridade do aluno', () => {
  const base = {
    name: 'Ana',
    fullName: 'Ana Souza',
    cpf: '52998224725',
    emailVerified: true,
    phone: '11999999999',
    state: 'SP',
    profession: 'medico',
    specialty: 'Clínica',
    crm: '123',
  } as const
  const agora = new Date('2026-10-10T12:00:00Z')

  it('nascimento indicando menor de 18 bloqueia', () => {
    const itens = requisitosDoAluno({ user: { ...base, dateOfBirth: new Date('2010-01-01') } as any, termosAceitos: true, agora })
    expect(pendentes(itens).map((i) => i.chave)).toContain('idade')
  })

  it('maior de idade, ou sem data informada, não é bloqueado por idade', () => {
    const adulto = requisitosDoAluno({ user: { ...base, dateOfBirth: new Date('1999-01-01') } as any, termosAceitos: true, agora })
    const semData = requisitosDoAluno({ user: { ...base } as any, termosAceitos: true, agora })
    expect(adulto.find((i) => i.chave === 'idade')).toBeUndefined()
    expect(semData.find((i) => i.chave === 'idade')).toBeUndefined()
  })
})

describe('origem confiável (CSRF)', () => {
  const req = (method: string, headers: Record<string, string>) => ({
    method,
    headers: { get: (n: string) => headers[n.toLowerCase()] ?? null },
  })

  it('leitura sempre passa', () => {
    expect(origemConfiavel(req('GET', { origin: 'https://mal.com', host: 'domineaqui.com.br' }))).toBe(true)
  })
  it('escrita do próprio site passa; de outro site é barrada', () => {
    expect(origemConfiavel(req('POST', { origin: 'https://domineaqui.com.br', host: 'domineaqui.com.br' }))).toBe(true)
    expect(origemConfiavel(req('POST', { origin: 'https://www.domineaqui.com.br', 'x-forwarded-host': 'www.domineaqui.com.br', host: 'interno' }))).toBe(true)
    expect(origemConfiavel(req('POST', { origin: 'https://mal.com', host: 'domineaqui.com.br' }))).toBe(false)
    expect(origemConfiavel(req('DELETE', { origin: 'null', host: 'domineaqui.com.br' }))).toBe(false)
  })
  it('sem Origin (servidor, cron) segue para a autenticação normal', () => {
    expect(origemConfiavel(req('POST', { host: 'domineaqui.com.br' }))).toBe(true)
  })
})
