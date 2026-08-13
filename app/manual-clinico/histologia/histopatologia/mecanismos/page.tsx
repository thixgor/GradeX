import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { MapaDeMecanismos } from '@/components/histopatologia/mapa-mecanismos'
import {
  DOENCAS_RESUMIDAS,
  MECANISMOS_PUBLICADOS,
  TOTAIS,
} from '@/lib/histopatologia/repositorio'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { BASE, rotaDosMecanismos } from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'

export const dynamic = 'force-dynamic'

export const metadata = metadadosDoModulo({
  titulo: 'Mecanismos patológicos gerais',
  descricao:
    'Lesão celular, inflamação, distúrbios hemodinâmicos, imunopatologia, infecção, reparo, ' +
    'alterações genéticas e neoplasia — os processos reutilizáveis que explicam a morfologia em ' +
    'qualquer órgão.',
  caminho: rotaDosMecanismos(),
})

/**
 * Mapa de mecanismos.
 *
 * O segundo eixo de navegação do módulo, e o mais importante para transferência
 * de raciocínio: quem entende inflamação granulomatosa no pulmão reconhece a
 * mesma coisa no fígado, no linfonodo e na pele. O eixo por sistema ensina um
 * órgão; este ensina um processo.
 */
export default async function PaginaDeMecanismos() {
  await exigirAcessoAHistologia()

  const contagem: Record<string, number> = {}
  for (const doenca of DOENCAS_RESUMIDAS) {
    for (const id of doenca.mecanismoIds) contagem[id] = (contagem[id] ?? 0) + 1
  }

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
            <p className="editorial-mark mb-2">Mecanismos gerais</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              O vocabulário que atravessa os órgãos
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {TOTAIS.mecanismos} mecanismos, agrupados em oito famílias. Nenhum deles menciona
              órgão ou doença: é isso que os torna reutilizáveis. A aplicação concreta — qual
              célula, qual sequência temporal, qual consequência funcional — vive na página de cada
              doença.
            </p>
          </header>

          <MapaDeMecanismos
            mecanismos={MECANISMOS_PUBLICADOS}
            contagemPorMecanismo={contagem}
          />
        </div>
      </div>
    </AppShell>
  )
}
