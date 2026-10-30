'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DomGuia, type PassoDoGuia } from './dom-guia'

/**
 * O Dom na landing: chama o visitante e, no toque, passeia pela página
 * explicando — herói, Banco de Questões, flashcards, Manual Clínico,
 * materiais, ele mesmo (a IA), planos e o convite final para criar a conta.
 *
 * Quem disse "Agora não" não é chamado de novo por uma semana; quem terminou
 * o passeio, por um mês.
 */

const CHAVE = 'dom:guia-landing'
const SEMANA = 7 * 86_400_000
const MES = 30 * 86_400_000

export default function GuiaDaLanding() {
  const router = useRouter()
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    try {
      const ate = Number(localStorage.getItem(CHAVE)) || 0
      if (ate > Date.now()) return
    } catch {}
    setMostrar(true)
  }, [])

  if (!mostrar) return null

  const passos: PassoDoGuia[] = [
    { momento: 'landingOla', alvo: '#top', lado: 'direita' },
    { momento: 'landingQuestoes', alvo: '[data-produto="banco"]', lado: 'esquerda' },
    { momento: 'landingFlashcards', alvo: '[data-produto="flashcards"]', lado: 'direita' },
    { momento: 'landingManual', alvo: '[data-produto="manual"]', lado: 'esquerda' },
    { momento: 'landingMateriais', alvo: '#produtos', lado: 'direita' },
    { momento: 'landingDom', alvo: '#como-funciona', lado: 'esquerda' },
    { momento: 'landingPlanos', alvo: '#planos', lado: 'direita' },
    {
      momento: 'landingFim',
      alvo: '#cta-final',
      lado: 'esquerda',
      acao: { rotulo: 'Criar minha conta', aoTocar: () => router.push('/auth/login?mode=register') },
    },
  ]

  return (
    <DomGuia
      passos={passos}
      convite="landingConvite"
      aoFim={(concluiu) => {
        try {
          localStorage.setItem(CHAVE, String(Date.now() + (concluiu ? MES : SEMANA)))
        } catch {}
      }}
    />
  )
}
