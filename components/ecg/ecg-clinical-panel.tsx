'use client'

import React, { useState } from 'react'
import {
  BookOpen, Dna, GitBranch, AlertTriangle, Lightbulb, Stethoscope, Syringe,
  ShieldAlert, ClipboardList, FlaskConical, Activity, ChevronDown, Zap, HeartPulse,
} from 'lucide-react'
import type { EcgEntry, EcgClinical } from '@/lib/ecg/catalog'

/** Painel de explicação clínica completa de um padrão de ECG. */
export function EcgClinicalPanel({ entry }: { entry: EcgEntry }) {
  const c = entry.clinical
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><BookOpen className="h-4 w-4 text-primary" /> Explicação clínica</h3>
      <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
        <p className="rounded-lg bg-primary/[0.06] p-3 text-[13px] leading-relaxed">{c.resumo}</p>

        <Sec title="Fisiopatologia" icon={Dna} defaultOpen>
          <P>{c.fisiopatologia}</P>
          {c.mecanismo && <P><strong>Mecanismo:</strong> {c.mecanismo}</P>}
        </Sec>

        <Sec title="Critérios diagnósticos" icon={ClipboardList} defaultOpen>
          <List items={c.criterios} />
        </Sec>

        <Sec title="Diagnósticos diferenciais" icon={GitBranch}>
          <Chips items={c.diferenciais} tone="sky" />
        </Sec>

        {(c.arteriaCulpada || c.paredeAfetada) && (
          <Sec title="Correlação anatômica" icon={HeartPulse} defaultOpen>
            {c.arteriaCulpada && <P><strong>Artéria culpada:</strong> {c.arteriaCulpada}</P>}
            {c.paredeAfetada && <P><strong>Parede afetada:</strong> {c.paredeAfetada.join(', ')}</P>}
          </Sec>
        )}

        {(c.errosComuns || c.armadilhas) && (
          <Sec title="Erros comuns e armadilhas" icon={AlertTriangle} tone="warn">
            {c.errosComuns && <List items={c.errosComuns} />}
            {c.armadilhas && <List items={c.armadilhas} />}
          </Sec>
        )}

        {c.pearls && (
          <Sec title="Pearls" icon={Lightbulb} tone="pearl">
            <List items={c.pearls} />
          </Sec>
        )}
        {c.dicasProva && (
          <Sec title="Dicas de prova" icon={Zap} tone="pearl">
            <List items={c.dicasProva} />
          </Sec>
        )}

        <Sec title="Conduta inicial" icon={Stethoscope} defaultOpen tone="ok">
          <List items={c.condutaInicial} />
          <div className="mt-2 space-y-1">
            {c.quandoEmergencia && <Flag label="Quando é emergência" text={c.quandoEmergencia} tone="red" />}
            {c.quandoInternar && <Flag label="Quando internar" text={c.quandoInternar} tone="amber" />}
            {c.quandoBenigno && <Flag label="Quando é benigno" text={c.quandoBenigno} tone="green" />}
            {c.quandoTrombolisar && <Flag label="Quando trombolisar" text={c.quandoTrombolisar} tone="red" />}
            {c.quandoDesfibrilar && <Flag label="Quando desfibrilar" text={c.quandoDesfibrilar} tone="red" />}
            {c.quandoCardioverter && <Flag label="Quando cardioverter" text={c.quandoCardioverter} tone="amber" />}
            {c.quandoMarcapasso && <Flag label="Quando marcapasso" text={c.quandoMarcapasso} tone="sky" />}
          </div>
        </Sec>

        {(c.medicamentosIndicados || c.medicamentosContraindicados) && (
          <Sec title="Farmacologia" icon={Syringe}>
            {c.medicamentosIndicados && <div className="mb-2"><p className="mb-1 text-[11px] font-bold uppercase text-emerald-500">Indicados</p><Chips items={c.medicamentosIndicados} tone="green" /></div>}
            {c.medicamentosContraindicados && <div><p className="mb-1 text-[11px] font-bold uppercase text-red-500">Contraindicados / cuidado</p><Chips items={c.medicamentosContraindicados} tone="red" /></div>}
          </Sec>
        )}

        {(c.pacienteTipico || c.sintomas || c.sinais || c.achadosFisicos) && (
          <Sec title="Correlação clínica" icon={Activity}>
            {c.pacienteTipico && <P><strong>Paciente típico:</strong> {c.pacienteTipico}</P>}
            {c.sintomas && <div className="mt-1"><p className="text-[11px] font-bold uppercase text-muted-foreground">Sintomas</p><Chips items={c.sintomas} tone="sky" /></div>}
            {c.sinais && <div className="mt-1"><p className="text-[11px] font-bold uppercase text-muted-foreground">Sinais</p><Chips items={c.sinais} tone="sky" /></div>}
            {c.achadosFisicos && <div className="mt-1"><p className="text-[11px] font-bold uppercase text-muted-foreground">Achados físicos</p><Chips items={c.achadosFisicos} tone="sky" /></div>}
          </Sec>
        )}

        {(c.laboratorio || c.examesComplementares) && (
          <Sec title="Laboratório e exames" icon={FlaskConical}>
            {c.laboratorio && <div className="mb-1"><p className="text-[11px] font-bold uppercase text-muted-foreground">Laboratório esperado</p><List items={c.laboratorio} /></div>}
            {c.examesComplementares && <div><p className="text-[11px] font-bold uppercase text-muted-foreground">Exames complementares</p><List items={c.examesComplementares} /></div>}
          </Sec>
        )}

        {c.prognostico && (
          <Sec title="Prognóstico" icon={ShieldAlert}>
            <P>{c.prognostico}</P>
          </Sec>
        )}

        {c.referencias && (
          <div className="mt-2 rounded-lg bg-white/[0.02] p-2.5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Referências</p>
            <ul className="space-y-0.5">
              {c.referencias.map((r, i) => <li key={i} className="text-[11px] text-muted-foreground">• {r}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function Sec({ title, icon: Icon, children, defaultOpen = false, tone }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; tone?: 'warn' | 'pearl' | 'ok' }) {
  const [open, setOpen] = useState(defaultOpen)
  const border = tone === 'warn' ? 'border-amber-500/25' : tone === 'pearl' ? 'border-violet-500/25' : tone === 'ok' ? 'border-emerald-500/25' : 'border-white/[0.06]'
  return (
    <div className={`rounded-lg border ${border} bg-white/[0.015]`}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 p-2.5 text-left">
        <span className="flex items-center gap-2 text-[13px] font-bold"><Icon className="h-3.5 w-3.5 text-primary" /> {title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-1.5 px-3 pb-3">{children}</div>}
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[12.5px] leading-relaxed text-foreground/85">{children}</p>
}
function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((it, i) => (
        <li key={i} className="flex gap-1.5 text-[12.5px] leading-relaxed text-foreground/85"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />{it}</li>
      ))}
    </ul>
  )
}
const TONE: Record<string, string> = {
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
  red: 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20',
}
function Chips({ items, tone }: { items: string[]; tone: 'sky' | 'green' | 'red' }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => <span key={i} className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${TONE[tone]}`}>{it}</span>)}
    </div>
  )
}
function Flag({ label, text, tone }: { label: string; text: string; tone: 'red' | 'amber' | 'green' | 'sky' }) {
  const styles: Record<string, string> = {
    red: 'border-red-500/30 bg-red-500/[0.07] text-red-600 dark:text-red-300',
    amber: 'border-amber-500/30 bg-amber-500/[0.07] text-amber-600 dark:text-amber-300',
    green: 'border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-300',
    sky: 'border-sky-500/30 bg-sky-500/[0.07] text-sky-600 dark:text-sky-300',
  }
  return (
    <div className={`rounded-lg border px-2.5 py-1.5 ${styles[tone]}`}>
      <span className="text-[11px] font-black uppercase tracking-wide">{label}: </span>
      <span className="text-[12px] font-medium text-foreground/85">{text}</span>
    </div>
  )
}
