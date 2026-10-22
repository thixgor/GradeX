'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Layers } from 'lucide-react'

import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { CartaoDeDoenca } from '@/components/histopatologia/cartao-doenca'
import { rotaDosDadosDaHistopatologia, type DadosDoSistemaDaPatologia } from '@/lib/histopatologia/paginas-tipos'
import { BASE, rotaDaEntradaCatalogada, rotaDoAtlas, rotaDoSistema, rotaNormal } from '@/lib/histopatologia/rotas'

/**
 * Página de sistema: capítulos escritos primeiro, inventário depois.
 *
 * A ordem é intencional e é a mesma promessa da home: o que passou por trabalho
 * editorial vem antes do que é acervo bruto. Um sistema sem capítulo nenhum
 * mostra o inventário e diz isso com todas as letras, em vez de exibir uma lista
 * de títulos com aparência de sumário científico.
 *
 * A paginação e o filtro por capítulo continuam no servidor: `?pagina=` e
 * `?capitulo=` são lidos aqui e repassados à rota de dados, depois do portão.
 */
export function SistemaDaPatologia({ sistema }: { sistema: string }) {
  const busca = useSearchParams()
  const url = rotaDosDadosDaHistopatologia(['sistemas', sistema], {
    pagina: busca?.get('pagina'),
    capitulo: busca?.get('capitulo'),
  })
  return (
    <PortaoDaHistologia<DadosDoSistemaDaPatologia> url={url}>
      {(dados) => <Conteudo dados={dados} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados }: { dados: DadosDoSistemaDaPatologia }) {
  const { sistema, doencas, grupos, pagina, totalDePaginas, capituloSelecionado } = dados
  useTituloDaAba(sistema.nome, ' — Histopatologia | Manual da Histologia')

  const rotaDaListagem = (novaPagina: number, capitulo: string | null = capituloSelecionado) => {
    const consulta = new URLSearchParams()
    if (capitulo) consulta.set('capitulo', capitulo)
    if (novaPagina > 1) consulta.set('pagina', String(novaPagina))
    const sufixo = consulta.toString()
    return `${rotaDoSistema(sistema.id)}${sufixo ? `?${sufixo}` : ''}`
  }

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada />
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <Link
          href={BASE}
          className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Histopatologia
        </Link>

        <header className="mb-6">
          <p className="editorial-mark mb-2">Sistema</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{sistema.nome}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{sistema.descricao}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            <li className="rounded-full border border-border bg-card px-2.5 py-1 font-semibold">
              {sistema.entradas.toLocaleString('pt-BR')} capítulos visuais
            </li>
            <li className="rounded-full border border-border bg-card px-2.5 py-1 font-semibold">
              {sistema.midias.toLocaleString('pt-BR')} lâminas
            </li>
            <li className="rounded-full border border-border bg-card px-2.5 py-1 font-semibold">
              {sistema.doencas} {sistema.doencas === 1 ? 'capítulo escrito' : 'capítulos escritos'}
            </li>
          </ul>

          {sistema.caminhoNormal && (
            <Link
              href={rotaNormal(sistema.caminhoNormal)}
              className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-card px-3.5 text-xs font-bold transition-colors hover:border-teal-600/50"
            >
              Ver este sistema na Histologia normal
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </header>

        {doencas.length > 0 && (
          <section aria-labelledby="capitulos-sistema" className="mb-10">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-teal-700 dark:text-teal-400" aria-hidden />
              <h2 id="capitulos-sistema" className="font-heading text-lg font-semibold">
                Capítulos aprofundados
              </h2>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {doencas.map((doenca) => (
                <li key={doenca.slug}>
                  <CartaoDeDoenca doenca={doenca} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="inventario-sistema">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-700 dark:text-violet-400" aria-hidden />
            <h2 id="inventario-sistema" className="font-heading text-lg font-semibold">
              Capítulos visuais do atlas
            </h2>
          </div>
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {dados.totalDoInventario.toLocaleString('pt-BR')} capítulos organizados por assunto, com títulos legíveis e
            as lâminas abertas primeiro dentro do Domine Aqui. Para procurar em todos os sistemas, use a{' '}
            <Link href={rotaDoAtlas()} className="font-bold underline">
              busca geral do atlas
            </Link>
            .
          </p>

          <nav aria-label="Filtrar capítulos visuais" className="mb-6 flex flex-wrap gap-2">
            <Link
              href={rotaDaListagem(1, null)}
              aria-current={!capituloSelecionado ? 'page' : undefined}
              className="inline-flex min-h-[40px] items-center rounded-full border border-border bg-card px-3 text-xs font-bold transition-colors hover:border-teal-600/50 aria-[current=page]:border-teal-600 aria-[current=page]:bg-teal-500/10"
            >
              Todos · {dados.totalDoInventario.toLocaleString('pt-BR')}
            </Link>
            {dados.capitulos.map((capitulo) => (
              <Link
                key={capitulo.id}
                href={rotaDaListagem(1, capitulo.id)}
                aria-current={capituloSelecionado === capitulo.id ? 'page' : undefined}
                className="inline-flex min-h-[40px] items-center rounded-full border border-border bg-card px-3 text-xs font-bold transition-colors hover:border-teal-600/50 aria-[current=page]:border-teal-600 aria-[current=page]:bg-teal-500/10"
              >
                {capitulo.nome} · {capitulo.total.toLocaleString('pt-BR')}
              </Link>
            ))}
          </nav>

          {grupos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Nenhum capítulo visual nesta seleção.
            </p>
          ) : (
            <div className="space-y-8">
              {grupos.map((grupo) => (
                <section key={grupo.id} aria-labelledby={`grupo-${grupo.id}`}>
                  <div className="mb-3">
                    <h3 id={`grupo-${grupo.id}`} className="font-heading text-base font-semibold">
                      {grupo.nome}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{grupo.descricao}</p>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {grupo.entradas.map((entrada) => (
                      <li key={entrada.id}>
                        <Link
                          href={rotaDaEntradaCatalogada(entrada.id)}
                          className="group flex h-full min-h-[112px] flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-teal-600/50"
                        >
                          <span className="font-heading text-base font-semibold leading-snug">{entrada.nome}</span>
                          {entrada.descricao && (
                            <span className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {entrada.descricao}
                            </span>
                          )}
                          <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-3 text-[11px] text-muted-foreground">
                            <span>
                              {entrada.midias.toLocaleString('pt-BR')} {entrada.midias === 1 ? 'lâmina' : 'lâminas'}
                            </span>
                            {entrada.temLaminaVirtual && <span>· lâmina virtual</span>}
                            {entrada.doencaSlug && (
                              <span className="font-bold text-teal-700 dark:text-teal-400">· aprofundado</span>
                            )}
                            <ArrowRight
                              className="ml-auto h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                              aria-hidden
                            />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {totalDePaginas > 1 && (
            <nav
              aria-label="Paginação dos capítulos visuais"
              className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5"
            >
              {pagina > 1 ? (
                <Link
                  href={rotaDaListagem(pagina - 1)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-bold transition-colors hover:border-teal-600/50"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Anterior
                </Link>
              ) : (
                <span />
              )}
              <span className="text-xs font-semibold text-muted-foreground">
                Página {pagina} de {totalDePaginas}
              </span>
              {pagina < totalDePaginas ? (
                <Link
                  href={rotaDaListagem(pagina + 1)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-bold transition-colors hover:border-teal-600/50"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  )
}
