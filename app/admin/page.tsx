'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BanChecker } from '@/components/ban-checker'
import { AppShell } from '@/components/app-shell'
import { LogoLoading } from '@/components/logo-loading'
import { cn } from '@/lib/utils'
import {
  ADMIN_GROUPS,
  ADMIN_SECTIONS,
  alternarFavoritoAdmin,
  buscarSecoesAdmin,
  grupoPorChave,
  lerFavoritosAdmin,
  lerRecentesAdmin,
  secoesPorHrefs,
  type AdminGroupKey,
  type AdminSection,
} from '@/lib/admin-navigation'
import {
  ArrowRight,
  Clock,
  ExternalLink,
  FileText,
  Key,
  LifeBuoy,
  Search,
  Star,
  Users,
  X,
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

/** Ações que o admin repete todo dia — ficam antes de qualquer rolagem. */
const ACOES_RAPIDAS = [
  { label: 'Nova prova', hint: 'Criar do zero', href: '/admin/exams/create', icon: FileText },
  { label: 'Gerar serial key', hint: 'Nova chave', href: '/admin/keys', icon: Key },
  { label: 'Tickets abertos', hint: 'Fila de suporte', href: '/admin/tickets', icon: LifeBuoy },
  { label: 'Usuários', hint: 'Buscar conta', href: '/admin/users', icon: Users },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [termo, setTermo] = useState('')
  const [grupoAtivo, setGrupoAtivo] = useState<AdminGroupKey | 'todos'>('todos')
  const [favoritos, setFavoritos] = useState<string[]>([])
  const [recentes, setRecentes] = useState<string[]>([])

  useEffect(() => {
    checkAuth()
    setFavoritos(lerFavoritosAdmin())
    setRecentes(lerRecentesAdmin())
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()

      // Verificar se é admin
      if (data.user.role !== 'admin') {
        router.push('/')
        return
      }

      setUser(data.user)
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const encontradas = useMemo(() => buscarSecoesAdmin(termo), [termo])

  const visiveis = useMemo(
    () =>
      grupoAtivo === 'todos'
        ? encontradas
        : encontradas.filter((secao) => secao.group === grupoAtivo),
    [encontradas, grupoAtivo],
  )

  const buscando = termo.trim().length > 0

  const secoesFavoritas = useMemo(() => secoesPorHrefs(favoritos), [favoritos])
  const secoesRecentes = useMemo(
    () => secoesPorHrefs(recentes).filter((secao) => !favoritos.includes(secao.href)),
    [recentes, favoritos],
  )

  function alternarFavorito(href: string) {
    setFavoritos(alternarFavoritoAdmin(href))
  }

  if (loading) {
    return <LogoLoading message="Carregando painel admin..." size="lg" fullscreen />
  }

  if (!user) {
    return null
  }

  return (
    <AppShell headerTitle="Painel Administrativo" headerSubtitle={`Bem-vindo, ${user.name}`}>
      <BanChecker />
      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* Busca e filtros grudam logo abaixo do cabeçalho do AppShell (h-14, h-16
            do `sm` em diante, mais a faixa de segurança do PWA). No celular era
            preciso rolar de volta até o começo da página só para trocar de seção. */}
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 mb-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:top-[calc(4rem+env(safe-area-inset-top))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={termo}
              onChange={(evento) => setTermo(evento.target.value)}
              placeholder="Buscar no painel (ex.: tickets, música, cupom)"
              aria-label="Buscar seção do painel"
              className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-base outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            />
            {buscando && (
              <button
                type="button"
                onClick={() => setTermo('')}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ChipDeGrupo
              ativo={grupoAtivo === 'todos'}
              onClick={() => setGrupoAtivo('todos')}
              label="Tudo"
              contagem={encontradas.length}
            />
            {ADMIN_GROUPS.map((grupo) => {
              const contagem = encontradas.filter((secao) => secao.group === grupo.key).length
              return (
                <ChipDeGrupo
                  key={grupo.key}
                  ativo={grupoAtivo === grupo.key}
                  onClick={() => setGrupoAtivo(grupo.key)}
                  label={grupo.labelCurto}
                  contagem={contagem}
                />
              )
            })}
          </div>
        </div>

        {!buscando && (
          <>
            {/* Ações rápidas em linha rolável: ocupam uma faixa, não meia tela. */}
            <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
              {ACOES_RAPIDAS.map((acao) => (
                <button
                  key={acao.href}
                  type="button"
                  onClick={() => router.push(acao.href)}
                  className="flex min-w-[10.5rem] shrink-0 items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition hover:border-primary/50 hover:bg-muted/50 sm:min-w-0"
                >
                  <acao.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{acao.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {acao.hint}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {secoesFavoritas.length > 0 && (
              <FaixaDeSecoes
                titulo="Favoritos"
                icone={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                secoes={secoesFavoritas}
                favoritos={favoritos}
                onAbrir={(href) => router.push(href)}
                onFavoritar={alternarFavorito}
              />
            )}

            {secoesRecentes.length > 0 && (
              <FaixaDeSecoes
                titulo="Abertos recentemente"
                icone={<Clock className="h-4 w-4 text-muted-foreground" />}
                secoes={secoesRecentes}
                favoritos={favoritos}
                onAbrir={(href) => router.push(href)}
                onFavoritar={alternarFavorito}
              />
            )}
          </>
        )}

        {visiveis.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {grupoAtivo !== 'todos' && encontradas.length > 0
                ? `Nada em ${grupoPorChave(grupoAtivo)?.labelCurto ?? 'neste grupo'}, mas há ${encontradas.length} resultado(s) nos outros.`
                : `Nada encontrado para “${termo}”.`}
            </p>
            {grupoAtivo !== 'todos' && encontradas.length > 0 ? (
              <Button variant="ghost" className="mt-2" onClick={() => setGrupoAtivo('todos')}>
                Ver em todos os grupos
              </Button>
            ) : (
              <Button variant="ghost" className="mt-2" onClick={() => setTermo('')}>
                Limpar busca
              </Button>
            )}
          </div>
        ) : buscando ? (
          <ListaDeSecoes
            secoes={visiveis}
            favoritos={favoritos}
            onAbrir={(href) => router.push(href)}
            onFavoritar={alternarFavorito}
          />
        ) : (
          ADMIN_GROUPS.filter(
            (grupo) => grupoAtivo === 'todos' || grupoAtivo === grupo.key,
          ).map((grupo) => {
            const secoes = visiveis.filter((secao) => secao.group === grupo.key)
            if (secoes.length === 0) return null
            return (
              <section key={grupo.key} className="mb-8 scroll-mt-32" id={`grupo-${grupo.key}`}>
                <div className="mb-3 flex items-center gap-3">
                  <span className={cn('h-8 w-1.5 rounded-full bg-gradient-to-b', grupo.color)} />
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold sm:text-lg">{grupo.label}</h2>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {grupo.description}
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {secoes.length}
                  </span>
                </div>
                <ListaDeSecoes
                  secoes={secoes}
                  favoritos={favoritos}
                  onAbrir={(href) => router.push(href)}
                  onFavoritar={alternarFavorito}
                />
              </section>
            )
          })
        )}
      </div>
    </AppShell>
  )
}

function ChipDeGrupo({
  ativo,
  onClick,
  label,
  contagem,
}: {
  ativo: boolean
  onClick: () => void
  label: string
  contagem: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={contagem === 0 && !ativo}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
        ativo
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-muted',
        contagem === 0 && !ativo && 'opacity-40',
      )}
    >
      {label}
      <span className={cn('text-[10px]', ativo ? 'opacity-80' : 'opacity-70')}>{contagem}</span>
    </button>
  )
}

function FaixaDeSecoes({
  titulo,
  icone,
  secoes,
  favoritos,
  onAbrir,
  onFavoritar,
}: {
  titulo: string
  icone: React.ReactNode
  secoes: AdminSection[]
  favoritos: string[]
  onAbrir: (href: string) => void
  onFavoritar: (href: string) => void
}) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        {icone}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {titulo}
        </h2>
      </div>
      <ListaDeSecoes
        secoes={secoes}
        favoritos={favoritos}
        onAbrir={onAbrir}
        onFavoritar={onFavoritar}
        compacta
      />
    </section>
  )
}

function ListaDeSecoes({
  secoes,
  favoritos,
  onAbrir,
  onFavoritar,
  compacta = false,
}: {
  secoes: AdminSection[]
  favoritos: string[]
  onAbrir: (href: string) => void
  onFavoritar: (href: string) => void
  compacta?: boolean
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {secoes.map((secao) => (
        <CartaoDeSecao
          key={secao.href}
          secao={secao}
          favorito={favoritos.includes(secao.href)}
          onAbrir={onAbrir}
          onFavoritar={onFavoritar}
          compacta={compacta}
        />
      ))}
    </div>
  )
}

/**
 * Cartão de seção — linha compacta, não o bloco alto de antes.
 *
 * O cartão antigo tinha faixa colorida, cabeçalho, descrição inteira e um
 * botão "Acessar": ~230px por item, 27 itens, quase 7 mil pixels de rolagem
 * no celular. Aqui a mesma informação cabe em ~72px, com a descrição em duas
 * linhas e os atalhos internos como chips — que também evitam abrir a seção
 * só para clicar em "importar".
 */
function CartaoDeSecao({
  secao,
  favorito,
  onAbrir,
  onFavoritar,
  compacta,
}: {
  secao: AdminSection
  favorito: boolean
  onAbrir: (href: string) => void
  onFavoritar: (href: string) => void
  compacta?: boolean
}) {
  const Icone = secao.icon

  return (
    <div className="group relative flex flex-col rounded-lg border bg-card transition hover:border-primary/50 hover:shadow-sm">
      <button
        type="button"
        onClick={() => onAbrir(secao.href)}
        className="flex flex-1 items-start gap-3 rounded-lg p-3 text-left"
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/80 transition group-hover:bg-primary/10 group-hover:text-primary">
          <Icone className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 pr-7">
            <span className="truncate text-sm font-semibold">{secao.title}</span>
            {secao.externo && (
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Fora do /admin" />
            )}
          </span>
          {!compacta && (
            <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted-foreground">
              {secao.description}
            </span>
          )}
        </span>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
      </button>

      <button
        type="button"
        onClick={() => onFavoritar(secao.href)}
        aria-label={favorito ? `Remover ${secao.title} dos favoritos` : `Fixar ${secao.title} nos favoritos`}
        aria-pressed={favorito}
        className="absolute right-1.5 top-1.5 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <Star className={cn('h-3.5 w-3.5', favorito && 'fill-amber-400 text-amber-400')} />
      </button>

      {!compacta && secao.atalhos && secao.atalhos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
          {secao.atalhos.map((atalho) => (
            <button
              key={atalho.href}
              type="button"
              onClick={() => onAbrir(atalho.href)}
              className="rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            >
              {atalho.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
