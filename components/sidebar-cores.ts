import type { SidebarSectionKey } from '@/lib/sidebar-sections'

/**
 * A cor de cada área do menu — o fundo do quadradinho atrás do ícone.
 *
 * É o recurso dos Ajustes do iPhone: cada linha tem um ícone branco num
 * squircle de cor própria, e o olho acha "Banco de Questões" pela cor azul
 * antes de ler a palavra. No menu recolhido (72 px), onde não há rótulo, a
 * coluna vira uma doca — e cor é a única pista que sobra além do desenho.
 *
 * Duas cores por área (alto → baixo do degradê). A de baixo, onde o degradê
 * assenta, passa de 3:1 com o ícone branco — inclusive nos amarelos, que por
 * isso são mais escuros que o amarelo da marca. Matizes vizinhos ficam longe
 * na lista: Provas (laranja) e Banco (azul) não se confundem de relance.
 *
 * Quem não está no mapa (grupo criado pelo admin, área nova) cai na paleta de
 * reserva por um hash da chave: a cor muda de área para área, mas é sempre a
 * mesma para a mesma área.
 */
export type CorDoChip = readonly [string, string]

const CORES: Partial<Record<SidebarSectionKey | string, CorDoChip>> = {
  inicio: ['#5aa66b', '#2f6b40'],
  provas: ['#f38a4e', '#d0521c'],
  bancoQuestoes: ['#5b9bff', '#2563eb'],
  aulas: ['#f47272', '#cf3434'],
  flashcards: ['#ad86f7', '#7646d8'],
  mapaMental: ['#3fcab7', '#0f8f7c'],
  cronogramas: ['#efa63a', '#c27508'],
  forum: ['#4fc3ec', '#1b88bd'],
  games: ['#f47bb9', '#d22a7a'],
  manualClinico: ['#f05f74', '#bf2944'],
  'manual-clinico': ['#f05f74', '#bf2944'],
  ferramentasClinicas: ['#5fb2c9', '#2b7891'],
  farmacologia: ['#4fc08a', '#178a55'],
  anatomia3d: ['#f2846f', '#c94a35'],
  manualHistologia: ['#c47ef0', '#9343c9'],
  manualExames: ['#7c8cf8', '#4553d6'],
  manualRadiologia: ['#8a96a8', '#4f5b6c'],
  manualSemiologia: ['#43b884', '#1d7d52'],
  manualEletro: ['#f2695a', '#c8301f'],
  materiais: ['#c99556', '#8f5f25'],
  rifas: ['#e9b334', '#b57d06'],
  monitorias: ['#7f8bf6', '#4b55d2'],
  embaixadores: ['#d47ff0', '#a63fd0'],
  perfil: ['#9aa3ad', '#5f6873'],
  admin: ['#6f7782', '#3a4049'],
  lite: ['#eab437', '#b57d06'],
  upgrade: ['#f2a03a', '#d0601a'],
  sair: ['#f47272', '#cf3434'],
}

const RESERVA: CorDoChip[] = [
  ['#5b9bff', '#2563eb'],
  ['#3fcab7', '#0f8f7c'],
  ['#ad86f7', '#7646d8'],
  ['#efa63a', '#c27508'],
  ['#f47bb9', '#d22a7a'],
  ['#4fc3ec', '#1b88bd'],
]

export function corDoChip(chave: string): CorDoChip {
  const cor = CORES[chave]
  if (cor) return cor
  let h = 0
  for (let i = 0; i < chave.length; i++) h = (h * 31 + chave.charCodeAt(i)) >>> 0
  return RESERVA[h % RESERVA.length]
}

/** As duas cores como variáveis de CSS, para o `style` do chip. */
export function estiloDoChip(chave: string): React.CSSProperties {
  const [a, b] = corDoChip(chave)
  return { '--chip-a': a, '--chip-b': b } as React.CSSProperties
}
