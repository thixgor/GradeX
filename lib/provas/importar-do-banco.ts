/**
 * O que uma questão do Banco leva consigo quando vira questão de prova.
 *
 * Só as imagens, por enquanto — e é o pedaço que se perdia. `/admin/exams`
 * copiava `bq.imagemUrl` para `imageUrl` e parava aí: a segunda imagem do
 * enunciado, o arranjo lado a lado, o tamanho escolhido e as imagens da
 * explicação ficavam todos no Banco. A prova saía com uma lâmina de duas e sem
 * o esquema do comentário.
 */

import type { Question } from '@/lib/types'
import {
  blocoDaExplicacaoDoBanco,
  blocoDaQuestaoDoBanco,
  type QuestaoDoBancoComImagens,
} from '@/lib/questoes/imagens-da-questao'
import { fonteDoCampoLegado, sincronizarCampoLegado } from '@/lib/questoes/imagens'

export function imagensDoBancoParaQuestao(
  questaoDoBanco: QuestaoDoBancoComImagens,
): Pick<
  Question,
  'imageUrl' | 'imageSource' | 'images' | 'imagesLayout' | 'explanationImages' | 'explanationImagesLayout'
> {
  const enunciado = blocoDaQuestaoDoBanco(questaoDoBanco)
  const explicacao = blocoDaExplicacaoDoBanco(questaoDoBanco)

  return {
    imageUrl: sincronizarCampoLegado(enunciado.imagens) || '',
    imageSource: fonteDoCampoLegado(enunciado.imagens) || '',
    images: enunciado.imagens,
    imagesLayout: enunciado.layout,
    explanationImages: explicacao.imagens,
    explanationImagesLayout: explicacao.layout,
  }
}
