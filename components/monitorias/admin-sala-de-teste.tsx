'use client'

/**
 * Admin → Monitorias → Sala de vídeo → "Sala de teste": cria uma sala de
 * verdade (WebRTC, TURN, controles, anotações) em que o admin é o monitor,
 * com um link para mandar a um amigo. Sem anúncio, contrato nem pagamento;
 * vale por 90 min e some sozinha em 7 dias.
 */

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, FlaskConical, Loader2, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, CaixaErro } from '@/components/monitorias/base'
import { horaEmBrasilia } from '@/lib/fuso-brasilia'

interface SalaDeTeste {
  id: string
  codigo: string
  inicio: string
  fim: string
  alunos: string[]
}

export function AdminSalaDeTeste() {
  const [salas, setSalas] = useState<SalaDeTeste[]>([])
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState<string | null>(null)

  const carregar = useCallback(() => {
    api<{ salas: SalaDeTeste[] }>('/api/admin/monitorias/teste')
      .then((r) => setSalas(r.salas))
      .catch(() => {})
  }, [])
  useEffect(() => carregar(), [carregar])

  async function criar() {
    setCriando(true)
    setErro('')
    try {
      await api('/api/admin/monitorias/teste', { method: 'POST', json: {} })
      carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para criar.')
    } finally {
      setCriando(false)
    }
  }

  function copiar(s: SalaDeTeste) {
    const link = `${window.location.origin}/monitorias/teste/${s.codigo}`
    navigator.clipboard?.writeText(link).then(
      () => {
        setCopiado(s.id)
        setTimeout(() => setCopiado(null), 2000)
      },
      () => window.prompt('Copie o link do convite:', link),
    )
  }

  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.07] to-card p-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <FlaskConical className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Sala de teste</p>
          <p className="mt-0.5 max-w-[62ch] text-xs leading-relaxed text-muted-foreground">
            Testar com um amigo: a sala é a mesma das aulas (vídeo, TURN, chat, tela, controles, anotações). Você entra como monitor e quem tiver o link entra como aluno. Sem
            anúncio, contrato nem pagamento; vale 90 min.
          </p>
        </div>
        <Button size="sm" onClick={() => void criar()} disabled={criando}>
          {criando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-1 h-4 w-4" />} Criar sala de teste
        </Button>
      </div>
      {erro && <CaixaErro mensagem={erro} className="mt-3" />}
      <AnimatePresence initial={false}>
        {salas.length > 0 && (
          <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2">
            {salas.map((s) => (
              <motion.li key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Até {horaEmBrasilia(s.fim)}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.alunos.length ? `Convidados: ${s.alunos.join(', ')}` : 'Ninguém entrou ainda'}</span>
                </span>
                <Button size="sm" variant="outline" onClick={() => copiar(s)}>
                  {copiado === s.id ? <Check className="mr-1 h-4 w-4 text-primary" /> : <Copy className="mr-1 h-4 w-4" />} {copiado === s.id ? 'Copiado!' : 'Copiar convite'}
                </Button>
                {/* Navegação completa: a sala carrega com a permissão de microfone. */}
                <a href={`/monitorias/reservas/${s.id}/sala`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <Video className="h-4 w-4" /> Entrar como monitor
                </a>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  )
}
