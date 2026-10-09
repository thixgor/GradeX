'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageScaffold, PageHeader } from '@/components/page-scaffold'
import { TermosAceite } from '@/components/monitorias/termos-aceite'
import { cn } from '@/lib/utils'

export default function PaginaTermos() {
  return (
    <Suspense>
      <TermosMonitoria />
    </Suspense>
  )
}

function TermosMonitoria() {
  const busca = useSearchParams()
  const [papel, setPapel] = useState<'aluno' | 'monitor'>(busca.get('papel') === 'monitor' ? 'monitor' : 'aluno')
  return (
    <PageScaffold>
      <div className="mx-auto max-w-3xl">
        <PageHeader eyebrow="Monitorias" title="Termos de Serviço" description="Leia com atenção: eles definem responsabilidades, pagamentos, garantia e reembolsos." />
        <div className="mb-4 inline-flex rounded-xl border border-border bg-card p-1">
          {(['aluno', 'monitor'] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPapel(p)} className={cn('rounded-lg px-4 py-1.5 text-sm font-semibold', papel === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
              {p === 'aluno' ? 'Para alunos' : 'Para monitores'}
            </button>
          ))}
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <TermosAceite key={papel} papel={papel} />
        </div>
      </div>
    </PageScaffold>
  )
}
