'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { CenaResumo, JanelaResumo, VistaResumo } from '@/lib/semiologia/catalogo'
import { ROTAS } from '@/lib/semiologia/rotas'
import { Capa } from './capa'

/**
 * Grade das janelas de imagem — beira-leito e ultrassom compartilham o layout.
 *
 * O card lista as cenas por nome e marca qual é a normal. Parece detalhe e não
 * é: o aluno que chega procurando "otite média aguda" precisa ver, no próprio
 * card, que existe uma cena normal para comparar — senão abre direto a
 * patologia e repete o hábito de estudar achado sem referência.
 */
export function CatalogoDeImagem({
  itens,
  tipo,
}: {
  itens: (VistaResumo | JanelaResumo)[]
  tipo: 'vista' | 'janela'
}) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {itens.map((item) => {
        const href = tipo === 'vista' ? ROTAS.vista(item.slug) : ROTAS.janela(item.slug)
        const legenda =
          'paraQue' in item ? (item as VistaResumo).paraQue : (item as JanelaResumo).pergunta
        const etiqueta =
          'instrumento' in item
            ? (item as VistaResumo).instrumento
            : `${(item as JanelaResumo).protocolo} · ${(item as JanelaResumo).transdutor}`

        return (
          <li key={item.slug} className="overflow-hidden rounded-xl border border-border bg-card">
            <Link href={href} className="group block">
              <Capa real={item.capaReal} ilustracao={item.capa} />
              <div className="p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
                <h2 className="mt-1 flex items-center gap-1 text-base font-semibold transition-colors group-hover:text-sky-700 dark:group-hover:text-sky-400">
                  {item.nome}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{legenda}</p>
              </div>
            </Link>
            <ListaDeCenas href={href} cenas={item.cenas} />
          </li>
        )
      })}
    </ul>
  )
}

const CENAS_VISIVEIS = 8

/**
 * As cenas do card, recolhidas a partir da nona.
 *
 * Com a segunda leva do acervo, uma janela pulmonar tem mais de trinta cenas;
 * listá-las todas em cada card transformaria o catálogo numa parede de
 * chips. As primeiras oito (a normal e as mais procuradas) ficam à vista; o
 * resto abre num clique, sem sair da página.
 */
function ListaDeCenas({ href, cenas }: { href: string; cenas: CenaResumo[] }) {
  const [aberta, setAberta] = useState(false)
  const comCaso = cenas.filter((c) => c.temCasoReal).length
  const visiveis = aberta ? cenas : cenas.slice(0, CENAS_VISIVEIS)
  const escondidas = cenas.length - CENAS_VISIVEIS
  return (
    <div className="border-t border-border p-3">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="tabular-nums">{cenas.length} cenas</span>
        {comCaso > 0 && (
          <span className="inline-flex items-center gap-1 normal-case tracking-normal text-sky-700 dark:text-sky-400">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
            {comCaso} com caso real
          </span>
        )}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {visiveis.map((cena) => (
          <li key={cena.id}>
            <Link
              href={`${href}?cena=${cena.id}`}
              className={`inline-block rounded px-1.5 py-0.5 text-[11px] transition-colors ${
                cena.estado === 'normal'
                  ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
              title={cena.temCasoReal ? `${cena.diagnostico} · com caso real` : cena.diagnostico}
            >
              {cena.titulo}
              {cena.temCasoReal && (
                <span aria-hidden className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-sky-500 align-middle" />
              )}
            </Link>
          </li>
        ))}
        {escondidas > 0 && (
          <li>
            <button
              type="button"
              onClick={() => setAberta((v) => !v)}
              aria-expanded={aberta}
              className="inline-flex items-center gap-1 rounded border border-dashed border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-sky-500/50 hover:text-foreground"
            >
              {aberta ? 'Recolher' : `+${escondidas} cenas`}
              <ChevronDown className={`h-3 w-3 transition-transform ${aberta ? 'rotate-180' : ''}`} />
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}
