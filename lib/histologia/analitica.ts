'use client'

import { track } from '@vercel/analytics'

/**
 * Telemetria do Manual da Histologia.
 *
 * ## O que **nunca** sai daqui
 *
 * - o termo digitado na busca (só a categoria e a faixa de resultados);
 * - qualquer texto do caderno ou nota privada;
 * - resposta livre, alternativa escolhida ou gabarito;
 * - identificador de usuário — o módulo é gratuito e sem login.
 *
 * O tipo `Evento` é uma união fechada e todos os campos são categóricos por
 * construção: não existe caminho para um evento carregar texto livre, porque
 * não há campo de texto livre para preencher. É mais barato garantir isso no
 * tipo do que revisar cada chamada.
 */

export type Evento =
  | { nome: 'busca_executada'; escopo: 'lamina' | 'estrutura' | 'quiz' | 'misto'; faixa: FaixaDeResultados }
  | { nome: 'lamina_aberta'; setor: string }
  | { nome: 'overlay_usado'; setor: string }
  | { nome: 'quiz_iniciado'; quiz: string; modo: 'pratica' | 'prova' }
  | { nome: 'quiz_concluido'; quiz: string; modo: 'pratica' | 'prova'; faixa: FaixaDeAcerto }
  | { nome: 'laboratorio_concluido'; modulo: string }

export type FaixaDeResultados = '0' | '1-5' | '6-20' | '21+'
export type FaixaDeAcerto = '0-39' | '40-59' | '60-79' | '80-100'

/** Agrupa a contagem em faixas: o número exato não acrescenta nada e identifica mais. */
export function faixaDeResultados(total: number): FaixaDeResultados {
  if (total === 0) return '0'
  if (total <= 5) return '1-5'
  if (total <= 20) return '6-20'
  return '21+'
}

export function faixaDeAcerto(percentual: number): FaixaDeAcerto {
  if (percentual < 40) return '0-39'
  if (percentual < 60) return '40-59'
  if (percentual < 80) return '60-79'
  return '80-100'
}

/**
 * Envia o evento. Falha em silêncio de propósito: bloqueador de anúncios,
 * modo privado ou rede fora do ar não podem derrubar uma página de estudo por
 * causa de estatística.
 */
export function registrarEvento(evento: Evento): void {
  try {
    const { nome, ...propriedades } = evento
    track(`histologia:${nome}`, propriedades as Record<string, string>)
  } catch {
    /* telemetria nunca interrompe o estudo */
  }
}
