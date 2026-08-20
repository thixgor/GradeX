'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A moldura do painel administrativo de Ensino (§22, §34).
 *
 * O QUE ESTA MOLDURA RECUSA
 *
 * O painel antigo era uma tela com gradiente roxo, cartões de vidro e tabelas
 * largas — visualmente distante do resto da plataforma e cansativo de usar por
 * horas. Quem administra conteúdo passa mais tempo aqui do que qualquer aluno
 * passa numa aula.
 *
 * Então: mesma paleta do produto, superfícies claras, tipografia legível,
 * nenhum efeito decorativo. A hierarquia vem de espaço e peso, não de cor. Uma
 * ferramenta de trabalho deve sumir enquanto se trabalha.
 */

const ABAS = [
  { href: '/aulas/gerenciar', rotulo: 'Visão geral', exato: true },
  { href: '/aulas/gerenciar/trilhas', rotulo: 'Trilhas' },
  { href: '/aulas/gerenciar/catalogo', rotulo: 'Aulas' },
  { href: '/aulas/gerenciar/taxonomia', rotulo: 'Organização' },
  { href: '/aulas/gerenciar/importar', rotulo: 'Importar' },
]

export function PainelDeEnsino({
  titulo,
  descricao,
  acoes,
  voltarPara,
  largura = 'normal',
  children,
}: {
  titulo: string
  descricao?: string
  acoes?: React.ReactNode
  voltarPara?: string
  largura?: 'normal' | 'larga'
  children: React.ReactNode
}) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const [autorizado, setAutorizado] = useState<boolean | null>(null)

  /*
   * A checagem no navegador é conveniência, não segurança: toda rota de
   * escrita confere o papel no servidor. Ela existe só para quem digitou o
   * endereço errado não encarar um painel que nunca vai salvar nada.
   */
  useEffect(() => {
    let cancelado = false
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelado) return
        const pode = d?.user?.role === 'admin' || d?.user?.secondaryRole === 'monitor'
        setAutorizado(pode)
        if (!pode) router.replace('/aulas')
      })
      .catch(() => {
        if (!cancelado) router.replace('/auth/login')
      })
    return () => {
      cancelado = true
    }
  }, [router])

  if (autorizado === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!autorizado) return null

  return (
    <div
      className={cn(
        'container mx-auto px-4 pb-20',
        largura === 'larga' ? 'max-w-[100rem]' : 'max-w-6xl',
      )}
    >
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border/60 bg-background/85 px-4 backdrop-blur-md">
        <nav className="flex h-14 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ABAS.map((aba) => {
            const ativo = aba.exato ? pathname === aba.href : pathname.startsWith(aba.href)
            return (
              <Link
                key={aba.href}
                href={aba.href}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 flex-none items-center rounded-full px-3.5 text-sm font-semibold transition',
                  ativo
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {aba.rotulo}
              </Link>
            )
          })}
          <Link
            href="/aulas"
            className="ml-auto inline-flex h-9 flex-none items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Ver como aluno
          </Link>
        </nav>
      </div>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {voltarPara ? (
            <Link
              href={voltarPara}
              className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </Link>
          ) : null}
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{titulo}</h1>
          {descricao ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{descricao}</p>
          ) : null}
        </div>
        {acoes ? <div className="flex flex-none flex-wrap gap-2">{acoes}</div> : null}
      </header>

      {children}
    </div>
  )
}

/** O número grande com rótulo — a única "métrica" que o painel usa. */
export function Numero({
  valor,
  rotulo,
  icone: Icone,
  href,
}: {
  valor: number | string
  rotulo: string
  icone?: LucideIcon
  href?: string
}) {
  const corpo = (
    <>
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icone ? <Icone className="h-4 w-4" /> : null}
        <span className="text-xs font-semibold uppercase tracking-wide">{rotulo}</span>
      </div>
      <p className="mt-1 font-heading text-3xl font-semibold tabular-nums tracking-tight">{valor}</p>
    </>
  )

  const classe =
    'rounded-2xl border border-border/70 bg-card p-4 transition' +
    (href ? ' hover:border-primary/40' : '')

  return href ? (
    <Link href={href} className={classe}>
      {corpo}
    </Link>
  ) : (
    <div className={classe}>{corpo}</div>
  )
}

/** Botão primário do painel. Um por tela — o resto é secundário. */
export function BotaoPrincipal({
  children,
  onClick,
  href,
  carregando,
  type = 'button',
  className,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  carregando?: boolean
  type?: 'button' | 'submit'
  className?: string
  disabled?: boolean
}) {
  const classe = cn(
    'inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60',
    className,
  )

  if (href) {
    return (
      <Link href={href} className={classe}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || carregando} className={classe}>
      {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  )
}

export function BotaoSecundario({
  children,
  onClick,
  href,
  className,
  tom = 'neutro',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
  tom?: 'neutro' | 'perigo'
  disabled?: boolean
}) {
  const classe = cn(
    'inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition',
    tom === 'perigo'
      ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
      : 'border-border hover:bg-muted',
    disabled && 'pointer-events-none opacity-50',
    className,
  )

  // `disabled` só se aplica ao link em espírito — um <a> não tem esse
  // atributo — então ali a barreira é `pointer-events-none` no próprio
  // estilo acima.
  return href ? (
    <Link href={href} className={classe}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={classe}>
      {children}
    </button>
  )
}

/** Campo de formulário — rótulo, controle e dica, sempre no mesmo desenho. */
export function Campo({
  rotulo,
  dica,
  children,
  className,
}: {
  rotulo: string
  dica?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </span>
      {children}
      {dica ? <span className="mt-1 block text-xs text-muted-foreground">{dica}</span> : null}
    </label>
  )
}

export const classeDeEntrada =
  'h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15'

export const classeDeArea =
  'w-full rounded-lg border border-border bg-card p-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15'
