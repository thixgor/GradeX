/**
 * "Força do anúncio": uma nota de 0 a 100 com dicas do que falta — o empurrão
 * para o monitor caprichar no que mais converte (vídeo, aula grátis, agenda
 * online…). Função pura: a mesma conta no assistente de anúncio e no painel.
 *
 * Exemplo: anúncio com vídeo, descrição longa, 3 conteúdos e agenda online,
 * mas sem FAQ e sem aula grátis → 20+15+10+10+10+… = 70 ("bom"), e as duas
 * primeiras dicas são "Ofereça uma aula grátis (+15)" e "Responda 3 dúvidas no FAQ (+10)".
 */

export interface EntradaForca {
  titulo: string
  descricao: string
  conteudos: number
  videos: number
  faq: number
  materiais: number
  temMateriais: boolean
  aulaGratis: boolean
  grupo: boolean
  agendaDireta: boolean
}

export interface ForcaDoAnuncio {
  pontos: number
  nivel: 'fraco' | 'bom' | 'excelente'
  dicas: Array<{ texto: string; ganho: number }>
}

export function forcaDoAnuncio(e: EntradaForca): ForcaDoAnuncio {
  let pontos = 0
  const dicas: ForcaDoAnuncio['dicas'] = []
  const criterio = (ganhou: number, maximo: number, dica: string) => {
    pontos += ganhou
    if (ganhou < maximo) dicas.push({ texto: dica, ganho: maximo - ganhou })
  }
  const titulo = e.titulo.trim().length
  const descricao = e.descricao.trim().length

  criterio(e.videos >= 1 ? 20 : 0, 20, 'Adicione um vídeo curto (1–2 min) explicando um tópico: é o que mais convence o aluno.')
  criterio(e.aulaGratis ? 15 : 0, 15, 'Ofereça uma aula experimental grátis: tira o medo de quem nunca te viu dar aula.')
  criterio(descricao >= 300 ? 15 : descricao >= 120 ? 8 : 0, 15, 'Escreva uma descrição de pelo menos 300 caracteres: para quem é, como é a aula e o que o aluno sai sabendo.')
  criterio(titulo >= 20 && titulo <= 80 ? 10 : titulo >= 8 ? 5 : 0, 10, 'Use um título claro com o tema e o resultado (ex.: "ECG do zero: leia qualquer traçado em 2 aulas").')
  criterio(e.conteudos >= 3 ? 10 : e.conteudos >= 1 ? 5 : 0, 10, 'Liste pelo menos 3 conteúdos/módulos — o aluno procura pelo tema exato.')
  criterio(e.faq >= 3 ? 10 : e.faq >= 1 ? 5 : 0, 10, 'Responda pelo menos 3 dúvidas comuns no FAQ (preço, preparo, como é a aula).')
  criterio(e.agendaDireta ? 10 : 0, 10, 'Ative a agenda online: o aluno marca e paga na hora, sem esperar resposta.')
  criterio(e.grupo ? 5 : 0, 5, 'Ative o preço de grupo: sai mais barato por pessoa e você ganha mais por hora.')
  criterio(e.materiais > 0 || e.temMateriais ? 5 : 0, 5, 'Indique materiais complementares (resumos, listas, slides).')

  dicas.sort((a, b) => b.ganho - a.ganho)
  const nivel = pontos >= 80 ? 'excelente' : pontos >= 50 ? 'bom' : 'fraco'
  return { pontos, nivel, dicas }
}
