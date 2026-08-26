'use client'

/**
 * O registro de cargos no navegador.
 *
 * ## Por que existe
 *
 * Antes do registro, cada tela que precisava mostrar um cargo carregava a
 * própria cópia da lista: o selo do perfil tinha um `switch`, a lista de
 * usuários do admin tinha outro, o seletor de plano tinha um `<select>` fixo e
 * `/admin/materiais` tinha um array `ACCESS_GROUPS` inteiro. Quatro listas para
 * o mesmo fato, e nenhuma delas sabia do Quest quando ele foi criado.
 *
 * Aqui a lista é uma só, vem do servidor e cresce sozinha quando o admin cria
 * um cargo.
 *
 * ## Cache de módulo, não de componente
 *
 * O registro é o mesmo para toda a página e muda uma vez por mês, no máximo.
 * Guardar no módulo (e não em `useState` por componente) faz a barra lateral,
 * o cabeçalho da conta e o cartão de plano dividirem a mesma requisição em vez
 * de dispararem três. A promessa em voo também é compartilhada: dois
 * componentes montando juntos numa página fria fazem uma ida só.
 */

import { useEffect, useState } from 'react'
import {
  cargoPublico,
  cargosEmbutidos,
  classesDaCor,
  hexDaCor,
  type CargoPublico,
} from '@/lib/cargos'
import type { PlanFeatureKey } from '@/lib/plan-entitlements'

/**
 * O que mostrar enquanto a requisição não volta — e para sempre, se ela falhar.
 *
 * São os cargos de fábrica, computados do mesmo módulo que o servidor usa. Um
 * cargo criado pelo admin não está aqui (o navegador não tem como saber dele
 * sem perguntar), mas os quatro que sempre existiram estão — então a tela nunca
 * fica sem rótulo, nem pisca "Gratuito" no lugar de "Plus+" enquanto carrega.
 */
const EMBUTIDOS: CargoPublico[] = cargosEmbutidos().map(cargoPublico)

let cache: CargoPublico[] | null = null
let emVoo: Promise<CargoPublico[]> | null = null

/** Descarta o cache — a tela do admin chama depois de salvar. */
export function limparCacheDeCargos(): void {
  cache = null
  emVoo = null
}

async function buscarCargos(): Promise<CargoPublico[]> {
  if (cache) return cache
  if (emVoo) return emVoo

  emVoo = fetch('/api/cargos')
    .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then((dados: { cargos?: CargoPublico[] }) => {
      const cargos = Array.isArray(dados.cargos) && dados.cargos.length ? dados.cargos : EMBUTIDOS
      cache = cargos
      return cargos
    })
    .catch(() => {
      // Falha de rede não pode deixar a tela sem cargo. Os embutidos cobrem o
      // caso comum, e a próxima montagem tenta de novo (o cache fica vazio).
      return EMBUTIDOS
    })
    .finally(() => {
      emVoo = null
    })

  return emVoo
}

export interface RegistroDeCargosNoCliente {
  cargos: CargoPublico[]
  carregando: boolean
  /** O cargo de um `accountType`, já resolvendo os aliases legados. */
  acharCargo: (accountType?: string | null) => CargoPublico | null
  /** Rótulo pronto para exibir. Cai no próprio id quando o cargo sumiu. */
  rotulo: (accountType?: string | null) => string
  /** Classes do gradiente do selo (`from-… to-…`). */
  corDoSelo: (accountType?: string | null) => string
  /** Este cargo abre esta área? */
  liberaArea: (accountType: string | null | undefined, area: PlanFeatureKey) => boolean
}

export function useCargos(): RegistroDeCargosNoCliente {
  const [cargos, setCargos] = useState<CargoPublico[]>(cache || EMBUTIDOS)
  const [carregando, setCarregando] = useState(!cache)

  useEffect(() => {
    let vivo = true
    buscarCargos().then(lista => {
      if (!vivo) return
      setCargos(lista)
      setCarregando(false)
    })
    return () => {
      vivo = false
    }
  }, [])

  /**
   * Aliases legados resolvidos aqui, e não em `normalizeAccountType`: aquela
   * função é isomórfica e não conhece o registro, e este mapa é curto e
   * fechado (a consolidação Premium/Essential → Plus+ já aconteceu).
   */
  const acharCargo = (accountType?: string | null): CargoPublico | null => {
    if (!accountType) return cargos.find(c => c.id === 'gratuito') || null
    const bruto = String(accountType).trim().toLowerCase()
    const id = bruto === 'premium' || bruto === 'essential' || bruto === 'plus+' ? 'plus' : bruto
    return cargos.find(c => c.id === id) || null
  }

  return {
    cargos,
    carregando,
    acharCargo,
    rotulo: accountType => acharCargo(accountType)?.nome || String(accountType || 'Gratuito'),
    corDoSelo: accountType => classesDaCor(acharCargo(accountType)?.cor),
    liberaArea: (accountType, area) => !!acharCargo(accountType)?.areas?.[area],
  }
}

// ─── Grupos de acesso ─────────────────────────────────────────────────────────

export interface GrupoDeAcesso {
  id: string
  label: string
  /** Hex, para as telas que colorem a etiqueta com estilo inline. */
  color: string
}

/**
 * Os grupos que podem restringir um material, pacote ou deck.
 *
 * São os cargos do registro mais o `monitor`, que não é cargo: é o cargo
 * secundário (`user.secondaryRole`), independente do plano, e por isso não
 * aparece em `/admin/cargos` — mas restringe conteúdo do mesmo jeito.
 *
 * Substitui o array `ACCESS_GROUPS` que `/admin/materiais` mantinha à mão. Ele
 * é a prova viva do problema: listava "Gratuito / Trial / Plus+ / Monitor" e
 * ficou sem o Quest desde que o Quest existe, então não havia como marcar um
 * material como exclusivo dele.
 */
export function useGruposDeAcesso(): GrupoDeAcesso[] {
  const { cargos } = useCargos()
  return [
    ...cargos.map(c => ({ id: c.id, label: c.nome, color: hexDaCor(c.cor) })),
    { id: 'monitor', label: 'Monitor', color: '#10b981' },
  ]
}
