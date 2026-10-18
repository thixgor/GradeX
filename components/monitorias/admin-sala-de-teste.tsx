'use client'

/**
 * Admin → Monitorias → Sala de vídeo → "Sala de teste": cria uma sala de
 * verdade (WebRTC, TURN, controles, anotações) em que o admin é o monitor,
 * com um link para mandar a um amigo. Sem anúncio, contrato nem pagamento;
 * vale por 90 min e some sozinha em 7 dias. Com o Resumo por IA, o admin testa
 * sozinho: fala alguns minutos, sai e clica em "Gerar resumo agora".
 */

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, Check, Copy, FlaskConical, Loader2, Sparkles, Trash2, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, CaixaErro } from '@/components/monitorias/base'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { horaEmBrasilia } from '@/lib/fuso-brasilia'
import type { ResumoDosTrechos } from '@/lib/monitorias/resumo/tipos'
import { LinhaDosTrechos } from '@/components/monitorias/resumo/linha-trechos'

interface SalaDeTeste {
  id: string
  codigo: string
  inicio: string
  fim: string
  aberta: boolean
  alunos: string[]
  /** Estado do Resumo por IA de teste (null = sala sem resumo). */
  resumoIA: string | null
  /** Por que não saiu (cancelado/falhou). */
  resumoMotivo: string | null
  /** Diagnóstico dos trechos de voz (null = nenhum chegou). */
  trechos: ResumoDosTrechos | null
}

/** Estados em que o resumo de teste ainda pode ser gerado agora. */
const PODE_GERAR = ['aguardando', 'transcrevendo']
/** Estados em que vale atualizar a lista sozinha até sair o resultado. */
const PROCESSANDO = ['transcrevendo', 'resumindo']

const ESTADO_DO_RESUMO: Record<string, string> = {
  aguardando: 'aguardando a aula',
  transcrevendo: 'transcrevendo',
  resumindo: 'gerando o resumo',
  pronto: 'pronto',
  falhou: 'falhou',
  cancelado: 'cancelado',
}

export function AdminSalaDeTeste() {
  const [salas, setSalas] = useState<SalaDeTeste[]>([])
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [comResumo, setComResumo] = useState(false)
  const [gerando, setGerando] = useState<string | null>(null)

  const carregar = useCallback(() => {
    api<{ salas: SalaDeTeste[] }>('/api/admin/monitorias/teste')
      .then((r) => setSalas(r.salas))
      .catch(() => {})
  }, [])
  useEffect(() => carregar(), [carregar])
  // Só enquanto algum resumo de teste está andando (e com a aba visível).
  useIntervaloVisivel(carregar, salas.some((s) => s.resumoIA && PROCESSANDO.includes(s.resumoIA)) ? 15_000 : null)

  async function gerarResumo(s: SalaDeTeste) {
    if (!window.confirm('Encerrar a sala de teste e gerar o resumo com o que foi gravado? Saia da aula pelo botão Sair antes, para o último trecho entrar.')) return
    setGerando(s.id)
    setErro('')
    try {
      await api('/api/admin/monitorias/teste', { method: 'PATCH', json: { id: s.id, acao: 'gerar_resumo' } })
      setSalas((atual) => atual.map((x) => (x.id === s.id ? { ...x, resumoIA: 'resumindo' } : x)))
      carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para gerar o resumo.')
    } finally {
      setGerando(null)
    }
  }

  async function criar() {
    setCriando(true)
    setErro('')
    try {
      await api('/api/admin/monitorias/teste', { method: 'POST', json: comResumo ? { resumoIA: true } : {} })
      carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para criar.')
    } finally {
      setCriando(false)
    }
  }

  async function excluir(s: SalaDeTeste) {
    const aviso = s.aberta && s.alunos.length ? ' Quem estiver dentro sai da sala agora.' : ''
    if (!window.confirm(`Excluir esta sala de teste? O convite para de funcionar e o chat dela é apagado.${aviso}`)) return
    setExcluindo(s.id)
    setErro('')
    try {
      await api('/api/admin/monitorias/teste', { method: 'DELETE', json: { id: s.id } })
      setSalas((atual) => atual.filter((x) => x.id !== s.id))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para excluir.')
    } finally {
      setExcluindo(null)
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
            anúncio, contrato nem pagamento; vale 90 min. Exclua quando terminar (ou ela some sozinha em 7 dias).
          </p>
          <p className="mt-1 max-w-[62ch] text-xs leading-relaxed text-muted-foreground">
            <Brain className="mr-1 inline h-3.5 w-3.5 text-primary" aria-hidden />
            Testar o Resumo por IA sozinho: marque a caixa, entre, autorize, fale uns minutos sobre um tema, saia pelo botão Sair e clique em &quot;Gerar resumo agora&quot;.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Button size="sm" onClick={() => void criar()} disabled={criando}>
            {criando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-1 h-4 w-4" />} Criar sala de teste
          </Button>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={comResumo} onChange={(e) => setComResumo(e.target.checked)} />
            <Brain className="h-3.5 w-3.5 text-primary" aria-hidden /> com Resumo por IA (sem cobrança)
          </label>
        </div>
      </div>
      {erro && <CaixaErro mensagem={erro} className="mt-3" />}
      <AnimatePresence initial={false}>
        {salas.length > 0 && (
          <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2">
            {salas.map((s) => (
              <motion.li key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    Até {horaEmBrasilia(s.fim)}
                    {!s.aberta && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">Encerrada</span>}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{s.alunos.length ? `Convidados: ${s.alunos.join(', ')}` : 'Ninguém entrou ainda'}</span>
                  {s.resumoIA && (
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-primary">
                      <Brain className="h-3 w-3" aria-hidden /> Resumo por IA: {ESTADO_DO_RESUMO[s.resumoIA] || s.resumoIA}
                      {s.resumoIA === 'pronto' && (
                        <a href={`/monitorias/reservas/${s.id}/resumo`} target="_blank" rel="noopener" className="ml-1 font-semibold underline">
                          ler
                        </a>
                      )}
                      {s.resumoIA && PROCESSANDO.includes(s.resumoIA) && <Loader2 className="ml-1 h-3 w-3 animate-spin" aria-hidden />}
                    </span>
                  )}
                  {s.resumoMotivo && <span className="mt-0.5 block text-xs text-rose-600">{s.resumoMotivo}</span>}
                  {s.resumoIA && (s.trechos || s.resumoIA !== 'aguardando') && (
                    <span className="mt-0.5 block">
                      <LinhaDosTrechos trechos={s.trechos} />
                    </span>
                  )}
                </span>
                {s.aberta && (
                <Button size="sm" variant="outline" onClick={() => copiar(s)}>
                  {copiado === s.id ? <Check className="mr-1 h-4 w-4 text-primary" /> : <Copy className="mr-1 h-4 w-4" />} {copiado === s.id ? 'Copiado!' : 'Copiar convite'}
                </Button>
                )}
                {s.resumoIA && PODE_GERAR.includes(s.resumoIA) && (
                  <Button size="sm" variant="outline" onClick={() => void gerarResumo(s)} disabled={gerando === s.id}>
                    {gerando === s.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />} Gerar resumo agora
                  </Button>
                )}
                {/* Navegação completa: a sala carrega com a permissão de microfone. */}
                {s.aberta && (
                  <a href={`/monitorias/reservas/${s.id}/sala`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Video className="h-4 w-4" /> Entrar como monitor
                  </a>
                )}
                <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700" disabled={excluindo === s.id} onClick={() => void excluir(s)} aria-label="Excluir sala de teste">
                  {excluindo === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  <span className="ml-1 hidden sm:inline">Excluir</span>
                </Button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  )
}
