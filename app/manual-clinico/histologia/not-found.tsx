import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BASE } from '@/lib/histologia/rotas'

/**
 * Página não encontrada dentro do Manual da Histologia.
 *
 * Serve a dois casos que, de fora, precisam ser indistinguíveis:
 *
 * 1. rota que realmente não existe (slug digitado errado, link antigo);
 * 2. módulo bloqueado pelo portão de licença, quando `layout.tsx` chama
 *    `notFound()`.
 *
 * Por isso o texto **não** menciona licença, bloqueio nem conteúdo indisponível.
 * Anunciar "existe algo aqui, mas você não pode ver" convida ao contorno e não
 * ajuda ninguém — quem opera o sistema encontra o motivo real no log do
 * servidor. Ver `docs/adr/0001-licenca-manual-histologia.md`.
 */
export default function NaoEncontrado() {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page flex min-h-screen items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <p className="editorial-mark justify-center">Erro 404</p>
          <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
            Não encontramos esta página
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            O endereço pode ter mudado ou nunca ter existido. A busca do atlas encontra por nome
            anatômico, estrutura, tecido, órgão ou coloração — e funciona sem acento.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href={`${BASE}/atlas`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-bold text-white transition-colors hover:bg-teal-800"
            >
              <Search className="h-4 w-4" aria-hidden />
              Buscar no atlas
            </Link>
            <Link
              href="/manual-clinico"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-bold transition-colors hover:border-teal-600/50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Manual Clínico
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
