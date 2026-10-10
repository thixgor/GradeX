import 'server-only'

/**
 * PDFs formais das monitorias (pdf-lib, gerados no servidor a partir dos dados
 * gravados — o mesmo documento sai igual hoje e daqui a um ano):
 *
 *  - Contrato assinado + página de evidências (hash, assinaturas, QR de verificação)
 *  - Comprovante de pagamento (aluno)
 *  - Demonstrativo de venda e de repasse (monitor)
 *  - Termos de Serviço aceitos
 *
 * As fontes padrão do PDF só conhecem o alfabeto WinAnsi (latim com acentos).
 * Texto de usuário com emoji ou outro alfabeto passa por `paraWinAnsi`, que
 * troca o que não cabe por "?" — sem isso, um emoji no título do anúncio
 * derrubava a geração inteira.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { maskCpf } from '@/lib/cpf'
import { formatarCentavos } from './dinheiro'
import { appUrl } from './db'
import type { SecaoDocumento } from './documentos/termos'

const VERDE = rgb(0.06, 0.24, 0.18)
const CINZA = rgb(0.35, 0.38, 0.42)
const CLARO = rgb(0.9, 0.92, 0.93)
const PRETO = rgb(0.1, 0.1, 0.12)

const EXTRAS_WINANSI = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')

export function paraWinAnsi(texto: string): string {
  return Array.from(String(texto ?? '').normalize('NFC'))
    .map((ch) => {
      const cp = ch.codePointAt(0)!
      if (ch === '\n') return ch
      if ((cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa0 && cp <= 0xff) || EXTRAS_WINANSI.has(ch)) return ch
      if (ch === '\t') return ' '
      if (ch === '≥') return '>='
      if (ch === '≤') return '<='
      return '?'
    })
    .join('')
}

class Pagina {
  doc: PDFDocument
  fonte!: PDFFont
  negrito!: PDFFont
  page!: PDFPage
  y = 0
  readonly margem = 50
  readonly largura = 595.28
  readonly altura = 841.89
  numero = 0
  rodape: string

  constructor(doc: PDFDocument, rodape: string) {
    this.doc = doc
    this.rodape = rodape
  }

  async iniciar() {
    this.fonte = await this.doc.embedFont(StandardFonts.Helvetica)
    this.negrito = await this.doc.embedFont(StandardFonts.HelveticaBold)
    this.novaPagina()
  }

  novaPagina() {
    this.page = this.doc.addPage([this.largura, this.altura])
    this.numero++
    this.y = this.altura - this.margem
    this.page.drawRectangle({ x: 0, y: this.altura - 6, width: this.largura, height: 6, color: VERDE })
    this.page.drawText(paraWinAnsi(`${this.rodape}  ·  página ${this.numero}`), {
      x: this.margem,
      y: 24,
      size: 7.5,
      font: this.fonte,
      color: CINZA,
    })
  }

  espaco(h: number) {
    if (this.y - h < 60) this.novaPagina()
  }

  quebrar(texto: string, fonte: PDFFont, tamanho: number, largura: number): string[] {
    const linhas: string[] = []
    for (const paragrafo of paraWinAnsi(texto).split('\n')) {
      let atual = ''
      for (const palavra of paragrafo.split(/\s+/)) {
        const tentativa = atual ? `${atual} ${palavra}` : palavra
        if (fonte.widthOfTextAtSize(tentativa, tamanho) <= largura) {
          atual = tentativa
        } else {
          if (atual) linhas.push(atual)
          // Palavra maior que a linha (hash, URL, "WWWW…"): corta em pedaços
          // somando a largura letra a letra — tempo linear. (Medir prefixos
          // cada vez menores era cúbico e travava o PDF com uma palavra longa.)
          let pedaco = ''
          let larguraPedaco = 0
          for (const ch of palavra) {
            const l = fonte.widthOfTextAtSize(ch, tamanho)
            if (pedaco && larguraPedaco + l > largura) {
              linhas.push(pedaco)
              pedaco = ''
              larguraPedaco = 0
            }
            pedaco += ch
            larguraPedaco += l
          }
          atual = pedaco
        }
      }
      linhas.push(atual)
    }
    return linhas
  }

  texto(texto: string, opcoes: { tamanho?: number; negrito?: boolean; cor?: ReturnType<typeof rgb>; recuo?: number; depois?: number } = {}) {
    const tamanho = opcoes.tamanho ?? 9.5
    const fonte = opcoes.negrito ? this.negrito : this.fonte
    const recuo = opcoes.recuo ?? 0
    const linhas = this.quebrar(texto, fonte, tamanho, this.largura - this.margem * 2 - recuo)
    const altura = tamanho * 1.38
    for (const linha of linhas) {
      this.espaco(altura)
      this.page.drawText(linha, { x: this.margem + recuo, y: this.y - tamanho, size: tamanho, font: fonte, color: opcoes.cor ?? PRETO })
      this.y -= altura
    }
    this.y -= opcoes.depois ?? 4
  }

  titulo(texto: string, subtitulo?: string) {
    this.texto('DomineAqui', { tamanho: 10, negrito: true, cor: VERDE, depois: 2 })
    this.texto(texto, { tamanho: 15, negrito: true, depois: 2 })
    if (subtitulo) this.texto(subtitulo, { tamanho: 8.5, cor: CINZA, depois: 6 })
    this.linha()
  }

  linha() {
    this.espaco(10)
    this.page.drawLine({
      start: { x: this.margem, y: this.y - 2 },
      end: { x: this.largura - this.margem, y: this.y - 2 },
      thickness: 0.6,
      color: CLARO,
    })
    this.y -= 12
  }

  tabela(linhas: Array<[string, string]>) {
    const colunaRotulo = 170
    for (const [rotulo, valor] of linhas) {
      const valorLinhas = this.quebrar(valor, this.fonte, 9.5, this.largura - this.margem * 2 - colunaRotulo)
      const altura = Math.max(1, valorLinhas.length) * 13 + 6
      this.espaco(altura)
      this.page.drawText(paraWinAnsi(rotulo), { x: this.margem, y: this.y - 10, size: 8.5, font: this.fonte, color: CINZA })
      valorLinhas.forEach((l, i) => {
        this.page.drawText(l, { x: this.margem + colunaRotulo, y: this.y - 10 - i * 13, size: 9.5, font: this.negrito, color: PRETO })
      })
      this.y -= altura
      this.page.drawLine({
        start: { x: this.margem, y: this.y + 2 },
        end: { x: this.largura - this.margem, y: this.y + 2 },
        thickness: 0.4,
        color: CLARO,
      })
    }
    this.y -= 8
  }

  secoes(secoes: SecaoDocumento[]) {
    for (const s of secoes) {
      this.texto(s.titulo, { tamanho: 10.5, negrito: true, depois: 3 })
      for (const p of s.paragrafos) this.texto(p, { tamanho: 9.2, depois: 4 })
      this.y -= 4
    }
  }

  async qr(url: string, legenda: string) {
    const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220 })
    const png = await this.doc.embedPng(dataUrl)
    this.espaco(120)
    this.page.drawImage(png, { x: this.margem, y: this.y - 100, width: 100, height: 100 })
    const linhas = this.quebrar(legenda, this.fonte, 8.5, this.largura - this.margem * 2 - 120)
    linhas.forEach((l, i) =>
      this.page.drawText(l, { x: this.margem + 115, y: this.y - 20 - i * 12, size: 8.5, font: this.fonte, color: CINZA }),
    )
    this.y -= 112
  }
}

async function novoDocumento(titulo: string, rodape: string) {
  const doc = await PDFDocument.create()
  doc.setTitle(paraWinAnsi(titulo))
  doc.setAuthor('DomineAqui')
  doc.setCreator('DomineAqui — Monitorias')
  doc.setProducer('DomineAqui')
  doc.setCreationDate(new Date())
  const p = new Pagina(doc, rodape)
  await p.iniciar()
  return p
}

/** 189.45.12.34 → 189.45.*.* ; IPv6 → só os 2 primeiros grupos. */
export function mascararIp(ip?: string): string {
  if (!ip) return '—'
  if (ip.includes('.') && !ip.includes(':')) {
    const p = ip.split('.')
    return p.length === 4 ? `${p[0]}.${p[1]}.*.*` : '—'
  }
  const g = ip.split(':').filter(Boolean)
  return g.length ? `${g.slice(0, 2).join(':')}:…` : '—'
}

function dataHora(d: Date | string | undefined) {
  return d ? `${formatarEmBrasilia(d, { dateStyle: 'short', timeStyle: 'medium' })} (Brasília)` : '—'
}

// ─── Contrato ───────────────────────────────────────────────────────────

export interface EntradaPdfContrato {
  titulo: string
  numero: string
  status: string
  hash: string
  codigoVerificacao: string
  secoes: SecaoDocumento[]
  assinaturas: Array<{ papel: string; nome: string; em: Date; ip: string; metodo: string; referencia?: string; hash: string; hashOrigem?: string; vinculadaEm?: Date }>
}

export async function pdfDoContrato(e: EntradaPdfContrato): Promise<Uint8Array> {
  const p = await novoDocumento(e.titulo, `Contrato ${e.numero} · hash ${e.hash.slice(0, 16)}…`)
  p.titulo(e.titulo, `Situação: ${e.status} · Documento gerado em ${dataHora(new Date())}`)
  p.secoes(e.secoes)

  p.novaPagina()
  p.texto('Página de evidências da assinatura eletrônica', { tamanho: 13, negrito: true, depois: 6 })
  p.texto(
    'Este contrato foi assinado eletronicamente (Lei 14.063/2020; MP 2.200-2/2001, art. 10, § 2º). Cada assinatura registra quem, quando, de onde e o resumo criptográfico (SHA-256) do texto assinado. Se uma única letra do contrato mudar, o resumo muda e a assinatura deixa de corresponder.',
    { tamanho: 9, cor: CINZA, depois: 10 },
  )
  p.tabela([
    ['Número', e.numero],
    ['Hash SHA-256 do conteúdo', e.hash],
    ['Código de verificação', e.codigoVerificacao],
  ])
  const metodos: Record<string, string> = {
    codigo_email: 'Aceite + código de 6 dígitos enviado ao e-mail cadastrado',
    oferta_padrao: 'Adesão: oferta-padrão de agendamento direto assinada pelo monitor (Código Civil, art. 429)',
    assinatura_da_reserva: 'Adesão: assinatura do monitor no contrato do organizador do grupo, nas mesmas condições',
  }
  if (!e.assinaturas.length) p.texto('Nenhuma assinatura registrada ainda.', { cor: CINZA })
  for (const a of e.assinaturas) {
    p.texto(a.papel === 'contratante' ? 'CONTRATANTE (Aluno)' : 'CONTRATADO (Monitor)', { negrito: true, tamanho: 10, depois: 2 })
    const adesao = !!a.hashOrigem
    p.tabela([
      ['Nome', a.nome],
      [adesao ? 'Assinou o documento de origem em' : 'Data e hora', dataHora(a.em)],
      // IP mascarado no PDF entregue às partes (LGPD, minimização); o completo fica nos registros da plataforma.
      ['Endereço IP', mascararIp(a.ip)],
      ['Método', metodos[a.metodo] || a.metodo],
      ...(a.referencia ? ([['Documento de origem', a.referencia]] as Array<[string, string]>) : []),
      ...(adesao ? ([['Hash do documento de origem', a.hashOrigem!]] as Array<[string, string]>) : []),
      ...(adesao && a.vinculadaEm ? ([['Vinculada a este contrato em', dataHora(a.vinculadaEm)]] as Array<[string, string]>) : []),
      [adesao ? 'Hash deste contrato (vinculado)' : 'Hash assinado', a.hash],
    ])
  }
  const url = `${appUrl()}/monitorias/documentos/verificar/${e.codigoVerificacao}`
  await p.qr(url, `Confira a autenticidade deste contrato em ${url} — a página mostra se o documento é válido, a data das assinaturas e o hash, sem expor dados pessoais.`)
  return p.doc.save()
}

// ─── Comprovante de pagamento (aluno) ───────────────────────────────────

export interface EntradaPdfComprovante {
  pedidoId: string
  pagamentoId: string
  pagoEm?: Date
  alunoNome: string
  alunoCpf: string
  monitorNome: string
  anuncioTitulo: string
  inicio?: Date
  duracao: string
  valorCentavos: number
  taxaPixCentavos: number
  totalPagoCentavos: number
  contratoNumero?: string
  status: string
  reembolsos: Array<{ valorCentavos: number; em: Date; status: string; chave: string }>
}

export async function pdfDoComprovante(e: EntradaPdfComprovante): Promise<Uint8Array> {
  const p = await novoDocumento('Comprovante de pagamento — Monitoria', `Comprovante do pedido ${e.pedidoId}`)
  p.titulo('Comprovante de pagamento', 'Monitoria intermediada pela plataforma DomineAqui')
  p.tabela([
    ['Situação', e.status],
    ['Pagador', `${e.alunoNome} (CPF ${maskCpf(e.alunoCpf) || '—'})`],
    ['Recebedor', 'DomineAqui, como intermediadora, em nome do monitor'],
    ['Monitor (prestador)', e.monitorNome],
    ['Serviço', `Monitoria: ${e.anuncioTitulo}`],
    ['Data da aula', e.inicio ? dataHora(e.inicio) : '—'],
    ['Duração', e.duracao],
    ['Forma de pagamento', 'PIX (Mercado Pago)'],
    ['Data do pagamento', dataHora(e.pagoEm)],
    ['ID do pagamento (Mercado Pago)', e.pagamentoId || '—'],
    ['Nº do pedido', e.pedidoId],
    ...(e.contratoNumero ? ([['Contrato', e.contratoNumero]] as Array<[string, string]>) : []),
  ])
  p.texto('Valores', { negrito: true, tamanho: 11, depois: 4 })
  p.tabela([
    ['Valor da monitoria', formatarCentavos(e.valorCentavos)],
    ['Taxa do PIX (meio de pagamento)', formatarCentavos(e.taxaPixCentavos)],
    ['Total pago', formatarCentavos(e.totalPagoCentavos)],
  ])
  if (e.reembolsos.length) {
    p.texto('Reembolsos', { negrito: true, tamanho: 11, depois: 4 })
    p.tabela(e.reembolsos.map((r) => [dataHora(r.em), `${formatarCentavos(r.valorCentavos)} · ${r.status} · protocolo ${r.chave}`]))
  }
  p.texto(
    'O valor fica retido em garantia pela plataforma até 48 horas após o término da monitoria e só então é repassado ao monitor (90%), descontada a taxa de intermediação (10%). Este comprovante não é nota fiscal.',
    { tamanho: 8.5, cor: CINZA },
  )
  return p.doc.save()
}

// ─── Demonstrativo do monitor (venda + repasse) ─────────────────────────

export interface EntradaPdfRepasse {
  titulo: string
  monitorNome: string
  monitorCpf: string
  itens: Array<{ descricao: string; brutoCentavos: number; taxaCentavos: number; liquidoCentavos: number; status: string }>
  abatidoCentavos?: number
  totalCentavos: number
  pix?: string
  e2eId?: string
  pagoEm?: Date
  identificador: string
}

export async function pdfDoRepasse(e: EntradaPdfRepasse): Promise<Uint8Array> {
  const p = await novoDocumento(e.titulo, `${e.titulo} · ${e.identificador}`)
  p.titulo(e.titulo, `Monitor: ${e.monitorNome} (CPF ${maskCpf(e.monitorCpf) || '—'}) · emitido em ${dataHora(new Date())}`)
  for (const item of e.itens) {
    p.tabela([
      ['Monitoria', item.descricao],
      ['Valor bruto', formatarCentavos(item.brutoCentavos)],
      ['Taxa da plataforma (10%)', formatarCentavos(item.taxaCentavos)],
      ['Líquido do monitor (90%)', formatarCentavos(item.liquidoCentavos)],
      ['Situação', item.status],
    ])
  }
  p.texto('Resumo', { negrito: true, tamanho: 11, depois: 4 })
  p.tabela([
    ...(e.abatidoCentavos ? ([['Saldo devedor abatido', `- ${formatarCentavos(e.abatidoCentavos)}`]] as Array<[string, string]>) : []),
    ['Total', formatarCentavos(e.totalCentavos)],
    ...(e.pix ? ([['Chave PIX de destino', e.pix]] as Array<[string, string]>) : []),
    ...(e.e2eId ? ([['Identificador da transação PIX (E2E)', e.e2eId]] as Array<[string, string]>) : []),
    ...(e.pagoEm ? ([['Pago em', dataHora(e.pagoEm)]] as Array<[string, string]>) : []),
    ['Identificador', e.identificador],
  ])
  p.texto(
    'O monitor é responsável pelas obrigações fiscais sobre os valores recebidos. Este demonstrativo não é nota fiscal.',
    { tamanho: 8.5, cor: CINZA },
  )
  return p.doc.save()
}

// ─── Termos aceitos ─────────────────────────────────────────────────────

export async function pdfDosTermos(e: {
  titulo: string
  versao: string
  secoes: SecaoDocumento[]
  aceite?: { nome: string; em: Date; ip: string; hash: string }
}): Promise<Uint8Array> {
  const p = await novoDocumento(e.titulo, `${e.titulo} · versão ${e.versao}`)
  p.titulo(e.titulo, `Versão ${e.versao}`)
  if (e.aceite) {
    p.tabela([
      ['Aceito por', e.aceite.nome],
      ['Data e hora', dataHora(e.aceite.em)],
      ['Endereço IP', e.aceite.ip],
      ['Hash SHA-256 do texto', e.aceite.hash],
    ])
  }
  p.secoes(e.secoes)
  return p.doc.save()
}

// ─── Histórico da conversa ──────────────────────────────────────────────

export async function pdfDaConversa(e: {
  titulo: string
  reservaId: string
  participantes: Array<[string, string]>
  mensagens: Array<{ autor: string; texto: string; em: Date; sistema: boolean }>
  materiais: Array<{ titulo: string; url: string }>
  truncado?: boolean
}): Promise<Uint8Array> {
  const p = await novoDocumento(`Histórico da monitoria — ${e.titulo}`, `Histórico da reserva ${e.reservaId}`)
  p.titulo('Histórico da conversa da monitoria', `${e.titulo} · emitido em ${dataHora(new Date())}`)
  p.tabela([['Reserva', e.reservaId], ...e.participantes])
  if (e.materiais.length) {
    p.texto('Materiais complementares (links externos, de responsabilidade de quem os indicou)', { tamanho: 10.5, negrito: true, depois: 3 })
    for (const m of e.materiais) p.texto(`• ${m.titulo} — ${m.url}`, { tamanho: 8.8, depois: 2 })
    p.linha()
  }
  p.texto(`Mensagens (${e.mensagens.length}${e.truncado ? ' primeiras' : ''})`, { tamanho: 10.5, negrito: true, depois: 6 })
  if (e.truncado) p.texto('Conversa longa: este PDF traz as primeiras mensagens. As seguintes continuam disponíveis na página da reserva; peça ao suporte a exportação completa se precisar.', { tamanho: 8.5, cor: CINZA, depois: 6 })
  for (const m of e.mensagens) {
    if (m.sistema) {
      p.texto(`${dataHora(m.em)} · ${m.texto}`, { tamanho: 8.2, cor: CINZA, depois: 5 })
    } else {
      p.texto(`${m.autor} · ${dataHora(m.em)}`, { tamanho: 8.2, negrito: true, cor: VERDE, depois: 1 })
      p.texto(m.texto, { tamanho: 9.2, recuo: 8, depois: 6 })
    }
  }
  p.linha()
  p.texto(
    'Documento gerado a partir dos registros da plataforma. Antes do pagamento, contatos pessoais enviados no chat aparecem ocultados, como foram exibidos às partes.',
    { tamanho: 8, cor: CINZA },
  )
  return p.doc.save()
}
