import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock, FlaskConical } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { MODULOS_DE_LABORATORIO } from '@/lib/histologia/laboratorio'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'

export const revalidate = 86400

export const metadata = metadadosDoModulo({
  titulo: 'Laboratório virtual',
  descricao:
    'Da coleta à lâmina: fixação, desidratação, diafanização, inclusão, microtomia, banho-maria, ' +
    'coloração e montagem — e o diagnóstico dos artefatos que cada etapa produz quando falha.',
  caminho: `${BASE}/laboratorio`,
})

export default function PaginaDoLaboratorio() {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <Link
            href={BASE}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Manual da Histologia
          </Link>

          <header className="mb-6">
            <p className="editorial-mark mb-2">Laboratório virtual</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Por que a lâmina tem essa cara
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Boa parte do que parece patologia é processamento. Estes módulos percorrem o caminho
              da peça até a lâmina, explicam o que cada etapa faz com o tecido e treinam a distinguir
              artefato de alteração verdadeira — que é a diferença entre um laudo certo e um errado.
            </p>
          </header>

          <ul className="space-y-3">
            {MODULOS_DE_LABORATORIO.map((modulo) => (
              <li key={modulo.id}>
                <Link
                  href={`${BASE}/laboratorio/${modulo.id}`}
                  className="group block rounded-xl border border-border bg-card p-4 transition-colors hover:border-rose-500/45"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2">
                      <FlaskConical className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-base font-bold leading-snug">{modulo.titulo}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden />
                          {modulo.minutos} min
                        </span>
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {modulo.resumo}
                      </p>
                      <ul className="mt-2 space-y-0.5">
                        {modulo.objetivos.map((objetivo) => (
                          <li
                            key={objetivo}
                            className="flex items-start gap-1.5 text-xs text-muted-foreground"
                          >
                            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-500/60" />
                            {objetivo}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <ArrowRight
                      className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            O conteúdo destes módulos foi escrito para o Manual da Histologia, com as fontes citadas
            em cada página. Como todo o restante do módulo, permanece pendente de revisão biomédica
            — escrever com fonte não é o mesmo que ter sido revisado.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
