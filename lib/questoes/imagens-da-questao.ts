/**
 * As imagens de uma questão, lidas do jeito que cada domínio as guarda.
 *
 * `lib/questoes/imagens.ts` define o FORMATO (e não importa nada, para poder
 * ser testado sozinho). Este arquivo é a ponte: ele sabe que uma questão de
 * prova guarda `imageUrl` e uma questão do Banco guarda `imagemUrl`, e devolve
 * para as telas e para os PDFs a mesma lista nos dois casos.
 *
 * Toda tela e todo gerador chama daqui. Nenhum deles precisa saber que existiu
 * um campo antigo.
 */

import {
  type BlocoDeImagens,
  type ImagemDeQuestao,
  type LayoutDeImagens,
  layoutDeImagens,
  reunirImagens,
} from './imagens'

/** O que este módulo precisa de uma questão de prova. Nada além disso. */
export interface QuestaoComImagens {
  imageUrl?: string | null
  imageSource?: string | null
  images?: unknown
  imagesLayout?: unknown
  explanation?: string | null
  explanationImages?: unknown
  explanationImagesLayout?: unknown
}

/** O que este módulo precisa de uma questão do Banco de Questões. */
export interface QuestaoDoBancoComImagens {
  imagemUrl?: string | null
  imagens?: unknown
  layoutImagens?: unknown
  imagensExplicacao?: unknown
  layoutImagensExplicacao?: unknown
}

export function imagensDoEnunciado(questao: QuestaoComImagens | null | undefined): ImagemDeQuestao[] {
  return reunirImagens(questao?.images, questao?.imageUrl, questao?.imageSource)
}

export function layoutDoEnunciado(questao: QuestaoComImagens | null | undefined): LayoutDeImagens {
  return layoutDeImagens(questao?.imagesLayout)
}

export function blocoDoEnunciado(questao: QuestaoComImagens | null | undefined): BlocoDeImagens {
  return { imagens: imagensDoEnunciado(questao), layout: layoutDoEnunciado(questao) }
}

export function imagensDaResposta(questao: QuestaoComImagens | null | undefined): ImagemDeQuestao[] {
  return reunirImagens(questao?.explanationImages, null)
}

export function layoutDaResposta(questao: QuestaoComImagens | null | undefined): LayoutDeImagens {
  return layoutDeImagens(questao?.explanationImagesLayout)
}

export function blocoDaResposta(questao: QuestaoComImagens | null | undefined): BlocoDeImagens {
  return { imagens: imagensDaResposta(questao), layout: layoutDaResposta(questao) }
}

export function imagensDaQuestaoDoBanco(
  questao: QuestaoDoBancoComImagens | null | undefined,
): ImagemDeQuestao[] {
  return reunirImagens(questao?.imagens, questao?.imagemUrl)
}

export function layoutDaQuestaoDoBanco(
  questao: QuestaoDoBancoComImagens | null | undefined,
): LayoutDeImagens {
  return layoutDeImagens(questao?.layoutImagens)
}

export function blocoDaQuestaoDoBanco(
  questao: QuestaoDoBancoComImagens | null | undefined,
): BlocoDeImagens {
  return { imagens: imagensDaQuestaoDoBanco(questao), layout: layoutDaQuestaoDoBanco(questao) }
}

export function imagensDaExplicacaoDoBanco(
  questao: QuestaoDoBancoComImagens | null | undefined,
): ImagemDeQuestao[] {
  return reunirImagens(questao?.imagensExplicacao, null)
}

export function layoutDaExplicacaoDoBanco(
  questao: QuestaoDoBancoComImagens | null | undefined,
): LayoutDeImagens {
  return layoutDeImagens(questao?.layoutImagensExplicacao)
}

export function blocoDaExplicacaoDoBanco(
  questao: QuestaoDoBancoComImagens | null | undefined,
): BlocoDeImagens {
  return {
    imagens: imagensDaExplicacaoDoBanco(questao),
    layout: layoutDaExplicacaoDoBanco(questao),
  }
}

/** A questão tem alguma imagem, em qualquer um dos dois blocos? */
export function temImagem(questao: QuestaoComImagens | null | undefined): boolean {
  return imagensDoEnunciado(questao).length > 0 || imagensDaResposta(questao).length > 0
}

/** Todas as URLs de uma questão, para o pré-carregamento dos PDFs. */
export function urlsDaQuestao(questao: QuestaoComImagens | null | undefined): string[] {
  return [...imagensDoEnunciado(questao), ...imagensDaResposta(questao)].map((i) => i.url)
}
