'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInstalarApp } from '@/hooks/use-instalar-app'
import {
  instrucoesDe,
  type Instrucoes,
  type PlataformaInstalacao,
} from '@/lib/pwa/instalacao'
import {
  abaInicial,
  rotuloDetectado,
  tituloPara,
} from '@/lib/pwa/conteudo'

/**
 * Em que ponto da instalação a pessoa está. É isto que a UI desenha — em vez de
 * cada tela recombinar `pronto`, `podeInstalarAgora` e `jaInstalado` do seu
 * jeito (e cada uma errar um caso diferente).
 */
/** Quanto esperamos pelo diálogo nativo antes de assumir que ele não vem. */
const ESPERA_PROMPT_NATIVO_MS = 4000

export type EstadoDoFluxo =
  /** Ainda não sabemos o aparelho: só o servidor renderizou. */
  | 'detectando'
  /** Já está rodando como app — não há nada a instalar. */
  | 'instalado'
  /** O navegador entregou o diálogo nativo: um toque resolve. */
  | 'um-toque'
  /** Sem diálogo nativo: o caminho é o passo a passo do navegador. */
  | 'passo-a-passo'

export interface FluxoInstalacao {
  estado: EstadoDoFluxo
  plataforma: PlataformaInstalacao
  /** Título já personalizado ("O DomineAqui no seu Samsung"). */
  titulo: string
  /** Nome do navegador detectado, ou `null` se não deu para saber. */
  detectado: string | null
  /** Aba aberta no passo a passo. */
  aba: PlataformaInstalacao
  escolherAba: (aba: PlataformaInstalacao) => void
  /** Passos da aba aberta (não necessariamente os do aparelho atual). */
  instrucoesDaAba: Instrucoes
  /** O diálogo nativo está aberto agora, esperando a resposta da pessoa. */
  abrindoDialogo: boolean
  /** A pessoa respondeu "agora não" ao diálogo nativo. */
  recusou: boolean
  instalar: () => Promise<void>
}

/**
 * O fluxo de instalação inteiro, sem uma linha de JSX.
 *
 * Existe para que a seção `#app` da landing e a página `/instalar` sejam a
 * mesma coisa de verdade — mesmo estado, mesmas abas, mesmo título — e não duas
 * implementações parecidas que envelhecem separadas. A landing tinha a sua
 * própria cópia disto, com um `addEventListener('beforeinstallprompt')` dentro
 * de `useEffect` que chegava tarde demais e perdia o evento; quem estava num
 * Android via instrução de iPhone.
 */
export function useFluxoInstalacao(): FluxoInstalacao {
  const {
    pronto,
    plataforma,
    userAgent,
    podeInstalarAgora,
    aguardandoPromptNativo,
    jaInstalado,
    instalar: dispararDialogo,
  } = useInstalarApp()

  const [aba, setAba] = useState<PlataformaInstalacao>('android-samsung')
  const [tocouNaAba, setTocouNaAba] = useState(false)
  const [abrindoDialogo, setAbrindoDialogo] = useState(false)
  const [recusou, setRecusou] = useState(false)
  const [esperaEsgotada, setEsperaEsgotada] = useState(false)

  // Teto para a espera pelo diálogo nativo. O `beforeinstallprompt` costuma
  // chegar em menos de 1s; passou disso, ou aquele navegador não dispara o
  // evento, ou o Chrome ainda não considera o site "engajado" o bastante. Sem
  // este teto o CTA ficaria em "detectando" para sempre, e a pessoa nunca veria
  // o caminho manual — que funciona em todos os casos.
  useEffect(() => {
    const t = setTimeout(() => setEsperaEsgotada(true), ESPERA_PROMPT_NATIVO_MS)
    return () => clearTimeout(t)
  }, [])

  // Enquanto a pessoa não escolher uma aba, ela acompanha o aparelho detectado.
  // Depois do primeiro toque, a escolha dela manda — quem está no computador
  // conferindo a instrução do celular do plantão não quer a aba voltando.
  useEffect(() => {
    if (!pronto || tocouNaAba) return
    setAba(abaInicial(plataforma))
  }, [pronto, plataforma, tocouNaAba])

  const escolherAba = useCallback((nova: PlataformaInstalacao) => {
    setAba(nova)
    setTocouNaAba(true)
  }, [])

  const instalar = useCallback(async () => {
    setAbrindoDialogo(true)
    const resultado = await dispararDialogo()
    setAbrindoDialogo(false)
    // "Agora não" não é um beco: o passo a passo logo abaixo instala do mesmo
    // jeito, e é para lá que a mensagem aponta.
    if (resultado === 'recusado' || resultado === 'indisponivel') setRecusou(true)
  }, [dispararDialogo])

  const estado: EstadoDoFluxo = !pronto
    ? 'detectando'
    : jaInstalado
      ? 'instalado'
      : podeInstalarAgora
        ? 'um-toque'
        : // Enquanto o evento ainda pode chegar, seguramos o veredito: anunciar
          // "siga o passo a passo" seria ensinar um caminho pior do que o botão
          // prestes a existir.
          aguardandoPromptNativo && !esperaEsgotada
          ? 'detectando'
          : 'passo-a-passo'

  return {
    estado,
    plataforma,
    titulo: useMemo(
      () => tituloPara(pronto ? plataforma : 'desconhecida', pronto ? userAgent : ''),
      [pronto, plataforma, userAgent],
    ),
    detectado: pronto ? rotuloDetectado(plataforma) : null,
    aba,
    escolherAba,
    instrucoesDaAba: useMemo(() => instrucoesDe(aba), [aba]),
    abrindoDialogo,
    recusou,
    instalar,
  }
}
