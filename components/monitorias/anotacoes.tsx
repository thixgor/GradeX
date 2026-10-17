'use client'

/**
 * Editor das anotações da monitoria — na sala de aula (tema escuro, em painel)
 * e na página da reserva (tema claro). Salva sozinho e baixa um PDF feito no
 * próprio aparelho.
 */

import { useRef, useState } from 'react'
import { Check, CloudOff, Clock3, FileDown, Loader2, PencilLine } from 'lucide-react'
import { useAnotacoes } from '@/hooks/use-anotacoes'
import { horaEmBrasilia } from '@/lib/fuso-brasilia'
import { ANOTACOES_MAX } from '@/lib/monitorias/anotacoes'
import { cn } from '@/lib/utils'

export function EditorDeAnotacoes({ reservaId, ativo = true, tema = 'claro', className }: { reservaId: string; ativo?: boolean; tema?: 'claro' | 'escuro'; className?: string }) {
  const { texto, editar, situacao, sincronizadoEm, reserva, erro } = useAnotacoes(reservaId, ativo)
  const [gerando, setGerando] = useState(false)
  const [erroPdf, setErroPdf] = useState('')
  const campo = useRef<HTMLTextAreaElement>(null)
  const escuro = tema === 'escuro'
  const carregando = situacao === 'carregando'

  /** "[14:32] " no ponto do cursor: fica fácil achar no PDF o que foi dito quando. */
  function marcarHorario() {
    const el = campo.current
    const hora = `[${horaEmBrasilia(new Date())}] `
    const ini = el?.selectionStart ?? texto.length
    const fim = el?.selectionEnd ?? texto.length
    const antes = texto.slice(0, ini)
    const prefixo = antes && !antes.endsWith('\n') ? '\n' : ''
    const novo = `${antes}${prefixo}${hora}${texto.slice(fim)}`
    editar(novo)
    requestAnimationFrame(() => {
      if (!el) return
      const pos = ini + prefixo.length + hora.length
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  async function baixarPdf() {
    if (!reserva) return
    setGerando(true)
    setErroPdf('')
    try {
      const { baixarPdfDasAnotacoes } = await import('@/lib/monitorias/anotacoes-pdf')
      await baixarPdfDasAnotacoes({ texto, reserva })
    } catch {
      setErroPdf('Não deu para gerar o PDF agora. Tente de novo.')
    } finally {
      setGerando(false)
    }
  }

  const status =
    situacao === 'carregando' ? (
      <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Abrindo…</>
    ) : situacao === 'salvo' ? (
      <><Check className="h-3.5 w-3.5" aria-hidden /> Salvo{sincronizadoEm ? ` às ${horaEmBrasilia(sincronizadoEm)}` : ''}</>
    ) : situacao === 'enviando' ? (
      <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Salvando…</>
    ) : situacao === 'pendente' ? (
      <><Check className="h-3.5 w-3.5" aria-hidden /> Guardado neste aparelho</>
    ) : situacao === 'offline' ? (
      <><CloudOff className="h-3.5 w-3.5" aria-hidden /> Sem internet: guardado neste aparelho</>
    ) : (
      <><CloudOff className="h-3.5 w-3.5" aria-hidden /> Guardado só neste aparelho</>
    )

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <label htmlFor={`anotacoes-${reservaId}`} className="sr-only">
        Suas anotações desta monitoria
      </label>
      <textarea
        id={`anotacoes-${reservaId}`}
        ref={campo}
        value={texto}
        onChange={(e) => editar(e.target.value)}
        disabled={carregando}
        maxLength={ANOTACOES_MAX}
        spellCheck
        placeholder={'Escreva o que quiser lembrar.\n\nDicas: "# Título", "- item" e o botão do relógio para marcar o horário.'}
        className={cn(
          'campo-sem-zoom min-h-[180px] w-full flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60',
          escuro ? 'border-white/15 bg-neutral-950 text-white placeholder:text-white/35' : 'border-border bg-background placeholder:text-muted-foreground/70',
        )}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={cn('inline-flex min-w-0 flex-1 items-center gap-1 text-xs', escuro ? 'text-white/55' : 'text-muted-foreground')} aria-live="polite">
          {status}
        </span>
        <button
          type="button"
          onClick={marcarHorario}
          disabled={carregando}
          className={cn(
            'inline-flex h-9 touch-manipulation items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold disabled:opacity-50',
            escuro ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-muted hover:bg-muted/80',
          )}
          title="Marcar o horário agora"
        >
          <Clock3 className="h-3.5 w-3.5" aria-hidden /> Horário
        </button>
        <button
          type="button"
          onClick={() => void baixarPdf()}
          disabled={carregando || gerando || !reserva}
          className="inline-flex h-9 touch-manipulation items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {gerando ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <FileDown className="h-3.5 w-3.5" aria-hidden />} Baixar PDF
        </button>
      </div>
      {(erro || erroPdf) && <p className={cn('mt-2 text-xs', escuro ? 'text-amber-300' : 'text-amber-700')}>{erroPdf || erro}</p>}
      <p className={cn('mt-2 text-[11px] leading-relaxed', escuro ? 'text-white/40' : 'text-muted-foreground')}>
        Só você vê. Ficam guardadas na sua conta e você reencontra na página da reserva.
      </p>
    </div>
  )
}

/** Cartão da página da reserva: as mesmas anotações, para reler e baixar depois da aula. */
export function CartaoDeAnotacoes({ reservaId }: { reservaId: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <button type="button" onClick={() => setAberto((v) => !v)} className="flex w-full items-center gap-3 text-left" aria-expanded={aberto}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PencilLine className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-base font-semibold">Minhas anotações</span>
          <span className="block text-xs text-muted-foreground">Escreva durante ou depois da aula e baixe em PDF.</span>
        </span>
        <span className="text-xs font-semibold text-primary">{aberto ? 'Fechar' : 'Abrir'}</span>
      </button>
      {aberto && <EditorDeAnotacoes reservaId={reservaId} className="mt-3 h-[360px]" />}
    </section>
  )
}
