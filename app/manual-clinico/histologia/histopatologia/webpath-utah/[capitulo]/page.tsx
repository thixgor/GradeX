import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Search } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import {
  rotaDoCapituloWebPathUtah,
  rotaDoWebPathUtah,
} from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'
import { chaveDeBusca } from '@/lib/histopatologia/texto'
import {
  modalidadeDaEntradaWebPathUtah,
  resumoDoCapituloWebPathUtah,
} from '@/lib/histopatologia/webpath-utah/catalogo'
import { obterCapituloWebPathUtah } from '@/lib/histopatologia/webpath-utah/repositorio'
import {
  leituraDidaticaWebPathUtah,
  traduzirSecaoWebPathUtah,
  traduzirTituloWebPathUtah,
} from '@/lib/histopatologia/webpath-utah/traducao'

export const revalidate = 86400

const POR_PAGINA = 24

interface Props {
  params: { capitulo: string }
  searchParams?: { q?: string; modalidade?: string; pagina?: string }
}

export function generateMetadata({ params }: Props): Metadata {
  const resumo = resumoDoCapituloWebPathUtah(params.capitulo)
  if (!resumo) return {}
  return metadadosDoModulo({
    titulo: `${resumo.nome} — WebPath/Utah`,
    descricao: `${resumo.total} referências de ${resumo.nome.toLocaleLowerCase('pt-BR')} traduzidas e acompanhadas por leitura anatomopatológica guiada.`,
    caminho: rotaDoCapituloWebPathUtah(resumo.id),
  })
}

export default async function PaginaDoCapituloWebPathUtah({ params, searchParams = {} }: Props) {
  const resumo = resumoDoCapituloWebPathUtah(params.capitulo)
  const capitulo = await obterCapituloWebPathUtah(params.capitulo)
  if (!resumo || !capitulo) notFound()

  const consulta = (searchParams.q ?? '').trim()
  const chave = chaveDeBusca(consulta)
  const modalidade =
    searchParams.modalidade === 'macroscopia' || searchParams.modalidade === 'microscopia'
      ? searchParams.modalidade
      : 'todas'

  const preparadas = capitulo.entradas.map((entrada) => ({
    ...entrada,
    titulo: traduzirTituloWebPathUtah(entrada.tituloOriginal),
    secao: traduzirSecaoWebPathUtah(entrada.secaoOriginal),
    modalidade: modalidadeDaEntradaWebPathUtah(entrada.tituloOriginal),
  }))
  const filtradas = preparadas.filter((entrada) => {
    if (modalidade !== 'todas' && entrada.modalidade !== modalidade) return false
    if (!chave) return true
    return chaveDeBusca(
      `${entrada.titulo} ${entrada.tituloOriginal} ${entrada.secao} ${entrada.secaoOriginal}`,
    ).includes(chave)
  })

  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const solicitada = Number.parseInt(searchParams.pagina ?? '1', 10)
  const pagina = Number.isFinite(solicitada) ? Math.min(Math.max(solicitada, 1), paginas) : 1
  const visiveis = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const macros = preparadas.filter((entrada) => entrada.modalidade === 'macroscopia').length
  const micros = preparadas.length - macros

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <Link
            href={rotaDoWebPathUtah()}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Atlas WebPath/Utah
          </Link>

          <header className="mb-6 max-w-4xl">
            <p className="editorial-mark mb-2">
              {resumo.grupo === 'geral' ? 'Patologia geral' : 'Patologia sistêmica'}
            </p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {resumo.nome}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" lang="en">
              {resumo.nomeOriginal}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {resumo.descricao} {resumo.roteiro}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-muted-foreground">
              <li className="rounded-full border border-border bg-card px-3 py-1.5">
                {resumo.total} referências
              </li>
              <li className="rounded-full border border-border bg-card px-3 py-1.5">
                {macros} macroscópicas
              </li>
              <li className="rounded-full border border-border bg-card px-3 py-1.5">
                {micros} microscópicas
              </li>
            </ul>
          </header>

          <form
            action={rotaDoCapituloWebPathUtah(resumo.id)}
            className="mb-6 grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-[1fr_auto_auto]"
          >
            <label className="relative block">
              <span className="sr-only">Buscar neste capítulo</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                name="q"
                defaultValue={consulta}
                placeholder="Buscar diagnóstico, órgão ou padrão…"
                className="min-h-[44px] w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-600"
              />
            </label>
            <label>
              <span className="sr-only">Modalidade</span>
              <select
                name="modalidade"
                defaultValue={modalidade}
                className="min-h-[44px] w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold sm:w-auto"
              >
                <option value="todas">Macro e microscopia</option>
                <option value="macroscopia">Macroscopia</option>
                <option value="microscopia">Microscopia</option>
              </select>
            </label>
            <button
              type="submit"
              className="min-h-[44px] rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              Filtrar
            </button>
          </form>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {filtradas.length.toLocaleString('pt-BR')}{' '}
              {filtradas.length === 1 ? 'referência encontrada' : 'referências encontradas'}
            </p>
            {consulta || modalidade !== 'todas' ? (
              <Link
                href={rotaDoCapituloWebPathUtah(resumo.id)}
                className="text-xs font-bold underline"
              >
                Limpar filtros
              </Link>
            ) : null}
          </div>

          {visiveis.length > 0 ? (
            <ol start={(pagina - 1) * POR_PAGINA + 1} className="grid gap-3 lg:grid-cols-2">
              {visiveis.map((entrada) => {
                const leitura = leituraDidaticaWebPathUtah(entrada.tituloOriginal)
                return (
                  <li
                    key={entrada.url}
                    className="flex h-full flex-col rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      <span>{entrada.modalidade === 'macroscopia' ? 'Macroscopia' : 'Microscopia'}</span>
                      <span aria-hidden>·</span>
                      <span>{entrada.secao}</span>
                    </div>
                    <h2 className="mt-2 text-sm font-bold leading-snug">{entrada.titulo}</h2>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground" lang="en">
                      Título na fonte: {entrada.tituloOriginal}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed">{leitura.descricao}</p>
                    <div className="mt-3 rounded-lg bg-muted/45 p-3">
                      <p className="text-[11px] font-bold">Ao abrir, procure:</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">
                        {leitura.observacoes.map((observacao) => (
                          <li key={observacao}>{observacao}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        WebPath — University of Utah
                      </span>
                      <a
                        href={entrada.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Abrir referência visual
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma referência corresponde a estes filtros.
            </p>
          )}

          {paginas > 1 ? (
            <nav aria-label={`Paginação — ${resumo.nome}`} className="mt-6 flex items-center justify-center gap-3">
              {pagina > 1 ? (
                <Link
                  href={urlDaPagina(resumo.id, pagina - 1, consulta, modalidade)}
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-bold"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Anterior
                </Link>
              ) : null}
              <span className="text-xs font-semibold text-muted-foreground">
                Página {pagina} de {paginas}
              </span>
              {pagina < paginas ? (
                <Link
                  href={urlDaPagina(resumo.id, pagina + 1, consulta, modalidade)}
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-bold"
                >
                  Próxima <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
    </AppShell>
  )
}

function urlDaPagina(
  id: string,
  pagina: number,
  consulta: string,
  modalidade: string,
): string {
  const parametros = new URLSearchParams()
  if (consulta) parametros.set('q', consulta)
  if (modalidade !== 'todas') parametros.set('modalidade', modalidade)
  if (pagina > 1) parametros.set('pagina', String(pagina))
  const query = parametros.toString()
  return `${rotaDoCapituloWebPathUtah(id)}${query ? `?${query}` : ''}`
}
