'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { CartaoDeLamina } from '@/components/histologia-zoom/cartao'
import { IconeDoSistema } from '@/components/histologia-zoom/icone-do-sistema'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { rotaDosDadosDoZoom, type DadosDoSistemaDoZoom } from '@/lib/histologia-zoom/paginas-tipos'
import { BASE_ZOOM, rotaDaLaminaZoom, rotaDoSistema } from '@/lib/histologia-zoom/rotas'

/**
 * Um sistema da Histologia com Zoom: os órgãos e as lâminas de cada um. O casco
 * é estático; o conteúdo vem da rota de dados do zoom, depois do portão.
 */
export function SistemaDoZoom({ sistema, comPatologia }: { sistema: string; comPatologia: boolean }) {
  return (
    <PortaoDaHistologia<DadosDoSistemaDoZoom> url={rotaDosDadosDoZoom([sistema])}>
      {(dados) => <Conteudo dados={dados} comPatologia={comPatologia} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados, comPatologia }: { dados: DadosDoSistemaDoZoom; comPatologia: boolean }) {
  const { sistema, orgaos, total, vizinhos } = dados
  useTituloDaAba(`${sistema.nome} — Histologia com Zoom`)

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <nav aria-label="Trilha" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href={BASE_ZOOM} className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Histologia · Lâminas com zoom
          </Link>
        </nav>

        <header className="flex items-start gap-4">
          <span
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: sistema.cor }}
          >
            <IconeDoSistema nome={sistema.icone} className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{sistema.nome}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{sistema.descricao}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {orgaos.length} {orgaos.length === 1 ? 'órgão' : 'órgãos'} · {total} {total === 1 ? 'lâmina' : 'lâminas'}
            </p>
          </div>
        </header>

        {/* Índice de órgãos — o salto "Sistema → órgão" num toque */}
        <nav aria-label="Órgãos deste sistema" className="mt-5 flex flex-wrap gap-1.5">
          {orgaos.map((o) => (
            <a
              key={o.id}
              href={`#${o.id}`}
              className="inline-flex min-h-[36px] items-center rounded-full border border-border bg-card px-3 text-xs font-semibold transition-colors hover:border-teal-500/50"
            >
              {o.nome}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-10">
          {orgaos.map((o) => (
            <section key={o.id} id={o.id} aria-labelledby={`t-${o.id}`} className="scroll-mt-4">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id={`t-${o.id}`} className="font-heading text-xl font-semibold tracking-tight">
                  <Link href={rotaDaLaminaZoom(sistema.id, o.laminas[0].slug)} className="hover:text-teal-700 dark:hover:text-teal-300">
                    {o.nome}
                  </Link>
                </h2>
                <p className="text-xs text-muted-foreground">
                  {o.laminas.length} {o.laminas.length === 1 ? 'lâmina' : 'lâminas'}
                </p>
              </div>
              <p className="mb-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{o.resumo}</p>
              <ul className="mb-4 flex flex-wrap gap-1.5">
                {o.tecidos.map((t) => (
                  <li key={t.tipo} className="rounded-md bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{t.curto}</span> ≈{t.pct}%
                  </li>
                ))}
              </ul>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {o.laminas.map((l) => (
                  <li key={l.slug}>
                    <CartaoDeLamina lamina={l} href={rotaDaLaminaZoom(sistema.id, l.slug)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <nav aria-label="Outros sistemas" className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          {vizinhos.map((v, i) =>
            v ? (
              <Link
                key={v.id}
                href={rotaDoSistema(v.id)}
                className={`rounded-xl border border-border bg-card p-4 transition-colors hover:border-teal-500/40 ${i === 1 ? 'sm:text-right' : ''}`}
              >
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {i === 0 ? 'Sistema anterior' : 'Próximo sistema'}
                </span>
                <span className="mt-1 block font-heading font-semibold">{v.nome}</span>
              </Link>
            ) : (
              <span key={i} />
            ),
          )}
        </nav>
      </div>
    </div>
  )
}
