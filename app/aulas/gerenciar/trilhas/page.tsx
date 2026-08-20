'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Layers, Plus, Route } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import {
  BotaoPrincipal,
  Campo,
  PainelDeEnsino,
  classeDeEntrada,
} from '@/components/ensino/painel'
import { EstadoVazio, Esqueleto, Selo, formatarMinutos } from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * A lista de Trilhas do painel (§6).
 *
 * Criar uma Trilha custa um título e nada mais. A montagem é incremental por
 * decisão de produto (§30): a equipe cria a Trilha, vai juntando aulas ao longo
 * da semana e publica quando o caminho fizer sentido. Um formulário de criação
 * com capa, objetivo, público e nível pediria decisões que só ficam claras
 * depois de ver o percurso montado.
 */

interface TrilhaNaLista {
  _id: string
  slug: string
  titulo: string
  subtitulo?: string
  situacao: string
  destaque?: boolean
  nivel?: string
  aulas: number
  etapas: number
  minutos: number
}

export default function GerenciarTrilhasPage() {
  return (
    <AppShell headerTitle="Trilhas" headerSubtitle="Construtor de caminhos">
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const router = useRouter()
  const [trilhas, setTrilhas] = useState<TrilhaNaLista[]>([])
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let cancelado = false
    fetch('/api/ensino/trilhas?rascunhos=1', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelado && d?.trilhas) setTrilhas(d.trilhas)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  async function criar() {
    const nome = titulo.trim()
    if (!nome) return
    setSalvando(true)
    setErro('')
    try {
      const resposta = await fetch('/api/ensino/trilhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: nome }),
      })
      const d = await resposta.json().catch(() => ({}))
      if (!resposta.ok) throw new Error(d.error || 'Não foi possível criar a Trilha.')
      router.push(`/aulas/gerenciar/trilhas/${d.trilha._id}`)
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível criar a Trilha.')
      setSalvando(false)
    }
  }

  const publicadas = trilhas.filter((t) => t.situacao === 'publicada')
  const rascunhos = trilhas.filter((t) => t.situacao !== 'publicada')

  return (
    <PainelDeEnsino
      titulo="Trilhas de Ensino"
      descricao="Cada Trilha referencia aulas que já existem. Apagar a Trilha nunca apaga uma aula."
      acoes={
        <BotaoPrincipal onClick={() => setCriando((v) => !v)}>
          <Plus className="h-4 w-4" /> Nova Trilha
        </BotaoPrincipal>
      }
    >
      {criando ? (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <Campo rotulo="Título da Trilha" dica="Dá para mudar tudo depois — inclusive o título.">
            <div className="flex gap-2">
              <input
                value={titulo}
                autoFocus
                onChange={(e) => setTitulo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') criar()
                }}
                placeholder="Entenda Insuficiência Cardíaca do Zero"
                className={classeDeEntrada}
              />
              <BotaoPrincipal onClick={criar} carregando={salvando} className="flex-none">
                Criar e montar
              </BotaoPrincipal>
            </div>
          </Campo>
          {erro ? <p className="mt-2 text-sm text-destructive">{erro}</p> : null}
        </div>
      ) : null}

      {carregando ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Esqueleto key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : trilhas.length === 0 ? (
        <EstadoVazio
          icone={Route}
          titulo="Nenhuma Trilha ainda"
          descricao="Uma Trilha organiza aulas existentes numa sequência que leva o aluno do começo ao domínio do assunto."
          acaoLabel="Criar a primeira"
          onAcao={() => setCriando(true)}
        />
      ) : (
        <div className="space-y-8">
          {rascunhos.length > 0 ? (
            <Secao titulo="Rascunhos" descricao="Visíveis só para quem administra">
              {rascunhos.map((trilha) => (
                <LinhaDeTrilha key={trilha._id} trilha={trilha} />
              ))}
            </Secao>
          ) : null}

          {publicadas.length > 0 ? (
            <Secao titulo="Publicadas" descricao="No ar para os alunos">
              {publicadas.map((trilha) => (
                <LinhaDeTrilha key={trilha._id} trilha={trilha} />
              ))}
            </Secao>
          ) : null}
        </div>
      )}
    </PainelDeEnsino>
  )
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-2 font-heading text-base font-semibold tracking-tight">
        {titulo}
        {descricao ? (
          <span className="ml-2 text-xs font-normal text-muted-foreground">{descricao}</span>
        ) : null}
      </h2>
      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card">
        {children}
      </div>
    </section>
  )
}

function LinhaDeTrilha({ trilha }: { trilha: TrilhaNaLista }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50">
      <Link href={`/aulas/gerenciar/trilhas/${trilha._id}`} className="group min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold transition group-hover:text-primary">
            {trilha.titulo}
          </span>
          {trilha.destaque ? <Selo tom="aviso">Destaque</Selo> : null}
          {trilha.situacao !== 'publicada' ? <Selo>Rascunho</Selo> : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {[
            `${trilha.aulas} ${trilha.aulas === 1 ? 'aula' : 'aulas'}`,
            `${trilha.etapas} ${trilha.etapas === 1 ? 'etapa' : 'etapas'}`,
            trilha.minutos > 0 ? formatarMinutos(trilha.minutos) : '',
            trilha.subtitulo || '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </Link>

      <div className="flex flex-none items-center gap-1">
        <Link
          href={`/aulas/trilhas/${trilha.slug}`}
          title="Ver como aluno"
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground',
          )}
        >
          <Eye className="h-4 w-4" />
        </Link>
        <Link
          href={`/aulas/gerenciar/trilhas/${trilha._id}`}
          title="Montar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Layers className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
