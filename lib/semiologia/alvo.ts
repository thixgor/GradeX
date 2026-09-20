import { COMPARADORES } from './comparadores'
import { RAIZ } from './rotas'
import { SINAIS } from './sinais'
import { JANELAS_ULTRASSOM } from './ultrassom'
import { VISTAS } from './vistas'

/**
 * De um caminho do módulo para o nome do que está lá.
 *
 * A landing fica mais precisa quando sabe o que a pessoa tentou abrir — "você
 * tentou abrir **Sinal de Murphy**" vende melhor do que uma página genérica,
 * porque a intenção está no auge exatamente nesse instante. Quem passa o
 * caminho é o middleware, que só sabe o endereço; o nome só existe no
 * catálogo, e o catálogo só pode ser lido no servidor (são centenas de KB).
 *
 * Resolver aqui, e não no componente, é o que mantém essa fronteira: a vitrine
 * recebe uma string curta e nunca importa o acervo.
 *
 * Slug desconhecido devolve `null` — a landing simplesmente não mostra a
 * linha, em vez de anunciar um nome inventado a partir do endereço.
 */
export function nomeDoAlvo(caminho?: string | null): string | null {
  if (!caminho) return null
  const limpo = caminho.split('?')[0].replace(/\/+$/, '')
  if (!limpo.startsWith(RAIZ)) return null

  const partes = limpo.slice(RAIZ.length).split('/').filter(Boolean)
  const [secao, slug] = partes

  if (!secao) return null
  if (!slug) return SECOES[secao] ?? null

  switch (secao) {
    case 'sinais':
      return SINAIS.find((s) => s.slug === slug)?.nome ?? null
    case 'beira-leito':
      return VISTAS.find((v) => v.slug === slug)?.nome ?? null
    case 'ultrassom':
      return JANELAS_ULTRASSOM.find((j) => j.slug === slug)?.nome ?? null
    case 'comparar':
      return COMPARADORES.find((c) => c.slug === slug)?.titulo ?? null
    default:
      return null
  }
}

const SECOES: Record<string, string> = {
  sinais: 'Sinais do exame físico',
  'beira-leito': 'Imagem à beira do leito',
  ultrassom: 'Ultrassom à beira do leito',
  comparar: 'Comparadores',
  creditos: 'Créditos e direitos',
}
