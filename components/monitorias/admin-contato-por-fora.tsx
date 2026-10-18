'use client'

/**
 * Admin → Monitorias → Contato por fora: o que o chat recusou (telefone,
 * e-mail, link, rede social, CPF/PIX, convite para outro canal, pagamento por
 * fora) e o que só citou outro canal. Mostra a reincidência de cada pessoa nos
 * últimos 30 dias para o suporte decidir advertência, suspensão ou banimento.
 */

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CheckCheck, Eye, MessageSquareText, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, CaixaErro, Esqueleto, Selo } from '@/components/monitorias/base'
import { ConversaDaMonitoria } from '@/components/monitorias/admin-aulas'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { ROTULO_CATEGORIA, type CategoriaContato } from '@/lib/monitorias/contato-inteligente'
import { cn } from '@/lib/utils'

interface Item {
  id: string
  reservaId: string
  curto: string
  titulo: string
  userId: string
  nome: string
  papel: 'monitor' | 'aluno'
  origem: 'chat' | 'chat_sala' | 'material' | 'resumo_ia'
  nivel: 'bloqueio' | 'alerta'
  categorias: CategoriaContato[]
  trechos: string[]
  texto: string
  createdAt: string
  vista: boolean
  bloqueios30d: number
}

const ORIGEM: Record<Item['origem'], string> = { chat: 'chat da reserva', chat_sala: 'chat da sala de aula', material: 'material enviado', resumo_ia: 'dito na aula (Resumo por IA)' }

export function AdminContatoPorFora({ onMudou }: { onMudou: () => void }) {
  const [filtro, setFiltro] = useState<'novas' | 'todas'>('novas')
  const [pessoa, setPessoa] = useState<{ userId: string; nome: string } | null>(null)
  const [itens, setItens] = useState<Item[] | null>(null)
  const [erro, setErro] = useState('')
  const [conversa, setConversa] = useState<{ id: string; titulo: string } | null>(null)

  const carregar = useCallback(() => {
    setItens(null)
    const qs = new URLSearchParams({ filtro: pessoa ? 'todas' : filtro })
    if (pessoa) qs.set('userId', pessoa.userId)
    api<{ itens: Item[] }>(`/api/admin/monitorias/infracoes?${qs}`)
      .then((r) => setItens(r.itens))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro'))
  }, [filtro, pessoa])
  useEffect(() => carregar(), [carregar])

  async function marcar(corpo: { ids: string[] } | { todas: true }) {
    try {
      await api('/api/admin/monitorias/infracoes', { method: 'POST', json: corpo })
      carregar()
      onMudou()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    }
  }

  return (
    <div>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Mensagens com telefone, e-mail, link, rede social, CPF/chave PIX, convite para outro canal ou pagamento por fora não chegam ao outro lado: a pessoa vê o aviso e a
        tentativa fica aqui. Mensagens que só citam outro canal (&quot;o zap caiu&quot;) são entregues e aparecem como alerta.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {pessoa ? (
          <>
            <Selo tom="info">Só {pessoa.nome}</Selo>
            <Button size="sm" variant="ghost" onClick={() => setPessoa(null)}>Ver todos</Button>
          </>
        ) : (
          <>
            <Button size="sm" variant={filtro === 'novas' ? 'default' : 'outline'} onClick={() => setFiltro('novas')}>Novas</Button>
            <Button size="sm" variant={filtro === 'todas' ? 'default' : 'outline'} onClick={() => setFiltro('todas')}>Todas</Button>
            {filtro === 'novas' && itens && itens.length > 0 && (
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => marcar({ todas: true })}>
                <CheckCheck className="mr-1 h-4 w-4" /> Marcar todas como vistas
              </Button>
            )}
          </>
        )}
      </div>
      {erro && <CaixaErro mensagem={erro} className="mb-3" />}
      {!itens ? (
        <Esqueleto className="h-64" />
      ) : itens.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhuma tentativa {filtro === 'novas' && !pessoa ? 'nova' : 'registrada'}. 🎉</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((i) => (
            <li key={i.id} className={cn('rounded-2xl border bg-card p-4 text-sm', i.nivel === 'bloqueio' ? 'border-rose-500/30' : 'border-amber-500/30')}>
              <div className="flex flex-wrap items-center gap-2">
                <ShieldAlert className={cn('h-4 w-4', i.nivel === 'bloqueio' ? 'text-rose-600' : 'text-amber-600')} />
                <p className="font-semibold">{i.nome}</p>
                <span className="text-xs text-muted-foreground">{i.papel}</span>
                <Selo tom={i.nivel === 'bloqueio' ? 'erro' : 'alerta'}>{i.nivel === 'bloqueio' ? 'Bloqueada' : 'Alerta'}</Selo>
                {i.bloqueios30d >= 3 && <Selo tom="erro">{i.bloqueios30d} bloqueios em 30 dias</Selo>}
                <span className="ml-auto text-xs text-muted-foreground">{formatarEmBrasilia(i.createdAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                #{i.curto} {i.titulo} · {ORIGEM[i.origem] || i.origem} · {i.categorias.map((c) => ROTULO_CATEGORIA[c] || c).join(', ')}
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-muted/60 p-3 text-sm">{i.texto}</p>
              {i.trechos.length > 0 && <p className="mt-1 text-[11px] text-muted-foreground">Detectado: {i.trechos.join(' · ')}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setConversa({ id: i.reservaId, titulo: i.titulo })}>
                  <MessageSquareText className="mr-1 h-4 w-4" /> Ver conversa
                </Button>
                {!pessoa && (
                  <Button size="sm" variant="ghost" onClick={() => setPessoa({ userId: i.userId, nome: i.nome })}>
                    Histórico desta pessoa
                  </Button>
                )}
                {!i.vista && (
                  <Button size="sm" variant="ghost" onClick={() => marcar({ ids: [i.id] })}>
                    <Eye className="mr-1 h-4 w-4" /> Marcar como vista
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <AnimatePresence>{conversa && <ConversaDaMonitoria reservaId={conversa.id} titulo={conversa.titulo} onFechar={() => setConversa(null)} />}</AnimatePresence>
    </div>
  )
}
