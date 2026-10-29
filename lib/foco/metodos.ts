import type { MetodoDeFoco } from '@/hooks/use-focus-session'

/**
 * Os métodos e as práticas do Modo Foco — e o que a pesquisa diz de cada um.
 *
 * A régua aqui é honestidade: cada item traz a força da evidência. Pomodoro e
 * micropausas têm estudo controlado; o 52/17 nasceu de dados de um aplicativo
 * (observacional); jogos de atenção aquecem, mas não "aumentam a inteligência"
 * — a revisão de Simons et al. (2016) não encontrou transferência ampla. Quem
 * estuda medicina sabe ler um nível de evidência, e o app não pode vender mais
 * do que a ciência entrega.
 */

export type Evidencia = 'forte' | 'moderada' | 'limitada'

export interface Referencia {
  autores: string
  ano: number
  titulo: string
  revista: string
}

export interface Metodo {
  id: MetodoDeFoco
  nome: string
  /** Minutos de foco por ciclo (0 = livre). */
  foco: number
  /** Pausa curta, em minutos. */
  pausa: number
  /** Pausa longa a cada `ciclosAteLonga` ciclos (0 = não tem). */
  pausaLonga: number
  ciclosAteLonga: number
  resumo: string
  porque: string
  evidencia: Evidencia
  referencias: Referencia[]
}

export const METODOS: Metodo[] = [
  {
    id: 'pomodoro',
    nome: 'Pomodoro',
    foco: 25,
    pausa: 5,
    pausaLonga: 20,
    ciclosAteLonga: 4,
    resumo: '25 min de foco, 5 de pausa. A cada 4, uma pausa de 20.',
    porque:
      'Pausas marcadas no relógio cansaram menos e mantiveram a motivação mais alta do que pausas "quando der vontade", com o mesmo rendimento.',
    evidencia: 'moderada',
    referencias: [
      {
        autores: 'Biwer F, Wiradhany W, oude Egbrink M, de Bruin A',
        ano: 2023,
        titulo: "Understanding effort regulation: comparing 'Pomodoro' breaks and self-regulated breaks",
        revista: 'British Journal of Educational Psychology',
      },
    ],
  },
  {
    id: '52-17',
    nome: '52 / 17',
    foco: 52,
    pausa: 17,
    pausaLonga: 0,
    ciclosAteLonga: 0,
    resumo: '52 min de foco, 17 de pausa de verdade, longe da tela.',
    porque:
      'Veio do padrão dos usuários mais produtivos de um app de registro de tempo. É dado observacional — vale testar se o seu ritmo é de blocos mais longos.',
    evidencia: 'limitada',
    referencias: [],
  },
  {
    id: 'ultradiano',
    nome: 'Ultradiano',
    foco: 90,
    pausa: 20,
    pausaLonga: 0,
    ciclosAteLonga: 0,
    resumo: '90 min de imersão, 20 de descanso. Para revisões longas e simulados.',
    porque:
      'Estudos de prática deliberada mostram sessões de alta concentração de até 60–90 min, separadas por descanso, como o limite sustentável de quem treina sério.',
    evidencia: 'moderada',
    referencias: [
      {
        autores: 'Ericsson KA, Krampe RT, Tesch-Römer C',
        ano: 1993,
        titulo: 'The role of deliberate practice in the acquisition of expert performance',
        revista: 'Psychological Review',
      },
    ],
  },
  {
    id: 'livre',
    nome: 'Livre',
    foco: 0,
    pausa: 0,
    pausaLonga: 0,
    ciclosAteLonga: 0,
    resumo: 'Cronômetro sem meta. Você decide quando parar.',
    porque: 'Para quando o estudo tem fim natural — terminar uma lista, um capítulo, uma prova.',
    evidencia: 'limitada',
    referencias: [],
  },
]

export function metodoPorId(id: string | null | undefined): Metodo {
  return METODOS.find((m) => m.id === id) || METODOS[0]
}

/** As práticas em volta da sessão: antes, durante a pausa e depois. */
export const PRATICAS = {
  intencao: {
    nome: 'Intenção de implementação',
    texto: 'Escrever exatamente o que você vai fazer ("resolver 20 questões de cardio") aumenta a chance de fazer.',
    evidencia: 'forte' as Evidencia,
    referencia: {
      autores: 'Gollwitzer PM, Sheeran P',
      ano: 2006,
      titulo: 'Implementation intentions and goal achievement: a meta-analysis of effects and processes',
      revista: 'Advances in Experimental Social Psychology',
    },
  },
  celular: {
    nome: 'Celular em outro cômodo',
    texto: 'A simples presença do celular na mesa pode tirar capacidade de atenção — mesmo desligado. O efeito ainda é debatido, mas afastar não custa nada.',
    evidencia: 'limitada' as Evidencia,
    referencia: {
      autores: 'Ward AF, Duke K, Gneezy A, Bos MW',
      ano: 2017,
      titulo: "Brain drain: the mere presence of one's own smartphone reduces available cognitive capacity",
      revista: 'Journal of the Association for Consumer Research',
    },
  },
  respiracao: {
    nome: 'Suspiro cíclico',
    texto: 'Duas inspirações pelo nariz e uma expiração longa pela boca. Cinco minutos por dia melhoraram o humor e baixaram a frequência respiratória mais do que a meditação de atenção plena.',
    evidencia: 'moderada' as Evidencia,
    referencia: {
      autores: 'Balban MY, Neri E, Kogon MM, et al.',
      ano: 2023,
      titulo: 'Brief structured respiration practices enhance mood and reduce physiological arousal',
      revista: 'Cell Reports Medicine',
    },
  },
  micropausa: {
    nome: 'Pausa de verdade',
    texto: 'Levante, beba água, olhe para longe (20 s a 6 m, a regra 20-20-20). Micropausas aumentam o vigor e reduzem a fadiga.',
    evidencia: 'moderada' as Evidencia,
    referencia: {
      autores: 'Albulescu P, Macsinga I, Rusu A, et al.',
      ano: 2022,
      titulo: 'Give me a break! A systematic review and meta-analysis on the efficacy of micro-breaks for increasing well-being and performance',
      revista: 'PLOS ONE',
    },
  },
  recordacao: {
    nome: 'Recordação ativa',
    texto: 'Ao terminar, escreva de cabeça o que aprendeu. Puxar da memória fixa mais do que reler — é o efeito de testagem.',
    evidencia: 'forte' as Evidencia,
    referencia: {
      autores: 'Roediger HL, Karpicke JD',
      ano: 2006,
      titulo: 'Test-enhanced learning: taking memory tests improves long-term retention',
      revista: 'Psychological Science',
    },
  },
  aquecimento: {
    nome: 'Aquecimento de atenção',
    texto: 'Os jogos esquentam a atenção antes de começar e quebram a pausa sem rede social. Não prometem "aumentar a inteligência": treino cognitivo melhora o próprio jogo, não muito além dele.',
    evidencia: 'limitada' as Evidencia,
    referencia: {
      autores: 'Simons DJ, Boot WR, Charness N, et al.',
      ano: 2016,
      titulo: 'Do "brain-training" programs work?',
      revista: 'Psychological Science in the Public Interest',
    },
  },
} as const

export const ROTULO_DA_EVIDENCIA: Record<Evidencia, string> = {
  forte: 'Evidência forte',
  moderada: 'Evidência moderada',
  limitada: 'Evidência limitada',
}
