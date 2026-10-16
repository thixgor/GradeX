'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { ControladorDaSala, type EstadoDaSalaNaTela } from '@/lib/monitorias/sala/cliente/controlador'

const nenhum = () => () => {}
const nulo = () => null

/**
 * A sala de aula na tela: um controlador por montagem (o StrictMode do
 * desenvolvimento monta duas vezes, e cada montagem desliga tudo o que abriu).
 */
export function useSalaDeAula(reservaId: string): { ctrl: ControladorDaSala | null; estado: EstadoDaSalaNaTela | null } {
  const [ctrl, setCtrl] = useState<ControladorDaSala | null>(null)
  useEffect(() => {
    const c = new ControladorDaSala(reservaId)
    setCtrl(c)
    void c.iniciar()
    return () => c.destruir()
  }, [reservaId])
  const estado = useSyncExternalStore(ctrl ? ctrl.assinar : nenhum, ctrl ? ctrl.obter : nulo, nulo)
  return { ctrl, estado }
}
