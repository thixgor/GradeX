'use client'

import { useEffect, useMemo, useState } from 'react'
import { Route } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { RESPIRO_DA_DOCA } from '@/components/ensino/doca'
import {
  CartaoDeTrilha,
  EstadoVazio,
  EsqueletoDeFaixa,
  Grade,
  type TrilhaNaTela,
} from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * Todas as Trilhas (§1).
 *
 * Os filtros são de ESTADO e de NÍVEL, não de assunto. Assunto se navega pela
 * taxonomia ou se busca; aqui a pergunta é outra — "o que eu comecei?", "o que
 * dá para fazer do zero?" — e são elas que separam a Trilha certa das trinta
 * erradas para o momento.
 */

type Filtro = 'todas' | 'em-curso' | 'nao-iniciadas' | 'concluidas' | 'iniciante'

const FILTROS: Array<{ id: Filtro; rotulo: string }> = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'em-curso', rotulo: 'Em andamento' },
  { id: 'nao-iniciadas', rotulo: 'Não iniciadas' },
  { id: 'concluidas', rotulo: 'Concluídas' },
  { id: 'iniciante', rotulo: 'Do zero' },
]

export default function TrilhasPage() {
  return (
    <AppShell headerTitle="Trilhas de Ensino" headerSubtitle="Caminhos organizados de estudo" comercio={false}>
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const [trilhas, setTrilhas] = useState<TrilhaNaTela[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todas')

  useEffect(() => {
    let cancelado = false
    fetch('/api/ensino/trilhas', { cache: 'no-store' })
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

  const visiveis = useMemo(() => {
    return trilhas.filter((trilha) => {
      const p = trilha.progresso
      switch (filtro) {
        case 'em-curso':
          return p?.iniciada && !p.concluida
        case 'nao-iniciadas':
          return !p?.iniciada
        case 'concluidas':
          return p?.concluida === true
        case 'iniciante':
          return trilha.nivel === 'iniciante'
        default:
          return true
      }
    })
  }, [trilhas, filtro])

  return (
    <div className={`container mx-auto max-w-7xl px-4 ${RESPIRO_DA_DOCA}`}>

      <header className="mb-5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Trilhas de Ensino
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Cada Trilha reúne aulas de vários assuntos numa sequência que leva do que você precisa
          saber primeiro até dominar o tema.
        </p>
      </header>

      <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTROS.map((f) => (
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

      {carregando ? (
        <EsqueletoDeFaixa quantidade={6} />
      ) : visiveis.length === 0 ? (
        <EstadoVazio
          icone={Route}
          titulo={
            trilhas.length === 0 ? 'Ainda não há Trilhas publicadas' : 'Nada com esse filtro'
          }
          descricao={
            trilhas.length === 0
              ? 'As Trilhas aparecem aqui assim que forem publicadas — cada uma com o seu progresso.'
              : 'Tente outro filtro para ver as demais Trilhas.'
          }
          acaoLabel={trilhas.length === 0 ? undefined : 'Ver todas'}
          onAcao={() => setFiltro('todas')}
        />
      ) : (
        <Grade className="lg:grid-cols-3 xl:grid-cols-4">
          {visiveis.map((trilha) => (
            <CartaoDeTrilha key={trilha._id} trilha={trilha} formato="largo" />
          ))}
        </Grade>
      )}
    </div>
  )
}
