'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ADMIN_GROUPS,
  ADMIN_SECTIONS,
  buscarAtalhosAdmin,
  buscarSecoesAdmin,
  lerFavoritosAdmin,
  lerRecentesAdmin,
  registrarVisitaAdmin,
  secaoPorRota,
  secoesPorHrefs,
  type AdminSection,
} from '@/lib/admin-navigation'
import { CornerDownLeft, LayoutGrid, Search, Star, X } from 'lucide-react'

/**
 * Atalho de navegação do painel, montado pelo layout do `/admin`.
 *
 * O problema que ele resolve: dentro de qualquer página do admin não havia
 * como pular para outra. Voltava-se para `/admin`, rolava-se a home inteira
 * (no celular, umas cinco telas) e só então se abria a próxima seção. Agora
 * qualquer página do painel tem um botão fixo — e `Ctrl/⌘ + K` no teclado —
 * que abre uma busca com todas as seções, os favoritos e o que foi aberto
 * por último.
 *
 * Ele também é quem alimenta a lista de "recentes": ao entrar em qualquer
 * rota do painel, registra a seção correspondente.
 */

/** Um destino da busca: uma seção inteira ou um atalho interno dela. */
interface Destino {
  href: string
  titulo: string
  subtitulo: string
  icon: AdminSection['icon']
  grupo: string
}

function destinoDaSecao(secao: AdminSection): Destino {
  const grupo = ADMIN_GROUPS.find((g) => g.key === secao.group)
  return {
    href: secao.href,
    titulo: secao.title,
    subtitulo: secao.description,
    icon: secao.icon,
    grupo: grupo?.labelCurto ?? '',
  }
}

export function AdminQuickNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)
  const [termo, setTermo] = useState('')
  const [indiceAtivo, setIndiceAtivo] = useState(0)
  const [favoritos, setFavoritos] = useState<string[]>([])
  const [recentes, setRecentes] = useState<string[]>([])
  const campoRef = useRef<HTMLInputElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  // Registra a visita e recarrega as listas guardadas no navegador.
  useEffect(() => {
    if (!pathname) return
    setRecentes(registrarVisitaAdmin(pathname))
    setFavoritos(lerFavoritosAdmin())
  }, [pathname])

  const secaoAtual = useMemo(() => (pathname ? secaoPorRota(pathname) : undefined), [pathname])

  // Na home do painel a busca já está no topo da página, e a tela de
  // verificação é uma trava de acesso: em nenhuma das duas o botão flutuante
  // acrescenta algo — só cobre conteúdo.
  const esconderBotao = pathname === '/admin' || pathname === '/admin/verificacao'

  const destinos = useMemo<Destino[]>(() => {
    if (!termo.trim()) {
      const favoritas = secoesPorHrefs(favoritos)
      const recentesSemFavoritos = secoesPorHrefs(recentes).filter(
        (secao) => !favoritos.includes(secao.href) && secao.href !== secaoAtual?.href,
      )
      const jaListadas = new Set([
        ...favoritas.map((s) => s.href),
        ...recentesSemFavoritos.map((s) => s.href),
      ])
      return [
        ...favoritas.map(destinoDaSecao),
        ...recentesSemFavoritos.map(destinoDaSecao),
        ...ADMIN_SECTIONS.filter((secao) => !jaListadas.has(secao.href)).map(destinoDaSecao),
      ]
    }

    const secoes = buscarSecoesAdmin(termo).map(destinoDaSecao)
    const atalhos = buscarAtalhosAdmin(termo).map(({ secao, atalho }) => ({
      href: atalho.href,
      titulo: atalho.label,
      subtitulo: `em ${secao.title}`,
      icon: secao.icon,
      grupo: 'Atalho',
    }))
    // Atalhos depois das seções: quem digita "importar" quase sempre quer a
    // seção; o atalho é o refinamento, não a primeira aposta.
    return [...secoes, ...atalhos]
  }, [termo, favoritos, recentes, secaoAtual])

  const fechar = useCallback(() => {
    setAberto(false)
    setTermo('')
    setIndiceAtivo(0)
  }, [])

  const navegar = useCallback(
    (href: string) => {
      fechar()
      router.push(href)
    },
    [fechar, router],
  )

  // Ctrl/⌘ + K abre de qualquer página do painel; Esc fecha.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault()
        setAberto((atual) => !atual)
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  useEffect(() => {
    if (!aberto) return
    setFavoritos(lerFavoritosAdmin())
    setRecentes(lerRecentesAdmin())
    // O foco no campo só faz sentido no desktop: no celular ele abre o teclado
    // por cima da lista antes de a pessoa ver o que existe.
    const ehDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (ehDesktop) campoRef.current?.focus()
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [aberto])

  useEffect(() => {
    setIndiceAtivo(0)
  }, [termo])

  // Mantém o item selecionado pelo teclado dentro da área visível.
  useEffect(() => {
    const ativo = listaRef.current?.querySelector<HTMLElement>('[data-ativo="true"]')
    ativo?.scrollIntoView({ block: 'nearest' })
  }, [indiceAtivo])

  function aoTeclarNoCampo(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Escape') {
      evento.preventDefault()
      fechar()
      return
    }
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setIndiceAtivo((atual) => Math.min(atual + 1, destinos.length - 1))
      return
    }
    if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setIndiceAtivo((atual) => Math.max(atual - 1, 0))
      return
    }
    if (evento.key === 'Enter') {
      const destino = destinos[indiceAtivo]
      if (destino) {
        evento.preventDefault()
        navegar(destino.href)
      }
    }
  }

  const mostrandoSugestoes = !termo.trim()
  const favoritosNaLista = mostrandoSugestoes ? secoesPorHrefs(favoritos).length : 0
  const recentesNaLista = mostrandoSugestoes
    ? secoesPorHrefs(recentes).filter(
        (secao) => !favoritos.includes(secao.href) && secao.href !== secaoAtual?.href,
      ).length
    : 0

  return (
    <>
      {/* Botão flutuante.
          Fica na mesma coluna dos outros flutuantes (o dock de música/suporte
          no mobile, o balão de suporte no desktop) e uma "casa" acima deles:
          os dois moram entre 1,25rem e ~5rem do rodapé, então 5,75rem empilha
          sem cobrir ninguém. E sobe junto com qualquer barra fixa de rodapé
          que publique `--gx-barra-inferior-h`. */}
      {esconderBotao ? null : (
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir navegação do painel (Ctrl+K)"
          style={{ bottom: 'calc(5.75rem + var(--gx-barra-inferior-h, 0px))' }}
          className={cn(
            'fixed right-4 z-40 flex items-center gap-2 rounded-full border border-border/60',
            'bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg',
            'transition hover:brightness-110 active:scale-95 print:hidden lg:right-6',
          )}
        >
          <LayoutGrid className="h-5 w-5" />
          Ir para…
          <kbd className="hidden rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-medium lg:inline">
            Ctrl K
          </kbd>
        </button>
      )}

      {!aberto ? null : (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={fechar}
            aria-hidden
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navegação do painel administrativo"
            className="relative z-[71] mt-[max(0.5rem,env(safe-area-inset-top))] flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={campoRef}
                value={termo}
                onChange={(evento) => setTermo(evento.target.value)}
                onKeyDown={aoTeclarNoCampo}
                placeholder="Buscar seção do painel…"
                className="h-10 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
              />
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={listaRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {destinos.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Nada encontrado para “{termo}”.
                </p>
              ) : (
                destinos.map((destino, indice) => {
                  const Icone = destino.icon
                  const rotulo =
                    mostrandoSugestoes && indice === 0 && favoritosNaLista > 0
                      ? 'Favoritos'
                      : mostrandoSugestoes && indice === favoritosNaLista && recentesNaLista > 0
                        ? 'Abertos recentemente'
                        : mostrandoSugestoes && indice === favoritosNaLista + recentesNaLista
                          ? 'Todas as seções'
                          : null

                  return (
                    <div key={`${destino.href}-${indice}`}>
                      {rotulo && (
                        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {rotulo}
                        </p>
                      )}
                      <button
                        type="button"
                        data-ativo={indice === indiceAtivo}
                        onMouseEnter={() => setIndiceAtivo(indice)}
                        onClick={() => navegar(destino.href)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition',
                          indice === indiceAtivo ? 'bg-muted' : 'hover:bg-muted/60',
                          destino.href === secaoAtual?.href && 'ring-1 ring-inset ring-primary/40',
                        )}
                      >
                        <Icone className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{destino.titulo}</span>
                            {favoritos.includes(destino.href) && (
                              <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                            )}
                          </span>
                          <span className="line-clamp-1 block text-xs text-muted-foreground">
                            {destino.subtitulo}
                          </span>
                        </span>
                        {destino.grupo && (
                          <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground sm:inline">
                            {destino.grupo}
                          </span>
                        )}
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <div className="hidden items-center justify-between gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground lg:flex">
              <span className="flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" /> abrir · ↑ ↓ navegar · Esc fechar
              </span>
              <button
                type="button"
                onClick={() => navegar('/admin')}
                className="flex items-center gap-1 rounded px-2 py-1 transition hover:bg-muted hover:text-foreground"
              >
                <LayoutGrid className="h-3 w-3" /> Ver painel completo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
