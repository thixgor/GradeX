'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search, X } from 'lucide-react'
import type { SinalResumo } from '@/lib/semiologia/catalogo'
import { ROTAS } from '@/lib/semiologia/rotas'
import { Capa } from './capa'
import { Enfase } from './enfase'

/**
 * Catálogo dos sinais.
 *
 * A busca cobre nome **e sinônimos** — e isso não é detalhe: o aluno procura
 * "flapping" e o acervo guarda "asterixe"; procura "spider naevi" e o acervo
 * guarda "estigmas cutâneos de hepatopatia". Indexar só o título oficial
 * devolveria vazio justamente para quem está começando, que é quem mais precisa
 * encontrar.
 *
 * O componente recebe os resumos por prop, montados no servidor: o corpo das
 * fichas — mecanismo, causas, desempenho — nunca entra no bundle do catálogo.
 */
export function CatalogoDeSinais({ sinais }: { sinais: SinalResumo[] }) {
  const [busca, setBusca] = useState('')
  const [sistema, setSistema] = useState<string | null>(null)

  const sistemas = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const sinal of sinais) mapa.set(sinal.sistemaTitulo, (mapa.get(sinal.sistemaTitulo) ?? 0) + 1)
    return [...mapa.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
  }, [sinais])

  const filtrados = useMemo(() => {
    const termo = normalizar(busca)
    return sinais.filter((sinal) => {
      if (sistema && sinal.sistemaTitulo !== sistema) return false
      if (!termo) return true
      const alvo = normalizar([sinal.nome, ...sinal.sinonimos, sinal.resumo].join(' '))
      return alvo.includes(termo)
    })
  }, [sinais, busca, sistema])

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou sinônimo — flapping, spider naevi, Godet…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-sky-500"
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip ativo={sistema === null} onClick={() => setSistema(null)}>
          Todos <span className="opacity-60">({sinais.length})</span>
        </Chip>
        {sistemas.map(([titulo, total]) => (
          <Chip key={titulo} ativo={sistema === titulo} onClick={() => setSistema(sistema === titulo ? null : titulo)}>
            {titulo} <span className="opacity-60">({total})</span>
          </Chip>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum sinal encontrado para “{busca}”.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((sinal) => (
            <li key={sinal.slug}>
              <Link
                href={ROTAS.sinal(sinal.slug)}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-sky-500/50"
              >
                <Capa real={sinal.capaReal} ilustracao={sinal.ilustracao} />
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {sinal.sistemaTitulo}
                  </p>
                  <h2 className="mt-1 text-sm font-semibold transition-colors group-hover:text-sky-700 dark:group-hover:text-sky-400">
                    {sinal.nome}
                  </h2>
                  {sinal.sinonimos.length > 0 && (
                    <p className="mt-0.5 text-[11px] italic text-muted-foreground">{sinal.sinonimos.join(' · ')}</p>
                  )}
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground"><Enfase texto={sinal.resumo} /></p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5">{sinal.totalCausas} causas</span>
                    {sinal.temDesempenho && (
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-400">
                        com LR publicada
                      </span>
                    )}
                    {sinal.comparador && (
                      <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-sky-700 dark:text-sky-400">
                        tem comparador
                      </span>
                    )}
                    <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        ativo ? 'border-sky-500 bg-sky-500 text-white' : 'border-border bg-card text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
