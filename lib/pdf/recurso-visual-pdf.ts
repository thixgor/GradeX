import type jsPDF from 'jspdf'

import { escalaDoEixo, formatarValor, type RecursoVisual } from '@/lib/ia/estudo/recursos-visuais'
import { sanitizarParaPdf } from './marca'

/**
 * O material de apoio da questão (tabela, gráfico, esquema, citação) no PDF,
 * com primitivas do jsPDF — o par de `components/provas/recurso-visual.tsx`.
 * Vetorial: sai nítido em qualquer impressora e não pesa como imagem.
 *
 * Quebra de página: a tabela quebra entre linhas (e repete o cabeçalho); o
 * gráfico, o esquema e a citação vão inteiros para a página seguinte quando
 * não cabem.
 */

export interface ContextoDoRecursoNoPdf {
  doc: jsPDF
  fonte: string
  x: number
  largura: number
  y: number
  limiteInferior: number
  /** Abre página nova (com cabeçalho) e devolve o y onde o conteúdo recomeça. */
  novaPagina: () => number
}

const VERDE: [number, number, number] = [47, 125, 72]
const VERDE_CLARO: [number, number, number] = [233, 243, 236]
const BORDA: [number, number, number] = [210, 218, 212]
const TEXTO: [number, number, number] = [40, 46, 42]
const SUAVE: [number, number, number] = [110, 118, 112]
const CORES: [number, number, number][] = [
  [47, 125, 72],
  [217, 138, 18],
  [46, 143, 168],
]

const linhas = (doc: jsPDF, texto: string, largura: number): string[] =>
  doc.splitTextToSize(sanitizarParaPdf(texto || ''), largura) as string[]

export function desenharRecursoNoPdf(ctx: ContextoDoRecursoNoPdf, recurso: RecursoVisual): number {
  const { doc, fonte, x, largura, limiteInferior } = ctx
  let y = ctx.y
  const garantir = (altura: number) => {
    if (y + altura > limiteInferior) y = ctx.novaPagina()
  }

  const titulo = 'titulo' in recurso ? recurso.titulo : undefined
  if (titulo) {
    garantir(10)
    doc.setFont(fonte, 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...TEXTO)
    for (const l of linhas(doc, titulo, largura)) {
      doc.text(l, x, y)
      y += 4.6
    }
    y += 1.5
  }

  if (recurso.tipo === 'tabela') {
    const colunas = recurso.cabecalho.length
    const larguraColuna = largura / colunas
    const corpo = 8
    const desenharLinha = (celulas: string[], cabecalho: boolean) => {
      doc.setFont(fonte, cabecalho ? 'bold' : 'normal')
      doc.setFontSize(corpo)
      const quebradas = celulas.map((c) => linhas(doc, c, larguraColuna - 4))
      const altura = Math.max(...quebradas.map((q) => q.length)) * 3.8 + 3.4
      if (y + altura > limiteInferior) {
        y = ctx.novaPagina()
        if (!cabecalho) desenharLinha(recurso.cabecalho, true)
        doc.setFont(fonte, cabecalho ? 'bold' : 'normal')
        doc.setFontSize(corpo)
      }
      if (cabecalho) {
        doc.setFillColor(...VERDE_CLARO)
        doc.rect(x, y, largura, altura, 'F')
      }
      doc.setDrawColor(...BORDA)
      doc.setLineWidth(0.25)
      doc.rect(x, y, largura, altura)
      quebradas.forEach((q, i) => {
        if (i > 0) doc.line(x + larguraColuna * i, y, x + larguraColuna * i, y + altura)
        doc.setTextColor(...(cabecalho ? VERDE : TEXTO))
        q.forEach((l, k) => doc.text(l, x + larguraColuna * i + 2, y + 4.4 + k * 3.8))
      })
      y += altura
    }
    garantir(16)
    desenharLinha(recurso.cabecalho, true)
    for (const linha of recurso.linhas) desenharLinha(linha, false)
    y += 2
  } else if (recurso.tipo === 'grafico') {
    const altura = 62
    garantir(altura + 10)
    const m = { esq: 14, base: 9, topo: 3 }
    const area = { x: x + m.esq, y: y + m.topo, w: largura - m.esq - 2, h: altura - m.base - m.topo }
    const valores = recurso.series.flatMap((s) => s.valores)
    const escala = escalaDoEixo(Math.max(...valores), Math.min(...valores), recurso.forma === 'barras')
    const py = (v: number) => area.y + area.h - ((v - escala.min) / (escala.max - escala.min || 1)) * area.h
    doc.setFont(fonte, 'normal')
    doc.setFontSize(6.5)
    doc.setLineWidth(0.2)
    for (let v = escala.min; v <= escala.max + 1e-9; v += escala.passo) {
      doc.setDrawColor(...BORDA)
      doc.line(area.x, py(v), area.x + area.w, py(v))
      doc.setTextColor(...SUAVE)
      doc.text(formatarValor(Math.round(v * 1000) / 1000), area.x - 1.5, py(v) + 1.2, { align: 'right' })
    }
    const n = recurso.rotulos.length
    const passo = area.w / n
    recurso.rotulos.forEach((r, i) => {
      doc.setTextColor(...SUAVE)
      doc.text(sanitizarParaPdf(r.length > 14 ? `${r.slice(0, 13)}…` : r), area.x + passo * i + passo / 2, area.y + area.h + 4, { align: 'center' })
    })
    if (recurso.forma === 'barras') {
      const barra = (passo * 0.7) / recurso.series.length
      recurso.series.forEach((s, k) => {
        doc.setFillColor(...CORES[k])
        s.valores.forEach((v, i) => {
          const topo = py(Math.max(v, 0))
          const base = py(Math.max(escala.min, 0))
          doc.rect(area.x + passo * i + passo * 0.15 + barra * k, topo, Math.max(0.8, barra - 0.6), Math.max(0, base - topo), 'F')
        })
      })
    } else {
      recurso.series.forEach((s, k) => {
        doc.setDrawColor(...CORES[k])
        doc.setFillColor(...CORES[k])
        doc.setLineWidth(0.6)
        const pontos = s.valores.map((v, i) => [area.x + passo * i + passo / 2, py(v)] as const)
        pontos.forEach(([px, pv], i) => {
          if (i > 0) doc.line(pontos[i - 1][0], pontos[i - 1][1], px, pv)
          doc.circle(px, pv, 0.9, 'F')
        })
      })
    }
    y += altura
    if (recurso.eixoY || recurso.series.length > 1 || recurso.series[0]?.nome) {
      doc.setFontSize(7)
      let lx = x
      if (recurso.eixoY) {
        doc.setTextColor(...SUAVE)
        doc.text(sanitizarParaPdf(`Eixo Y: ${recurso.eixoY}`), lx, y + 2)
        lx += doc.getTextWidth(`Eixo Y: ${recurso.eixoY}`) + 6
      }
      recurso.series.forEach((s, k) => {
        doc.setFillColor(...CORES[k])
        doc.rect(lx, y - 0.4, 2.6, 2.6, 'F')
        doc.setTextColor(...TEXTO)
        doc.text(sanitizarParaPdf(s.nome), lx + 4, y + 2)
        lx += doc.getTextWidth(s.nome) + 10
      })
      y += 5
    }
  } else if (recurso.tipo === 'esquema') {
    doc.setFont(fonte, 'normal')
    doc.setFontSize(8.5)
    const caixa = Math.min(largura, 120)
    const cx = x + (largura - caixa) / 2
    const blocos = recurso.etapas.map((e) => linhas(doc, e, caixa - 6))
    const total = blocos.reduce((s, b) => s + b.length * 4 + 4 + 6, 0)
    garantir(Math.min(total, limiteInferior - y - 1))
    blocos.forEach((b, i) => {
      const altura = b.length * 4 + 4
      garantir(altura + 6)
      doc.setFillColor(...VERDE_CLARO)
      doc.setDrawColor(...VERDE)
      doc.setLineWidth(0.35)
      doc.roundedRect(cx, y, caixa, altura, 2, 2, 'FD')
      doc.setTextColor(...TEXTO)
      b.forEach((l, k) => doc.text(l, cx + caixa / 2, y + 4.8 + k * 4, { align: 'center' }))
      y += altura
      if (i < blocos.length - 1 || recurso.forma === 'ciclo') {
        const meio = cx + caixa / 2
        doc.setDrawColor(...VERDE)
        doc.setLineWidth(0.5)
        doc.line(meio, y + 0.8, meio, y + 5)
        doc.line(meio - 1.6, y + 3.4, meio, y + 5.2)
        doc.line(meio + 1.6, y + 3.4, meio, y + 5.2)
        y += 6
      }
    })
    if (recurso.forma === 'ciclo') {
      doc.setFontSize(7)
      doc.setTextColor(...SUAVE)
      doc.text('(volta à primeira etapa)', cx + caixa / 2, y + 2, { align: 'center' })
      y += 4
    }
    y += 2
  } else {
    doc.setFont(fonte, 'italic')
    doc.setFontSize(9)
    const corpo = linhas(doc, `“${recurso.texto}”`, largura - 10)
    const autor = recurso.autor || recurso.fonte ? `— ${[recurso.autor, recurso.fonte].filter(Boolean).join(', ')}` : ''
    const altura = corpo.length * 4.6 + (autor ? 6 : 0) + 4
    garantir(Math.min(altura, limiteInferior - y - 1))
    doc.setFillColor(...VERDE)
    doc.rect(x, y, 1.2, altura - 2, 'F')
    doc.setTextColor(...TEXTO)
    corpo.forEach((l, k) => doc.text(l, x + 5, y + 4 + k * 4.6))
    y += corpo.length * 4.6 + 2
    if (autor) {
      doc.setFont(fonte, 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...SUAVE)
      doc.text(sanitizarParaPdf(autor), x + 5, y + 3)
      y += 6
    }
    return y + 5
  }

  const fonteDoRecurso = 'fonte' in recurso ? recurso.fonte : undefined
  if (fonteDoRecurso) {
    garantir(6)
    doc.setFont(fonte, 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(...SUAVE)
    doc.text(sanitizarParaPdf(`Fonte: ${fonteDoRecurso}`).slice(0, 140), x, y + 1)
    y += 5
  }
  return y + 5
}
