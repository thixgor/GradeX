'use client'

/**
 * A marca na sala: o ícone e o endereço da DomineAqui no topo, e uma marca
 * d'água pequena no palco com o código da monitoria, o monitor e quem está
 * vendo. Ela aparece em qualquer captura de tela ou gravação feita por fora —
 * desestimula vazar a aula — sem cobrir rosto nem conteúdo (canto, translúcida,
 * sem receber toques).
 */

import { cn } from '@/lib/utils'

/** "Carla Mendes Souza" → "Carla M.": curto o bastante para o canto do vídeo. */
export function nomeCurto(nome: string): string {
  const partes = (nome || '').trim().split(/\s+/).filter(Boolean)
  if (partes.length <= 1) return partes[0] || ''
  return `${partes[0]} ${partes[partes.length - 1][0]}.`
}

export function MarcaNoTopo() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/favicon.png" alt="DomineAqui" width={28} height={28} className="h-7 w-7 rounded-lg" />
      <div className="hidden leading-tight md:block">
        <p className="text-xs font-bold tracking-tight">DomineAqui</p>
        <p className="text-[10px] text-white/50">www.domineaqui.com.br</p>
      </div>
      <span className="ml-1 hidden h-6 w-px bg-white/15 md:block" aria-hidden />
    </div>
  )
}

export function MarcaDagua({
  codigo,
  monitor,
  eu,
  papel,
  className,
}: {
  codigo: string
  monitor: string
  eu: string
  papel: 'monitor' | 'aluno'
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute left-2 top-2 z-[5] max-w-[70%] select-none rounded-md bg-black/30 px-1.5 py-0.5 text-[9px] leading-[1.35] text-white/75 sm:left-3 sm:top-3 sm:text-[10px]',
        className,
      )}
      data-marca-dagua
    >
      <p className="truncate font-semibold">www.domineaqui.com.br · Monitoria #{codigo}</p>
      <p className="truncate">
        Monitor: {nomeCurto(monitor)}
        {papel === 'aluno' ? ` · Aluno: ${nomeCurto(eu)}` : ''}
      </p>
    </div>
  )
}

/** A marca nas telas claras da sala (saguão, depois de sair, sem suporte). */
export function MarcaClara({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/favicon.png" alt="" width={32} height={32} className="h-8 w-8 rounded-xl shadow-sm" />
      <span className="leading-tight">
        <span className="block text-sm font-bold tracking-tight">DomineAqui</span>
        <span className="block text-[11px] text-muted-foreground">www.domineaqui.com.br</span>
      </span>
    </span>
  )
}
