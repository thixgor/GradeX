'use client'

/**
 * A barra flutuante da aula (estilo Zoom): uma janela pequena, de vidro, que
 * fica por cima de TUDO — outras abas, o PowerPoint, o PDF — com microfone,
 * câmera, parar de compartilhar, reações, sair e "Anotar" sobre a tela.
 *
 * É o Document Picture-in-Picture do Chrome/Edge (computador): uma janela do
 * próprio navegador onde o React renderiza por portal. Nos outros navegadores
 * ela simplesmente não aparece (as anotações seguem dentro da sala).
 *
 * Dentro dela nada depende do relógio da aba da aula (que o navegador
 * desacelera quando a aba fica oculta): os temporizadores são os da janela.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Hand, Highlighter, LogOut, Maximize2, Mic, MicOff, ScreenShareOff, SmilePlus, Video, VideoOff } from 'lucide-react'
import type { ControladorDaSala, EstadoDaSalaNaTela } from '@/lib/monitorias/sala/cliente/controlador'
import type { MensagemDeAnotacao } from '@/lib/monitorias/sala/tela-anotada'
import { horaEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'
import { VideoAoVivo } from './midia-ao-vivo'
import { CamadaDeAnotacao, FerramentasDeAnotacao, useAnotador } from './camada-anotacao'
import { FileiraDeReacoes } from './reacoes'

interface DocumentPiP {
  window: Window | null
  requestWindow: (o: { width: number; height: number }) => Promise<Window>
}

const TAMANHO = { compacta: { width: 460, height: 150 }, reacoes: { width: 460, height: 200 }, anotando: { width: 760, height: 560 } }

function dpip(): DocumentPiP | null {
  return typeof window !== 'undefined' ? ((window as unknown as { documentPictureInPicture?: DocumentPiP }).documentPictureInPicture ?? null) : null
}

/** Leva as folhas de estilo (Tailwind) e o tema da página para a janela nova. */
function copiarEstilos(de: Document, para: Document): void {
  for (const folha of Array.from(de.styleSheets)) {
    try {
      const regras = Array.from(folha.cssRules)
        .map((r) => r.cssText)
        .join('\n')
      const estilo = para.createElement('style')
      estilo.textContent = regras
      para.head.appendChild(estilo)
    } catch {
      if (folha.href) {
        const link = para.createElement('link')
        link.rel = 'stylesheet'
        link.href = folha.href
        para.head.appendChild(link)
      }
    }
  }
  para.documentElement.className = de.documentElement.className
  const estiloRaiz = de.documentElement.getAttribute('style')
  if (estiloRaiz) para.documentElement.setAttribute('style', estiloRaiz)
}

/**
 * A logo vai para a janela já carregada (blob da própria aba): uma janela nova
 * de PiP pode nascer sem rede para imagem até o primeiro desenho.
 */
let logoDaBarra: string | null = null
async function carregarLogo(): Promise<string> {
  if (logoDaBarra) return logoDaBarra
  try {
    const blob = await fetch('/favicon.png', { cache: 'force-cache' }).then((r) => r.blob())
    logoDaBarra = URL.createObjectURL(blob)
  } catch {
    logoDaBarra = new URL('/favicon.png', window.location.origin).toString()
  }
  return logoDaBarra
}

export function useJanelaFlutuante() {
  const [janela, setJanela] = useState<Window | null>(null)
  const [suportada, setSuportada] = useState(false)
  useEffect(() => setSuportada(!!dpip()), [])

  const abrir = useCallback(async (): Promise<boolean> => {
    const api = dpip()
    if (!api) return false
    if (api.window) {
      setJanela(api.window)
      return true
    }
    try {
      // O pedido da janela vem primeiro: o gesto do usuário vale por pouco tempo.
      const w = await api.requestWindow(TAMANHO.compacta)
      await carregarLogo()
      copiarEstilos(document, w.document)
      w.document.title = 'DomineAqui · Aula ao vivo'
      w.document.body.className = 'm-0 overflow-hidden bg-neutral-950 text-white antialiased'
      w.addEventListener('pagehide', () => setJanela(null), { once: true })
      setJanela(w)
      return true
    } catch {
      // Sem gesto do usuário (ou recusado): quem chamou oferece um botão.
      return false
    }
  }, [])

  const fechar = useCallback(() => {
    dpip()?.window?.close()
    setJanela(null)
  }, [])

  return { suportada, janela, aberta: !!janela, abrir, fechar }
}

function BotaoDeVidro({ rotulo, ativo = true, perigo = false, destaque = false, onClick, children }: { rotulo: string; ativo?: boolean; perigo?: boolean; destaque?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-[background,transform] duration-150 active:scale-90',
        perigo
          ? 'border-rose-400/40 bg-rose-600/90 text-white hover:bg-rose-500'
          : destaque
            ? 'border-white/60 bg-white text-neutral-900'
            : ativo
              ? 'border-white/15 bg-white/10 text-white hover:bg-white/20'
              : 'border-white/40 bg-white/90 text-neutral-900 hover:bg-white',
      )}
    >
      {children}
    </button>
  )
}

/** Quem está falando agora (lido no relógio da janela flutuante, não da aba). */
function useQuemFala(janela: Window, ctrl: ControladorDaSala, estado: EstadoDaSalaNaTela): string | null {
  const [quem, setQuem] = useState<string | null>(null)
  const pessoas = useMemo(() => estado.participantes.filter((p) => p.fase === 'conectado').map((p) => ({ pid: p.pid, nome: p.nome })), [estado.participantes])
  useEffect(() => {
    const t = janela.setInterval(() => {
      let melhor: { nome: string; n: number } | null = null
      for (const p of pessoas) {
        const n = ctrl.nivelDeAudio(p.pid)
        if (n > 0.04 && (!melhor || n > melhor.n)) melhor = { nome: p.nome, n }
      }
      setQuem(melhor?.nome ?? null)
    }, 350)
    return () => janela.clearInterval(t)
  }, [janela, ctrl, pessoas])
  return quem
}

function ConteudoDaBarra({ janela, ctrl, estado, fim, aoFechar }: { janela: Window; ctrl: ControladorDaSala; estado: EstadoDaSalaNaTela; fim: string | null; aoFechar: () => void }) {
  const [reacoes, setReacoes] = useState(false)
  const [anotando, setAnotando] = useState(false)
  const [sair, setSair] = useState(false)
  const [alvo, setAlvo] = useState<HTMLDivElement | null>(null)
  const quemFala = useQuemFala(janela, ctrl, estado)
  const micLigado = estado.local.mic === 'ligado'
  const camLigada = estado.local.cam === 'ligado'
  const compartilhando = !!estado.local.tela
  const ehAluno = estado.eu?.papel === 'aluno'
  const telaRemota = estado.participantes.find((p) => p.compartilhando && p.tela)
  const telaNoPalco = estado.local.tela || telaRemota?.tela || null
  const podeAnotar = !!telaNoPalco && ctrl.possoAnotar
  const codigo = (estado.reserva?.id || '').slice(-6).toUpperCase()
  const aoAnotar = useCallback((m: MensagemDeAnotacao) => ctrl.anotar(m), [ctrl])
  const anotador = useAnotador(estado.eu?.pid ?? null, estado.tracos, aoAnotar)

  // A janela cresce para anotar e volta a ser uma barra depois.
  useEffect(() => {
    const t = anotando && podeAnotar ? TAMANHO.anotando : reacoes ? TAMANHO.reacoes : TAMANHO.compacta
    try {
      janela.resizeTo(t.width, t.height)
    } catch {
      /* sem gesto: fica do tamanho que está */
    }
  }, [janela, anotando, reacoes, podeAnotar])
  useEffect(() => {
    if (!podeAnotar) setAnotando(false)
  }, [podeAnotar])
  useEffect(() => {
    if (!sair) return
    const t = janela.setTimeout(() => setSair(false), 4_000)
    return () => janela.clearTimeout(t)
  }, [sair, janela])

  return (
    <div className="flex h-screen w-screen flex-col gap-2 bg-[radial-gradient(40rem_16rem_at_0%_0%,hsl(var(--primary)/0.30),transparent),radial-gradient(30rem_14rem_at_100%_100%,rgba(99,102,241,0.25),transparent)] p-2.5 font-sans">
      {/* Cabeçalho: marca, aula, quem fala */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.07] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDaBarra || '/favicon.png'} alt="DomineAqui" width={26} height={26} className="h-[26px] w-[26px] rounded-lg" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-bold tracking-tight">
            DomineAqui <span className="font-medium text-white/55">· Monitoria #{codigo}</span>
          </p>
          <p className="flex items-center gap-1.5 truncate text-[11px] text-white/65">
            {quemFala ? (
              <>
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/70" />
                  <span className="relative h-2 w-2 rounded-full bg-primary" />
                </span>
                {quemFala} está falando
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Ao vivo{fim ? ` · até ${horaEmBrasilia(fim)}` : ''}
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.focus()
            aoFechar()
          }}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-white/80 hover:bg-white/10"
          title="Voltar para a aula"
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden /> Aula
        </button>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-1.5">
        <BotaoDeVidro rotulo={micLigado ? 'Desligar microfone' : 'Ligar microfone'} ativo={micLigado} onClick={() => void ctrl.alternarMic()}>
          {micLigado ? <Mic className="h-[18px] w-[18px]" /> : <MicOff className="h-[18px] w-[18px]" />}
        </BotaoDeVidro>
        <BotaoDeVidro rotulo={camLigada ? 'Desligar câmera' : 'Ligar câmera'} ativo={camLigada} onClick={() => void ctrl.alternarCam()}>
          {camLigada ? <Video className="h-[18px] w-[18px]" /> : <VideoOff className="h-[18px] w-[18px]" />}
        </BotaoDeVidro>
        {compartilhando && (
          <BotaoDeVidro rotulo="Parar de compartilhar a tela" perigo onClick={() => void ctrl.alternarTela()}>
            <ScreenShareOff className="h-[18px] w-[18px]" />
          </BotaoDeVidro>
        )}
        {ehAluno && (
          <BotaoDeVidro rotulo={estado.mao ? 'Baixar a mão' : 'Levantar a mão'} destaque={estado.mao} onClick={() => ctrl.alternarMao()}>
            <Hand className="h-[18px] w-[18px]" />
          </BotaoDeVidro>
        )}
        <BotaoDeVidro rotulo="Reações" destaque={reacoes} onClick={() => setReacoes((r) => !r)}>
          <SmilePlus className="h-[18px] w-[18px]" />
        </BotaoDeVidro>
        {podeAnotar && (
          <BotaoDeVidro rotulo={anotando ? 'Parar de anotar' : 'Anotar na tela'} destaque={anotando} onClick={() => setAnotando((a) => !a)}>
            <Highlighter className="h-[18px] w-[18px]" />
          </BotaoDeVidro>
        )}
        <span className="mx-0.5 h-6 w-px bg-white/15" aria-hidden />
        <button
          type="button"
          onClick={() => (sair ? ctrl.sair() : setSair(true))}
          className={cn(
            'inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
            sair ? 'border-rose-300/50 bg-rose-600 text-white' : 'border-rose-400/40 bg-rose-600/85 text-white hover:bg-rose-500',
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden /> {sair ? 'Confirmar' : 'Sair'}
        </button>
      </div>

      {reacoes && (
        <FileiraDeReacoes
          compacta
          aoReagir={(e) => ctrl.reagir(e)}
          className="mx-auto rounded-full border border-white/15 bg-white/[0.07] p-1 backdrop-blur-2xl"
        />
      )}

      {anotando && podeAnotar && telaNoPalco && (
        <>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black">
            <div ref={setAlvo} className="relative h-full w-full">
              <VideoAoVivo stream={telaNoPalco} versao={estado.local.versao + (telaRemota?.versaoDasTrilhas ?? 0)} contain rotulo="Tela compartilhada" />
              <CamadaDeAnotacao alvo={alvo} tracos={estado.tracos} desenhando ferramenta={anotador.ferramenta} cor={anotador.cor} aoAnotar={aoAnotar} />
            </div>
          </div>
          <div className="flex justify-center">
            <FerramentasDeAnotacao
              compacta
              ferramenta={anotador.ferramenta}
              cor={anotador.cor}
              aoFerramenta={anotador.setFerramenta}
              aoCor={anotador.setCor}
              aoDesfazer={anotador.desfazer}
              aoLimpar={anotador.limpar}
            />
          </div>
          <p className="text-center text-[11px] text-white/55">Todos na aula veem o que você desenhar por cima da tela.</p>
        </>
      )}
    </div>
  )
}

/** Renderiza a barra dentro da janela flutuante, quando ela está aberta. */
export function BarraFlutuante({ janela, ctrl, estado, fim, aoFechar }: { janela: Window | null; ctrl: ControladorDaSala; estado: EstadoDaSalaNaTela; fim: string | null; aoFechar: () => void }) {
  if (!janela) return null
  return createPortal(<ConteudoDaBarra janela={janela} ctrl={ctrl} estado={estado} fim={fim} aoFechar={aoFechar} />, janela.document.body)
}
