'use client'

/**
 * Peças pequenas reaproveitadas por todas as telas de monitorias:
 * chamada de API com erro legível, selo de status, avatar, animações.
 */

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ROTULOS_STATUS } from '@/lib/monitorias/estado'
import type { StatusReserva } from '@/lib/monitorias/tipos'

export class ErroApi extends Error {
  constructor(public status: number, mensagem: string, public dados: any = null) {
    super(mensagem)
  }
}

/** fetch JSON com a mensagem de erro do servidor já pronta para mostrar. */
export async function api<T = any>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...resto } = init
  const res = await fetch(url, {
    ...resto,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(resto.headers || {}) },
    body: json !== undefined ? JSON.stringify(json) : resto.body,
    cache: 'no-store',
  })
  let dados: any = null
  try {
    dados = await res.json()
  } catch {
    dados = null
  }
  if (!res.ok) {
    const msg =
      dados?.error ||
      (res.status === 401 ? 'Entre na sua conta para continuar.' : res.status === 429 ? 'Muitas tentativas. Aguarde um pouco.' : 'Algo deu errado. Tente de novo.')
    throw new ErroApi(res.status, msg, dados)
  }
  return dados as T
}

const TONS: Record<string, string> = {
  neutro: 'bg-muted text-muted-foreground border-transparent',
  info: 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border-transparent',
  alerta: 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-transparent',
  sucesso: 'bg-primary/10 text-primary border-transparent',
  erro: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-transparent',
}

export function SeloStatus({ status, className }: { status: StatusReserva; className?: string }) {
  const s = ROTULOS_STATUS[status] || { rotulo: status, tom: 'neutro' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold', TONS[s.tom], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {s.rotulo}
    </span>
  )
}

export function Selo({ children, tom = 'neutro', className }: { children: ReactNode; tom?: keyof typeof TONS; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold', TONS[tom], className)}>{children}</span>
}

export function Avatar({ nome, url, tamanho = 48, className }: { nome: string; url?: string | null; tamanho?: number; className?: string }) {
  // Foto que não carrega (apagada, rede ruim) volta para as iniciais em vez de
  // mostrar o texto alternativo espremido dentro do quadro.
  const [falhou, setFalhou] = useState(false)
  const iniciais = (nome || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[32%] bg-primary/10 font-heading font-semibold text-primary', className)}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }}
    >
      {url && !falhou ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`Foto de ${nome}`} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setFalhou(true)} />
      ) : (
        iniciais
      )}
    </span>
  )
}

/**
 * Cabeçalho de página das monitorias: título, uma linha de apoio e ações.
 * Sem rótulo em caixa-alta acima do título — o título basta.
 */
export function Cabecalho({ titulo, descricao, acoes, voltar, className }: { titulo: ReactNode; descricao?: ReactNode; acoes?: ReactNode; voltar?: { href: string; rotulo: string }; className?: string }) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {voltar && (
          <a href={voltar.href} className="mb-3 inline-flex items-center gap-1 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span aria-hidden>←</span> {voltar.rotulo}
          </a>
        )}
        <h1 className="font-heading text-[1.75rem] font-semibold leading-tight text-foreground sm:text-[2rem]">{titulo}</h1>
        {descricao && <p className="mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  )
}

/** Estado vazio composto: ícone, título curto, uma frase e a ação que resolve. */
export function Vazio({ icone, titulo, texto, acao, className }: { icone?: ReactNode; titulo: string; texto?: ReactNode; acao?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-start gap-3 rounded-2xl bg-muted/40 px-6 py-10 sm:items-center sm:text-center', className)}>
      {icone && <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-card text-primary shadow-sm">{icone}</span>}
      <div>
        <p className="font-heading text-lg font-semibold">{titulo}</p>
        {texto && <p className="mt-1 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">{texto}</p>}
      </div>
      {acao}
    </div>
  )
}

/** Entra subindo e aparecendo; respeita "reduzir movimento" do sistema. */
export function Aparecer({ children, atraso = 0, className, ...resto }: HTMLMotionProps<'div'> & { atraso?: number }) {
  const reduzir = useReducedMotion()
  return (
    <motion.div
      initial={reduzir ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: atraso, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...resto}
    >
      {children}
    </motion.div>
  )
}

export function Esqueleto({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-muted/70', className)} />
}

export function CaixaErro({ mensagem, className }: { mensagem: string; className?: string }) {
  return (
    <div role="alert" className={cn('rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300', className)}>
      {mensagem}
    </div>
  )
}

export function CaixaAviso({ children, className, tom = 'alerta' }: { children: ReactNode; className?: string; tom?: 'alerta' | 'info' | 'sucesso' }) {
  return <div className={cn('rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed', TONS[tom], className)}>{children}</div>
}

/** Rótulo "Horário de Brasília" que acompanha todo horário na tela. */
export function HoraBrasilia({ className }: { className?: string }) {
  return <span className={cn('text-xs text-muted-foreground', className)}>horário de Brasília</span>
}

/** Confete leve: sem lib, sem canvas. */
export function Confete() {
  const reduzir = useReducedMotion()
  if (reduzir) return null
  const cores = ['#468152', '#7fb08a', '#2f5d39', '#c9dccd', '#5f9a6b', '#a8c9b0']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute top-0 h-2 w-1.5 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, background: cores[i % cores.length] }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: 420, opacity: 0, rotate: 360 + i * 20 }}
          transition={{ duration: 1.6 + (i % 5) * 0.2, delay: (i % 7) * 0.05, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
