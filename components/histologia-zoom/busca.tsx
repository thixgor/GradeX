'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import { rotaDaLaminaZoom } from '@/lib/histologia-zoom/rotas'
import type { LaminaResumida } from '@/lib/histologia-zoom/tipos'

import { CartaoDeLamina } from './cartao'

type Indexada = LaminaResumida & { termos: string }

function normalizar(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Busca do catálogo: por órgão, sistema, estrutura, coloração ou espécie, em
 * português, latim ou inglês, sem acento. O índice é leve (só o que o cartão
 * mostra + sinônimos) e a busca roda no navegador — 184 lâminas não justificam
 * uma ida ao servidor por tecla.
 *
 * Sem termo, a busca some e o catálogo por sistemas aparece (vem como
 * `children`, renderizado no servidor).
 */
export function BuscaDoZoom({
  indice,
  sistemas,
  children,
}: {
  indice: Indexada[]
  sistemas: Array<{ id: string; nome: string }>
  children: React.ReactNode
}) {
  const [termo, setTermo] = useState('')
  const [sistema, setSistema] = useState<string>('')

  const preparado = useMemo(
    () => indice.map((l) => ({ lamina: l, chave: normalizar(`${l.orgaoNome} ${l.termos}`) })),
    [indice],
  )

  const resultados = useMemo(() => {
    const palavras = normalizar(termo).split(/\s+/).filter(Boolean)
    if (!palavras.length && !sistema) return null
    return preparado
      .filter(({ lamina, chave }) => (!sistema || lamina.sistema === sistema) && palavras.every((p) => chave.includes(p)))
      .map(({ lamina, chave }) => {
        // Nome do órgão casando no início pesa mais que sinônimo no meio do texto.
        const nome = normalizar(lamina.orgaoNome)
        const pontos = palavras.reduce(
          (s, p) => s + (nome.startsWith(p) ? 4 : nome.includes(p) ? 2 : chave.includes(p) ? 1 : 0),
          0,
        )
        return { lamina, pontos }
      })
      .sort((a, b) => b.pontos - a.pontos)
      .map((r) => r.lamina)
  }, [preparado, termo, sistema])

  const orgaosNoResultado = resultados ? new Set(resultados.map((r) => r.orgao)).size : 0

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 bg-background/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="busca-zoom" className="sr-only">
            Buscar lâmina por órgão, estrutura ou coloração
          </label>
          <input
            id="busca-zoom"
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Medula espinal, glomérulo, cartilagem elástica, HE…"
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-[15px] shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20"
          />
          {termo && (
            <button
              type="button"
              onClick={() => setTermo('')}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
        <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]" role="group" aria-label="Filtrar por sistema">
          <Chip ativo={!sistema} onClick={() => setSistema('')}>
            Todos
          </Chip>
          {sistemas.map((s) => (
            <Chip key={s.id} ativo={sistema === s.id} onClick={() => setSistema(sistema === s.id ? '' : s.id)}>
              {s.nome}
            </Chip>
          ))}
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {resultados ? `${resultados.length} lâminas encontradas` : ''}
      </div>

      {resultados ? (
        <section className="mt-4" aria-label="Resultados da busca">
          <p className="mb-3 text-sm text-muted-foreground">
            {resultados.length === 0
              ? 'Nada encontrado. Tente o nome do órgão, uma estrutura ("glomérulo") ou a coloração ("orceína").'
              : `${resultados.length} ${resultados.length === 1 ? 'lâmina' : 'lâminas'} em ${orgaosNoResultado} ${
                  orgaosNoResultado === 1 ? 'órgão' : 'órgãos'
                }`}
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {resultados.map((l) => (
              <li key={l.slug}>
                <CartaoDeLamina lamina={l} href={rotaDaLaminaZoom(l.sistema, l.slug)} mostrarOrgao />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        children
      )}
    </div>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`inline-flex min-h-[34px] shrink-0 items-center whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-colors ${
        ativo
          ? 'border-teal-700 bg-teal-700 text-white'
          : 'border-border bg-card text-muted-foreground hover:border-teal-500/40 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
