'use client'

import { useState } from 'react'
import { ChevronLeft, Play, Shuffle } from 'lucide-react'
import { FundoIos } from '@/components/materiais/fundo-ios'
import { ExamBrandHeader } from '@/components/exam/exam-brand-header'
import { Exam } from '@/lib/types'
import '@/components/exam/prova-ios.css'

interface PracticeExamConfigProps {
  exam: Exam
  onStart: (config: PracticeExamSettings) => void
  onBack: () => void
  /**
   * O selo acima do título. Padrão: "Prova Prática".
   *
   * Esta mesma tela abre o "segundo tempo" de uma prova AVALIATIVA que já
   * terminou (ver `lib/provas/treino-pos-termino.ts`), e chamá-la de "Prova
   * Prática" ali diria a coisa errada sobre a prova que a turma fez valendo
   * nota.
   */
  rotulo?: string
  /** Uma frase logo abaixo do título, quando há algo que a pessoa precisa saber antes de começar. */
  aviso?: string
}

export interface PracticeExamSettings {
  navigationMode: 'paginated' | 'scroll'
  feedbackMode: 'immediate' | 'end'
  shuffleQuestions: boolean
  timeLimitMinutes: number | null
}

const TIME_OPTIONS = [
  { value: null, label: 'Sem limite' },
  { value: 10, label: '10 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2 h' },
  { value: 240, label: '4 h' },
]

/**
 * A configuração do treino, no padrão dos Ajustes do iPhone: grupos com
 * rótulo em cima e explicação embaixo, controle segmentado para as escolhas de
 * dois lados, chave para o liga/desliga e o botão de começar preso ao polegar
 * no celular. Estilo em components/exam/prova-ios.css.
 */
export function PracticeExamConfig({ exam, onStart, onBack, rotulo, aviso }: PracticeExamConfigProps) {
  const [navigationMode, setNavigationMode] = useState<'paginated' | 'scroll'>(
    exam.navigationMode || 'paginated'
  )
  const [feedbackMode, setFeedbackMode] = useState<'immediate' | 'end'>('immediate')
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)

  const handleStart = () => {
    onStart({
      navigationMode,
      feedbackMode,
      shuffleQuestions,
      timeLimitMinutes,
    })
  }

  const questionCount = exam.questions?.length || 0
  const hasDiscursive = exam.questions?.some(q => q.type === 'discursive')
  const hasMultipleChoice = exam.questions?.some(q => q.type === 'multiple-choice')
  const tipos = [hasMultipleChoice && 'objetivas', hasDiscursive && 'discursivas'].filter(Boolean).join(' e ')

  const segmentado = <T extends string>(
    rotuloDoGrupo: string,
    valor: T,
    opcoes: { valor: T; rotulo: string }[],
    aoEscolher: (v: T) => void,
  ) => (
    <div
      className="ios-segmentado"
      role="radiogroup"
      aria-label={rotuloDoGrupo}
      style={{ '--segmentos': opcoes.length, '--indice': opcoes.findIndex(o => o.valor === valor) } as React.CSSProperties}
    >
      {opcoes.map(o => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          className="ios-segmento h-10"
          onClick={() => aoEscolher(o.valor)}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  )

  return (
    <FundoIos className="min-h-screen">
      <div className="mx-auto w-full max-w-xl px-4 pt-[calc(8px+env(safe-area-inset-top))] sm:px-6 sm:pb-16">
        <nav className="flex items-center justify-between gap-3 py-2">
          <button type="button" className="ios-voltar ios-vidro" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </button>
          <ExamBrandHeader />
        </nav>

        <header className="ios-assenta space-y-3 pb-2 pt-6 sm:pt-10">
          <span className="pv-etiqueta" data-tom="tinta">
            {rotulo || 'Prova de treino'}
          </span>
          <h1 className="ios-titulo-grande">{exam.title}</h1>
          <p className="text-[16px] ios-rotulo-2">
            {questionCount} {questionCount === 1 ? 'questão' : 'questões'}
            {tipos ? ` ${tipos}` : ''}. Ajuste como quer treinar e comece.
          </p>
          {exam.description && (
            <p className="whitespace-pre-line text-[15px] leading-relaxed ios-rotulo-2">{exam.description}</p>
          )}
          {aviso && (
            <p className="pv-aviso" data-tom="tinta">
              {aviso}
            </p>
          )}
        </header>

        <div className="mt-6 space-y-7">
          <section>
            <h2 className="ios-cabeca-lista">Navegação</h2>
            {segmentado(
              'Navegação',
              navigationMode,
              [
                { valor: 'paginated', rotulo: 'Uma por vez' },
                { valor: 'scroll', rotulo: 'Todas em sequência' },
              ],
              setNavigationMode,
            )}
            <p className="ios-pe-lista">
              {navigationMode === 'paginated'
                ? 'Uma questão por tela, com anterior e próxima ao alcance do polegar.'
                : 'Todas as questões numa página só, para rolar e responder na ordem que quiser.'}
            </p>
          </section>

          <section>
            <h2 className="ios-cabeca-lista">Correção</h2>
            {segmentado(
              'Correção',
              feedbackMode,
              [
                { valor: 'immediate', rotulo: 'Na hora' },
                { valor: 'end', rotulo: 'No final' },
              ],
              setFeedbackMode,
            )}
            <p className="ios-pe-lista">
              {feedbackMode === 'immediate'
                ? 'Você confere cada objetiva logo depois de responder, com o comentário.'
                : 'O gabarito comentado aparece só quando você finalizar.'}
            </p>
          </section>

          <section>
            <h2 className="ios-cabeca-lista">Ordem</h2>
            <div className="ios-lista">
              <button
                type="button"
                role="switch"
                aria-checked={shuffleQuestions}
                className="ios-linha w-full text-left"
                onClick={() => setShuffleQuestions(!shuffleQuestions)}
              >
                <span className="pv-icone-linha" data-tom="azul">
                  <Shuffle className="h-4 w-4" />
                </span>
                <span className="flex-1 text-[16px]">Embaralhar questões</span>
                <span className="pv-chave" aria-hidden />
              </button>
            </div>
            <p className="ios-pe-lista">
              {shuffleQuestions ? 'As questões vêm em ordem aleatória.' : 'As questões vêm na ordem original da prova.'}
            </p>
          </section>

          <section>
            <h2 className="ios-cabeca-lista">Tempo</h2>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Limite de tempo">
              {TIME_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  role="radio"
                  aria-checked={timeLimitMinutes === opt.value}
                  className="ios-pilula h-11 px-4"
                  onClick={() => setTimeLimitMinutes(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="ios-pe-lista">
              {timeLimitMinutes === null
                ? 'Sem cronômetro: no seu ritmo.'
                : 'Um cronômetro corre no topo e a prova é entregue sozinha quando o tempo acaba.'}
            </p>
          </section>
        </div>

        <div className="pv-rodape-fixo mt-8">
          <button type="button" className="ios-botao ios-botao-g w-full" onClick={handleStart}>
            <Play className="h-4 w-4 fill-current" />
            Começar o treino
          </button>
        </div>
      </div>
    </FundoIos>
  )
}
