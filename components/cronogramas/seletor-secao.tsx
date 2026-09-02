'use client'

import { GraduationCap } from 'lucide-react'

import { SECOES, type SecaoCurso } from '@/lib/cronogramas/tipos'

interface SeletorSecaoProps {
  secao: SecaoCurso
  periodo: number
  periodosDisponiveis: number[]
  /** Períodos com ementa importada — ganham um ponto discreto. */
  periodosComEmenta?: number[]
  onSecaoChange: (secao: SecaoCurso) => void
  onPeriodoChange: (periodo: number) => void
  /** Seção que veio do cadastro do aluno — ganha o selo "sua seção". */
  secaoPadrao?: SecaoCurso | null
  compacto?: boolean
}

/**
 * Seletor de seção e período.
 *
 * Os dois controles ficam juntos porque são uma decisão só: "qual ementa eu
 * estou olhando". Separá-los em telas ou passos diferentes — como era antes —
 * fazia o aluno escolher o curso, avançar, e só então descobrir que o período
 * também era pergunta.
 *
 * Em telas estreitas as seções viram uma faixa rolável em vez de encolherem
 * até virar quadradinhos ilegíveis, com a máscara de esmaecimento do site
 * (`.fade-scroll-x`) avisando que há mais para o lado — sem ela, a quarta
 * seção simplesmente não existia para quem nunca arrastou a faixa.
 *
 * São botões de alternância, não abas: `role="tab"` sem painel correspondente
 * fazia o leitor de tela anunciar "aba 2 de 4" e esperar um conteúdo que não
 * existe.
 */
export function SeletorSecao({
  secao,
  periodo,
  periodosDisponiveis,
  periodosComEmenta = [],
  onSecaoChange,
  onPeriodoChange,
  secaoPadrao,
  compacto = false,
}: SeletorSecaoProps) {
  const periodos = periodosDisponiveis.length > 0 ? periodosDisponiveis : [1]
  const comEmenta = new Set(periodosComEmenta)

  return (
    <div className={compacto ? 'space-y-2' : 'space-y-3'}>
      <div
        className="fade-scroll-x -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide"
        role="group"
        aria-label="Seção do curso"
      >
        {SECOES.map(item => {
          const ativa = item.id === secao
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={ativa}
              onClick={() => onSecaoChange(item.id)}
              className={`group relative flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                ativa
                  ? 'border-transparent text-white shadow-lg'
                  : 'border-border/60 bg-background/60 text-foreground hover:border-foreground/25 hover:bg-muted/50'
              }`}
              style={
                ativa
                  ? {
                      backgroundColor: item.cor,
                      boxShadow: `0 8px 24px -10px ${item.cor}`,
                      // A cor do anel de foco acompanha a seção: um anel verde
                      // sobre o chip laranja da Odontologia sumiria.
                      ['--tw-ring-color' as string]: `${item.cor}99`,
                    }
                  : undefined
              }
            >
              <span aria-hidden className="text-base leading-none">
                {item.emoji}
              </span>
              <span className="whitespace-nowrap text-sm font-semibold">{item.nome}</span>
              {secaoPadrao === item.id && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    ativa ? 'bg-white/25 text-white' : 'bg-[#468152]/12 text-[#468152] dark:text-[#7DCEA0]'
                  }`}
                >
                  sua
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Período">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5" aria-hidden />
          Período
        </span>
        {periodos.map(numero => {
          const ativo = numero === periodo
          const temEmenta = comEmenta.has(numero)
          return (
            <button
              key={numero}
              type="button"
              onClick={() => onPeriodoChange(numero)}
              aria-pressed={ativo}
              aria-label={`${numero}º período${temEmenta ? ' — ementa publicada' : ''}`}
              title={temEmenta ? 'Ementa publicada' : 'Ementa ainda não publicada para este período'}
              className={`relative h-9 min-w-[2.5rem] rounded-lg px-2 text-sm font-semibold tabular-nums transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                ativo
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {numero}º
              {temEmenta && (
                <span
                  className={`absolute right-1 top-1 h-1 w-1 rounded-full ${
                    ativo ? 'bg-background/70' : 'bg-[#468152]'
                  }`}
                  aria-hidden
                />
              )}
            </button>
          )
        })}

        <span className="ml-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-1 w-1 rounded-full bg-[#468152]" aria-hidden />
          ementa publicada
        </span>
      </div>
    </div>
  )
}
