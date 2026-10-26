'use client'

import { ChevronRight, Flame } from 'lucide-react'
import type { ResumoDoPerfil } from '@/components/profile/overview-tab'
import { formatarMinutos } from '@/lib/foco/ritmo-de-foco'

/** A frase do dia: fecha o ciclo de quem estudou, lembra quem ainda não. */
export function fraseDoRitmo(g: ResumoDoPerfil['geral']): string {
  if (g.estudouHoje) {
    return g.sequencia > 1
      ? `Você estudou hoje: ${g.sequencia} dias seguidos.`
      : 'Você estudou hoje. Volte amanhã para começar uma sequência.'
  }
  return g.sequencia > 0
    ? `Estude hoje para manter a sequência de ${g.sequencia} ${g.sequencia === 1 ? 'dia' : 'dias'}.`
    : 'Uma questão, uma carta ou um material hoje já começa uma sequência.'
}

/**
 * A faixa de vidro sob o nome: sequência, questões, cartas e foco.
 *
 * É o placar da pessoa e fica à vista em todas as seções do perfil. A frase de
 * cima muda com o dia — "estudou hoje" fecha o ciclo; "estude hoje para
 * manter" é o lembrete de que a sequência está em jogo.
 */
export function RitmoDoPerfil({
  resumo,
  onAbrirDesempenho,
}: {
  resumo: ResumoDoPerfil | null
  onAbrirDesempenho: () => void
}) {
  const g = resumo?.geral
  const frase = g ? fraseDoRitmo(g) : null


  return (
    <button type="button" onClick={onAbrirDesempenho} className="perfil-ritmo ios-vidro ios-toque" aria-label="Abrir desempenho">
      <span className="flex items-center gap-2 px-4 pt-3 text-[13px] ios-rotulo-2">
        <Flame className="ios-chama h-4 w-4 shrink-0" data-acesa={g?.estudouHoje ? 'true' : 'false'} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left">
          {frase ?? <span className="ios-esqueleto inline-block h-3.5 w-56 rounded align-middle" />}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 ios-rotulo-3" aria-hidden="true" />
      </span>
      <span className="ios-faixa perfil-placar py-3">
        <span>
          <span className="ios-faixa-rotulo">Sequência</span>
          <span className="ios-faixa-valor !text-[var(--ios-rotulo)]">{g ? `${g.sequencia}d` : '—'}</span>
          <span className="ios-faixa-nota">{g ? `recorde ${g.maiorSequencia}d` : ' '}</span>
        </span>
        <span>
          <span className="ios-faixa-rotulo">Questões</span>
          <span className="ios-faixa-valor !text-[var(--ios-rotulo)]">{g ? g.questoes.toLocaleString('pt-BR') : '—'}</span>
          <span className="ios-faixa-nota">{g?.acuracia != null ? `${g.acuracia}% de acerto` : 'sem acerto ainda'}</span>
        </span>
        <span>
          <span className="ios-faixa-rotulo">Cartas</span>
          <span className="ios-faixa-valor !text-[var(--ios-rotulo)]">
            {resumo ? resumo.flashcards.revisoes.toLocaleString('pt-BR') : '—'}
          </span>
          <span className="ios-faixa-nota">
            {resumo?.flashcards.acuracia != null ? `${resumo.flashcards.acuracia}% lembradas` : 'revisões'}
          </span>
        </span>
        <span>
          <span className="ios-faixa-rotulo">Foco</span>
          <span className="ios-faixa-valor !text-[var(--ios-rotulo)]">{resumo ? formatarMinutos(resumo.foco.minutosNaSemana) : '—'}</span>
          <span className="ios-faixa-nota">nesta semana</span>
        </span>
      </span>
    </button>
  )
}
