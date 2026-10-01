import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { ComparacaoComNormal } from '@/components/histopatologia-zoom/comparacao'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { metadadosDoModulo } from '@/lib/histologia/seo'
import { estruturasDaLamina } from '@/lib/histologia-zoom/estruturas'
import { FONTES_DO_ACERVO, MARCA_DO_ACERVO, linhaDeCredito } from '@/lib/histologia-zoom/fonte'
import { laminaPorSlug } from '@/lib/histologia-zoom/repositorio'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { doencaPorId } from '@/lib/histopatologia-zoom/doencas'
import { RODAPE_LEEDS } from '@/lib/histopatologia-zoom/fonte'
import {
  laminaNormalPara,
  laminaPatologicaPorSlug,
  laminasNormaisDoOrgao,
  marcacoesDaLamina,
} from '@/lib/histopatologia-zoom/repositorio'
import {
  BASE_PATOZOOM,
  rotaDaComparacao,
  rotaDaDoencaZoom,
  rotaDaLaminaPatologica,
} from '@/lib/histopatologia-zoom/rotas'

export const dynamic = 'force-dynamic'

type Parametros = { params: { doenca: string; lamina: string }; searchParams: { normal?: string } }

export async function generateMetadata({ params }: Parametros) {
  const l = laminaPatologicaPorSlug(params.lamina)
  if (!l) return {}
  return metadadosDoModulo({
    titulo: `${l.titulo} × normal — comparação lado a lado`,
    descricao: `Lâmina de ${l.titulo.toLowerCase()} ao lado do órgão normal, na mesma ampliação.`,
    caminho: rotaDaComparacao(l.doenca, l.slug),
  })
}

export default async function PaginaDaComparacao({ params, searchParams }: Parametros) {
  await exigirAcessoAHistologia()
  const lamina = laminaPatologicaPorSlug(params.lamina)
  if (!lamina || lamina.doenca !== params.doenca) notFound()
  const doenca = doencaPorId(lamina.doenca)!
  const opcoes = laminasNormaisDoOrgao(doenca.orgao)
  const pedida = searchParams.normal ? laminaPorSlug(searchParams.normal) : undefined
  const normal = pedida && pedida.orgao === doenca.orgao ? pedida : laminaNormalPara(lamina, doenca)
  if (!normal) notFound()

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />
        <div className="container mx-auto max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6">
          <nav aria-label="Trilha" className="mb-2 overflow-x-auto">
            <ol className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
              <li>
                <Link href={BASE_PATOZOOM} className="rounded px-1 py-1 hover:text-foreground">
                  Histopatologia · Lâminas com zoom
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <Link href={rotaDaDoencaZoom(doenca.id)} className="rounded px-1 py-1 hover:text-foreground">
                  {doenca.nome}
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <Link href={rotaDaLaminaPatologica(doenca.id, lamina.slug)} className="rounded px-1 py-1 font-medium text-foreground">
                  {lamina.subtitulo ?? 'Lâmina'}
                </Link>
              </li>
            </ol>
          </nav>
          <header className="mb-4">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {doenca.nome} <span className="font-normal text-muted-foreground">× {normal.titulo.toLowerCase()} normal</span>
            </h1>
            <ul className="mt-2 max-w-4xl space-y-1 text-sm leading-relaxed text-muted-foreground">
              {doenca.comparacaoComNormal.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
            {opcoes.length > 1 && (
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Lâmina normal:</span>
                {opcoes.map((o) => (
                  <Link
                    key={o.slug}
                    href={rotaDaComparacao(doenca.id, lamina.slug, o.slug)}
                    aria-current={o.slug === normal.slug ? 'true' : undefined}
                    className={`inline-flex min-h-[32px] items-center rounded-full border px-2.5 font-semibold ${
                      o.slug === normal.slug
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-border text-muted-foreground hover:border-teal-500/50 hover:text-foreground'
                    }`}
                  >
                    {o.coloracao}
                    {o.subtitulo ? ` · ${o.subtitulo}` : ''}
                    {o.origem.categoria !== 'humana' ? ` · ${o.especie}` : ''}
                  </Link>
                ))}
              </p>
            )}
          </header>

          <ComparacaoComNormal
            esquerda={{
              rotulo: 'Doença',
              titulo: lamina.titulo,
              subtitulo: lamina.subtitulo,
              piramide: lamina.piramide,
              ampliacaoMaxima: lamina.objetiva,
              marcacoes: marcacoesDaLamina(lamina.slug),
              tom: 'patologico',
            }}
            direita={{
              rotulo: normal.origem.categoria === 'humana' ? 'Normal' : `Normal · ${normal.especie}`,
              titulo: normal.titulo,
              subtitulo: normal.subtitulo ? `${normal.subtitulo} (${normal.coloracao})` : normal.coloracao,
              piramide: normal.piramide,
              ampliacaoMaxima: normal.ampliacaoMaxima,
              marcacoes: estruturasDaLamina(normal.slug).map((e) => ({ ...e, categoria: undefined })),
              tom: 'normal',
            }}
          />

          <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
            Lâmina da doença: {RODAPE_LEEDS} Lâmina normal:{' '}
            {normal.credito
              ? `${MARCA_DO_ACERVO} · ${linhaDeCredito(normal.credito)}.`
              : normal.fonte === 'gtex'
                ? FONTES_DO_ACERVO.gtex.creditoLongo
                : `${MARCA_DO_ACERVO}.`}
          </p>
        </div>
      </div>
    </AppShell>
  )
}
