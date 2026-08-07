'use client'

/**
 * Progresso, favoritos, caderno e retomada — persistidos no navegador.
 *
 * ## Por que armazenamento local
 *
 * O GradeX tem backend, mas o Manual da Histologia é gratuito e sem login
 * (ver `docs/adr/0001-licenca-manual-histologia.md`): amarrá-lo a conta criaria
 * exatamente o vínculo com benefício pago que a licença NãoComercial proíbe.
 * Então o progresso vive no dispositivo, com três garantias que o `localStorage`
 * não dá de graça:
 *
 * 1. **versão de schema e migração** — dados de uma versão anterior são
 *    convertidos, nunca descartados em silêncio;
 * 2. **tolerância a corrupção** — JSON inválido, cota estourada ou
 *    `localStorage` bloqueado (navegação privada, cookies de terceiros) não
 *    quebram a página; o módulo apenas deixa de persistir;
 * 3. **exportar e apagar** — o aluno leva os dados embora ou os elimina, sem
 *    depender de nós.
 *
 * As notas do caderno **nunca** saem do dispositivo: não vão para analytics,
 * não vão para o servidor, não entram em nenhum evento.
 */

import { useCallback, useEffect, useState } from 'react'

const CHAVE = 'histologia-progresso'
export const VERSAO_ATUAL = 2

export interface NotaDeLamina {
  texto: string
  atualizadoEm: number
}

export interface ResultadoDeQuiz {
  acertos: number
  total: number
  concluidoEm: number
  /** Ids de questões erradas, para a revisão dirigida. */
  erros: string[]
}

export interface Progresso {
  versao: number
  /** Rotas de lâminas concluídas → timestamp. */
  concluidas: Record<string, number>
  /** Rotas favoritadas → timestamp. */
  favoritos: Record<string, number>
  /** Rotas visitadas recentemente, mais recente primeiro. */
  recentes: string[]
  /** Notas privadas por rota. */
  caderno: Record<string, NotaDeLamina>
  /** `rota#overlay` marcados como "a revisar". */
  aRevisar: Record<string, number>
  /** Melhor resultado por quiz. */
  quizzes: Record<string, ResultadoDeQuiz>
  /** Estado salvo de quiz em andamento, para retomada. */
  quizEmAndamento: Record<string, { semente: number; respostas: Record<string, string[]>; indice: number }>
  /** Última lâmina aberta — alimenta o "continuar de onde parei". */
  ultima: { rota: string; titulo: string; em: number } | null
  /** Laboratórios concluídos → timestamp. */
  laboratorios: Record<string, number>
}

export const PROGRESSO_VAZIO: Progresso = {
  versao: VERSAO_ATUAL,
  concluidas: {},
  favoritos: {},
  recentes: [],
  caderno: {},
  aRevisar: {},
  quizzes: {},
  quizEmAndamento: {},
  ultima: null,
  laboratorios: {},
}

const MAXIMO_RECENTES = 40

/* ─────────────────────────── migração ─────────────────────────── */

/**
 * Converte qualquer versão anterior para a atual.
 *
 * A regra é aditiva: campos novos ganham valor padrão, campos antigos são
 * preservados. Quando um campo precisar mudar de forma, a conversão entra aqui
 * como um passo explícito — nunca como um `delete`.
 */
function migrar(bruto: unknown): Progresso {
  if (!bruto || typeof bruto !== 'object') return { ...PROGRESSO_VAZIO }
  const dados = bruto as Partial<Progresso> & { versao?: number }

  const objeto = <T,>(v: unknown): Record<string, T> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, T>) : {}

  const migrado: Progresso = {
    versao: VERSAO_ATUAL,
    concluidas: objeto<number>(dados.concluidas),
    favoritos: objeto<number>(dados.favoritos),
    recentes: Array.isArray(dados.recentes) ? dados.recentes.filter((r) => typeof r === 'string') : [],
    caderno: objeto<NotaDeLamina>(dados.caderno),
    aRevisar: objeto<number>(dados.aRevisar),
    quizzes: objeto<ResultadoDeQuiz>(dados.quizzes),
    // Introduzido na versão 2. Quem vem da 1 simplesmente não tem quiz salvo.
    quizEmAndamento: objeto(dados.quizEmAndamento),
    ultima:
      dados.ultima && typeof dados.ultima === 'object' && typeof dados.ultima.rota === 'string'
        ? dados.ultima
        : null,
    laboratorios: objeto<number>(dados.laboratorios),
  }
  return migrado
}

/* ─────────────────────────── persistência ─────────────────────────── */

export function lerProgresso(): Progresso {
  if (typeof window === 'undefined') return { ...PROGRESSO_VAZIO }
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return { ...PROGRESSO_VAZIO }
    return migrar(JSON.parse(bruto))
  } catch {
    // JSON corrompido ou storage indisponível. Começar do zero é melhor que
    // derrubar a página inteira por causa do histórico de estudo.
    return { ...PROGRESSO_VAZIO }
  }
}

function gravar(progresso: Progresso): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(progresso))
    return true
  } catch {
    // Cota estourada ou storage bloqueado. A sessão continua funcionando em
    // memória; só não sobrevive ao recarregamento.
    return false
  }
}

/* ─────────────────────────── hook ─────────────────────────── */

const ouvintes = new Set<(p: Progresso) => void>()
let emMemoria: Progresso | null = null

function atualizar(mutacao: (p: Progresso) => Progresso) {
  const atual = emMemoria ?? lerProgresso()
  const proximo = mutacao(atual)
  emMemoria = proximo
  gravar(proximo)
  ouvintes.forEach((o) => o(proximo))
}

/**
 * Estado de progresso compartilhado entre todos os componentes montados.
 *
 * O estado inicial é o vazio, e a leitura do `localStorage` acontece no efeito:
 * ler durante a renderização faria o HTML do servidor divergir do primeiro
 * render do cliente e o React descartaria a árvore inteira.
 */
export function useProgresso() {
  const [progresso, setProgresso] = useState<Progresso>(PROGRESSO_VAZIO)
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    const inicial = emMemoria ?? lerProgresso()
    emMemoria = inicial
    setProgresso(inicial)
    setCarregado(true)
    ouvintes.add(setProgresso)
    return () => {
      ouvintes.delete(setProgresso)
    }
  }, [])

  const marcarVisita = useCallback((rota: string, titulo: string) => {
    atualizar((p) => ({
      ...p,
      recentes: [rota, ...p.recentes.filter((r) => r !== rota)].slice(0, MAXIMO_RECENTES),
      ultima: { rota, titulo, em: Date.now() },
    }))
  }, [])

  const alternarConcluida = useCallback((rota: string) => {
    atualizar((p) => {
      const concluidas = { ...p.concluidas }
      if (concluidas[rota]) delete concluidas[rota]
      else concluidas[rota] = Date.now()
      return { ...p, concluidas }
    })
  }, [])

  const alternarFavorito = useCallback((rota: string) => {
    atualizar((p) => {
      const favoritos = { ...p.favoritos }
      if (favoritos[rota]) delete favoritos[rota]
      else favoritos[rota] = Date.now()
      return { ...p, favoritos }
    })
  }, [])

  const alternarARevisar = useCallback((rota: string, overlay: string) => {
    const chave = `${rota}#${overlay}`
    atualizar((p) => {
      const aRevisar = { ...p.aRevisar }
      if (aRevisar[chave]) delete aRevisar[chave]
      else aRevisar[chave] = Date.now()
      return { ...p, aRevisar }
    })
  }, [])

  const salvarNota = useCallback((rota: string, texto: string) => {
    atualizar((p) => {
      const caderno = { ...p.caderno }
      if (texto.trim()) caderno[rota] = { texto, atualizadoEm: Date.now() }
      else delete caderno[rota]
      return { ...p, caderno }
    })
  }, [])

  const registrarQuiz = useCallback((slug: string, resultado: ResultadoDeQuiz) => {
    atualizar((p) => {
      const anterior = p.quizzes[slug]
      // Guardamos o melhor resultado, não o último: refazer um quiz para revisar
      // erros não deveria apagar um desempenho melhor.
      const melhor =
        !anterior || resultado.acertos / resultado.total > anterior.acertos / anterior.total
          ? resultado
          : anterior
      const emAndamento = { ...p.quizEmAndamento }
      delete emAndamento[slug]
      return { ...p, quizzes: { ...p.quizzes, [slug]: melhor }, quizEmAndamento: emAndamento }
    })
  }, [])

  const salvarQuizEmAndamento = useCallback(
    (slug: string, estado: Progresso['quizEmAndamento'][string]) => {
      atualizar((p) => ({ ...p, quizEmAndamento: { ...p.quizEmAndamento, [slug]: estado } }))
    },
    [],
  )

  const concluirLaboratorio = useCallback((id: string) => {
    atualizar((p) => ({ ...p, laboratorios: { ...p.laboratorios, [id]: Date.now() } }))
  }, [])

  const apagarTudo = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAVE)
    } catch {
      /* storage indisponível: o estado em memória abaixo já resolve */
    }
    emMemoria = { ...PROGRESSO_VAZIO }
    ouvintes.forEach((o) => o(emMemoria!))
  }, [])

  const exportar = useCallback(() => {
    const dados = emMemoria ?? lerProgresso()
    return JSON.stringify({ ...dados, exportadoEm: new Date().toISOString() }, null, 2)
  }, [])

  return {
    progresso,
    carregado,
    marcarVisita,
    alternarConcluida,
    alternarFavorito,
    alternarARevisar,
    salvarNota,
    registrarQuiz,
    salvarQuizEmAndamento,
    concluirLaboratorio,
    apagarTudo,
    exportar,
  }
}
