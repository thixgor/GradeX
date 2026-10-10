'use client'

/**
 * Mural de pedidos para o monitor: alunos dizendo o que precisam. Responder
 * abre a conversa com o aluno (uma reserva de negociação comum) e leva direto
 * para ela, onde o monitor manda a proposta com dia e valor.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Loader2, Megaphone, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { api, CaixaErro, Esqueleto, Selo, Vazio } from '../base'
import { CartaoDemanda } from '../cartao-demanda'
import type { PeriodoDemanda, QuandoDemanda } from '@/lib/monitorias/demandas-regras'

interface ItemMural {
  id: string
  alunoPrimeiroNome: string
  materia: string
  assunto: string | null
  pessoas: number
  valorPorPessoaCentavos: number | null
  duracaoMin: number
  quando: QuandoDemanda
  periodos: PeriodoDemanda[]
  respostas: number
  createdAt: string
  minhaMateria: boolean
  minhaResposta: string | null
  anunciosQueAtendem: string[]
}

interface Mural {
  ehMonitor: boolean
  anuncios: Array<{ id: string; titulo: string; materia: string; maxAlunos: number }>
  itens: ItemMural[]
}

export function Oportunidades() {
  const [dados, setDados] = useState<Mural | null>(null)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState<'minhas' | 'todas' | null>(null)
  const [abertoId, setAbertoId] = useState<string | null>(null)

  const carregar = useCallback(() => {
    api<Mural>('/api/monitorias/demandas/abertas').then(setDados).catch((e) => setErro(e.message))
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])

  const minhas = useMemo(() => dados?.itens.filter((i) => i.minhaMateria) || [], [dados])
  const filtroAtivo = filtro ?? (minhas.length ? 'minhas' : 'todas')
  const lista = filtroAtivo === 'minhas' ? minhas : dados?.itens || []

  if (erro) return <CaixaErro mensagem={erro} />
  if (!dados) return <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Esqueleto className="h-48" /><Esqueleto className="h-48" /></div>

  return (
    // Folga no fim (celular/tablet): o último "Quero dar essa aula" sobe acima do "+" flutuante.
    <div className="space-y-5 pb-24 lg:pb-0">
      <div>
        <h2 className="font-heading text-xl font-semibold">Alunos procurando monitor</h2>
        <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
          Pedidos abertos agora. Responda primeiro: o aluno escolhe entre quem aparecer e vocês combinam tudo pelo chat.
        </p>
      </div>

      {!dados.anuncios.length && (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">Para responder, publique um anúncio.</span> Leva uns 5 minutos, e os pedidos da sua matéria passam a chegar no seu sino.
          </p>
          <Link href="/monitorias/painel/anuncios/novo" className="shrink-0">
            <Button className="w-full rounded-xl sm:w-auto">Criar anúncio <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
          </Link>
        </div>
      )}

      {dados.itens.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar pedidos">
          {minhas.length > 0 && (
            <Filtro ativo={filtroAtivo === 'minhas'} onClick={() => setFiltro('minhas')}>Das minhas matérias ({minhas.length})</Filtro>
          )}
          <Filtro ativo={filtroAtivo === 'todas'} onClick={() => setFiltro('todas')}>Todos ({dados.itens.length})</Filtro>
        </div>
      )}

      {lista.length === 0 ? (
        <Vazio
          icone={<Megaphone className="h-6 w-6" />}
          titulo="Nenhum pedido aberto agora"
          texto="Quando um aluno pedir monitoria da sua matéria, você recebe um aviso no sino e por e-mail."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {lista.map((item) => (
            <li key={item.id}>
              <CartaoDemanda
                d={{ ...item, assunto: item.assunto || undefined }}
                criadoEm={item.createdAt}
                topo={`${item.alunoPrimeiroNome} procura`}
                destaque={item.minhaMateria ? <Selo tom="sucesso">Sua matéria</Selo> : undefined}
                className={cn(abertoId === item.id && 'border-primary/50')}
              >
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    {item.respostas === 0 ? 'Ninguém respondeu ainda' : `${item.respostas} ${item.respostas === 1 ? 'monitor respondeu' : 'monitores responderam'}`}
                  </p>
                  {item.minhaResposta ? (
                    <Link href={`/monitorias/reservas/${item.minhaResposta}`}>
                      <Button variant="outline" size="sm" className="rounded-xl"><MessageCircle className="mr-1.5 h-4 w-4" /> Ver conversa</Button>
                    </Link>
                  ) : dados.anuncios.length ? (
                    <Button size="sm" className="rounded-xl" onClick={() => setAbertoId(abertoId === item.id ? null : item.id)} aria-expanded={abertoId === item.id}>
                      {abertoId === item.id ? 'Fechar' : 'Quero dar essa aula'}
                    </Button>
                  ) : null}
                </div>
                <AnimatePresence initial={false}>
                  {abertoId === item.id && !item.minhaResposta && <Responder item={item} anuncios={dados.anuncios} />}
                </AnimatePresence>
              </CartaoDemanda>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Responder({ item, anuncios }: { item: ItemMural; anuncios: Mural['anuncios'] }) {
  const router = useRouter()
  const reduzir = useReducedMotion()
  const atendem = anuncios.filter((a) => item.anunciosQueAtendem.includes(a.id))
  // Começa no anúncio da mesma matéria, se houver.
  const sugerido = atendem.find((a) => a.materia.localeCompare(item.materia, 'pt-BR', { sensitivity: 'base' }) === 0) || atendem[0]
  const [anuncioId, setAnuncioId] = useState(sugerido?.id || '')
  const [mensagem, setMensagem] = useState(
    `Oi, ${item.alunoPrimeiroNome}! Dou monitoria de ${item.materia}${item.assunto ? ` e posso te ajudar com ${item.assunto}` : ''}. Vamos combinar o melhor dia?`,
  )
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar() {
    setErro('')
    setEnviando(true)
    try {
      const r = await api<{ reservaId: string }>(`/api/monitorias/demandas/${item.id}/responder`, { method: 'POST', json: { anuncioId, mensagem: mensagem.trim() } })
      router.push(`/monitorias/reservas/${r.reservaId}`)
    } catch (e) {
      setErro((e as Error).message)
      setEnviando(false)
    }
  }

  return (
    <motion.div
      initial={reduzir ? false : { height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={reduzir ? { opacity: 0 } : { height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-4 space-y-3">
        {atendem.length === 0 ? (
          <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
            Nenhum anúncio seu comporta {item.pessoas} pessoas. Ative &quot;Aula em grupo&quot; em um anúncio para responder.
          </p>
        ) : (
          <>
            {atendem.length > 1 && (
              <fieldset>
                <legend className="mb-1.5 text-xs font-semibold text-muted-foreground">Responder com o anúncio</legend>
                <div className="space-y-1.5">
                  {atendem.map((a) => (
                    <label key={a.id} className={cn('flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-3 text-sm transition', anuncioId === a.id ? 'border-primary bg-primary/[0.06]' : 'border-border')}>
                      <input type="radio" name={`anuncio-${item.id}`} value={a.id} checked={anuncioId === a.id} onChange={() => setAnuncioId(a.id)} className="accent-[hsl(var(--primary))]" />
                      <span className="min-w-0 flex-1 truncate font-medium">{a.titulo}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div>
              <label htmlFor={`msg-${item.id}`} className="mb-1.5 block text-xs font-semibold text-muted-foreground">Sua mensagem</label>
              <Textarea id={`msg-${item.id}`} value={mensagem} onChange={(e) => setMensagem(e.target.value.slice(0, 1000))} rows={3} className="text-[15px]" />
            </div>
            {erro && <CaixaErro mensagem={erro} />}
            <Button onClick={enviar} disabled={enviando || mensagem.trim().length < 5 || !anuncioId} className="h-11 w-full rounded-xl">
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar e abrir a conversa'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Na conversa, você manda a proposta com dia, horário e valor.</p>
          </>
        )}
      </div>
    </motion.div>
  )
}

function Filtro({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        'min-h-[40px] rounded-xl border px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40',
      )}
    >
      {children}
    </button>
  )
}
