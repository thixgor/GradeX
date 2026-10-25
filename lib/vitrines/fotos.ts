import type { FotoDoMosaico } from '@/components/vitrine/heroi'

/**
 * As capas do Atlas de Anatomia: imagens da própria plataforma, públicas (a
 * vitrine de /anatomia já as mostra a quem não tem conta). Completam o mosaico
 * quando faltam capas de prova — banco fora do ar, ou poucas provas com capa.
 */
const SISTEMAS = [
  ['nervoso', 'sistema nervoso'],
  ['circulatorio', 'sistema circulatório'],
  ['respiratorio', 'sistema respiratório'],
  ['esqueletico', 'sistema esquelético'],
  ['digestorio', 'sistema digestório'],
  ['muscular', 'sistema muscular'],
  ['urinario', 'sistema urinário'],
] as const

export const CAPAS_DO_ATLAS: FotoDoMosaico[] = SISTEMAS.map(([arquivo, nome]) => ({
  src: `/atlas-anatomia/capa/capa-${arquivo}.png`,
  alt: `Capa do Atlas de Anatomia da DomineAqui: ${nome}`,
}))

/** As fotos pedidas, completadas com as capas do atlas a partir de `inicio`. */
export function completarComAtlas(fotos: FotoDoMosaico[], quantas: number, inicio = 0): FotoDoMosaico[] {
  const resultado = fotos.slice(0, quantas)
  for (let i = 0; resultado.length < quantas && i < CAPAS_DO_ATLAS.length; i++) {
    resultado.push(CAPAS_DO_ATLAS[(inicio + i) % CAPAS_DO_ATLAS.length])
  }
  return resultado
}

/** A ilustração do coração e dos pulmões em som — a imagem larga da landing. */
export const AUSCULTA: FotoDoMosaico = {
  src: '/landing/ausculta.jpg',
  alt: 'Ilustração da DomineAqui: coração e pulmões desenhados sobre a onda do som da ausculta',
}
