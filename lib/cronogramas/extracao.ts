/**
 * Leitura do calendário de provas que a coordenação divulga em imagem.
 *
 * O calendário oficial não chega em planilha: chega como aquela tabela rosa
 * em PNG no grupo da turma — "N2 ESPECÍFICA – 1º AO 8º PERÍODO – MEDICINA",
 * com data, dia da semana, três colunas de fuso e o eixo (SOI 1, HAM 8). Um
 * semestre inteiro assim vira dezenas de avaliações digitadas à mão no painel.
 *
 * Este módulo é a metade determinística desse trabalho: a IA (em
 * `extrair-imagem.ts`) só transcreve a tabela para linhas cruas; TUDO que
 * decide o que vira avaliação — qual fuso vale, qual ano, quantos períodos
 * uma linha cobre, o que é duplicata — mora aqui, em código puro e testado.
 *
 * A divisão importa por dois motivos:
 *
 * - o painel mostra a mesma prévia que o servidor calculou, sem um segundo
 *   parser para divergir na primeira correção (mesma escolha de
 *   `analisar-ementa.ts`);
 * - quando a leitura sai errada, o erro está numa função com teste, não num
 *   prompt.
 *
 * Três armadilhas do documento real, todas resolvidas aqui:
 *
 * 1. A tabela traz três colunas de horário (Brasília, Rondônia, CZS–AC). A
 *    plataforma inteira fala o calendário de Brasília, então é a coluna de
 *    Brasília que entra — as outras viram detalhe no texto.
 * 2. Uma linha só costuma valer para vários períodos ("1º ao 8º período"), e
 *    às vezes o período não está escrito em lugar nenhum: está no eixo, no
 *    número que fecha "SOI 1" ou "HAM 8".
 * 3. Cada prova aparece duas vezes — "Aluno Regular" e "Aluno Caso Especial",
 *    que é a mesma prova com tempo estendido. São uma avaliação, não duas.
 */

import { diasEntre, isDiaValido } from './brasilia'
import {
  LEMBRETE_PADRAO,
  getSecao,
  normalizarSecao,
  type Avaliacao,
  type ConfigLembrete,
  type SecaoCurso,
  type TipoAvaliacao,
} from './tipos'

// ── O que a IA devolve ──────────────────────────────────────────────────────

/**
 * Uma LINHA da tabela, como a IA transcreveu — ainda crua.
 *
 * Todo campo é opcional e todo campo é texto: a imagem manda no que existe, e
 * exigir formato do modelo só troca "campo faltando" por "campo inventado".
 * A normalização é responsabilidade daqui.
 */
export interface LinhaExtraida {
  /** "Medicina", "Psicologia" — vira a seção quando bate com uma conhecida. */
  curso?: string | null
  /** "N1 Específica", "N2", "Prova Integrada", "Simulado". */
  categoria?: string | null
  /** Título pronto, quando a imagem tem um. Senão é montado da categoria. */
  titulo?: string | null
  /** "24/11", "24/11/2025", "2025-11-24", "24 de novembro". */
  data?: string | null
  diaDaSemana?: string | null
  /** "manhã" | "tarde" | "noite". */
  turno?: string | null
  /** "Aluno Regular" | "Aluno Caso Especial". */
  denominacao?: string | null
  /** Coluna de Brasília, como está escrita: "10h – 11h20". */
  horario?: string | null
  /** Coluna de Brasília da linha "Caso Especial", quando existir. */
  horarioCasosEspeciais?: string | null
  /** Demais fusos, só para o texto do lembrete. */
  horarioOutrosFusos?: string | null
  /** "SOI 1", "HAM 8", "IESC 3", "MCM I". */
  eixo?: string | null
  /** "1ª Chamada Regular", "2ª Chamada PROUNI/FIES" — as reaplicações. */
  chamada?: string | null
  /** "1º ao 8º período", ["1º Período", "2º Período"], "5". */
  periodos?: Array<string | number> | string | null
  local?: string | null
  /** "1 hora e 20 minutos". */
  duracao?: string | null
  observacao?: string | null
  /** Dica de tipo, quando a imagem diz ("simulado", "prática"). */
  tipo?: string | null
}

// ── O que o painel recebe ───────────────────────────────────────────────────

export type ConfiancaProposta = 'alta' | 'media' | 'baixa'

/**
 * Uma avaliação proposta: já é exatamente o corpo que a rota de criação
 * aceita, mais o que o admin precisa para decidir se aprova.
 */
export interface PropostaAvaliacao extends Omit<Avaliacao, '_id'> {
  /** Estável dentro de um lote — é a chave da lista e da seleção na tela. */
  id: string
  /** Nome do arquivo de onde saiu, para a tela agrupar por imagem. */
  origem: string
  confianca: ConfiancaProposta
  /** O que o admin precisa conferir antes de aprovar. Vazio = leitura limpa. */
  avisos: string[]
}

export interface OpcoesExpansao {
  /** Nome do arquivo lido. */
  origem: string
  /** Seção usada quando a imagem não nomeia o curso. */
  secaoPadrao: SecaoCurso
  /** Hoje em Brasília, "AAAA-MM-DD" — base para deduzir o ano. */
  hoje: string
  /** Ano letivo escolhido pelo admin. Sem ele, o ano é deduzido de `hoje`. */
  anoReferencia?: number | null
  lembrete?: ConfigLembrete
  publicada?: boolean
}

/** Teto de segurança: um lote maior que isso é leitura desgovernada, não pauta. */
export const MAX_PROPOSTAS = 120

// ── Texto ───────────────────────────────────────────────────────────────────

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function limpar(valor: unknown): string {
  return typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim() : ''
}

function chaveDeTexto(valor: unknown): string {
  return semAcento(limpar(valor)).toLowerCase()
}

// ── Horário ─────────────────────────────────────────────────────────────────

const TOKEN_HORA = /(\d{1,2})\s*(?:h|:)\s*(\d{2})?/g

export interface IntervaloDeHoras {
  /** "HH:MM" do início. */
  inicio?: string
  /** "HH:MM" do fim, quando a célula traz o intervalo inteiro. */
  fim?: string
}

/**
 * Lê "10h – 11h20", "14h30 - 15h50", "09h – 11h" ou "10:00 às 11:20".
 *
 * A célula da tabela é sempre um intervalo, mas a avaliação guarda só o
 * começo — é a hora de chegar. O fim vira detalhe no texto que o aluno lê.
 */
export function normalizarHorario(bruto: unknown): IntervaloDeHoras {
  const texto = limpar(bruto)
  if (!texto) return {}

  const horas: string[] = []
  for (const encontrado of texto.matchAll(TOKEN_HORA)) {
    const hora = Number(encontrado[1])
    const minuto = encontrado[2] ? Number(encontrado[2]) : 0
    if (!Number.isFinite(hora) || hora > 23 || minuto > 59) continue
    horas.push(`${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`)
  }

  return { inicio: horas[0], fim: horas[1] }
}

// ── Data ────────────────────────────────────────────────────────────────────

const MESES: Record<string, number> = {
  janeiro: 1, jan: 1,
  fevereiro: 2, fev: 2,
  marco: 3, mar: 3,
  abril: 4, abr: 4,
  maio: 5, mai: 5,
  junho: 6, jun: 6,
  julho: 7, jul: 7,
  agosto: 8, ago: 8,
  setembro: 9, set: 9,
  outubro: 10, out: 10,
  novembro: 11, nov: 11,
  dezembro: 12, dez: 12,
}

function montarDia(ano: number, mes: number, dia: number): string | null {
  const candidato = `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  return isDiaValido(candidato) ? candidato : null
}

/**
 * O ano que a imagem não diz.
 *
 * O calendário sai em "24/11" porque, para quem o publicou, o ano é óbvio. Na
 * dúvida a data é a PRÓXIMA: um "05/02" lido em dezembro é a prova de
 * fevereiro que vem, não a de dez meses atrás. Só uma folga de meio ano no
 * passado é tolerada, para o admin ainda conseguir cadastrar retroativamente
 * o que já aconteceu neste semestre.
 */
function deduzirAno(mes: number, dia: number, hoje: string): number {
  const anoDeHoje = Number(hoje.slice(0, 4))
  const candidato = montarDia(anoDeHoje, mes, dia)
  if (!candidato) return anoDeHoje
  return diasEntre(hoje, candidato) < -180 ? anoDeHoje + 1 : anoDeHoje
}

export interface DataNormalizada {
  dia: string | null
  /** true quando o ano não estava na imagem e foi deduzido. */
  anoAssumido: boolean
}

/** Lê "24/11", "24/11/2025", "2025-11-24" ou "24 de novembro de 2025". */
export function normalizarData(
  bruto: unknown,
  opcoes: { hoje: string; anoReferencia?: number | null },
): DataNormalizada {
  const texto = limpar(bruto)
  if (!texto) return { dia: null, anoAssumido: false }

  // Já veio em ISO.
  const iso = texto.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    return { dia: montarDia(Number(iso[1]), Number(iso[2]), Number(iso[3])), anoAssumido: false }
  }

  let dia = 0
  let mes = 0
  let ano: number | null = null

  const numerico = texto.match(/(\d{1,2})\s*[/.-]\s*(\d{1,2})(?:\s*[/.-]\s*(\d{2,4}))?/)
  if (numerico) {
    dia = Number(numerico[1])
    mes = Number(numerico[2])
    if (numerico[3]) ano = Number(numerico[3])
  } else {
    const porExtenso = semAcento(texto.toLowerCase()).match(
      /(\d{1,2})\s*(?:de\s*)?([a-z]{3,})\.?(?:\s*(?:de\s*)?(\d{4}))?/,
    )
    if (!porExtenso) return { dia: null, anoAssumido: false }

    dia = Number(porExtenso[1])
    mes = MESES[porExtenso[2]] ?? 0
    if (porExtenso[3]) ano = Number(porExtenso[3])
    if (!mes) return { dia: null, anoAssumido: false }
  }

  if (ano != null && ano < 100) ano += 2000

  const anoInformado = ano != null
  const anoEscolhido = ano ?? opcoes.anoReferencia ?? deduzirAno(mes, dia, opcoes.hoje)

  return {
    dia: montarDia(anoEscolhido, mes, dia),
    anoAssumido: !anoInformado && opcoes.anoReferencia == null,
  }
}

// ── Períodos ────────────────────────────────────────────────────────────────

const ROMANOS: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6,
  vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12,
}

/** Nenhuma seção passa disso, e é o teto que a rota de criação valida. */
export const PERIODO_MAXIMO = 12

function dentroDaFaixa(numero: number): boolean {
  return Number.isInteger(numero) && numero >= 1 && numero <= PERIODO_MAXIMO
}

/**
 * O período escondido no eixo.
 *
 * Quando a tabela tem coluna "Eixo" ela não tem coluna "Período": o número
 * que fecha o eixo É o período — SOI 1 é do 1º, HAM 8 é do 8º. É a convenção
 * da própria grade, e sem ela metade das tabelas divulgadas fica sem período.
 */
export function periodoDoEixo(eixo: unknown): number | null {
  const texto = chaveDeTexto(eixo)
  if (!texto) return null

  const final = texto.match(/([ivx]+|\d{1,2})\s*$/)
  if (!final) return null

  const numero = /^\d+$/.test(final[1]) ? Number(final[1]) : ROMANOS[final[1]] ?? 0
  return dentroDaFaixa(numero) ? numero : null
}

/** A célula de período diz, com todas as letras, que a prova é do curso todo. */
export function dizTodosOsPeriodos(bruto: unknown): boolean {
  const partes = Array.isArray(bruto) ? bruto : [bruto]
  return partes.some(parte => /\btodos?\b|\btodas\b|curso inteiro/.test(chaveDeTexto(parte)))
}

/** Todos os períodos de um curso, de 1 até o total dele. */
export function todosOsPeriodos(total: number): number[] {
  const teto = Math.min(PERIODO_MAXIMO, Math.max(1, Math.round(total) || 1))
  return Array.from({ length: teto }, (_, indice) => indice + 1)
}

/**
 * Lê a coluna de período em qualquer das formas em que ela é publicada:
 * "1º ao 8º período", "5º–8º", ["1º Período", "2º Período"], "3", "todos os
 * períodos".
 *
 * `totalDoCurso` é o que dá sentido a "todos": uma prova que vale para o curso
 * inteiro — o teste de progresso é a de sempre — não lista os períodos, e sem
 * saber quantos existem a célula viraria período nenhum.
 */
export function interpretarPeriodos(bruto: unknown, totalDoCurso?: number): number[] {
  const partes = Array.isArray(bruto) ? bruto : [bruto]
  const encontrados = new Set<number>()

  for (const parte of partes) {
    if (typeof parte === 'number') {
      if (dentroDaFaixa(parte)) encontrados.add(parte)
      continue
    }

    const texto = chaveDeTexto(parte)
    if (!texto) continue

    if (totalDoCurso && /\btodos?\b|\btodas\b|curso inteiro/.test(texto)) {
      for (const numero of todosOsPeriodos(totalDoCurso)) encontrados.add(numero)
      continue
    }

    // "1º ao 8º", "5 a 8", "1º–4º": uma faixa cobre todos os períodos entre as pontas.
    const faixa = texto.match(/(\d{1,2})\s*[º°o]?\s*(?:ao|a|ate|-|–|—)\s*(\d{1,2})\s*[º°o]?/)
    if (faixa) {
      const inicio = Number(faixa[1])
      const fim = Number(faixa[2])
      if (dentroDaFaixa(inicio) && dentroDaFaixa(fim) && fim >= inicio) {
        for (let numero = inicio; numero <= fim; numero++) encontrados.add(numero)
        continue
      }
    }

    const numeros = texto.match(/\d{1,2}/g)
    if (numeros) {
      for (const numero of numeros) {
        if (dentroDaFaixa(Number(numero))) encontrados.add(Number(numero))
      }
      continue
    }

    const romano = texto.match(/\b([ivx]+)\b/)
    if (romano && dentroDaFaixa(ROMANOS[romano[1]] ?? 0)) encontrados.add(ROMANOS[romano[1]])
  }

  return [...encontrados].sort((a, b) => a - b)
}

// ── Tipo ────────────────────────────────────────────────────────────────────

const PISTAS_DE_TIPO: Array<{ tipo: TipoAvaliacao; termos: string[] }> = [
  { tipo: 'simulado', termos: ['simulado', 'simulacao'] },
  { tipo: 'pratica', termos: ['pratica', 'osce', 'laboratorio', 'habilidades', 'tutoria pratica'] },
  { tipo: 'apresentacao', termos: ['apresentacao', 'seminario', 'defesa', 'banca'] },
  { tipo: 'trabalho', termos: ['trabalho', 'relatorio', 'portfolio', 'entrega'] },
  { tipo: 'prova', termos: ['prova', 'avaliacao', 'exame', 'n1', 'n2', 'n3', 'integrada', 'especifica'] },
]

/**
 * Prova que vale para o curso inteiro.
 *
 * O teste de progresso (TPI) é aplicado no mesmo dia, do 1º ao último período,
 * e por isso a tabela dele não tem coluna de período: não há o que listar. Sem
 * reconhecê-lo, a linha entraria como avaliação de um período só — e as outras
 * turmas nunca saberiam da prova.
 */
export function ehDoCursoInteiro(linha: LinhaExtraida): boolean {
  const texto = chaveDeTexto(
    [linha.categoria, linha.titulo, linha.tipo, linha.observacao, linha.eixo].filter(Boolean).join(' '),
  )
  return /\btpi\b|teste de progresso|progresso individual/.test(texto)
}

/** O tipo que a imagem sugere. Sem pista, prova — é o que essas tabelas trazem. */
export function tipoDaLinha(linha: LinhaExtraida): TipoAvaliacao {
  const texto = chaveDeTexto(
    [linha.tipo, linha.categoria, linha.titulo, linha.observacao].filter(Boolean).join(' '),
  )

  for (const pista of PISTAS_DE_TIPO) {
    if (pista.termos.some(termo => texto.includes(termo))) return pista.tipo
  }
  return 'prova'
}

// ── Casos especiais ─────────────────────────────────────────────────────────

/** Chave do que é "a mesma prova" para efeito de fundir regular e caso especial. */
function chaveDaProva(linha: LinhaExtraida): string {
  return [
    chaveDeTexto(linha.data),
    chaveDeTexto(linha.turno),
    chaveDeTexto(linha.eixo),
    chaveDeTexto(Array.isArray(linha.periodos) ? linha.periodos.join(',') : linha.periodos),
  ].join('|')
}

function ehCasoEspecial(linha: LinhaExtraida): boolean {
  return chaveDeTexto(linha.denominacao).includes('especial')
}

/**
 * Funde as linhas de "Aluno Caso Especial" na linha regular correspondente.
 *
 * A tabela repete cada prova em duas linhas porque o aluno com tempo estendido
 * tem outro horário de término — mas é a MESMA prova, no mesmo dia, para a
 * mesma turma. Cadastrar as duas produziria dois lembretes do mesmo evento,
 * que é exatamente o tipo de ruído que faz o aluno desligar os lembretes.
 *
 * O horário estendido não se perde: vira detalhe no texto da avaliação.
 */
export function mesclarCasosEspeciais(linhas: LinhaExtraida[]): LinhaExtraida[] {
  const regulares = new Map<string, LinhaExtraida>()
  const resultado: LinhaExtraida[] = []

  for (const linha of linhas) {
    if (ehCasoEspecial(linha)) continue
    const copia = { ...linha }
    regulares.set(chaveDaProva(linha), copia)
    resultado.push(copia)
  }

  for (const linha of linhas) {
    if (!ehCasoEspecial(linha)) continue

    const regular = regulares.get(chaveDaProva(linha))
    if (regular) {
      regular.horarioCasosEspeciais = regular.horarioCasosEspeciais || limpar(linha.horario) || undefined
      continue
    }

    // Sem linha regular equivalente, a de caso especial é a única notícia
    // daquela prova — melhor cadastrar com aviso do que perder a data.
    resultado.push({ ...linha })
  }

  return resultado
}

// ── Montagem da avaliação ───────────────────────────────────────────────────

function montarTitulo(linha: LinhaExtraida): string {
  const titulo = limpar(linha.titulo)
  if (titulo) return titulo.slice(0, 140)

  // O eixo distingue as provas de uma mesma N2; a chamada distingue as
  // reaplicações de um mesmo TPI. Sem isso, três linhas do calendário viram
  // três avaliações de nome idêntico e o aluno não sabe qual é a dele.
  const partes = [limpar(linha.categoria), limpar(linha.eixo) || limpar(linha.chamada)].filter(Boolean)
  return (partes.join(' — ') || 'Avaliação').slice(0, 140)
}

/**
 * O recado que acompanha o lembrete do aluno.
 *
 * Tudo que a tabela dizia e não cabe num campo estruturado vem para cá — o
 * intervalo inteiro, o tempo estendido, o dia da semana, os outros fusos. É
 * informação que o aluno usa e que, jogada fora na importação, obrigaria o
 * admin a reabrir a imagem para conferir.
 *
 * Vai no recado do lembrete, e não em "conteúdo cobrado": logística não é
 * matéria. O campo de conteúdo fica vazio justamente para o admin escrever ali
 * o que cai na prova, que é o que o aluno lê sob esse título.
 */
function montarRecado(linha: LinhaExtraida, horario: IntervaloDeHoras, titulo: string): string {
  const detalhes: string[] = []

  const eixo = limpar(linha.eixo)
  if (eixo && !chaveDeTexto(titulo).includes(chaveDeTexto(eixo))) detalhes.push(`Eixo: ${eixo}`)

  const chamada = limpar(linha.chamada)
  if (chamada && !chaveDeTexto(titulo).includes(chaveDeTexto(chamada))) detalhes.push(chamada)

  const quando = [limpar(linha.diaDaSemana), limpar(linha.turno)].filter(Boolean).join(', ')
  if (quando) detalhes.push(quando)

  if (horario.inicio) {
    detalhes.push(
      horario.fim
        ? `Horário de Brasília: ${horario.inicio} às ${horario.fim}`
        : `Horário de Brasília: ${horario.inicio}`,
    )
  }

  const outrosFusos = limpar(linha.horarioOutrosFusos)
  if (outrosFusos) detalhes.push(`Outros fusos: ${outrosFusos}`)

  const especial = normalizarHorario(linha.horarioCasosEspeciais)
  if (especial.inicio) {
    detalhes.push(
      `Casos especiais: ${especial.inicio}${especial.fim ? ` às ${especial.fim}` : ''} (Brasília)`,
    )
  }

  const duracao = limpar(linha.duracao)
  if (duracao) detalhes.push(`Duração: ${duracao}`)

  const observacao = limpar(linha.observacao)
  if (observacao) detalhes.push(observacao)

  // 280 é o teto do recado em `normalizarConfigLembrete` — cortar aqui evita
  // que a proposta mostre ao admin um texto que o servidor vai truncar.
  return detalhes.join(' · ').slice(0, 280)
}

/** Identidade de uma avaliação para o painel: mesma turma, mesmo dia, mesmo título. */
export function chaveDaAvaliacao(
  avaliacao: Pick<Avaliacao, 'secao' | 'periodo' | 'data' | 'titulo' | 'todosOsPeriodos'>,
): string {
  return [
    avaliacao.secao,
    // A prova do curso inteiro não é a mesma coisa que a do 1º período, ainda
    // que o `periodo` gravado seja 1 nos dois casos.
    avaliacao.todosOsPeriodos ? 'todos' : avaliacao.periodo,
    avaliacao.data,
    chaveDeTexto(avaliacao.titulo).replace(/[^a-z0-9]+/g, ''),
  ].join('|')
}

function confiancaDe(avisos: string[], temHora: boolean): ConfiancaProposta {
  if (avisos.some(aviso => aviso.startsWith('Não'))) return 'baixa'
  if (avisos.length > 0 || !temHora) return 'media'
  return 'alta'
}

/**
 * Transforma as linhas cruas de UMA imagem nas avaliações que o painel propõe.
 *
 * Uma linha vira N avaliações — uma por período que ela cobre —, porque é
 * assim que a agenda é consultada: o aluno do 3º período abre o calendário
 * dele, não a tabela do curso inteiro.
 */
export function expandirLinhas(linhas: LinhaExtraida[], opcoes: OpcoesExpansao): PropostaAvaliacao[] {
  const lembrete = opcoes.lembrete ?? LEMBRETE_PADRAO
  const publicada = opcoes.publicada !== false

  const propostas: PropostaAvaliacao[] = []
  const vistas = new Set<string>()
  let sequencia = 0

  for (const linha of mesclarCasosEspeciais(linhas)) {
    const avisosDaLinha: string[] = []

    const secao = normalizarSecao(linha.curso) ?? opcoes.secaoPadrao
    const titulo = montarTitulo(linha)
    const horario = normalizarHorario(linha.horario)

    const { dia, anoAssumido } = normalizarData(linha.data, {
      hoje: opcoes.hoje,
      anoReferencia: opcoes.anoReferencia,
    })
    if (!dia) avisosDaLinha.push('Não consegui ler a data — preencha antes de aprovar.')
    else if (anoAssumido) avisosDaLinha.push(`Ano assumido: ${dia.slice(0, 4)}.`)

    if (!horario.inicio) avisosDaLinha.push('Sem horário na imagem.')

    if (ehCasoEspecial(linha)) {
      avisosDaLinha.push('Linha de “caso especial” sem linha regular equivalente — confira o horário.')
    }

    const totalDoCurso = getSecao(secao).periodos

    /**
     * Prova única do curso inteiro.
     *
     * O teste de progresso é a MESMA prova, no mesmo dia e horário, do 1º ao
     * último período — e a tabela dele diz isso na cara ("TODOS OS PERÍODOS").
     * Ele entra como UMA avaliação marcada para todas as turmas, não como oito
     * cópias: oito linhas iguais no painel teriam que ser editadas e apagadas
     * juntas, e uma correção de data que esquecesse uma turma passaria batido.
     *
     * O gatilho é estreito de propósito: só a categoria (TPI, teste de
     * progresso) ou a célula que diz "todos". Uma tabela que LISTA os períodos
     * continua virando uma avaliação por turma — ali cada uma costuma ter
     * horário próprio, como a N3 de manhã e de tarde.
     */
    const cursoInteiro = ehDoCursoInteiro(linha) || dizTodosOsPeriodos(linha.periodos)

    let periodos = cursoInteiro ? [1] : interpretarPeriodos(linha.periodos, totalDoCurso)
    if (!cursoInteiro && periodos.length === 0) {
      const doEixo = periodoDoEixo(linha.eixo)
      if (doEixo) {
        periodos = [doEixo]
        avisosDaLinha.push(`Período deduzido do eixo ${limpar(linha.eixo)}.`)
      }
    }
    if (!cursoInteiro && periodos.length === 0) {
      periodos = [1]
      avisosDaLinha.push('Não identifiquei o período — confira antes de aprovar.')
    }
    if (cursoInteiro) {
      avisosDaLinha.push('Prova única para todos os períodos do curso.')
    }

    const recado = montarRecado(linha, horario, titulo)
    const local = limpar(linha.local).slice(0, 120)

    for (const periodo of periodos) {
      if (propostas.length >= MAX_PROPOSTAS) return propostas

      const avaliacao = {
        secao,
        periodo,
        todosOsPeriodos: cursoInteiro,
        titulo,
        tipo: tipoDaLinha(linha),
        data: dia ?? '',
        hora: horario.inicio ?? '',
        local: local || undefined,
        // Vazio de propósito: é o campo do "cai na prova", que a tabela de
        // datas não diz e o admin preenche quando quiser.
        conteudo: undefined,
        itensEmenta: [],
        lembrete: { ...lembrete, ...(recado ? { observacao: recado } : {}) },
        publicada,
      }

      // Uma tabela costuma repetir a mesma prova em blocos (manhã e tarde do
      // mesmo dia, cabeçalho reimpresso a cada página). Duplicar dentro do
      // próprio lote é erro de leitura, não pauta.
      const chave = chaveDaAvaliacao(avaliacao)
      if (dia && vistas.has(chave)) continue
      if (dia) vistas.add(chave)

      propostas.push({
        ...avaliacao,
        id: `${opcoes.origem}#${sequencia++}`,
        origem: opcoes.origem,
        avisos: avisosDaLinha,
        confianca: confiancaDe(avisosDaLinha, Boolean(horario.inicio)),
      })
    }
  }

  return propostas
}

/**
 * Marca as propostas que já existem na agenda.
 *
 * Reimportar a mesma imagem — ou a versão corrigida dela — é o caminho
 * normal, não o desvio: a coordenação republica a tabela quando muda uma
 * data. Sem essa marcação, aprovar de novo criaria a segunda cópia de tudo
 * que não mudou, e cada cópia manda o próprio lembrete.
 */
export function marcarDuplicadas<T extends PropostaAvaliacao>(
  propostas: T[],
  existentes: Array<Pick<Avaliacao, 'secao' | 'periodo' | 'data' | 'titulo' | 'todosOsPeriodos'>>,
): Array<T & { duplicada: boolean }> {
  const agenda = new Set(existentes.map(chaveDaAvaliacao))
  return propostas.map(proposta => ({
    ...proposta,
    duplicada: proposta.data ? agenda.has(chaveDaAvaliacao(proposta)) : false,
  }))
}

/** Períodos que o painel oferece para uma seção, sem esconder o já preenchido. */
export function periodosDoPainel(secao: SecaoCurso, incluir?: number): number[] {
  const total = Math.min(PERIODO_MAXIMO, Math.max(getSecao(secao).periodos, incluir ?? 0))
  return Array.from({ length: total }, (_, indice) => indice + 1)
}
