'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from 'lucide-react'

import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { GaleriaWebPathUtah } from '@/components/histopatologia/galeria-webpath-utah'
import { rotaDosDadosDaHistopatologia, type DadosDoCapituloWebPath } from '@/lib/histopatologia/paginas-tipos'
import { rotaDoAtlas, rotaDoCapituloWebPathUtah } from '@/lib/histopatologia/rotas'

/**
 * Um capítulo do WebPath/Utah no atlas: busca, filtro de modalidade e
 * paginação. Os filtros continuam sendo aplicados no servidor — a URL é lida
 * aqui e repassada à rota de dados, depois do portão; o formulário continua
 * sendo um `GET` comum para o mesmo endereço.
 */
export function CapituloWebPath({ capitulo }: { capitulo: string }) {
  const busca = useSearchParams()
  const url = rotaDosDadosDaHistopatologia(['atlas', 'webpath-utah', capitulo], {
    q: busca?.get('q'),
    modalidade: busca?.get('modalidade'),
    pagina: busca?.get('pagina'),
    ref: busca?.get('ref'),
  })
  return (
    <PortaoDaHistologia<DadosDoCapituloWebPath> url={url}>
      {(dados) => <Conteudo dados={dados} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados }: { dados: DadosDoCapituloWebPath }) {
  const { resumo, consulta, modalidade, referencia, pagina, paginas } = dados
  useTituloDaAba(`${resumo.nome} — WebPath/Utah`, ' — Histopatologia | Manual da Histologia')

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada />
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Link
          href={rotaDoAtlas()}
          className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Atlas de lâminas
        </Link>

        <header className="mb-6 max-w-4xl">
          <p className="editorial-mark mb-2">{resumo.grupo === 'geral' ? 'Patologia geral' : 'Patologia sistêmica'}</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{resumo.nome}</h1>
          <p className="mt-1 text-sm text-muted-foreground" lang="en">
            {resumo.nomeOriginal}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {resumo.descricao} {resumo.roteiro}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-muted-foreground">
            <li className="rounded-full border border-border bg-card px-3 py-1.5">{resumo.total} referências</li>
            <li className="rounded-full border border-border bg-card px-3 py-1.5">{dados.macros} macroscópicas</li>
            <li className="rounded-full border border-border bg-card px-3 py-1.5">{dados.micros} microscópicas</li>
          </ul>
        </header>

        <form
          // `key`: um novo filtro chega por navegação, e os campos não controlados
          // precisam nascer de novo com o valor da URL.
          key={`${consulta}|${modalidade}`}
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
          <button type="submit" className="min-h-[44px] rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">
            Filtrar
          </button>
        </form>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {dados.encontradas.toLocaleString('pt-BR')}{' '}
            {dados.encontradas === 1 ? 'referência encontrada' : 'referências encontradas'}
          </p>
          {consulta || referencia || modalidade !== 'todas' ? (
            <Link href={rotaDoCapituloWebPathUtah(resumo.id)} className="text-xs font-bold underline">
              Limpar filtros
            </Link>
          ) : null}
        </div>

        {dados.entradas.length > 0 ? (
          <GaleriaWebPathUtah entradas={dados.entradas} />
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
  )
}

function urlDaPagina(id: string, pagina: number, consulta: string, modalidade: string): string {
  const parametros = new URLSearchParams()
  if (consulta) parametros.set('q', consulta)
  if (modalidade !== 'todas') parametros.set('modalidade', modalidade)
  if (pagina > 1) parametros.set('pagina', String(pagina))
  const query = parametros.toString()
  return `${rotaDoCapituloWebPathUtah(id)}${query ? `?${query}` : ''}`
}
