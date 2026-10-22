import type { GrupoDeTecido } from './tipos'

/**
 * Grupos de tecido: nome e cor. Fora de `tecidos.ts` porque a ficha da lâmina
 * é desenhada também no navegador, e importar daqui não pode levar junto a
 * tabela de classificação inteira (`TECIDOS`) para o JavaScript público — a
 * ficha recebe só as descrições dos tecidos da lâmina aberta.
 */

/**
 * Cores dos grupos para a barra de composição. Paleta categórica validada
 * (skill de dataviz: faixa de luminosidade, croma, separação para daltonismo e
 * visão normal) — em ordem fixa, com passos próprios para o modo escuro. A cor
 * nunca aparece sozinha: toda barra tem legenda e a tabela ao lado.
 */
export const GRUPOS: Record<GrupoDeTecido, { nome: string; cor: string; corEscura: string }> = {
  epitelial: { nome: 'Epitelial', cor: '#D9536F', corEscura: '#E0607B' },
  'conjuntivo-propriamente-dito': { nome: 'Conjuntivo propriamente dito', cor: '#D08A1E', corEscura: '#B8860B' },
  'conjuntivo-especializado': { nome: 'Conjuntivo especializado', cor: '#7B5BC4', corEscura: '#8C6FD6' },
  muscular: { nome: 'Muscular', cor: '#B83A2A', corEscura: '#C94A38' },
  nervoso: { nome: 'Nervoso', cor: '#0A8FA3', corEscura: '#1A9DB5' },
  dentario: { nome: 'Tecidos dentários', cor: '#5E9A1C', corEscura: '#6AA82A' },
}

export const ORDEM_DOS_GRUPOS: GrupoDeTecido[] = [
  'epitelial',
  'conjuntivo-propriamente-dito',
  'conjuntivo-especializado',
  'muscular',
  'nervoso',
  'dentario',
]
