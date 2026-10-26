'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Check, Crown, Minus, Plus, Sparkles, Target, X } from 'lucide-react'

import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { PLUS_LABEL, QUEST_LABEL, ROTA_ASSINATURA } from '@/lib/account-tier'
import './estudo-ia.css'

/**
 * As peças das ferramentas de estudo com IA, no vidro iOS
 * (`estudo-ia.css` + `components/materiais/vidro-ios.css`).
 */

/** Controle segmentado do sistema: o polegar desliza até a opção escolhida. */
export function Segmentado<T extends string | number>({
  opcoes,
  valor,
  onChange,
  rotulo,
  desabilitado,
}: {
  opcoes: { id: T; rotulo: ReactNode; desabilitado?: boolean }[]
  valor: T
  onChange: (valor: T) => void
  rotulo: string
  desabilitado?: boolean
}) {
  const indice = Math.max(0, opcoes.findIndex((o) => o.id === valor))
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className="ios-segmentado"
      style={{ ['--segmentos' as string]: opcoes.length, ['--indice' as string]: indice } as CSSProperties}
    >
      {opcoes.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          role="radio"
          aria-checked={o.id === valor}
          disabled={desabilitado || o.desabilitado}
          onClick={() => onChange(o.id)}
          className="ios-segmento disabled:opacity-40"
        >
          <span className="truncate">{o.rotulo}</span>
        </button>
      ))}
    </div>
  )
}

/** − N + — números pequenos, sem teclado no celular. */
export function Stepper({
  valor,
  onChange,
  min,
  max,
  passo = 1,
  rotulo,
  formatar,
}: {
  valor: number
  onChange: (valor: number) => void
  min: number
  max: number
  passo?: number
  rotulo: string
  formatar?: (valor: number) => ReactNode
}) {
  const mudar = (delta: number) => onChange(Math.max(min, Math.min(max, valor + delta)))
  return (
    <div className="ia-stepper" role="group" aria-label={rotulo}>
      <button type="button" aria-label={`Menos ${rotulo.toLowerCase()}`} disabled={valor <= min} onClick={() => mudar(-passo)}>
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <output aria-live="polite">{formatar ? formatar(valor) : valor}</output>
      <button type="button" aria-label={`Mais ${rotulo.toLowerCase()}`} disabled={valor >= max} onClick={() => mudar(passo)}>
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}

/** Chip que liga e desliga (vários ao mesmo tempo), com a marca de seleção. */
export function ChipAlternar({
  ativo,
  onClick,
  children,
  descricao,
  icone,
  desabilitado,
  titulo,
}: {
  ativo: boolean
  onClick: () => void
  children: ReactNode
  descricao?: ReactNode
  icone?: ReactNode
  desabilitado?: boolean
  titulo?: string
}) {
  return (
    <button type="button" aria-pressed={ativo} onClick={onClick} disabled={desabilitado} title={titulo} className="ia-chip">
      <span className="ia-marca" aria-hidden>
        {ativo ? <Check className="h-3 w-3" strokeWidth={3} /> : icone ?? null}
      </span>
      <span className="min-w-0">
        {children}
        {descricao ? <small>{descricao}</small> : null}
      </span>
    </button>
  )
}

/** Uma linha do formulário: rótulo pequeno em cima, controle embaixo. */
export function Campo({ rotulo, nota, children, className }: { rotulo: ReactNode; nota?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="ia-rotulo">
        <span>{rotulo}</span>
        {nota ? <small>{nota}</small> : null}
      </div>
      {children}
    </div>
  )
}

/** A folha que sobe do rodapé (centralizada no desktop), já no escopo do vidro. */
export function FolhaModal({
  aberta,
  onFechar,
  titulo,
  subtitulo,
  children,
  rodape,
}: {
  aberta: boolean
  onFechar: () => void
  titulo: ReactNode
  subtitulo?: ReactNode
  children: ReactNode
  rodape?: ReactNode
}) {
  return (
    <NoCorpo>
    <Dialog open={aberta} onOpenChange={(v) => !v && onFechar()} variant="sheet">
      <div
        role="dialog"
        aria-modal="true"
        className="ia-folha-modal vidro-ios flex max-h-[88vh] flex-col supports-[height:100dvh]:max-h-[88dvh] sm:w-[600px]"
      >
        <div className="ia-alca" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <h2 className="ios-titulo-secao">{titulo}</h2>
            {subtitulo ? <p className="ios-rotulo-2 mt-1 text-[14px] leading-snug">{subtitulo}</p> : null}
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="ios-icone-botao !text-[color:var(--ios-rotulo-2)]">
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 sm:px-6">{children}</div>
        {rodape ? (
          <div className="border-t border-[color:var(--ios-separador)] px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">{rodape}</div>
        ) : null}
      </div>
    </Dialog>
    </NoCorpo>
  )
}

/**
 * Leva o conteúdo para o `body`. O fundo de vidro cria um contexto de
 * empilhamento próprio, e um diálogo dentro dele ficava por baixo do botão
 * flutuante do app (`mobile-floating-dock`) e do cabeçalho.
 */
export function NoCorpo({ children }: { children: ReactNode }) {
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  return montado ? createPortal(children, document.body) : null
}

/**
 * A vitrine de quem não assina: o que a ferramenta faz e os dois caminhos —
 * Plus+ (tudo) ou Quest+ (Banco + IA de estudo). Sem fingir que é um erro.
 */
export function VitrineIa({ recurso, beneficios }: { recurso: 'flashcards' | 'provas'; beneficios: string[] }) {
  return (
    <section className="ia-vitrine" aria-labelledby="vitrine-ia-titulo">
      <p className="ios-ambar flex items-center gap-1.5 text-[13px] font-bold">
        <Sparkles className="h-4 w-4" /> Exclusivo para assinantes
      </p>
      <h2 id="vitrine-ia-titulo" className="ios-titulo-produto mt-2 max-w-xl">
        {recurso === 'flashcards'
          ? 'Diga o tema. A IA monta o deck em segundos.'
          : 'Uma prova inteira, do seu cronograma, com resposta comentada que ensina.'}
      </h2>
      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {beneficios.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-[15px] leading-snug">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--ios-tinta-suave)] ios-tinta">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Link href={ROTA_ASSINATURA} className="ios-botao ios-botao-g">
          <Crown className="h-[18px] w-[18px]" /> Assinar {PLUS_LABEL}
        </Link>
        <Link href={ROTA_ASSINATURA} className="ios-botao-suave ios-botao-g">
          <Target className="h-[18px] w-[18px]" /> Conhecer o {QUEST_LABEL}
        </Link>
      </div>
      <p className="ios-rotulo-3 mt-3 text-[13px]">
        {recurso === 'flashcards' ? 'Flashcards com IA' : 'Provas com IA'} estão no {PLUS_LABEL} e no {QUEST_LABEL}.
      </p>
    </section>
  )
}

/** Frases que se revezam enquanto a IA trabalha — o tempo passa com algo para ler. */
export function useFraseRotativa(frases: string[], ativo: boolean, intervaloMs = 2600): string {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!ativo) {
      setI(0)
      return
    }
    const id = window.setInterval(() => setI((v) => (v + 1) % frases.length), intervaloMs)
    return () => window.clearInterval(id)
  }, [ativo, frases.length, intervaloMs])
  return frases[i] ?? frases[0]
}

/** O rascunho que se escreve: linhas fantasmas de largura variada. */
export function Rascunho({ linhas = 4, className }: { linhas?: number; className?: string }) {
  const larguras = ['92%', '78%', '86%', '64%', '71%', '55%']
  return (
    <div className={cn('ia-rascunho space-y-2.5', className)} aria-hidden>
      {Array.from({ length: linhas }).map((_, i) => (
        <i key={i} style={{ width: larguras[i % larguras.length], animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  )
}
