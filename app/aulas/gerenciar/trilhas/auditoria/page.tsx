'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  RefreshCw,
  Wand2,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BotaoPrincipal, BotaoSecundario, Numero, PainelDeEnsino } from '@/components/ensino/painel'
import { EstadoVazio, Esqueleto, Selo } from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * A auditoria de referências de aula nas Trilhas (§32-like: mapear antes de
 * mexer).
 *
 * Existe porque uma etapa guarda `{ refId }`, não a aula — e por um bom
 * tempo uma das rotas que apagava aula (`/api/aulas/[id]`, a mais antiga) não
 * limpava essa referência de volta. O sintoma era "Aula removida do acervo"
 * no construtor, ou pior, o item sumindo em silêncio sem ninguém decidir
 * isso (ver o comentário longo em lib/ensino/auditoria-trilhas.ts).
 *
 * Esta tela só LÊ até alguém clicar em corrigir. O relatório separa o que
 * dá para consertar sozinho (um único título vivo casa com o que foi salvo)
 * do que precisa de decisão humana (título ambíguo, ou nenhum título salvo
 * para tentar).
 */

interface Candidato {
  id: string
  titulo: string
}

interface Problema {
  trilhaId: string
  trilhaTitulo: string
  trilhaSlug?: string
  etapaId: string
  etapaTitulo: string
  itemId: string
  refIdAtual: string
  tituloSalvo?: string
  status: 'recuperavel' | 'ambigua' | 'orfa-sem-titulo' | 'orfa-irrecuperavel'
  sugestao?: Candidato
  candidatos?: Candidato[]
}

interface Resumo {
  trilhasAnalisadas: number
  referencias: number
  validas: number
  recuperaveis: number
  ambiguas: number
  orfasSemTitulo: number
  orfasIrrecuperaveis: number
}

const ROTULO_DO_STATUS: Record<Problema['status'], string> = {
  recuperavel: 'Recuperável',
  ambigua: 'Correspondência ambígua',
  'orfa-sem-titulo': 'Sem título salvo',
  'orfa-irrecuperavel': 'Não encontrada',
}

export default function AuditoriaDeTrilhasPage() {
  return (
    <AppShell headerTitle="Auditoria de Trilhas" headerSubtitle="Administração de Ensino">
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [problemas, setProblemas] = useState<Problema[]>([])
  const [carregando, setCarregando] = useState(true)
  const [corrigindo, setCorrigindo] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  const carregar = () => {
    setCarregando(true)
    setErro('')
    fetch('/api/ensino/trilhas/auditoria', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        setResumo(d.resumo)
        setProblemas(d.problemas || [])
      })
      .catch(() => setErro('Não foi possível carregar a auditoria.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [])

  const recuperaveis = useMemo(
    () => problemas.filter((p) => p.status === 'recuperavel' && p.sugestao),
    [problemas],
  )

  async function corrigirTudo() {
    if (recuperaveis.length === 0) return
    setCorrigindo(true)
    setErro('')
    setAviso('')
    try {
      const resposta = await fetch('/api/ensino/trilhas/auditoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correcoes: recuperaveis.map((p) => ({
            trilhaId: p.trilhaId,
            itemId: p.itemId,
            refIdNovo: p.sugestao!.id,
          })),
        }),
      })
      const d = await resposta.json().catch(() => ({}))
      if (!resposta.ok) throw new Error(d.error || 'Não foi possível corrigir.')
      setAviso(
        `${d.itensCorrigidos} ${d.itensCorrigidos === 1 ? 'referência corrigida' : 'referências corrigidas'} em ${d.trilhasAlteradas} ${d.trilhasAlteradas === 1 ? 'Trilha' : 'Trilhas'}.`,
      )
      carregar()
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível corrigir.')
    } finally {
      setCorrigindo(false)
    }
  }

  async function corrigirUma(p: Problema) {
    if (!p.sugestao) return
    setErro('')
    setAviso('')
    try {
      const resposta = await fetch('/api/ensino/trilhas/auditoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correcoes: [{ trilhaId: p.trilhaId, itemId: p.itemId, refIdNovo: p.sugestao.id }],
        }),
      })
      const d = await resposta.json().catch(() => ({}))
      if (!resposta.ok) throw new Error(d.error || 'Não foi possível corrigir.')
      carregar()
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível corrigir.')
    }
  }

  return (
    <PainelDeEnsino
      titulo="Auditoria de Trilhas"
      descricao="Toda referência de aula dentro de cada etapa, conferida contra o acervo de agora."
      voltarPara="/aulas/gerenciar/trilhas"
      acoes={
        <BotaoSecundario onClick={carregar} disabled={carregando}>
          <RefreshCw className={cn('h-4 w-4', carregando && 'animate-spin')} /> Reauditar
        </BotaoSecundario>
      }
    >
      {erro ? (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {erro}
        </p>
      ) : null}
      {aviso ? (
        <p className="mb-4 rounded-xl border border-border/70 bg-muted/50 px-4 py-2.5 text-sm">{aviso}</p>
      ) : null}

      {carregando ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Esqueleto key={i} className="h-24" />
          ))}
        </div>
      ) : resumo ? (
        <>
          <div className="mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Numero valor={resumo.trilhasAnalisadas} rotulo="Trilhas analisadas" />
            <Numero valor={resumo.referencias} rotulo="Referências de aula" />
            <Numero valor={resumo.validas} rotulo="Válidas" icone={CheckCircle2} />
            <Numero valor={resumo.recuperaveis} rotulo="Recuperáveis" icone={Wand2} />
            <Numero valor={resumo.ambiguas} rotulo="Ambíguas" icone={HelpCircle} />
            <Numero
              valor={resumo.orfasSemTitulo + resumo.orfasIrrecuperaveis}
              rotulo="Precisam de revisão"
              icone={AlertTriangle}
            />
          </div>

          {problemas.length === 0 ? (
            <EstadoVazio
              icone={CheckCircle2}
              titulo="Nenhuma referência quebrada"
              descricao="Toda aula citada nas etapas de todas as Trilhas resolve para um documento que existe."
            />
          ) : (
            <>
              {recuperaveis.length > 0 ? (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <Wand2 className="h-5 w-5 flex-none text-primary" />
                  <p className="flex-1 text-sm">
                    {recuperaveis.length}{' '}
                    {recuperaveis.length === 1
                      ? 'referência tem uma única aula viva com o título salvo'
                      : 'referências têm uma única aula viva com o título salvo'}{' '}
                    — a correspondência é inequívoca.
                  </p>
                  <BotaoPrincipal onClick={corrigirTudo} carregando={corrigindo}>
                    Corrigir {recuperaveis.length === 1 ? '' : 'todas '}automaticamente
                  </BotaoPrincipal>
                </div>
              ) : null}

              <div className="space-y-2">
                {problemas.map((p) => (
                  <LinhaDoProblema key={`${p.trilhaId}:${p.itemId}`} p={p} aoCorrigir={corrigirUma} />
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </PainelDeEnsino>
  )
}

function LinhaDoProblema({ p, aoCorrigir }: { p: Problema; aoCorrigir: (p: Problema) => void }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            <Link href={`/aulas/gerenciar/trilhas/${p.trilhaId}`} className="hover:text-primary hover:underline">
              {p.trilhaTitulo}
            </Link>{' '}
            · {p.etapaTitulo}
          </p>
          {/* `break-all` no id e `break-words` no título: os dois são conteúdo
              do banco, sem limite de tamanho e sem espaços garantidos — um
              ObjectId de 24 caracteres não quebra sozinho e vaza da tela no
              celular. */}
          <p className="mt-1 text-sm">
            <span className="font-semibold">Referência antiga:</span>{' '}
            <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs">{p.refIdAtual}</code>
          </p>
          <p className="mt-0.5 break-words text-sm">
            <span className="font-semibold">Título salvo:</span>{' '}
            {p.tituloSalvo ? `"${p.tituloSalvo}"` : <span className="text-muted-foreground">nenhum</span>}
          </p>

          {p.status === 'recuperavel' && p.sugestao ? (
            <p className="mt-0.5 text-sm text-primary">
              <span className="font-semibold">Correspondência encontrada:</span> {p.sugestao.titulo}
            </p>
          ) : null}

          {p.status === 'ambigua' && p.candidatos ? (
            <div className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {p.candidatos.length} aulas vivas com este título:
              </span>{' '}
              {p.candidatos.map((c) => c.titulo).join(', ')} — escolha manualmente no construtor.
            </div>
          ) : null}
        </div>

        <div className="flex flex-none items-center gap-2">
          <Selo tom={p.status === 'recuperavel' ? 'primario' : 'aviso'}>{ROTULO_DO_STATUS[p.status]}</Selo>
          {p.status === 'recuperavel' ? (
            <BotaoSecundario onClick={() => aoCorrigir(p)}>Corrigir</BotaoSecundario>
          ) : null}
        </div>
      </div>
    </div>
  )
}
