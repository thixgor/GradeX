import jsPDF from 'jspdf'
import {
  CINZA_CLARO,
  CINZA_TEXTO,
  LARANJA,
  VERDE_ESCURO,
  VERDE_MEDIO,
  carregarLogo,
  desenharCabecalho,
  desenharRodape,
  registrarFontes,
  sanitizarParaPdf,
} from './marca'
import { carregarImagens, encaixar, type ImagemParaPdf } from './imagens'

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
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(casas)
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

function novaPagina(p: Pincel, subtitulo: string) {
  p.doc.addPage()
  p.y = desenharCabecalho(p.doc, p.largura, MARGEM, subtitulo, p.logo)
}

function garantirEspaco(p: Pincel, necessario: number, subtitulo: string) {
  if (p.y + necessario > p.altura - 26) novaPagina(p, subtitulo)
}

function quebrar(p: Pincel, texto: string, larguraMax: number): string[] {
  const limpo = sanitizarParaPdf((texto || '').replace(/\\nl/g, '\n').replace(/\\n/g, '\n'))
  if (!limpo) return []
  const linhas: string[] = []
  for (const paragrafo of limpo.split('\n')) {
    if (!paragrafo.trim()) {
      linhas.push('')
      continue
    }
    let atual = ''
    for (const palavra of paragrafo.split(' ')) {
      const teste = atual ? `${atual} ${palavra}` : palavra
      if (p.doc.getTextWidth(teste) > larguraMax && atual) {
        linhas.push(atual)
        atual = palavra
      } else {
        atual = teste
      }
    }
    if (atual) linhas.push(atual)
  }
  return linhas
}

/** O título de uma seção: barra verde, texto branco. */
function tituloDeSecao(p: Pincel, texto: string, subtitulo: string) {
  garantirEspaco(p, 22, subtitulo)
  p.doc.setFillColor(...VERDE_ESCURO)
  p.doc.roundedRect(MARGEM, p.y, p.largura - 2 * MARGEM, 11, 2, 2, 'F')
  p.doc.setTextColor(255, 255, 255)
  p.doc.setFontSize(11)
  p.doc.setFont(p.fonte, 'bold')
  p.doc.text(sanitizarParaPdf(texto), MARGEM + 6, p.y + 7.5)
  p.doc.setTextColor(...CINZA_TEXTO)
  p.doc.setFont(p.fonte, 'normal')
  p.y += 18
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
  p.doc.setFillColor(destaque ? 253 : 250, destaque ? 246 : 250, destaque ? 230 : 250)
  p.doc.setDrawColor(destaque ? LARANJA[0] : 225, destaque ? LARANJA[1] : 225, destaque ? LARANJA[2] : 225)
  p.doc.setLineWidth(0.4)
  p.doc.roundedRect(x, y, largura, altura, 2, 2, 'FD')

  p.doc.setFontSize(6.5)
  p.doc.setFont(p.fonte, 'normal')
  p.doc.setTextColor(110, 110, 110)
  p.doc.text(sanitizarParaPdf(rotulo.toUpperCase()), x + largura / 2, y + 7, { align: 'center' })

  p.doc.setFontSize(13)
  p.doc.setFont(p.fonte, 'bold')
  p.doc.setTextColor(destaque ? VERDE_ESCURO[0] : 40, destaque ? VERDE_ESCURO[1] : 40, destaque ? VERDE_ESCURO[2] : 40)
  p.doc.text(sanitizarParaPdf(valor), x + largura / 2, y + 15.5, { align: 'center' })

  p.doc.setTextColor(...CINZA_TEXTO)
  p.doc.setFont(p.fonte, 'normal')
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
  const vao = 3
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

  p.doc.setFontSize(8)
  p.doc.setFont(p.fonte, 'normal')
  p.doc.setTextColor(110, 110, 110)
  p.doc.text(sanitizarParaPdf(rotulo), MARGEM + larguraDoRotulo - 2, p.y + 3.6, { align: 'right' })

  p.doc.setFillColor(238, 238, 238)
  p.doc.roundedRect(MARGEM + larguraDoRotulo, p.y, larguraDaBarra, 5.5, 1, 1, 'F')

  // Largura mínima visível: uma barra de 1 aluno em 200 seria invisível, e
  // "invisível" e "zero" precisam ser distinguíveis à primeira vista.
  const preenchida = quantidade > 0 ? Math.max(larguraDaBarra * proporcao, 1.6) : 0
  if (preenchida > 0) {
    p.doc.setFillColor(cor[0], cor[1], cor[2])
    p.doc.roundedRect(MARGEM + larguraDoRotulo, p.y, preenchida, 5.5, 1, 1, 'F')
  }

  p.doc.setFontSize(8)
  p.doc.setFont(p.fonte, 'bold')
  p.doc.setTextColor(80, 80, 80)
  p.doc.text(
    sanitizarParaPdf(sufixo ?? String(quantidade)),
    MARGEM + larguraDoRotulo + larguraDaBarra + 3,
    p.y + 3.6,
  )
  p.doc.setFont(p.fonte, 'normal')
  p.doc.setTextColor(...CINZA_TEXTO)
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
    const { largura, altura } = encaixar(capa, util, alturaDaFaixa * 2.4)
    try {
      // O clip mantém a imagem dentro da faixa mesmo quando ela é mais alta —
      // sem ele, uma capa em retrato vazaria por cima do título.
      p.doc.saveGraphicsState()
      p.doc.roundedRect(MARGEM, p.y, util, alturaDaFaixa, 3, 3).clip().discardPath()
      p.doc.addImage(
        capa.dataUrl,
        'JPEG',
        MARGEM + (util - largura) / 2,
        p.y + (alturaDaFaixa - altura) / 2,
        largura,
        altura,
      )
      p.doc.restoreGraphicsState()
    } catch {
      try {
        p.doc.addImage(capa.dataUrl, 'JPEG', MARGEM, p.y, util, alturaDaFaixa)
      } catch { /* segue sem capa */ }
    }
    p.doc.setDrawColor(...VERDE_MEDIO)
    p.doc.setLineWidth(0.6)
    p.doc.roundedRect(MARGEM, p.y, util, alturaDaFaixa, 3, 3, 'S')
    p.y += alturaDaFaixa + 10
  }

  // Título
  p.doc.setFontSize(20)
  p.doc.setFont(p.fonte, 'bold')
  p.doc.setTextColor(...VERDE_ESCURO)
  const titulo = quebrar(p, prova.title, util)
  titulo.slice(0, 3).forEach((linha) => {
    p.doc.text(linha, MARGEM, p.y)
    p.y += 9
  })
  p.y += 2

  // Régua verde-âmbar sob o título
  p.doc.setDrawColor(...VERDE_MEDIO)
  p.doc.setLineWidth(1.4)
  p.doc.line(MARGEM, p.y, MARGEM + 34, p.y)
  p.doc.setDrawColor(...LARANJA)
  p.doc.line(MARGEM + 34, p.y, MARGEM + 52, p.y)
  p.y += 8

  if (prova.description) {
    p.doc.setFontSize(10)
    p.doc.setFont(p.fonte, 'normal')
    p.doc.setTextColor(90, 90, 90)
    quebrar(p, prova.description, util)
      .slice(0, 6)
      .forEach((linha) => {
        p.doc.text(linha, MARGEM, p.y)
        p.y += 5.5
      })
    p.y += 4
  }

  // Ficha técnica
  const fichas: string[] = [
    `${prova.numberOfQuestions ?? dados.questoes.length} questões`,
    prova.scoringMethod === 'tri' ? 'TRI · 1000 pts' : `${prova.notaMaxima} pontos`,
    `Aplicada em ${dataCurta(prova.startTime)}`,
  ]
  if (prova.publico?.rotulo) fichas.push(prova.publico.rotulo)

  p.doc.setFontSize(8.5)
  let fichaX = MARGEM
  const fichaY = p.y
  fichas.forEach((ficha) => {
    const texto = sanitizarParaPdf(ficha)
    p.doc.setFont(p.fonte, 'normal')
    const larguraDoTexto = p.doc.getTextWidth(texto) + 8
    if (fichaX + larguraDoTexto > p.largura - MARGEM) {
      fichaX = MARGEM
      p.y += 9
    }
    p.doc.setFillColor(...CINZA_CLARO)
    p.doc.roundedRect(fichaX, p.y - 4.5, larguraDoTexto, 7.5, 2, 2, 'F')
    p.doc.setTextColor(90, 90, 90)
    p.doc.text(texto, fichaX + 4, p.y)
    fichaX += larguraDoTexto + 3
  })
  p.y = Math.max(p.y, fichaY) + 12

  if (recado.trim()) {
    const linhas = quebrar(p, recado.trim(), util - 12)
    const alturaDaCaixa = linhas.length * 5.5 + 12
    garantirEspaco(p, alturaDaCaixa + 6, 'Análise da prova')
    p.doc.setFillColor(255, 251, 235)
    p.doc.setDrawColor(...LARANJA)
    p.doc.setLineWidth(0.5)
    p.doc.roundedRect(MARGEM, p.y, util, alturaDaCaixa, 2, 2, 'FD')
    p.doc.setFontSize(9.5)
    p.doc.setFont(p.fonte, 'italic')
    p.doc.setTextColor(...CINZA_TEXTO)
    let recadoY = p.y + 8
    linhas.forEach((linha) => {
      p.doc.text(linha, MARGEM + 6, recadoY)
      recadoY += 5.5
    })
    p.doc.setFont(p.fonte, 'normal')
    p.y += alturaDaCaixa + 8
  }
}

function desenharResultadosGerais(p: Pincel, dados: DadosDaAnalise) {
  const { notas, presenca, prova } = dados
  tituloDeSecao(p, 'RESULTADOS GERAIS', 'Resultados gerais')

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
    p.doc.setFontSize(9)
    p.doc.setFont(p.fonte, 'normal')
    p.doc.setTextColor(90, 90, 90)
    p.doc.text(
      sanitizarParaPdf(
        `A turma aproveitou ${aproveitamento.toFixed(0)}% da prova — média de ${numeroCurto(notas.media)} de ${prova.notaMaxima} pontos.`,
      ),
      MARGEM,
      p.y,
    )
    p.y += 9
  }

  const totalNaDistribuicao = notas.distribuicao.reduce((a, f) => a + f.quantidade, 0)
  if (totalNaDistribuicao > 0) {
    garantirEspaco(p, 20 + notas.distribuicao.length * 8, 'Resultados gerais')
    p.doc.setFontSize(9)
    p.doc.setFont(p.fonte, 'bold')
    p.doc.setTextColor(...VERDE_ESCURO)
    p.doc.text('Distribuição das notas', MARGEM, p.y)
    p.y += 7

    notas.distribuicao.forEach((faixa) => {
      const pct = totalNaDistribuicao > 0 ? Math.round((faixa.quantidade / totalNaDistribuicao) * 100) : 0
      barra(
        p,
        faixa.rotulo,
        faixa.quantidade,
        totalNaDistribuicao,
        VERDE_MEDIO,
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
    p.doc.setFontSize(8)
    p.doc.setFont(p.fonte, 'normal')
    p.doc.setTextColor(120, 120, 120)
    const daProva = dados.tempos.duracaoDaProva
      ? ` A prova tinha ${formatarDuracao(dados.tempos.duracaoDaProva)}.`
      : ''
    p.doc.text(
      sanitizarParaPdf(
        `Tempo medido em ${dados.tempos.comRegistro} ${dados.tempos.comRegistro === 1 ? 'entrega' : 'entregas'} com início registrado · mediana ${formatarDuracao(dados.tempos.mediana)} · mais demorada ${formatarDuracao(dados.tempos.maior)}.${daProva}`,
      ),
      MARGEM,
      p.y,
    )
    p.y += 9
    p.doc.setTextColor(...CINZA_TEXTO)
  }
}

function desenharClassificacao(p: Pincel, dados: DadosDaAnalise, opcoes: OpcoesDaAnalise) {
  const config = opcoes.classificacao
  const comNota = dados.participantes.filter((a) => typeof a.score === 'number')
  if (comNota.length === 0) return

  const ordenados = [...comNota].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const top = ordenados.slice(0, Math.max(1, config.top))

  tituloDeSecao(p, `CLASSIFICAÇÃO — TOP ${top.length}`, 'Classificação')

  const objetivas = dados.questoes.filter((q) => q.type === 'multiple-choice').length
  const util = p.largura - 2 * MARGEM

  top.forEach((aluno, i) => {
    garantirEspaco(p, 12, 'Classificação')
    const posicao = ordenados.filter((o) => (o.score ?? 0) > (aluno.score ?? 0)).length + 1
    const noPodio = posicao <= 3
    const proporcao = dados.prova.notaMaxima > 0 ? (aluno.score ?? 0) / dados.prova.notaMaxima : 0

    // A barra de fundo dá a nota sem exigir a leitura do número — e mostra a
    // distância entre o primeiro e o décimo, que a lista sozinha esconde.
    p.doc.setFillColor(noPodio ? 240 : 247, noPodio ? 249 : 247, noPodio ? 242 : 247)
    p.doc.roundedRect(MARGEM, p.y, util, 9.5, 1.5, 1.5, 'F')
    if (proporcao > 0) {
      p.doc.setFillColor(noPodio ? 214 : 232, noPodio ? 238 : 236, noPodio ? 219 : 232)
      p.doc.roundedRect(MARGEM, p.y, Math.max(util * proporcao, 2), 9.5, 1.5, 1.5, 'F')
    }

    // Medalha dos três primeiros: o único lugar do documento em que a cor
    // significa colocação, e não certo/errado.
    if (noPodio) {
      const medalha: [number, number, number] =
        posicao === 1 ? [226, 164, 62] : posicao === 2 ? [160, 160, 165] : [176, 122, 74]
      p.doc.setFillColor(...medalha)
      p.doc.circle(MARGEM + 6, p.y + 4.75, 3.2, 'F')
      p.doc.setTextColor(255, 255, 255)
      p.doc.setFontSize(7)
      p.doc.setFont(p.fonte, 'bold')
      p.doc.text(String(posicao), MARGEM + 6, p.y + 6.3, { align: 'center' })
    } else {
      p.doc.setTextColor(130, 130, 130)
      p.doc.setFontSize(8.5)
      p.doc.setFont(p.fonte, 'bold')
      p.doc.text(`${posicao}º`, MARGEM + 6, p.y + 6.3, { align: 'center' })
    }

    p.doc.setFontSize(9.5)
    p.doc.setFont(p.fonte, noPodio ? 'bold' : 'normal')
    p.doc.setTextColor(...CINZA_TEXTO)
    // Sem nome, a lista vira a forma da turma sem expor ninguém — o mesmo
    // relatório serve às duas escolhas do professor.
    const nome = config.comNome ? aluno.userName : `Participante ${i + 1}`
    p.doc.text(sanitizarParaPdf(nome), MARGEM + 13, p.y + 6.3)

    let direitaX = p.largura - MARGEM - 4
    p.doc.setFont(p.fonte, 'bold')
    p.doc.setFontSize(9.5)
    p.doc.setTextColor(...VERDE_ESCURO)
    const nota = `${numeroCurto(aluno.score)} / ${dados.prova.notaMaxima}`
    p.doc.text(sanitizarParaPdf(nota), direitaX, p.y + 6.3, { align: 'right' })
    direitaX -= p.doc.getTextWidth(nota) + 6

    if (config.comAcertos && typeof aluno.acertos === 'number' && objetivas > 0) {
      p.doc.setFont(p.fonte, 'normal')
      p.doc.setFontSize(8)
      p.doc.setTextColor(120, 120, 120)
      p.doc.text(
        sanitizarParaPdf(`${aluno.acertos}/${objetivas} acertos`),
        direitaX,
        p.y + 6.3,
        { align: 'right' },
      )
    }

    p.doc.setTextColor(...CINZA_TEXTO)
    p.doc.setFont(p.fonte, 'normal')
    p.y += 11
  })

  if (ordenados.length > top.length) {
    p.doc.setFontSize(8)
    p.doc.setTextColor(130, 130, 130)
    p.doc.text(
      sanitizarParaPdf(`+ ${ordenados.length - top.length} participantes fora do top ${top.length}.`),
      MARGEM,
      p.y + 2,
    )
    p.doc.setTextColor(...CINZA_TEXTO)
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

  const cor: [number, number, number] = tom === 'erro' ? [200, 62, 62] : [46, 143, 78]
  const pct = questao.percentualDeAcerto

  // Cabeçalho da questão: número + índice de acerto
  garantirEspaco(p, 20, titulo)
  p.doc.setFillColor(tom === 'erro' ? 254 : 240, tom === 'erro' ? 242 : 250, tom === 'erro' ? 242 : 243)
  p.doc.setDrawColor(...cor)
  p.doc.setLineWidth(0.5)
  p.doc.roundedRect(MARGEM, p.y, util, 14, 2, 2, 'FD')
  p.doc.setFontSize(10)
  p.doc.setFont(p.fonte, 'bold')
  p.doc.setTextColor(cor[0], cor[1], cor[2])
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
  p.doc.setTextColor(...CINZA_TEXTO)
  p.doc.setFont(p.fonte, 'normal')
  p.y += 20

  if (detalhe.enunciado && (questao.enunciadoCompleto || questao.enunciado)) {
    p.doc.setFontSize(9.5)
    p.doc.setFont(p.fonte, 'normal')
    p.doc.setTextColor(...CINZA_TEXTO)
    quebrar(p, questao.enunciadoCompleto || questao.enunciado || '', util).forEach((linha) => {
      garantirEspaco(p, 8, titulo)
      p.doc.text(linha, MARGEM, p.y)
      p.y += 5.3
    })
    p.y += 3

    if (questao.comando) {
      p.doc.setFont(p.fonte, 'bold')
      p.doc.setTextColor(...VERDE_ESCURO)
      quebrar(p, questao.comando, util).forEach((linha) => {
        garantirEspaco(p, 8, titulo)
        p.doc.text(linha, MARGEM, p.y)
        p.y += 5.3
      })
      p.doc.setFont(p.fonte, 'normal')
      p.doc.setTextColor(...CINZA_TEXTO)
      p.y += 3
    }
  }

  if (detalhe.imagem && questao.imageUrl) {
    const img = p.imagens.get(questao.imageUrl)
    if (img) {
      const { largura, altura } = encaixar(img, util - 10, 82)
      garantirEspaco(p, altura + 10, titulo)
      try {
        p.doc.addImage(img.dataUrl, 'JPEG', MARGEM + (util - largura) / 2, p.y, largura, altura)
        p.y += altura + 4
      } catch { /* segue sem a imagem */ }
      if (questao.imageSource) {
        p.doc.setFontSize(7)
        p.doc.setTextColor(140, 140, 140)
        p.doc.text(sanitizarParaPdf(`Fonte: ${questao.imageSource}`), MARGEM, p.y)
        p.doc.setTextColor(...CINZA_TEXTO)
        p.y += 6
      }
    }
  }

  // Como a turma se dividiu entre as alternativas — o dado que separa "a turma
  // não estudou" de "a questão está mal escrita": quando 60% escolhem a MESMA
  // alternativa errada, o problema costuma ser o enunciado.
  if (questao.porAlternativa.length > 0) {
    const totalDeEscolhas = questao.porAlternativa.reduce((a, b) => a + b.escolhas, 0)
    garantirEspaco(p, 14 + questao.porAlternativa.length * 8, titulo)
    p.doc.setFontSize(9)
    p.doc.setFont(p.fonte, 'bold')
    p.doc.setTextColor(...VERDE_ESCURO)
    p.doc.text('Como a turma respondeu', MARGEM, p.y)
    p.doc.setFont(p.fonte, 'normal')
    p.doc.setTextColor(...CINZA_TEXTO)
    p.y += 7

    questao.porAlternativa.forEach((alt) => {
      const pctAlt = totalDeEscolhas > 0 ? Math.round((alt.escolhas / totalDeEscolhas) * 100) : 0
      barra(
        p,
        `${alt.letter})${alt.isCorrect ? ' ✓' : ''}`,
        alt.escolhas,
        totalDeEscolhas || 1,
        alt.isCorrect ? VERDE_MEDIO : [205, 92, 92],
        `${alt.escolhas}  (${pctAlt}%)`,
      )
    })

    if (questao.emBranco > 0) {
      barra(p, 'Branco', questao.emBranco, totalDeEscolhas || 1, [180, 180, 180], String(questao.emBranco))
    }
    p.y += 3
  }

  if (detalhe.respostaComentada && questao.respostaComentada) {
    const linhas = quebrar(p, questao.respostaComentada, util - 12)
    const altura = linhas.length * 5.3 + 14
    garantirEspaco(p, altura + 6, titulo)
    p.doc.setFillColor(255, 251, 235)
    p.doc.setDrawColor(...LARANJA)
    p.doc.setLineWidth(0.5)
    p.doc.roundedRect(MARGEM, p.y, util, altura, 2, 2, 'FD')
    p.doc.setFontSize(8)
    p.doc.setFont(p.fonte, 'bold')
    p.doc.setTextColor(...LARANJA)
    p.doc.text('RESPOSTA COMENTADA', MARGEM + 6, p.y + 7)
    p.doc.setFontSize(9)
    p.doc.setFont(p.fonte, 'normal')
    p.doc.setTextColor(...CINZA_TEXTO)
    let comentarioY = p.y + 13
    linhas.forEach((linha) => {
      p.doc.text(linha, MARGEM + 6, comentarioY)
      comentarioY += 5.3
    })
    p.y += altura + 6
  }

  p.y += 4
}

// ── A montagem ───────────────────────────────────────────────────

/** As objetivas com resposta, das quais saem as questões em destaque. */
function objetivasComResposta(dados: DadosDaAnalise) {
  return dados.questoes.filter(
    (q) => q.type === 'multiple-choice' && q.percentualDeAcerto !== null && q.respondidas > 0,
  )
}

export function questaoMaisErrada(dados: DadosDaAnalise) {
  const candidatas = objetivasComResposta(dados)
  if (candidatas.length === 0) return null
  // Empate desempata pela mais respondida: entre duas questões com 20% de
  // acerto, a que 40 pessoas erraram diz mais do que a que 3 erraram.
  return [...candidatas].sort(
    (a, b) => a.percentualDeAcerto! - b.percentualDeAcerto! || b.respondidas - a.respondidas,
  )[0]
}

export function questaoMaisAcertada(dados: DadosDaAnalise) {
  const candidatas = objetivasComResposta(dados)
  if (candidatas.length === 0) return null
  return [...candidatas].sort(
    (a, b) => b.percentualDeAcerto! - a.percentualDeAcerto! || b.respondidas - a.respondidas,
  )[0]
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
  const imagens = await carregarImagens([
    opcoes.capa ? dados.prova.coverImage : null,
    opcoes.questaoMaisErrada.imagem ? maisErrada?.imageUrl : null,
    opcoes.questaoMaisAcertada.imagem ? maisAcertada?.imageUrl : null,
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
    p.doc.setFontSize(15)
    p.doc.setFont(fonte, 'bold')
    p.doc.setTextColor(...VERDE_ESCURO)
    quebrar(p, dados.prova.title, p.largura - 2 * MARGEM).slice(0, 2).forEach((linha) => {
      p.doc.text(linha, MARGEM, p.y)
      p.y += 8
    })
    p.doc.setTextColor(...CINZA_TEXTO)
    p.doc.setFont(fonte, 'normal')
    p.y += 6
  }

  if (opcoes.resultadosGerais) desenharResultadosGerais(p, dados)

  desenharDestaquesDeNota(p, dados, opcoes)

  if (opcoes.classificacao.incluir) desenharClassificacao(p, dados, opcoes)

  if (maisErrada) {
    desenharQuestaoEmDestaque(
      p,
      dados,
      maisErrada,
      'QUESTÃO MAIS ERRADA',
      opcoes.questaoMaisErrada,
      'erro',
    )
  }

  if (maisAcertada && maisAcertada.questionId !== maisErrada?.questionId) {
    desenharQuestaoEmDestaque(
      p,
      dados,
      maisAcertada,
      'QUESTÃO MAIS ACERTADA',
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
