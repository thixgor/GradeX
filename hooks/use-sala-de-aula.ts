'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { ControladorDaSala, type EstadoDaSalaNaTela } from '@/lib/monitorias/sala/cliente/controlador'

const nenhum = () => () => {}
const nulo = () => null

/**
 * A sala de aula na tela: um controlador por montagem (o StrictMode do
 * desenvolvimento monta duas vezes, e cada montagem desliga tudo o que abriu).
 */
export function useSalaDeAula(reservaId: string, ativo = true): { ctrl: ControladorDaSala | null; estado: EstadoDaSalaNaTela | null } {
  const [ctrl, setCtrl] = useState<ControladorDaSala | null>(null)
  useEffect(() => {
    if (!ativo) return
    const c = new ControladorDaSala(reservaId)
    setCtrl(c)
    void c.iniciar()
    return () => c.destruir()
  }, [reservaId, ativo])
  const estado = useSyncExternalStore(ctrl ? ctrl.assinar : nenhum, ctrl ? ctrl.obter : nulo, nulo)
  return { ctrl, estado }
}

const MARCA_DE_RECARGA = 'domineaqui:sala:recarregou'

/**
 * A sala precisa ser um documento NOVO: o cabeçalho que libera o microfone
 * (`Permissions-Policy: microphone=(self)`) só vale para a página carregada
 * pelo navegador. Chegando por navegação interna do site (um link, o sino), o
 * documento continua com a política da página anterior (`microphone=()`) e o
 * navegador recusa o microfone mesmo com "Permitir" no cadeado. Nesse caso,
 * recarrega uma vez antes de pedir qualquer aparelho.
 */
export function precisaRecarregarASala(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const caminho = (u: string) => new URL(u, location.href).pathname.replace(/\/$/, '')
    const carregouAqui = !nav || caminho(nav.name) === caminho(location.href)
    // Sem efeito colateral aqui (o React pode chamar duas vezes): a marca
    // "já recarreguei" é gravada só na hora de recarregar.
    if (carregouAqui) return false
    return sessionStorage.getItem(MARCA_DE_RECARGA) !== location.pathname
  } catch {
    return false
  }
}

/** Recarrega a sala uma vez só (a marca evita laço se o navegador insistir). */
export function recarregarASala(): void {
  try {
    sessionStorage.setItem(MARCA_DE_RECARGA, location.pathname)
  } catch {
    /* sem storage: recarrega assim mesmo; na volta "carregou aqui" */
  }
  location.replace(location.href)
}

/** Chamado quando a sala carregou como documento próprio: limpa a marca. */
export function salaCarregouDireito(): void {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav && new URL(nav.name).pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, '')) sessionStorage.removeItem(MARCA_DE_RECARGA)
  } catch {
    /* nada */
  }
}
