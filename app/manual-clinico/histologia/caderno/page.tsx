import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Caderno } from '@/components/histologia/caderno'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'

export const metadata = metadadosDoModulo({
  titulo: 'Caderno e meus dados',
  descricao:
    'Suas lâminas concluídas, favoritas, notas privadas e estruturas a revisar — guardadas ' +
    'apenas neste dispositivo, com exportação e apagamento em um clique.',
  caminho: `${BASE}/caderno`,
})

export const dynamic = 'force-dynamic'

export default async function PaginaDoCaderno() {
  await exigirAcessoAHistologia()

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-3xl px-4 py-6">
          <Link
            href={BASE}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Manual da Histologia
          </Link>

          <header className="mb-6">
            <p className="editorial-mark mb-2">Seu progresso</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Caderno e meus dados
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              O progresso deste módulo não vive num servidor: fica no armazenamento local deste
              navegador, mesmo estando sua conta conectada. Você pode levar tudo embora num arquivo
              ou apagar de vez, aqui mesmo.
            </p>
          </header>

          <Caderno />
        </div>
      </div>
    </AppShell>
  )
}
