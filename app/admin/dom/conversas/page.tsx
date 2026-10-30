'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, GraduationCap, Loader2, MessageCircle, Search, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TextoDoDom } from '@/components/dom/texto-do-dom'
import '@/components/dom/dom.css'

/**
 * Histórico de IA de todos os usuários: as conversas com o Dom (as 25 mais
 * recentes de cada pessoa, até 40 falas cada — `lib/dom/historico.ts`). Lista
 * paginada à esquerda, conversa inteira à direita, com a mesma formatação que
 * o aluno viu (negrito, fórmulas). Busca por nome, e-mail, título ou id.
 */

interface ItemDaLista {
  id: string
  userId: string
  nome: string
  email: string
  modo: 'geral' | 'socratico' | 'material'
  titulo: string
  atualizadaEm: string
  totalDeFalas: number
  alertas: number
  ultima: string
}

interface Conversa extends Omit<ItemDaLista, 'ultima' | 'alertas'> {
  criadaEm: string
  rota: string
  materialId: string
  falas: Array<{ papel: 'aluno' | 'dom'; texto: string; em: string; motor?: string; alerta?: string }>
}

const MODO = {
  geral: { rotulo: 'Conversa', Icone: MessageCircle },
  socratico: { rotulo: 'Socrático', Icone: GraduationCap },
  material: { rotulo: 'Material', Icone: BookOpen },
} as const

const quando = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function AdminConversasDoDomPage() {
  const [q, setQ] = useState('')
  const [modo, setModo] = useState('')
  const [soAlertas, setSoAlertas] = useState(false)
  const [lista, setLista] = useState<ItemDaLista[]>([])
  const [temMais, setTemMais] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [aberta, setAberta] = useState<Conversa | null>(null)
  const [abrindo, setAbrindo] = useState<string | null>(null)
  const pedido = useRef(0)

  // `?q=` vindo de outra tela (ex.: incidente → "ver conversas da pessoa").
  useEffect(() => {
    const inicial = new URLSearchParams(window.location.search).get('q')
    if (inicial) setQ(inicial)
  }, [])

  const carregar = useCallback(
    async (mais = false) => {
      const meu = ++pedido.current
      setCarregando(true)
      setErro('')
      const p = new URLSearchParams()
      if (q.trim()) p.set('q', q.trim())
      if (modo) p.set('modo', modo)
      if (soAlertas) p.set('alertas', '1')
      if (mais && lista.length) p.set('antes', lista[lista.length - 1].atualizadaEm)
      try {
        const r = await fetch(`/api/admin/dom/conversas?${p}`, { cache: 'no-store' })
        const d = await r.json().catch(() => null)
        if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`)
        if (meu !== pedido.current) return
        setLista((atual) => (mais ? [...atual, ...d.conversas] : d.conversas))
        setTemMais(!!d.temMais)
      } catch (e) {
        if (meu === pedido.current) setErro(e instanceof Error ? e.message : 'Erro ao carregar')
      } finally {
        if (meu === pedido.current) setCarregando(false)
      }
    },
    [q, modo, soAlertas, lista],
  )

  // Filtros: recarrega do começo (a busca espera a pessoa parar de digitar).
  useEffect(() => {
    const t = setTimeout(() => void carregar(false), q ? 350 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, modo, soAlertas])

  const abrir = async (id: string) => {
    setAbrindo(id)
    try {
      const r = await fetch(`/api/admin/dom/conversas/${id}`, { cache: 'no-store' })
      const d = await r.json().catch(() => null)
      if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`)
      setAberta(d)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao abrir a conversa')
    } finally {
      setAbrindo(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/dom" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Dom
        </Link>
        <h1 className="text-2xl font-bold">Histórico de IA dos usuários</h1>
        <p className="w-full text-sm text-muted-foreground">
          As 25 conversas mais recentes de cada pessoa (até 40 falas por conversa). Apagar no aparelho não apaga daqui.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm"
            placeholder="Nome, e-mail, título da conversa ou id do usuário"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar conversas"
          />
        </div>
        <select className="h-9 rounded-md border bg-background px-2 text-sm" value={modo} onChange={(e) => setModo(e.target.value)} aria-label="Modo">
          <option value="">Todos os modos</option>
          <option value="geral">Conversa</option>
          <option value="socratico">Socrático</option>
          <option value="material">Material</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={soAlertas} onChange={(e) => setSoAlertas(e.target.checked)} /> Só com alerta de segurança
        </label>
      </div>
      {erro && <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{erro}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardContent className="max-h-[75vh] divide-y overflow-y-auto p-0">
            {!lista.length && !carregando && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>}
            {lista.map((c) => {
              const { Icone, rotulo } = MODO[c.modo] || MODO.geral
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void abrir(c.id)}
                  className={`block w-full p-3 text-left text-sm transition hover:bg-muted/60 ${aberta?.id === c.id ? 'bg-muted' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Icone className="h-4 w-4 flex-none text-orange-500" aria-label={rotulo} />
                    <span className="min-w-0 flex-1 truncate font-semibold">{c.titulo}</span>
                    {c.alertas > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                        <ShieldAlert className="h-3 w-3" /> {c.alertas}
                      </span>
                    )}
                    {abrindo === c.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {c.nome || 'sem nome'} · {c.email}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.ultima}</p>
                  <p className="mt-1 text-[0.68rem] text-muted-foreground">
                    {quando(c.atualizadaEm)} · {c.totalDeFalas} falas
                  </p>
                </button>
              )
            })}
            {(temMais || carregando) && (
              <div className="p-3 text-center">
                <Button variant="outline" size="sm" disabled={carregando} onClick={() => void carregar(true)}>
                  {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Carregar mais
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[50vh]">
          <CardContent className="space-y-3 p-4">
            {!aberta && <p className="py-16 text-center text-sm text-muted-foreground">Escolha uma conversa à esquerda.</p>}
            {aberta && (
              <>
                <div className="border-b pb-3">
                  <h2 className="text-lg font-bold">{aberta.titulo}</h2>
                  <p className="text-sm text-muted-foreground">
                    {aberta.nome || 'sem nome'} · {aberta.email} · <code className="text-xs">{aberta.userId}</code>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(MODO[aberta.modo] || MODO.geral).rotulo} · começou {quando(aberta.criadaEm)} · última {quando(aberta.atualizadaEm)} · {aberta.totalDeFalas} falas
                    {aberta.totalDeFalas > aberta.falas.length ? ` (mostrando as ${aberta.falas.length} últimas)` : ''}
                    {aberta.rota ? ` · página ${aberta.rota}` : ''}
                  </p>
                </div>
                <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
                  {aberta.falas.map((f, i) => (
                    <div key={i} className={`flex ${f.papel === 'aluno' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          f.papel === 'aluno' ? 'bg-emerald-700 text-white' : 'border bg-background'
                        } ${f.alerta ? 'ring-2 ring-red-500' : ''}`}
                      >
                        {f.papel === 'aluno' ? (
                          <p className="whitespace-pre-wrap">{f.texto}</p>
                        ) : (
                          <div className="space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
                            <TextoDoDom texto={f.texto} />
                          </div>
                        )}
                        <p className={`mt-1 text-[0.65rem] ${f.papel === 'aluno' ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {quando(f.em)}
                          {f.motor ? ` · ${f.motor}` : ''}
                          {f.alerta ? ` · ⚠ barrada pela guarda (${f.alerta})` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
