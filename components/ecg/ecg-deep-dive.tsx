'use client'

import React, { useMemo, useState } from 'react'
import {
  BookOpen, ChevronDown, Waves, ListOrdered, GitCompare, Lightbulb, Quote,
} from 'lucide-react'
import type { EcgEntry } from '@/lib/ecg/catalog'
import { getDeepDive } from '@/lib/ecg/deep-dive'

/**
 * Texto longo e didático sobre o traçado selecionado: por que ele tem aquele
 * desenho, como lê-lo onda a onda, em que ordem reconhecê-lo e como separá-lo
 * dos padrões parecidos.
 *
 * Fica separado do `EcgClinicalPanel` de propósito: aquele responde "o que é e
 * o que fazer" em listas curtas para consulta rápida; aqui é leitura corrida,
 * por isso ocupa a largura toda e limita a linha a ~78 caracteres.
 */
export function EcgDeepDive({ entry }: { entry: EcgEntry }) {
  const deep = useMemo(() => getDeepDive(entry.id), [entry.id])
  const [open, setOpen] = useState(true)

  if (!deep) return null

  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-bold">
            <BookOpen className="h-4 w-4 shrink-0 text-primary" />
            Explicação aprofundada
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
            {entry.nome} · {deep.secoes.length} blocos · leitura onda a onda, roteiro e diferenciais
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-5 border-t border-white/[0.06] px-4 pb-5 pt-4">
          {/* Frase-âncora: o que define este traçado e nenhum outro */}
          <p className="flex gap-2.5 rounded-lg border border-primary/25 bg-primary/[0.06] p-3.5 text-[13.5px] font-medium leading-relaxed">
            <Quote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{deep.emUmaFrase}</span>
          </p>

          {/* ── Blocos narrativos ── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {deep.secoes.map((s, i) => (
              <article key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
                <h4 className="mb-1.5 flex items-baseline gap-2 font-heading text-[13.5px] font-bold tracking-tight">
                  <span className="font-mono text-[11px] font-black text-primary">{String(i + 1).padStart(2, '0')}</span>
                  {s.titulo}
                </h4>
                <p className="max-w-[78ch] text-[13px] leading-[1.75] text-foreground/85">{s.texto}</p>
              </article>
            ))}
          </div>

          {/* ── Leitura sistemática onda a onda ── */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-bold">
              <Waves className="h-4 w-4 text-primary" /> Leitura onda a onda
            </h4>
            <dl className="divide-y divide-white/[0.05]">
              {deep.ondaAOnda.map((w, i) => (
                <div key={i} className="grid gap-0.5 py-2 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr] sm:gap-3">
                  <dt className="text-[12px] font-bold text-primary/90">{w.onda}</dt>
                  <dd className="text-[12.5px] leading-relaxed text-foreground/85">{w.achado}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* ── Roteiro de reconhecimento ── */}
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
              <h4 className="mb-3 flex items-center gap-2 text-[13px] font-bold">
                <ListOrdered className="h-4 w-4 text-emerald-500" /> Roteiro de reconhecimento
              </h4>
              <ol className="space-y-2">
                {deep.roteiro.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-foreground/85">
                    <span className="mt-0.5 inline-flex min-w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-black leading-none text-emerald-600 dark:text-emerald-300">
                      {i + 1}
                    </span>
                    {r}
                  </li>
                ))}
              </ol>
            </div>

            {/* ── Diferenciais em pares ── */}
            {deep.separando && deep.separando.length > 0 && (
              <div className="rounded-lg border border-sky-500/25 bg-sky-500/[0.04] p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-bold">
                  <GitCompare className="h-4 w-4 text-sky-500" /> Separando dos parecidos
                </h4>
                <ul className="space-y-2.5">
                  {deep.separando.map((d, i) => (
                    <li key={i} className="text-[12.5px] leading-relaxed">
                      <span className="font-bold text-sky-600 dark:text-sky-300">{d.de}</span>
                      <span className="text-foreground/85"> — {d.chave}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Âncoras de memória ── */}
          {deep.fixacao && deep.fixacao.length > 0 && (
            <div className="rounded-lg border border-violet-500/25 bg-violet-500/[0.04] p-4">
              <h4 className="mb-3 flex items-center gap-2 text-[13px] font-bold">
                <Lightbulb className="h-4 w-4 text-violet-500" /> Para não esquecer
              </h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {deep.fixacao.map((f, i) => (
                  <p key={i} className="rounded-md bg-white/[0.03] px-3 py-2 text-[12.5px] leading-relaxed text-foreground/85">
                    {f}
                  </p>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] italic text-muted-foreground">
            Conteúdo educacional baseado em diretrizes AHA/ACC/ESC/SBC e na literatura de referência.
            Não substitui avaliação médica individualizada.
          </p>
        </div>
      )}
    </section>
  )
}
