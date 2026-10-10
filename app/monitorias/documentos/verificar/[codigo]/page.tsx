'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, ShieldX } from 'lucide-react'
import { PageScaffold } from '@/components/page-scaffold'
import { Esqueleto, api } from '@/components/monitorias/base'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'

interface Verificacao {
  valido: boolean
  integro?: boolean
  numero?: string
  status?: string
  hash?: string
  emitidoEm?: string
  monitoria?: string
  assinaturas?: Array<{ papel: string; nome: string; em: string; hashConfere: boolean }>
}

/** Página pública de verificação de contrato (QR do PDF). Sem dados pessoais. */
export default function VerificarDocumento({ params }: { params: { codigo: string } }) {
  const [v, setV] = useState<Verificacao | null>(null)
  useEffect(() => {
    api<Verificacao>(`/api/monitorias/publico/documentos/verificar/${params.codigo}`).then(setV).catch(() => setV({ valido: false }))
  }, [params.codigo])
  return (
    <PageScaffold>
      <div className="mx-auto max-w-lg py-8">
        {!v ? (
          <Esqueleto className="h-72 rounded-3xl" />
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-border bg-card p-6 text-center shadow-lg">
            {v.valido ? <BadgeCheck className="mx-auto h-14 w-14 text-primary" /> : <ShieldX className="mx-auto h-14 w-14 text-rose-600" />}
            <h1 className="mt-3 font-heading text-xl font-bold">{v.valido ? 'Documento autêntico' : 'Documento não encontrado ou alterado'}</h1>
            {v.numero && (
              <dl className="mt-5 space-y-2 text-left text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Contrato</dt><dd className="font-semibold">{v.numero}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Monitoria</dt><dd className="text-right font-medium">{v.monitoria}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Situação</dt><dd className="font-medium">{v.status === 'assinado' ? 'Assinado pelas partes' : v.status === 'rescindido' ? 'Sem efeito' : 'Aguardando assinaturas'}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Emitido em</dt><dd>{formatarEmBrasilia(v.emitidoEm)}</dd></div>
                <div><dt className="text-muted-foreground">Hash SHA-256</dt><dd className="break-all font-mono text-[11px]">{v.hash}</dd></div>
                {v.assinaturas?.map((a) => (
                  <div key={a.papel} className="flex justify-between gap-3 border-t border-border pt-2">
                    <dt className="text-muted-foreground">{a.papel === 'contratante' ? 'Aluno' : 'Monitor'}</dt>
                    <dd className="text-right">{a.nome} · {formatarEmBrasilia(a.em)} {a.hashConfere ? '✓' : '⚠'}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-5 text-[11px] text-muted-foreground">Compare o hash acima com o impresso no rodapé do PDF. Se forem iguais, o conteúdo não foi alterado.</p>
          </motion.div>
        )}
      </div>
    </PageScaffold>
  )
}
