import { CheckCircle2, PenLine, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A aparência de uma questão sendo resolvida, num lugar só.
 *
 * ## Por que ela saiu de dentro dos componentes
 *
 * Três telas desenham a mesma questão: a resolução de quem tem conta
 * (`/banco-questoes/[id]`), a amostra pública (`/amostra`) e a demonstração da
 * landing. As duas primeiras usam os mesmos componentes e nunca divergem. A
 * terceira não pode usá-los: `AlternativaQuiz` e `FolhaDeFeedback` importam
 * `framer-motion`, e a landing é a página em que cada quilobyte de JavaScript
 * atrasa a primeira pintura — arrastar uma biblioteca de animação para lá só
 * para tremer um cartão falso seria caro no lugar errado.
 *
 * A saída não é copiar as classes na landing (cópia envelhece: muda-se o verde
 * do acerto num arquivo e a demonstração continua com o antigo, prometendo uma
 * tela que não existe mais). É tirar daqui o que é APARÊNCIA — puro, sem
 * dependência nenhuma — e deixar em cada componente só o que é comportamento.
 *
 * Quem muda a cor de um acerto muda aqui, e muda nas três telas de uma vez.
 */

export interface EstadoDaAlternativa {
  /** A pessoa escolheu esta alternativa. */
  marcada: boolean
  /** Eliminada pelo raciocínio — continua visível, cortada. */
  riscada: boolean
  /** O gabarito já está na tela. */
  conferida: boolean
  correta: boolean
}

export interface ClassesDaAlternativa {
  cartao: string
  selo: string
  texto: string
  botaoRiscar: string
}

/**
 * As classes dos quatro pedaços de uma alternativa.
 *
 * Os estados, na ordem em que se sobrepõem:
 *
 * - **livre**: cartão neutro, pronto para o toque.
 * - **marcada** (antes de conferir): borda e fundo da cor primária. É a única
 *   coisa colorida da tela nesse momento — a resposta escolhida não pode
 *   depender de olhar com atenção.
 * - **riscada**: texto cortado e esmaecido, sem sumir. É raciocínio de prova:
 *   eliminar é uma decisão, e ela precisa continuar visível.
 * - **conferida**: verde na correta, vermelho na marcada errada, e o resto
 *   esmaecido.
 */
export function classesDaAlternativa({
  marcada,
  riscada,
  conferida,
  correta,
}: EstadoDaAlternativa): ClassesDaAlternativa {
  const acertouEsta = conferida && correta
  const errouEsta = conferida && marcada && !correta

  return {
    // O alvo de toque nunca é menor que 56px de altura (3.5rem).
    cartao: cn(
      'relative flex min-h-[3.5rem] w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-colors',
      !conferida && !riscada && 'cursor-pointer border-border bg-card hover:border-primary/50',
      !conferida && marcada && 'border-primary bg-primary/10',
      !conferida && riscada && 'border-dashed border-border/70 bg-muted/40',
      conferida && !acertouEsta && !errouEsta && 'border-border bg-card opacity-70',
      acertouEsta && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
      errouEsta && 'border-red-500 bg-red-50 dark:bg-red-950/40',
    ),
    selo: cn(
      'flex h-9 w-9 flex-none items-center justify-center rounded-xl text-sm font-bold transition-colors',
      !conferida && marcada && 'bg-primary text-primary-foreground',
      !conferida && !marcada && 'bg-muted text-muted-foreground',
      conferida && !acertouEsta && !errouEsta && 'bg-muted text-muted-foreground',
      acertouEsta && 'bg-emerald-500 text-white',
      errouEsta && 'bg-red-500 text-white',
    ),
    texto: cn(
      'min-w-0 flex-1 whitespace-pre-line text-[15px] leading-snug',
      riscada && !conferida && 'text-muted-foreground line-through',
    ),
    // O "riscar" tem 44px próprios — o mínimo de alvo de toque da plataforma,
    // e não os 36px de antes: no celular ele é o único jeito de eliminar uma
    // alternativa, e disputa a borda direita do cartão com o que estiver
    // flutuando no canto. O toque fica afastado da borda do texto para não
    // riscar sem querer ao tentar marcar.
    botaoRiscar: cn(
      'flex h-11 w-11 flex-none items-center justify-center rounded-xl transition active:scale-90',
      riscada
        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300'
        : 'text-muted-foreground/50 hover:bg-muted hover:text-foreground',
    ),
  }
}

export type VereditoDaQuestao = 'acertou' | 'errou' | 'registrada'

export interface VisualDoVeredito {
  icone: typeof CheckCircle2
  rotulo: string
  /** Linha de apoio quando não há correção escrita para ler. */
  apoio: string
  /** Linha de apoio quando há: ela convida à leitura. */
  convite: string
  rotuloAcao: string
  faixa: string
  bolha: string
  titulo: string
  acao: string
}

/** O vocabulário visual do veredito, compartilhado pelas três telas. */
export const VISUAL_DO_VEREDITO: Record<VereditoDaQuestao, VisualDoVeredito> = {
  acertou: {
    icone: CheckCircle2,
    rotulo: 'Você acertou',
    apoio: 'Resposta correta',
    convite: 'Toque para ver a explicação',
    rotuloAcao: 'Ver explicação',
    faixa: 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40',
    bolha: 'bg-emerald-500',
    titulo: 'text-emerald-700 dark:text-emerald-300',
    acao: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  errou: {
    icone: XCircle,
    rotulo: 'Não foi dessa vez',
    apoio: 'Resposta incorreta',
    convite: 'Toque para ver por que',
    rotuloAcao: 'Ver por que',
    faixa: 'border-red-500/40 bg-red-50 dark:bg-red-950/40',
    bolha: 'bg-red-500',
    titulo: 'text-red-700 dark:text-red-300',
    acao: 'bg-red-500/15 text-red-700 dark:text-red-300',
  },
  registrada: {
    icone: PenLine,
    rotulo: 'Resposta registrada',
    apoio: 'Ainda não há gabarito para esta questão',
    convite: 'Toque para ver a resposta modelo',
    rotuloAcao: 'Ver gabarito',
    faixa: 'border-sky-500/40 bg-sky-50 dark:bg-sky-950/40',
    bolha: 'bg-sky-500',
    titulo: 'text-sky-700 dark:text-sky-300',
    acao: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
}

/**
 * As cores das etiquetas de dificuldade, iguais em toda a plataforma.
 *
 * A BORDA carrega a cor semântica (verde/amarelo/vermelho) e o TEXTO usa um
 * tom mais fundo. A versão anterior pintava a letra com o tom 600 dos três, e
 * sobre o off-white do tema claro isso rendia 2,9:1 no verde, 2,6:1 no amarelo
 * e 4,4:1 no vermelho — os três reprovados no AA da WCAG, que pede 4,5:1 para
 * texto normal. Amarelo sobre fundo claro é o caso clássico: parece legível
 * para quem desenhou e some para quem lê no ônibus, com brilho no talo.
 *
 * No escuro o problema é o oposto (tom fundo sobre fundo fundo), então lá
 * entram os tons 400.
 */
export const CLASSE_DA_DIFICULDADE: Record<string, { texto: string; classe: string }> = {
  facil: { texto: 'Fácil', classe: 'border-green-500 text-green-800 dark:text-green-400' },
  medio: { texto: 'Médio', classe: 'border-yellow-500 text-yellow-800 dark:text-yellow-400' },
  dificil: { texto: 'Difícil', classe: 'border-red-500 text-red-700 dark:text-red-400' },
}
