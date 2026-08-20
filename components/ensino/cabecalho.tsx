'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Compass, StickyNote, Route, RotateCcw, Search, Sparkles, X } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A barra da Área de Ensino — as quatro portas e a busca.
 *
 * POR QUE ESTA BARRA EXISTE
 *
 * A área tem agora seis destinos (aprender, trilhas, explorar, revisar,
 * anotações, buscar). Sem uma navegação própria, chegar de "assistindo uma
 * aula" a "revisar" exigiria voltar à home pelo menu global e procurar — e o
 * aluno simplesmente não faria. A barra é o que transforma páginas soltas numa
 * área.
 *
 * A SEPARAÇÃO APRENDER / REVISAR É A PRIMEIRA COISA VISÍVEL (§16)
 *
 * As duas experiências usam a mesma base de conteúdo, mas respondem perguntas
 * diferentes. Colocá-las lado a lado no topo é o que ensina essa distinção sem
 * texto explicativo.
 *
 * No celular a barra rola horizontalmente e a busca vira um botão: ocupar 40%
 * de uma tela de 390px com um campo de texto que quase ninguém usa em pé seria
 * roubar espaço do conteúdo.
 */

const DESTINOS = [
  { href: '/aulas', rotulo: 'Aprender', icone: Sparkles, exato: true },
  { href: '/aulas/trilhas', rotulo: 'Trilhas', icone: Route },
  { href: '/aulas/explorar', rotulo: 'Explorar', icone: Compass },
  { href: '/aulas/revisar', rotulo: 'Revisar', icone: RotateCcw },
  { href: '/aulas/anotacoes', rotulo: 'Anotações', icone: StickyNote },
]

export function CabecalhoDeEnsino({
  buscaInicial = '',
  className,
}: {
  buscaInicial?: string
  className?: string
}) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const [busca, setBusca] = useState(buscaInicial)
  const [buscando, setBuscando] = useState(Boolean(buscaInicial))
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (buscando) campo.current?.focus()
  }, [buscando])

  function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    const termo = busca.trim()
    if (termo.length < 2) return
    router.push(`/aulas/buscar?q=${encodeURIComponent(termo)}`)
  }

  const ativo = (destino: (typeof DESTINOS)[number]) =>
    destino.exato ? pathname === destino.href : pathname.startsWith(destino.href)

  return (
    <div
      className={cn(
        'sticky top-0 z-20 -mx-4 mb-6 border-b border-border/60 bg-background/85 px-4 backdrop-blur-md',
        className,
      )}
    >
      <div className="flex h-14 items-center gap-3">
        <nav
          className={cn(
            'flex flex-1 items-center gap-1 overflow-x-auto',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            buscando && 'hidden sm:flex',
          )}
        >
          {DESTINOS.map((destino) => {
            const Icone = destino.icone
            const selecionado = ativo(destino)
            return (
              <Link
                key={destino.href}
                href={destino.href}
                aria-current={selecionado ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 flex-none items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition',
                  selecionado
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icone className="h-4 w-4" />
                {destino.rotulo}
              </Link>
            )
          })}
        </nav>

        {buscando ? (
          <form onSubmit={enviar} className="flex flex-1 items-center gap-2 sm:max-w-xs">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={campo}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar aula, trilha, resumo…"
                aria-label="Buscar na área de ensino"
                className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-9 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
              <button
                type="button"
                onClick={() => {
                  setBusca('')
                  setBuscando(false)
                }}
                aria-label="Fechar busca"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setBuscando(true)}
            aria-label="Buscar"
            className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
