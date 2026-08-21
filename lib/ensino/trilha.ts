/**
 * Trilhas de Ensino — o núcleo da nova área de Aulas (§1, §6, §7, §8, §27, §28).
 *
 * O QUE UMA TRILHA É, E O QUE ELA NÃO É
 *
 * Uma Trilha é um CAMINHO, não um pacote. Ela não contém aulas: ela as
 * referencia. Isso não é detalhe de implementação — é a regra que sustenta todo
 * o resto do sistema. "Lei de Frank-Starling" é uma aula só, que aparece em
 * "Fundamentos da Fisiologia Cardiovascular", em "Insuficiência Cardíaca do
 * Zero" e em "Hemodinâmica para o Ciclo Clínico" sem existir três vezes. Trocar
 * o vídeo dela conserta as três Trilhas de uma vez; apagar a Trilha não apaga
 * a aula (§33).
 *
 * A tentação óbvia — dar à Trilha uma cópia das aulas, com título e vídeo
 * próprios — resolve a tela de hoje e cria o problema de amanhã: quatro
 * registros do mesmo conteúdo divergindo na primeira edição, e um acervo que
 * cresce por multiplicação em vez de por reuso. Por isso o item da etapa é um
 * par `{ tipo, refId }` e nada mais: o que ele guarda é a REFERÊNCIA e a
 * ORDEM. Tudo que é conteúdo mora na aula.
 *
 * POR QUE ETAPAS, E NÃO UMA LISTA
 *
 * Trinta vídeos em sequência não são um caminho, são uma playlist (§7). As
 * etapas dão à Trilha a única coisa que a playlist não tem: uma narrativa —
 * "Antes da doença", "Entenda a doença", "Diagnóstico", "Tratamento". O aluno
 * lê a estrutura e já entende o percurso antes de assistir ao primeiro minuto.
 *
 * Este módulo é PURO: tipos, normalização e o cálculo de progresso e de próximo
 * passo. Nenhuma consulta. O progresso da Trilha é DERIVADO do progresso das
 * aulas (`aulas_progresso`, que já existia), nunca guardado em duplicata — se
 * fosse guardado, a mesma aula concluída em duas Trilhas exigiria escrever nos
 * dois lugares e a primeira falha de rede deixaria os números discordando para
 * sempre.
 */

import { comecouDeVerdade } from '@/lib/aulas/progresso'

/* =================== VOCABULÁRIO =================== */

export const NIVEIS_DE_TRILHA = ['iniciante', 'intermediario', 'avancado'] as const
export type NivelDaTrilha = (typeof NIVEIS_DE_TRILHA)[number]

export const ROTULO_DO_NIVEL_DA_TRILHA: Record<NivelDaTrilha, string> = {
  iniciante: 'Do zero',
  intermediario: 'Intermediária',
  avancado: 'Avançada',
}

export const SITUACOES_DE_TRILHA = ['rascunho', 'publicada', 'arquivada'] as const
export type SituacaoDaTrilha = (typeof SITUACOES_DE_TRILHA)[number]

/**
 * O que uma etapa pode conter.
 *
 * `aula` é o caso central. Os outros são "conteúdos complementares" (§6): um
 * PDF avulso, um deck de flashcards, um material de /materiais, uma prova do
 * banco de questões ou um link externo. Ter o tipo desde já é o que permite
 * acrescentar questões, casos clínicos e mapas mentais depois sem migrar
 * nenhuma Trilha (§3).
 */
export const TIPOS_DE_ITEM = ['aula', 'material', 'flashcards', 'prova', 'link'] as const
export type TipoDeItemDaTrilha = (typeof TIPOS_DE_ITEM)[number]

/* =================== O DOCUMENTO =================== */

export interface ItemDaEtapa {
  /** Identificador estável do item DENTRO da trilha (para arrastar e soltar). */
  id: string
  tipo: TipoDeItemDaTrilha
  /** Id da aula / material / deck / prova. Para `link`, fica vazio. */
  refId: string
  /** Só para `link`. */
  url?: string
  /** Rótulo opcional — sobrepõe o título do referenciado só na exibição. */
  rotulo?: string
  /** Nota curta do professor: "assista antes de começar o tratamento". */
  nota?: string
  /**
   * Item obrigatório para a Trilha contar como concluída.
   *
   * Complementar (`false`) entra no caminho sem pesar no percentual — é o que
   * permite pendurar um PDF de aprofundamento sem transformar a barra de
   * progresso do aluno numa dívida.
   */
  obrigatorio?: boolean
}

export interface EtapaDaTrilha {
  id: string
  titulo: string
  descricao?: string
  itens: ItemDaEtapa[]
}

export interface TrilhaDeEnsino {
  _id: string
  slug: string
  titulo: string
  /** Frase curta sob o título, na capa e nos cartões. */
  subtitulo?: string
  descricao?: string
  /** "Ao final você será capaz de..." (§8). */
  objetivo?: string
  /** Lista de competências ao concluir (§8). */
  aprendizados?: string[]
  capa?: { tipo: 'imagem' | 'cor'; imagem?: string; cor?: string } | null
  nivel?: NivelDaTrilha
  /** Para quem é: "Ciclo Clínico", "Internato", "Residência". Texto livre. */
  publico?: string
  /** Estimativa em minutos. Quando ausente, é somada das aulas. */
  duracaoEstimadaMin?: number
  etapas: EtapaDaTrilha[]
  /** Trilhas recomendadas antes desta (§19). Recomendação, não bloqueio. */
  prerequisitos?: string[]
  tags?: string[]
  /** Localização opcional na taxonomia — alimenta "Trilhas de Cardiologia". */
  areaId?: string | null
  moduloId?: string | null
  topicoId?: string | null
  /** Regras de acesso, no MESMO formato das aulas (§24). */
  regrasAcesso?: any
  certificado?: { ativo: boolean; cargaHoraria?: number } | null
  situacao: SituacaoDaTrilha
  destaque?: boolean
  ordem?: number
  criadoEm?: Date | string
  atualizadoEm?: Date | string
  publicadaEm?: Date | string | null
}

/* =================== NORMALIZAÇÃO =================== */

const TETO_ETAPAS = 40
const TETO_ITENS_POR_ETAPA = 80
const TEXTO_CURTO = 180
const TEXTO_LONGO = 4000

const ehObjectId = (valor: unknown) => /^[a-f0-9]{24}$/i.test(String(valor || ''))

/** Identificador curto e estável para etapa/item, gerado no servidor. */
export function novoIdLocal(prefixo = 'e'): string {
  return `${prefixo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

function texto(valor: unknown, max = TEXTO_CURTO): string {
  return String(valor ?? '').trim().slice(0, max)
}

/**
 * Limpa uma etapa vinda da tela.
 *
 * Itens sem referência válida são DESCARTADOS em silêncio — nunca guardados
 * "pela metade". Um item apontando para uma aula que não existe mais viraria um
 * buraco no caminho do aluno, e a tela não teria o que desenhar ali.
 */
export function normalizarEtapa(bruta: any, indice: number): EtapaDaTrilha {
  const itens: ItemDaEtapa[] = []
  const vistos = new Set<string>()

  for (const cru of Array.isArray(bruta?.itens) ? bruta.itens.slice(0, TETO_ITENS_POR_ETAPA) : []) {
    const tipo: TipoDeItemDaTrilha = (TIPOS_DE_ITEM as readonly string[]).includes(cru?.tipo)
      ? cru.tipo
      : 'aula'
    const refId = String(cru?.refId || '').trim()
    const url = texto(cru?.url, 500)

    if (tipo === 'link') {
      if (!/^https?:\/\//i.test(url)) continue
    } else if (!ehObjectId(refId)) {
      continue
    }

    // A MESMA aula duas vezes na mesma etapa é sempre engano de montagem; em
    // etapas diferentes pode ser proposital (rever o conceito antes do
    // tratamento), então a checagem é por etapa, não pela Trilha inteira.
    const chave = `${tipo}:${refId || url}`
    if (vistos.has(chave)) continue
    vistos.add(chave)

    itens.push({
      id: String(cru?.id || '').trim().slice(0, 40) || novoIdLocal('i'),
      tipo,
      refId: tipo === 'link' ? '' : refId,
      ...(tipo === 'link' ? { url } : {}),
      ...(cru?.rotulo ? { rotulo: texto(cru.rotulo) } : {}),
      ...(cru?.nota ? { nota: texto(cru.nota, 400) } : {}),
      // O padrão é obrigatório: complementar é a exceção, e um caminho em que
      // nada conta seria um caminho sem progresso.
      obrigatorio: cru?.obrigatorio !== false,
    })
  }

  return {
    id: String(bruta?.id || '').trim().slice(0, 40) || novoIdLocal(),
    titulo: texto(bruta?.titulo) || `Etapa ${indice + 1}`,
    ...(bruta?.descricao ? { descricao: texto(bruta.descricao, 600) } : {}),
    itens,
  }
}

export function normalizarEtapas(brutas: unknown): EtapaDaTrilha[] {
  if (!Array.isArray(brutas)) return []
  return brutas.slice(0, TETO_ETAPAS).map(normalizarEtapa)
}

export interface ProblemaNaTrilha {
  campo: string
  mensagem: string
}

/**
 * O que impede a Trilha de ser PUBLICADA.
 *
 * Rascunho não valida nada de propósito (§6/§30): a montagem é incremental —
 * criar a Trilha, dar título, ir juntando aulas ao longo da semana. Exigir tudo
 * de uma vez obrigaria o admin a preencher campos que ele ainda não sabe, e a
 * arquitetura toda foi pensada para uma equipe pequena publicando pouco a
 * pouco.
 */
export function validarPublicacao(trilha: Partial<TrilhaDeEnsino>): ProblemaNaTrilha[] {
  const problemas: ProblemaNaTrilha[] = []

  if (!texto(trilha.titulo)) {
    problemas.push({ campo: 'titulo', mensagem: 'A Trilha precisa de um título.' })
  }

  const etapas = trilha.etapas || []
  const total = etapas.reduce((soma, e) => soma + (e.itens?.length || 0), 0)
  if (total === 0) {
    problemas.push({
      campo: 'etapas',
      mensagem: 'Adicione pelo menos uma aula antes de publicar.',
    })
  }

  return problemas
}

/* =================== PROGRESSO =================== */

/** O que este módulo precisa saber sobre o progresso de uma aula. */
export interface ProgressoConhecido {
  concluida?: boolean
  percentual?: number
  /** Segundos assistidos — é o que separa "começou" de "abriu e saiu". */
  posicaoSegundos?: number
}

export interface ProgressoDaEtapa {
  etapaId: string
  titulo: string
  total: number
  concluidos: number
  percentual: number
  /** Todos os itens obrigatórios concluídos. */
  completa: boolean
}

export interface ProgressoDaTrilha {
  total: number
  concluidos: number
  percentual: number
  etapas: ProgressoDaEtapa[]
  /** O item que o aluno deve abrir agora. `null` quando terminou tudo. */
  proximo: { etapaId: string; item: ItemDaEtapa; indiceGlobal: number } | null
  /** Já mexeu em alguma coisa? Decide entre "Começar" e "Continuar" (§8). */
  iniciada: boolean
  concluida: boolean
}

/**
 * Todos os itens da Trilha, em ordem de estudo, achatados.
 *
 * É o que sustenta "aula anterior / próxima aula" atravessando a fronteira das
 * etapas (§9): terminar a última aula da Etapa 2 leva à primeira da Etapa 3,
 * sem o aluno voltar ao índice.
 */
export function achatarItens(
  trilha: Pick<TrilhaDeEnsino, 'etapas'>,
): Array<{ etapaId: string; etapaTitulo: string; etapaIndice: number; item: ItemDaEtapa }> {
  const saida: Array<{
    etapaId: string
    etapaTitulo: string
    etapaIndice: number
    item: ItemDaEtapa
  }> = []
  ;(trilha.etapas || []).forEach((etapa, etapaIndice) => {
    for (const item of etapa.itens || []) {
      saida.push({ etapaId: etapa.id, etapaTitulo: etapa.titulo, etapaIndice, item })
    }
  })
  return saida
}

/** Só as aulas — o que precisa de progresso, de acesso e de player. */
export function aulaIdsDaTrilha(trilha: Pick<TrilhaDeEnsino, 'etapas'>): string[] {
  const vistos = new Set<string>()
  for (const { item } of achatarItens(trilha)) {
    if (item.tipo === 'aula' && item.refId) vistos.add(item.refId)
  }
  return Array.from(vistos)
}

/**
 * O progresso completo da Trilha, derivado do progresso das aulas.
 *
 * REGRAS QUE MORAM AQUI E EM NENHUM OUTRO LUGAR
 *
 *  • só item OBRIGATÓRIO entra na conta — complementar não pode fazer a barra
 *    parar em 94% para sempre;
 *  • só item do tipo `aula` tem progresso rastreável hoje; material, deck e
 *    prova entram como complementares na conta até terem conclusão própria,
 *    porque contar como pendente algo que não dá para marcar como feito
 *    deixaria a Trilha impossível de concluir;
 *  • o "próximo" é o primeiro obrigatório não concluído, na ordem do caminho.
 *    Retomar o que está no meio ganha de começar o que vem depois — terminar o
 *    que se começou é o passo com menos atrito.
 */
export function calcularProgressoDaTrilha(
  trilha: Pick<TrilhaDeEnsino, 'etapas'>,
  progressoPorAula: Map<string, ProgressoConhecido>,
): ProgressoDaTrilha {
  const etapas: ProgressoDaEtapa[] = []
  let total = 0
  let concluidos = 0
  let iniciada = false
  let proximo: ProgressoDaTrilha['proximo'] = null
  let indiceGlobal = -1

  for (const etapa of trilha.etapas || []) {
    let totalEtapa = 0
    let concluidosEtapa = 0

    for (const item of etapa.itens || []) {
      indiceGlobal += 1
      const contabilizavel = item.tipo === 'aula' && item.obrigatorio !== false
      const progresso = item.tipo === 'aula' ? progressoPorAula.get(item.refId) : undefined

      // "Iniciada" usa o mesmo corte da retomada de aula, e não `percentual >
      // 0`: dois segundos acidentais num vídeo curto arredondam para 1%, e
      // isso bastava para a Trilha inteira aparecer em "Suas Trilhas" como
      // começada. Ver `comecouDeVerdade`.
      if (comecouDeVerdade(progresso)) iniciada = true

      if (!contabilizavel) continue
      totalEtapa += 1

      if (progresso?.concluida) {
        concluidosEtapa += 1
        continue
      }
      if (!proximo) proximo = { etapaId: etapa.id, item, indiceGlobal }
    }

    total += totalEtapa
    concluidos += concluidosEtapa
    etapas.push({
      etapaId: etapa.id,
      titulo: etapa.titulo,
      total: totalEtapa,
      concluidos: concluidosEtapa,
      percentual: totalEtapa > 0 ? Math.round((concluidosEtapa / totalEtapa) * 100) : 0,
      completa: totalEtapa > 0 && concluidosEtapa === totalEtapa,
    })
  }

  // Trilha sem aula obrigatória (só complementares) não é "0% concluída" — ela
  // não tem o que concluir, e mostrar uma barra vazia ali seria mentira.
  const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0

  return {
    total,
    concluidos,
    percentual,
    etapas,
    proximo,
    iniciada,
    concluida: total > 0 && concluidos === total,
  }
}

/**
 * A vizinhança do aluno dentro da Trilha (§9).
 *
 * Devolve a posição da aula atual no caminho, com a anterior e a próxima já
 * resolvidas. Fora da Trilha (aula avulsa — §4) devolve `null`, e a tela
 * simplesmente não desenha a navegação sequencial: a aula continua sendo
 * assistível sozinha.
 */
export interface PosicaoNaTrilha {
  indice: number
  total: number
  etapaId: string
  etapaTitulo: string
  etapaIndice: number
  totalDeEtapas: number
  anterior: ItemDaEtapa | null
  proxima: ItemDaEtapa | null
}

export function posicaoNaTrilha(
  trilha: Pick<TrilhaDeEnsino, 'etapas'>,
  aulaId: string,
): PosicaoNaTrilha | null {
  const plana = achatarItens(trilha)
  const indice = plana.findIndex((p) => p.item.tipo === 'aula' && p.item.refId === aulaId)
  if (indice < 0) return null

  const atual = plana[indice]
  return {
    indice,
    total: plana.length,
    etapaId: atual.etapaId,
    etapaTitulo: atual.etapaTitulo,
    etapaIndice: atual.etapaIndice,
    totalDeEtapas: (trilha.etapas || []).length,
    anterior: indice > 0 ? plana[indice - 1].item : null,
    proxima: indice < plana.length - 1 ? plana[indice + 1].item : null,
  }
}

/* =================== APRESENTAÇÃO =================== */

/** `"29 aulas · 4 etapas · ~6h"` — a linha de resumo do cartão da Trilha. */
export function resumirTrilha(
  trilha: Pick<TrilhaDeEnsino, 'etapas' | 'duracaoEstimadaMin'>,
  duracaoPorAula?: Map<string, number>,
): { aulas: number; etapas: number; minutos: number } {
  const aulas = aulaIdsDaTrilha(trilha)
  const etapas = (trilha.etapas || []).filter((e) => (e.itens || []).length > 0).length

  // A estimativa manual do admin ganha da soma: ela pode incluir leitura e
  // exercício, que nenhum vídeo mede.
  const somados = duracaoPorAula
    ? aulas.reduce((soma, id) => soma + (duracaoPorAula.get(id) || 0), 0)
    : 0

  return {
    aulas: aulas.length,
    etapas,
    minutos: trilha.duracaoEstimadaMin || Math.round(somados / 60),
  }
}

/** `375` → `"6h15"`. Para a linha de duração, que não precisa de segundos. */
export function minutosLegiveis(minutos: number): string {
  const total = Math.max(0, Math.round(Number(minutos) || 0))
  if (total <= 0) return ''
  if (total < 60) return `${total} min`
  const horas = Math.floor(total / 60)
  const resto = total % 60
  return resto > 0 ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`
}

/** O texto do botão principal da Trilha (§8). */
export function rotuloDoBotao(progresso: Pick<ProgressoDaTrilha, 'iniciada' | 'concluida'>): string {
  if (progresso.concluida) return 'Revisar a Trilha'
  if (progresso.iniciada) return 'Continuar de onde parei'
  return 'Começar Trilha'
}
