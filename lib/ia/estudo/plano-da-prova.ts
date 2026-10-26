/**
 * O plano de uma prova gerada por IA: o que cada questão vai cobrar, em que
 * formato, com que recurso visual e em que letra cai a correta.
 *
 * Decidir isso ANTES de chamar a IA é o que dá à prova cara de prova:
 *
 *  - os temas são distribuídos por igual (sem cinco questões do primeiro tema
 *    e nenhuma do último);
 *  - formatos e recursos se alternam na proporção pedida, em vez de a IA
 *    escolher sempre o mesmo;
 *  - a letra da correta vem de `sequenciaDeGabarito`, equilibrada na prova
 *    inteira — a IA nem é consultada sobre isso.
 *
 * A tela monta o plano e manda as vagas em lotes pequenos para
 * `/api/exams/[id]/generate-questions` (cada lote é uma chamada curta, com
 * progresso visível); a rota valida cada vaga de novo com `sanitizarVaga`.
 *
 * Client-safe e determinístico com semente.
 */

import type { FormatoDeQuestao } from './auditoria-de-questoes'
import { sequenciaDeGabarito, sorteador } from './auditoria-de-questoes'
import type { TipoDeRecurso } from './recursos-visuais'

export type NivelDaQuestao = 'facil' | 'medio' | 'dificil'
export type EstiloDaQuestao = 'contextualizada' | 'direta'

export interface VagaDaQuestao {
  tema: string
  formato: FormatoDeQuestao
  estilo: EstiloDaQuestao
  nivel: NivelDaQuestao
  recurso: TipoDeRecurso | null
  /** Índice (0 = A) onde a correta vai ficar. */
  posicaoCorreta: number
}

export interface ConfigDaProvaIa {
  temas: string[]
  quantidade: number
  alternativas: number
  nivel: NivelDaQuestao | 'misto'
  estilo: EstiloDaQuestao | 'misto'
  formatos: FormatoDeQuestao[]
  recursos: TipoDeRecurso[]
}

export const FORMATOS: { id: FormatoDeQuestao; rotulo: string; descricao: string; exige5?: boolean }[] = [
  { id: 'standard', rotulo: 'Clássica', descricao: 'Uma correta entre as alternativas' },
  { id: 'multiple-affirmative', rotulo: 'Afirmativas', descricao: 'Julgue I, II, III e IV' },
  { id: 'assertion-reason', rotulo: 'Asserção-razão', descricao: 'A segunda justifica a primeira?', exige5: true },
  { id: 'comparison', rotulo: 'Comparação', descricao: 'Duas situações lado a lado' },
]

export const NIVEIS: { id: NivelDaQuestao | 'misto'; rotulo: string }[] = [
  { id: 'facil', rotulo: 'Fácil' },
  { id: 'medio', rotulo: 'Médio' },
  { id: 'dificil', rotulo: 'Difícil' },
  { id: 'misto', rotulo: 'Misto' },
]

/** Tetos de custo. Uma questão completa (com resposta comentada) sai por ~1.300 tokens. */
export const MAXIMO_DE_QUESTOES_IA = 40
export const QUESTOES_POR_LOTE = 3
export const MAXIMO_DE_TEMAS = 12

const NIVEIS_VALIDOS: NivelDaQuestao[] = ['facil', 'medio', 'dificil']
const FORMATOS_VALIDOS = FORMATOS.map((f) => f.id)
const RECURSOS_VALIDOS: TipoDeRecurso[] = ['tabela', 'grafico', 'esquema', 'citacao']

export function limparTema(tema: unknown): string {
  return typeof tema === 'string' ? tema.replace(/\s+/g, ' ').trim().slice(0, 160) : ''
}

/** Formatos possíveis com este número de alternativas (asserção-razão tem cinco fixas). */
export function formatosPossiveis(formatos: FormatoDeQuestao[], alternativas: number): FormatoDeQuestao[] {
  const validos = formatos.filter((f) => FORMATOS_VALIDOS.includes(f) && (f !== 'assertion-reason' || alternativas >= 5))
  return validos.length ? Array.from(new Set(validos)) : ['standard']
}

export function planejarProva(config: ConfigDaProvaIa, semente = Date.now()): VagaDaQuestao[] {
  const aleatorio = sorteador(semente)
  const quantidade = Math.max(1, Math.min(MAXIMO_DE_QUESTOES_IA, Math.round(config.quantidade)))
  const alternativas = config.alternativas >= 5 ? 5 : 4
  const temas = Array.from(new Set(config.temas.map(limparTema).filter(Boolean))).slice(0, MAXIMO_DE_TEMAS)
  if (temas.length === 0) return []
  const formatos = formatosPossiveis(config.formatos, alternativas)
  const recursos = config.recursos.filter((r) => RECURSOS_VALIDOS.includes(r))
  const gabarito = sequenciaDeGabarito(quantidade, alternativas, aleatorio)

  // Temas em rodízio, começando de um ponto sorteado.
  const inicioTema = Math.floor(aleatorio() * temas.length)
  // A clássica pesa o dobro quando está entre as escolhidas: é a espinha da prova.
  const roleta = formatos.flatMap((f) => (f === 'standard' && formatos.length > 1 ? [f, f] : [f]))
  // Em blocos embaralhados da roleta: a proporção vale em qualquer trecho da prova.
  const ordemFormatos: FormatoDeQuestao[] = []
  while (ordemFormatos.length < quantidade) {
    ordemFormatos.push(...sequenciaDeGabarito(roleta.length, roleta.length, aleatorio).map((k) => roleta[k]))
  }
  // Recurso em ~60% das questões, alternando os tipos escolhidos.
  let proximoRecurso = Math.floor(aleatorio() * Math.max(1, recursos.length))

  return Array.from({ length: quantidade }, (_, i): VagaDaQuestao => {
    const nivel: NivelDaQuestao =
      config.nivel === 'misto'
        ? NIVEIS_VALIDOS[(i + Math.floor(aleatorio() * 3)) % 3]
        : NIVEIS_VALIDOS.includes(config.nivel)
          ? config.nivel
          : 'medio'
    const estilo: EstiloDaQuestao =
      config.estilo === 'misto' ? (aleatorio() < 0.6 ? 'contextualizada' : 'direta') : config.estilo === 'direta' ? 'direta' : 'contextualizada'
    let recurso: TipoDeRecurso | null = null
    if (recursos.length > 0 && (aleatorio() < 0.6 || quantidade <= 2)) {
      recurso = recursos[proximoRecurso % recursos.length]
      proximoRecurso++
    }
    return {
      tema: temas[(inicioTema + i) % temas.length],
      formato: ordemFormatos[i],
      estilo,
      nivel,
      recurso,
      posicaoCorreta: gabarito[i],
    }
  })
}

export function emLotes<T>(lista: T[], tamanho = QUESTOES_POR_LOTE): T[][] {
  const lotes: T[][] = []
  for (let i = 0; i < lista.length; i += tamanho) lotes.push(lista.slice(i, i + tamanho))
  return lotes
}

/** A rota não confia na vaga que chega: cada campo volta ao domínio válido. */
export function sanitizarVaga(bruta: unknown, alternativas: number): VagaDaQuestao | null {
  if (!bruta || typeof bruta !== 'object') return null
  const v = bruta as Record<string, unknown>
  const tema = limparTema(v.tema)
  if (!tema) return null
  const formato = formatosPossiveis([v.formato as FormatoDeQuestao], alternativas)[0]
  const nivel = NIVEIS_VALIDOS.includes(v.nivel as NivelDaQuestao) ? (v.nivel as NivelDaQuestao) : 'medio'
  const estilo: EstiloDaQuestao = v.estilo === 'direta' ? 'direta' : 'contextualizada'
  const recurso = RECURSOS_VALIDOS.includes(v.recurso as TipoDeRecurso) ? (v.recurso as TipoDeRecurso) : null
  const posicao = Math.round(Number(v.posicaoCorreta))
  return {
    tema,
    formato,
    nivel,
    estilo,
    recurso,
    posicaoCorreta: Number.isFinite(posicao) ? Math.max(0, Math.min(alternativas - 1, posicao)) : 0,
  }
}
