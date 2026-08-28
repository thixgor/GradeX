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
 * até virar quadradinhos ilegíveis, e os períodos quebram em várias linhas.
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
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
        role="tablist"
        aria-label="Seção do curso"
      >
        {SECOES.map(item => {
          const ativa = item.id === secao
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={ativa}
              onClick={() => onSecaoChange(item.id)}
              className={`group relative flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 ${
                ativa
                  ? 'border-transparent text-white shadow-lg'
                  : 'border-border/60 bg-background/60 text-foreground hover:border-foreground/20 hover:bg-muted/50'
              }`}
              style={ativa ? { backgroundColor: item.cor, boxShadow: `0 8px 24px -10px ${item.cor}` } : undefined}
            >
              <span aria-hidden className="text-base leading-none">{item.emoji}</span>
              <span className="text-sm font-semibold whitespace-nowrap">{item.nome}</span>
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

      <div className="flex flex-wrap items-center gap-1.5">
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
              onClick={() => onPeriodoChange(numero)}
              aria-pressed={ativo}
              title={temEmenta ? undefined : 'Ementa ainda não publicada para este período'}
              className={`relative h-8 min-w-[2.25rem] rounded-lg px-2 text-sm font-semibold transition-all duration-200 ${
                ativo
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {numero}º
              {temEmenta && (
                <span
                  className={`absolute right-1 top-1 h-1 w-1 rounded-full ${ativo ? 'bg-background/70' : 'bg-[#468152]'}`}
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
