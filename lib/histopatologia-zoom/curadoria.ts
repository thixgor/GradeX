import type { CuradoriaDaLamina } from './tipos'

/**
 * Lâminas publicadas na Histopatologia com Zoom.
 *
 * Cada entrada é um caso real do Virtual Pathology Slide Library (University
 * of Leeds), escolhido depois de examinar a lâmina em vários aumentos e
 * confirmar que ela mostra a doença. Dimensões e objetiva vêm do próprio
 * servidor de imagens (`?INFO`), medidos por `scripts/histopatologia-zoom/leeds.py medir`.
 *
 * **Só acrescente no fim de cada doença**: a ordem define o sufixo do slug
 * (`apendicite-aguda-1`, `-2`…), e reordenar quebra links e anotações.
 */
export const CURADORIA: CuradoriaDaLamina[] = [
  {
    doenca: 'apendicite-aguda',
    caminho: '/Research_4/Teaching/Education/Undergraduate/1052.svs',
    largura: 22011,
    altura: 15795,
    objetiva: 20,
    mpp: 0.4667,
    subtitulo: 'Supurativa, com periapendicite',
    caso: {
      sexo: 'F',
      idade: 30,
      historia: 'Dor na fossa ilíaca direita.',
      diagnosticoOriginal: 'Acute appendicitis',
    },
  },
]
