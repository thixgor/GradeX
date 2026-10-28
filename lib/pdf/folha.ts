import type jsPDF from 'jspdf'

import {
  type Cor,
  type EstiloDeFonte,
  type TomDoVidro,
  FIO,
  FLORESTA,
  LARANJA,
  RESERVA_DO_RODAPE,
  TINTA,
  TINTA_FRACA,
  TINTA_SUAVE,
  desenharBolha,
  desenharCabecalho,
  desenharPilula,
  desenharRodape,
  desenharTituloDeGrupo,
  desenharVidro,
  encurtarParaLargura,
  fonte,
  quebrarComLimite,
  sanitizarParaPdf,
} from './marca'
import { desenharLinhaRica, quebrarTexto } from './texto'

/**
 * Os componentes de página dos PDFs de estudo: o cartão de título, o
 * cabeçalho da questão, a lista agrupada (alternativas, gabarito, instruções),
 * as linhas de resposta e os números em destaque.
 *
 * ## A regra que todos seguem
 *
 * Nada é desenhado antes de ser medido. O jsPDF não tem fluxo — `doc.text`
 * escreve onde mandarem, e o que passa da margem ou do pé da folha some sem
 * aviso. Era assim que o título de uma prova longa atravessava a borda do
 * cartão laranja e a "Fonte:" de um enunciado saía cortada à direita. Aqui
 * todo texto passa por `quebrarTexto` ou `quebrarComLimite` antes, todo cartão
 * tem a altura do que vai dentro, e toda coisa alta pergunta à folha se cabe
 * (`garantirEspaco`) antes de começar.
 *
 * ## A convenção do `y`
 *
 * `folha.y` é o TOPO do espaço livre, não a linha de base do último texto.
 * Cada componente começa em `folha.y` e devolve a folha com o `y` logo abaixo
 * de si — é o que deixa medir um cartão inteiro antes de pintá-lo.
 */

export interface Folha {
  doc: jsPDF
  /** A família ativa (`Inter` ou o fallback `helvetica`). */
  fonte: string
  largura: number
  altura: number
  margem: number
  /** Largura do conteúdo, entre as margens. */
  larguraUtil: number
  /** O `y` máximo do conteúdo: abaixo dele é o rodapé. */
  limite: number
  /** O topo do espaço livre. */
  y: number
  subtitulo: string
  logo: string | null
}

export const MARGEM_PADRAO = 18

/** Converte o corpo da fonte (pt) para milímetros. */
const mm = (corpo: number) => corpo * 0.3528

/** Onde fica a linha de base dentro de uma linha de `entrelinha` mm. */
export const baseDaLinha = (entrelinha: number, corpo: number) => entrelinha / 2 + mm(corpo) * 0.34

export function criarFolha(
  doc: jsPDF,
  familia: string,
  logo: string | null,
  subtitulo: string,
  margem = MARGEM_PADRAO,
): Folha {
  const largura = doc.internal.pageSize.getWidth()
  const altura = doc.internal.pageSize.getHeight()
  const folha: Folha = {
    doc,
    fonte: familia,
    largura,
    altura,
    margem,
    larguraUtil: largura - 2 * margem,
    limite: altura - RESERVA_DO_RODAPE,
    y: 0,
    subtitulo,
    logo,
  }
  folha.y = desenharCabecalho(doc, largura, margem, subtitulo, logo)
  return folha
}

/** Abre a página seguinte, com fundo e cabeçalho, e devolve o novo `y`. */
export function novaPagina(folha: Folha): number {
  folha.doc.addPage()
  folha.y = desenharCabecalho(folha.doc, folha.largura, folha.margem, folha.subtitulo, folha.logo)
  return folha.y
}

/** Se `altura` não cabe no que resta, vira a página. Diz se virou. */
export function garantirEspaco(folha: Folha, altura: number): boolean {
  if (folha.y + altura > folha.limite) {
    novaPagina(folha)
    return true
  }
  return false
}

/** O espaço que resta até o rodapé. */
export const espacoRestante = (folha: Folha) => folha.limite - folha.y

/** O rodapé em todas as páginas — por último, quando o total é conhecido. */
export function finalizarFolha(folha: Folha, textoExtra?: string, legenda?: string): void {
  const total = folha.doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    folha.doc.setPage(i)
    desenharRodape(folha.doc, i, total, folha.largura, folha.altura, folha.margem, textoExtra, legenda)
  }
}

// ── Texto corrido ────────────────────────────────────────────────

export interface OpcoesDeTexto {
  corpo?: number
  estilo?: EstiloDeFonte
  cor?: Cor
  /** Distância entre linhas, em mm. */
  entrelinha?: number
  /** Recuo à esquerda, em relação à margem. */
  recuo?: number
  /** Largura do texto. Padrão: o que sobra depois do recuo. */
  largura?: number
  /** Espaço depois do bloco. */
  depois?: number
}

/**
 * Escreve um texto com `**negrito**` e `*itálico*`, quebrando linha e página.
 *
 * A linha em branco entre parágrafos vira meia linha de respiro, não uma
 * linha inteira: um caso clínico em três parágrafos não deve parecer três
 * blocos soltos.
 */
export function escreverTexto(folha: Folha, texto: string, opcoes: OpcoesDeTexto = {}): void {
  const { doc } = folha
  const corpo = opcoes.corpo ?? 10
  const estilo = opcoes.estilo ?? 'normal'
  const cor = opcoes.cor ?? TINTA
  const entrelinha = opcoes.entrelinha ?? corpo * 0.54
  const recuo = opcoes.recuo ?? 0
  const largura = opcoes.largura ?? folha.larguraUtil - recuo
  const x = folha.margem + recuo
  const base = baseDaLinha(entrelinha, corpo)

  const aplicar = () => fonte(doc, estilo, corpo, cor)
  aplicar()
  const linhas = quebrarTexto(doc, texto, largura)
  for (const linha of linhas) {
    if (linha === '') {
      folha.y += entrelinha * 0.5
      continue
    }
    if (garantirEspaco(folha, entrelinha)) aplicar()
    // `desenharLinhaRica` troca o estilo no meio da linha: a cor e o corpo
    // continuam, mas o estilo base precisa voltar a cada linha.
    aplicar()
    desenharLinhaRica(doc, folha.fonte, linha, x, folha.y + base, estilo)
    folha.y += entrelinha
  }
  folha.y += opcoes.depois ?? 0
}

/** A "Fonte:" de um enunciado ou de uma questão: miúda, itálica, quebrada. */
export function escreverCredito(folha: Folha, texto: string, opcoes: { recuo?: number; depois?: number } = {}): void {
  const limpo = String(texto || '').trim()
  if (!limpo) return
  escreverTexto(folha, `Fonte: ${limpo.replace(/\*/g, '')}`, {
    corpo: 7.5,
    estilo: 'italic',
    cor: TINTA_FRACA,
    entrelinha: 3.8,
    recuo: opcoes.recuo,
    depois: opcoes.depois ?? 2,
  })
}

// ── Cartão de título (o "herói" da primeira página) ──────────────

export interface CartaoDeTitulo {
  titulo: string
  descricao?: string | null
  /** Pílulas de metadados: "17 questões", "240 min"… */
  chips?: string[]
}

/**
 * O cartão escuro da primeira página: o título da prova em branco sobre vidro
 * verde-escuro, com luz laranja e verde atravessando.
 *
 * A altura é a do conteúdo. O título vai até três linhas e a descrição até
 * quatro — o resto vira reticências, e o cartão nunca deixa o texto passar da
 * borda (o defeito do cartão laranja de altura fixa, em que um título longo
 * saía pela lateral da folha).
 */
export function desenharCartaoDeTitulo(folha: Folha, cartao: CartaoDeTitulo): void {
  const { doc } = folha
  const respiro = 8
  const larguraDoTexto = folha.larguraUtil - 2 * respiro

  fonte(doc, 'bold', 17, [255, 255, 255])
  const titulo = quebrarComLimite(doc, cartao.titulo || 'Sem título', larguraDoTexto, 3)
  const entrelinhaDoTitulo = 7.4

  fonte(doc, 'normal', 9.5)
  const descricao = cartao.descricao ? quebrarComLimite(doc, cartao.descricao, larguraDoTexto, 4) : []
  const entrelinhaDaDescricao = 4.9

  // As pílulas quebram em mais de uma fileira se não couberem numa só.
  const chips = (cartao.chips || []).filter(Boolean)
  const alturaDaPilula = 6.4
  const fileiras: string[][] = []
  if (chips.length > 0) {
    fonte(doc, 'bold', 7.8)
    let fileira: string[] = []
    let ocupado = 0
    for (const chip of chips) {
      const larguraDoChip = Math.min(doc.getTextWidth(sanitizarParaPdf(chip)) + alturaDaPilula * 1.1, larguraDoTexto)
      if (fileira.length > 0 && ocupado + larguraDoChip > larguraDoTexto) {
        fileiras.push(fileira)
        fileira = []
        ocupado = 0
      }
      fileira.push(chip)
      ocupado += larguraDoChip + 2.5
    }
    if (fileira.length > 0) fileiras.push(fileira)
  }

  const altura =
    respiro +
    titulo.length * entrelinhaDoTitulo +
    (descricao.length > 0 ? 2.2 + descricao.length * entrelinhaDaDescricao : 0) +
    (fileiras.length > 0 ? 5 + fileiras.length * (alturaDaPilula + 2.2) - 2.2 : 0) +
    respiro -
    1

  garantirEspaco(folha, altura)
  const x = folha.margem
  const topo = folha.y
  desenharVidro(doc, x, topo, folha.larguraUtil, altura, { tom: 'escuro', raio: 5 })

  let y = topo + respiro
  fonte(doc, 'bold', 17, [255, 255, 255])
  for (const linha of titulo) {
    doc.text(linha, x + respiro, y + baseDaLinha(entrelinhaDoTitulo, 17))
    y += entrelinhaDoTitulo
  }
  if (descricao.length > 0) {
    y += 2.2
    fonte(doc, 'normal', 9.5, [214, 234, 221])
    for (const linha of descricao) {
      doc.text(linha, x + respiro, y + baseDaLinha(entrelinhaDaDescricao, 9.5))
      y += entrelinhaDaDescricao
    }
  }
  if (fileiras.length > 0) {
    y += 5
    for (const fileira of fileiras) {
      let cx = x + respiro
      for (const chip of fileira) {
        cx +=
          desenharPilula(doc, chip, cx, y + alturaDaPilula / 2, {
            tom: 'translucido',
            corpo: 7.8,
            altura: alturaDaPilula,
            larguraMaxima: larguraDoTexto,
          }) + 2.5
      }
      y += alturaDaPilula + 2.2
    }
  }

  folha.y = topo + altura + 7
  fonte(doc, 'normal', 10, TINTA)
}

// ── Cabeçalho da questão ─────────────────────────────────────────

/**
 * "Questão 12" numa cápsula escura, as pílulas de tipo e metadados à direita
 * e um fio entre os dois.
 *
 * `reserva` é quanto da questão precisa caber junto com o cabeçalho na mesma
 * página — um cabeçalho sozinho no pé da folha, com o enunciado na seguinte,
 * é o órfão mais comum de um PDF de prova.
 */
export function desenharCabecalhoDaQuestao(
  folha: Folha,
  rotulo: string,
  pilulas: { texto: string; tom?: 'claro' | 'verde' | 'laranja' | 'erro' | 'escuro' }[] = [],
  reserva = 34,
): void {
  const { doc } = folha
  const altura = 7.4
  garantirEspaco(folha, altura + reserva)
  const meio = folha.y + altura / 2
  const x = folha.margem
  const direita = x + folha.larguraUtil

  const larguraDoRotulo = desenharPilula(doc, rotulo, x, meio, {
    tom: 'escuro',
    corpo: 9,
    altura,
    larguraMaxima: folha.larguraUtil * 0.45,
  })

  let cursor = direita
  const espacoParaPilulas = folha.larguraUtil - larguraDoRotulo - 10
  for (const pilula of [...pilulas].reverse()) {
    const livre = cursor - (x + larguraDoRotulo + 10)
    if (livre < 14 || espacoParaPilulas <= 0) break
    cursor -=
      desenharPilula(doc, pilula.texto, cursor, meio, {
        tom: pilula.tom ?? 'claro',
        corpo: 7.2,
        altura: 5.6,
        alinhar: 'direita',
        larguraMaxima: livre,
      }) + 1.8
  }

  const inicioDoFio = x + larguraDoRotulo + 3
  const fimDoFio = cursor - 1.2
  if (fimDoFio - inicioDoFio > 4) {
    doc.setDrawColor(FIO[0], FIO[1], FIO[2])
    doc.setLineWidth(0.3)
    doc.line(inicioDoFio, meio, fimDoFio, meio)
  }

  folha.y += altura + 4.2
  fonte(doc, 'normal', 10, TINTA)
}

// ── Lista agrupada (o "inset grouped" do iOS) ────────────────────

export interface LinhaDoGrupo {
  altura: number
  /** Desenha a linha com o canto superior esquerdo em (x, y). */
  desenhar: (x: number, y: number, largura: number) => void
  /** Pinta um realce por dentro do grupo, atrás da linha. */
  realce?: TomDoVidro
}

export interface OpcoesDoGrupo {
  tom?: TomDoVidro
  /** Respiro entre a borda do cartão e a primeira/última linha. */
  respiro?: number
  /** Onde os fios entre linhas começam, a partir da borda esquerda. */
  recuoDoFio?: number
  /** Sem fios entre as linhas. */
  semFios?: boolean
  /** Espaço depois do grupo. */
  depois?: number
  /** Recuo do cartão em relação à margem. */
  recuo?: number
  /** Título do grupo, no estilo das listas do iOS. */
  titulo?: string
}

/**
 * Um cartão de vidro com linhas dentro, separadas por fios — as alternativas,
 * o gabarito, as instruções.
 *
 * Quebra entre linhas, nunca no meio de uma: a página que não comporta a
 * próxima linha fecha o cartão ali, e o resto abre um cartão novo na página
 * seguinte. Uma linha sozinha mais alta que a página é desenhada mesmo assim
 * (não há onde mais pôr) — nenhum conteúdo de questão real chega perto disso.
 */
export function desenharGrupo(folha: Folha, linhas: LinhaDoGrupo[], opcoes: OpcoesDoGrupo = {}): void {
  if (linhas.length === 0) return
  const { doc } = folha
  const respiro = opcoes.respiro ?? 1.6
  const recuo = opcoes.recuo ?? 0
  const x = folha.margem + recuo
  const largura = folha.larguraUtil - recuo
  const alturaDoTitulo = opcoes.titulo ? 6.5 : 0

  let i = 0
  let primeiro = true
  while (i < linhas.length) {
    const topoDoTitulo = primeiro ? alturaDoTitulo : 0
    // Cabe ao menos a próxima linha (e o título, no primeiro pedaço)?
    if (folha.y + topoDoTitulo + linhas[i].altura + 2 * respiro > folha.limite) novaPagina(folha)

    if (primeiro && opcoes.titulo) {
      desenharTituloDeGrupo(doc, opcoes.titulo, x + 1, folha.y + 3.6, largura - 1)
      folha.y += alturaDoTitulo
    }

    let soma = 0
    let j = i
    while (j < linhas.length && (j === i || folha.y + soma + linhas[j].altura + 2 * respiro <= folha.limite)) {
      soma += linhas[j].altura
      j++
    }

    const topo = folha.y
    desenharVidro(doc, x, topo, largura, soma + 2 * respiro, { tom: opcoes.tom ?? 'claro' })

    let y = topo + respiro
    for (let k = i; k < j; k++) {
      const linha = linhas[k]
      if (linha.realce) {
        desenharVidro(doc, x + 1.2, y + 0.4, largura - 2.4, linha.altura - 0.8, {
          tom: linha.realce,
          sombra: false,
          raio: 2.4,
        })
      }
      linha.desenhar(x, y, largura)
      const proxima = linhas[k + 1]
      if (!opcoes.semFios && k < j - 1 && !linha.realce && !proxima?.realce) {
        doc.setDrawColor(FIO[0], FIO[1], FIO[2])
        doc.setLineWidth(0.22)
        doc.line(x + (opcoes.recuoDoFio ?? 4), y + linha.altura, x + largura - 3, y + linha.altura)
      }
      y += linha.altura
    }

    folha.y = topo + soma + 2 * respiro + 3
    i = j
    primeiro = false
  }
  folha.y += opcoes.depois ?? 2
  fonte(doc, 'normal', 10, TINTA)
}

// ── Alternativas ─────────────────────────────────────────────────

export type EstadoDaAlternativa = 'vazia' | 'certa' | 'marcada' | 'errada' | 'neutra'

export interface Alternativa {
  letra: string
  texto: string
  estado: EstadoDaAlternativa
  /** Uma palavra à direita: "Gabarito", "Sua resposta". */
  etiqueta?: string
}

/**
 * As alternativas de uma questão como lista agrupada.
 *
 * A bolha carrega a letra (e é onde o aluno pinta, na prova em branco); a
 * certa ganha o realce verde e a marca de certo, a marcada errada ganha o
 * realce vermelho e o X. A cor nunca é a única pista: forma da marca, peso do
 * texto e a etiqueta escrita dizem o mesmo para quem imprime em preto e branco.
 */
export function desenharAlternativas(folha: Folha, alternativas: Alternativa[]): void {
  const { doc } = folha
  const corpo = 10
  const entrelinha = 5.2
  const respiroVertical = 2.3
  const xDoTexto = 11.5

  const linhas: LinhaDoGrupo[] = alternativas.map((alt) => {
    const destaque = alt.estado === 'certa'
    const estilo: EstiloDeFonte = destaque || alt.estado === 'marcada' ? 'bold' : 'normal'
    const cor: Cor = destaque ? FLORESTA : alt.estado === 'errada' ? [120, 30, 24] : TINTA

    // A etiqueta ocupa a direita da primeira linha: o texto é quebrado numa
    // largura que já a desconta, para nunca correr por baixo dela.
    let larguraDaEtiqueta = 0
    if (alt.etiqueta) {
      fonte(doc, 'bold', 7)
      larguraDaEtiqueta = doc.getTextWidth(alt.etiqueta) + 5.6 + 3
    }
    fonte(doc, estilo, corpo, cor)
    const largura = folha.larguraUtil - xDoTexto - 4 - larguraDaEtiqueta
    const texto = quebrarTexto(doc, alt.texto || '', largura)
    const altura = Math.max(texto.length, 1) * entrelinha + 2 * respiroVertical

    return {
      altura,
      realce: destaque ? 'verde' : alt.estado === 'errada' ? 'erro' : undefined,
      desenhar: (x, y, larguraDoGrupo) => {
        const meioDaPrimeira = y + respiroVertical + entrelinha / 2
        const bolha =
          alt.estado === 'certa' ? 'certa' : alt.estado === 'errada' ? 'errada' : alt.estado === 'marcada' ? 'cheia' : 'vazia'
        desenharBolha(doc, alt.letra, x + 6, meioDaPrimeira, bolha)
        fonte(doc, estilo, corpo, cor)
        texto.forEach((linha, n) => {
          fonte(doc, estilo, corpo, cor)
          desenharLinhaRica(doc, folha.fonte, linha, x + xDoTexto, y + respiroVertical + n * entrelinha + baseDaLinha(entrelinha, corpo), estilo)
        })
        if (alt.etiqueta) {
          desenharPilula(doc, alt.etiqueta, x + larguraDoGrupo - 3, meioDaPrimeira, {
            tom: alt.estado === 'errada' ? 'erro' : alt.estado === 'certa' ? 'verde' : 'claro',
            corpo: 7,
            altura: 5,
            alinhar: 'direita',
          })
        }
      },
    }
  })

  // As alternativas de uma questão andam juntas: se o bloco inteiro cabe numa
  // página e não cabe no que resta desta, ele começa na seguinte. Partir
  // A–B aqui e C–E lá obriga o aluno a virar a folha no meio da escolha.
  const total = linhas.reduce((soma, linha) => soma + linha.altura, 0) + 3.2
  if (total <= 110 && folha.y + total > folha.limite) novaPagina(folha)
  desenharGrupo(folha, linhas, { recuoDoFio: xDoTexto, depois: 3 })
}

// ── Linhas para escrever ─────────────────────────────────────────

/**
 * O espaço da resposta discursiva: um cartão com pautas.
 *
 * Só começa nesta página se couberem pelo menos quatro pautas — abaixo disso
 * o espaço no pé da folha não serve para escrever nada, e o rótulo ficava
 * sozinho com uma ou duas linhas.
 */
export function desenharPautas(folha: Folha, quantidade: number, titulo?: string): void {
  const { doc } = folha
  const altura = 8
  const minimo = Math.min(4, quantidade)
  if (folha.y + (titulo ? 6.5 : 0) + minimo * altura + 4 > folha.limite) novaPagina(folha)
  const pautas: LinhaDoGrupo[] = Array.from({ length: quantidade }, () => ({
    altura,
    desenhar: (x, y, largura) => {
      doc.setDrawColor(196, 210, 201)
      doc.setLineWidth(0.25)
      doc.line(x + 5, y + altura - 1, x + largura - 5, y + altura - 1)
    },
  }))
  desenharGrupo(folha, pautas, { semFios: true, respiro: 2, titulo, depois: 3 })
}

// ── Números em destaque ──────────────────────────────────────────

/**
 * Uma fileira de cartões com um número grande e o que ele mede embaixo.
 *
 * O número encolhe para caber no cartão em vez de passar da borda — "1000
 * pontos (TRI)" num cartão de um terço da folha, por exemplo.
 */
export function desenharNumeros(
  folha: Folha,
  numeros: { valor: string; rotulo: string; tom?: 'claro' | 'verde' | 'laranja' }[],
): void {
  if (numeros.length === 0) return
  const { doc } = folha
  const altura = 19
  const espaco = 3.5
  garantirEspaco(folha, altura + 2)
  const largura = (folha.larguraUtil - espaco * (numeros.length - 1)) / numeros.length
  numeros.forEach((n, i) => {
    const x = folha.margem + i * (largura + espaco)
    desenharVidro(doc, x, folha.y, largura, altura, { tom: n.tom ?? 'claro', raio: 3.6 })
    let corpo = 16
    fonte(doc, 'bold', corpo, n.tom === 'laranja' ? [120, 62, 0] : FLORESTA)
    while (corpo > 9 && doc.getTextWidth(sanitizarParaPdf(n.valor)) > largura - 9) {
      corpo -= 0.5
      doc.setFontSize(corpo)
    }
    doc.text(encurtarParaLargura(doc, n.valor, largura - 9), x + 4.5, folha.y + 9.6)
    fonte(doc, 'normal', 7.6, TINTA_SUAVE)
    doc.text(encurtarParaLargura(doc, n.rotulo, largura - 9), x + 4.5, folha.y + 15)
  })
  folha.y += altura + 6
  fonte(doc, 'normal', 10, TINTA)
}

// ── Lista de itens (instruções, dados) ───────────────────────────

/**
 * Itens de texto num grupo, cada um com um ponto laranja desenhado — o
 * marcador é vetor, não um `•` que depende do glifo da fonte.
 */
export function desenharListaDeItens(
  folha: Folha,
  itens: string[],
  opcoes: { titulo?: string; corpo?: number } = {},
): void {
  const { doc } = folha
  const corpo = opcoes.corpo ?? 9.2
  const entrelinha = corpo * 0.52
  const respiro = 2
  const linhas: LinhaDoGrupo[] = itens.map((item) => {
    fonte(doc, 'normal', corpo, TINTA)
    const texto = quebrarTexto(doc, item, folha.larguraUtil - 14)
    return {
      altura: texto.length * entrelinha + 2 * respiro,
      desenhar: (x, y) => {
        doc.setFillColor(LARANJA[0], LARANJA[1], LARANJA[2])
        doc.circle(x + 5.5, y + respiro + entrelinha / 2, 0.9, 'F')
        texto.forEach((linha, n) => {
          fonte(doc, 'normal', corpo, TINTA)
          desenharLinhaRica(doc, folha.fonte, linha, x + 9.5, y + respiro + n * entrelinha + baseDaLinha(entrelinha, corpo))
        })
      },
    }
  })
  desenharGrupo(folha, linhas, { titulo: opcoes.titulo, recuoDoFio: 9.5, depois: 4 })
}

/**
 * Pares "rótulo — valor" num grupo: os dados do aluno, do documento.
 * O valor quebra em várias linhas se precisar, sem invadir o rótulo.
 */
export function desenharPares(
  folha: Folha,
  pares: { rotulo: string; valor: string }[],
  opcoes: { titulo?: string; larguraDoRotulo?: number } = {},
): void {
  const { doc } = folha
  const larguraDoRotulo = opcoes.larguraDoRotulo ?? 34
  const entrelinha = 4.8
  const respiro = 2.2
  const linhas: LinhaDoGrupo[] = pares.map((par) => {
    fonte(doc, 'bold', 9, TINTA)
    const valor = quebrarComLimite(doc, par.valor || '—', folha.larguraUtil - larguraDoRotulo - 10, 4)
    return {
      altura: Math.max(1, valor.length) * entrelinha + 2 * respiro,
      desenhar: (x, y) => {
        fonte(doc, 'normal', 8.5, TINTA_SUAVE)
        doc.text(encurtarParaLargura(doc, par.rotulo, larguraDoRotulo - 2), x + 4.5, y + respiro + baseDaLinha(entrelinha, 8.5))
        fonte(doc, 'bold', 9, TINTA)
        valor.forEach((linha, n) => {
          doc.text(linha, x + 4.5 + larguraDoRotulo, y + respiro + n * entrelinha + baseDaLinha(entrelinha, 9))
        })
      },
    }
  })
  desenharGrupo(folha, linhas, { titulo: opcoes.titulo, recuoDoFio: 4.5, depois: 4 })
}

/** Um título de seção solto (sem grupo embaixo). */
export function desenharTituloDeSecao(folha: Folha, texto: string, reserva = 20): void {
  garantirEspaco(folha, 8 + reserva)
  desenharTituloDeGrupo(folha.doc, texto, folha.margem + 1, folha.y + 3.6, folha.larguraUtil - 1)
  folha.y += 7
}

/** Um aviso em itálico discreto, quebrado na largura. */
export function escreverNota(folha: Folha, texto: string, opcoes: { recuo?: number; depois?: number } = {}): void {
  escreverTexto(folha, texto, {
    corpo: 8.8,
    estilo: 'italic',
    cor: TINTA_SUAVE,
    entrelinha: 4.6,
    recuo: opcoes.recuo,
    depois: opcoes.depois ?? 3,
  })
}

