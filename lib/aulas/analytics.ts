/**
 * Números das aulas (§26, §27).
 *
 * A parte difícil aqui não é somar — é somar sem mentir, e há duas armadilhas
 * que estragariam o painel inteiro:
 *
 * **1. As conclusões antigas não estão em `aulas_progresso`.**
 * Antes da reformulação, conclusão era um id dentro de
 * `aulas_postagens.usuariosConcluidos`. Contar só a coleção nova mostraria um
 * colapso de engajamento no dia do deploy — um número falso que faria alguém
 * tomar decisão sobre conteúdo. As duas escritas de hoje (`salvarBatida` e
 * `definirConclusaoManual`) mantêm aquele array em dia, então ele é a fonte que
 * cobre a história inteira, antes e depois.
 *
 * **2. Quem concluiu necessariamente começou.**
 * Mas "começou" só existe no modelo novo. Dividir conclusões (que incluem o
 * histórico) por inícios (que não incluem) daria taxas acima de 100%. Por isso
 * o total de inícios é, no mínimo, o total de conclusões — é a única leitura
 * que não inventa nem esconde ninguém.
 *
 * O módulo é puro: recebe o resultado bruto da agregação e os documentos das
 * aulas, devolve os números. Assim as duas armadilhas acima ficam presas em
 * teste, e não dependem de olhar um painel em produção para perceber.
 */

/** O que a agregação sobre `aulas_progresso` devolve por aula. */
export interface BrutoDoProgresso {
  aulaId: string
  /** Registros com algum avanço no modelo novo. */
  iniciaramNovo: number
  concluiramNovo: number
  somaPercentual: number
  registros: number
  /** Soma dos segundos de parada entre quem começou e não terminou. */
  paradaSoma: number
  paradaN: number
  ultimaAtividade?: Date | string | null
}

export interface AulaParaAnalytics {
  _id: string
  titulo: string
  setorId?: string
  moduloId?: string
  oculta?: boolean
  dataLiberacao?: Date | string | null
  /** Modelo antigo de conclusão — carrega a história anterior à reformulação. */
  usuariosConcluidos?: string[]
  videoEmbed?: string
  linkOuEmbed?: string
  vinculoMaterial?: { materialId?: string } | null
}

export interface NumerosDaAula {
  aulaId: string
  titulo: string
  setorId?: string
  oculta: boolean
  iniciaram: number
  concluiram: number
  /** 0 a 100. `null` quando ninguém começou — não é zero, é "sem dado". */
  taxaConclusao: number | null
  percentualMedio: number | null
  /** Segundo médio em que quem não terminou parou. `null` sem dado. */
  paradaMediaSegundos: number | null
  ultimaAtividade: Date | null
  semConteudo: boolean
}

function paraData(valor: unknown): Date | null {
  if (!valor) return null
  const d = valor instanceof Date ? valor : new Date(String(valor))
  return Number.isNaN(d.getTime()) ? null : d
}

export function numerosDaAula(aula: AulaParaAnalytics, bruto?: BrutoDoProgresso): NumerosDaAula {
  const legado = Array.isArray(aula.usuariosConcluidos) ? aula.usuariosConcluidos.length : 0

  // O array antigo é mantido pelas duas escritas de hoje, então ele já contém
  // as conclusões novas também. Ainda assim tomamos o maior dos dois: se uma
  // gravação no array falhar, o painel erra para MENOS conclusões do que houve,
  // e subnotificar engajamento é pior do que a redundância de comparar.
  const concluiram = Math.max(legado, bruto?.concluiramNovo || 0)

  // Quem concluiu começou — mesmo que o começo seja anterior ao modelo novo.
  const iniciaram = Math.max(bruto?.iniciaramNovo || 0, concluiram)

  const percentualMedio =
    bruto && bruto.registros > 0 ? Math.round(bruto.somaPercentual / bruto.registros) : null

  const paradaMediaSegundos =
    bruto && bruto.paradaN > 0 ? Math.round(bruto.paradaSoma / bruto.paradaN) : null

  return {
    aulaId: String(aula._id),
    titulo: aula.titulo,
    setorId: aula.setorId,
    oculta: aula.oculta === true,
    iniciaram,
    concluiram,
    taxaConclusao: iniciaram > 0 ? Math.round((concluiram / iniciaram) * 100) : null,
    percentualMedio,
    paradaMediaSegundos,
    ultimaAtividade: paraData(bruto?.ultimaAtividade),
    semConteudo:
      !aula.videoEmbed && !aula.linkOuEmbed && !aula.vinculoMaterial?.materialId,
  }
}

export interface ResumoGeral {
  totalAulas: number
  publicadas: number
  ocultas: number
  agendadas: number
  semConteudo: number
  /** Soma de inícios distintos por aula — não é gente única na plataforma. */
  inicios: number
  conclusoes: number
  /** Média das taxas das aulas que têm dado. `null` quando nenhuma tem. */
  taxaMedia: number | null
}

export function resumirGeral(
  aulas: AulaParaAnalytics[],
  numeros: Map<string, NumerosDaAula>,
  agora: Date = new Date(),
): ResumoGeral {
  let publicadas = 0
  let ocultas = 0
  let agendadas = 0
  let semConteudo = 0
  let inicios = 0
  let conclusoes = 0

  const taxas: number[] = []

  for (const aula of aulas) {
    const n = numeros.get(String(aula._id))
    if (!n) continue

    if (aula.oculta) ocultas += 1
    else {
      const libera = paraData(aula.dataLiberacao)
      if (libera && libera > agora) agendadas += 1
      else publicadas += 1
    }

    if (n.semConteudo) semConteudo += 1
    inicios += n.iniciaram
    conclusoes += n.concluiram
    if (n.taxaConclusao !== null) taxas.push(n.taxaConclusao)
  }

  return {
    totalAulas: aulas.length,
    publicadas,
    ocultas,
    agendadas,
    semConteudo,
    inicios,
    conclusoes,
    // Média das taxas por aula, e não conclusões/inícios global: uma aula com
    // 3 alunos e 100% não deve sumir atrás de uma com 3000 e 10%. O painel
    // pergunta "as aulas estão sendo terminadas?", não "quantas vezes no total".
    taxaMedia: taxas.length > 0 ? Math.round(taxas.reduce((a, b) => a + b, 0) / taxas.length) : null,
  }
}

export type TipoDeAlerta = 'sem-conteudo' | 'ninguem-concluiu' | 'abandono' | 'sem-atividade'

export interface Alerta {
  tipo: TipoDeAlerta
  aulaId: string
  titulo: string
  detalhe: string
}

/** Quantos inícios uma aula precisa ter para as taxas dela significarem algo. */
export const MINIMO_PARA_JULGAR = 5

/** Abaixo desta taxa a aula é tratada como abandonada, não como difícil. */
export const TAXA_DE_ABANDONO = 30

/**
 * O que o admin precisa olhar hoje.
 *
 * Com trezentas aulas, uma tabela ordenável não é um painel — é uma planilha
 * que ninguém varre. Esta lista aponta o que está errado, e cada alerta é
 * acionável: publicada sem conteúdo, ninguém termina, todo mundo para no mesmo
 * lugar.
 *
 * Aulas com poucos inícios ficam de fora de propósito: uma aula com 2 alunos e
 * 0 conclusões não é um problema de conteúdo, é falta de amostra — e mandar o
 * admin investigar isso gasta a confiança dele no painel.
 */
export function levantarAlertas(numeros: NumerosDaAula[], limite = 20): Alerta[] {
  const alertas: Alerta[] = []

  for (const n of numeros) {
    // Publicada e vazia é o pior caso: o aluno abre e não há nada.
    if (n.semConteudo && !n.oculta) {
      alertas.push({
        tipo: 'sem-conteudo',
        aulaId: n.aulaId,
        titulo: n.titulo,
        detalhe: 'Publicada sem vídeo, link ou material vinculado.',
      })
      continue
    }

    if (n.iniciaram < MINIMO_PARA_JULGAR) continue

    if (n.concluiram === 0) {
      alertas.push({
        tipo: 'ninguem-concluiu',
        aulaId: n.aulaId,
        titulo: n.titulo,
        detalhe: `${n.iniciaram} pessoa(s) começaram e nenhuma terminou.`,
      })
      continue
    }

    if (n.taxaConclusao !== null && n.taxaConclusao < TAXA_DE_ABANDONO) {
      alertas.push({
        tipo: 'abandono',
        aulaId: n.aulaId,
        titulo: n.titulo,
        detalhe: `Só ${n.taxaConclusao}% de quem começa termina.`,
      })
    }
  }

  // Sem conteúdo primeiro: é o único que quebra a aula para o aluno agora.
  const peso: Record<TipoDeAlerta, number> = {
    'sem-conteudo': 0,
    'ninguem-concluiu': 1,
    abandono: 2,
    'sem-atividade': 3,
  }
  return alertas.sort((a, b) => peso[a.tipo] - peso[b.tipo]).slice(0, limite)
}

/** Agrupa por curso para a visão de cima. */
export interface NumerosDoCurso {
  setorId: string
  nome: string
  aulas: number
  inicios: number
  conclusoes: number
  taxaMedia: number | null
}

export function agruparPorCurso(
  numeros: NumerosDaAula[],
  nomeDoCurso: Map<string, string>,
): NumerosDoCurso[] {
  const mapa = new Map<string, { aulas: number; inicios: number; conclusoes: number; taxas: number[] }>()

  for (const n of numeros) {
    const id = n.setorId || '__sem_curso__'
    const atual = mapa.get(id) || { aulas: 0, inicios: 0, conclusoes: 0, taxas: [] }
    atual.aulas += 1
    atual.inicios += n.iniciaram
    atual.conclusoes += n.concluiram
    if (n.taxaConclusao !== null) atual.taxas.push(n.taxaConclusao)
    mapa.set(id, atual)
  }

  return Array.from(mapa.entries())
    .map(([setorId, v]) => ({
      setorId,
      nome: nomeDoCurso.get(setorId) || 'Fora de qualquer curso',
      aulas: v.aulas,
      inicios: v.inicios,
      conclusoes: v.conclusoes,
      taxaMedia: v.taxas.length
        ? Math.round(v.taxas.reduce((a, b) => a + b, 0) / v.taxas.length)
        : null,
    }))
    .sort((a, b) => b.inicios - a.inicios || a.nome.localeCompare(b.nome, 'pt-BR'))
}
