'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, ShieldAlert, Sparkles, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Painel do Dom: uso (por dia, por motor, tokens), quem mais conversou hoje,
 * contas suspensas e as tentativas de exploit que a guarda barrou — com o
 * trecho que casou e a mensagem, para o admin julgar se foi ataque ou falso
 * positivo. Sem polling: o botão atualiza.
 */

interface Painel {
  limites: Record<string, number>
  dias: Array<{ dia: string; mensagens: number; gemini: number; gateway: number; buscas: number; incidentes: number; tokensEntrada: number; tokensSaida: number }>
  topo: Array<{ userId: string; nome: string; email: string; mensagens: number; buscas: number; tokens: number }>
  incidentes: Array<{ id: string; userId: string; nome: string; email: string; tipo: string; gravidade: number; trecho: string; mensagem: string; modo: string; rota: string; ip: string; resolvido: boolean; createdAt: string }>
  suspensos: Array<{ userId: string; nome: string; email: string; ate: string }>
}

const TIPO: Record<string, string> = {
  'injecao-de-prompt': 'Injeção de prompt',
  'extracao-de-prompt': 'Extração do prompt',
  'troca-de-persona': 'Troca de persona / jailbreak',
  'abuso-de-tokens': 'Abuso de tokens',
  'carga-codificada': 'Carga codificada',
  'uso-indevido': 'Uso fora do propósito',
  'vazamento-de-prompt': 'Vazamento barrado na saída',
}

const n = (v: number) => v.toLocaleString('pt-BR')
const quando = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function AdminDomPage() {
  const [dados, setDados] = useState<Painel | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const r = await fetch('/api/admin/dom', { cache: 'no-store' })
      if (!r.ok) throw new Error((await r.json().catch(() => null))?.error || `HTTP ${r.status}`)
      setDados(await r.json())
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const agir = async (corpo: Record<string, string>) => {
    await fetch('/api/admin/dom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
    void carregar()
  }

  const hoje = dados?.dias[0]
  const abertos = dados?.incidentes.filter((i) => !i.resolvido) || []

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Painel
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-orange-500" /> Dom — assistente de IA
        </h1>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => void carregar()} disabled={carregando}>
          <RefreshCw className={`mr-2 h-4 w-4 ${carregando ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>
      {erro && <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{erro}</p>}

      {dados && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { rotulo: 'Mensagens hoje', valor: n(hoje?.mensagens || 0), detalhe: `teto por pessoa: ${dados.limites.porDia}/dia` },
              { rotulo: 'Gemini hoje', valor: `${n(hoje?.gemini || 0)} / ${n(dados.limites.geminiPorDia)}`, detalhe: `${dados.limites.geminiPorMinuto}/min no máximo` },
              { rotulo: 'AI Gateway hoje', valor: `${n(hoje?.gateway || 0)} / ${n(dados.limites.gatewayPorDia)}`, detalhe: 'reserva paga' },
              { rotulo: 'Incidentes abertos', valor: n(abertos.length), detalhe: `${n(hoje?.incidentes || 0)} hoje` },
            ].map((c) => (
              <Card key={c.rotulo}>
                <CardHeader className="pb-2">
                  <CardDescription>{c.rotulo}</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">{c.valor}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">{c.detalhe}</CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="h-5 w-5 text-red-500" /> Tentativas de exploit
              </CardTitle>
              <CardDescription>Barradas antes de chegar à IA (não gastam token). Três graves em 24 h suspendem o Dom por 24 h para a conta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {!dados.incidentes.length && <p className="text-sm text-muted-foreground">Nenhuma tentativa registrada. 🎉</p>}
              {dados.incidentes.map((i) => (
                <div key={i.id} className={`rounded-xl border p-3 text-sm ${i.resolvido ? 'opacity-60' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${i.gravidade >= 2 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                      {TIPO[i.tipo] || i.tipo}
                    </span>
                    <span className="font-medium">{i.nome || 'sem nome'}</span>
                    <span className="text-muted-foreground">{i.email}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {quando(i.createdAt)} · {i.modo}
                      {i.ip ? ` · ${i.ip}` : ''}
                    </span>
                  </div>
                  <p className="mt-2 rounded-lg bg-muted p-2 font-mono text-xs">{i.mensagem}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Casou: <code>{i.trecho}</code>
                    {i.rota ? ` · página ${i.rota}` : ''}
                  </p>
                  {!i.resolvido && (
                    <Button variant="ghost" size="sm" className="mt-1" onClick={() => void agir({ acao: 'resolver', id: i.id })}>
                      Marcar como visto
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quem mais conversou hoje</CardTitle>
              </CardHeader>
              <CardContent>
                {!dados.topo.length && <p className="text-sm text-muted-foreground">Ninguém ainda hoje.</p>}
                <ul className="divide-y text-sm">
                  {dados.topo.map((t) => (
                    <li key={t.userId} className="flex items-center gap-2 py-2">
                      <span className="min-w-0 flex-1 truncate">
                        {t.nome || t.userId} <span className="text-muted-foreground">{t.email}</span>
                      </span>
                      <span className="tabular-nums">{t.mensagens} msg</span>
                      <span className="w-24 text-right tabular-nums text-muted-foreground">{n(t.tokens)} tok</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserX className="h-5 w-5" /> Contas suspensas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!dados.suspensos.length && <p className="text-sm text-muted-foreground">Nenhuma conta suspensa.</p>}
                <ul className="divide-y text-sm">
                  {dados.suspensos.map((s) => (
                    <li key={s.userId} className="flex items-center gap-2 py-2">
                      <span className="min-w-0 flex-1 truncate">
                        {s.nome} <span className="text-muted-foreground">{s.email}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">até {quando(s.ate)}</span>
                      <Button size="sm" variant="outline" onClick={() => void agir({ acao: 'liberar', userId: s.userId })}>
                        Liberar
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Últimos 14 dias</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm tabular-nums">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-1">Dia</th>
                    <th>Mensagens</th>
                    <th>Gemini</th>
                    <th>Gateway</th>
                    <th>Buscas</th>
                    <th>Tokens (entrada/saída)</th>
                    <th>Incidentes</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.dias.map((d) => (
                    <tr key={d.dia} className="border-t">
                      <td className="py-1.5">{d.dia}</td>
                      <td>{n(d.mensagens)}</td>
                      <td>{n(d.gemini)}</td>
                      <td>{n(d.gateway)}</td>
                      <td>{n(d.buscas)}</td>
                      <td>
                        {n(d.tokensEntrada)} / {n(d.tokensSaida)}
                      </td>
                      <td>{n(d.incidentes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
