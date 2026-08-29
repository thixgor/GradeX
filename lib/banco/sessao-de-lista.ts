'use client'

/**
 * O que sobrevive quando alguém sai do meio de uma lista de questões.
 *
 * ## O relato que originou este arquivo
 *
 * > "Eu estava fazendo os exercícios, fiz 50 e tal, aí eu fui fazendo, parei
 * > pra ajudar o Zé, voltei na tela, atualizou. E perdi tudo — e parece que
 * > não fiz."
 *
 * O simulado de uma lista vivia inteiro em `useState`: respostas, quais já
 * tinham sido conferidas, alternativas riscadas, em que questão a pessoa
 * estava. Nada disso saía da memória da aba. Trocar de app no celular por
 * tempo suficiente para o sistema descartar a página — ou simplesmente
 * atualizar — apagava uma hora de estudo sem aviso e sem volta.
 *
 * ## Por que no navegador, e não no servidor
 *
 * Uma sessão em andamento é rascunho: metade das respostas ainda vai mudar, e
 * a pessoa marca e desmarca alternativa a cada leitura. Mandar cada toque para
 * o servidor gastaria uma requisição por clique para gravar algo que só
 * interessa a quem está com a tela aberta. O que É definitivo — a resposta
 * conferida — vai para `banco_resolucoes` na hora em que deixa de ser
 * rascunho; isso a tela faz por conta própria (ver a página da lista).
 *
 * Três garantias que o `localStorage` não dá de graça:
 *
 * 1. **nada aqui pode quebrar a página** — modo privado, cota estourada ou
 *    JSON corrompido apenas desligam a retomada, o estudo continua;
 * 2. **o estado é guardado por id de questão, nunca por posição** — remover
 *    uma questão da lista não pode fazer a resposta da 7ª virar da 6ª;
 * 3. **versão de schema** — dado de um formato antigo é descartado inteiro em
 *    vez de restaurar meia sessão.
 *
 * A chave é o id da lista, que já é por usuário (a rota só devolve listas do
 * dono). Duas contas no mesmo navegador nunca leem a sessão uma da outra
 * porque nunca compartilham um id de lista.
 */

import type { TextHighlight } from '@/lib/types'

const PREFIXO = 'gradex:banco:sessao-de-lista:'

/** Suba isto ao mudar o formato: sessões antigas são descartadas, não migradas. */
export const VERSAO_DA_SESSAO = 1

/** Depois de duas semanas, "continuar de onde parou" já não é onde a pessoa parou. */
const VALIDADE = 14 * 24 * 60 * 60 * 1000

export type ModoCorrecaoSalvo = 'imediato' | 'final'

export interface RespostaSalva {
  questaoId: string
  tipo: 'objetiva' | 'discursiva'
  alternativaSelecionada?: string
  respostaDiscursiva?: string
}

export interface SessaoDeLista {
  versao: number
  modoCorrecao: ModoCorrecaoSalvo
  /** A questão aberta na hora da saída — por id, não por posição. */
  questaoIdAtual: string | null
  respostas: RespostaSalva[]
  /** Ids das questões cujo gabarito já foi revelado. */
  conferidas: string[]
  /** questaoId → letras riscadas. */
  riscadas: Record<string, string[]>
  /** questaoId → nota da auto-avaliação das discursivas (0–100). */
  notas: Record<string, number>
  /**
   * Ids já contabilizados em `banco_resolucoes`.
   *
   * É o que impede a mesma resposta de entrar duas vezes no histórico quando a
   * pessoa sai e retoma: a tela só lança para o servidor o que não está aqui.
   */
  registradas: string[]
  /** questaoId → marcações de texto no enunciado. */
  destaques: Record<string, TextHighlight[]>
  /** Terminou: o que resta é ler o resultado ou refazer. */
  finalizado: boolean
  atualizadoEm: number
}

export type SessaoParaSalvar = Omit<SessaoDeLista, 'versao' | 'atualizadoEm'>

function chave(listaId: string) {
  return `${PREFIXO}${listaId}`
}

function textoOuNada(valor: unknown): string | undefined {
  return typeof valor === 'string' ? valor : undefined
}

/** Aceita só o que tem forma de resposta — um item torto não contamina a sessão. */
function sanearRespostas(bruto: unknown): RespostaSalva[] {
  if (!Array.isArray(bruto)) return []
  const vistas = new Set<string>()
  const saneadas: RespostaSalva[] = []
  for (const item of bruto) {
    const questaoId = textoOuNada((item as any)?.questaoId)
    const tipo = (item as any)?.tipo
    if (!questaoId || (tipo !== 'objetiva' && tipo !== 'discursiva')) continue
    if (vistas.has(questaoId)) continue
    vistas.add(questaoId)
    saneadas.push({
      questaoId,
      tipo,
      alternativaSelecionada: textoOuNada((item as any).alternativaSelecionada),
      respostaDiscursiva: textoOuNada((item as any).respostaDiscursiva),
    })
  }
  return saneadas
}

function sanearIds(bruto: unknown): string[] {
  if (!Array.isArray(bruto)) return []
  return Array.from(new Set(bruto.filter((x): x is string => typeof x === 'string')))
}

function sanearMapaDeIds(bruto: unknown): Record<string, string[]> {
  if (!bruto || typeof bruto !== 'object') return {}
  const mapa: Record<string, string[]> = {}
  for (const [id, letras] of Object.entries(bruto as Record<string, unknown>)) {
    const lista = sanearIds(letras)
    if (lista.length > 0) mapa[id] = lista
  }
  return mapa
}

function sanearNotas(bruto: unknown): Record<string, number> {
  if (!bruto || typeof bruto !== 'object') return {}
  const mapa: Record<string, number> = {}
  for (const [id, nota] of Object.entries(bruto as Record<string, unknown>)) {
    if (typeof nota === 'number' && Number.isFinite(nota)) mapa[id] = nota
  }
  return mapa
}

function sanearDestaques(bruto: unknown): Record<string, TextHighlight[]> {
  if (!bruto || typeof bruto !== 'object') return {}
  const mapa: Record<string, TextHighlight[]> = {}
  for (const [id, marcacoes] of Object.entries(bruto as Record<string, unknown>)) {
    if (Array.isArray(marcacoes) && marcacoes.length > 0) {
      mapa[id] = marcacoes as TextHighlight[]
    }
  }
  return mapa
}

export function lerSessao(listaId: string): SessaoDeLista | null {
  if (typeof window === 'undefined' || !listaId) return null
  try {
    const bruto = window.localStorage.getItem(chave(listaId))
    if (!bruto) return null

    const dado = JSON.parse(bruto) as Partial<SessaoDeLista>
    if (!dado || dado.versao !== VERSAO_DA_SESSAO) {
      window.localStorage.removeItem(chave(listaId))
      return null
    }
    if (typeof dado.atualizadoEm !== 'number' || Date.now() - dado.atualizadoEm > VALIDADE) {
      window.localStorage.removeItem(chave(listaId))
      return null
    }

    return {
      versao: VERSAO_DA_SESSAO,
      modoCorrecao: dado.modoCorrecao === 'final' ? 'final' : 'imediato',
      questaoIdAtual: textoOuNada(dado.questaoIdAtual) ?? null,
      respostas: sanearRespostas(dado.respostas),
      conferidas: sanearIds(dado.conferidas),
      riscadas: sanearMapaDeIds(dado.riscadas),
      notas: sanearNotas(dado.notas),
      registradas: sanearIds(dado.registradas),
      destaques: sanearDestaques(dado.destaques),
      finalizado: dado.finalizado === true,
      atualizadoEm: dado.atualizadoEm,
    }
  } catch {
    return null
  }
}

export function salvarSessao(listaId: string, sessao: SessaoParaSalvar) {
  if (typeof window === 'undefined' || !listaId) return
  const completa: SessaoDeLista = {
    ...sessao,
    versao: VERSAO_DA_SESSAO,
    atualizadoEm: Date.now(),
  }
  try {
    window.localStorage.setItem(chave(listaId), JSON.stringify(completa))
  } catch {
    /*
     * Cota estourada é quase sempre marcação de texto acumulada — o que a
     * pessoa não pode perder são as RESPOSTAS. Uma segunda tentativa sem os
     * destaques salva o que importa; se nem isso couber, a sessão simplesmente
     * não é gravada e a tela continua funcionando.
     */
    try {
      window.localStorage.setItem(
        chave(listaId),
        JSON.stringify({ ...completa, destaques: {} }),
      )
    } catch {
      /* modo privado, cota cheia: a retomada some, o estudo continua */
    }
  }
}

export function apagarSessao(listaId: string) {
  if (typeof window === 'undefined' || !listaId) return
  try {
    window.localStorage.removeItem(chave(listaId))
  } catch {
    /* idem */
  }
}

/**
 * O que a tela precisa dizer antes de a pessoa decidir: quanto já foi feito e
 * onde ela parou, contados contra a lista COMO ELA ESTÁ HOJE.
 *
 * Contar sobre os ids atuais e não sobre o que estava salvo é o que mantém a
 * frase honesta depois de a pessoa remover uma questão da lista: a resposta de
 * uma questão que não está mais lá não conta como progresso.
 */
export function resumoDaSessao(sessao: SessaoDeLista, questaoIds: string[]) {
  const presentes = new Set(questaoIds)
  const respondidas = sessao.respostas.filter((r) => presentes.has(r.questaoId)).length
  const indiceSalvo = sessao.questaoIdAtual ? questaoIds.indexOf(sessao.questaoIdAtual) : -1
  return {
    respondidas,
    total: questaoIds.length,
    /** Posição para onde a retomada leva; 0 quando a questão salva sumiu. */
    indiceAtual: indiceSalvo >= 0 ? indiceSalvo : 0,
    finalizado: sessao.finalizado,
    atualizadoEm: sessao.atualizadoEm,
  }
}

/**
 * Vale oferecer retomada?
 *
 * Abrir o simulado e sair na primeira questão sem responder nada não é
 * "progresso perdido" — oferecer "continuar de onde parou" ali só acrescenta
 * uma decisão a quem quer começar.
 */
export function vaiPelaPenaRetomar(sessao: SessaoDeLista, questaoIds: string[]): boolean {
  const { respondidas, indiceAtual, finalizado } = resumoDaSessao(sessao, questaoIds)
  return finalizado || respondidas > 0 || indiceAtual > 0
}

/** Quanto tempo faz, em português curto: "há 3 min", "ontem". */
export function quandoFoi(momento: number): string {
  const minutos = Math.max(0, Math.floor((Date.now() - momento) / 60000))
  if (minutos < 1) return 'agora há pouco'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'ontem'
  return `há ${dias} dias`
}
