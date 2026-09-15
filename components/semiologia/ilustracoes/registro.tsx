'use client'

import type { ComponentType } from 'react'
import type { PropsDeIlustracao } from './base'
import { Fundoscopia } from './fundoscopia'
import { Otoscopia } from './otoscopia'
import { Pupilas } from './pupilas'
import {
  AranhaVascular,
  Ascite,
  Asterixe,
  Baqueteamento,
  Blumberg,
  Cianose,
  Edema,
  EnchimentoCapilar,
  Ictericia,
  Jugular,
  Murphy,
  Palidez,
} from './sinais'
import { Ultrassom } from './ultrassom'
import { Orofaringe, Rinoscopia } from './vias-aereas'

/**
 * O identificador que o dado guarda vira componente aqui — e só aqui.
 *
 * A camada de dado (`lib/semiologia/*`) não importa React de propósito: assim
 * um módulo de servidor monta catálogo, sitemap e busca sem arrastar um único
 * byte de SVG para o bundle. O preço é esta tabela, e ela é barata: uma linha
 * por figura, num arquivo só, com o `Ausente` cobrindo o caso de alguém
 * registrar um id no dado antes de a figura existir.
 *
 * Registrar a figura no dado antes de desenhá-la é, aliás, o fluxo pretendido:
 * o conteúdo pode ser escrito e revisado por quem não desenha, e a página
 * mostra uma lacuna honesta em vez de quebrar.
 */
const REGISTRO: Record<string, ComponentType<PropsDeIlustracao>> = {
  ictericia: Ictericia,
  edema: Edema,
  cianose: Cianose,
  jugular: Jugular,
  baqueteamento: Baqueteamento,
  ascite: Ascite,
  asterixe: Asterixe,
  'enchimento-capilar': EnchimentoCapilar,
  palidez: Palidez,
  'aranha-vascular': AranhaVascular,
  murphy: Murphy,
  blumberg: Blumberg,
  otoscopia: Otoscopia,
  fundoscopia: Fundoscopia,
  orofaringe: Orofaringe,
  rinoscopia: Rinoscopia,
  pupilas: Pupilas,
  ultrassom: Ultrassom,
}

export function temIlustracao(id: string): boolean {
  return id in REGISTRO
}

export function Ilustracao({
  id,
  ...resto
}: PropsDeIlustracao & { id: string }) {
  const Figura = REGISTRO[id] ?? Ausente
  return <Figura {...resto} />
}

/** Lacuna honesta: diz que a figura ainda não foi desenhada. */
function Ausente({ className = '', titulo }: PropsDeIlustracao) {
  return (
    <div
      className={`flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground ${className}`}
    >
      {titulo ? `Figura em produção: ${titulo}` : 'Figura em produção'}
    </div>
  )
}
