'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { ArrowLeft, Clock, Loader2, Mic, MicOff, MousePointerClick, RefreshCw, RotateCw, ShieldCheck, Sparkles, Users, Video, VideoOff, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, CaixaAviso, CaixaErro } from '@/components/monitorias/base'
import { formatarEmBrasilia, horaEmBrasilia } from '@/lib/fuso-brasilia'
import { medirNivel, podeEscolherSaida, type EstadoDoAparelho } from '@/lib/monitorias/sala/cliente/midia'
import type { ControladorDaSala, EstadoDaSalaNaTela } from '@/lib/monitorias/sala/cliente/controlador'
import type { EstadoDoSaguao } from '@/lib/monitorias/sala/mensagens'
import type { EstadoDoResumoNaSala } from '@/lib/monitorias/resumo/tipos'
import { cn } from '@/lib/utils'
import { VideoAoVivo } from './midia-ao-vivo'
import { AjudaDeAparelho } from './ajuda-permissao'
import { MarcaClara } from './marca'
import { TesteDeSom } from './teste-de-som'
import { PainelDeEfeitos } from './painel-efeitos'
import { AutorizacaoDoResumo, precisaAutorizar, textoDePrivacidade } from './resumo-ia-sala'
import { EFEITOS_DE_VIDEO, EFEITOS_DE_VOZ, espelharPrevia } from '@/lib/monitorias/sala/cliente/efeitos'

const COM_PROBLEMA: EstadoDoAparelho[] = ['negado', 'indisponivel', 'em_uso', 'erro', 'pagina']

function faltaPara(iso: string, agora: number): string {
  const min = Math.max(0, Math.ceil((new Date(iso).getTime() - agora) / 60_000))
  if (min <= 1) return 'em instantes'
  if (min < 60) return `em ${min} min`
  const h = Math.floor(min / 60)
  return `em ${h}h${String(min % 60).padStart(2, '0')}`
}

/** Nível da voz (0 a 1), atualizado ~12 vezes por segundo, só enquanto o microfone está ligado. */
function useNivelDoMicrofone(trilha: MediaStreamTrack | null, ligado: boolean): number {
  const [nivel, setNivel] = useState(0)
  useEffect(() => {
    if (!trilha || !ligado) {
      setNivel(0)
      return
    }
    let ultimo = 0
    return medirNivel(trilha, (n) => {
      const agora = performance.now()
      if (agora - ultimo > 80) {
        ultimo = agora
        setNivel(n)
      }
    })
  }, [trilha, ligado])
  return nivel
}

function BarrasDoMicrofone({ nivel }: { nivel: number }) {
  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden>
      {[0.12, 0.3, 0.5, 0.7, 0.9].map((limiar) => (
        <span key={limiar} className={cn('w-1 rounded-full transition-all duration-100', nivel >= limiar ? 'bg-primary' : 'bg-white/30')} style={{ height: `${6 + limiar * 10}px` }} />
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
        className="campo-sem-zoom h-10 w-full truncate rounded-xl border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

/**
 * "O navegador vai perguntar: clique em Permitir." Aparece enquanto o pedido de
 * câmera/microfone está aberto, com um desenho do aviso do navegador e uma seta
 * apontando para onde ele costuma aparecer (perto do endereço do site).
 */
function CartaoDePermissao() {
  const reduzir = useReducedMotion()
  return (
    <motion.div
      initial={reduzir ? false : { opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-primary/[0.07] p-4"
      role="status"
    >
      <motion.span
        className="absolute -left-1 -top-1 text-primary sm:left-3"
        animate={reduzir ? undefined : { y: [0, -6, 0], x: [0, -3, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      >
        <ArrowLeft className="h-6 w-6 rotate-45" />
      </motion.span>
      <p className="pl-6 font-heading text-base font-semibold sm:pl-9">Seu navegador está perguntando</p>
      <p className="mt-1 pl-6 text-sm text-muted-foreground sm:pl-9">
        Procure o aviso <span className="hidden sm:inline">no topo, perto do endereço do site,</span>
        <span className="sm:hidden">na tela</span> e clique em <strong className="text-foreground">Permitir</strong> para câmera e microfone.
      </p>
      <div className="mx-auto mt-3 max-w-xs rounded-xl border border-border bg-background p-3 text-xs shadow-lg" aria-hidden>
        <p className="font-medium">domineaqui.com.br quer</p>
        <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
          <Video className="h-3.5 w-3.5" /> Usar sua câmera
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
          <Mic className="h-3.5 w-3.5" /> Usar seu microfone
        </p>
        <div className="mt-2.5 flex justify-end gap-2">
          <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">Bloquear</span>
          <motion.span
            className="relative inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground"
            animate={reduzir ? undefined : { scale: [1, 1.08, 1], boxShadow: ['0 0 0 0 hsl(var(--primary)/0.5)', '0 0 0 8px hsl(var(--primary)/0)', '0 0 0 0 hsl(var(--primary)/0)'] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            Permitir <MousePointerClick className="h-3.5 w-3.5" />
          </motion.span>
        </div>
      </div>
    </motion.div>
  )
}

const entrada: Variants = {
  oculto: { opacity: 0, y: 16 },
  visivel: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
}

export function Saguao({ ctrl, estado, saguao, erroSaguao }: { ctrl: ControladorDaSala; estado: EstadoDaSalaNaTela; saguao: EstadoDoSaguao | null; erroSaguao: string }) {
  const reduzir = useReducedMotion()
  const [efeitosAbertos, setEfeitosAbertos] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())
  const abreEm = saguao?.acesso.motivo === 'nao_abriu' ? saguao.acesso.abreEm : estado.abreEm
  useEffect(() => {
    if (!abreEm) return
    const t = setInterval(() => setAgora(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [abreEm])
  useEffect(() => {
    if (!estado.aviso) return
    const t = setTimeout(() => ctrl.limparAviso(), 6_000)
    return () => clearTimeout(t)
  }, [estado.aviso, ctrl])

  const { local, prefs, aparelhos } = estado
  const micLigado = local.mic === 'ligado'
  const camLigada = local.cam === 'ligado'
  const pedindo = local.mic === 'pedindo' || local.cam === 'pedindo'
  const entrando = estado.fase === 'entrando'
  const reservaId = saguao?.reserva.id
  // Resumo por IA: a decisão do monitor nesta tela vale sobre o retrato do saguão
  // (recusar devolve null — a aula fica sem resumo). Ao entrar, vale o servidor.
  const [decidido, setDecidido] = useState<EstadoDoResumoNaSala | null | undefined>(undefined)
  const resumo = decidido !== undefined ? decidido : saguao?.resumo ?? null
  const faltaAutorizar = precisaAutorizar(resumo)
  const podeEntrar = !!saguao?.acesso.ok && !entrando && !pedindo && !faltaAutorizar
  const recarregar = local.mic === 'pagina' || local.cam === 'pagina'
  const problema = COM_PROBLEMA.includes(local.mic) || COM_PROBLEMA.includes(local.cam)
  const nomeDoOutro = saguao?.papel === 'monitor' ? 'o aluno' : 'o monitor'
  const nivel = useNivelDoMicrofone(local.audio, micLigado)
  const anim = (i: number) => (reduzir ? {} : { variants: entrada, initial: 'oculto', animate: 'visivel', custom: i })

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background bg-[radial-gradient(60rem_30rem_at_50%_-10%,hsl(var(--primary)/0.10),transparent)] text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link
          href={reservaId ? `/monitorias/reservas/${reservaId}` : '/monitorias/minhas'}
          className="inline-flex items-center gap-1.5 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> <span className="hidden min-[400px]:inline">Voltar para a reserva</span>
          <span className="min-[400px]:hidden">Voltar</span>
        </Link>
        <MarcaClara />
      </header>

      <main className="grid flex-1 place-items-center px-4 pb-10 pt-2">
        <div className={cn('grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-10', efeitosAbertos ? 'items-start' : 'items-center')}>
          {/* Prévia */}
          <motion.section aria-label="Prévia da sua câmera" {...anim(0)}>
            <div
              className="relative aspect-video overflow-hidden rounded-3xl bg-neutral-900 shadow-xl transition-shadow duration-150"
              style={micLigado ? { boxShadow: `0 0 0 ${2 + nivel * 7}px hsl(var(--primary) / ${0.18 + nivel * 0.55}), 0 20px 50px -20px rgba(0,0,0,.45)` } : undefined}
            >
              {local.camera ? (
                <VideoAoVivo stream={local.camera} versao={local.versao} espelhar={espelharPrevia(estado.efeitos.video)} rotulo="Sua câmera" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-300">
                  {local.cam === 'pedindo' ? (
                    <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
                  ) : saguao?.foto ? (
                    <Avatar nome="Você" url={saguao.foto} tamanho={88} className="shadow-lg shadow-black/40" />
                  ) : (
                    <VideoOff className="h-8 w-8" aria-hidden />
                  )}
                  <p className="text-sm">
                    {local.cam === 'pedindo' ? 'Esperando você permitir a câmera…' : local.cam === 'desligado' ? 'Câmera desligada' : 'Câmera indisponível'}
                  </p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/65 to-transparent p-4">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  disabled={pedindo}
                  onClick={() => void ctrl.alternarMic()}
                  aria-pressed={micLigado}
                  aria-label={micLigado ? 'Desligar microfone' : 'Ligar microfone'}
                  className={cn(
                    'inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50',
                    micLigado ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-neutral-900 hover:bg-white/90',
                  )}
                >
                  {micLigado ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  disabled={pedindo}
                  onClick={() => void ctrl.alternarCam()}
                  aria-pressed={camLigada}
                  aria-label={camLigada ? 'Desligar câmera' : 'Ligar câmera'}
                  className={cn(
                    'inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50',
                    camLigada ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-neutral-900 hover:bg-white/90',
                  )}
                >
                  {camLigada ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </motion.button>
                {(estado.efeitos.suportaVideo || estado.efeitos.suportaVoz) && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEfeitosAbertos((v) => !v)}
                    aria-expanded={efeitosAbertos}
                    aria-label="Efeitos de câmera e voz"
                    title="Efeitos de câmera e voz"
                    className={cn(
                      'relative inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                      efeitosAbertos ? 'bg-white text-neutral-900' : 'bg-white/15 text-white hover:bg-white/25',
                    )}
                  >
                    <Wand2 className="h-5 w-5" />
                    {(estado.efeitos.video !== 'nenhum' || estado.efeitos.voz !== 'nenhum') && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-neutral-900" aria-hidden />}
                  </motion.button>
                )}
                {micLigado && (
                  <span className="ml-1 inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white">
                    <BarrasDoMicrofone nivel={nivel} /> {nivel > 0.12 ? 'Estamos te ouvindo!' : 'Fale para testar'}
                  </span>
                )}
              </div>
            </div>
            {(estado.efeitos.video !== 'nenhum' || estado.efeitos.voz !== 'nenhum') && !efeitosAbertos && (
              <p className="mt-2 text-xs text-muted-foreground">
                Efeitos ligados:{' '}
                {[EFEITOS_DE_VIDEO.find((e) => e.id === estado.efeitos.video && e.id !== 'nenhum'), EFEITOS_DE_VOZ.find((e) => e.id === estado.efeitos.voz && e.id !== 'nenhum')]
                  .filter(Boolean)
                  .map((e) => `${e!.emoji} ${e!.rotulo}`)
                  .join(' · ')}
              </p>
            )}
            <AnimatePresence initial={false}>
              {efeitosAbertos && (
                <motion.div
                  initial={reduzir ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-2xl border border-border bg-card p-4">
                    <PainelDeEfeitos ctrl={ctrl} estado={estado} tema="claro" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              {textoDePrivacidade(resumo)}
            </p>
          </motion.section>

          {/* Entrada */}
          <section className="flex flex-col gap-4" aria-label="Entrar na aula">
            <motion.div {...anim(1)}>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> Sala de aula
              </p>
              <h1 className="mt-2 font-heading text-2xl font-semibold leading-tight sm:text-3xl">{saguao?.reserva.titulo || 'Sala de aula'}</h1>
              {saguao?.reserva.inicio && saguao.reserva.fim && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatarEmBrasilia(saguao.reserva.inicio, { weekday: 'long', day: '2-digit', month: '2-digit' })}, {horaEmBrasilia(saguao.reserva.inicio)} às {horaEmBrasilia(saguao.reserva.fim)} (Brasília)
                </p>
              )}
            </motion.div>

            {pedindo && <CartaoDePermissao />}
            {erroSaguao && <CaixaErro mensagem={erroSaguao} />}

            {saguao && (
              <motion.div {...anim(2)} className="rounded-2xl border border-border bg-card p-4" aria-live="polite">
                {saguao.acesso.ok ? (
                  saguao.presentes.length ? (
                    <div className="flex items-center gap-3">
                      <span className="relative flex -space-x-2">
                        {saguao.presentes.slice(0, 3).map((p) => (
                          <Avatar key={p.nome} nome={p.nome} url={p.foto} tamanho={34} className="ring-2 ring-card" />
                        ))}
                        <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-primary/70" aria-hidden />
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
                      A sala abre às <strong>{horaEmBrasilia(saguao.acesso.abreEm)}</strong> ({faltaPara(saguao.acesso.abreEm, agora)}). Enquanto isso, teste sua câmera e seu som aqui. Esta tela libera sozinha.
                    </span>
                  </p>
                ) : (
                  <p className="text-sm">{saguao.acesso.mensagem}</p>
                )}
              </motion.div>
            )}

            {resumo?.ativo && reservaId && (
              <AutorizacaoDoResumo
                reservaId={reservaId}
                resumo={resumo}
                onDecidido={(r) => {
                  setDecidido(r)
                  ctrl.definirResumo(r)
                }}
              />
            )}
            {estado.outraAba && <CaixaAviso tom="info">A aula está aberta em outra aba deste navegador. Entrar aqui fecha a outra.</CaixaAviso>}
            {estado.aviso && <CaixaAviso tom="info">{estado.aviso}</CaixaAviso>}
            <AjudaDeAparelho mic={local.mic} cam={local.cam} />
            {estado.erroAoEntrar && <CaixaErro mensagem={estado.erroAoEntrar} />}

            <motion.div {...anim(3)} className="flex flex-col gap-2">
              <motion.div
                animate={podeEntrar && !reduzir ? { scale: [1, 1.015, 1] } : undefined}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-xl"
              >
                <Button
                  size="lg"
                  className={cn('h-12 w-full rounded-xl text-base font-semibold', podeEntrar && 'shadow-[0_14px_34px_-14px_hsl(var(--primary)/0.85)]')}
                  disabled={!podeEntrar}
                  onClick={() => void ctrl.entrar()}
                >
                  {entrando ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden /> : null}
                  {entrando ? 'Entrando…' : 'Entrar na aula'}
                </Button>
              </motion.div>
              {problema && (
                <Button variant="outline" className="h-11 rounded-xl" onClick={() => void ctrl.tentarAparelhosDeNovo()}>
                  {recarregar ? <RotateCw className="mr-2 h-4 w-4" aria-hidden /> : <RefreshCw className="mr-2 h-4 w-4" aria-hidden />}
                  {recarregar ? 'Recarregar a página' : 'Tentar de novo'}
                </Button>
              )}
              {faltaAutorizar && saguao?.acesso.ok && <p className="text-center text-xs text-muted-foreground">Decida sobre o Resumo por IA acima para entrar.</p>}
              {podeEntrar && !micLigado && !camLigada && (
                <p className="text-center text-xs text-muted-foreground">Você vai entrar com câmera e microfone desligados. Dá para ligar lá dentro.</p>
              )}
            </motion.div>

            <motion.div {...anim(4)}>
              <TesteDeSom trilha={local.audio} micLigado={micLigado} saidaId={prefs.saidaId} />
            </motion.div>

            <motion.div {...anim(5)} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <SeletorDeAparelho rotulo="Câmera" valor={prefs.camId} opcoes={aparelhos.cameras} aoMudar={(id) => void ctrl.trocarAparelho('cam', id)} />
              <SeletorDeAparelho rotulo="Microfone" valor={prefs.micId} opcoes={aparelhos.microfones} aoMudar={(id) => void ctrl.trocarAparelho('mic', id)} />
              {podeEscolherSaida() && <SeletorDeAparelho rotulo="Alto-falante" valor={prefs.saidaId} opcoes={aparelhos.saidas} aoMudar={(id) => void ctrl.trocarAparelho('saida', id)} />}
            </motion.div>

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
        </div>
      </main>
    </div>
  )
}
