'use client'

/**
 * Painel "Pessoas": quem está na sala, mãos levantadas e — para o monitor —
 * os controles de anfitrião: silenciar (um ou todos), desligar câmera, parar a
 * tela, pedir para ligar microfone/câmera, baixar mãos, tirar da sala (e
 * liberar a volta) e as permissões de tela e chat dos alunos.
 *
 * Pedidos (silenciar, câmera, mão) vão pelo canal P2P e o navegador do aluno
 * obedece; ligar o microfone ou a câmera de alguém NUNCA é forçado: o aluno
 * recebe o pedido e decide. Tirar da sala e as permissões valem no servidor.
 */

import { useState } from 'react'
import {
  Hand,
  Mic,
  MicOff,
  MoreHorizontal,
  Pin,
  PinOff,
  ScreenShare,
  ScreenShareOff,
  UserMinus,
  UserPlus,
  Video,
  VideoOff,
  VolumeX,
  X,
} from 'lucide-react'
import { Avatar } from '@/components/monitorias/base'
import type { ControladorDaSala, EstadoDaSalaNaTela, ParticipanteNaTela } from '@/lib/monitorias/sala/cliente/controlador'
import { cn } from '@/lib/utils'

function Chave({ rotulo, texto, ligada, onMudar, ocupada }: { rotulo: string; texto: string; ligada: boolean; onMudar: () => void; ocupada?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl bg-white/5 p-3">
      <span>
        <span className="block text-sm font-medium text-white">{rotulo}</span>
        <span className="block text-xs text-white/55">{texto}</span>
      </span>
      <input type="checkbox" checked={ligada} disabled={ocupada} onChange={onMudar} className="mt-1 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" />
    </label>
  )
}

function Acao({ icone: Icone, children, onClick, perigo }: { icone: typeof Mic; children: React.ReactNode; onClick: () => void; perigo?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-10 touch-manipulation items-center gap-2 rounded-lg px-3 text-left text-sm font-medium',
        perigo ? 'bg-rose-600/15 text-rose-200 hover:bg-rose-600/25' : 'bg-white/10 text-white hover:bg-white/15',
      )}
    >
      <Icone className="h-4 w-4 shrink-0" aria-hidden /> {children}
    </button>
  )
}

export function PainelDePessoas({
  estado,
  ctrl,
  fixado,
  aoFixar,
}: {
  estado: EstadoDaSalaNaTela
  ctrl: ControladorDaSala
  fixado: string | null
  aoFixar: (pid: string | null) => void
}) {
  const ehMonitor = estado.eu?.papel === 'monitor'
  const [aberto, setAberto] = useState<string | null>(null)
  const [confirmarRemocao, setConfirmarRemocao] = useState<ParticipanteNaTela | null>(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const pessoas = estado.participantes
  const maos = pessoas.filter((p) => p.mao).sort((a, b) => a.maoDesde - b.maoDesde)
  const alunosComMicrofone = pessoas.filter((p) => p.papel === 'aluno' && p.mic).length

  async function comServidor(fn: () => Promise<string | null>) {
    setOcupado(true)
    setErro('')
    const falha = await fn()
    setOcupado(false)
    if (falha) setErro(falha)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {erro && <p className="rounded-lg bg-amber-400/15 px-3 py-2 text-xs text-amber-200">{erro}</p>}

        {maos.length > 0 && (
          <section aria-label="Mãos levantadas">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-300">Mãos levantadas ({maos.length})</h3>
              {ehMonitor && maos.length > 1 && (
                <button type="button" onClick={() => ctrl.pedirATodos('baixar_mao')} className="text-xs font-semibold text-white/70 hover:text-white">
                  Baixar todas
                </button>
              )}
            </div>
            <ol className="space-y-1.5">
              {maos.map((p, i) => (
                <li key={p.pid} className="flex items-center gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-sm">
                  <span className="w-4 text-xs font-bold text-amber-300">{i + 1}</span>
                  <Hand className="h-4 w-4 text-amber-300" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{p.nome}</span>
                  {ehMonitor && (
                    <>
                      {!p.mic && (
                        <button type="button" onClick={() => ctrl.pedirA(p.pid, 'pedir_mic')} className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/15">
                          Pedir para falar
                        </button>
                      )}
                      <button type="button" onClick={() => ctrl.pedirA(p.pid, 'baixar_mao')} className="rounded-lg px-2 py-1 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white">
                        Baixar
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {ehMonitor && (
          <section aria-label="Controles do monitor" className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Controles do monitor</h3>
            <div className="flex flex-wrap gap-2">
              <Acao icone={VolumeX} onClick={() => ctrl.pedirATodos('silenciar')}>
                Silenciar todos{alunosComMicrofone ? ` (${alunosComMicrofone})` : ''}
              </Acao>
            </div>
            {estado.config?.compartilharTela && (
              <Chave
                rotulo="Alunos podem compartilhar a tela"
                texto="Desligado: só você apresenta. Quem estiver compartilhando para na hora."
                ligada={estado.permissoes.telaAlunos}
                ocupada={ocupado}
                onMudar={() => void comServidor(() => ctrl.definirPermissoes({ telaAlunos: !estado.permissoes.telaAlunos }))}
              />
            )}
            {estado.config?.chatNaSala && (
              <Chave
                rotulo="Alunos podem escrever no chat"
                texto="Desligado durante a aula: só você escreve. Os alunos ainda levantam a mão."
                ligada={estado.permissoes.chatAlunos}
                ocupada={ocupado}
                onMudar={() => void comServidor(() => ctrl.definirPermissoes({ chatAlunos: !estado.permissoes.chatAlunos }))}
              />
            )}
          </section>
        )}

        <section aria-label="Na sala">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Na sala ({pessoas.length + 1})</h3>
          <ul className="space-y-1">
            <li className="flex items-center gap-3 rounded-xl px-2 py-2">
              <Avatar nome={estado.eu?.nome || 'Você'} tamanho={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{estado.eu?.nome} (você)</span>
                <span className="block text-xs text-white/50">{ehMonitor ? 'Monitor' : 'Aluno'}</span>
              </span>
              {estado.mao && <Hand className="h-4 w-4 text-amber-300" aria-label="mão levantada" />}
              {estado.local.mic === 'ligado' ? <Mic className="h-4 w-4 text-white/60" aria-label="microfone ligado" /> : <MicOff className="h-4 w-4 text-rose-300" aria-label="microfone desligado" />}
            </li>
            {pessoas.map((p) => {
              const menu = aberto === p.pid
              const controla = ehMonitor && p.papel === 'aluno'
              return (
                <li key={p.pid} className={cn('rounded-xl', menu && 'bg-white/5')}>
                  <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar nome={p.nome} tamanho={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.nome}</span>
                      <span className="block text-xs text-white/50">
                        {p.papel === 'monitor' ? 'Monitor' : 'Aluno'}
                        {p.fase !== 'conectado' ? ' · conectando…' : p.conexao !== 'boa' ? ` · conexão ${p.conexao === 'fraca' ? 'fraca' : 'instável'}` : ''}
                      </span>
                    </span>
                    {p.mao && <Hand className="h-4 w-4 text-amber-300" aria-label="mão levantada" />}
                    {p.compartilhando && <ScreenShare className="h-4 w-4 text-primary" aria-label="compartilhando a tela" />}
                    {!p.cam && <VideoOff className="h-4 w-4 text-white/40" aria-label="câmera desligada" />}
                    {p.mic ? <Mic className="h-4 w-4 text-white/60" aria-label="microfone ligado" /> : <MicOff className="h-4 w-4 text-rose-300" aria-label="microfone desligado" />}
                    <button
                      type="button"
                      onClick={() => setAberto(menu ? null : p.pid)}
                      aria-label={`Opções para ${p.nome}`}
                      aria-expanded={menu}
                      className="inline-flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  {menu && (
                    <div className="flex flex-wrap gap-2 px-2 pb-3">
                      <Acao icone={fixado === p.pid ? PinOff : Pin} onClick={() => aoFixar(fixado === p.pid ? null : p.pid)}>
                        {fixado === p.pid ? 'Desafixar' : 'Fixar no palco'}
                      </Acao>
                      {controla && (
                        <>
                          {p.mic ? (
                            <Acao icone={MicOff} onClick={() => ctrl.pedirA(p.pid, 'silenciar')}>Silenciar</Acao>
                          ) : (
                            <Acao icone={Mic} onClick={() => ctrl.pedirA(p.pid, 'pedir_mic')}>Pedir para ligar o microfone</Acao>
                          )}
                          {p.cam ? (
                            <Acao icone={VideoOff} onClick={() => ctrl.pedirA(p.pid, 'desligar_camera')}>Desligar câmera</Acao>
                          ) : (
                            <Acao icone={Video} onClick={() => ctrl.pedirA(p.pid, 'pedir_camera')}>Pedir para ligar a câmera</Acao>
                          )}
                          {p.compartilhando && (
                            <Acao icone={ScreenShareOff} onClick={() => ctrl.pedirA(p.pid, 'parar_tela')}>Parar a tela</Acao>
                          )}
                          {p.mao && (
                            <Acao icone={Hand} onClick={() => ctrl.pedirA(p.pid, 'baixar_mao')}>Baixar a mão</Acao>
                          )}
                          <Acao icone={UserMinus} perigo onClick={() => setConfirmarRemocao(p)}>Tirar da sala</Acao>
                        </>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {ehMonitor && estado.removidos.length > 0 && (
          <section aria-label="Tirados da sala">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Tirados da sala</h3>
            <ul className="space-y-1.5">
              {estado.removidos.map((r) => (
                <li key={r.pid} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{r.nome}</span>
                  {r.por === 'suporte' ? (
                    <span className="text-xs text-white/50">pelo suporte</span>
                  ) : (
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => void comServidor(() => ctrl.readmitir(r.pid))}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/15"
                    >
                      <UserPlus className="h-3.5 w-3.5" aria-hidden /> Liberar volta
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {!ehMonitor && (
          <p className="text-xs leading-relaxed text-white/45">Quer falar? Levante a mão: o monitor vê na hora. Ele pode pedir para você ligar o microfone, mas nada liga sem você aceitar.</p>
        )}
      </div>

      {confirmarRemocao && (
        <div className="border-t border-white/10 bg-neutral-950/80 p-4" role="alertdialog" aria-label={`Tirar ${confirmarRemocao.nome} da sala?`}>
          <div className="flex items-start gap-2">
            <p className="flex-1 text-sm">
              Tirar <strong>{confirmarRemocao.nome}</strong> da sala? A pessoa sai na hora e só volta se você liberar. A reserva e o pagamento não mudam.
            </p>
            <button type="button" onClick={() => setConfirmarRemocao(null)} aria-label="Cancelar" className="rounded-lg p-1 text-white/60 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmarRemocao(null)} className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10">
              Cancelar
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => {
                const alvo = confirmarRemocao
                setConfirmarRemocao(null)
                setAberto(null)
                if (fixado === alvo.pid) aoFixar(null)
                void comServidor(() => ctrl.removerParticipante(alvo.pid))
              }}
              className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Tirar da sala
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
