import jsPDF from 'jspdf'
import {
  questaoMaisAcertadaDaTurma,
  questaoMaisErradaDaTurma,
} from '@/lib/provas/analise-da-turma'
import {
  ERRO,
  FIO,
  FLORESTA,
  LARANJA,
  TINTA,
  TINTA_FRACA,
  TINTA_SUAVE,
  VERDE,
  carregarLogo,
  desenharCabecalho,
  desenharRodape,
  desenharVidro,
  encurtarParaLargura,
  fonte as ligarFonte,
  registrarFontes,
  sanitizarParaPdf,
} from './marca'
import { type Folha, baseDaLinha, desenharCartaoDeTitulo } from './folha'
import { carregarImagens, type ImagemParaPdf } from './imagens'
import { desenharImagensNoPdf } from './imagens-de-questao'
import { fatiarCaixaEmPaginas } from './paginacao'
import { desenharLinhaRica, quebrarTexto } from './texto'
import {
  type ImagemDeQuestao,
  type LayoutDeImagens,
  layoutDeImagens,
  reunirImagens,
} from '@/lib/questoes/imagens'

/**
 * O PDF de análise da prova — o que o professor manda para a turma depois.
 *
 * ## O que não existia
 *
 * Terminada a prova, o admin tinha três telas e nenhum documento: o relatório
 * ao vivo (`/admin/exams/[id]/relatorio`), o ranking público e o relatório
 * individual de cada aluno. Para "fechar" a prova com a turma — mandar no
 * grupo o desempenho geral, dizer qual questão derrubou todo mundo e por quê —
 * o caminho era print de tela, um por seção.
 *
 * Este arquivo produz esse documento. E produz **sob medida**: cada seção é
 * opcional, porque a mesma prova rende relatórios diferentes conforme a turma.
 * Uma classificação com nomes é combustível numa turma que compete e é
 * constrangimento numa turma pequena; a questão mais errada com a resposta
 * comentada é uma aula, mas só se o professor quiser abrir o gabarito agora.
 * Quem decide é quem conhece a turma — por isso a configuração, e não um
 * relatório fixo.
 *
 * ## A regra de composição
 *
 * Nada aqui inventa dado. Seção sem número não é impressa como "0" nem como
 * uma caixa vazia: ela simplesmente não entra, e o documento fecha sem buraco.
 * Uma prova sem entregas gera um PDF de capa e nada mais — que é a informação
 * correta.
 */

// ── O que entra no documento ─────────────────────────────────────

export interface DetalheDeQuestao {
  enunciado: boolean
  imagem: boolean
  respostaComentada: boolean
}

export interface OpcoesDaAnalise {
  /** Capa com imagem, título e descrição da prova. */
  capa: boolean
  /** Números gerais: participantes, média, mediana, extremos, distribuição. */
  resultadosGerais: boolean
  classificacao: {
    incluir: boolean
    /** Quantos colocados imprimir. */
    top: number
    /** Nome de cada um, ou só a posição. */
    comNome: boolean
    /** "acertou 14 de 20" ao lado da nota. */
    comAcertos: boolean
  }
  /** Destaque de quem foi melhor. */
  maiorNota: boolean
  /** Média de acertos por aluno nas objetivas. */
  mediaDeAcertos: boolean
  questaoMaisErrada: { incluir: boolean } & DetalheDeQuestao
  questaoMaisAcertada: { incluir: boolean } & DetalheDeQuestao
  /** Quanto a turma levou, em horas e minutos. */
  tempoMedio: boolean
  /** Uma linha do professor, impressa logo abaixo da capa. */
  recado: string
}

export const OPCOES_PADRAO: OpcoesDaAnalise = {
  capa: true,
  resultadosGerais: true,
  classificacao: { incluir: true, top: 10, comNome: true, comAcertos: true },
  maiorNota: true,
  mediaDeAcertos: true,
  // As duas questões em destaque nascem COM o enunciado e a imagem, e SEM a
  // resposta comentada: mostrar qual questão derrubou a turma é o ponto do
  // relatório; abrir o comentário dela é uma decisão de gabarito, e essa o
  // professor toma de propósito.
  questaoMaisErrada: { incluir: true, enunciado: true, imagem: true, respostaComentada: false },
  questaoMaisAcertada: { incluir: true, enunciado: true, imagem: true, respostaComentada: false },
  tempoMedio: true,
  recado: '',
}

// ── Os dados que a rota do relatório devolve ─────────────────────

export interface DadosDaAnalise {
  prova: {
    id: string
    title: string
    description?: string | null
    coverImage?: string | null
    notaMaxima: number
    scoringMethod?: string
    numberOfQuestions?: number
    totalPoints?: number | null
    startTime?: string | Date
    endTime?: string | Date
    publico?: { rotulo?: string }
  }
  presenca: { convocados: number | null; presentes: number; entregaram: number }
  notas: {
    total: number
    media: number | null
    mediana: number | null
    maior: number | null
    menor: number | null
    distribuicao: { rotulo: string; quantidade: number }[]
  }
  tempos?: {
    comRegistro: number
    media: number | null
    mediana: number | null
    menor: number | null
    maior: number | null
    duracaoDaProva: number | null
  }
  questoes: {
    questionId: string
    number: number
    type: string
    enunciadoCompleto?: string
    enunciado?: string
    comando?: string | null
    imageUrl?: string | null
    imageSource?: string | null
    /** Ver `lib/questoes/imagens.ts`. Ausente = só a imagem única de antes. */
    imagens?: ImagemDeQuestao[]
    layoutImagens?: LayoutDeImagens
    imagensDaResposta?: ImagemDeQuestao[]
    layoutImagensDaResposta?: LayoutDeImagens
    respostaComentada?: string | null
    respondidas: number
    acertos: number
    percentualDeAcerto: number | null
    porAlternativa: { id: string; letter: string; text?: string; isCorrect: boolean; escolhas: number }[]
    emBranco: number
  }[]
  participantes: {
    userId: string
    userName: string
    score: number | null
    acertos?: number
    duracaoMin?: number | null
  }[]
}

// ── Formatação ───────────────────────────────────────────────────

/**
 * Minutos em algo que se lê de relance.
 *
 * "107 min" obriga quem lê a dividir por 60 na cabeça; "1h 47min" já chegou
 * pronto. Abaixo de uma hora a hora não aparece, e o zero de "2h 00min" vira
 * "2h" — um zero que não informa nada é ruído.
 */
export function formatarDuracao(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined || !Number.isFinite(minutos)) return '—'
  const total = Math.max(0, Math.round(minutos))
  if (total < 60) return `${total} min`
  const horas = Math.floor(total / 60)
  const resto = total % 60
  return resto === 0 ? `${horas}h` : `${horas}h ${String(resto).padStart(2, '0')}min`
}

function numeroCurto(valor: number | null | undefined, casas = 1): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—'
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(casas).replace('.', ',')
}

function dataCurta(valor?: string | Date | null): string {
  if (!valor) return '—'
  const d = new Date(valor)
  if (!Number.isFinite(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── O documento ──────────────────────────────────────────────────

const MARGEM = 18
const LEGENDA_DO_RODAPE = 'Análise da prova'

/**
 * O estado de desenho que atravessa as seções.
 *
 * Um objeto em vez de meia dúzia de variáveis soltas porque `y` é mutável e
 * atravessa todas as funções: passá-lo como parâmetro e devolvê-lo em cada
 * chamada foi a versão que mais errou de lugar nos geradores antigos.
 */
interface Pincel {
  doc: jsPDF
  largura: number
  altura: number
  y: number
  fonte: string
  logo: string | null
  imagens: Map<string, ImagemParaPdf>
}

/**
 * Onde o conteúdo recomeça numa página nova.
 *
 * `desenharCabecalho` tem altura fixa e sempre devolve este valor; a constante
 * existe para o fatiamento de caixas altas poder PREVER a coordenada antes de
 * a página existir (ver `fatiarCaixaEmPaginas`).
 */
const Y_APOS_CABECALHO = 40

function novaPagina(p: Pincel, subtitulo: string) {
  p.doc.addPage()
  p.y = desenharCabecalho(p.doc, p.largura, MARGEM, subtitulo, p.logo)
}

function garantirEspaco(p: Pincel, necessario: number, subtitulo: string) {
  if (p.y + necessario > p.altura - 26) novaPagina(p, subtitulo)
}

/**
 * O pincel visto como uma folha, para os componentes de `lib/pdf/folha.ts`.
 * Quem chama devolve o `y` ao pincel depois (`p.y = folha.y`).
 */
function comoFolha(p: Pincel, subtitulo: string): Folha {
  return {
    doc: p.doc,
    fonte: p.fonte,
    largura: p.largura,
    altura: p.altura,
    margem: MARGEM,
    larguraUtil: p.largura - 2 * MARGEM,
    limite: p.altura - 26,
    y: p.y,
    subtitulo,
    logo: p.logo,
  }
}

/**
 * A quebra é a compartilhada (`lib/pdf/texto.ts`), não uma cópia local.
 *
 * A cópia que havia aqui media o texto COM os `**` — que não são desenhados —
 * e quebrava o negrito no meio, deixando o marcador de abertura numa linha e o
 * de fechamento na outra. `desenharLinhaRica`, que desenha estas linhas, não
 * casava nem um nem outro: a resposta comentada saía com os asteriscos à
 * mostra. E os escapes (`\\"`) que o comentário traz do modelo iam para o papel
 * como barras soltas.
 */
function quebrar(p: Pincel, texto: string, larguraMax: number): string[] {
  return quebrarTexto(p.doc, texto || '', larguraMax)
}

/**
 * O título de uma seção: o texto em verde-escuro, um ponto laranja na frente
 * e um fio que corre até a margem. A tarja verde sólida de antes pesava mais
 * que o conteúdo embaixo dela.
 */
function tituloDeSecao(p: Pincel, texto: string, subtitulo: string) {
  garantirEspaco(p, 30, subtitulo)
  p.y += 2
  p.doc.setFillColor(...LARANJA)
  p.doc.circle(MARGEM + 1.4, p.y + 4, 1.4, 'F')
  ligarFonte(p.doc, 'bold', 13, FLORESTA)
  const conteudo = encurtarParaLargura(p.doc, texto, p.largura - 2 * MARGEM - 20)
  p.doc.text(conteudo, MARGEM + 5, p.y + 5.6)
  const fim = MARGEM + 5 + p.doc.getTextWidth(conteudo) + 4
  p.doc.setDrawColor(...FIO)
  p.doc.setLineWidth(0.3)
  p.doc.line(fim, p.y + 3.9, p.largura - MARGEM, p.y + 3.9)
  ligarFonte(p.doc, 'normal', 10, TINTA)
  p.y += 13
}

/** Um cartão de número: rótulo pequeno em cima, valor grande embaixo. */
function cartaoDeNumero(
  p: Pincel,
  x: number,
  y: number,
  largura: number,
  rotulo: string,
  valor: string,
  destaque = false,
) {
  const altura = 20
  desenharVidro(p.doc, x, y, largura, altura, { tom: destaque ? 'laranja' : 'claro', raio: 3.6 })

  // O valor encolhe para caber no cartão em vez de passar da borda.
  let corpo = 15
  ligarFonte(p.doc, 'bold', corpo, destaque ? [120, 62, 0] : FLORESTA)
  while (corpo > 9 && p.doc.getTextWidth(sanitizarParaPdf(valor)) > largura - 6) {
    corpo -= 0.5
    p.doc.setFontSize(corpo)
  }
  p.doc.text(encurtarParaLargura(p.doc, valor, largura - 6), x + largura / 2, y + 10, { align: 'center' })

  ligarFonte(p.doc, 'normal', 7.4, TINTA_SUAVE)
  p.doc.text(encurtarParaLargura(p.doc, rotulo, largura - 6), x + largura / 2, y + 15.6, { align: 'center' })

  ligarFonte(p.doc, 'normal', 10, TINTA)
}

/** Uma fileira de cartões que se dividem a largura útil. */
function fileiraDeNumeros(
  p: Pincel,
  itens: { rotulo: string; valor: string; destaque?: boolean }[],
  subtitulo: string,
) {
  if (itens.length === 0) return
  garantirEspaco(p, 26, subtitulo)
  const util = p.largura - 2 * MARGEM
  const vao = 3.5
  const largura = (util - vao * (itens.length - 1)) / itens.length
  itens.forEach((item, i) => {
    cartaoDeNumero(p, MARGEM + i * (largura + vao), p.y, largura, item.rotulo, item.valor, item.destaque)
  })
  p.y += 26
}

/** Uma barra horizontal rotulada — a forma da turma, e a das alternativas. */
function barra(
  p: Pincel,
  rotulo: string,
  quantidade: number,
  total: number,
  cor: readonly [number, number, number],
  sufixo?: string,
) {
  const larguraDoRotulo = 26
  const larguraDaBarra = p.largura - 2 * MARGEM - larguraDoRotulo - 26
  const proporcao = total > 0 ? quantidade / total : 0

  ligarFonte(p.doc, 'normal', 8, TINTA_SUAVE)
  p.doc.text(encurtarParaLargura(p.doc, rotulo, larguraDoRotulo - 3), MARGEM + larguraDoRotulo - 2.5, p.y + 3.9, { align: 'right' })

  // Cápsulas, como as barras de progresso do iOS.
  p.doc.setFillColor(229, 236, 231)
  p.doc.roundedRect(MARGEM + larguraDoRotulo, p.y, larguraDaBarra, 5.5, 2.75, 2.75, 'F')

  // Largura mínima visível: uma barra de 1 aluno em 200 seria invisível, e
  // "invisível" e "zero" precisam ser distinguíveis à primeira vista.
  const preenchida = quantidade > 0 ? Math.max(larguraDaBarra * proporcao, 1.6) : 0
  if (preenchida > 0) {
    p.doc.setFillColor(cor[0], cor[1], cor[2])
    const raio = Math.min(2.75, preenchida / 2)
    p.doc.roundedRect(MARGEM + larguraDoRotulo, p.y, preenchida, 5.5, raio, raio, 'F')
  }

  ligarFonte(p.doc, 'bold', 8, TINTA)
  p.doc.text(
    sanitizarParaPdf(sufixo ?? String(quantidade)),
    MARGEM + larguraDoRotulo + larguraDaBarra + 3,
    p.y + 3.6,
  )
  ligarFonte(p.doc, 'normal', 10, TINTA)
  p.y += 8
}

// ── Seções ───────────────────────────────────────────────────────

function desenharCapa(p: Pincel, dados: DadosDaAnalise, recado: string) {
  const { prova } = dados
  const util = p.largura - 2 * MARGEM

  p.y = desenharCabecalho(p.doc, p.largura, MARGEM, 'Análise da prova', p.logo)

  // A capa da prova, quando ela tem uma. Uma faixa em vez da imagem inteira:
  // capas são retratos, paisagens e prints em proporções imprevisíveis, e o
  // recorte constante é o que mantém a primeira página com a mesma cara.
  const capa = prova.coverImage ? p.imagens.get(prova.coverImage) : null
  if (capa) {
    const alturaDaFaixa = 52
    // Cobre a faixa inteira (como `object-fit: cover`) e o recorte arredonda
    // os cantos. O recorte antigo era `roundedRect(...)` sem estilo — que
    // PINTA o contorno em vez de criar o caminho —, então o `clip` não
    // recortava nada e uma capa alta cobria o cabeçalho e o título.
    const escala = Math.max(util / capa.width, alturaDaFaixa / capa.height)
    const largura = capa.width * escala
    const altura = capa.height * escala
    desenharVidro(p.doc, MARGEM - 1, p.y - 1, util + 2, alturaDaFaixa + 2, { raio: 5, opacidade: 0.96 })
    try {
      p.doc.saveGraphicsState()
      p.doc.roundedRect(MARGEM, p.y, util, alturaDaFaixa, 4, 4, null)
      p.doc.clip()
      p.doc.discardPath()
      p.doc.addImage(
        capa.dataUrl,
        'JPEG',
        MARGEM + (util - largura) / 2,
        p.y + (alturaDaFaixa - altura) / 2,
        largura,
        altura,
      )
    } catch {
      /* segue sem capa */
    } finally {
      p.doc.restoreGraphicsState()
    }
    p.y += alturaDaFaixa + 7
  }

  // Ficha técnica, como pílulas do cartão de título.
  const fichas: string[] = [
    `${prova.numberOfQuestions ?? dados.questoes.length} questões`,
    prova.scoringMethod === 'tri' ? 'TRI · 1000 pts' : `${prova.notaMaxima} pontos`,
    `Aplicada em ${dataCurta(prova.startTime)}`,
  ]
  if (prova.publico?.rotulo) fichas.push(prova.publico.rotulo)

  const folha = comoFolha(p, 'Análise da prova')
  desenharCartaoDeTitulo(folha, { titulo: prova.title, descricao: prova.description, chips: fichas })
  p.y = folha.y

  if (recado.trim()) {
    // O recado do professor, num vidro pêssego com aspas laranja.
    ligarFonte(p.doc, 'italic', 10, TINTA)
    const linhas = quebrar(p, recado.trim(), util - 20)
    const alturaDaCaixa = linhas.length * 5.4 + 10
    garantirEspaco(p, alturaDaCaixa + 6, 'Análise da prova')
    desenharVidro(p.doc, MARGEM, p.y, util, alturaDaCaixa, { tom: 'laranja', raio: 3.6 })
    ligarFonte(p.doc, 'bold', 24, LARANJA)
    p.doc.text('\u201C', MARGEM + 4, p.y + 12)
    let recadoY = p.y + 5 + baseDaLinha(5.4, 10)
    linhas.forEach((linha) => {
      ligarFonte(p.doc, 'italic', 10, TINTA)
      desenharLinhaRica(p.doc, p.fonte, linha, MARGEM + 13, recadoY, 'italic')
      recadoY += 5.4
    })
    ligarFonte(p.doc, 'normal', 10, TINTA)
    p.y += alturaDaCaixa + 7
  }
}

function desenharResultadosGerais(p: Pincel, dados: DadosDaAnalise) {
  const { notas, presenca, prova } = dados
  tituloDeSecao(p, 'Resultados gerais', 'Resultados gerais')

  fileiraDeNumeros(
    p,
    [
      { rotulo: 'Entregaram', valor: String(presenca.entregaram) },
      { rotulo: 'Média', valor: numeroCurto(notas.media), destaque: true },
      { rotulo: 'Mediana', valor: numeroCurto(notas.mediana) },
      { rotulo: 'Menor nota', valor: numeroCurto(notas.menor) },
    ],
    'Resultados gerais',
  )

  const aproveitamento =
    notas.media !== null && prova.notaMaxima > 0 ? (notas.media / prova.notaMaxima) * 100 : null

  if (aproveitamento !== null) {
    ligarFonte(p.doc, 'normal', 9, TINTA_SUAVE)
    quebrar(
      p,
      `A turma aproveitou **${aproveitamento.toFixed(0)}%** da prova — média de ${numeroCurto(notas.media)} de ${prova.notaMaxima} pontos.`,
      p.largura - 2 * MARGEM,
    ).forEach((linha) => {
      ligarFonte(p.doc, 'normal', 9, TINTA_SUAVE)
      desenharLinhaRica(p.doc, p.fonte, linha, MARGEM, p.y + 1)
      p.y += 4.8
    })
    p.y += 5
  }

  const totalNaDistribuicao = notas.distribuicao.reduce((a, f) => a + f.quantidade, 0)
  if (totalNaDistribuicao > 0) {
    garantirEspaco(p, 20 + notas.distribuicao.length * 8, 'Resultados gerais')
    ligarFonte(p.doc, 'bold', 9.5, FLORESTA)
    p.doc.text('Distribuição das notas', MARGEM, p.y + 1)
    p.y += 7

    notas.distribuicao.forEach((faixa) => {
      const pct = totalNaDistribuicao > 0 ? Math.round((faixa.quantidade / totalNaDistribuicao) * 100) : 0
      barra(
        p,
        faixa.rotulo,
        faixa.quantidade,
        totalNaDistribuicao,
        VERDE,
        `${faixa.quantidade}  (${pct}%)`,
      )
    })
    p.y += 4
  }
}

function desenharDestaquesDeNota(
  p: Pincel,
  dados: DadosDaAnalise,
  opcoes: OpcoesDaAnalise,
) {
  const itens: { rotulo: string; valor: string; destaque?: boolean }[] = []

  if (opcoes.maiorNota && dados.notas.maior !== null) {
    itens.push({ rotulo: 'Maior nota', valor: numeroCurto(dados.notas.maior), destaque: true })
  }

  if (opcoes.mediaDeAcertos) {
    const comAcertos = dados.participantes.filter((a) => typeof a.acertos === 'number')
    const objetivas = dados.questoes.filter((q) => q.type === 'multiple-choice').length
    if (comAcertos.length > 0 && objetivas > 0) {
      const media = comAcertos.reduce((a, b) => a + (b.acertos || 0), 0) / comAcertos.length
      itens.push({ rotulo: 'Média de acertos', valor: `${numeroCurto(media)} de ${objetivas}` })
    }
  }

  if (opcoes.tempoMedio && dados.tempos && dados.tempos.comRegistro > 0) {
    itens.push({ rotulo: 'Tempo médio', valor: formatarDuracao(dados.tempos.media) })
    itens.push({ rotulo: 'Mais rápido', valor: formatarDuracao(dados.tempos.menor) })
  }

  if (itens.length === 0) return

  // Em quatro por fileira o cartão fica largo o suficiente para o valor não
  // encostar na borda; acima disso a fileira quebra em duas.
  for (let i = 0; i < itens.length; i += 4) {
    fileiraDeNumeros(p, itens.slice(i, i + 4), 'Destaques')
  }

  if (opcoes.tempoMedio && dados.tempos && dados.tempos.comRegistro > 0) {
    const daProva = dados.tempos.duracaoDaProva
      ? ` A prova tinha ${formatarDuracao(dados.tempos.duracaoDaProva)}.`
      : ''
    // Quebrada na largura: numa linha só, esta frase passava da margem.
    ligarFonte(p.doc, 'normal', 8, TINTA_FRACA)
    quebrar(
      p,
      `Tempo medido em ${dados.tempos.comRegistro} ${dados.tempos.comRegistro === 1 ? 'entrega' : 'entregas'} com início registrado · mediana ${formatarDuracao(dados.tempos.mediana)} · mais demorada ${formatarDuracao(dados.tempos.maior)}.${daProva}`,
      p.largura - 2 * MARGEM,
    ).forEach((linha) => {
      p.doc.text(linha, MARGEM, p.y)
      p.y += 4.2
    })
    p.y += 5
    ligarFonte(p.doc, 'normal', 10, TINTA)
  }
}

function desenharClassificacao(p: Pincel, dados: DadosDaAnalise, opcoes: OpcoesDaAnalise) {
  const config = opcoes.classificacao
  const comNota = dados.participantes.filter((a) => typeof a.score === 'number')
  if (comNota.length === 0) return

  const ordenados = [...comNota].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const top = ordenados.slice(0, Math.max(1, config.top))

  tituloDeSecao(p, `Classificação — top ${top.length}`, 'Classificação')

  const objetivas = dados.questoes.filter((q) => q.type === 'multiple-choice').length
  const util = p.largura - 2 * MARGEM

  top.forEach((aluno, i) => {
    garantirEspaco(p, 12, 'Classificação')
    const posicao = ordenados.filter((o) => (o.score ?? 0) > (aluno.score ?? 0)).length + 1
    const noPodio = posicao <= 3
    const proporcao = dados.prova.notaMaxima > 0 ? (aluno.score ?? 0) / dados.prova.notaMaxima : 0

    // A barra de fundo dá a nota sem exigir a leitura do número — e mostra a
    // distância entre o primeiro e o décimo, que a lista sozinha esconde.
    desenharVidro(p.doc, MARGEM, p.y, util, 9.5, { raio: 4.75, sombra: noPodio, tom: 'claro' })
    if (proporcao > 0) {
      const preenchida = Math.max(util * Math.min(proporcao, 1), 9.5)
      p.doc.setFillColor(noPodio ? 214 : 233, noPodio ? 238 : 240, noPodio ? 222 : 235)
      p.doc.roundedRect(MARGEM, p.y, preenchida, 9.5, 4.75, 4.75, 'F')
    }

    // Medalha dos três primeiros: o único lugar do documento em que a cor
    // significa colocação, e não certo/errado.
    if (noPodio) {
      const medalha: [number, number, number] =
        posicao === 1 ? [232, 150, 30] : posicao === 2 ? [150, 156, 162] : [170, 112, 64]
      p.doc.setFillColor(...medalha)
      p.doc.circle(MARGEM + 6, p.y + 4.75, 3.2, 'F')
      p.doc.setTextColor(255, 255, 255)
      p.doc.setFontSize(7)
      p.doc.setFont(p.fonte, 'bold')
      p.doc.text(String(posicao), MARGEM + 6, p.y + 6.3, { align: 'center' })
    } else {
      ligarFonte(p.doc, 'bold', 8.5, TINTA_SUAVE)
      p.doc.text(`${posicao}º`, MARGEM + 6, p.y + 6.3, { align: 'center' })
    }

    // A direita primeiro: a nota e os acertos têm largura fixa, e o nome
    // encurta para o que sobrar — um nome completo de seis sobrenomes
    // passava por baixo dos acertos.
    let direitaX = p.largura - MARGEM - 4
    ligarFonte(p.doc, 'bold', 9.5, FLORESTA)
    const nota = sanitizarParaPdf(`${numeroCurto(aluno.score)} / ${dados.prova.notaMaxima}`)
    p.doc.text(nota, direitaX, p.y + 6.3, { align: 'right' })
    direitaX -= p.doc.getTextWidth(nota) + 6

    if (config.comAcertos && typeof aluno.acertos === 'number' && objetivas > 0) {
      ligarFonte(p.doc, 'normal', 8, TINTA_SUAVE)
      const acertos = sanitizarParaPdf(`${aluno.acertos}/${objetivas} acertos`)
      p.doc.text(acertos, direitaX, p.y + 6.3, { align: 'right' })
      direitaX -= p.doc.getTextWidth(acertos) + 5
    }

    // Sem nome, a lista vira a forma da turma sem expor ninguém — o mesmo
    // relatório serve às duas escolhas do professor.
    const nome = config.comNome ? aluno.userName : `Participante ${i + 1}`
    ligarFonte(p.doc, noPodio ? 'bold' : 'normal', 9.5, TINTA)
    p.doc.text(encurtarParaLargura(p.doc, nome, direitaX - (MARGEM + 13)), MARGEM + 13, p.y + 6.3)

    ligarFonte(p.doc, 'normal', 10, TINTA)
    p.y += 11
  })

  if (ordenados.length > top.length) {
    ligarFonte(p.doc, 'normal', 8, TINTA_FRACA)
    p.doc.text(
      sanitizarParaPdf(`+ ${ordenados.length - top.length} participantes fora do top ${top.length}.`),
      MARGEM,
      p.y + 2,
    )
    ligarFonte(p.doc, 'normal', 10, TINTA)
    p.y += 8
  }
  p.y += 3
}

function desenharQuestaoEmDestaque(
  p: Pincel,
  dados: DadosDaAnalise,
  questao: DadosDaAnalise['questoes'][number],
  titulo: string,
  detalhe: DetalheDeQuestao,
  tom: 'erro' | 'acerto',
) {
  const util = p.largura - 2 * MARGEM
  tituloDeSecao(p, titulo, titulo)

  const cor: readonly [number, number, number] = tom === 'erro' ? ERRO : VERDE
  const pct = questao.percentualDeAcerto

  // Cabeçalho da questão: número + índice de acerto
  garantirEspaco(p, 20, titulo)
  desenharVidro(p.doc, MARGEM, p.y, util, 14, { tom: tom === 'erro' ? 'erro' : 'verde', raio: 7 })
  ligarFonte(p.doc, 'bold', 10, cor)
  p.doc.text(sanitizarParaPdf(`Questão ${questao.number}`), MARGEM + 6, p.y + 9)
  p.doc.text(
    sanitizarParaPdf(
      pct === null
        ? `${questao.respondidas} respostas`
        : `${pct.toFixed(0)}% de acerto · ${questao.acertos} de ${questao.respondidas}`,
    ),
    p.largura - MARGEM - 6,
    p.y + 9,
    { align: 'right' },
  )
  ligarFonte(p.doc, 'normal', 10, TINTA)
  p.y += 20

  // `desenharLinhaRica` e não `doc.text`: o enunciado vem com `**negrito**`, e
  // o texto direto imprimia os asteriscos.
  if (detalhe.enunciado && (questao.enunciadoCompleto || questao.enunciado)) {
    ligarFonte(p.doc, 'normal', 9.5, TINTA)
    quebrar(p, questao.enunciadoCompleto || questao.enunciado || '', util).forEach((linha) => {
      garantirEspaco(p, 8, titulo)
      ligarFonte(p.doc, 'normal', 9.5, TINTA)
      desenharLinhaRica(p.doc, p.fonte, linha, MARGEM, p.y)
      p.y += 5.3
    })
    p.y += 3

    if (questao.comando) {
      ligarFonte(p.doc, 'bold', 9.5, FLORESTA)
      quebrar(p, questao.comando, util).forEach((linha) => {
        garantirEspaco(p, 8, titulo)
        ligarFonte(p.doc, 'bold', 9.5, FLORESTA)
        desenharLinhaRica(p.doc, p.fonte, linha, MARGEM, p.y, 'bold')
        p.y += 5.3
      })
      ligarFonte(p.doc, 'normal', 10, TINTA)
      p.y += 3
    }
  }

  if (detalhe.imagem) {
    // Todas as imagens do enunciado, no tamanho e no arranjo configurados na
    // questão — a versão anterior imprimia só a primeira, centrada e sempre do
    // mesmo tamanho.
    p.y = desenharImagensNoPdf(
      p.doc,
      reunirImagens(questao.imagens, questao.imageUrl, questao.imageSource),
      layoutDeImagens(questao.layoutImagens),
      p.imagens,
      {
        x: MARGEM + 1,
        largura: util - 2,
        y: p.y,
        limiteY: p.altura - 27,
        alturaMaxima: 82,
        fonte: p.fonte,
        novaPagina: () => {
          novaPagina(p, titulo)
          return p.y
        },
      },
    )
    ligarFonte(p.doc, 'normal', 10, TINTA)
  }

  // Como a turma se dividiu entre as alternativas — o dado que separa "a turma
  // não estudou" de "a questão está mal escrita": quando 60% escolhem a MESMA
  // alternativa errada, o problema costuma ser o enunciado.
  if (questao.porAlternativa.length > 0) {
    const totalDeEscolhas = questao.porAlternativa.reduce((a, b) => a + b.escolhas, 0)
    garantirEspaco(p, 14 + questao.porAlternativa.length * 8, titulo)
    ligarFonte(p.doc, 'bold', 9.5, FLORESTA)
    p.doc.text('Como a turma respondeu', MARGEM, p.y + 1)
    ligarFonte(p.doc, 'normal', 10, TINTA)
    p.y += 7

    questao.porAlternativa.forEach((alt) => {
      const pctAlt = totalDeEscolhas > 0 ? Math.round((alt.escolhas / totalDeEscolhas) * 100) : 0
      barra(
        p,
        `${alt.letter})${alt.isCorrect ? ' ✓' : ''}`,
        alt.escolhas,
        totalDeEscolhas || 1,
        alt.isCorrect ? VERDE : [214, 104, 94],
        `${alt.escolhas}  (${pctAlt}%)`,
      )
    })

    if (questao.emBranco > 0) {
      barra(p, 'Branco', questao.emBranco, totalDeEscolhas || 1, [170, 182, 175], String(questao.emBranco))
    }
    p.y += 3
  }

  if (detalhe.respostaComentada && questao.respostaComentada) {
    /*
     * A caixa era medida INTEIRA e desenhada de uma vez.
     *
     * Isso resolvia "não cabe no resto desta página" (o `garantirEspaco`
     * pulava), mas não "não cabe em página NENHUMA" — e o jsPDF não recorta
     * nem avisa: o que passa do fim da folha some. Com a resposta comentada
     * completa (que agora traz também o comentário POR ALTERNATIVA, não só a
     * explicação avulsa), esse é o caso comum, não o raro.
     *
     * `fatiarCaixaEmPaginas` é o mesmo fatiamento do relatório do aluno.
     */
    p.doc.setFontSize(9)
    p.doc.setFont(p.fonte, 'normal')
    const linhas = quebrar(p, questao.respostaComentada, util - 12)

    const alturaDaLinha = 5.3
    const alturaDoTitulo = 13
    const respiroDeContinuacao = 6
    // A linha de base está no TOPO da faixa de cada linha: o respiro de baixo
    // é pequeno porque a própria faixa da última linha já é respiro.
    const respiroInferior = 1.5

    const lotes = fatiarCaixaEmPaginas({
      totalDeLinhas: linhas.length,
      alturaDaLinha,
      alturaDoTitulo,
      respiroDeContinuacao,
      respiroInferior,
      yInicial: p.y,
      limiteInferior: p.altura - 26,
      yAposQuebra: Y_APOS_CABECALHO,
    })

    for (const lote of lotes) {
      if (lote.novaPagina) novaPagina(p, titulo)
      p.y = lote.y

      desenharVidro(p.doc, MARGEM, p.y, util, lote.altura, { tom: 'verde', raio: 3.4 })

      if (lote.primeiro) {
        p.doc.setFillColor(...LARANJA)
        p.doc.circle(MARGEM + 7, p.y + 6.9, 1, 'F')
        ligarFonte(p.doc, 'bold', 9, FLORESTA)
        p.doc.text('Resposta comentada', MARGEM + 9.6, p.y + 8)
        p.y += alturaDoTitulo
      } else {
        p.y += respiroDeContinuacao
      }

      ligarFonte(p.doc, 'normal', 9, TINTA)
      for (const linha of linhas.slice(lote.inicio, lote.inicio + lote.linhas)) {
        // `desenharLinhaRica`: o comentário por alternativa vem com `**A)**`
        // em negrito, e `doc.text` imprimiria os asteriscos.
        desenharLinhaRica(p.doc, p.fonte, linha, MARGEM + 6, p.y)
        p.y += alturaDaLinha
      }
      p.y = lote.y + lote.altura + 6
    }
  }

  p.y += 4
}

// ── A montagem ───────────────────────────────────────────────────

/*
 * As questões em destaque saem de `lib/provas/analise-da-turma.ts`.
 *
 * O mesmo par de perguntas — a mais errada e a mais acertada — passou a ser
 * feito também pela tela do aluno na prova encerrada. Duas implementações do
 * mesmo desempate é como este projeto já teve três "médias da turma"
 * diferentes: elas concordam no dia em que são escritas e divergem na primeira
 * vez que alguém mexe numa delas.
 *
 * Estas duas continuam existindo porque a assinatura delas — receber o
 * `DadosDaAnalise` inteiro — é a que o PDF e o modal do admin usam.
 */
export function questaoMaisErrada(dados: DadosDaAnalise) {
  return questaoMaisErradaDaTurma(dados.questoes)
}

export function questaoMaisAcertada(dados: DadosDaAnalise) {
  return questaoMaisAcertadaDaTurma(dados.questoes)
}

export async function gerarAnaliseDaProvaPDF(
  dados: DadosDaAnalise,
  opcoes: OpcoesDaAnalise,
): Promise<Blob> {
  const doc = new jsPDF()
  const fonte = await registrarFontes(doc)
  const logo = await carregarLogo()

  const maisErrada = opcoes.questaoMaisErrada.incluir ? questaoMaisErrada(dados) : null
  const maisAcertada = opcoes.questaoMaisAcertada.incluir ? questaoMaisAcertada(dados) : null

  // Só as imagens que este documento vai imprimir: baixar a prova inteira para
  // usar duas figuras é o tipo de espera que faz o botão parecer travado.
  const urlsDaQuestao = (
    questao: DadosDaAnalise['questoes'][number] | null | undefined,
    incluir: boolean,
  ): string[] =>
    incluir && questao
      ? reunirImagens(questao.imagens, questao.imageUrl, questao.imageSource).map((i) => i.url)
      : []

  const imagens = await carregarImagens([
    opcoes.capa ? dados.prova.coverImage : null,
    ...urlsDaQuestao(maisErrada, opcoes.questaoMaisErrada.imagem),
    ...urlsDaQuestao(maisAcertada, opcoes.questaoMaisAcertada.imagem),
  ])

  const p: Pincel = {
    doc,
    largura: doc.internal.pageSize.getWidth(),
    altura: doc.internal.pageSize.getHeight(),
    y: MARGEM,
    fonte,
    logo,
    imagens,
  }

  if (opcoes.capa) {
    desenharCapa(p, dados, opcoes.recado)
  } else {
    p.y = desenharCabecalho(p.doc, p.largura, MARGEM, 'Análise da prova', logo)
    const folha = comoFolha(p, 'Análise da prova')
    desenharCartaoDeTitulo(folha, { titulo: dados.prova.title })
    p.y = folha.y
  }

  if (opcoes.resultadosGerais) desenharResultadosGerais(p, dados)

  desenharDestaquesDeNota(p, dados, opcoes)

  if (opcoes.classificacao.incluir) desenharClassificacao(p, dados, opcoes)

  if (maisErrada) {
    desenharQuestaoEmDestaque(
      p,
      dados,
      maisErrada,
      'Questão mais errada',
      opcoes.questaoMaisErrada,
      'erro',
    )
  }

  if (maisAcertada && maisAcertada.questionId !== maisErrada?.questionId) {
    desenharQuestaoEmDestaque(
      p,
      dados,
      maisAcertada,
      'Questão mais acertada',
      opcoes.questaoMaisAcertada,
      'acerto',
    )
  }

  const totalDePaginas = doc.getNumberOfPages()
  for (let i = 1; i <= totalDePaginas; i++) {
    doc.setPage(i)
    desenharRodape(
      doc,
      i,
      totalDePaginas,
      p.largura,
      p.altura,
      MARGEM,
      sanitizarParaPdf(`Análise · ${dados.prova.title}`),
      LEGENDA_DO_RODAPE,
    )
  }

  return doc.output('blob')
}

export async function baixarAnaliseDaProvaPDF(dados: DadosDaAnalise, opcoes: OpcoesDaAnalise) {
  const blob = await gerarAnaliseDaProvaPDF(dados, opcoes)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `analise-${dados.prova.title.replace(/\s+/g, '-').toLowerCase().slice(0, 60)}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
