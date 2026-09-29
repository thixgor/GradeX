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
  {
    doenca: 'adenocarcinoma-colorretal',
    caminho: '/Research_4/Teaching/Education/Undergraduate/1485.svs',
    largura: 50025,
    altura: 21576,
    objetiva: 20,
    mpp: 0.4667,
    subtitulo: 'Moderadamente diferenciado, ao lado da mucosa normal',
    caso: {
      sexo: 'F',
      idade: 60,
      historia: 'Tumor de cólon (ressecção).',
      diagnosticoOriginal: 'Adenocarcinoma',
    },
  },
  {
    doenca: 'adenoma-colorretal',
    caminho: '/Research_4/Teaching/Education/Undergraduate/1120.svs',
    largura: 64032,
    altura: 45532,
    objetiva: 20,
    mpp: 0.4667,
    subtitulo: 'Adenoma viloso com a mucosa normal na base',
    caso: {
      sexo: 'F',
      idade: 60,
      historia: 'Pólipo no cólon descendente.',
      diagnosticoOriginal: 'Villous adenoma',
    },
  },
  {
    doenca: 'colite-ulcerativa',
    caminho: '/Research_4/Teaching/Education/Undergraduate/1474.svs',
    largura: 66033,
    altura: 26424,
    objetiva: 20,
    mpp: 0.4667,
    subtitulo: 'Colite grave e ativa (peça de colectomia)',
    caso: {
      sexo: 'M',
      idade: 45,
      historia: 'Diarreia com sangue.',
      diagnosticoOriginal: 'Ulcerative colitis',
    },
  },
]
