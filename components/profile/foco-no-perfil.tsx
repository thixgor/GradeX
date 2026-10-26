'use client'

import { useState } from 'react'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { useFocusSession } from '@/hooks/use-focus-session'
import { PainelDeFoco } from '@/components/foco/painel-de-foco'
import { formatarMinutos } from '@/lib/foco/ritmo-de-foco'

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

/**
 * Sessões de foco no perfil: o mesmo cronômetro do topo (começar daqui também
 * vale) e o histórico do aparelho, com renomear e apagar. A sincronização com
 * a conta é automática (ver `hooks/use-focus-session.tsx`) — não há mais botão
 * de "sincronizar".
 */
export function FocoNoPerfil() {
  const { history, deleteSession, renameSession } = useFocusSession()
  const [editando, setEditando] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [confirmar, setConfirmar] = useState<string | null>(null)
  const [todas, setTodas] = useState(false)
  const lista = todas ? history.slice(0, 50) : history.slice(0, 6)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="ios-cartao rounded-[22px] p-4 sm:p-5">
        <PainelDeFoco variante="cartao" />
      </div>

      <div>
        {history.length === 0 ? (
          <div className="ios-cartao flex h-full flex-col justify-center rounded-[22px] px-5 py-8 text-center">
            <p className="text-[15px] font-semibold">Nenhuma sessão ainda</p>
            <p className="mt-1 text-[13px] ios-rotulo-2">
              Escolha um objetivo e uma duração ao lado. Cada sessão entra no seu tempo de estudo.
            </p>
          </div>
        ) : (
          <>
            <ul className="ios-lista">
              {lista.map(sessao => (
                <li key={sessao.id}>
                  <div className="ios-linha group">
                    {editando === sessao.id ? (
                      <form
                        className="flex flex-1 items-center gap-2"
                        onSubmit={e => {
                          e.preventDefault()
                          renameSession(sessao.id, texto.trim() || 'Sessão de foco')
                          setEditando(null)
                        }}
                      >
                        <input
                          autoFocus
                          value={texto}
                          onChange={e => setTexto(e.target.value)}
                          maxLength={100}
                          aria-label="Novo objetivo"
                          className="foco-campo !h-10 flex-1"
                        />
                        <button type="submit" className="foco-icone-botao" aria-label="Salvar">
                          <Check className="h-4 w-4" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">{sessao.objective}</p>
                          <p className="text-[12.5px] ios-rotulo-2">{DATA.format(new Date(sessao.startedAt))}</p>
                        </div>
                        <span className="shrink-0 text-[15px] font-semibold tabular-nums">
                          {sessao.totalTimeMs < 60_000 ? '<1 min' : formatarMinutos(sessao.totalTimeMs / 60_000)}
                        </span>
                        <button
                          type="button"
                          className="foco-icone-botao lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                          aria-label={`Renomear "${sessao.objective}"`}
                          onClick={() => {
                            setEditando(sessao.id)
                            setTexto(sessao.objective)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className={
                            confirmar === sessao.id
                              ? 'foco-botao foco-botao-perigo !h-8 !px-3 !text-[13px]'
                              : 'foco-icone-botao text-destructive lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100'
                          }
                          aria-label={confirmar === sessao.id ? 'Confirmar exclusão' : `Apagar "${sessao.objective}"`}
                          onClick={() => {
                            if (confirmar !== sessao.id) {
                              setConfirmar(sessao.id)
                              return
                            }
                            deleteSession(sessao.id)
                            setConfirmar(null)
                          }}
                          onBlur={() => setConfirmar(c => (c === sessao.id ? null : c))}
                        >
                          {confirmar === sessao.id ? 'Apagar' : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {history.length > 6 && (
              <button type="button" onClick={() => setTodas(v => !v)} className="mt-2 px-4 text-[14px] font-semibold ios-tinta">
                {todas ? 'Mostrar menos' : `Ver todas (${history.length})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
