'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Loader2, Mic, MicOff, RefreshCw, ShieldCheck, Users, Video, VideoOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, CaixaAviso, CaixaErro } from '@/components/monitorias/base'
import { formatarEmBrasilia, horaEmBrasilia } from '@/lib/fuso-brasilia'
import { medirNivel, podeEscolherSaida, type EstadoDoAparelho } from '@/lib/monitorias/sala/cliente/midia'
import type { ControladorDaSala, EstadoDaSalaNaTela } from '@/lib/monitorias/sala/cliente/controlador'
import type { EstadoDoSaguao } from '@/lib/monitorias/sala/mensagens'
import { cn } from '@/lib/utils'
import { VideoAoVivo } from './midia-ao-vivo'
import { AjudaDeAparelho } from './ajuda-permissao'

const COM_PROBLEMA: EstadoDoAparelho[] = ['negado', 'indisponivel', 'em_uso', 'erro']

function faltaPara(iso: string, agora: number): string {
  const min = Math.max(0, Math.ceil((new Date(iso).getTime() - agora) / 60_000))
  if (min <= 1) return 'em instantes'
  if (min < 60) return `em ${min} min`
  const h = Math.floor(min / 60)
  return `em ${h}h${String(min % 60).padStart(2, '0')}`
}

/** Medidor do microfone: barrinhas que acendem com a voz (só no saguão). */
function MedidorDoMicrofone({ trilha, ligado }: { trilha: MediaStreamTrack | null; ligado: boolean }) {
  const [nivel, setNivel] = useState(0)
  useEffect(() => {
    if (!trilha || !ligado) {
      setNivel(0)
      return
    }
    let ultimo = 0
    return medirNivel(trilha, (n) => {
      // Uma atualização a cada ~80 ms basta para o olho e poupa o React.
      const agora = performance.now()
      if (agora - ultimo > 80) {
        ultimo = agora
        setNivel(n)
      }
    })
  }, [trilha, ligado])
  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden>
      {[0.12, 0.3, 0.5, 0.7, 0.9].map((limiar) => (
        <span key={limiar} className={cn('w-1 rounded-full transition-colors', nivel >= limiar ? 'bg-primary' : 'bg-white/30')} style={{ height: `${6 + limiar * 10}px` }} />
      ))}
    </span>
  )
}

export function SeletorDeAparelho({ rotulo, valor, opcoes, aoMudar }: { rotulo: string; valor: string | null; opcoes: MediaDeviceInfo[]; aoMudar: (id: string) => void }) {
  if (!opcoes.length) return null
  const atual = valor && opcoes.some((o) => o.deviceId === valor) ? valor : opcoes[0].deviceId
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{rotulo}</span>
      <select
        value={atual}
        onChange={(e) => aoMudar(e.target.value)}
        className="h-10 w-full truncate rounded-xl border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {opcoes.map((o, i) => (
          <option key={o.deviceId} value={o.deviceId}>
            {o.label || `${rotulo} ${i + 1}`}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Saguao({ ctrl, estado, saguao, erroSaguao }: { ctrl: ControladorDaSala; estado: EstadoDaSalaNaTela; saguao: EstadoDoSaguao | null; erroSaguao: string }) {
  const [agora, setAgora] = useState(() => Date.now())
  const abreEm = saguao?.acesso.motivo === 'nao_abriu' ? saguao.acesso.abreEm : estado.abreEm
  useEffect(() => {
    if (!abreEm) return
    const t = setInterval(() => setAgora(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [abreEm])

  const { local, prefs, aparelhos } = estado
  const micLigado = local.mic === 'ligado'
  const camLigada = local.cam === 'ligado'
  const entrando = estado.fase === 'entrando'
  const reservaId = saguao?.reserva.id
  const podeEntrar = !!saguao?.acesso.ok && !entrando
  const problema = COM_PROBLEMA.includes(local.mic) || COM_PROBLEMA.includes(local.cam)
  const nomeDoOutro = saguao?.papel === 'monitor' ? 'o aluno' : 'o monitor'

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <Link
          href={reservaId ? `/monitorias/reservas/${reservaId}` : '/monitorias/minhas'}
          className="inline-flex items-center gap-1.5 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para a reserva
        </Link>
        <span className="text-sm font-medium text-muted-foreground">Sala de aula</span>
      </header>

      <main className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-4 pb-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Prévia */}
        <section aria-label="Prévia da sua câmera">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-neutral-900 shadow-sm">
            {local.camera ? (
              <VideoAoVivo stream={local.camera} versao={local.versao} espelhar rotulo="Sua câmera" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-300">
                <VideoOff className="h-8 w-8" aria-hidden />
                <p className="text-sm">{local.cam === 'desligado' ? 'Câmera desligada' : 'Câmera indisponível'}</p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/60 to-transparent p-4">
              <button
                type="button"
                onClick={() => void ctrl.alternarMic()}
                aria-pressed={micLigado}
                aria-label={micLigado ? 'Desligar microfone' : 'Ligar microfone'}
                className={cn(
                  'inline-flex h-12 w-12 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                  micLigado ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-neutral-900 hover:bg-white/90',
                )}
              >
                {micLigado ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => void ctrl.alternarCam()}
                aria-pressed={camLigada}
                aria-label={camLigada ? 'Desligar câmera' : 'Ligar câmera'}
                className={cn(
                  'inline-flex h-12 w-12 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                  camLigada ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-neutral-900 hover:bg-white/90',
                )}
              >
                {camLigada ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
              {micLigado && (
                <span className="ml-1 inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white">
                  <MedidorDoMicrofone trilha={local.audio} ligado={micLigado} /> Fale para testar
                </span>
              )}
            </div>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            A aula não é gravada pela DomineAqui. Câmera e microfone só ficam ligados enquanto esta tela estiver aberta.
          </p>
        </section>

        {/* Entrada */}
        <section className="flex flex-col gap-4" aria-label="Entrar na aula">
          <div>
            <h1 className="font-heading text-2xl font-semibold leading-tight">{saguao?.reserva.titulo || 'Sala de aula'}</h1>
            {saguao?.reserva.inicio && saguao.reserva.fim && (
              <p className="mt-1 text-sm text-muted-foreground">
                {formatarEmBrasilia(saguao.reserva.inicio, { weekday: 'long', day: '2-digit', month: '2-digit' })}, {horaEmBrasilia(saguao.reserva.inicio)} às {horaEmBrasilia(saguao.reserva.fim)} (Brasília)
              </p>
            )}
          </div>

          {erroSaguao && <CaixaErro mensagem={erroSaguao} />}

          {saguao && (
            <div className="rounded-2xl border border-border bg-card p-4" aria-live="polite">
              {saguao.acesso.ok ? (
                saguao.presentes.length ? (
                  <div className="flex items-center gap-3">
                    <span className="flex -space-x-2">
                      {saguao.presentes.slice(0, 3).map((p) => (
                        <Avatar key={p.nome} nome={p.nome} tamanho={34} className="ring-2 ring-card" />
                      ))}
                    </span>
                    <p className="text-sm">
                      <span className="font-semibold">{saguao.presentes.map((p) => p.nome.split(' ')[0]).join(', ')}</span>{' '}
                      {saguao.presentes.length > 1 ? 'já estão na sala.' : 'já está na sala.'}
                    </p>
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" aria-hidden />
                    {saguao.papel === 'aluno' ? 'O monitor ainda não entrou. Você pode entrar e esperar por ele.' : 'Nenhum aluno na sala ainda. Entre e espere: eles serão avisados.'}
                  </p>
                )
              ) : saguao.acesso.motivo === 'nao_abriu' && saguao.acesso.abreEm ? (
                <p className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" aria-hidden />
                  <span>
                    A sala abre às <strong>{horaEmBrasilia(saguao.acesso.abreEm)}</strong> ({faltaPara(saguao.acesso.abreEm, agora)}). Esta tela libera sozinha.
                  </span>
                </p>
              ) : (
                <p className="text-sm">{saguao.acesso.mensagem}</p>
              )}
            </div>
          )}

          {estado.outraAba && <CaixaAviso tom="info">A aula está aberta em outra aba deste navegador. Entrar aqui fecha a outra.</CaixaAviso>}
          <AjudaDeAparelho mic={local.mic} cam={local.cam} />
          {estado.erroAoEntrar && <CaixaErro mensagem={estado.erroAoEntrar} />}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <SeletorDeAparelho rotulo="Câmera" valor={prefs.camId} opcoes={aparelhos.cameras} aoMudar={(id) => void ctrl.trocarAparelho('cam', id)} />
            <SeletorDeAparelho rotulo="Microfone" valor={prefs.micId} opcoes={aparelhos.microfones} aoMudar={(id) => void ctrl.trocarAparelho('mic', id)} />
            {podeEscolherSaida() && <SeletorDeAparelho rotulo="Alto-falante" valor={prefs.saidaId} opcoes={aparelhos.saidas} aoMudar={(id) => void ctrl.trocarAparelho('saida', id)} />}
          </div>

          <div className="flex flex-col gap-2">
            <Button size="lg" className="h-12 rounded-xl text-base font-semibold" disabled={!podeEntrar} onClick={() => void ctrl.entrar()}>
              {entrando ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden /> : null}
              {entrando ? 'Entrando…' : 'Entrar na aula'}
            </Button>
            {problema && (
              <Button variant="outline" className="h-11 rounded-xl" onClick={() => void ctrl.tentarAparelhosDeNovo()}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden /> Tentar de novo
              </Button>
            )}
            {podeEntrar && !micLigado && !camLigada && (
              <p className="text-center text-xs text-muted-foreground">Você vai entrar com câmera e microfone desligados. Dá para ligar lá dentro.</p>
            )}
          </div>

          {saguao?.linkReuniao && (
            <p className="text-xs text-muted-foreground">
              Problemas com a sala?{' '}
              <a href={saguao.linkReuniao} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
                Use o link da reunião que {nomeDoOutro === 'o monitor' ? 'o monitor' : 'você'} colocou
              </a>
              .
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
