import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { CartaoDeDoenca } from '@/components/histopatologia/cartao-doenca'
import {
  SISTEMAS_COM_CONTAGEM,
  doencasDoSistema,
  obterInventario,
  obterSistemaComContagem,
} from '@/lib/histopatologia/repositorio'
import {
  BASE,
  rotaDaEntradaCatalogada,
  rotaDoAtlas,
  rotaDoSistema,
  rotaNormal,
} from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'

/**
 * Página de sistema: capítulos escritos primeiro, inventário depois.
 *
 * A ordem é intencional e é a mesma promessa da home: o que passou por trabalho
 * editorial vem antes do que é acervo bruto. Um sistema sem capítulo nenhum
 * mostra o inventário e diz isso com todas as letras, em vez de exibir uma lista
 * de títulos com aparência de sumário científico.
 *
 * O inventário é truncado na exibição — 60 entradas, das quais o sistema
 * "não classificado" tem 1.643. A lista completa é alcançável pela busca, que
 * consulta o índice de servidor sem baixá-lo.
 */

export const revalidate = 86400

const ENTRADAS_VISIVEIS = 60

interface Props {
  params: { sistema: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sistema = obterSistemaComContagem(params.sistema)
  if (!sistema) return { title: 'Sistema não encontrado — Histopatologia' }

  return metadadosDoModulo({
    titulo: sistema.nome,
    descricao: sistema.descricao,
    caminho: rotaDoSistema(sistema.id),
    estadoDeRevisao: sistema.doencas > 0 ? 'revisao-medica' : 'rascunho',
  })
}

/**
 * Os 14 sistemas são poucos, estáveis e sempre visitados — o único conjunto do
 * módulo em que pré-renderizar compensa de fato.
 */
export function generateStaticParams() {
  return SISTEMAS_COM_CONTAGEM.map((s) => ({ sistema: s.id }))
}

export default async function PaginaDoSistema({ params }: Props) {
  const sistema = obterSistemaComContagem(params.sistema)
  if (!sistema) notFound()

  const doencas = doencasDoSistema(sistema.id)
  const inventario = await obterInventario(sistema.id)
  const visiveis = inventario.slice(0, ENTRADAS_VISIVEIS)

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <Link
            href={BASE}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Histopatologia
          </Link>

          <header className="mb-6">
            <p className="editorial-mark mb-2">Sistema</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {sistema.nome}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {sistema.descricao}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <li className="rounded-full border border-border bg-card px-2.5 py-1 font-semibold">
                {sistema.entradas.toLocaleString('pt-BR')} entradas catalogadas
              </li>
              <li className="rounded-full border border-border bg-card px-2.5 py-1 font-semibold">
                {sistema.midias.toLocaleString('pt-BR')} referências de mídia
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

          <section aria-labelledby="capitulos-sistema" className="mb-10">
            <h2 id="capitulos-sistema" className="mb-3 font-heading text-lg font-semibold">
              Capítulos
            </h2>
            {doencas.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                Nenhum capítulo escrito para este sistema ainda. O acervo tem{' '}
                {sistema.midias.toLocaleString('pt-BR')} referências aqui — o que falta é curadoria
                e revisão médica, não material. Enquanto isso, o inventário abaixo continua
                pesquisável, com crédito e link para a origem.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {doencas.map((doenca) => (
                  <li key={doenca.slug}>
                    <CartaoDeDoenca doenca={doenca} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="inventario-sistema">
            <h2 id="inventario-sistema" className="mb-2 font-heading text-lg font-semibold">
              Inventário catalogado
            </h2>
            <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Títulos exatamente como aparecem nos atlas de origem, ordenados por volume de
              referências. Um título aqui pode ser uma doença, uma variante, uma técnica ou um caso
              — a coleta não distinguiu, e a edição não presume.
              {inventario.length > ENTRADAS_VISIVEIS && (
                <>
                  {' '}
                  Mostrando as {ENTRADAS_VISIVEIS} maiores de{' '}
                  {inventario.length.toLocaleString('pt-BR')}; use a{' '}
                  <Link href={rotaDoAtlas()} className="font-bold underline">
                    busca do atlas
                  </Link>{' '}
                  para alcançar as demais.
                </>
              )}
            </p>

            {visiveis.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Nenhuma entrada catalogada neste sistema.
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {visiveis.map((entrada) => (
                  <li key={entrada.id}>
                    <Link
                      href={rotaDaEntradaCatalogada(entrada.id)}
                      className="flex min-h-[44px] flex-col gap-0.5 p-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="text-sm font-semibold">{entrada.nome}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {entrada.fonteId === 'unicamp' ? 'FCM/Unicamp' : 'Histopathology Atlas'} ·{' '}
                        {entrada.midias.toLocaleString('pt-BR')} referências
                        {entrada.modalidades.length > 0 && <> · {entrada.modalidades.join(', ')}</>}
                        {entrada.doencaSlug && (
                          <span className="font-bold text-teal-700 dark:text-teal-400">
                            {' '}
                            · consolidada em capítulo
                          </span>
                        )}
                        {!entrada.tituloConfiavel && (
                          <span className="text-amber-700 dark:text-amber-400">
                            {' '}
                            · título extraído do corpo da página
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}
