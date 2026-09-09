/**
 * As imagens de uma questão, arrumadas antes de irem para o banco.
 *
 * ## O que ele impede
 *
 * - Um endereço que não é imagem (`javascript:…`, texto colado por engano)
 *   gravado num campo que uma tela vai pôr num `src`.
 * - Um tamanho fora da escala (`-40`, `9999`) vindo de uma requisição montada à
 *   mão, que na página vira uma imagem de largura negativa e no PDF uma conta
 *   com `NaN`.
 * - `imageUrl` e `images[0]` discordando. Toda tela e todo PDF que este
 *   trabalho não alcançou lê o campo antigo; se ele parar de acompanhar a
 *   lista, a mesma questão passa a mostrar imagens diferentes em lugares
 *   diferentes.
 *
 * ## Por que ele não toca em quem não pediu
 *
 * Uma questão que chega SEM `images` e SEM `explanationImages` sai daqui
 * exatamente como entrou. Isso é deliberado: o acervo inteiro está nesse
 * formato, e um normalizador que "aproveitasse para arrumar" o campo antigo
 * apagaria a imagem de toda questão cujo endereço não passe na validação de
 * hoje — um caminho relativo sem barra, por exemplo. Quem não mexeu em imagem
 * não corre risco nenhum ao salvar.
 */

import type { Question } from '@/lib/types'
import {
  fonteDoCampoLegado,
  layoutDeImagens,
  normalizarImagens,
  sincronizarCampoLegado,
} from '@/lib/questoes/imagens'

export function normalizarImagensDaQuestao<T extends Partial<Question>>(questao: T): T {
  if (!questao || typeof questao !== 'object') return questao

  const mexeuNoEnunciado = Array.isArray((questao as Question).images)
  const mexeuNaResposta = Array.isArray((questao as Question).explanationImages)
  if (!mexeuNoEnunciado && !mexeuNaResposta) return questao

  const arrumada: Question = { ...(questao as Question) }

  if (mexeuNoEnunciado) {
    const imagens = normalizarImagens(arrumada.images)
    arrumada.images = imagens
    arrumada.imagesLayout = layoutDeImagens(arrumada.imagesLayout)
    arrumada.imageUrl = sincronizarCampoLegado(imagens) || ''
    arrumada.imageSource = fonteDoCampoLegado(imagens) || ''
  }

  if (mexeuNaResposta) {
    arrumada.explanationImages = normalizarImagens(arrumada.explanationImages)
    arrumada.explanationImagesLayout = layoutDeImagens(arrumada.explanationImagesLayout)
  }

  return arrumada as T
}

/** O mesmo, para o array inteiro que chega no corpo da requisição. */
export function normalizarImagensDasQuestoes<T extends Partial<Question>>(questoes: T[] | undefined): T[] {
  if (!Array.isArray(questoes)) return []
  return questoes.map(normalizarImagensDaQuestao)
}
