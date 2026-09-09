'use client'

import { useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageModal } from '@/components/image-modal'
import { ImagensDaQuestao } from '@/components/questoes/imagens-da-questao'
import { montarRespostaComentada } from '@/lib/provas/resposta-comentada'
import {
  imagensDaResposta,
  imagensDoEnunciado,
  layoutDaResposta,
  layoutDoEnunciado,
} from '@/lib/questoes/imagens-da-questao'
import type { Question } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * A prova como o aluno vai vê-la, dentro da tela de quem a está montando.
 *
 * ## Por que ela existe
 *
 * Quem monta a prova via um formulário: campos, caixas de texto, listas de
 * alternativas. O aluno vê um cartão com enunciado, imagens, comando e
 * alternativas. Entre os dois havia só a imaginação de quem montou — e o
 * primeiro momento em que a prova era vista de verdade era o da aplicação,
 * quando já não dá para corrigir a imagem que ficou gigante, o enunciado que
 * quebrou torto ou a alternativa que ficou vazia.
 *
 * A prévia não é uma aproximação: ela usa os MESMOS componentes da tela do
 * aluno (`ImagensDaQuestao`) e as mesmas classes do cartão de questão. O que
 * mudar lá muda aqui.
 *
 * ## As três larguras
 *
 * Celular, tablet e computador não são enfeite: o mesmo enunciado com duas
 * imagens lado a lado é uma coisa em 1280px e outra em 380px, e é no celular
 * que a maioria faz a prova. A prévia estreita a moldura, e como o componente
 * de imagens é responsivo de verdade, o que se vê é o que acontece.
 *
 * ## O gabarito
 *
 * O interruptor "ver gabarito" mostra a alternativa correta destacada e a
 * resposta comentada montada como nos PDFs (`montarRespostaComentada`) — é a
 * mesma coisa que o aluno lê depois do término, e o único jeito de conferir
 * antes de aplicar que o comentário está lá e faz sentido.
 */

type Largura = 'celular' | 'tablet' | 'computador'

const LARGURAS: { valor: Largura; rotulo: string; icone: typeof Monitor; classe: string }[] = [
  { valor: 'celular', rotulo: 'Celular', icone: Smartphone, classe: 'max-w-[380px]' },
  { valor: 'tablet', rotulo: 'Tablet', icone: Tablet, classe: 'max-w-[760px]' },
  { valor: 'computador', rotulo: 'Computador', icone: Monitor, classe: 'max-w-full' },
]

function formatarTexto(texto: string | undefined): string {
  return (texto || '').replace(/\\nl/g, '\n').replace(/\\n/g, '\n')
}

export function PreviaDaProva({
  titulo,
  descricao,
  questoes,
  className,
}: {
  titulo: string
  descricao?: string
  questoes: Question[]
  className?: string
}) {
  const [largura, setLargura] = useState<Largura>('computador')
  const [mostrarGabarito, setMostrarGabarito] = useState(false)
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null)

  const larguraEscolhida = LARGURAS.find((l) => l.valor === largura) ?? LARGURAS[2]
  const validas = useMemo(() => (questoes || []).filter(Boolean), [questoes])

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
          {LARGURAS.map((opcao) => {
            const Icone = opcao.icone
            const ativo = largura === opcao.valor
            return (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => setLargura(opcao.valor)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition',
                  ativo ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <Icone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{opcao.rotulo}</span>
              </button>
            )
          })}
        </div>

        <Button
          type="button"
          variant={mostrarGabarito ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMostrarGabarito((atual) => !atual)}
          className="gap-1.5"
        >
          {mostrarGabarito ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {mostrarGabarito ? 'Ocultar gabarito' : 'Ver gabarito e comentários'}
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-3 sm:p-5">
        <div className={cn('mx-auto space-y-6 transition-all', larguraEscolhida.classe)}>
          <header className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Como o aluno vê
            </p>
            <h3 className="mt-1 text-lg font-bold leading-tight">{titulo || 'Prova sem título'}</h3>
            {descricao ? <p className="mt-1 text-sm text-muted-foreground">{descricao}</p> : null}
            <p className="mt-2 text-xs text-muted-foreground">
              {validas.length} {validas.length === 1 ? 'questão' : 'questões'}
            </p>
          </header>

          {validas.length === 0 ? (
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
              <Info className="h-4 w-4 flex-none" />
              Adicione uma questão para ver a prévia.
            </div>
          ) : (
            validas.map((questao, indice) => (
              <QuestaoNaPrevia
                key={questao.id || indice}
                questao={questao}
                indice={indice}
                mostrarGabarito={mostrarGabarito}
                onAmpliar={setImagemAmpliada}
              />
            ))
          )}
        </div>
      </div>

      <ImageModal
        isOpen={!!imagemAmpliada}
        src={imagemAmpliada || ''}
        onClose={() => setImagemAmpliada(null)}
      />
    </div>
  )
}

function QuestaoNaPrevia({
  questao,
  indice,
  mostrarGabarito,
  onAmpliar,
}: {
  questao: Question
  indice: number
  mostrarGabarito: boolean
  onAmpliar: (url: string) => void
}) {
  const respostaComentada = mostrarGabarito ? montarRespostaComentada(questao) : ''
  const imagensDoComentario = mostrarGabarito ? imagensDaResposta(questao) : []
  const comandoPadrao =
    questao.type === 'multiple-choice'
      ? 'Assinale a alternativa correta'
      : questao.type === 'essay'
      ? 'Redija seu texto'
      : 'Responda a questão corretamente'

  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-4 py-3">
        <h4 className="text-lg font-semibold">Questão {questao.number || indice + 1}</h4>
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {questao.type === 'discursive' ? 'Discursiva' : questao.type === 'essay' ? 'Redação' : 'Múltipla escolha'}
        </span>
      </div>

      <div className="space-y-5 p-4">
        {questao.statement ? (
          <div className="space-y-2">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{formatarTexto(questao.statement)}</p>
            {questao.statementSource ? (
              <p className="text-xs italic text-muted-foreground">Fonte: {questao.statementSource}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">(Enunciado em branco)</p>
        )}

        <ImagensDaQuestao
          imagens={imagensDoEnunciado(questao)}
          layout={layoutDoEnunciado(questao)}
          onAmpliar={onAmpliar}
        />

        <div className="rounded-xl border border-primary/15 border-l-4 border-l-primary/40 bg-primary/5 p-4">
          <p className="whitespace-pre-wrap font-medium">
            {formatarTexto(questao.command) || comandoPadrao}
          </p>
        </div>

        {questao.type === 'multiple-choice' ? (
          <div className="space-y-3">
            {(questao.alternatives || []).map((alternativa) => {
              const certa = mostrarGabarito && alternativa.isCorrect
              return (
                <div
                  key={alternativa.id}
                  className={cn(
                    'rounded-xl border p-4 transition-all',
                    certa
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'border-border/70',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border border-muted-foreground/40 text-[11px] font-bold">
                      {alternativa.letter}
                    </span>
                    <p className="min-w-0 flex-1 whitespace-pre-wrap">
                      {formatarTexto(alternativa.text) || (
                        <span className="italic text-muted-foreground">(Alternativa em branco)</span>
                      )}
                    </p>
                    {certa ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600 dark:text-emerald-400" />
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            {questao.type === 'essay'
              ? 'Espaço de redação — o aluno escreve o texto aqui.'
              : `Campo de resposta discursiva${questao.maxScore ? ` (até ${questao.maxScore} pontos)` : ''}.`}
          </div>
        )}

        {mostrarGabarito && (respostaComentada || imagensDoComentario.length > 0) ? (
          <div className="space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-700/40 dark:bg-amber-950/20">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <BookOpen className="h-3.5 w-3.5" />
              Resposta comentada
            </p>
            {respostaComentada ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-950/90 dark:text-amber-100/80">
                {respostaComentada}
              </p>
            ) : null}
            <ImagensDaQuestao
              imagens={imagensDoComentario}
              layout={layoutDaResposta(questao)}
              onAmpliar={onAmpliar}
              alt="Imagem da resposta comentada"
            />
          </div>
        ) : null}

        {mostrarGabarito && !respostaComentada && imagensDoComentario.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">
            Esta questão não tem resposta comentada — o aluno vai ver só o gabarito.
          </p>
        ) : null}
      </div>
    </article>
  )
}
