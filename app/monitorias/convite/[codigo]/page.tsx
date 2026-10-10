'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Users } from 'lucide-react'
import { PageScaffold } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { Avatar, CaixaErro, Esqueleto, HoraBrasilia, api } from '@/components/monitorias/base'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'

interface Previa {
  reservaId: string
  anuncioTitulo: string
  monitor: { nome: string; fotoUrl: string | null } | null
  inicio: string
  duracaoMin: number
  valorPorPessoaCentavos: number
  vagas: number
  ocupados: number
  aberto: boolean
  prazoPagamento: string | null
}

export default function Convite({ params }: { params: { codigo: string } }) {
  const router = useRouter()
  const [previa, setPrevia] = useState<Previa | null>(null)
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  useEffect(() => {
    api<Previa>(`/api/monitorias/convite?codigo=${encodeURIComponent(params.codigo)}`).then(setPrevia).catch((e) => setErro(e.message))
  }, [params.codigo])

  async function entrar() {
    setEntrando(true)
    setErro('')
    try {
      const r = await api<{ reservaId: string }>('/api/monitorias/convite', { method: 'POST', json: { codigo: params.codigo } })
      router.push(`/monitorias/checkout/${r.reservaId}`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro.')
      setEntrando(false)
    }
  }

  return (
    <PageScaffold>
      <div className="mx-auto max-w-md py-6">
        {!previa && !erro && <Esqueleto className="h-80 rounded-3xl" />}
        {erro && !previa && <CaixaErro mensagem={erro} />}
        {previa && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
            <div className="bg-primary p-6 text-center text-primary-foreground">
              <Users className="mx-auto h-8 w-8" />
              <p className="mt-2 text-sm text-white/80">Você foi convidado para uma monitoria em grupo</p>
              <h1 className="mt-1 font-heading text-xl font-bold">{previa.anuncioTitulo}</h1>
            </div>
            <div className="space-y-4 p-6">
              {previa.monitor && (
                <div className="flex items-center gap-3"><Avatar nome={previa.monitor.nome} url={previa.monitor.fotoUrl} tamanho={44} /><span className="text-sm">com <strong>{previa.monitor.nome}</strong></span></div>
              )}
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Quando</dt><dd className="font-semibold">{formatarEmBrasilia(previa.inicio, { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</dd><HoraBrasilia /></div>
                <div><dt className="text-xs text-muted-foreground">Duração</dt><dd className="font-semibold">{formatarDuracao(previa.duracaoMin)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Sua parte</dt><dd className="font-heading text-lg font-bold">{formatarCentavos(previa.valorPorPessoaCentavos)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Vagas</dt><dd className="font-semibold">{previa.ocupados}/{previa.vagas}</dd></div>
              </dl>
              {erro && <CaixaErro mensagem={erro} />}
              {previa.aberto ? (
                <Button className="h-12 w-full rounded-xl text-base font-semibold" onClick={entrar} disabled={entrando}>
                  {entrando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar no grupo'}
                </Button>
              ) : (
                <CaixaErro mensagem="Este grupo não está mais aceitando alunos." />
              )}
              <p className="text-center text-[11px] text-muted-foreground">Você vai assinar o seu próprio contrato e pagar a sua parte por PIX. Se o grupo não fechar no prazo, todo mundo é reembolsado.</p>
            </div>
          </motion.div>
        )}
      </div>
    </PageScaffold>
  )
}
