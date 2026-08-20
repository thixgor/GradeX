'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText, Layers, Play, RotateCcw, Sparkles } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { RESPIRO_DA_DOCA, RESPIRO_DO_TOPO } from '@/components/ensino/doca'
import { EstadoVazio, Esqueleto } from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * A Área de Revisão (§16, §17, §18).
 *
 * APRENDER E REVISAR SÃO DUAS PORTAS, NÃO DUAS BIBLIOTECAS
 *
 * Esta tela não tem capa, não tem trilho e não tem descoberta — de propósito.
 * Quem chega aqui já sabe o que estudou; o que ele quer é a lista do que está
 * esfriando e o caminho mais curto para reaquecer. Por isso cada linha oferece
 * as ferramentas de revisão na ordem do MENOR esforço: resumo de 4 minutos
 * antes do PDF, PDF antes de reassistir a aula inteira.
 *
 * O conteúdo é o mesmo do Aprender. Nada aqui é duplicado — muda a leitura.
 */

interface ItemDeRevisao {
  aulaId: string
  titulo: string
  localizacao?: string
  concluida: boolean
  percentual: number
  diasParado: number
  prioridade: number
  motivo: string
  ferramentas: Array<'resumo' | 'flashcards' | 'pdf' | 'aula'>
  href: string
  resumoId?: string | null
  duracaoLabel?: string
}

type Filtro = 'todas' | 'esfriando' | 'interrompidas'

const FERRAMENTAS = {
  resumo: { rotulo: 'Resumo', icone: Sparkles },
  flashcards: { rotulo: 'Flashcards', icone: Layers },
  pdf: { rotulo: 'PDF', icone: FileText },
  aula: { rotulo: 'Rever aula', icone: Play },
} as const

export default function RevisarPage() {
  return (
    <AppShell headerTitle="Revisar" headerSubtitle="O que você já estudou" comercio={false} vidro>
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const [itens, setItens] = useState<ItemDeRevisao[]>([])
  const [logado, setLogado] = useState(true)
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todas')

  useEffect(() => {
    let cancelado = false
    fetch('/api/ensino/revisao?limite=60', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelado || !d) return
        setItens(d.itens || [])
        setLogado(d.logado !== false)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const visiveis = useMemo(
    () =>
      itens.filter((item) => {
        if (filtro === 'esfriando') return item.diasParado >= 21
        if (filtro === 'interrompidas') return !item.concluida
        return true
      }),
    [itens, filtro],
  )

  return (
    <div className={`container mx-auto max-w-4xl px-4 ${RESPIRO_DO_TOPO} ${RESPIRO_DA_DOCA}`}>

      <header className="mb-5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Revisar</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          O que você já viu, ordenado por quanto está pedindo uma revisão. Comece pelo resumo — é o
          caminho mais curto de volta ao conteúdo.
        </p>
      </header>

      {!carregando && logado && itens.length > 0 ? (
        <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              { id: 'todas', rotulo: 'Tudo que estudei' },
              { id: 'esfriando', rotulo: 'Esfriando' },
              { id: 'interrompidas', rotulo: 'Interrompidas' },
            ] as Array<{ id: Filtro; rotulo: string }>
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className={cn(
                'inline-flex h-9 flex-none items-center rounded-full px-3.5 text-sm font-semibold transition',
                filtro === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
      ) : null}

      {carregando ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Esqueleto key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !logado ? (
        <EstadoVazio
          icone={RotateCcw}
          titulo="Entre para ver sua revisão"
          descricao="A Área de Revisão é montada a partir do que você já assistiu."
          acaoLabel="Entrar"
          acaoHref="/auth/login"
        />
      ) : visiveis.length === 0 ? (
        /*
         * O vazio que ensina (§13).
         *
         * "Você ainda não tem o que revisar" descreve a tela e abandona a
         * pessoa nela. Aqui o texto explica o que esta área VAI fazer por ela
         * — a fila se monta sozinha, ordenada pelo que está esfriando — e o
         * botão devolve ao único lugar de onde se sai estudando. Mandar para
         * a lista de Trilhas seria empurrar mais uma escolha para quem ainda
         * não fez a primeira.
         */
        <EstadoVazio
          icone={RotateCcw}
          titulo={itens.length === 0 ? 'Sua revisão começa na primeira aula' : 'Nada com esse filtro'}
          descricao={
            itens.length === 0
              ? 'Cada aula que você assiste entra nesta fila, ordenada por quanto tempo faz que você a viu — com resumo, PDF e flashcards à mão.'
              : 'Tente outro filtro para ver o restante.'
          }
          acaoLabel={itens.length === 0 ? 'Ver o que estudar agora' : undefined}
          acaoHref={itens.length === 0 ? '/aulas' : undefined}
        />
      ) : (
        <div className="space-y-2">
          {visiveis.map((item) => (
            <article
              key={item.aulaId}
              className="rounded-2xl border border-border/70 bg-card p-4 transition hover:border-primary/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {item.localizacao ? (
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.localizacao}
                    </p>
                  ) : null}
                  <h2 className="mt-0.5 font-heading text-base font-semibold leading-snug tracking-tight">
                    <Link href={item.href} className="transition hover:text-primary">
                      {item.titulo}
                    </Link>
                  </h2>
                  <p
                    className={cn(
                      'mt-0.5 text-xs',
                      item.prioridade >= 70 ? 'font-semibold text-accent-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {item.motivo}
                  </p>
                </div>

                {item.duracaoLabel ? (
                  <span className="flex-none text-xs tabular-nums text-muted-foreground">
                    {item.duracaoLabel}
                  </span>
                ) : null}
              </div>

              {/* As ferramentas em ordem de esforço: a primeira é sempre a mais
                  barata que aquela aula oferece. */}
              <div className="mt-3 flex flex-wrap gap-2">
                {item.ferramentas.map((ferramenta, indice) => {
                  const { rotulo, icone: Icone } = FERRAMENTAS[ferramenta]
                  const destino =
                    ferramenta === 'resumo' && item.resumoId
                      ? `/aulas/${item.resumoId}`
                      : ferramenta === 'aula'
                        ? item.href
                        : `${item.href}${item.href.includes('?') ? '&' : '?'}aba=${ferramenta}`

                  return (
                    <Link
                      key={ferramenta}
                      href={destino}
                      className={cn(
                        'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition',
                        indice === 0
                          ? 'bg-primary text-primary-foreground hover:opacity-90'
                          : 'border border-border hover:bg-muted',
                      )}
                    >
                      <Icone className="h-3.5 w-3.5" />
                      {rotulo}
                    </Link>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
