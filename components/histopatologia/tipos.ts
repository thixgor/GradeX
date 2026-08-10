import type {
  AchadoMorfologico,
  EtapaCausal,
  HistopatologiaPorAumento,
  MecanismoGeral,
} from '@/lib/histopatologia/esquemas'

/**
 * Tipos compartilhados entre os componentes da Histopatologia.
 *
 * Existem por uma razão de fronteira: os componentes de cliente não podem
 * importar `lib/histopatologia/repositorio.ts` (que é `server-only`) nem
 * resolver mecanismos por conta própria. O servidor resolve o `mecanismoId` em
 * um objeto completo antes de passar adiante, e este arquivo dá nome a essa
 * forma já resolvida.
 */

export type { AchadoMorfologico, EtapaCausal, HistopatologiaPorAumento }

/** Mecanismo geral já resolvido, com a aplicação específica da doença junto. */
export interface AplicacaoDeMecanismoResolvida extends MecanismoGeral {
  aplicacao: string
}
