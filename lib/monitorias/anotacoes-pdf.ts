'use client'

/**
 * PDF das anotações, feito inteiro no navegador (nenhuma função da Vercel, nenhum
 * byte de servidor além do ícone de 6 KB que o navegador já tem em cache).
 *
 * Usa a Helvetica embutida no próprio PDF, de propósito: a Roboto dos outros
 * PDFs são ~2 MB de fontes para baixar. Acentos do português estão na tabela da
 * Helvetica (WinAnsi); o que não está (setas, letras gregas, emoji) vira um
 * equivalente em texto antes de desenhar — senão o jsPDF reescreve a linha
 * inteira em UTF-16 e ela sai soletrada (ver `lib/pdf/marca.ts`).
 *
 * Formatação simples, que a pessoa escreve sem perceber:
 *   "# Título" e "## Subtítulo", "- item" (ou "*", "•"), "1. item",
 *   "[14:32] texto" (o horário marcado pelo botão do editor) e linha em branco.
 */

import type jsPDF from 'jspdf'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'

export interface DadosDoPdf {
  texto: string
  reserva: {
    id: string
    curto: string
    titulo: string
    inicio: string | null
    fim: string | null
    monitor: string
    autor: string
    papel: 'monitor' | 'aluno'
  }
}

const VERDE: [number, number, number] = [26, 71, 42]
const VERDE_CLARO: [number, number, number] = [70, 129, 82]
const LARANJA: [number, number, number] = [226, 164, 62]
const TEXTO: [number, number, number] = [40, 40, 40]
const CINZA: [number, number, number] = [110, 110, 110]

// Caracteres fora do Latin-1 que a tabela WinAnsi (cp1252) ainda tem.
const CP1252 = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')
const SOBRESCRITOS: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }
const TROCAS: Array<[RegExp, string | ((c: string) => string)]> = [
  [/→|⇒|⟶/g, '->'], [/←|⇐/g, '<-'], [/↔|⇔/g, '<->'], [/↑/g, '(sobe)'], [/↓/g, '(desce)'],
  [/≥/g, '>='], [/≤/g, '<='], [/≠/g, '!='], [/≈/g, '~'], [/∞/g, 'infinito'], [/√/g, 'raiz de '], [/∆|Δ/g, 'Delta'],
  [/α/g, 'alfa'], [/β/g, 'beta'], [/γ/g, 'gama'], [/δ/g, 'delta'], [/ε/g, 'epsilon'], [/θ/g, 'teta'], [/λ/g, 'lambda'],
  [/μ/g, 'µ'], [/π/g, 'pi'], [/σ/g, 'sigma'], [/τ/g, 'tau'], [/ω/g, 'omega'], [/Ω/g, 'Ohm'],
  [/[✓✔☑]/g, '(ok)'], [/[✗✘☒]/g, '(x)'], [/[★⭐]/g, '*'], [/[‐‑‒]/g, '-'], [/′/g, "'"], [/″/g, '"'],
  [/[₀-₉]/g, (c) => String(c.charCodeAt(0) - 0x2080)],
  [/[⁰¹²³⁴-⁹]/g, (c) => SOBRESCRITOS[c] ?? ''],
]

/** Só o que a Helvetica do PDF sabe desenhar. */
export function paraWinAnsi(texto: string): string {
  let t = String(texto || '').replace(/[​-‍﻿­]/g, '').replace(/\t/g, '    ')
  for (const [re, troca] of TROCAS) t = typeof troca === 'string' ? t.replace(re, troca) : t.replace(re, troca)
  let saida = ''
  for (const ch of t) {
    const cp = ch.codePointAt(0)!
    if (cp === 10 || (cp >= 32 && cp <= 126) || (cp >= 160 && cp <= 255) || CP1252.has(ch)) saida += ch
    // Emoji e símbolos sem equivalente somem (não viram "?").
  }
  return saida
}

async function iconeDaMarca(): Promise<string | null> {
  try {
    const res = await fetch('/favicon.png', { cache: 'force-cache' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string | null>((resolve) => {
      const leitor = new FileReader()
      leitor.onload = () => resolve(typeof leitor.result === 'string' ? leitor.result : null)
      leitor.onerror = () => resolve(null)
      leitor.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function nomeDoArquivo(titulo: string, curto: string): string {
  const slug = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `anotacoes-${slug || 'monitoria'}-${curto.toLowerCase()}.pdf`
}

function quando(r: DadosDoPdf['reserva']): string {
  if (!r.inicio) return 'Sem horário definido'
  const dia = formatarEmBrasilia(r.inicio, { day: '2-digit', month: '2-digit', year: 'numeric' })
  const de = formatarEmBrasilia(r.inicio, { hour: '2-digit', minute: '2-digit' })
  const ate = r.fim ? formatarEmBrasilia(r.fim, { hour: '2-digit', minute: '2-digit' }) : ''
  return `${dia}, ${de}${ate ? ` às ${ate}` : ''}`
}

/** Monta o documento (separado de `baixar` para os testes poderem inspecionar). */
export async function montarPdfDasAnotacoes(dados: DadosDoPdf): Promise<jsPDF> {
  const { default: JsPDF } = await import('jspdf')
  const doc = new JsPDF({ unit: 'mm', format: 'a4', compress: true })
  const L = doc.internal.pageSize.getWidth()
  const A = doc.internal.pageSize.getHeight()
  const M = 16
  const largura = L - 2 * M
  const fundoDaPagina = A - 20
  const r = dados.reserva
  const logo = await iconeDaMarca()
  doc.setProperties({ title: `Anotações: ${paraWinAnsi(r.titulo)}`, subject: `Monitoria #${r.curto}`, author: paraWinAnsi(r.autor), creator: 'DomineAqui' })

  // ── Cabeçalho da primeira página ──
  doc.setFillColor(...VERDE)
  doc.rect(0, 0, L, 26, 'F')
  doc.setFillColor(...LARANJA)
  doc.rect(L - 58, 0, 58, 26, 'F')
  let xMarca = M
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', M, 5, 16, 16)
      xMarca = M + 20
    } catch {
      /* sem ícone, só o nome */
    }
  }
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('DomineAqui', xMarca, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Anotações da monitoria', xMarca, 18.5)
  doc.setFontSize(8)
  doc.text('www.domineaqui.com.br', L - 29, 14.5, { align: 'center' })

  // ── Ficha da monitoria ──
  let y = 34
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  const tituloLinhas = (doc.splitTextToSize(paraWinAnsi(r.titulo), largura - 10) as string[]).slice(0, 2)
  const altura = 10 + tituloLinhas.length * 6 + 22
  doc.setFillColor(243, 247, 244)
  doc.setDrawColor(222, 232, 225)
  doc.roundedRect(M, y, largura, altura, 3, 3, 'FD')
  doc.setTextColor(...VERDE)
  doc.text(tituloLinhas, M + 5, y + 8)
  let yFicha = y + 8 + tituloLinhas.length * 6 + 2
  const campos: Array<[string, string]> = [
    ['CÓDIGO DA MONITORIA', `#${r.curto}`],
    ['DATA', quando(r)],
    ['MONITOR', r.monitor],
    [r.papel === 'monitor' ? 'ANOTAÇÕES DO MONITOR' : 'ALUNO', r.autor],
  ]
  const meia = (largura - 10) / 2
  campos.forEach(([rotulo, valor], i) => {
    const x = M + 5 + (i % 2) * meia
    const yy = yFicha + Math.floor(i / 2) * 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...CINZA)
    doc.text(rotulo, x, yy)
    doc.setFontSize(10)
    doc.setTextColor(...TEXTO)
    doc.text((doc.splitTextToSize(paraWinAnsi(valor), meia - 4) as string[])[0] || '', x, yy + 4.5)
  })
  y += altura + 9

  // ── Corpo ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...VERDE)
  doc.text('Anotações', M, y)
  doc.setDrawColor(...VERDE_CLARO)
  doc.setLineWidth(0.6)
  doc.line(M, y + 2, M + 24, y + 2)
  doc.setDrawColor(...LARANJA)
  doc.line(M + 24, y + 2, M + 30, y + 2)
  y += 9

  const LINHA = 5.1
  const novaPagina = () => {
    doc.addPage()
    doc.setFillColor(...VERDE)
    doc.rect(0, 0, L, 2.5, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...CINZA)
    doc.text(`Anotações · ${(doc.splitTextToSize(paraWinAnsi(r.titulo), largura - 30) as string[])[0]}`, M, 10)
    doc.text(`#${r.curto}`, L - M, 10, { align: 'right' })
    y = 18
  }
  const garantir = (mm: number) => {
    if (y + mm > fundoDaPagina) novaPagina()
  }
  const escrever = (linhas: string[], x: number, opcoes: { negrito?: boolean; tamanho?: number; cor?: [number, number, number] } = {}) => {
    doc.setFont('helvetica', opcoes.negrito ? 'bold' : 'normal')
    doc.setFontSize(opcoes.tamanho ?? 10.5)
    doc.setTextColor(...(opcoes.cor ?? TEXTO))
    const passo = ((opcoes.tamanho ?? 10.5) / 10.5) * LINHA
    for (const l of linhas) {
      garantir(passo)
      doc.text(l, x, y)
      y += passo
    }
  }

  const texto = paraWinAnsi(dados.texto).replace(/\r\n?/g, '\n')
  if (!texto.trim()) {
    escrever(['Nenhuma anotação ainda.'], M, { cor: CINZA })
  }
  let emBranco = false
  for (const bruta of texto.trim() ? texto.split('\n') : []) {
    const linha = bruta.replace(/\s+$/, '')
    if (!linha.trim()) {
      if (!emBranco) y += 2.6
      emBranco = true
      continue
    }
    emBranco = false
    const titulo = linha.match(/^(#{1,3})\s+(.*)$/)
    if (titulo) {
      const tamanho = titulo[1].length === 1 ? 13 : 11.5
      y += 2.5
      garantir(8)
      escrever(doc.setFont('helvetica', 'bold').setFontSize(tamanho).splitTextToSize(titulo[2], largura) as string[], M, { negrito: true, tamanho, cor: VERDE })
      y += 1
      continue
    }
    const item = linha.match(/^\s*([-*•])\s+(.*)$/)
    const numero = linha.match(/^\s*(\d{1,3})[.)]\s+(.*)$/)
    if (item || numero) {
      const conteudo = (item ? item[2] : numero![2]) || ''
      doc.setFont('helvetica', 'normal').setFontSize(10.5)
      const partes = doc.splitTextToSize(conteudo, largura - 7) as string[]
      garantir(LINHA)
      doc.setTextColor(...VERDE_CLARO)
      doc.setFont('helvetica', 'bold')
      doc.text(item ? '•' : `${numero![1]}.`, M + 1.5, y)
      escrever(partes, M + 7)
      continue
    }
    const marca = linha.match(/^\[(\d{1,2}:\d{2})\]\s*(.*)$/)
    if (marca) {
      garantir(LINHA)
      doc.setFont('helvetica', 'bold').setFontSize(9)
      const etiqueta = marca[1]
      const w = doc.getTextWidth(etiqueta) + 3
      doc.setFillColor(232, 242, 235)
      doc.roundedRect(M, y - 3.6, w, 4.9, 1.2, 1.2, 'F')
      doc.setTextColor(...VERDE)
      doc.text(etiqueta, M + 1.5, y)
      doc.setFont('helvetica', 'normal').setFontSize(10.5)
      const partes = doc.splitTextToSize(marca[2] || '', largura - w - 3) as string[]
      escrever(partes.length ? partes : [''], M + w + 2.5)
      continue
    }
    doc.setFont('helvetica', 'normal').setFontSize(10.5)
    escrever(doc.splitTextToSize(linha, largura) as string[], M)
  }

  // ── Rodapé em todas as páginas ──
  const total = doc.getNumberOfPages()
  const geradoEm = formatarEmBrasilia(new Date(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    const yr = A - 10
    doc.setDrawColor(...VERDE_CLARO)
    doc.setLineWidth(0.4)
    doc.line(M, yr - 4, L * 0.7, yr - 4)
    doc.setDrawColor(...LARANJA)
    doc.line(L * 0.7, yr - 4, L - M, yr - 4)
    doc.setFontSize(7.5)
    doc.setTextColor(...CINZA)
    doc.setFont('helvetica', 'bold')
    doc.text('DomineAqui', M, yr)
    const larguraDaMarca = doc.getTextWidth('DomineAqui')
    doc.setFont('helvetica', 'normal')
    const resto = ` · Monitoria #${r.curto} · anotações pessoais de ${paraWinAnsi(r.autor)} · gerado em ${geradoEm}`
    doc.text((doc.splitTextToSize(resto, largura - 40) as string[])[0], M + larguraDaMarca + 0.5, yr)
    doc.text(`Página ${p} de ${total}`, L - M, yr, { align: 'right' })
  }
  return doc
}

/** Gera e baixa (no celular, abre o PDF para salvar/compartilhar). */
export async function baixarPdfDasAnotacoes(dados: DadosDoPdf): Promise<void> {
  const doc = await montarPdfDasAnotacoes(dados)
  const nome = nomeDoArquivo(dados.reserva.titulo, dados.reserva.curto)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
}
