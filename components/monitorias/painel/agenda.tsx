'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarOff, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NOMES_DIAS } from '@/lib/monitorias/agenda'
import type { Disponibilidade, JanelaSemanal } from '@/lib/monitorias/tipos'
import { CaixaAviso, CaixaErro, HoraBrasilia, api } from '../base'

const HORAS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)

/** Editor da agenda semanal (horário de Brasília) + dias bloqueados. */
export function EditorAgenda({ inicial, recarregar }: { inicial: Disponibilidade; recarregar: () => void }) {
  const [semanal, setSemanal] = useState<JanelaSemanal[]>(inicial.semanal)
  const [bloqueados, setBloqueados] = useState<string[]>(inicial.diasBloqueados)
  const [intervalo, setIntervalo] = useState(inicial.intervaloMin)
  const [novoBloqueio, setNovoBloqueio] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tom: 'erro' | 'ok'; texto: string } | null>(null)

  function adicionar(dia: number) {
    setSemanal((s) => [...s, { dia, inicio: '19:00', fim: '22:00' }])
  }
  function mudar(i: number, campo: 'inicio' | 'fim', v: string) {
    setSemanal((s) => s.map((j, k) => (k === i ? { ...j, [campo]: v } : j)))
  }

  async function salvar() {
    setSalvando(true)
    setMsg(null)
    try {
      await api('/api/monitorias/tutor/disponibilidade', { method: 'PUT', json: { semanal, diasBloqueados: bloqueados, intervaloMin: intervalo } })
      setMsg({ tom: 'ok', texto: 'Agenda salva! Os alunos já veem os novos horários.' })
      recarregar()
    } catch (e) {
      setMsg({ tom: 'erro', texto: e instanceof Error ? e.message : 'Erro ao salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-5">
      <CaixaAviso tom="info">
        Estes são os horários em que você aceita dar aula pelo <strong>agendamento direto</strong> (todos em horário de Brasília). Aulas já marcadas continuam valendo se você mudar a agenda.
      </CaixaAviso>
      <div className="grid gap-3 md:grid-cols-2">
        {NOMES_DIAS.map((nome, dia) => {
          const doDia = semanal.map((j, i) => ({ j, i })).filter((x) => x.j.dia === dia)
          return (
            <div key={dia} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold">{nome}</p>
                <Button size="sm" variant="ghost" onClick={() => adicionar(dia)}><Plus className="mr-1 h-3.5 w-3.5" /> Horário</Button>
              </div>
              <AnimatePresence initial={false}>
                {doDia.length === 0 && <p className="text-xs text-muted-foreground">Sem aulas neste dia</p>}
                {doDia.map(({ j, i }) => (
                  <motion.div key={i} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2 flex items-center gap-2">
                    <select value={j.inicio} onChange={(e) => mudar(i, 'inicio', e.target.value)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
                      {HORAS.map((h) => <option key={h}>{h}</option>)}
                    </select>
                    <span className="text-xs text-muted-foreground">até</span>
                    <select value={j.fim} onChange={(e) => mudar(i, 'fim', e.target.value)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
                      {[...HORAS.slice(1), '24:00'].map((h) => <option key={h}>{h}</option>)}
                    </select>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSemanal((s) => s.filter((_, k) => k !== i))} aria-label="Remover"><Trash2 className="h-4 w-4" /></Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-semibold">Folga entre aulas</p>
          <p className="text-xs text-muted-foreground">Tempo livre obrigatório antes e depois de cada aula.</p>
          <div className="mt-2 flex gap-2">
            {[0, 15, 30].map((m) => (
              <button key={m} type="button" onClick={() => setIntervalo(m)} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${intervalo === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{m ? `${m} min` : 'Nenhuma'}</button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="flex items-center gap-1.5 font-semibold"><CalendarOff className="h-4 w-4 text-primary" /> Dias de folga / bloqueados</p>
          <div className="mt-2 flex gap-2">
            <input type="date" value={novoBloqueio} onChange={(e) => setNovoBloqueio(e.target.value)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm" />
            <Button size="sm" variant="outline" disabled={!novoBloqueio} onClick={() => { setBloqueados((b) => Array.from(new Set([...b, novoBloqueio])).sort()); setNovoBloqueio('') }}>Bloquear</Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bloqueados.map((d) => (
              <button key={d} type="button" onClick={() => setBloqueados((b) => b.filter((x) => x !== d))} className="rounded-full bg-muted px-2.5 py-0.5 text-xs hover:bg-rose-500/15" title="Remover">
                {d.split('-').reverse().join('/')} ×
              </button>
            ))}
          </div>
        </div>
      </div>
      {msg && (msg.tom === 'erro' ? <CaixaErro mensagem={msg.texto} /> : <CaixaAviso tom="sucesso">{msg.texto}</CaixaAviso>)}
      <div className="flex items-center justify-between gap-3">
        <HoraBrasilia />
        <Button onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Salvar agenda</>}</Button>
      </div>
    </div>
  )
}
