/**
 * A voz do Modo Foco — roteiros para o ElevenLabs (Eleven v4) e as legendas.
 *
 * Mesmo formato da jornada de perfil (`lib/jornada/narracao.ts`): `roteiro`
 * com as audio tags do v4 entre colchetes (em inglês, antes das palavras que
 * afetam), `legenda` sem as tags para a tela. Tudo funciona sem áudio — o
 * Modo Foco mostra a legenda e toca os sinos sintetizados; a voz é a camada
 * por cima.
 *
 * Passo a passo para gerar: `docs/foco-audios.md`. Arquivos em
 * `public/audio/foco/<id>.mp3`. Falas curtas de propósito: quem está focado
 * não pode ser interrompido por um discurso.
 */

export type IdDaFalaDeFoco =
  | 'inicio'
  | 'metade'
  | 'pausa'
  | 'pausa-longa'
  | 'volta'
  | 'fim'
  | 'resp-inspira'
  | 'resp-mais'
  | 'resp-solta'
  | 'aquecimento'

export interface FalaDeFoco {
  id: IdDaFalaDeFoco
  roteiro: string
  legenda: string
  quando: string
}

export const FALAS_DE_FOCO: Record<IdDaFalaDeFoco, FalaDeFoco> = {
  inicio: {
    id: 'inicio',
    quando: 'Ao começar um ciclo de foco',
    roteiro: '[calm] Respira fundo. [pause] Celular longe, uma coisa só na cabeça… [warmly] Bora. O tempo começa agora.',
    legenda: 'Respira fundo. Celular longe, uma coisa só na cabeça. Bora — o tempo começa agora.',
  },
  metade: {
    id: 'metade',
    quando: 'Na metade do ciclo (só nos ciclos de 50 min ou mais)',
    roteiro: '[softly] Metade do caminho. [pause] Segue firme.',
    legenda: 'Metade do caminho. Segue firme.',
  },
  pausa: {
    id: 'pausa',
    quando: 'Ao terminar um ciclo (pausa curta)',
    roteiro:
      '[warmly] Pausa! [relieved] Levanta, bebe água, olha pra longe… [softly] nada de rede social. [playful] Eu te chamo na volta.',
    legenda: 'Pausa! Levanta, bebe água, olha pra longe — nada de rede social. Eu te chamo na volta.',
  },
  'pausa-longa': {
    id: 'pausa-longa',
    quando: 'A cada 4 ciclos do Pomodoro',
    roteiro: '[proud] Quatro ciclos completos! [warmly] Agora sim: pausa longa. [pause] Merecida.',
    legenda: 'Quatro ciclos completos! Agora sim: pausa longa. Merecida.',
  },
  volta: {
    id: 'volta',
    quando: 'Quando a pausa termina',
    roteiro: '[energetic] Pausa acabou. [pause] Respira… e volta pro ciclo. [warmly] Você tá indo bem.',
    legenda: 'Pausa acabou. Respira e volta pro ciclo — você tá indo bem.',
  },
  fim: {
    id: 'fim',
    quando: 'Ao encerrar a sessão',
    roteiro:
      '[triumphant] Sessão concluída! [pause] [curious] Antes de sair… o que ficou na sua cabeça? [softly] Escreve três coisas, de memória.',
    legenda: 'Sessão concluída! Antes de sair: o que ficou na sua cabeça? Escreve três coisas, de memória.',
  },
  'resp-inspira': {
    id: 'resp-inspira',
    quando: 'Respiração guiada — 1ª inspiração (2 s)',
    roteiro: '[calm, slowly] Inspira pelo nariz…',
    legenda: 'Inspira pelo nariz…',
  },
  'resp-mais': {
    id: 'resp-mais',
    quando: 'Respiração guiada — 2ª inspiração curta (1 s)',
    roteiro: '[calm, softly] mais um pouco…',
    legenda: 'mais um pouco…',
  },
  'resp-solta': {
    id: 'resp-solta',
    quando: 'Respiração guiada — expiração longa (6 s)',
    roteiro: '[calm, slowly, drawn out] e solta… devagar… pela boca.',
    legenda: 'e solta, devagar, pela boca.',
  },
  aquecimento: {
    id: 'aquecimento',
    quando: 'Ao abrir o aquecimento de atenção (zigue-zague)',
    roteiro: '[playful] Aquecimento de atenção. [pause] Olho no ponto… [excited] e toca quando ele ficar dourado!',
    legenda: 'Aquecimento de atenção. Olho no ponto — e toca quando ele ficar dourado!',
  },
}

/** Em `false`, o Modo Foco não pede os MP3 (mostra a legenda e toca os sinos). */
export const AUDIOS_DE_FOCO_PRONTOS = false
export const PASTA_DE_AUDIO_DE_FOCO = '/audio/foco'
