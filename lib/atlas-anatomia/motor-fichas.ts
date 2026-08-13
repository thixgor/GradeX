'use client'

import { useEffect, useState } from 'react'
import type { AtlasMarker } from './estrutura'
import type { ContextoMarcador, MarkerInsight } from './insights'

/**
 * Carregamento sob demanda do conteúdo das fichas.
 *
 * `insights` puxa o dicionário de estruturas, os contextos regionais e o
 * classificador: 111 KB comprimidos de texto editorial. Nada disso é preciso
 * para escolher um sistema, escolher uma região ou olhar a prancha — só quando
 * o aluno toca num marcador. Deixar tudo no mesmo pacote fazia a primeira tela
 * do Atlas esperar por conteúdo que talvez nem fosse aberto.
 *
 * Como o custo real é a espera, e não os bytes, a área de estudo chama
 * `prepararMotorDeFichas()` assim que a prancha aparece. Na prática o módulo
 * termina de chegar enquanto o aluno ainda está olhando a peça, e o toque no
 * marcador abre a ficha na hora.
 */

type Motor = typeof import('./insights')
export type CalcularFicha = (marcador: AtlasMarker, contexto: ContextoMarcador) => MarkerInsight

let motor: Motor | null = null
let promessa: Promise<Motor> | null = null

export function prepararMotorDeFichas(): Promise<Motor> {
  if (motor) return Promise.resolve(motor)
  if (!promessa) {
    promessa = import('./insights')
      .then(modulo => {
        motor = modulo
        return modulo
      })
      .catch(erro => {
        promessa = null
        throw erro
      })
  }
  return promessa
}

/**
 * Devolve a função que monta a ficha, ou `null` enquanto o módulo não chegou.
 *
 * Quem consome mostra o nome da estrutura nesse intervalo — que é justamente o
 * primeiro nível da ficha —, então a espera não deixa a tela vazia.
 */
export function useMotorDeFichas(): CalcularFicha | null {
  const [pronto, setPronto] = useState<Motor | null>(motor)

  useEffect(() => {
    if (pronto) return
    let ativo = true
    prepararMotorDeFichas()
      .then(modulo => {
        if (ativo) setPronto(modulo)
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [pronto])

  return pronto?.getMarkerInsight ?? null
}
