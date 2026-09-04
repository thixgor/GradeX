import type { BancoDificuldade, BancoModoResposta, BancoQuestaoTipo } from '@/lib/types/banco-questoes'

/**
 * Montar uma lista de questões.
 *
 * A criação virou multifatorial: de onde vêm as questões (o banco inteiro ou
 * assuntos escolhidos), quantas, de que tipo, de que dificuldade, e quando a
 * resposta aparece. Cada fator sozinho é trivial; o que estava faltando era
 * alguém somando os fatores numa frase que a pessoa entenda ANTES de criar —
 * "20 questões objetivas difíceis de Arritmias, corrigidas na hora" — em vez de
 * um formulário que só diz o que aconteceu depois de acontecer.
 *
 * Este arquivo é puro: as telas e a rota precisam concordar sobre o que cada
 * combinação significa, inclusive sobre o caso em que o banco não tem tudo o
 * que foi pedido.
 */

export interface FiltrosDaLista {
  moduloIds: string[]
  topicoIds: string[]
  subtopicoIds: string[]
  tipo?: BancoQuestaoTipo | ''
  dificuldade?: BancoDificuldade | ''
  anos: number[]
  /** Períodos letivos escolhidos, ex.: ["2026.2"]. Ver lib/banco/periodo-letivo.ts. */
  periodos: string[]
  excluirJaResolvidas: boolean
  /**
   * Sorteia só entre as que a pessoa já respondeu errado — a lista de
   * revisão de erros. Mutuamente exclusivo com `excluirJaResolvidas`: uma
   * exige ter resolvido, a outra exclui quem resolveu. A tela cuida disso
   * ligando uma e desligando a outra; aqui é só o dado.
   */
  apenasErradas: boolean
  /** Só questão com imagem — ECG, radiografia, lâmina de histologia. */
  comImagem: boolean
  /** Só questão com a resposta comentada preenchida. */
  comExplicacao: boolean
}

export interface ConfiguracaoDaLista extends FiltrosDaLista {
  nome: string
  quantidade: number
  modoResposta: BancoModoResposta
}

export const FILTROS_VAZIOS: FiltrosDaLista = {
  moduloIds: [],
  topicoIds: [],
  subtopicoIds: [],
  tipo: '',
  dificuldade: '',
  anos: [],
  periodos: [],
  excluirJaResolvidas: false,
  apenasErradas: false,
  comImagem: false,
  comExplicacao: false,
}

/** Atalhos de quantidade. Números redondos que cobrem do treino curto ao simulado. */
export const QUANTIDADES = [5, 10, 20, 30, 50] as const
export const QUANTIDADE_MAXIMA = 200

export function temAssuntoEscolhido(filtros: FiltrosDaLista): boolean {
  return (
    filtros.moduloIds.length > 0 ||
    filtros.topicoIds.length > 0 ||
    filtros.subtopicoIds.length > 0
  )
}

/** Quantos fatores além do assunto estão em jogo — usado para rotular o passo. */
export function contarFiltros(filtros: FiltrosDaLista): number {
  return (
    (filtros.tipo ? 1 : 0) +
    (filtros.dificuldade ? 1 : 0) +
    (filtros.anos.length > 0 ? 1 : 0) +
    (filtros.periodos.length > 0 ? 1 : 0) +
    (filtros.excluirJaResolvidas ? 1 : 0) +
    (filtros.apenasErradas ? 1 : 0) +
    (filtros.comImagem ? 1 : 0) +
    (filtros.comExplicacao ? 1 : 0)
  )
}

const ROTULO_TIPO: Record<string, string> = {
  objetiva: 'objetivas',
  discursiva: 'discursivas',
}

const ROTULO_DIFICULDADE: Record<string, string> = {
  facil: 'fáceis',
  medio: 'médias',
  dificil: 'difíceis',
}

/**
 * A frase que descreve a lista antes de ela existir.
 *
 * Escrita em linguagem corrida de propósito: uma pilha de etiquetas
 * ("objetiva", "difícil", "2023") obriga a pessoa a montar a frase de cabeça, e
 * é exatamente aí que ela cria a lista errada.
 */
export function descreverLista(
  config: ConfiguracaoDaLista,
  nomesDosAssuntos: string[] = [],
): string {
  const partes: string[] = [`${config.quantidade} ${config.quantidade === 1 ? 'questão' : 'questões'}`]

  if (config.tipo) partes.push(ROTULO_TIPO[config.tipo])
  if (config.dificuldade) partes.push(ROTULO_DIFICULDADE[config.dificuldade])

  if (nomesDosAssuntos.length === 1) {
    partes.push(`de ${nomesDosAssuntos[0]}`)
  } else if (nomesDosAssuntos.length === 2) {
    partes.push(`de ${nomesDosAssuntos[0]} e ${nomesDosAssuntos[1]}`)
  } else if (nomesDosAssuntos.length > 2) {
    partes.push(`de ${nomesDosAssuntos.length} assuntos`)
  } else if (!temAssuntoEscolhido(config)) {
    partes.push('de todo o banco')
  }

  // O período letivo é mais específico que o ano e vem antes por isso: quem
  // marcou "2026.2" quer ouvir "de 2026.2", não "de 2026".
  if (config.periodos.length === 1) partes.push(`de ${config.periodos[0]}`)
  else if (config.periodos.length > 1) partes.push(`de ${config.periodos.length} períodos`)
  else if (config.anos.length === 1) partes.push(`de ${config.anos[0]}`)
  else if (config.anos.length > 1) partes.push(`de ${config.anos.length} anos`)

  if (config.comImagem) partes.push('com imagem')
  if (config.comExplicacao) partes.push('com resposta comentada')

  // `apenasErradas` e `excluirJaResolvidas` nunca vêm juntos (a tela impede),
  // mas a frase é escrita para não mentir se algum dia vierem.
  if (config.apenasErradas) partes.push('que você errou')
  else if (config.excluirJaResolvidas) partes.push('que você ainda não resolveu')

  const modo =
    config.modoResposta === 'final' ? 'com a resposta só no final' : 'corrigidas na hora'

  return `${partes.join(' ')}, ${modo}.`
}

/**
 * Nome sugerido, montado a partir do que foi escolhido.
 *
 * O campo de nome é o último obstáculo entre a pessoa e a lista pronta, e é
 * onde ela desiste ou digita "teste 3". Sugerir um nome que já descreve o
 * conteúdo resolve os dois problemas — e continua editável.
 */
export function nomeSugerido(
  config: Pick<ConfiguracaoDaLista, 'quantidade' | 'tipo' | 'dificuldade'> &
    Partial<Pick<ConfiguracaoDaLista, 'apenasErradas'>>,
  nomesDosAssuntos: string[] = [],
): string {
  // "Erradas" é o recorte mais específico dos três: quem ligou isso quer o
  // nome dizendo "revisão", não repetindo o assunto que ele já escolheu antes.
  const prefixo = config.apenasErradas ? 'Revisão' : ''

  if (nomesDosAssuntos.length === 1) {
    return `${prefixo ? `${prefixo}: ` : ''}${nomesDosAssuntos[0]} — ${config.quantidade} questões`
  }
  if (nomesDosAssuntos.length > 1) {
    return `${prefixo ? `${prefixo}: ` : ''}${nomesDosAssuntos[0]} +${nomesDosAssuntos.length - 1} — ${config.quantidade} questões`
  }
  if (config.apenasErradas) return `Revisão de erros — ${config.quantidade} questões`
  if (config.dificuldade) {
    return `${config.quantidade} questões ${ROTULO_DIFICULDADE[config.dificuldade]}`
  }
  if (config.tipo) return `${config.quantidade} questões ${ROTULO_TIPO[config.tipo]}`
  return `Aleatórias — ${config.quantidade} questões`
}

export interface Veredito {
  ok: boolean
  motivo?: string
  /** Aviso que não impede criar, mas muda o que a pessoa vai receber. */
  aviso?: string
}

/**
 * Dá para criar esta lista?
 *
 * `disponiveis` é quantas questões casam com os filtros. Pedir 50 quando
 * existem 12 não é erro: a lista é criada com as 12 e o aviso diz isso antes.
 * Recusar seria mandar a pessoa adivinhar qual número cabe.
 */
export function avaliarConfiguracao(
  config: ConfiguracaoDaLista,
  disponiveis: number | null,
): Veredito {
  if (!config.nome.trim()) return { ok: false, motivo: 'Dê um nome para a lista' }
  if (config.quantidade < 1) return { ok: false, motivo: 'Escolha ao menos uma questão' }
  if (config.quantidade > QUANTIDADE_MAXIMA) {
    return { ok: false, motivo: `O máximo por lista é ${QUANTIDADE_MAXIMA} questões` }
  }

  if (disponiveis === null) return { ok: true }

  if (disponiveis === 0) {
    return {
      ok: false,
      motivo: 'Nenhuma questão combina com esses filtros. Tire um filtro e tente de novo.',
    }
  }

  if (disponiveis < config.quantidade) {
    return {
      ok: true,
      aviso: `Só existem ${disponiveis} ${disponiveis === 1 ? 'questão' : 'questões'} com esses filtros — a lista vai ter ${disponiveis}.`,
    }
  }

  return { ok: true }
}

/** O corpo que a rota de sorteio espera. Concentrado aqui para os dois lados não divergirem. */
export function corpoDaRequisicao(config: ConfiguracaoDaLista) {
  return {
    nome: config.nome.trim(),
    quantidade: config.quantidade,
    moduloId: config.moduloIds.join(',') || undefined,
    topicoId: config.topicoIds.join(',') || undefined,
    subtopicoId: config.subtopicoIds.join(',') || undefined,
    tipo: config.tipo || undefined,
    dificuldade: config.dificuldade || undefined,
    anos: config.anos.length > 0 ? config.anos : undefined,
    periodos: config.periodos.length > 0 ? config.periodos : undefined,
    modoResposta: config.modoResposta,
    excluirJaResolvidas: config.excluirJaResolvidas || undefined,
    apenasErradas: config.apenasErradas || undefined,
    comImagem: config.comImagem || undefined,
    comExplicacao: config.comExplicacao || undefined,
  }
}

/* =================== O QUE EXISTE NO RECORTE =================== */

/**
 * O que o recorte de assuntos escolhido REALMENTE tem, vindo de
 * `/api/banco/facetas`.
 *
 * Existe porque a tela oferecia sempre os mesmos filtros — tipo, dificuldade,
 * período, ano, "só com imagem", "só as que errei" — venham eles do acervo
 * inteiro ou não. Quem marcava um módulo de Bioquímica e pedia "só com imagem"
 * percorria os três passos até o botão de criar para então receber "nenhuma
 * questão combina com esses filtros". A tela ofereceu, deixou avançar, e só no
 * fim contou que aquilo não existia ali.
 *
 * Com as contagens por opção, o que não tem questão nenhuma simplesmente não é
 * desenhado: o caminho para a frustração deixa de ser oferecido.
 */
export interface FacetasDoRecorte {
  /** Questões no recorte de assunto, sem nenhum outro filtro. */
  total: number
  /** Por tipo: `{ objetiva: 120, discursiva: 0 }`. */
  tipos: Record<string, number>
  /** Por dificuldade: `{ facil: 12, medio: 0, dificil: 40 }`. */
  dificuldades: Record<string, number>
  anos: Array<{ ano: number; total: number }>
  periodos: Array<{ periodo: string; total: number }>
  comImagem: number
  comExplicacao: number
  /** Do recorte, quantas esta conta já respondeu. */
  jaResolvidas: number
  /** Do recorte, quantas esta conta errou na última tentativa. */
  erradas: number
}

/** O recorte de ASSUNTO — a única pergunta que as facetas respondem. */
export function parametrosDasFacetas(filtros: FiltrosDaLista): URLSearchParams {
  const p = new URLSearchParams()
  if (filtros.moduloIds.length) p.set('moduloId', filtros.moduloIds.join(','))
  if (filtros.topicoIds.length) p.set('topicoId', filtros.topicoIds.join(','))
  if (filtros.subtopicoIds.length) p.set('subtopicoId', filtros.subtopicoIds.join(','))
  return p
}

/**
 * Apaga dos filtros tudo o que o recorte atual não tem.
 *
 * Esconder a opção não basta: quem marcou "difícil" num módulo e depois trocou
 * para outro, onde não há nenhuma difícil, ficaria com um filtro INVISÍVEL
 * zerando a contagem — e sem nada na tela explicando por quê. Some a opção,
 * some o filtro.
 *
 * `facetas` nula significa "ainda não sei": nada é apagado, porque apagar por
 * desconhecimento é pior do que oferecer demais.
 */
export function reconciliarComAsFacetas(
  filtros: FiltrosDaLista,
  facetas: FacetasDoRecorte | null,
): FiltrosDaLista {
  if (!facetas) return filtros

  const anos = new Set(facetas.anos.map((a) => a.ano))
  const periodos = new Set(facetas.periodos.map((p) => p.periodo))

  const proximo: FiltrosDaLista = {
    ...filtros,
    tipo: filtros.tipo && (facetas.tipos[filtros.tipo] || 0) > 0 ? filtros.tipo : '',
    dificuldade:
      filtros.dificuldade && (facetas.dificuldades[filtros.dificuldade] || 0) > 0
        ? filtros.dificuldade
        : '',
    anos: filtros.anos.filter((a) => anos.has(a)),
    periodos: filtros.periodos.filter((p) => periodos.has(p)),
    comImagem: filtros.comImagem && facetas.comImagem > 0,
    comExplicacao: filtros.comExplicacao && facetas.comExplicacao > 0,
    excluirJaResolvidas: filtros.excluirJaResolvidas && podeExcluirJaResolvidas(facetas),
    apenasErradas: filtros.apenasErradas && facetas.erradas > 0,
  }

  // Igualdade por valor: devolver o mesmo objeto quando nada mudou evita um
  // ciclo de renderização (o efeito que chama isto grava no mesmo estado que
  // lê).
  return mesmosFiltros(filtros, proximo) ? filtros : proximo
}

/**
 * "Ainda não resolvi" só faz sentido quando há o que esconder E o que sobrar.
 *
 * Sem nenhuma resolvida o filtro não tira nada (é ruído); com TODAS resolvidas
 * ele não deixa nada (é a lista vazia que esta reconciliação existe para
 * evitar).
 */
export function podeExcluirJaResolvidas(facetas: FacetasDoRecorte): boolean {
  return facetas.jaResolvidas > 0 && facetas.jaResolvidas < facetas.total
}

function mesmosFiltros(a: FiltrosDaLista, b: FiltrosDaLista): boolean {
  return (
    a.tipo === b.tipo &&
    a.dificuldade === b.dificuldade &&
    a.comImagem === b.comImagem &&
    a.comExplicacao === b.comExplicacao &&
    a.excluirJaResolvidas === b.excluirJaResolvidas &&
    a.apenasErradas === b.apenasErradas &&
    a.anos.length === b.anos.length &&
    a.periodos.length === b.periodos.length &&
    a.anos.every((x, i) => x === b.anos[i]) &&
    a.periodos.every((x, i) => x === b.periodos[i])
  )
}

/** Os mesmos filtros como parâmetros de consulta, para contar quantas existem. */
export function parametrosDeContagem(filtros: FiltrosDaLista): URLSearchParams {
  const p = new URLSearchParams()
  p.set('limit', '1')
  p.set('page', '1')
  // Só o `paginacao.total` desta resposta é lido. `campos=lista` não muda o
  // número — muda o tamanho da questão que vem junto com ele, e esta chamada
  // dispara a cada mexida nos filtros enquanto a pessoa monta a lista.
  p.set('campos', 'lista')
  if (filtros.moduloIds.length) p.set('moduloId', filtros.moduloIds.join(','))
  if (filtros.topicoIds.length) p.set('topicoId', filtros.topicoIds.join(','))
  if (filtros.subtopicoIds.length) p.set('subtopicoId', filtros.subtopicoIds.join(','))
  if (filtros.tipo) p.set('tipo', filtros.tipo)
  if (filtros.dificuldade) p.set('dificuldade', filtros.dificuldade)
  if (filtros.anos.length) p.set('anos', filtros.anos.join(','))
  if (filtros.periodos.length) p.set('periodos', filtros.periodos.join(','))
  if (filtros.apenasErradas) p.set('apenasErradas', 'true')
  else if (filtros.excluirJaResolvidas) p.set('apenasNaoResolvidas', 'true')
  if (filtros.comImagem) p.set('comImagem', 'true')
  if (filtros.comExplicacao) p.set('comExplicacao', 'true')
  return p
}
