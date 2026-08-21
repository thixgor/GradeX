'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Eye, Layers, Loader2, Plus, Route, ShieldCheck, Trash2 } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BotaoDuo } from '@/components/ensino/duo'
import {
  BotaoPrincipal,
  BotaoSecundario,
  Campo,
  PainelDeEnsino,
  classeDeEntrada,
} from '@/components/ensino/painel'
import { EstadoVazio, Esqueleto, Selo, formatarMinutos } from '@/components/ensino/primitivos'
import { usePublicaAltura } from '@/hooks/use-publica-altura'
import { cn } from '@/lib/utils'

/**
 * A lista de Trilhas do painel (§6).
 *
 * Criar uma Trilha custa um título e nada mais. A montagem é incremental por
 * decisão de produto (§30): a equipe cria a Trilha, vai juntando aulas ao longo
 * da semana e publica quando o caminho fizer sentido. Um formulário de criação
 * com capa, objetivo, público e nível pediria decisões que só ficam claras
 * depois de ver o percurso montado.
 *
 * A EXCLUSÃO EM MASSA (pedido explícito)
 *
 * Apagar uma Trilha nunca apaga aula nenhuma — ela é só uma sequência de
 * referências (§1). Isso torna a exclusão em lote bem mais barata aqui do que
 * no catálogo de aulas: não há progresso, anotação nem vínculo de conteúdo
 * para limpar, só o documento da Trilha e o estado de quem a tinha começado.
 * A seleção é sobre TODAS as Trilhas carregadas — rascunho e publicada juntas
 * —, porque a tela já traz a lista inteira de uma vez, sem paginação.
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

  const [marcadas, setMarcadas] = useState<Set<string>>(new Set())
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [aviso, setAviso] = useState('')

  // Mesmo mecanismo do Catálogo (§ ver hooks/use-publica-altura.ts): sem
  // isso, o círculo de Suporte no canto inferior direito (telas grandes)
  // ficava por cima do botão "Excluir" e engolia o clique.
  const refDaBarraDeAcoes = usePublicaAltura<HTMLDivElement>('--gx-barra-inferior-h', marcadas.size > 0)

  const carregar = useCallback(() => {
    setCarregando(true)
    fetch('/api/ensino/trilhas?rascunhos=1', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.trilhas) setTrilhas(d.trilhas)
      })
      .catch(() => {})
      .finally(() => setCarregando(false))
    setMarcadas(new Set())
  }, [])

  useEffect(carregar, [carregar])

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

  async function excluirMarcadas() {
    const ids = Array.from(marcadas)
    if (ids.length === 0) return
    setExcluindo(true)
    setAviso('')
    try {
      const resposta = await fetch('/api/ensino/trilhas/lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, confirmar: true }),
      })
      const d = await resposta.json().catch(() => ({}))
      if (!resposta.ok) throw new Error(d.error || 'Não foi possível excluir.')
      setConfirmandoExclusao(false)
      setAviso(
        `${d.afetadas} ${d.afetadas === 1 ? 'Trilha excluída' : 'Trilhas excluídas'}.`,
      )
      carregar()
    } catch (e: any) {
      setAviso(e?.message || 'Não foi possível excluir.')
    } finally {
      setExcluindo(false)
    }
  }

  function alternarMarcada(id: string) {
    setMarcadas((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  const todasMarcadas = trilhas.length > 0 && marcadas.size === trilhas.length
  const publicadas = trilhas.filter((t) => t.situacao === 'publicada')
  const rascunhos = trilhas.filter((t) => t.situacao !== 'publicada')

  return (
    <PainelDeEnsino
      titulo="Trilhas de Ensino"
      descricao="Cada Trilha referencia aulas que já existem. Apagar a Trilha nunca apaga uma aula."
      acoes={
        <div className="flex flex-wrap items-center gap-2">
          <BotaoSecundario href="/aulas/gerenciar/trilhas/auditoria">
            <ShieldCheck className="h-4 w-4" /> Auditar Trilhas
          </BotaoSecundario>
          <BotaoPrincipal onClick={() => setCriando((v) => !v)}>
            <Plus className="h-4 w-4" /> Nova Trilha
          </BotaoPrincipal>
        </div>
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

      {aviso ? (
        <p className="mb-4 rounded-xl border border-border/70 bg-muted/50 px-4 py-2.5 text-sm">
          {aviso}
        </p>
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
        <div className={`space-y-8 ${marcadas.size > 0 ? 'pb-24' : ''}`}>
          {/* A linha de seleção fica solta, acima das duas seções — a
              seleção não distingue rascunho de publicada, então um controle
              por seção duplicaria "selecionar todas" sem ganhar nada. */}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/40 px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/70">
            <Caixa
              marcada={todasMarcadas}
              onChange={() =>
                setMarcadas(todasMarcadas ? new Set() : new Set(trilhas.map((t) => t._id)))
              }
              rotulo="Selecionar todas as Trilhas"
            />
            <span>
              {marcadas.size > 0
                ? `${marcadas.size} ${marcadas.size === 1 ? 'selecionada' : 'selecionadas'}`
                : 'Selecionar todas'}
            </span>
          </label>

          {rascunhos.length > 0 ? (
            <Secao titulo="Rascunhos" descricao="Visíveis só para quem administra">
              {rascunhos.map((trilha) => (
                <LinhaDeTrilha
                  key={trilha._id}
                  trilha={trilha}
                  marcada={marcadas.has(trilha._id)}
                  aoMarcar={() => alternarMarcada(trilha._id)}
                />
              ))}
            </Secao>
          ) : null}

          {publicadas.length > 0 ? (
            <Secao titulo="Publicadas" descricao="No ar para os alunos">
              {publicadas.map((trilha) => (
                <LinhaDeTrilha
                  key={trilha._id}
                  trilha={trilha}
                  marcada={marcadas.has(trilha._id)}
                  aoMarcar={() => alternarMarcada(trilha._id)}
                />
              ))}
            </Secao>
          ) : null}
        </div>
      )}

      {/* ══ A barra de ações em lote ══════════════════════════════════ */}
      <AnimatePresence>
        {marcadas.size > 0 ? (
          <motion.div
            ref={refDaBarraDeAcoes}
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md"
          >
            <div className="container mx-auto flex max-w-[100rem] flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 font-heading text-base font-extrabold">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-sm text-primary-foreground">
                  {marcadas.size}
                </span>
                {marcadas.size === 1 ? 'Trilha selecionada' : 'Trilhas selecionadas'}
              </span>

              <button
                type="button"
                onClick={() => setMarcadas(new Set())}
                className="text-xs font-semibold text-muted-foreground underline transition hover:text-foreground"
              >
                limpar
              </button>

              <div className="ml-auto">
                <BotaoDuo
                  tom="perigo"
                  tamanho="pequeno"
                  onClick={() => setConfirmandoExclusao(true)}
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </BotaoDuo>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {confirmandoExclusao ? (
        <ConfirmacaoDeExclusaoDeTrilhas
          quantidade={marcadas.size}
          ocupado={excluindo}
          aoCancelar={() => setConfirmandoExclusao(false)}
          aoConfirmar={excluirMarcadas}
        />
      ) : null}
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

function LinhaDeTrilha({
  trilha,
  marcada,
  aoMarcar,
}: {
  trilha: TrilhaNaLista
  marcada: boolean
  aoMarcar: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50">
      <Caixa marcada={marcada} onChange={aoMarcar} rotulo={`Selecionar ${trilha.titulo}`} />

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

/* =================== SELEÇÃO E EXCLUSÃO EM MASSA =================== */

/** A mesma caixa de seleção do Catálogo — ver o comentário lá. */
function Caixa({
  marcada,
  onChange,
  rotulo,
}: {
  marcada: boolean
  onChange: () => void
  rotulo?: string
}) {
  return (
    <span className="relative flex h-6 w-6 flex-none items-center justify-center">
      <input
        type="checkbox"
        checked={marcada}
        onChange={onChange}
        aria-label={rotulo}
        className="peer absolute inset-0 cursor-pointer opacity-0"
      />
      <span
        className={cn(
          'pointer-events-none flex h-5 w-5 items-center justify-center rounded-md transition',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2',
          marcada
            ? 'bg-primary text-primary-foreground'
            : 'bg-card ring-2 ring-inset ring-border peer-hover:ring-primary/50',
        )}
      >
        {marcada ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
            <path
              d="M3 8.5L6.5 12L13 4.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    </span>
  )
}

/**
 * A confirmação da exclusão em massa de Trilhas.
 *
 * Mais direta do que a do Catálogo: aqui não há "progresso e anotações" para
 * mencionar, porque nenhuma aula é tocada — só o caminho é desmontado. O
 * limiar de "digite EXCLUIR" continua em 10, para o admin não aprender um
 * segundo comportamento para o mesmo tipo de risco.
 */
function ConfirmacaoDeExclusaoDeTrilhas({
  quantidade,
  ocupado,
  aoCancelar,
  aoConfirmar,
}: {
  quantidade: number
  ocupado: boolean
  aoCancelar: () => void
  aoConfirmar: () => void
}) {
  const exigeDigitar = quantidade > 10
  const [texto, setTexto] = useState('')
  const liberado = !exigeDigitar || texto.trim().toUpperCase() === 'EXCLUIR'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={aoCancelar}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/12 text-destructive">
          <AlertTriangle className="h-7 w-7" strokeWidth={2.5} />
        </span>

        <h2 className="mt-4 font-heading text-xl font-extrabold tracking-tight">
          Excluir {quantidade} {quantidade === 1 ? 'Trilha' : 'Trilhas'}?
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {quantidade === 1 ? 'A Trilha some' : 'As Trilhas somem'} de vez, junto com o progresso
          e o certificado de quem {quantidade === 1 ? 'a estava fazendo' : 'as estava fazendo'}.
          As aulas que {quantidade === 1 ? 'ela usava continuam existindo' : 'elas usavam continuam existindo'} —
          só deixam de fazer parte {quantidade === 1 ? 'deste caminho' : 'desses caminhos'}.
        </p>

        <p className="mt-2 text-sm font-semibold">Não dá para desfazer.</p>

        {exigeDigitar ? (
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Digite EXCLUIR para confirmar
            </span>
            <input
              value={texto}
              autoFocus
              onChange={(e) => setTexto(e.target.value)}
              className={cn(classeDeEntrada, 'uppercase tracking-widest')}
            />
          </label>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <BotaoDuo tom="perigo" onClick={aoConfirmar} disabled={!liberado || ocupado}>
            {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {ocupado ? 'Excluindo…' : 'Excluir'}
          </BotaoDuo>
          <BotaoDuo tom="contorno" onClick={aoCancelar}>
            Cancelar
          </BotaoDuo>
        </div>
      </motion.div>
    </div>
  )
}
