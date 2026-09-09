'use client'

import { EditorDeImagens } from '@/components/questoes/editor-de-imagens'
import type { Question } from '@/lib/types'
import { type ImagemDeQuestao, type LayoutDeImagens, fonteDoCampoLegado, sincronizarCampoLegado } from '@/lib/questoes/imagens'
import {
  imagensDaResposta,
  imagensDoEnunciado,
  layoutDaResposta,
  layoutDoEnunciado,
} from '@/lib/questoes/imagens-da-questao'

/**
 * As imagens de uma questão de prova, no editor do admin.
 *
 * Existe como componente, e não como bloco copiado nas duas telas, porque
 * `/admin/exams/create` e `/admin/exams/[id]/edit` são o mesmo formulário
 * escrito duas vezes — e a divergência entre eles é a origem de metade dos
 * "na criação funciona, na edição não".
 *
 * ## A sincronia com o campo antigo
 *
 * Toda gravação reescreve `imageUrl`/`imageSource` com a PRIMEIRA imagem da
 * lista. É isso que faz uma questão de três imagens continuar aparecendo
 * (com a primeira) em qualquer tela, PDF ou exportação que ainda leia só o
 * campo único — e é o que garante que este trabalho não muda nada nas
 * questões que já existem. Ver `lib/questoes/imagens.ts`.
 */
export function ImagensDaQuestaoNoAdmin({
  questao,
  onChange,
}: {
  questao: Question
  onChange: (parcial: Partial<Question>) => void
}) {
  function mudarEnunciado(imagens: ImagemDeQuestao[], layout: LayoutDeImagens) {
    onChange({
      images: imagens,
      imagesLayout: layout,
      imageUrl: sincronizarCampoLegado(imagens) || '',
      imageSource: fonteDoCampoLegado(imagens) || '',
    })
  }

  function mudarResposta(imagens: ImagemDeQuestao[], layout: LayoutDeImagens) {
    onChange({ explanationImages: imagens, explanationImagesLayout: layout })
  }

  return (
    <div className="space-y-3">
      <EditorDeImagens
        titulo="Imagens do enunciado"
        descricao="Quantas precisar. O tamanho vale na tela do aluno e no PDF; no celular a imagem sempre ocupa a largura toda."
        imagens={imagensDoEnunciado(questao)}
        layout={layoutDoEnunciado(questao)}
        onChange={mudarEnunciado}
      />
      <EditorDeImagens
        titulo="Imagens da resposta comentada"
        descricao="Só aparecem junto do gabarito — depois que a prova encerra, e nos PDFs com resposta comentada."
        imagens={imagensDaResposta(questao)}
        layout={layoutDaResposta(questao)}
        onChange={mudarResposta}
      />
    </div>
  )
}
