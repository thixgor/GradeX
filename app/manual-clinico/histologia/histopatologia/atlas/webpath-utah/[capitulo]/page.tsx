import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { GaleriaWebPathUtah } from '@/components/histopatologia/galeria-webpath-utah'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { FONTES, resolverDireitos } from '@/lib/histopatologia/direitos'
import type { MidiaExibivel } from '@/lib/histopatologia/esquemas'
import {
  rotaDoAtlas,
  rotaDoCapituloWebPathUtah,
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

export const dynamic = 'force-dynamic'

const POR_PAGINA = 24

interface Props {
  params: { capitulo: string }
  searchParams?: { q?: string; modalidade?: string; pagina?: string; ref?: string }
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
  await exigirAcessoAHistologia()

  const resumo = resumoDoCapituloWebPathUtah(params.capitulo)
  const capitulo = await obterCapituloWebPathUtah(params.capitulo)
  if (!resumo || !capitulo) notFound()

  const consulta = (searchParams.q ?? '').trim()
  const chave = chaveDeBusca(consulta)
  const referenciaBruta = (searchParams.ref ?? '').trim()
  const referencia = /^[A-Za-z0-9.-]{1,80}$/.test(referenciaBruta) ? referenciaBruta : ''
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
    if (referencia && !entrada.url.endsWith(`/${referencia}`)) return false
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
  const entradasDaGaleria = visiveis.map((entrada) => {
    const leitura = leituraDidaticaWebPathUtah(entrada.tituloOriginal)
    const referencia = new URL(entrada.url).pathname.split('/').pop() ?? entrada.url
    const estadoDeDireitos = resolverDireitos({
      fonteId: 'webpath-utah',
      midiaId: referencia,
      urlPaginaFonte: entrada.url,
      urlImagem: entrada.urlImagem,
    }).estado
    const modalidadeExibida: MidiaExibivel['modalidade'] = /immunohistochemical/i.test(
      entrada.tituloOriginal,
    )
      ? 'Imuno-histoquímica'
      : entrada.modalidade === 'macroscopia'
        ? 'Macroscopia'
        : 'Histologia'

    const midia: MidiaExibivel = {
      id: `webpath-utah-${referencia}`,
      fonteId: 'webpath-utah',
      modalidade: modalidadeExibida,
      coloracao: coloracaoDaEntrada(entrada.tituloOriginal),
      descricao: leitura.descricao,
      descricaoRevisada: true,
      nomeCatalogado: entrada.titulo,
      urlPaginaFonte: entrada.url,
      urlImagem: entrada.urlImagem,
      estadoDeDireitos,
      alt: `${modalidadeExibida} catalogada como “${entrada.titulo}”, exibida diretamente da WebPath com autorização.`,
      creditoCurto: FONTES['webpath-utah'].creditoCurto,
      aumento: aumentoDaEntrada(entrada.tituloOriginal),
      legendaEditorial: leitura.descricao,
    }

    return {
      midia,
      nomeOriginal: entrada.tituloOriginal,
      secao: entrada.secao,
      pontosDeObservacao: leitura.observacoes,
    }
  })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <Link
            href={rotaDoAtlas()}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Atlas de lâminas
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
            {consulta || referencia || modalidade !== 'todas' ? (
              <Link
                href={rotaDoCapituloWebPathUtah(resumo.id)}
                className="text-xs font-bold underline"
              >
                Limpar filtros
              </Link>
            ) : null}
          </div>

          {visiveis.length > 0 ? (
            <GaleriaWebPathUtah entradas={entradasDaGaleria} />
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

function coloracaoDaEntrada(titulo: string): string {
  const coloracoes: Array<[RegExp, string]> = [
    [/trichrome/i, 'Tricrômico'],
    [/reticulin/i, 'Reticulina'],
    [/congo red/i, 'Vermelho Congo'],
    [/methylene blue/i, 'Azul de metileno'],
    [/acid[- ]fast/i, 'Ácido-resistente'],
    [/silver|GMS/i, 'Prata'],
    [/\bPAS\b/i, 'PAS'],
    [/gram/i, 'Gram'],
    [/iron|prussian blue/i, 'Azul da Prússia'],
    [/mucicarmine/i, 'Mucicarmim'],
  ]
  return coloracoes.find(([padrao]) => padrao.test(titulo))?.[1] ?? 'Não informado'
}

function aumentoDaEntrada(titulo: string): MidiaExibivel['aumento'] {
  if (/\bgross\b/i.test(titulo)) return 'macroscopia'
  if (/low power/i.test(titulo)) return 'pequeno'
  if (/medium power/i.test(titulo)) return 'medio'
  if (/high power/i.test(titulo)) return 'grande'
  return undefined
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
