'use client'

import { useState } from 'react'
import { CheckCheck, ChevronLeft, Clock, Flag, LayoutList, ListOrdered, Play, Rows3, Shuffle, Timer, TimerOff, Zap } from 'lucide-react'
import { FundoIos } from '@/components/materiais/fundo-ios'
import { ExamBrandFooter, ExamBrandHeader } from '@/components/exam/exam-brand-header'
import { CapaDaProva } from '@/components/exam/capa-da-prova'
import { CoverImage } from '@/components/cover-image'
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
  { value: null, label: 'Sem limite', icon: TimerOff },
  { value: 10, label: '10 min', icon: Zap },
  { value: 20, label: '20 min', icon: Timer },
  { value: 30, label: '30 min', icon: Timer },
  { value: 90, label: '1h30', icon: Clock },
  { value: 120, label: '2 h', icon: Clock },
  { value: 240, label: '4 h', icon: Clock },
]

/**
 * A configuração do treino.
 *
 * Do notebook para cima, a página de álbum: a capa da prova, o título e o
 * resumo do treino à esquerda; os ajustes à direita. No celular, tudo numa
 * coluna e o botão de começar preso ao polegar. Os ajustes seguem os Ajustes
 * do iPhone (grupos com rótulo e explicação, segmentado, chave, cápsulas), e o
 * resumo responde a cada toque — o valor que mudou entra de novo, para a
 * pessoa ver que a escolha pegou. Estilo em components/exam/prova-ios.css.
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
  const rotuloDoTempo = TIME_OPTIONS.find(o => o.value === timeLimitMinutes)?.label ?? 'Sem limite'

  const segmentado = <T extends string>(
    rotuloDoGrupo: string,
    valor: T,
    opcoes: { valor: T; rotulo: string; icone: React.ComponentType<{ className?: string }> }[],
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
          className="ios-segmento h-11"
          onClick={() => aoEscolher(o.valor)}
        >
          <o.icone className="h-4 w-4 shrink-0" />
          <span className="truncate">{o.rotulo}</span>
        </button>
      ))}
    </div>
  )

  // O cabeçalho de cada grupo: o ícone de cor dos Ajustes ao lado do nome.
  const cabeca = (titulo: string, Icone: React.ComponentType<{ className?: string }>, tom?: 'ambar' | 'azul' | 'cinza') => (
    <h2 className="mb-2.5 flex items-center gap-2.5 px-1 text-[15px] font-semibold">
      <span className="pv-icone-linha h-7 w-7 rounded-[8px]" data-tom={tom}>
        <Icone className="h-[15px] w-[15px]" />
      </span>
      {titulo}
    </h2>
  )

  // O resumo do treino: cada valor tem `key` próprio, então entra de novo
  // (`pv-troca`) quando a escolha muda.
  const resumo = [
    { rotulo: 'Questões', valor: String(questionCount), chave: 'q' },
    { rotulo: 'Navegação', valor: navigationMode === 'paginated' ? 'Uma por vez' : 'Em sequência', chave: navigationMode },
    { rotulo: 'Correção', valor: feedbackMode === 'immediate' ? 'Na hora' : 'No final', chave: feedbackMode },
    { rotulo: 'Tempo', valor: rotuloDoTempo, chave: String(timeLimitMinutes) },
  ]

  return (
    <FundoIos className="min-h-[100dvh] flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 pt-[calc(8px+env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-3 py-2">
          <button type="button" className="ios-voltar ios-vidro" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </button>
          <ExamBrandHeader />
        </nav>

        <div className="mt-4 grid items-start gap-8 sm:mt-6 lg:mt-10 lg:grid-cols-2 lg:gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:gap-16">
          {/* ── A prova ── */}
          <section className="min-w-0 space-y-6">
            <div className="relative">
              {exam.coverImage && (
                <div aria-hidden className="pv-arte-brilho">
                  <CoverImage src={exam.coverImage} alt="" sizes="(max-width: 1024px) 100vw, 560px" />
                </div>
              )}
              <div className="pv-arte ios-capa">
                <CapaDaProva
                  adaptavel
                  src={exam.coverImage}
                  titulo={exam.title}
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="max-h-[44vh] lg:max-h-[min(46vh,440px)]"
                />
              </div>
            </div>

            <header className="pv-entra space-y-3" style={{ '--pv-ordem': 1 } as React.CSSProperties}>
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

            {/* O resumo responde a cada escolha. */}
            <div
              className="pv-entra ios-cartao rounded-[22px] py-4"
              style={{ '--pv-ordem': 2 } as React.CSSProperties}
              aria-live="polite"
            >
              <div className="ios-faixa">
                {resumo.map(item => (
                  <div key={item.rotulo}>
                    <span className="ios-faixa-rotulo">{item.rotulo}</span>
                    <span
                      key={item.chave}
                      className="pv-troca ios-faixa-valor whitespace-nowrap text-[17px]"
                      style={{ color: 'var(--ios-rotulo)' }}
                    >
                      {item.valor}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Os ajustes ── */}
          <section className="min-w-0">
            <div className="pv-painel space-y-7 p-5 sm:p-7">
              <div className="pv-entra" style={{ '--pv-ordem': 2 } as React.CSSProperties}>
                {cabeca('Navegação', LayoutList, 'azul')}
                {segmentado(
                  'Navegação',
                  navigationMode,
                  [
                    { valor: 'paginated', rotulo: 'Uma por vez', icone: Rows3 },
                    { valor: 'scroll', rotulo: 'Em sequência', icone: LayoutList },
                  ],
                  setNavigationMode,
                )}
                <p key={navigationMode} className="pv-troca ios-pe-lista">
                  {navigationMode === 'paginated'
                    ? 'Uma questão por tela, com anterior e próxima ao alcance do polegar.'
                    : 'Todas as questões numa página só, para rolar e responder na ordem que quiser.'}
                </p>
              </div>

              <div className="pv-entra" style={{ '--pv-ordem': 3 } as React.CSSProperties}>
                {cabeca('Correção', CheckCheck)}
                {segmentado(
                  'Correção',
                  feedbackMode,
                  [
                    { valor: 'immediate', rotulo: 'Na hora', icone: Zap },
                    { valor: 'end', rotulo: 'No final', icone: Flag },
                  ],
                  setFeedbackMode,
                )}
                <p key={feedbackMode} className="pv-troca ios-pe-lista">
                  {feedbackMode === 'immediate'
                    ? 'Você confere cada objetiva logo depois de responder, com o comentário.'
                    : 'O gabarito comentado aparece só quando você finalizar.'}
                </p>
              </div>

              <div className="pv-entra" style={{ '--pv-ordem': 4 } as React.CSSProperties}>
                {cabeca('Ordem', ListOrdered, 'cinza')}
                <div className="ios-lista">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={shuffleQuestions}
                    className="ios-linha w-full text-left"
                    onClick={() => setShuffleQuestions(!shuffleQuestions)}
                  >
                    <span className="pv-icone-linha" data-tom="ambar">
                      <Shuffle key={String(shuffleQuestions)} className="pv-gira h-4 w-4" />
                    </span>
                    <span className="flex-1 text-[16px]">Embaralhar questões</span>
                    <span className="pv-chave" aria-hidden />
                  </button>
                </div>
                <p key={String(shuffleQuestions)} className="pv-troca ios-pe-lista">
                  {shuffleQuestions ? 'As questões vêm em ordem aleatória.' : 'As questões vêm na ordem original da prova.'}
                </p>
              </div>

              <div className="pv-entra" style={{ '--pv-ordem': 5 } as React.CSSProperties}>
                {cabeca('Tempo', Timer, 'ambar')}
                <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Limite de tempo">
                  {TIME_OPTIONS.map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      role="radio"
                      aria-checked={timeLimitMinutes === opt.value}
                      className="pv-tempo"
                      onClick={() => setTimeLimitMinutes(opt.value)}
                    >
                      <opt.icon className="h-4 w-4" />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
                <p key={String(timeLimitMinutes)} className="pv-troca ios-pe-lista">
                  {timeLimitMinutes === null
                    ? 'Sem cronômetro: no seu ritmo.'
                    : 'Um cronômetro corre no topo e a prova é entregue sozinha quando o tempo acaba.'}
                </p>
              </div>
            </div>

            <div className="pv-rodape-fixo">
              <button
                type="button"
                className="ios-botao ios-botao-g exam-botao-chama relative w-full overflow-hidden"
                onClick={handleStart}
              >
                <Play className="h-4 w-4 fill-current" />
                Começar o treino
              </button>
            </div>
          </section>
        </div>

        <ExamBrandFooter className="mt-10 pb-8" />
      </div>
    </FundoIos>
  )
}
