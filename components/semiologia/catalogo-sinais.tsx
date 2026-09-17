'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Camera, ChevronRight, Search, Sparkles, X } from 'lucide-react'
import type { SinalResumo } from '@/lib/semiologia/catalogo'
import { buscar, preparar, type EntradaDeBusca } from '@/lib/semiologia/busca-motor'
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
  const [soComFoto, setSoComFoto] = useState(false)

  const sistemas = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const sinal of sinais) mapa.set(sinal.sistemaTitulo, (mapa.get(sinal.sistemaTitulo) ?? 0) + 1)
    return [...mapa.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
  }, [sinais])

  // O mesmo motor da paleta global, sobre os resumos que já vieram por prop:
  // sinônimo, inglês, glossário e erro de digitação valem aqui também.
  const preparado = useMemo(
    () =>
      preparar(
        sinais.map<EntradaDeBusca>((sinal) => ({
          tipo: 'sinal',
          id: sinal.slug,
          titulo: sinal.nome,
          sinonimos: sinal.sinonimos,
          contexto: sinal.sistemaTitulo,
          corpo: sinal.resumo,
          href: ROTAS.sinal(sinal.slug),
          grupo: sinal.sistemaTitulo,
          temCasoReal: Boolean(sinal.capaReal),
        })),
      ),
    [sinais],
  )

  const { filtrados, resposta } = useMemo(() => {
    const porSlug = new Map(sinais.map((s) => [s.slug, s]))
    const termo = busca.trim()
    const resposta = termo.length >= 2 ? buscar(preparado, termo, { limite: sinais.length }) : null
    const base = resposta ? resposta.resultados.map((r) => porSlug.get(r.entrada.id)!) : sinais
    return {
      resposta,
      filtrados: base.filter((sinal) => {
        if (sistema && sinal.sistemaTitulo !== sistema) return false
        if (soComFoto && !sinal.capaReal) return false
        return true
      }),
    }
  }, [sinais, preparado, busca, sistema, soComFoto])

  const totalComFoto = useMemo(() => sinais.filter((s) => s.capaReal).length, [sinais])

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, sinônimo, doença ou termo em inglês — flapping, Graves, joanete…"
          aria-label="Filtrar sinais"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm outline-none transition-[border-color,box-shadow] focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
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

      <div className="flex flex-wrap items-center gap-2">
        <Chip ativo={sistema === null} onClick={() => setSistema(null)}>
          Todos <span className="opacity-60">({sinais.length})</span>
        </Chip>
        {sistemas.map(([titulo, total]) => (
          <Chip key={titulo} ativo={sistema === titulo} onClick={() => setSistema(sistema === titulo ? null : titulo)}>
            {titulo} <span className="opacity-60">({total})</span>
          </Chip>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
        <Chip ativo={soComFoto} onClick={() => setSoComFoto((v) => !v)} tom="emerald">
          <Camera className="mr-1 inline h-3 w-3" />
          Com caso real <span className="opacity-60">({totalComFoto})</span>
        </Chip>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p className="tabular-nums">
          {filtrados.length === sinais.length ? `${sinais.length} sinais` : `${filtrados.length} de ${sinais.length} sinais`}
          {busca.trim().length >= 2 && ' · ordenados por relevância'}
        </p>
        {(resposta?.traduzido || resposta?.aproximado) && (
          <p className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
            <Sparkles className="h-3.5 w-3.5" />
            {resposta.aproximado ? 'Nenhum resultado exato — mostrando os mais parecidos.' : 'Termo traduzido para o vocabulário do acervo.'}
          </p>
        )}
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum sinal encontrado{busca ? <> para “{busca}”</> : ''}{soComFoto ? ' com caso real' : ''}{sistema ? ` em ${sistema}` : ''}.
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

function Chip({
  ativo,
  onClick,
  children,
  tom = 'sky',
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
  tom?: 'sky' | 'emerald'
}) {
  const ligado = tom === 'emerald' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-sky-500 bg-sky-500 text-white'
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        ativo ? ligado : 'border-border bg-card text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
