import { describe, expect, it } from 'vitest'
import { dividirValor, interpretarValorEmReais, formatarCentavos } from '@/lib/monitorias/dinheiro'
import { economiaGrupoPercent, faixaPara, precoPorPessoaCentavos, validarFaixas } from '@/lib/monitorias/precos'
import { interpretarUrlDeVideo, urlDeEmbed, videoValido } from '@/lib/monitorias/videos'
import { validarLinkDeReuniao, validarLinkExterno } from '@/lib/monitorias/links'
import { mascararContato } from '@/lib/monitorias/contato'
import { podeTransitar } from '@/lib/monitorias/estado'
import { decidirCancelamento, liberacaoDoValor, podeReportar, prazoDePagamento, strikesRecentes } from '@/lib/monitorias/politica'
import type { ConteudoAnuncio } from '@/lib/monitorias/tipos'

describe('dinheiro: divisão 10/90 sem perder centavo', () => {
  it('soma das partes é sempre o bruto', () => {
    for (const bruto of [0, 1, 9, 10, 999, 1000, 12555, 33333, 500000]) {
      const d = dividirValor(bruto)
      expect(d.taxaPlataformaCentavos + d.liquidoTutorCentavos).toBe(bruto)
      expect(d.taxaPlataformaCentavos).toBe(Math.floor(bruto / 10))
    }
  })

  it('o centavo do arredondamento fica com o monitor', () => {
    expect(dividirValor(12555)).toEqual({ brutoCentavos: 12555, taxaPlataformaCentavos: 1255, liquidoTutorCentavos: 11300 })
  })

  it('interpreta valores em reais digitados', () => {
    expect(interpretarValorEmReais('125,50')).toBe(12550)
    expect(interpretarValorEmReais('R$ 1.250,00')).toBe(125000)
    expect(interpretarValorEmReais('60')).toBe(6000)
    expect(interpretarValorEmReais('abc')).toBeNull()
    expect(interpretarValorEmReais(19.9)).toBe(1990)
  })

  it('formata em reais', () => {
    expect(formatarCentavos(12550).replace(/\s/g, ' ')).toBe('R$ 125,50')
  })
})

describe('preços', () => {
  const anuncio: Pick<ConteudoAnuncio, 'preco' | 'grupo'> = {
    preco: { modo: 'hora', valorCentavos: 6000, duracaoPadraoMin: 60 },
    grupo: {
      ativo: true,
      maxAlunos: 6,
      faixas: [
        { minAlunos: 2, valorPorPessoaCentavos: 5000 },
        { minAlunos: 4, valorPorPessoaCentavos: 4000 },
      ],
    },
  }

  it('por hora multiplica pela duração', () => {
    expect(precoPorPessoaCentavos(anuncio, 90, 1)).toBe(9000)
    expect(precoPorPessoaCentavos(anuncio, 120, 1)).toBe(12000)
  })

  it('grupo usa a faixa certa', () => {
    expect(faixaPara(anuncio.grupo.faixas, 3)?.minAlunos).toBe(2)
    expect(precoPorPessoaCentavos(anuncio, 60, 3)).toBe(5000)
    expect(precoPorPessoaCentavos(anuncio, 60, 5)).toBe(4000)
    expect(economiaGrupoPercent(anuncio, 4)).toBe(33)
  })

  it('por aula ignora a duração', () => {
    const porAula = { ...anuncio, preco: { modo: 'aula' as const, valorCentavos: 8000, duracaoPadraoMin: 60 } }
    expect(precoPorPessoaCentavos(porAula, 120, 1)).toBe(8000)
  })

  it('faixas precisam baratear e começar em 2', () => {
    expect(validarFaixas(anuncio.grupo.faixas, 6000, 6)).toBeNull()
    expect(validarFaixas([{ minAlunos: 1, valorPorPessoaCentavos: 5000 }], 6000, 6)).toMatch(/2 alunos/)
    expect(validarFaixas([{ minAlunos: 2, valorPorPessoaCentavos: 7000 }], 6000, 6)).toMatch(/mais barata/)
    expect(validarFaixas([{ minAlunos: 8, valorPorPessoaCentavos: 3000 }], 6000, 6)).toMatch(/máximo/)
  })
})

describe('vídeos: só YouTube e Instagram, só o ID', () => {
  it('aceita formatos comuns do YouTube', () => {
    expect(interpretarUrlDeVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ' })
    expect(interpretarUrlDeVideo('https://youtu.be/dQw4w9WgXcQ?t=3')).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ' })
    expect(interpretarUrlDeVideo('https://youtube.com/shorts/dQw4w9WgXcQ')).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ' })
  })

  it('aceita post e reel do Instagram', () => {
    expect(interpretarUrlDeVideo('https://www.instagram.com/reel/C8abc123XYZ/')).toEqual({ provider: 'instagram', id: 'C8abc123XYZ', tipo: 'reel' })
    expect(interpretarUrlDeVideo('https://instagram.com/p/C8abc123XYZ')).toEqual({ provider: 'instagram', id: 'C8abc123XYZ', tipo: 'p' })
  })

  it('recusa hosts parecidos e esquemas perigosos', () => {
    for (const url of [
      'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
      'https://evil.com/youtube.com/watch?v=dQw4w9WgXcQ',
      'javascript:alert(1)',
      'https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=<script>',
      'https://vimeo.com/123',
    ]) {
      expect(interpretarUrlDeVideo(url)).toBeNull()
    }
  })

  it('o embed é sempre montado por nós', () => {
    expect(urlDeEmbed({ provider: 'youtube', id: 'dQw4w9WgXcQ' })).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/)
    expect(videoValido({ provider: 'youtube', id: '"><img>' })).toBe(false)
    expect(videoValido({ provider: 'vimeo', id: 'x' })).toBe(false)
  })
})

describe('links externos', () => {
  it('só https, sem credenciais, sem IP', () => {
    expect(validarLinkExterno('https://drive.google.com/file/abc')?.dominio).toBe('drive.google.com')
    expect(validarLinkExterno('http://site.com')).toBeNull()
    expect(validarLinkExterno('javascript:alert(1)')).toBeNull()
    expect(validarLinkExterno('https://a:b@site.com')).toBeNull()
    expect(validarLinkExterno('https://192.168.0.1/x')).toBeNull()
    expect(validarLinkExterno('https://localhost/x')).toBeNull()
  })

  it('reunião só nas plataformas conhecidas', () => {
    expect(validarLinkDeReuniao('https://meet.google.com/abc-defg-hij')).not.toBeNull()
    expect(validarLinkDeReuniao('https://us02web.zoom.us/j/123')).not.toBeNull()
    expect(validarLinkDeReuniao('https://zoom.us.evil.com/j/123')).toBeNull()
    expect(validarLinkDeReuniao('https://bit.ly/abc')).toBeNull()
  })
})

describe('máscara de contato antes do pagamento', () => {
  it('esconde telefone, e-mail, whatsapp e @', () => {
    const { texto, mascarou } = mascararContato('me chama no (11) 98765-4321 ou ana@gmail.com, wa.me/5511987654321 e @ana.monitora')
    expect(mascarou).toBe(true)
    expect(texto).not.toMatch(/98765/)
    expect(texto).not.toMatch(/gmail/)
    expect(texto).not.toMatch(/wa\.me/)
    expect(texto).not.toMatch(/@ana/)
  })

  it('não mexe em texto normal com horários e valores', () => {
    const msg = 'Pode ser sábado às 14:30? Fica R$ 120,00 por 2 horas.'
    expect(mascararContato(msg)).toEqual({ texto: msg, mascarou: false })
  })
})

describe('máquina de estados', () => {
  it('permite o caminho feliz', () => {
    expect(podeTransitar('solicitada', 'em_negociacao')).toBe(true)
    expect(podeTransitar('em_negociacao', 'aguardando_assinaturas')).toBe(true)
    expect(podeTransitar('aguardando_assinaturas', 'aguardando_pagamento')).toBe(true)
    expect(podeTransitar('aguardando_pagamento', 'confirmada')).toBe(true)
    expect(podeTransitar('confirmada', 'realizada')).toBe(true)
    expect(podeTransitar('realizada', 'concluida')).toBe(true)
  })

  it('bloqueia saltos e volta de estado final', () => {
    expect(podeTransitar('solicitada', 'confirmada')).toBe(false)
    expect(podeTransitar('aguardando_pagamento', 'concluida')).toBe(false)
    expect(podeTransitar('concluida', 'reembolsada')).toBe(false)
    expect(podeTransitar('cancelada_aluno', 'confirmada')).toBe(false)
    expect(podeTransitar('realizada', 'cancelada_aluno')).toBe(false)
  })
})

describe('política de cancelamento (fronteira das 24h)', () => {
  const inicio = new Date('2026-11-14T22:00:00Z') // sábado 19h em Brasília
  it('aluno com 24h ou mais → reembolso total', () => {
    const agora = new Date(inicio.getTime() - 24 * 3_600_000)
    expect(decidirCancelamento({ ator: 'aluno', status: 'confirmada', inicio, agora, haPagamento: true })).toEqual({ tipo: 'reembolso_total' })
  })
  it('aluno com menos de 24h → suporte', () => {
    const agora = new Date(inicio.getTime() - 24 * 3_600_000 + 60_000)
    expect(decidirCancelamento({ ator: 'aluno', status: 'confirmada', inicio, agora, haPagamento: true })).toEqual({ tipo: 'suporte' })
  })
  it('monitor → sempre total', () => {
    const agora = new Date(inicio.getTime() - 3_600_000)
    expect(decidirCancelamento({ ator: 'monitor', status: 'confirmada', inicio, agora, haPagamento: true })).toEqual({ tipo: 'reembolso_total' })
  })
  it('sem pagamento só cancela; depois de começar é proibido', () => {
    const antes = new Date(inicio.getTime() - 3_600_000)
    expect(decidirCancelamento({ ator: 'aluno', status: 'em_negociacao', inicio, agora: antes, haPagamento: false }).tipo).toBe('sem_pagamento')
    const depois = new Date(inicio.getTime() + 60_000)
    expect(decidirCancelamento({ ator: 'aluno', status: 'confirmada', inicio, agora: depois, haPagamento: true }).tipo).toBe('proibido')
    expect(decidirCancelamento({ ator: 'aluno', status: 'concluida', inicio, agora: antes, haPagamento: true }).tipo).toBe('proibido')
  })
  it('garantia, reporte, prazo e strikes', () => {
    const fim = new Date('2026-11-14T23:00:00Z')
    expect(liberacaoDoValor(fim).toISOString()).toBe('2026-11-16T23:00:00.000Z')
    expect(podeReportar(fim, new Date('2026-11-15T10:00:00Z'))).toBe(true)
    expect(podeReportar(fim, new Date('2026-11-17T00:00:00Z'))).toBe(false)
    const agora = new Date('2026-11-14T10:00:00Z')
    expect(prazoDePagamento(agora, inicio).toISOString()).toBe('2026-11-14T20:00:00.000Z')
    expect(strikesRecentes([{ em: new Date('2026-01-01') }, { em: new Date('2026-11-01') }], agora)).toBe(1)
  })
})
