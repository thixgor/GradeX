'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, Compass, Layers } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { RESPIRO_DA_DOCA } from '@/components/ensino/doca'
import {
  CartaoDeAula,
  EstadoVazio,
  Esqueleto,
  Grade,
  Migalha,
  type AulaNaTela,
} from '@/components/ensino/primitivos'

/**
 * Navegação por conteúdo (§14).
 *
 * DESCER UM NÍVEL DE CADA VEZ, MAS NUNCA ÀS CEGAS
 *
 * A navegação antiga era uma cascata de cinco cliques em que cada tela mostrava
 * só nomes de pasta: para saber se valia entrar em "Sistema Cardiovascular" era
 * preciso entrar. Aqui cada nível mostra três coisas ao mesmo tempo — onde você
 * está (migalha), o que existe abaixo (com a contagem de aulas) e as aulas
 * daqui. Assim uma seção com quatro aulas não exige mais dois cliques para
 * revelar que tinha quatro aulas.
 *
 * A profundidade é dado, não código: a mesma tela desenha um Módulo cheio de
 * Tópicos e um Subtópico que só tem aulas.
 */

interface RamoNaTela {
  _id: string
  nome: string
  nivel: string
  descricao?: string
  aulas: number
  aulasNaArvore: number
  filhos: RamoNaTela[]
}

const ROTULO_DO_NIVEL: Record<string, string> = {
  area: 'Área',
  modulo: 'Módulo',
  topico: 'Tópico',
  subtopico: 'Subtópico',
}

export default function ExplorarPage() {
  return (
    <AppShell headerTitle="Explorar" headerSubtitle="Todo o acervo por assunto" comercio={false}>
      <Suspense
        fallback={
          <div className="container mx-auto max-w-6xl px-4 py-8">
            <Esqueleto className="h-40 w-full" />
          </div>
        }
      >
        <Conteudo />
      </Suspense>
    </AppShell>
  )
}

function Conteudo() {
  const busca = useSearchParams()
  const router = useRouter()
  const noAtual = busca.get('no') || ''

  const [arvore, setArvore] = useState<RamoNaTela[]>([])
  const [aulas, setAulas] = useState<AulaNaTela[]>([])
  const [carregando, setCarregando] = useState(true)
  const [carregandoAulas, setCarregandoAulas] = useState(false)

  useEffect(() => {
    let cancelado = false
    fetch('/api/ensino/taxonomia', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelado && d?.arvore) setArvore(d.arvore)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    if (!noAtual) {
      setAulas([])
      return
    }
    let cancelado = false
    setCarregandoAulas(true)
    fetch(`/api/ensino/catalogo?no=${encodeURIComponent(noAtual)}&limite=120`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelado && d?.aulas) setAulas(d.aulas)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoAulas(false)
      })
    return () => {
      cancelado = true
    }
  }, [noAtual])

  /** Acha o ramo aberto e o caminho até ele, dentro da árvore já carregada. */
  const { atual, caminho } = useMemo(() => {
    if (!noAtual) return { atual: null as RamoNaTela | null, caminho: [] as RamoNaTela[] }

    const procurar = (ramos: RamoNaTela[], acumulado: RamoNaTela[]): RamoNaTela[] | null => {
      for (const ramo of ramos) {
        const caminhoAqui = [...acumulado, ramo]
        if (ramo._id === noAtual) return caminhoAqui
        const achado = procurar(ramo.filhos || [], caminhoAqui)
        if (achado) return achado
      }
      return null
    }

    const achado = procurar(arvore, [])
    return { atual: achado ? achado[achado.length - 1] : null, caminho: achado || [] }
  }, [arvore, noAtual])

  const ramosVisiveis = atual ? atual.filhos || [] : arvore

  return (
    <div className={`container mx-auto max-w-6xl px-4 ${RESPIRO_DA_DOCA}`}>

      <header className="mb-6">
        <Migalha
          className="mb-2"
          itens={[
            { nome: 'Explorar', href: '/aulas/explorar' },
            ...caminho.map((r) => ({ _id: r._id, nome: r.nome, href: `/aulas/explorar?no=${r._id}` })),
          ]}
        />
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {atual ? atual.nome : 'Explorar o acervo'}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {atual?.descricao
            ? atual.descricao
            : atual
              ? `${atual.aulasNaArvore} ${atual.aulasNaArvore === 1 ? 'aula' : 'aulas'} nesta seção`
              : 'Toda a organização do conteúdo — da grande etapa curricular até o assunto específico.'}
        </p>
      </header>

      {carregando ? (
        <Grade>
          {Array.from({ length: 6 }).map((_, i) => (
            <Esqueleto key={i} className="h-24" />
          ))}
        </Grade>
      ) : arvore.length === 0 ? (
        <EstadoVazio
          icone={Compass}
          titulo="A organização do conteúdo ainda está sendo montada"
          descricao="Assim que houver áreas, módulos e tópicos publicados, eles aparecem aqui."
        />
      ) : (
        <div className="space-y-8">
          {ramosVisiveis.length > 0 ? (
            <section>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {ramosVisiveis.map((ramo) => (
                  <button
                    key={ramo._id}
                    type="button"
                    onClick={() => router.push(`/aulas/explorar?no=${ramo._id}`)}
                    className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 text-left transition hover:border-primary/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {ROTULO_DO_NIVEL[ramo.nivel] || ''}
                      </span>
                      <span className="block truncate font-heading text-base font-semibold tracking-tight transition group-hover:text-primary">
                        {ramo.nome}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {ramo.aulasNaArvore} {ramo.aulasNaArvore === 1 ? 'aula' : 'aulas'}
                        {ramo.filhos?.length
                          ? ` · ${ramo.filhos.length} ${ramo.filhos.length === 1 ? 'seção' : 'seções'}`
                          : ''}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 flex-none text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {noAtual ? (
            <section>
              <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight">
                {ramosVisiveis.length > 0 ? 'Aulas desta seção' : 'Aulas'}
              </h2>

              {carregandoAulas ? (
                <Grade>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Esqueleto key={i} className="aspect-video" />
                  ))}
                </Grade>
              ) : aulas.length === 0 ? (
                <EstadoVazio
                  icone={Layers}
                  titulo="Nenhuma aula aqui ainda"
                  descricao={
                    ramosVisiveis.length > 0
                      ? 'Escolha uma das seções acima para ver o conteúdo.'
                      : 'Esta seção ainda não recebeu aulas.'
                  }
                />
              ) : (
                <Grade>
                  {aulas.map((aula) => (
                    <CartaoDeAula key={aula._id} aula={aula} className="w-full" />
                  ))}
                </Grade>
              )}
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
