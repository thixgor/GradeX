import { describe, expect, it } from 'vitest'
import {
  buscarNaTranscricao,
  capituloAtual,
  lerCapitulos,
  lerTempo,
  lerTranscricao,
  normalizarCapitulos,
  normalizarTranscricao,
  paraBusca,
} from '@/lib/aulas/marcadores'

/**
 * Estes testes existem porque um carimbo de tempo lido errado não falha: ele
 * manda o aluno para o lugar errado do vídeo com toda a confiança do mundo —
 * pior do que não ter capítulo nenhum.
 */

describe('lerTempo', () => {
  it('lê os três formatos usuais', () => {
    expect(lerTempo('0:30')).toBe(30)
    expect(lerTempo('12:48')).toBe(768)
    expect(lerTempo('1:02:03')).toBe(3723)
  })

  it('o número de campos decide a unidade, não o valor', () => {
    // A armadilha clássica: adivinhar pelo tamanho faria 90:00 virar 90 horas.
    expect(lerTempo('90:00')).toBe(5400)
    expect(lerTempo('1:30')).toBe(90)
    expect(lerTempo('1:30:00')).toBe(5400)
  })

  it('aceita milissegundos de VTT e SRT', () => {
    expect(lerTempo('00:01:30.500')).toBe(90)
    expect(lerTempo('00:01:30,500')).toBe(90)
  })

  it('recusa carimbo malformado em vez de adivinhar', () => {
    expect(lerTempo('1:90:00')).toBeNull() // 90 minutos dentro de hh:mm:ss
    expect(lerTempo('12:99')).toBeNull() // 99 segundos
    expect(lerTempo('abc')).toBeNull()
    expect(lerTempo('')).toBeNull()
    expect(lerTempo('42')).toBeNull()
  })
})

describe('lerCapitulos', () => {
  it('lê o formato colado da descrição do YouTube', () => {
    const capitulos = lerCapitulos(`
      00:00 Introdução
      02:15 — Critérios diagnósticos
      12:48 - Conduta
    `)
    expect(capitulos).toEqual([
      { segundo: 0, titulo: 'Introdução' },
      { segundo: 135, titulo: 'Critérios diagnósticos' },
      { segundo: 768, titulo: 'Conduta' },
    ])
  })

  it('ignora as linhas que não são capítulo, em vez de recusar tudo', () => {
    // Descrições reais vêm com cabeçalho e linhas soltas; recusar o texto
    // inteiro obrigaria a limpar na mão justamente o que se queria colar.
    const capitulos = lerCapitulos('Capítulos:\n\n00:00 Abertura\nInscreva-se!\n05:00 Fim')
    expect(capitulos.map((c) => c.titulo)).toEqual(['Abertura', 'Fim'])
  })

  it('descarta carimbo sem título', () => {
    expect(lerCapitulos('00:00\n01:00 Real')).toEqual([{ segundo: 60, titulo: 'Real' }])
  })

  it('ordena por tempo mesmo se colado fora de ordem', () => {
    const capitulos = lerCapitulos('05:00 Depois\n01:00 Antes')
    expect(capitulos.map((c) => c.segundo)).toEqual([60, 300])
  })
})

describe('lerTranscricao', () => {
  it('lê VTT do YouTube', () => {
    const vtt = `WEBVTT

00:00:00.000 --> 00:00:04.500
Hoje vamos falar de fibrilação atrial

00:00:04.500 --> 00:00:09.000
e dos critérios de anticoagulação.`

    const trechos = lerTranscricao(vtt)
    expect(trechos).toHaveLength(2)
    expect(trechos[0]).toEqual({ segundo: 0, fim: 4, texto: 'Hoje vamos falar de fibrilação atrial' })
    expect(trechos[1].segundo).toBe(4)
  })

  it('lê SRT, com o número da legenda antes do tempo', () => {
    const srt = `1
00:00:01,000 --> 00:00:03,000
Primeira fala

2
00:00:03,000 --> 00:00:05,000
Segunda fala`

    expect(lerTranscricao(srt).map((t) => t.texto)).toEqual(['Primeira fala', 'Segunda fala'])
  })

  it('remove as tags de estilo do VTT', () => {
    const vtt = `WEBVTT

00:00:00.000 --> 00:00:02.000
<c.colorE5E5E5>Texto</c> com <i>tag</i>`
    // Tags atrapalhariam a leitura e, pior, a busca.
    expect(lerTranscricao(vtt)[0].texto).toBe('Texto com tag')
  })

  it('junta as várias linhas de um mesmo bloco', () => {
    const vtt = `WEBVTT

00:00:00.000 --> 00:00:04.000
uma frase quebrada
em duas linhas`
    expect(lerTranscricao(vtt)[0].texto).toBe('uma frase quebrada em duas linhas')
  })

  it('lê texto carimbado à mão, com ou sem colchetes', () => {
    const trechos = lerTranscricao('[00:10] Primeira\n01:20 Segunda')
    expect(trechos).toEqual([
      { segundo: 10, texto: 'Primeira' },
      { segundo: 80, texto: 'Segunda' },
    ])
  })

  it('devolve vazio para texto sem carimbo nenhum', () => {
    expect(lerTranscricao('só um parágrafo comum')).toEqual([])
    expect(lerTranscricao('')).toEqual([])
  })
})

describe('capituloAtual', () => {
  const capitulos = [
    { segundo: 30, titulo: 'A' },
    { segundo: 120, titulo: 'B' },
    { segundo: 300, titulo: 'C' },
  ]

  it('devolve o último capítulo já iniciado', () => {
    expect(capituloAtual(capitulos, 0)).toBe(-1)
    expect(capituloAtual(capitulos, 30)).toBe(0)
    expect(capituloAtual(capitulos, 119)).toBe(0)
    expect(capituloAtual(capitulos, 120)).toBe(1)
    expect(capituloAtual(capitulos, 9999)).toBe(2)
  })

  it('devolve -1 antes do primeiro — caso real de lista que começa em 00:30', () => {
    expect(capituloAtual(capitulos, 10)).toBe(-1)
  })

  it('não quebra com lista vazia', () => {
    expect(capituloAtual([], 50)).toBe(-1)
  })
})

describe('buscarNaTranscricao', () => {
  const trechos = [
    { segundo: 0, texto: 'Critérios de fibrilação atrial' },
    { segundo: 60, texto: 'Dose de varfarina' },
    { segundo: 120, texto: 'Conduta na emergência' },
  ]

  it('acha ignorando acento e caixa', () => {
    expect(buscarNaTranscricao(trechos, 'FIBRILACAO')).toHaveLength(1)
    expect(buscarNaTranscricao(trechos, 'varfarina')[0].segundo).toBe(60)
  })

  it('devolve tudo com termo curto demais', () => {
    expect(buscarNaTranscricao(trechos, 'a')).toHaveLength(3)
  })
})

describe('paraBusca', () => {
  it('remove acentos de verdade', () => {
    // A mesma função já nasceu quebrada três vezes neste projeto: escrever o
    // intervalo com os combinantes literais gera uma regex que não remove nada.
    expect(paraBusca('Fibrilação Atrial')).toBe('fibrilacao atrial')
    expect(paraBusca('ÊÑÜÇÃÕ')).toBe('enucao')
  })
})

describe('normalização para gravação', () => {
  it('aceita o texto colado direto', () => {
    expect(normalizarCapitulos('00:00 Abertura')).toEqual([{ segundo: 0, titulo: 'Abertura' }])
    expect(normalizarTranscricao('00:05 Olá')).toEqual([{ segundo: 5, texto: 'Olá' }])
  })

  it('aceita a lista já estruturada e descarta item inválido', () => {
    expect(
      normalizarCapitulos([
        { segundo: 10, titulo: 'Vale' },
        { segundo: -1, titulo: 'Negativo' },
        { segundo: 20, titulo: '   ' },
      ]),
    ).toEqual([{ segundo: 10, titulo: 'Vale' }])
  })

  it('devolve null quando não sobra nada — é o que limpa o campo', () => {
    expect(normalizarCapitulos('')).toBeNull()
    expect(normalizarCapitulos([])).toBeNull()
    expect(normalizarTranscricao('texto sem carimbo')).toBeNull()
    expect(normalizarTranscricao(null)).toBeNull()
  })

  it('descarta um fim que não é posterior ao início', () => {
    expect(normalizarTranscricao([{ segundo: 10, fim: 5, texto: 'x' }])).toEqual([
      { segundo: 10, texto: 'x' },
    ])
  })
})
