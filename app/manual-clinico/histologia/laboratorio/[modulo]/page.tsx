import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import {
  DiagnosticoDeArtefatos,
  LinhaDoProcessamento,
  OrdemImpossivel,
} from '@/components/histologia/laboratorio'
import { EstadoEditorial } from '@/components/histologia/marca'
import { COLORACOES } from '@/lib/histologia/glossario'
import { MODULOS_DE_LABORATORIO, obterModulo } from '@/lib/histologia/laboratorio'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'

export function generateStaticParams() {
  return MODULOS_DE_LABORATORIO.map((m) => ({ modulo: m.id }))
}

export const revalidate = 86400

interface Props {
  params: { modulo: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const modulo = obterModulo(params.modulo)
  if (!modulo) return { title: 'Módulo não encontrado — Manual da Histologia' }
  return metadadosDoModulo({
    titulo: modulo.titulo,
    descricao: modulo.resumo,
    caminho: `${BASE}/laboratorio/${modulo.id}`,
  })
}

export default function PaginaDoModulo({ params }: Props) {
  const modulo = obterModulo(params.modulo)
  if (!modulo) notFound()

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-3xl px-4 py-6">
          <Link
            href={`${BASE}/laboratorio`}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Laboratório virtual
          </Link>

          <header className="mb-5">
            <p className="editorial-mark mb-2">Laboratório virtual</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{modulo.titulo}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{modulo.resumo}</p>

            <div className="mt-3">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Ao terminar, você será capaz de
              </h2>
              <ul className="mt-1 space-y-0.5">
                {modulo.objetivos.map((objetivo) => (
                  <li key={objetivo} className="flex items-start gap-1.5 text-xs">
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-600" />
                    {objetivo}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              cerca de {modulo.minutos} minutos
            </p>
          </header>

          <section className="mb-6">{conteudoDoModulo(modulo.id)}</section>

          <div className="mb-5">
            <EstadoEditorial revisao={{ estado: 'pendente-de-revisao', historico: [] }} />
          </div>

          <section aria-labelledby="referencias" className="border-t border-border pt-4">
            <h2 id="referencias" className="mb-2 text-sm font-bold">
              Referências
            </h2>
            <ul className="space-y-1.5">
              {modulo.referencias.map((referencia) => (
                <li key={referencia.citacao} className="text-xs leading-relaxed text-muted-foreground">
                  {referencia.url ? (
                    <a
                      href={referencia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      {referencia.citacao}
                    </a>
                  ) : (
                    referencia.citacao
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  )
}

function conteudoDoModulo(id: string) {
  switch (id) {
    case 'da-coleta-a-lamina':
      return <LinhaDoProcessamento moduloId={id} />
    case 'ordem-impossivel':
      return <OrdemImpossivel moduloId={id} />
    case 'diagnostico-de-artefatos':
      return <DiagnosticoDeArtefatos moduloId={id} />
    case 'bancada-de-coloracoes':
      return <BancadaDeColoracoes />
    default:
      return null
  }
}

/**
 * Bancada de colorações.
 *
 * É conteúdo de leitura, não simulação, e por isso fica no servidor. A tentação
 * seria desenhar um "corte" e tingi-lo ao clique de cada corante — mas uma cor
 * escolhida por nós não é uma reação histoquímica, e ver a "H&E" pintar um
 * retângulo de rosa ensinaria que o resultado depende do corante e não do
 * tecido. Quem quiser ver o resultado real abre uma lâmina de verdade no atlas,
 * que é onde a coloração aparece filtrada como critério de busca.
 */
function BancadaDeColoracoes() {
  return (
    <div className="space-y-3">
      {COLORACOES.map((coloracao) => (
        <article key={coloracao.id} className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-heading text-base font-semibold">{coloracao.nome}</h3>
          <dl className="mt-2 space-y-2 text-xs leading-relaxed">
            <div>
              <dt className="font-bold">Para que serve</dt>
              <dd className="mt-0.5 text-muted-foreground">{coloracao.finalidade}</dd>
            </div>
            <div>
              <dt className="font-bold">Afinidade química — por que funciona</dt>
              <dd className="mt-0.5 text-muted-foreground">{coloracao.afinidade}</dd>
            </div>
            <div>
              <dt className="font-bold text-rose-800 dark:text-rose-300">Resultado esperado</dt>
              <dd className="mt-0.5 text-muted-foreground">{coloracao.resultado}</dd>
            </div>
          </dl>
        </article>
      ))}

      <p className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
        Esta bancada descreve as técnicas; ela não simula a reação. Tingir um desenho de rosa não é
        histoquímica, e ver uma cor escolhida por nós ensinaria que o resultado depende do corante e
        não do tecido. Para ver o resultado real, abra no atlas uma lâmina corada pela técnica.
      </p>
    </div>
  )
}
