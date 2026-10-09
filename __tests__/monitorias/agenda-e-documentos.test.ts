import { describe, expect, it, beforeAll } from 'vitest'
import {
  blocosDaAula,
  cabeNaDisponibilidade,
  diaDaSemana,
  duracoesPermitidas,
  horariosLivres,
  instanteDeBrasilia,
  validarJanelas,
} from '@/lib/monitorias/agenda'
import { hashDoContrato, textoDoContrato } from '@/lib/monitorias/documentos/contrato'
import { textoDosTermos } from '@/lib/monitorias/documentos/termos'
import { normalizarAnuncio } from '@/lib/monitorias/validacao'
import type { DadosContrato, Disponibilidade } from '@/lib/monitorias/tipos'

const disp: Disponibilidade = {
  semanal: [{ dia: 1, inicio: '19:00', fim: '22:00' }], // segunda 19h–22h (Brasília)
  diasBloqueados: [],
  intervaloMin: 0,
}

describe('agenda em horário de Brasília', () => {
  it('converte dia + hora de Brasília para UTC', () => {
    expect(instanteDeBrasilia('2026-10-19', '19:30').toISOString()).toBe('2026-10-19T22:30:00.000Z')
    expect(diaDaSemana('2026-10-19')).toBe(1)
  })

  it('confere a janela pelo dia de Brasília, não pelo de UTC', () => {
    // 21:00 de segunda em Brasília = 00:00 de terça em UTC.
    const inicio = instanteDeBrasilia('2026-10-19', '21:00')
    expect(inicio.getUTCDay()).toBe(2)
    expect(cabeNaDisponibilidade(disp, inicio, 60)).toBe(true)
    expect(cabeNaDisponibilidade(disp, inicio, 90)).toBe(false)
    expect(cabeNaDisponibilidade({ ...disp, diasBloqueados: ['2026-10-19'] }, inicio, 60)).toBe(false)
  })

  it('blocos de 30 min com folga', () => {
    const inicio = instanteDeBrasilia('2026-10-19', '19:30')
    expect(blocosDaAula(inicio, 90).map((b) => b.toISOString())).toEqual([
      '2026-10-19T22:30:00.000Z',
      '2026-10-19T23:00:00.000Z',
      '2026-10-19T23:30:00.000Z',
    ])
    expect(blocosDaAula(inicio, 60, 15)).toHaveLength(4)
  })

  it('lista horários livres respeitando ocupados e antecedência', () => {
    const agora = new Date('2026-10-18T12:00:00Z') // domingo
    const ocupado = instanteDeBrasilia('2026-10-19', '20:00').getTime()
    const livres = horariosLivres({ disp, duracaoMin: 60, ocupados: new Set([ocupado]), agora, antecedenciaMinHoras: 2, dias: 7 })
    expect(livres.map((l) => l.hora)).toEqual(['19:00', '20:30', '21:00'])
    expect(livres.every((l) => l.dia === '2026-10-19')).toBe(true)
  })

  it('valida janelas e durações', () => {
    expect(validarJanelas(disp.semanal)).toBeNull()
    expect(validarJanelas([{ dia: 1, inicio: '19:15', fim: '20:00' }])).toMatch(/meia hora/)
    expect(validarJanelas([{ dia: 1, inicio: '20:00', fim: '19:00' }])).toMatch(/antes do fim/)
    expect(validarJanelas([{ dia: 1, inicio: '19:00', fim: '21:00' }, { dia: 1, inicio: '20:00', fim: '22:00' }])).toMatch(/sobrepostos/)
    expect(duracoesPermitidas(60, 180, 30)).toEqual([60, 90, 120, 150, 180])
  })
})

describe('contrato: hash muda quando o dado muda', () => {
  const dados: DadosContrato = {
    numero: 'DA-MON-2026-000001',
    modeloVersao: '2026.10-v1',
    contratante: { userId: 'a', nome: 'Aluno Teste', cpf: '52998224725', email: 'aluno@x.com' },
    contratado: { userId: 'm', nome: 'Monitora Teste', cpf: '11144477735', email: 'mon@x.com' },
    anuncio: { id: 'an', titulo: 'Fisiologia Cardiovascular', materia: 'Fisiologia' },
    conteudos: ['Ciclo cardíaco'],
    inicio: '2026-10-19T22:30:00.000Z',
    fim: '2026-10-19T23:30:00.000Z',
    duracaoMin: 60,
    vagas: 1,
    valorCentavos: 6000,
    taxaPlataformaCentavos: 600,
    gratis: false,
    origem: 'negociacao',
    emitidoEm: '2026-10-10T12:00:00.000Z',
  }

  it('é estável e sensível a qualquer alteração', () => {
    const h = hashDoContrato(dados)
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(hashDoContrato({ ...dados })).toBe(h)
    expect(hashDoContrato({ ...dados, valorCentavos: 6001 })).not.toBe(h)
    expect(hashDoContrato({ ...dados, inicio: '2026-10-19T22:00:00.000Z' })).not.toBe(h)
  })

  it('o texto traz partes (CPF mascarado), valor e horário de Brasília', () => {
    const texto = textoDoContrato(dados)
    expect(texto).toContain('***.982.247-**')
    expect(texto).not.toContain('529.982.247-25')
    expect(texto).toContain('Monitora Teste')
    expect(texto).toContain('60,00')
    expect(texto).toContain('horário de Brasília')
    expect(texto).toContain('19:30')
  })

  it('termos de monitor e aluno são diferentes', () => {
    expect(textoDosTermos('monitor')).toContain('Responsabilidade exclusiva do Monitor')
    expect(textoDosTermos('aluno')).toContain('Cancelamento e reembolso')
  })
})

describe('anúncio: normalização', () => {
  const base = {
    titulo: 'Fisiologia Cardiovascular sem drama',
    materia: 'Fisiologia',
    conteudos: ['Ciclo cardíaco', 'ECG'],
    descricao: 'Aulas objetivas com casos clínicos, revisão de prova e muitos exercícios comentados.',
    videos: ['https://youtu.be/dQw4w9WgXcQ'],
    preco: { modo: 'hora', valorCentavos: 6000, duracaoPadraoMin: 60 },
    grupo: { ativo: true, maxAlunos: 5, faixas: [{ minAlunos: 3, valorPorPessoaCentavos: 4000 }] },
    aulaGratis: { ativa: true, duracaoMin: 30 },
    modos: { direto: { duracaoMinMin: 60, duracaoMaxMin: 180, passoMin: 30, antecedenciaMinHoras: 12 }, negociacao: true },
    faq: [{ pergunta: 'Como funciona?', resposta: 'Por Meet.' }],
    materiais: [{ titulo: 'Resumo', url: 'https://drive.google.com/x' }],
    temMateriais: false,
  }

  it('aceita o anúncio válido e normaliza vídeo e materiais', () => {
    const r = normalizarAnuncio(base)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.conteudo.videos).toEqual([{ provider: 'youtube', id: 'dQw4w9WgXcQ' }])
    expect(r.conteudo.materiais[0].dominio).toBe('drive.google.com')
    expect(r.conteudo.temMateriais).toBe(true)
  })

  it('remove HTML dos textos', () => {
    const r = normalizarAnuncio({ ...base, descricao: '<script>alert(1)</script>Aulas objetivas com casos clínicos e revisão completa para a prova.' })
    expect(r.ok && r.conteudo.descricao).toBe('Aulas objetivas com casos clínicos e revisão completa para a prova.')
  })

  it('recusa sem forma de contratação, vídeo estranho ou preço baixo', () => {
    expect(normalizarAnuncio({ ...base, modos: {} }).ok).toBe(false)
    expect(normalizarAnuncio({ ...base, videos: ['https://evil.com/v'] }).ok).toBe(false)
    expect(normalizarAnuncio({ ...base, preco: { ...base.preco, valorCentavos: 500 } }).ok).toBe(false)
    expect(normalizarAnuncio({ ...base, campoExtra: 1 }).ok).toBe(false)
  })
})

describe('cripto da chave PIX', () => {
  beforeAll(() => {
    process.env.MONITORIAS_PIX_SECRET = Buffer.alloc(32, 7).toString('base64')
  })

  it('cifra, decifra e detecta adulteração', async () => {
    const { cifrar, decifrar, normalizarChavePix, mascararChavePix } = await import('@/lib/monitorias/cripto')
    const pacote = cifrar('52998224725')
    expect(pacote).not.toContain('52998224725')
    expect(decifrar(pacote)).toBe('52998224725')
    const [iv, tag, corpo] = pacote.split('.')
    const adulterado = [iv, tag, Buffer.from('xxxxxxxxxxx').toString('base64url') || corpo].join('.')
    expect(() => decifrar(adulterado)).toThrow()
    expect(normalizarChavePix('telefone', '(11) 98765-4321')).toBe('+5511987654321')
    expect(normalizarChavePix('email', 'Ana@Gmail.com')).toBe('ana@gmail.com')
    expect(normalizarChavePix('cpf', '123')).toBeNull()
    expect(mascararChavePix('cpf', '52998224725')).toBe('***.982.247-**')
  })
})
