'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * A orientação da barra do topo — uma vez por conta, na primeira visita.
 *
 * Passa por cada botão (Foco, carrinho, notificações, Modo Lite) com um anel
 * de destaque e uma bolha que diz para que serve. Só entra quando nada mais
 * está na tela (jornada de perfil, revelação do XP, outra janela) e pula os
 * botões que não existem naquela conta. "Pular" encerra de vez.
 */

const CHAVE = 'da_tour_topo_v1'

const PASSOS: Array<{ alvo: string; titulo: string; texto: string }> = [
  {
    alvo: 'foco',
    titulo: 'Modo Foco',
    texto: 'Cronometre o estudo de qualquer página. O anel mostra seus minutos de hoje — e questões acertadas durante o foco valem +5 XP.',
  },
  { alvo: 'carrinho', titulo: 'Carrinho', texto: 'Os materiais que você escolheu esperam aqui até o pagamento.' },
  { alvo: 'avisos', titulo: 'Notificações', texto: 'Nota de prova, resposta do suporte e novidades chegam aqui. O sino toca quando há algo novo.' },
  { alvo: 'lite', titulo: 'Modo Lite', texto: 'Aparelho lento? Deixa o app mais leve, sem as animações pesadas.' },
]

export function TourDoTopo({ userId }: { userId?: string | null }) {
  const [passos, setPassos] = useState<typeof PASSOS>([])
  const [i, setI] = useState(0)
  const [caixa, setCaixa] = useState<DOMRect | null>(null)

  // Começa 3,5 s depois de carregar, se nada mais estiver aberto.
  useEffect(() => {
    if (!userId) return
    try { if (window.localStorage.getItem(`${CHAVE}:${userId}`)) return } catch { return }
    let tentativas = 0
    const tentar = () => {
      tentativas++
      const ocupado = document.querySelector('.jd-palco, .xp-nivel-palco, .xc-palco, .foco-folha-palco, [role="dialog"][aria-modal="true"]')
      const visiveis = PASSOS.filter((p) => {
        const el = document.querySelector<HTMLElement>(`[data-ferramenta="${p.alvo}"]`)
        return el && el.offsetParent !== null
      })
      if (!ocupado && visiveis.length) {
        setPassos(visiveis)
        setI(0)
        return
      }
      if (tentativas < 6) t = window.setTimeout(tentar, 4000)
    }
    let t = window.setTimeout(tentar, 3500)
    return () => window.clearTimeout(t)
  }, [userId])

  const passo = passos[i]

  const medir = useCallback(() => {
    if (!passo) return
    const el = document.querySelector<HTMLElement>(`[data-ferramenta="${passo.alvo}"]`)
    setCaixa(el ? el.getBoundingClientRect() : null)
  }, [passo])

  useLayoutEffect(() => {
    if (!passo) return
    medir()
    const el = document.querySelector<HTMLElement>(`[data-ferramenta="${passo.alvo}"]`)
    el?.classList.add('tour-alvo')
    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, true)
    return () => {
      el?.classList.remove('tour-alvo')
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir, true)
    }
  }, [passo, medir])

  const encerrar = useCallback(() => {
    try { window.localStorage.setItem(`${CHAVE}:${userId}`, '1') } catch {}
    setPassos([])
  }, [userId])

  if (!passo || !caixa) return null

  const largura = Math.min(300, window.innerWidth - 24)
  const esquerda = Math.max(12, Math.min(window.innerWidth - largura - 12, caixa.left + caixa.width / 2 - largura / 2))
  const seta = Math.max(18, Math.min(largura - 18, caixa.left + caixa.width / 2 - esquerda))

  return createPortal(
    <AnimatePresence>
      <motion.div
        key={passo.alvo}
        className="tour-bolha"
        role="dialog"
        aria-label={`Orientação: ${passo.titulo}`}
        style={{ top: caixa.bottom + 14, left: esquerda, width: largura, ['--seta' as string]: `${seta}px` }}
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      >
        <p className="tour-passo">{i + 1} de {passos.length}</p>
        <p className="tour-titulo">{passo.titulo}</p>
        <p className="tour-texto">{passo.texto}</p>
        <div className="tour-acoes">
          <button type="button" className="tour-pular" onClick={encerrar}>Pular</button>
          <button
            type="button"
            className="tour-proximo"
            onClick={() => (i + 1 < passos.length ? setI(i + 1) : encerrar())}
            autoFocus
          >
            {i + 1 < passos.length ? 'Próximo' : 'Entendi'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}
