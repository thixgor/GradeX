import type jsPDF from 'jspdf'

/**
 * A base compartilhada dos PDFs da plataforma: fontes, paleta, fundo da folha,
 * vidro, cabeçalho e rodapé.
 *
 * ## Por que este arquivo existe
 *
 * Havia duas implementações da mesma coisa. `lib/pdf-generator.ts` (os PDFs de
 * `/provas`) registrava a fonte embutida, tinha um sanitizador de fallback,
 * carregava o logo e desenhava o cabeçalho com ele. `lib/user-report-generator.ts`
 * (o relatório do aluno) tinha um cabeçalho parecido de longe, sem logo, e
 * escrevia tudo em `helvetica` — a fonte padrão do jsPDF.
 *
 * E "helvetica" no jsPDF não é um detalhe de estilo. As 14 fontes padrão do PDF
 * usam WinAnsiEncoding, que não tem `✓`. Quando o jsPDF encontra um caractere
 * fora dessa tabela, ele reescreve a **linha inteira** em UTF-16BE e continua
 * declarando a fonte WinAnsi — cada letra ASCII vira dois bytes, e o byte nulo
 * da frente é desenhado como um espaço:
 *
 *     (✓ A) O aumento do volume…)   →   ('   A \)   O   a u m e n t o …) Tj
 *
 * É exatamente o defeito da alternativa correta no relatório: o `✓` saía como
 * `'`, o texto saía soletrado e vazava para fora da tarja verde — porque
 * `getTextWidth`, usado para quebrar a linha, media a versão de um byte
 * enquanto a página desenhava a de dois. Uma linha "que cabe" com o dobro da
 * largura.
 *
 * A fonte embutida resolve as duas pontas (glifo real e métrica coerente), e o
 * fallback textual cobre o caso de o TTF não carregar. Ter isso em UM lugar é o
 * ponto: a correção não pode valer só para o gerador que alguém lembrou de
 * arrumar.
 *
 * ## O visual: vidro sobre um fundo claro
 *
 * A folha tem um "papel de parede" quase branco com manchas difusas de verde e
 * laranja só nas bordas — o miolo, onde se lê e se escreve, fica limpo e
 * imprime bem. Sobre ele flutuam cartões de vidro: branco translúcido, borda
 * fina, brilho no topo e uma sombra macia. O jsPDF não tem desfoque, então a
 * mancha difusa é feita de círculos concêntricos quase transparentes (ver
 * `desenharMancha`) e o vidro é o branco com opacidade deixando passar a cor
 * de trás. Tudo em vetor: sai nítido em qualquer impressora e não pesa como
 * imagem.
 */

export type Cor = readonly [number, number, number]

// ── Paleta (papéis, não amostras) ────────────────────────────────
//
// Contraste medido sobre o branco: `TINTA` 15:1, `TINTA_SUAVE` 7,1:1,
// `TINTA_FRACA` 4,6:1 (o piso do texto pequeno), `LARANJA_TEXTO` 4,8:1.
// O laranja vivo da marca é cor de superfície e de ícone, nunca de texto
// sobre branco — ali ele não passa de 2,4:1.

/** Texto principal: um verde tão escuro que lê como preto. */
export const TINTA: Cor = [17, 38, 27]
/** Texto secundário: rótulos, metadados. */
export const TINTA_SUAVE: Cor = [72, 90, 80]
/** Texto terciário: créditos, legendas, notas de rodapé. */
export const TINTA_FRACA: Cor = [104, 120, 111]

/** O verde-escuro da marca — superfícies fortes, o cartão de capa. */
export const FLORESTA: Cor = [13, 54, 33]
/** O verde de ação: a alternativa certa, o número da questão. */
export const VERDE: Cor = [27, 104, 64]
/** O verde vivo: só em ícone e mancha de fundo. */
export const VERDE_VIVO: Cor = [52, 150, 94]
/** Verde quase branco: fundo de destaque positivo. */
export const MENTA: Cor = [230, 244, 235]

/** O laranja da marca: ícone, acento, mancha de fundo. */
export const LARANJA: Cor = [240, 140, 28]
/** O laranja que pode ser texto sobre fundo claro. */
export const LARANJA_TEXTO: Cor = [166, 86, 0]
/** Laranja quase branco: fundo de destaque de atenção. */
export const PESSEGO: Cor = [254, 238, 216]

/** O fundo da folha. */
export const PAPEL: Cor = [248, 250, 247]
/** Fio de separação e borda de cartão. */
export const FIO: Cor = [214, 226, 218]

export const ERRO: Cor = [190, 44, 36]
export const ERRO_CLARO: Cor = [253, 232, 229]

// Os nomes antigos, que os outros geradores importam. Apontam para a paleta
// nova: quem ainda usa `VERDE_MEDIO` recebe o verde novo sem precisar mudar.
export const VERDE_ESCURO: Cor = FLORESTA
export const VERDE_MEDIO: Cor = VERDE
export const LARANJA_CLARO: Cor = PESSEGO
export const CINZA_TEXTO: Cor = TINTA
export const CINZA_CLARO: Cor = PAPEL

// ── Medidas da folha (A4, mm) ────────────────────────────────────

/** Onde o conteúdo começa numa página com cabeçalho. */
export const Y_APOS_CABECALHO = 40
/** Altura reservada ao rodapé: o conteúdo não passa de `altura - isto`. */
export const RESERVA_DO_RODAPE = 25

// ── Registro das fontes (Inter TTF, Unicode completo/PT-BR) ──────
//
// Inter e não Roboto: é a parente aberta da SF Pro do iOS — o desenho que o
// resto da plataforma usa — e cobre `✓ ✗ → ←`, que a Roboto não tem. Pesa o
// mesmo no arquivo (o jsPDF embute só os glifos usados).

export type EstiloDeFonte = 'normal' | 'bold' | 'italic' | 'bolditalic'

export const FAMILIA_EMBUTIDA = 'Inter'

export const ARQUIVOS_DE_FONTE: { file: string; style: EstiloDeFonte }[] = [
  { file: 'Inter-Regular.ttf', style: 'normal' },
  { file: 'Inter-Bold.ttf', style: 'bold' },
  { file: 'Inter-Italic.ttf', style: 'italic' },
  { file: 'Inter-BoldItalic.ttf', style: 'bolditalic' },
]

export interface FonteCarregada {
  file: string
  style: EstiloDeFonte
  b64: string
}

let FAMILIA = 'helvetica'
const cacheDeFontes: FonteCarregada[] = []
let promessaDeAquecimento: Promise<void> | null = null

/** A família ativa: `'Inter'` quando o TTF carregou, `'helvetica'` no fallback. */
export function fonteAtiva(): string {
  return FAMILIA
}

export function bufferParaBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const pedacos: string[] = []
  const tamanho = 8192
  for (let i = 0; i < bytes.length; i += tamanho) {
    pedacos.push(String.fromCharCode(...bytes.subarray(i, i + tamanho)))
  }
  return btoa(pedacos.join(''))
}

/** Baixa e guarda os TTFs sem precisar de um documento. Seguro chamar cedo. */
export async function aquecerFontes(): Promise<void> {
  if (cacheDeFontes.length > 0) return
  if (promessaDeAquecimento) return promessaDeAquecimento
  promessaDeAquecimento = (async () => {
    try {
      const resultados = await Promise.all(
        ARQUIVOS_DE_FONTE.map(async (v) => {
          const res = await fetch(`/fonts/${v.file}`)
          if (!res.ok) throw new Error(`Font not found: ${v.file}`)
          return { ...v, data: await res.arrayBuffer() }
        }),
      )
      for (const r of resultados) {
        cacheDeFontes.push({ file: r.file, style: r.style, b64: bufferParaBase64(r.data) })
      }
      FAMILIA = FAMILIA_EMBUTIDA
    } catch {
      FAMILIA = 'helvetica'
    }
  })()
  return promessaDeAquecimento
}

/**
 * Entrega ao cache fontes já lidas por outro caminho — o servidor, que as lê
 * do disco (ver `lib/pdf/marca-servidor.ts`). Daí em diante `registrarFontes`
 * funciona igual nos dois lados.
 */
export function definirFontes(fontes: FonteCarregada[]): void {
  if (fontes.length === 0) return
  cacheDeFontes.length = 0
  cacheDeFontes.push(...fontes)
  FAMILIA = FAMILIA_EMBUTIDA
}

/**
 * Embute fontes já lidas NESTE documento e devolve a família a usar.
 *
 * É a porta do servidor, onde os TTFs vêm do disco (ver
 * `lib/pdf/marca-servidor.ts`) e não de um `fetch` relativo.
 */
export function embutirFontes(doc: jsPDF, fontes: FonteCarregada[]): string {
  if (fontes.length === 0) return 'helvetica'
  for (const f of fontes) {
    doc.addFileToVFS(f.file, f.b64)
    doc.addFont(f.file, FAMILIA_EMBUTIDA, f.style)
  }
  doc.setFont(FAMILIA_EMBUTIDA)
  return FAMILIA_EMBUTIDA
}

/**
 * Embute as fontes NESTE documento e devolve a família a usar.
 *
 * O registro é por documento (`addFileToVFS`/`addFont`), então todo gerador
 * precisa chamar isto no seu próprio `new jsPDF()` — aquecer o cache não basta.
 */
export async function registrarFontes(doc: jsPDF): Promise<string> {
  await aquecerFontes()
  if (cacheDeFontes.length > 0) {
    FAMILIA = embutirFontes(doc, cacheDeFontes)
  }
  return FAMILIA
}

/**
 * Prepara o texto para a fonte que está de fato ativa.
 *
 * Com a Inter embutida não há o que trocar — ela tem os glifos. Sem ela, cada
 * caractere fora do WinAnsi que passar daqui reescreve a linha inteira em
 * UTF-16 (ver o cabeçalho deste arquivo), então eles viram equivalentes ASCII.
 */
export function sanitizarParaPdf(texto: string): string {
  if (!texto) return texto
  // Invisíveis por escape, não pelo caractere: um zero-width colado no
  // arquivo é indistinguível de um erro de digitação na próxima leitura.
  const t = texto.replace(/[​‌‍﻿­]/g, '')
  if (FAMILIA === FAMILIA_EMBUTIDA) return t
  return t
    .replace(/₀/g, '0').replace(/₁/g, '1').replace(/₂/g, '2').replace(/₃/g, '3')
    .replace(/₄/g, '4').replace(/₅/g, '5').replace(/₆/g, '6').replace(/₇/g, '7')
    .replace(/₈/g, '8').replace(/₉/g, '9')
    .replace(/⁰/g, '0').replace(/⁴/g, '4').replace(/⁵/g, '5').replace(/⁶/g, '6')
    .replace(/⁷/g, '7').replace(/⁸/g, '8').replace(/⁹/g, '9')
    .replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/≠/g, '!=').replace(/≈/g, '~')
    .replace(/→/g, '->').replace(/←/g, '<-').replace(/↑/g, '^').replace(/↓/g, 'v')
    .replace(/↔/g, '<->').replace(/∞/g, 'inf')
    .replace(/α/g, 'alfa').replace(/β/g, 'beta').replace(/γ/g, 'gama')
    .replace(/δ/g, 'delta').replace(/Δ/g, 'Delta').replace(/μ/g, 'u')
    .replace(/✓/g, 'V').replace(/✔/g, 'V').replace(/✗/g, 'X').replace(/✘/g, 'X')
}

// ── Logo (cache de /logo-pdf.png) ────────────────────────────────
//
// O logo do PDF é uma versão de 144 px e 6 KB (`public/logo-pdf.png`, tirada
// de `public/logo.png`): no papel ele ocupa pouco mais de um centímetro, e
// embutir o arquivo de 512 px em todo PDF era peso sem ganho nenhum. É um PNG
// com transparência, então ele vai direto para o documento — não precisa mais
// passar por um canvas pintado de verde para fingir o fundo.

export const CAMINHO_DO_LOGO = '/logo-pdf.png'

let cacheDoLogo: string | null | undefined = undefined
let promessaDoLogo: Promise<string | null> | null = null

/** Guarda um logo já lido (o servidor lê do disco). */
export function definirLogo(dataUrl: string | null): void {
  cacheDoLogo = dataUrl
}

export async function carregarLogo(): Promise<string | null> {
  if (cacheDoLogo !== undefined) return cacheDoLogo
  if (promessaDoLogo) return promessaDoLogo
  promessaDoLogo = (async () => {
    const controle = typeof AbortController !== 'undefined' ? new AbortController() : null
    const limite = setTimeout(() => controle?.abort(), 6000)
    try {
      const res = await fetch(CAMINHO_DO_LOGO, controle ? { signal: controle.signal } : undefined)
      if (!res.ok) throw new Error('logo indisponível')
      cacheDoLogo = `data:image/png;base64,${bufferParaBase64(await res.arrayBuffer())}`
    } catch {
      cacheDoLogo = null
    } finally {
      clearTimeout(limite)
    }
    return cacheDoLogo
  })()
  return promessaDoLogo
}

/** Deixa fontes e logo quentes antes de alguém clicar num botão de PDF. */
export function aquecerAssetsDePdf(): void {
  if (typeof window === 'undefined') return
  aquecerFontes().catch(() => {})
  carregarLogo().catch(() => {})
}

// ── Texto que cabe ───────────────────────────────────────────────

/**
 * Encurta o texto até caber na largura, com reticências.
 *
 * O rodapé de toda prova imprime o título dela centralizado, e um título como
 * "N1 SOI I — Sistema Cardiovascular e Respiratório 2026/2" passava por cima
 * do "Página 3 de 12" à direita. `doc.text` com `maxWidth` não serve: ele
 * QUEBRA em várias linhas, e no rodapé a segunda linha sai fora da página.
 */
export function encurtarParaLargura(doc: jsPDF, texto: string, larguraMaxima: number): string {
  const limpo = sanitizarParaPdf(String(texto || '')).replace(/\s+/g, ' ').trim()
  if (limpo.length === 0 || doc.getTextWidth(limpo) <= larguraMaxima) return limpo

  const reticencias = '...'
  const larguraDasReticencias = doc.getTextWidth(reticencias)
  let corte = limpo.length

  while (corte > 0 && doc.getTextWidth(limpo.slice(0, corte)) + larguraDasReticencias > larguraMaxima) {
    corte -= 1
  }

  return corte > 0 ? limpo.slice(0, corte).trimEnd() + reticencias : reticencias
}

/**
 * Quebra o texto na largura e corta em `maximo` linhas, com reticências na
 * última quando sobrou texto.
 *
 * É para os títulos que moram dentro de um cartão de altura medida: o cartão
 * cresce até `maximo` linhas e nunca deixa o texto passar da borda.
 */
export function quebrarComLimite(doc: jsPDF, texto: string, largura: number, maximo: number): string[] {
  const limpo = sanitizarParaPdf(String(texto || '')).replace(/\s+/g, ' ').trim()
  if (!limpo) return []
  const todas = doc.splitTextToSize(limpo, largura) as string[]
  if (todas.length <= maximo) return todas
  const linhas = todas.slice(0, maximo)
  linhas[maximo - 1] = encurtarParaLargura(doc, `${linhas[maximo - 1]} ${todas[maximo]}`, largura)
  if (!linhas[maximo - 1].endsWith('...')) linhas[maximo - 1] = encurtarParaLargura(doc, `${linhas[maximo - 1]}...`, largura)
  return linhas
}

/** Liga a fonte de uma vez: família ativa, estilo, corpo e cor. */
export function fonte(doc: jsPDF, estilo: EstiloDeFonte, corpo: number, cor: Cor = TINTA): void {
  doc.setFont(FAMILIA, estilo)
  doc.setFontSize(corpo)
  doc.setTextColor(cor[0], cor[1], cor[2])
}

// ── Vidro: transparência, manchas, cartões ───────────────────────

/**
 * Um estado gráfico de opacidade.
 *
 * `doc.GState` é o construtor que o jsPDF pendura na instância — usar ele, e
 * não o `GState` exportado do pacote, mantém este arquivo sem importar o
 * jsPDF em tempo de execução (ver o `aquecerAssetsDePdf` da lista do Banco).
 * O jsPDF elimina duplicatas: a mesma opacidade vira um objeto só no arquivo.
 */
function opacidade(doc: jsPDF, valor: number): unknown {
  const Construtor = doc.GState as unknown as new (p: { opacity?: number; 'stroke-opacity'?: number }) => unknown
  return new Construtor({ opacity: valor, 'stroke-opacity': valor })
}

/** Desenha com opacidade, sem deixar a transparência vazar para o resto. */
export function comOpacidade(doc: jsPDF, valor: number, desenhar: () => void): void {
  doc.saveGraphicsState()
  doc.setGState(opacidade(doc, valor))
  desenhar()
  doc.restoreGraphicsState()
}

/**
 * Uma mancha difusa de cor — o "desfoque" do vidro.
 *
 * Círculos concêntricos quase transparentes, do maior para o menor: a
 * opacidade se acumula para o centro e a borda some no fundo. Doze anéis com
 * pico de 20% dão degraus de menos de 2% cada — o olho não vê os anéis.
 */
export function desenharMancha(
  doc: jsPDF,
  cx: number,
  cy: number,
  raio: number,
  cor: Cor,
  pico = 0.2,
  aneis = 12,
): void {
  const passo = 1 - Math.pow(1 - pico, 1 / aneis)
  doc.saveGraphicsState()
  doc.setGState(opacidade(doc, passo))
  doc.setFillColor(cor[0], cor[1], cor[2])
  for (let i = 0; i < aneis; i++) {
    // Os raios caem pela raiz: mais anéis perto do centro, borda mais macia.
    const r = raio * Math.sqrt(1 - i / aneis)
    doc.circle(cx, cy, Math.max(0.5, r), 'F')
  }
  doc.restoreGraphicsState()
}

/**
 * O fundo de uma página: o papel e as manchas das bordas.
 *
 * As manchas fortes ficam no alto, atrás do cabeçalho de vidro (é ali que o
 * vidro precisa de cor para parecer vidro); embaixo, uma mancha discreta de
 * cada lado. O meio da folha fica quase branco — é onde a prova é lida e
 * respondida a caneta.
 */
export function desenharFundoDaPagina(doc: jsPDF): void {
  const largura = doc.internal.pageSize.getWidth()
  const altura = doc.internal.pageSize.getHeight()
  doc.setFillColor(PAPEL[0], PAPEL[1], PAPEL[2])
  doc.rect(0, 0, largura, altura, 'F')
  desenharMancha(doc, largura * 0.08, -6, 62, VERDE_VIVO, 0.22)
  desenharMancha(doc, largura * 0.62, -16, 44, VERDE, 0.1)
  desenharMancha(doc, largura * 0.96, 6, 50, LARANJA, 0.26)
  desenharMancha(doc, -8, altura + 4, 46, VERDE_VIVO, 0.1)
  desenharMancha(doc, largura + 6, altura - 10, 40, LARANJA, 0.1)
}

export type TomDoVidro = 'claro' | 'verde' | 'laranja' | 'erro' | 'escuro'

export interface OpcoesDoVidro {
  tom?: TomDoVidro
  raio?: number
  /** Sombra macia por baixo. Padrão: sim. */
  sombra?: boolean
  /** Opacidade do corpo. Padrão por tom. */
  opacidade?: number
}

const CORPO_DO_VIDRO: Record<TomDoVidro, { cor: Cor; opacidade: number; borda: Cor; opacidadeDaBorda: number }> = {
  claro: { cor: [255, 255, 255], opacidade: 0.78, borda: FIO, opacidadeDaBorda: 1 },
  verde: { cor: MENTA, opacidade: 0.9, borda: [176, 214, 190], opacidadeDaBorda: 1 },
  laranja: { cor: PESSEGO, opacidade: 0.92, borda: [244, 202, 150], opacidadeDaBorda: 1 },
  erro: { cor: ERRO_CLARO, opacidade: 0.92, borda: [238, 180, 172], opacidadeDaBorda: 1 },
  escuro: { cor: FLORESTA, opacidade: 1, borda: FLORESTA, opacidadeDaBorda: 1 },
}

/**
 * Um cartão de vidro: sombra macia, corpo translúcido, borda fina e o fio de
 * luz no topo.
 *
 * Só a superfície — o conteúdo é de quem chama, desenhado depois.
 */
export function desenharVidro(
  doc: jsPDF,
  x: number,
  y: number,
  largura: number,
  altura: number,
  opcoes: OpcoesDoVidro = {},
): void {
  if (largura <= 0 || altura <= 0) return
  const tom = opcoes.tom ?? 'claro'
  const raio = Math.min(opcoes.raio ?? 3.2, altura / 2, largura / 2)
  const corpo = CORPO_DO_VIDRO[tom]

  // Um documento sem estados gráficos (os de mentira, nos testes de
  // geometria) recebe a superfície numa peça só: um retângulo, sem sombra
  // nem transparência — a mesma caixa, no mesmo lugar.
  if (typeof doc.saveGraphicsState !== 'function') {
    doc.setFillColor(corpo.cor[0], corpo.cor[1], corpo.cor[2])
    doc.setDrawColor(corpo.borda[0], corpo.borda[1], corpo.borda[2])
    doc.roundedRect(x, y, largura, altura, raio, raio, 'FD')
    return
  }

  if (opcoes.sombra !== false) {
    // Três camadas, cada vez mais largas e mais baixas: a sombra tem
    // deslocamento e borda macia, não é um halo.
    doc.saveGraphicsState()
    doc.setGState(opacidade(doc, tom === 'escuro' ? 0.07 : 0.045))
    doc.setFillColor(FLORESTA[0], FLORESTA[1], FLORESTA[2])
    for (const [espalhar, descer] of [[0.3, 0.5], [0.9, 1.0], [1.7, 1.7]] as const) {
      doc.roundedRect(
        x - espalhar,
        y - espalhar + descer,
        largura + 2 * espalhar,
        altura + 2 * espalhar,
        raio + espalhar,
        raio + espalhar,
        'F',
      )
    }
    doc.restoreGraphicsState()
  }

  doc.saveGraphicsState()
  doc.setGState(opacidade(doc, opcoes.opacidade ?? corpo.opacidade))
  doc.setFillColor(corpo.cor[0], corpo.cor[1], corpo.cor[2])
  doc.roundedRect(x, y, largura, altura, raio, raio, 'F')
  doc.restoreGraphicsState()

  if (tom === 'escuro') {
    // O vidro escuro ganha a profundidade por dentro: manchas de verde e de
    // laranja presas ao cartão, como luz atravessando a superfície.
    doc.saveGraphicsState()
    doc.roundedRect(x, y, largura, altura, raio, raio, null)
    doc.clip()
    doc.discardPath()
    desenharMancha(doc, x + largura * 0.92, y + altura * 0.1, Math.max(altura, 40) * 0.9, LARANJA, 0.42)
    desenharMancha(doc, x + largura * 0.05, y + altura, Math.max(altura, 40) * 1.1, VERDE_VIVO, 0.4)
    doc.restoreGraphicsState()
  }

  // Borda fina.
  doc.setLineWidth(0.25)
  doc.setDrawColor(corpo.borda[0], corpo.borda[1], corpo.borda[2])
  if (tom !== 'escuro') doc.roundedRect(x, y, largura, altura, raio, raio, 'S')

  // O fio de luz: uma linha branca rente ao topo, entre os cantos.
  if (largura > 2 * raio + 2) {
    comOpacidade(doc, tom === 'escuro' ? 0.28 : 0.95, () => {
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.35)
      doc.line(x + raio, y + 0.35, x + largura - raio, y + 0.35)
    })
  }
}

/**
 * Uma pílula (cápsula) com texto centralizado. Devolve a largura usada.
 *
 * `alinhar: 'direita'` ancora a pílula pela borda direita em `x`.
 */
export function desenharPilula(
  doc: jsPDF,
  texto: string,
  x: number,
  yCentro: number,
  opcoes: {
    tom?: 'escuro' | 'verde' | 'laranja' | 'claro' | 'erro' | 'translucido'
    corpo?: number
    altura?: number
    larguraMaxima?: number
    alinhar?: 'esquerda' | 'direita'
    negrito?: boolean
  } = {},
): number {
  const corpo = opcoes.corpo ?? 7.5
  const altura = opcoes.altura ?? corpo * 0.62 + 2.6
  const tom = opcoes.tom ?? 'claro'
  doc.setFont(FAMILIA, opcoes.negrito === false ? 'normal' : 'bold')
  doc.setFontSize(corpo)
  const respiro = altura * 0.55
  const conteudo = encurtarParaLargura(doc, texto, (opcoes.larguraMaxima ?? 200) - 2 * respiro)
  const largura = doc.getTextWidth(conteudo) + 2 * respiro
  const x0 = opcoes.alinhar === 'direita' ? x - largura : x
  const y0 = yCentro - altura / 2

  const cores: Record<string, { fundo: Cor; texto: Cor; opacidade: number; borda?: Cor }> = {
    escuro: { fundo: FLORESTA, texto: [255, 255, 255], opacidade: 1 },
    verde: { fundo: MENTA, texto: VERDE, opacidade: 1, borda: [176, 214, 190] },
    laranja: { fundo: PESSEGO, texto: LARANJA_TEXTO, opacidade: 1, borda: [244, 202, 150] },
    erro: { fundo: ERRO_CLARO, texto: ERRO, opacidade: 1, borda: [238, 180, 172] },
    claro: { fundo: [255, 255, 255], texto: TINTA_SUAVE, opacidade: 0.85, borda: FIO },
    // Sobre o vidro escuro: branco a 16% deixa a mancha de trás aparecer.
    translucido: { fundo: [255, 255, 255], texto: [255, 255, 255], opacidade: 0.16 },
  }
  const c = cores[tom]
  comOpacidade(doc, c.opacidade, () => {
    doc.setFillColor(c.fundo[0], c.fundo[1], c.fundo[2])
    doc.roundedRect(x0, y0, largura, altura, altura / 2, altura / 2, 'F')
  })
  if (c.borda) {
    doc.setDrawColor(c.borda[0], c.borda[1], c.borda[2])
    doc.setLineWidth(0.2)
    doc.roundedRect(x0, y0, largura, altura, altura / 2, altura / 2, 'S')
  }
  doc.setTextColor(c.texto[0], c.texto[1], c.texto[2])
  doc.text(conteudo, x0 + largura / 2, yCentro + corpo * 0.125, { align: 'center' })
  return largura
}

/**
 * O título de um grupo, no jeito das listas agrupadas do iOS: versalete
 * pequeno e espaçado, em tinta suave, com um fio que corre até a margem.
 */
export function desenharTituloDeGrupo(doc: jsPDF, texto: string, x: number, y: number, largura: number): void {
  doc.setFont(FAMILIA, 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(TINTA_SUAVE[0], TINTA_SUAVE[1], TINTA_SUAVE[2])
  const conteudo = encurtarParaLargura(doc, String(texto).toUpperCase(), largura - 12)
  doc.text(conteudo, x, y, { charSpace: 0.35 })
  const fim = x + doc.getTextWidth(conteudo) + conteudo.length * 0.35 + 3
  if (fim < x + largura) {
    doc.setDrawColor(FIO[0], FIO[1], FIO[2])
    doc.setLineWidth(0.25)
    doc.line(fim, y - 1.1, x + largura, y - 1.1)
  }
}

/** O ícone do app: o logo num quadrado branco de cantos contínuos. */
export function desenharIconeDoApp(doc: jsPDF, x: number, y: number, lado: number, logo?: string | null): boolean {
  desenharVidro(doc, x, y, lado, lado, { raio: lado * 0.26, opacidade: 0.96 })
  if (!logo) return false
  try {
    const miolo = lado * 0.74
    // O logo tem 137 × 144: a altura manda, a largura acompanha.
    const largura = miolo * (137 / 144)
    doc.addImage(logo, 'PNG', x + (lado - largura) / 2, y + (lado - miolo) / 2, largura, miolo, 'logo-domineaqui')
    return true
  } catch {
    return false
  }
}

// ── Cabeçalho e rodapé ───────────────────────────────────────────

/**
 * O fundo da página e a barra de vidro com o logo. Devolve o `y` em que o
 * conteúdo pode começar (`Y_APOS_CABECALHO`, sempre).
 *
 * É chamado logo depois de cada `addPage` — e é por isso que o fundo da folha
 * mora aqui: ele precisa ser a primeira coisa pintada, antes de qualquer
 * conteúdo, e toda página nova passa por este ponto.
 */
export function desenharCabecalho(
  doc: jsPDF,
  pageWidth: number,
  margin: number,
  subtitulo?: string,
  logo?: string | null,
): number {
  desenharFundoDaPagina(doc)

  const x = margin - 2
  const largura = pageWidth - 2 * x
  const y = 9
  const altura = 19
  desenharVidro(doc, x, y, largura, altura, { raio: altura / 2, opacidade: 0.62 })

  const lado = 13
  const iconeX = x + 3
  desenharIconeDoApp(doc, iconeX, y + (altura - lado) / 2, lado, logo)
  const textoX = iconeX + lado + 3.5

  fonte(doc, 'bold', 12.5, FLORESTA)
  doc.text('DomineAqui', textoX, y + 8.6)
  fonte(doc, 'normal', 7, TINTA_SUAVE)
  doc.text('domineaqui.com.br', textoX, y + 13.6)

  if (subtitulo) {
    // Presa à barra: o nome ocupa a esquerda, e um subtítulo longo encurta em
    // vez de entrar por baixo dele.
    fonte(doc, 'bold', 12.5)
    const fimDoNome = textoX + Math.max(doc.getTextWidth('DomineAqui'), 24) + 6
    const direita = x + largura - 4
    desenharPilula(doc, subtitulo, direita, y + altura / 2, {
      tom: 'escuro',
      corpo: 8,
      altura: 8.4,
      alinhar: 'direita',
      larguraMaxima: direita - fimDoNome,
    })
  }

  // Devolve o estado de texto ao padrão do corpo: sem isto o primeiro
  // parágrafo depois do cabeçalho sai branco sobre branco.
  fonte(doc, 'normal', 10, TINTA)

  return Y_APOS_CABECALHO
}

export function desenharRodape(
  doc: jsPDF,
  pagina: number,
  totalDePaginas: number,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  textoExtra?: string,
  legenda = 'Manual / Provas',
): void {
  const x = margin - 2
  const largura = pageWidth - 2 * x
  const altura = 9
  const y = pageHeight - 17.5
  const meio = y + altura / 2

  desenharVidro(doc, x, y, largura, altura, { raio: altura / 2, opacidade: 0.7 })

  // O número da página numa cápsula escura, à direita.
  const contador = `${pagina} / ${totalDePaginas}`
  const larguraDoContador = desenharPilula(doc, contador, x + largura - 1.6, meio, {
    tom: 'escuro',
    corpo: 7.5,
    altura: 5.8,
    alinhar: 'direita',
  })

  // O ponto laranja e a marca, à esquerda.
  doc.setFillColor(LARANJA[0], LARANJA[1], LARANJA[2])
  doc.circle(x + 5, meio, 1.15, 'F')
  fonte(doc, 'bold', 7.5, FLORESTA)
  doc.text('DomineAqui', x + 8, meio + 0.95)
  const larguraDoNome = doc.getTextWidth('DomineAqui')
  fonte(doc, 'normal', 7.5, TINTA_SUAVE)
  const inicioDaLegenda = x + 8 + larguraDoNome + 1.4
  const legendaCurta = encurtarParaLargura(doc, legenda, 40)
  doc.text(legendaCurta, inicioDaLegenda, meio + 0.95)
  const fimDaEsquerda = inicioDaLegenda + doc.getTextWidth(legendaCurta)

  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  // O centro: o título do documento, preso entre a marca e o contador. Um
  // título como "N1 SOI I — Sistema Cardiovascular e Respiratório 2026/2"
  // passava por cima dos dois; aqui ele encurta.
  const inicioDoMeio = fimDaEsquerda + 5
  const fimDoMeio = x + largura - 1.6 - larguraDoContador - 5
  fonte(doc, 'normal', 7.5, TINTA)
  const centro = encurtarParaLargura(doc, textoExtra || `Gerado em ${dataGeracao}`, Math.max(0, fimDoMeio - inicioDoMeio))
  if (centro && fimDoMeio - inicioDoMeio > 12) {
    doc.text(centro, (inicioDoMeio + fimDoMeio) / 2, meio + 0.95, { align: 'center' })
  }

  // A linha de crédito, miúda, embaixo da pílula.
  fonte(doc, 'normal', 6, TINTA_FRACA)
  const credito = textoExtra ? `Criado por Thiago Rodrigues  ·  Gerado em ${dataGeracao}` : 'Criado por Thiago Rodrigues'
  doc.text(credito, pageWidth / 2, pageHeight - 4.6, { align: 'center' })
}

// ── Marcas de certo/errado, desenhadas em vetor ──────────────────

/**
 * O "certo" é desenhado, não escrito.
 *
 * Mesmo com a fonte embutida, um `✓` no meio do texto muda a largura da linha
 * e depende do glifo existir na fonte que estiver valendo. Um círculo com dois
 * traços não depende de fonte nenhuma, imprime igual em qualquer leitor e é o
 * que os PDFs de `/provas` já faziam.
 */
export function marcarCerto(doc: jsPDF, x: number, y: number, raio = 3): void {
  doc.setFillColor(VERDE[0], VERDE[1], VERDE[2])
  doc.circle(x, y, raio, 'F')
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(raio * 0.24)
  doc.setLineCap('round')
  doc.setLineJoin('round')
  const k = raio / 3
  doc.lines([[1.15 * k, 1.2 * k], [1.75 * k, -2.6 * k]], x - 1.35 * k, y + 0.05 * k, [1, 1], 'S', false)
  doc.setLineCap('butt')
  doc.setLineJoin('miter')
}

/** O "errado": círculo vermelho com um X branco. */
export function marcarErrado(doc: jsPDF, x: number, y: number, raio = 3): void {
  doc.setFillColor(ERRO[0], ERRO[1], ERRO[2])
  doc.circle(x, y, raio, 'F')
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(raio * 0.24)
  doc.setLineCap('round')
  const k = (raio / 3) * 1.15
  doc.line(x - k, y - k, x + k, y + k)
  doc.line(x + k, y - k, x - k, y + k)
  doc.setLineCap('butt')
}

/** A bolinha vazia das alternativas que não foram marcadas nem são a certa. */
export function marcarNeutro(doc: jsPDF, x: number, y: number, raio = 2.6): void {
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(VERDE[0], VERDE[1], VERDE[2])
  doc.setLineWidth(0.35)
  doc.circle(x, y, raio, 'FD')
}

/**
 * A bolha de uma alternativa: um círculo com a letra dentro.
 *
 * `vazia` é a da prova em branco (contorno, letra verde — é ali que o aluno
 * pinta); `cheia` é a marcada (verde-escuro, letra branca); `certa` e
 * `errada` pintam a bolha de verde e de vermelho, sem perder a letra.
 */
export function desenharBolha(
  doc: jsPDF,
  letra: string,
  x: number,
  y: number,
  estado: 'vazia' | 'cheia' | 'certa' | 'errada' = 'vazia',
  raio = 2.9,
): void {
  // A letra fica sempre: um "certo" sem a letra obrigava a procurar no
  // cabeçalho qual era a alternativa certa.
  if (estado !== 'vazia') {
    const cor = estado === 'certa' ? VERDE : estado === 'errada' ? ERRO : FLORESTA
    doc.setFillColor(cor[0], cor[1], cor[2])
    doc.circle(x, y, raio, 'F')
  } else {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(VERDE[0], VERDE[1], VERDE[2])
    doc.setLineWidth(0.35)
    doc.circle(x, y, raio, 'FD')
  }
  fonte(doc, 'bold', raio * 2.55, estado === 'vazia' ? VERDE : [255, 255, 255])
  doc.text(sanitizarParaPdf(letra).slice(0, 2), x, y + raio * 0.36, { align: 'center' })
}
