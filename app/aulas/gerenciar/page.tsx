'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  Download,
  FileUp,
  Play,
  Plus,
  Route,
  Settings2,
  Users,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BotaoPrincipal, Numero, PainelDeEnsino } from '@/components/ensino/painel'

/**
 * A visão geral da administração de Ensino (§22).
 *
 * O QUE ELA RESPONDE
 *
 * Não é um menu de módulos: é um estado do acervo. As três perguntas que a
 * equipe faz ao abrir esta tela são "quanto conteúdo temos?", "o que está pela
 * metade?" e "o que eu faço agora?". Um hub de botões responderia só a terceira,
 * e mal.
 *
 * Por isso o destaque é a fila de pendências — Trilhas em rascunho e aulas sem
 * classificação. É onde o trabalho realmente está, e é o que uma tabela de
 * "todas as aulas" esconde.
 */

interface Resumo {
  trilhas: number
  rascunhos: number
  aulas: number
  semClassificacao: number
  nos: number
}

export default function GerenciarEnsinoPage() {
  return (
    <AppShell headerTitle="Gerenciar Ensino" headerSubtitle="Trilhas, aulas e organização">
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const [resumo, setResumo] = useState<Resumo | null>(null)

  useEffect(() => {
    let cancelado = false

    Promise.all([
      fetch('/api/ensino/trilhas?rascunhos=1', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : { trilhas: [] },
      ),
      fetch('/api/ensino/catalogo?admin=1&limite=1&tipo=todos', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : { total: 0 },
      ),
      fetch('/api/ensino/catalogo?admin=1&semClassificacao=1&limite=1&tipo=todos', {
        cache: 'no-store',
      }).then((r) => (r.ok ? r.json() : { total: 0 })),
      fetch('/api/ensino/taxonomia?contagem=0', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : { nos: [] },
      ),
    ])
      .then(([trilhas, catalogo, pendentes, taxonomia]) => {
        if (cancelado) return
        const lista = trilhas.trilhas || []
        setResumo({
          trilhas: lista.filter((t: any) => t.situacao === 'publicada').length,
          rascunhos: lista.filter((t: any) => t.situacao !== 'publicada').length,
          aulas: catalogo.total || 0,
          semClassificacao: pendentes.total || 0,
          nos: (taxonomia.nos || []).length,
        })
      })
      .catch(() => {})

    return () => {
      cancelado = true
    }
  }, [])

  return (
    <PainelDeEnsino
      titulo="Ensino"
      descricao="O acervo é uma rede: aulas pequenas, reutilizadas em vários caminhos. Comece pelas Trilhas."
      acoes={
        <BotaoPrincipal href="/aulas/gerenciar/trilhas">
          <Plus className="h-4 w-4" /> Nova Trilha
        </BotaoPrincipal>
      }
    >
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Numero
          valor={resumo?.trilhas ?? '—'}
          rotulo="Trilhas publicadas"
          icone={Route}
          href="/aulas/gerenciar/trilhas"
        />
        <Numero
          valor={resumo?.aulas ?? '—'}
          rotulo="Aulas no acervo"
          icone={Play}
          href="/aulas/gerenciar/catalogo"
        />
        <Numero
          valor={resumo?.nos ?? '—'}
          rotulo="Níveis de organização"
          icone={Compass}
          href="/aulas/gerenciar/taxonomia"
        />
        <Numero valor={resumo?.rascunhos ?? '—'} rotulo="Trilhas em rascunho" icone={FileUp} />
      </div>

      {/* ── A fila de trabalho ────────────────────────────────────────── */}
      {resumo && (resumo.semClassificacao > 0 || resumo.rascunhos > 0) ? (
        <section className="mb-8">
          <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight">
            O que está pendente
          </h2>
          <div className="space-y-2">
            {resumo.semClassificacao > 0 ? (
              <Link
                href="/aulas/gerenciar/catalogo?semClassificacao=1"
                className="group flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/5 px-4 py-3.5 transition hover:border-accent"
              >
                <AlertTriangle className="h-5 w-5 flex-none text-accent-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {resumo.semClassificacao}{' '}
                    {resumo.semClassificacao === 1 ? 'aula sem' : 'aulas sem'} organização
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Elas existem e são assistíveis, mas não aparecem na navegação por assunto.
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 flex-none text-muted-foreground transition group-hover:translate-x-0.5" />
              </Link>
            ) : null}

            {resumo.rascunhos > 0 ? (
              <Link
                href="/aulas/gerenciar/trilhas"
                className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 transition hover:border-primary/40"
              >
                <Route className="h-5 w-5 flex-none text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {resumo.rascunhos} {resumo.rascunhos === 1 ? 'Trilha' : 'Trilhas'} em rascunho
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Só você as enxerga. Publique quando o caminho estiver montado.
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 flex-none text-muted-foreground transition group-hover:translate-x-0.5" />
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── Atalhos ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight">Ferramentas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Atalho
            href="/aulas/gerenciar/trilhas"
            icone={Route}
            titulo="Construtor de Trilhas"
            descricao="Monte caminhos com etapas, arrastando aulas que já existem. Nada é duplicado."
          />
          <Atalho
            href="/aulas/gerenciar/catalogo"
            icone={Play}
            titulo="Catálogo de aulas"
            descricao="Filtre por módulo, tópico, Trilha, nível e recursos. Veja o reuso de cada aula."
          />
          <Atalho
            href="/aulas/gerenciar/taxonomia"
            icone={Compass}
            titulo="Organização do conteúdo"
            descricao="Área → Módulo → Tópico → Subtópico. O subtópico é opcional."
          />
          <Atalho
            href="/aulas/gerenciar/importar"
            icone={Download}
            titulo="Importar e migrar"
            descricao="Traga aulas e Trilhas por arquivo Markdown ou JSON, e migre o acervo antigo."
          />
          <Atalho
            href="/aulas/gerenciar/aulas/criar"
            icone={Plus}
            titulo="Nova aula"
            descricao="Cadastre uma unidade específica de conhecimento — pequena e reutilizável."
          />
          <Atalho
            href="/aulas/gerenciar/turmas"
            icone={Users}
            titulo="Turmas e acesso"
            descricao="Grupos com acesso exclusivo a aulas e Trilhas."
          />
        </div>
      </section>

      <p className="mt-8 flex items-start gap-2 rounded-xl bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <Settings2 className="mt-0.5 h-4 w-4 flex-none" />
        As telas antigas de estrutura, estatísticas e detalhes continuam disponíveis em{' '}
        <Link href="/aulas/gerenciar/estrutura" className="font-semibold underline">
          estrutura
        </Link>
        ,{' '}
        <Link href="/aulas/gerenciar/estatisticas" className="font-semibold underline">
          estatísticas
        </Link>{' '}
        e{' '}
        <Link href="/aulas/gerenciar/detalhes" className="font-semibold underline">
          detalhes
        </Link>
        . Nada foi removido — o acervo antigo continua funcionando enquanto a migração acontece.
      </p>
    </PainelDeEnsino>
  )
}

function Atalho({
  href,
  icone: Icone,
  titulo,
  descricao,
}: {
  href: string
  icone: typeof Route
  titulo: string
  descricao: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border/70 bg-card p-4 transition hover:border-primary/40"
    >
      <Icone className="h-5 w-5 text-primary" />
      <h3 className="mt-2 font-heading text-base font-semibold tracking-tight transition group-hover:text-primary">
        {titulo}
      </h3>
      <p className="mt-1 text-sm leading-snug text-muted-foreground">{descricao}</p>
    </Link>
  )
}
