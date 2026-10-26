'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Flame, Timer, UserRound } from 'lucide-react'
import { Legend, MultiStackedDayColumns } from '@/components/charts/chart-kit'
import { PainelDeFoco } from '@/components/foco/painel-de-foco'
import { FRENTES } from '@/components/profile/frentes-de-estudo'
import { fraseDoRitmo } from '@/components/profile/ritmo-do-perfil'
import type { ResumoDoPerfil } from '@/components/profile/overview-tab'
import type { DiaDeEstudo } from '@/lib/estudo/resumo-de-estudo'
import { formatarMinutos } from '@/lib/foco/ritmo-de-foco'

export type DiaDoPainel = { date: string } & DiaDeEstudo

/**
 * "Seu desempenho" no painel inicial: o placar de todas as frentes e as duas
 * últimas semanas, com o caminho direto para os gráficos e para o perfil.
 *
 * Antes o painel tinha quatro números soltos (dois deles errados) e o perfil
 * só se achava pelo menu da conta. Os números aqui são os mesmos do perfil —
 * a fonte é a mesma (`/api/user/statistics` → `lib/estudo/resumo-de-estudo`).
 */
export function PainelDeDesempenho({
  resumo,
  ultimos14,
}: {
  resumo: ResumoDoPerfil | null
  ultimos14: DiaDoPainel[] | null
}) {
  const g = resumo?.geral
  const temAtividade = !!ultimos14?.some(d => FRENTES.some(f => d[f.id] > 0))

  const blocos = [
    {
      rotulo: 'Questões',
      valor: g ? g.questoes.toLocaleString('pt-BR') : null,
      nota: g?.acuracia != null ? `${g.acuracia}% de acerto` : 'banco, provas e quiz',
    },
    {
      rotulo: 'Cartas revisadas',
      valor: resumo ? resumo.flashcards.revisoes.toLocaleString('pt-BR') : null,
      nota: resumo?.flashcards.acuracia != null ? `${resumo.flashcards.acuracia}% lembradas` : 'nos flashcards',
    },
    {
      rotulo: 'Materiais e anatomia',
      valor: resumo ? (resumo.materiais.estudados + resumo.anatomia.pranchas).toLocaleString('pt-BR') : null,
      nota: resumo ? `${resumo.materiais.estudados} materiais · ${resumo.anatomia.pranchas} pranchas` : '',
    },
    {
      rotulo: 'Foco na semana',
      valor: resumo ? formatarMinutos(resumo.foco.minutosNaSemana) : null,
      nota: resumo?.foco.minutosHoje ? `${formatarMinutos(resumo.foco.minutosHoje)} hoje` : 'cronometrado',
    },
  ]

  return (
    <section data-tour="stats" className="glass-stat dash-rise viz rounded-2xl p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Seu desempenho</h2>
        <div className="flex items-center gap-1">
          <Link
            href="/profile"
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <UserRound className="h-4 w-4" />
            Meu perfil
          </Link>
          <Link
            href="/profile?tab=desempenho"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary/10 px-3.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            <BarChart3 className="h-4 w-4" />
            Ver gráficos
          </Link>
        </div>
      </div>

      <p className="mb-4 flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <Flame className={g?.estudouHoje ? 'h-4 w-4 text-orange-500' : 'h-4 w-4 text-muted-foreground/60'} aria-hidden="true" />
        {g ? (
          <>
            <span className="font-semibold text-foreground">{g.sequencia} {g.sequencia === 1 ? 'dia' : 'dias'}</span>
            <span className="truncate">· {fraseDoRitmo(g)}</span>
          </>
        ) : (
          <span className="inline-block h-3.5 w-52 animate-pulse rounded bg-muted" />
        )}
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
        {blocos.map(bloco => (
          <div key={bloco.rotulo} className="min-w-0">
            <p className="text-[12px] font-medium text-muted-foreground">{bloco.rotulo}</p>
            {bloco.valor !== null ? (
              <p className="text-2xl font-bold tracking-tight tabular-nums">{bloco.valor}</p>
            ) : (
              <p className="my-1 h-6 w-16 animate-pulse rounded bg-muted" />
            )}
            <p className="truncate text-[11.5px] text-muted-foreground">{bloco.nota}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-border/60 pt-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-[13px] font-semibold">Últimas duas semanas</p>
          <p className="text-[11.5px] text-muted-foreground">ações de estudo por dia</p>
        </div>
        {ultimos14 && temAtividade ? (
          <>
            <div className="mb-2">
              <Legend items={FRENTES.map(f => ({ label: f.nome, color: f.cor }))} />
            </div>
            <MultiStackedDayColumns
              data={ultimos14.map(d => ({ date: d.date, values: FRENTES.map(f => d[f.id]) }))}
              series={FRENTES.map(f => ({ label: f.serie, color: f.cor }))}
              unidade={['ação', 'ações']}
              altura={128}
              rotuloACada={4}
              ariaLabel="Ações de estudo por dia nas últimas duas semanas, por frente"
            />
          </>
        ) : ultimos14 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            Nada nas últimas duas semanas ainda. Uma questão já aparece aqui.
          </p>
        ) : (
          <div className="h-[128px] animate-pulse rounded-xl bg-muted/50" />
        )}
      </div>

      <Link
        href="/profile?tab=desempenho"
        className="group mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-primary"
      >
        Ver desempenho completo
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  )
}

/** O cronômetro de foco também mora no painel: é onde o dia de estudo começa. */
export function CartaoDeFocoDoPainel() {
  return (
    <section className="glass-stat dash-rise rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Timer className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight tracking-tight">Sessão de foco</h2>
          <p className="text-[12.5px] leading-snug text-muted-foreground">
            Diga o que vai estudar e cronometre. O tempo entra no seu desempenho.
          </p>
        </div>
      </div>
      <PainelDeFoco variante="cartao" />
    </section>
  )
}
