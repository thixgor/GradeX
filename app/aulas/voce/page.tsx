'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Clock,
  Compass,
  Flame,
  Route,
  Settings2,
  StickyNote,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

import { AppShell, useAppShell } from '@/components/app-shell'
import { RESPIRO_DA_DOCA, RESPIRO_DO_TOPO } from '@/components/ensino/doca'
import { FichaDeEstatistica } from '@/components/ensino/duo'
import { Esqueleto, formatarMinutos } from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * VOCÊ — o canto pessoal da Área de Ensino (§12, §18, §19, §21).
 *
 * ══ POR QUE ESTA TELA EXISTE ═════════════════════════════════════════
 *
 * Três coisas atrapalhavam o fluxo de estudo por não terem onde morar:
 *
 *  1. "Minhas Anotações" ocupava um quinto da barra de navegação. Ler o próprio
 *     caderno é uma atividade legítima — e rara. Nenhum aluno abre o app
 *     pensando "vou às minhas anotações"; ele pensa "vou estudar" e, uma vez
 *     por semana, "cadê aquilo que anotei". Isso é um item de menu, não um
 *     destino primário.
 *
 *  2. As quatro fichas de estatística tomavam a primeira dobra do Aprender,
 *     empurrando para baixo a única coisa acionável da tela. Aqui elas são o
 *     conteúdo principal, porque quem entra nesta página entrou para olhar
 *     justamente para elas.
 *
 *  3. O botão "GERENCIAR" aparecia no cabeçalho da home do ALUNO. Mesmo para
 *     admins isso é ruído: gerenciar não é uma das coisas que se faz enquanto
 *     se estuda, é outro modo de uso do produto. Ele agora é a última linha
 *     desta página, visível só para quem pode — e a doca some inteira quando o
 *     painel abre (ver `doca.tsx`), porque lá dentro a navegação é outra.
 *
 * Nada foi removido: `/aulas/anotacoes` continua sendo uma rota completa, com o
 * caderno inteiro, busca e destaques. Ela só deixou de disputar espaço com a
 * decisão de estudar.
 */

interface Estatisticas {
  aulasConcluidas: number
  minutosEstudados: number
  trilhasConcluidas: number
  trilhasEmCurso: number
  semana: { aulas: number; minutos: number }
}

export default function VocePage() {
  return (
    <AppShell headerTitle="Você" headerSubtitle="Progresso, caderno e conta" comercio={false} vidro>
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const { user, isAdmin } = useAppShell()
  const podeGerenciar = isAdmin || user?.secondaryRole === 'monitor'

  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [anotacoes, setAnotacoes] = useState<number | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false

    Promise.all([
      fetch('/api/ensino/home', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('/api/ensino/anotacoes', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([home, caderno]) => {
        if (cancelado) return
        if (home?.estatisticas) setEstatisticas(home.estatisticas)
        if (typeof caderno?.total === 'number') setAnotacoes(caderno.total)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [])

  return (
    <div className={`container mx-auto max-w-3xl px-4 ${RESPIRO_DO_TOPO} ${RESPIRO_DA_DOCA}`}>
      <header className="mb-5">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
          {user?.name ? `Olá, ${user.name.split(' ')[0]}` : 'Você'}
        </h1>
        {estatisticas && estatisticas.semana.aulas > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Esta semana você concluiu {estatisticas.semana.aulas}{' '}
            {estatisticas.semana.aulas === 1 ? 'aula' : 'aulas'}
            {estatisticas.semana.minutos > 0
              ? ` — ${formatarMinutos(estatisticas.semana.minutos)} de estudo.`
              : '.'}
          </p>
        ) : null}
      </header>

      {/* ══ O progresso, em números que o sistema sabe de verdade ═════
          Nada de moeda inventada nem de pontuação sem lastro: cada ficha
          sai de um registro real de progresso. */}
      {carregando ? (
        <div className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Esqueleto key={i} className="h-24" />
          ))}
        </div>
      ) : estatisticas ? (
        <div className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <FichaDeEstatistica
            valor={estatisticas.aulasConcluidas}
            rotulo="aulas concluídas"
            icone={Flame}
            tom="fogo"
          />
          <FichaDeEstatistica
            valor={
              estatisticas.minutosEstudados >= 60
                ? Math.round(estatisticas.minutosEstudados / 60)
                : estatisticas.minutosEstudados
            }
            sufixo={estatisticas.minutosEstudados >= 60 ? 'h' : 'min'}
            rotulo="estudadas"
            icone={Clock}
            tom="primario"
          />
          <FichaDeEstatistica
            valor={estatisticas.trilhasEmCurso}
            rotulo="trilhas em curso"
            icone={Route}
            tom="primario"
          />
          <FichaDeEstatistica
            valor={estatisticas.trilhasConcluidas}
            rotulo="trilhas dominadas"
            icone={Trophy}
            tom="ouro"
          />
        </div>
      ) : null}

      <div className="vidro-cartao vidro-reflexo divide-y divide-border/40 overflow-hidden rounded-3xl">
        <Linha
          href="/aulas/anotacoes"
          icone={StickyNote}
          titulo="Minhas anotações"
          detalhe={
            anotacoes === null
              ? 'Tudo que você escreveu enquanto estudava'
              : anotacoes === 0
                ? 'Seu caderno ainda está vazio'
                : `${anotacoes} ${anotacoes === 1 ? 'anotação' : 'anotações'}`
          }
        />
        <Linha
          href="/aulas/trilhas"
          icone={Route}
          titulo="Todas as Trilhas"
          detalhe="Em andamento, concluídas e as que dão para fazer do zero"
        />
        <Linha
          href="/aulas/explorar"
          icone={Compass}
          titulo="Todo o conteúdo"
          detalhe="Navegar por área, módulo e tópico"
        />
      </div>

      {/* ══ O modo de gestão (§19) ═══════════════════════════════════
          Separado do bloco acima por um respiro e por um rótulo próprio:
          é outro produto, para outro papel, e a distância visual diz isso
          melhor do que qualquer aviso escrito. */}
      {podeGerenciar ? (
        <section className="mt-7">
          <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Equipe
          </h2>
          <div className="vidro-cartao vidro-reflexo overflow-hidden rounded-3xl">
            <Linha
              href="/aulas/gerenciar"
              icone={Settings2}
              titulo="Gerenciar o Ensino"
              detalhe="Trilhas, aulas, organização e importação"
            />
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Linha({
  href,
  icone: Icone,
  titulo,
  detalhe,
}: {
  href: string
  icone: LucideIcon
  titulo: string
  detalhe: string
}) {
  return (
    <Link
      href={href}
      className={cn('group flex items-center gap-3 px-4 py-3.5 transition hover:bg-primary/5')}
    >
      <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/12 text-primary">
        <Icone className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold transition group-hover:text-primary">{titulo}</span>
        <span className="block truncate text-xs text-muted-foreground">{detalhe}</span>
      </span>
      <ChevronRight className="h-4 w-4 flex-none text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}
