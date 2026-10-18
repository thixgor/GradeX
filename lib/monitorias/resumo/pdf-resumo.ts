'use client'

/**
 * PDF do Resumo por IA, feito inteiro no navegador (como o das anotações):
 * nenhuma função da Vercel, Helvetica embutida, mesma marca. O gabarito das
 * questões vai numa seção própria no fim, para a pessoa poder treinar antes.
 */

import type jsPDF from 'jspdf'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { paraWinAnsi } from '../anotacoes-pdf'
import type { ResumoGerado } from './tipos'

const VERDE: [number, number, number] = [26, 71, 42]
const VERDE_CLARO: [number, number, number] = [70, 129, 82]
const LARANJA: [number, number, number] = [226, 164, 62]
const TEXTO: [number, number, number] = [40, 40, 40]
const CINZA: [number, number, number] = [110, 110, 110]
const AMBAR: [number, number, number] = [146, 98, 16]

export interface DadosDoPdfDoResumo {
  resumo: ResumoGerado
  reserva: { id: string; titulo: string; inicio: string | null }
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

export async function montarPdfDoResumo(dados: DadosDoPdfDoResumo): Promise<jsPDF> {
  const { default: JsPDF } = await import('jspdf')
  const doc = new JsPDF({ unit: 'mm', format: 'a4', compress: true })
  const L = doc.internal.pageSize.getWidth()
  const A = doc.internal.pageSize.getHeight()
  const M = 16
  const largura = L - 2 * M
  const fundo = A - 18
  const { resumo, reserva } = dados
  const curto = reserva.id.slice(-6).toUpperCase()
  const logo = await iconeDaMarca()
  doc.setProperties({ title: `Resumo: ${paraWinAnsi(resumo.titulo)}`, subject: `Monitoria #${curto}`, creator: 'DomineAqui' })

  // Cabeçalho
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
      /* sem ícone */
    }
  }
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('DomineAqui', xMarca, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Resumo Inteligente da monitoria', xMarca, 18.5)
  doc.setFontSize(8)
  doc.text('www.domineaqui.com.br', L - 29, 14.5, { align: 'center' })

  let y = 36
  const novaPagina = () => {
    doc.addPage()
    doc.setFillColor(...VERDE)
    doc.rect(0, 0, L, 2.5, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...CINZA)
    doc.text(`Resumo · ${(doc.splitTextToSize(paraWinAnsi(resumo.titulo), largura - 30) as string[])[0]}`, M, 10)
    doc.text(`#${curto}`, L - M, 10, { align: 'right' })
    y = 18
  }
  const garantir = (mm: number) => {
    if (y + mm > fundo) novaPagina()
  }
  const paragrafo = (texto: string, o: { negrito?: boolean; tamanho?: number; cor?: [number, number, number]; recuo?: number; marcador?: string; depois?: number } = {}) => {
    const tamanho = o.tamanho ?? 10
    const x = M + (o.recuo ?? 0)
    doc.setFont('helvetica', o.negrito ? 'bold' : 'normal')
    doc.setFontSize(tamanho)
    doc.setTextColor(...(o.cor ?? TEXTO))
    const linhaMm = tamanho * 0.47
    const prefixo = o.marcador ? `${o.marcador} ` : ''
    const linhas = doc.splitTextToSize(paraWinAnsi(prefixo + texto), largura - (o.recuo ?? 0)) as string[]
    for (const linha of linhas) {
      garantir(linhaMm)
      doc.text(linha, x, y)
      y += linhaMm
    }
    y += o.depois ?? 1.6
  }
  const secao = (titulo: string) => {
    garantir(16)
    y += 3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12.5)
    doc.setTextColor(...VERDE)
    doc.text(paraWinAnsi(titulo), M, y)
    doc.setDrawColor(...VERDE_CLARO)
    doc.setLineWidth(0.6)
    doc.line(M, y + 2, M + 24, y + 2)
    doc.setDrawColor(...LARANJA)
    doc.line(M + 24, y + 2, M + 30, y + 2)
    y += 8
  }

  paragrafo(resumo.titulo, { negrito: true, tamanho: 15, cor: VERDE, depois: 1 })
  const quando = reserva.inicio ? formatarEmBrasilia(reserva.inicio, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
  paragrafo(`${reserva.titulo}${quando ? ` · ${quando}` : ''} · #${curto}`, { tamanho: 8.5, cor: CINZA, depois: 2 })
  paragrafo('Gerado por IA a partir da transcrição da aula. Pode conter erros: confira condutas, doses e valores em fontes oficiais.', { tamanho: 8.5, cor: AMBAR, depois: 3 })

  secao('Síntese')
  for (const p of resumo.sintese.split(/\n+/)) paragrafo(p)

  if (resumo.topicos.length) {
    secao('Tópicos')
    resumo.topicos.forEach((t, i) => {
      paragrafo(`${i + 1}. ${t.titulo}`, { negrito: true, tamanho: 11, depois: 1 })
      for (const p of t.explicacao.split(/\n+/)) if (p.trim()) paragrafo(p)
      for (const c of t.conceitos) paragrafo(`${c.termo}: ${c.definicao}`, { recuo: 3, marcador: '•' })
      for (const m of t.mecanismos) paragrafo(m, { recuo: 3, marcador: '→' })
      if (t.raciocinioDoMonitor.trim()) paragrafo(`Raciocínio do monitor: ${t.raciocinioDoMonitor}`, { recuo: 3, cor: VERDE_CLARO })
      y += 1.5
    })
  }
  if (resumo.duvidas.length) {
    secao('Dúvidas e respostas')
    for (const d of resumo.duvidas) {
      paragrafo(`P: ${d.pergunta}`, { negrito: true, depois: 0.6 })
      paragrafo(`R: ${d.resposta}`, { recuo: 3 })
    }
  }
  if (resumo.comparacoes.length) {
    secao('Comparações')
    for (const c of resumo.comparacoes) {
      paragrafo(c.itens, { negrito: true, depois: 0.6 })
      paragrafo(c.diferencas, { recuo: 3 })
    }
  }
  if (resumo.pontosDeAtencao.length) {
    secao('Pontos de atenção')
    for (const p of resumo.pontosDeAtencao) paragrafo(p, { marcador: '!' })
  }
  if (resumo.revisaoRapida.length) {
    secao('Revisão rápida')
    for (const p of resumo.revisaoRapida) paragrafo(p, { marcador: '•' })
  }
  const letras = ['A', 'B', 'C', 'D', 'E']
  if (resumo.questoes.length) {
    secao('Questões')
    resumo.questoes.forEach((q, i) => {
      paragrafo(`${i + 1}. ${q.enunciado}`, { negrito: true, depois: 1 })
      q.alternativas.forEach((a, k) => paragrafo(`${letras[k]}) ${a}`, { recuo: 3, depois: 0.6 }))
      y += 2
    })
    secao('Gabarito comentado')
    resumo.questoes.forEach((q, i) => paragrafo(`${i + 1}. ${letras[q.correta] || '?'} — ${q.comentario}`))
  }
  if (resumo.aVerificar.length) {
    secao('A verificar')
    for (const p of resumo.aVerificar) paragrafo(p, { marcador: '?', cor: AMBAR })
  }
  if (resumo.lacunas.length) {
    secao('Lacunas')
    for (const p of resumo.lacunas) paragrafo(p, { marcador: '–', cor: CINZA })
  }

  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...CINZA)
    doc.text(`DomineAqui · Resumo por IA · página ${i} de ${total}`, L / 2, A - 8, { align: 'center' })
  }
  return doc
}

export async function baixarPdfDoResumo(dados: DadosDoPdfDoResumo): Promise<void> {
  const doc = await montarPdfDoResumo(dados)
  const slug = dados.resumo.titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  doc.save(`resumo-${slug || 'monitoria'}-${dados.reserva.id.slice(-6).toLowerCase()}.pdf`)
}
