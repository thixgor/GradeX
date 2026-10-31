'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { DomMascote, PREVIA } from './dom-mascote'
import { carregarDesenho, desenhoCarregado } from './desenhos'
import { domOcultoAqui, ondeDaSecao, rotaDeResolucao, rotaSemDom, secaoDaRota, type SecaoDoDom } from './secoes'
import { useUIPreferences } from '@/hooks/use-ui-preferences'
import { useArrastar } from './use-arrastar'
import { DomReacoes } from './dom-reacoes'
import { falaDe, momentoDaSaudacao, textoDaFala, type Fala, type MomentoDaFala } from './falas'
import { falar, pararDeFalar } from './voz'
import { useMudo } from './use-mudo'
import type { ContextoDoMaterial } from './dom-assistente'
import './dom.css'

/**
 * O Dom flutuante — o que toda página da área logada carrega.
 *
 * - **Botão**: o busto do Dom num anel em órbita. O painel (conversa,
 *   socrático) é um chunk à parte, baixado no primeiro toque (ou quando o
 *   mouse passa por cima); o desenho só é pedido depois que a página assentou.
 * - **Balão de contexto**: nas vitrines (/materiais, /pacotes, /buy) e no
 *   leitor, uma fala engraçadinha e persuasiva da página, uma vez por sessão
 *   em cada tipo de página; no resto do site, a saudação uma vez por dia.
 * - **Aparições** (`DomReacoes`): conquistas da plataforma fazem o Dom entrar
 *   na tela e comemorar.
 *
 * O painel aberto sobrevive à navegação: "vou te levar lá" troca de página e
 * o Dom continua aberto do outro lado (`sessionStorage`).
 */

const carregarPainel = () => import('./dom-assistente').then((m) => m.DomAssistente)
const DomAssistente = dynamic(carregarPainel, { ssr: false })

const CHAVE_ABERTO = 'dom:aberto'

/**
 * Painel aberto nesta visita: na troca de página o Dom nasce aberto e SEM
 * animação de entrada, saudação ou bipe — continua a conversa, não "chega de
 * novo" (era o piscar a cada navegação).
 */
let abertoEmMemoria: boolean | null = null
const CHAVE_BALAO_DIA = 'dom:balao-dia'

/** A fala de contexto da página (vitrines e leitor), se houver. */
function momentoDaPagina(pathname: string, noLeitor: boolean): MomentoDaFala | null {
  if (noLeitor) return 'paginaLeitor'
  if (pathname === '/buy' || pathname === '/upgrade') return 'paginaPlanos'
  if (pathname.startsWith('/pacotes')) return 'paginaPacotes'
  if (pathname.startsWith('/materiais')) return 'paginaMateriais'
  return null
}

function hoje(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function lerArmazenado(chave: string, onde: 'local' | 'sessao'): string | null {
  try {
    return (onde === 'local' ? localStorage : sessionStorage).getItem(chave)
  } catch {
    return null
  }
}
function gravarArmazenado(chave: string, valor: string, onde: 'local' | 'sessao') {
  try {
    ;(onde === 'local' ? localStorage : sessionStorage).setItem(chave, valor)
  } catch {}
}

export function DomLancador({
  nome = '',
  material,
  escondido = false,
  foco = false,
}: {
  nome?: string
  material?: ContextoDoMaterial | null
  /** A tela pediu para sumir (ex.: "ocultar barras" do leitor de PDF). O estado fica guardado. */
  escondido?: boolean
  /**
   * Modo foco (prova valendo, com trava, em andamento): sem botão nem painel,
   * só as comemorações. Se o painel estava aberto, ele fecha.
   */
  foco?: boolean
}) {
  const pathname = usePathname() || '/'
  const [aberto, setAberto] = useState(() => abertoEmMemoria === true)
  // Continuação = já estava aberto na página anterior.
  const [continuacao] = useState(() => abertoEmMemoria === true)
  const [mascoteLiberado, setMascoteLiberado] = useState(() => desenhoCarregado('dom') !== null)
  const { domOcultoEm, hydrated: preferenciasLidas, setDomOculto } = useUIPreferences()
  const [aviso, setAviso] = useState<SecaoDoDom | null>(null)
  const [balao, setBalao] = useState<string | null>(null)
  const [falando, setFalando] = useState(false)
  const [boca, setBoca] = useState(false)
  const [oculto, setOculto] = useState(false)
  const mudo = useMudo()
  // Uma aparição (conquista) na tela: o botão e o balão saem da frente.
  const [reagindo, setReagindo] = useState(false)
  const arrasto = useArrastar<HTMLDivElement>()
  const primeiroNome = (nome.trim().split(/\s+/)[0] || '').replace(/^./, (c) => c.toUpperCase())

  // Recarregou a página com o painel aberto: reabre (aí sim, como chegada nova).
  useEffect(() => {
    if (abertoEmMemoria === null) {
      abertoEmMemoria = lerArmazenado(CHAVE_ABERTO, 'sessao') === '1'
      if (abertoEmMemoria) setAberto(true)
    }
  }, [])

  const abrir = useCallback(() => {
    setBalao(null)
    pararDeFalar()
    setAberto(true)
    abertoEmMemoria = true
    gravarArmazenado(CHAVE_ABERTO, '1', 'sessao')
  }, [])
  const fechar = useCallback(() => {
    setAberto(false)
    abertoEmMemoria = false
    gravarArmazenado(CHAVE_ABERTO, '0', 'sessao')
  }, [])

  // A prova entrou em modo foco com o painel aberto: fecha (e não reabre
  // sozinho depois da entrega).
  useEffect(() => {
    if (foco) {
      pararDeFalar()
      fechar()
      setBalao(null)
    }
  }, [foco, fechar])

  // Escondido nesta seção (escolha da pessoa) ou pela própria tela.
  const secao = secaoDaRota(pathname, !!material)
  const ocultoPelaPessoa = preferenciasLidas && domOcultoAqui(domOcultoEm, pathname, !!material)
  const esconderAqui = useCallback(() => {
    pararDeFalar()
    fechar()
    setDomOculto(secao, true)
    setAviso(secao)
  }, [fechar, secao, setDomOculto])
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 9000)
    return () => clearTimeout(t)
  }, [aviso])
  useEffect(() => {
    if (escondido || ocultoPelaPessoa) pararDeFalar()
  }, [escondido, ocultoPelaPessoa])

  // Desenho em camadas depois que a página assentou (não disputa banda com
  // ela); até lá o botão mostra a prévia de 17 KB, que aparece na hora.
  useEffect(() => {
    const ocioso = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: { timeout: number }) => number)
    const liberar = () => {
      void carregarDesenho('dom').catch(() => {})
      setMascoteLiberado(true)
    }
    const t = ocioso ? ocioso(liberar, { timeout: 1500 }) : window.setTimeout(liberar, 800)
    return () => {
      if (!ocioso) clearTimeout(t)
    }
  }, [])

  // Balão: fala da página (uma vez por sessão em cada tipo) ou saudação do dia.
  useEffect(() => {
    if (aberto || escondido || foco || ocultoPelaPessoa || rotaSemDom(pathname)) return
    const daPagina = momentoDaPagina(pathname, !!material)
    let momento: MomentoDaFala | null = null
    let marcar: () => void = () => {}
    if (daPagina) {
      const chave = `dom:balao:${daPagina}`
      if (lerArmazenado(chave, 'sessao')) return
      momento = daPagina
      marcar = () => gravarArmazenado(chave, '1', 'sessao')
    } else {
      if (lerArmazenado(CHAVE_BALAO_DIA, 'local') === hoje()) return
      momento = momentoDaSaudacao()
      marcar = () => gravarArmazenado(CHAVE_BALAO_DIA, hoje(), 'local')
    }
    let fala: Fala | null = null
    const mostrar = setTimeout(() => {
      fala = falaDe(momento!)
      setBalao(textoDaFala(fala))
      marcar()
      falar(fala, { aoComecar: () => setFalando(true), aoTerminar: () => setFalando(false), aoBoca: setBoca })
    }, 5000)
    const esconder = setTimeout(() => setBalao(null), 15000)
    return () => {
      clearTimeout(mostrar)
      clearTimeout(esconder)
    }
  }, [pathname, material, aberto, escondido, foco, ocultoPelaPessoa])

  // Animações param com a aba oculta.
  useEffect(() => {
    const ver = () => setOculto(document.visibilityState !== 'visible')
    document.addEventListener('visibilitychange', ver)
    return () => document.removeEventListener('visibilitychange', ver)
  }, [])

  // Antes de ler as preferências (só no primeiro carregamento da visita), não
  // aparece: senão quem escondeu o Dom aqui o veria piscar e sumir.
  if (!preferenciasLidas) return null

  // Escondido pela pessoa aqui: nada do Dom (nem as comemorações). Só o aviso
  // de onde trazer de volta, por alguns segundos, com "Desfazer".
  if (ocultoPelaPessoa) {
    return aviso ? (
      <div className="dom-escopo">
        <div className="dom-aviso-oculto" role="status">
          <span>
            Dom escondido {ondeDaSecao(aviso)}. Para trazer de volta: <strong>Perfil › Ajustes</strong>.
          </span>
          <button
            type="button"
            onClick={() => {
              setDomOculto(aviso, false)
              setAviso(null)
            }}
          >
            Desfazer
          </button>
        </div>
      </div>
    ) : null
  }

  // Login/checkout, ou prova valendo com trava: sem botão nem painel, mas o
  // Dom ainda aparece para comemorar o foguinho e o resultado.
  if (foco || rotaSemDom(pathname)) {
    return (
      <div className="dom-escopo" data-oculto={oculto || undefined}>
        {mascoteLiberado && <DomReacoes painelAberto={false} />}
      </div>
    )
  }

  return (
    // `hidden` (e não desmontar): o leitor oculta as barras e o Dom some junto,
    // mas a conversa aberta continua lá quando as barras voltam.
    <div className="dom-escopo" data-oculto={oculto || undefined} hidden={escondido}>
      <div
        ref={arrasto.ref}
        className="dom-lancador"
        data-aberto={aberto || reagindo ? '1' : '0'}
        data-lado={arrasto.lado}
        data-resolucao={rotaDeResolucao(pathname) || undefined}
        data-arrastando={arrasto.arrastando || undefined}
        data-posicionado={arrasto.estilo ? '1' : undefined}
        style={{ ...arrasto.estilo, ['--dom-incl' as string]: `${arrasto.inclinacao}deg` }}
      >
        {balao && !reagindo && (
          <button type="button" className="dom-lancador__balao" onClick={abrir}>
            <strong>Dom · DomineAqui AI</strong>
            {balao}
          </button>
        )}
        <button
          type="button"
          className="dom-lancador__botao"
          onClick={() => {
            if (!arrasto.foiArrasto()) abrir()
          }}
          onPointerEnter={() => void carregarPainel()}
          onFocus={() => void carregarPainel()}
          {...arrasto.eventos}
          title="Toque para conversar · arraste para mudar de lugar"
          aria-label={primeiroNome ? `Abrir o Dom, assistente de IA de ${primeiroNome}` : 'Abrir o Dom, assistente de IA'}
          aria-haspopup="dialog"
        >
          <span className="dom-lancador__miolo">
            <span className="dom-busto">
              {mascoteLiberado ? (
                <DomMascote estado={arrasto.arrastando ? 'animado' : balao ? 'acenando' : 'parado'} falando={falando} boca={boca} calado={mudo && !falando} simples />
              ) : (
                <img className="dom-busto__previa" src={PREVIA} alt="" draggable={false} />
              )}
            </span>
          </span>
          <span className="dom-lancador__status" aria-hidden />
          <span className="dom-lancador__rotulo" aria-hidden>
            IA
          </span>
        </button>
        {/* Esconder aqui (aparece ao passar o mouse; no toque, fica no painel). */}
        <button type="button" className="dom-lancador__esconder" onClick={esconderAqui} title={`Esconder o Dom ${ondeDaSecao(secao)}`} aria-label={`Esconder o Dom ${ondeDaSecao(secao)}`}>
          <X className="h-3 w-3" aria-hidden />
        </button>
      </div>
      {mascoteLiberado && <DomReacoes painelAberto={aberto} aoMudar={setReagindo} />}
      {aberto && (
        <DomAssistente
          nome={primeiroNome}
          material={material}
          rota={pathname}
          aoFechar={fechar}
          continuacao={continuacao}
          aoEsconder={esconderAqui}
          ondeEsconder={ondeDaSecao(secao)}
        />
      )}
    </div>
  )
}
