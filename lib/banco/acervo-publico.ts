/**
 * O tamanho do acervo dito em voz alta — nas telas de venda.
 *
 * "+15 mil questões" convence; "15.238 questões" não. E o número exato é a
 * pior escolha possível numa tela de venda por três motivos, nesta ordem:
 *
 *  1. **Envelhece.** Um número cravado no código vira mentira no dia seguinte à
 *     próxima importação, e ninguém volta para corrigir a string.
 *  2. **Encolhe.** Questão removida faz o número CAIR, e a tela passa a
 *     anunciar que o produto diminuiu.
 *  3. **Não é promessa.** Dizer "+15 mil" é um piso que o acervo sempre cumpre;
 *     dizer "15.238" é um contrato sobre um número que muda toda semana.
 *
 * Por isso a contagem real nunca chega ao navegador: `/api/banco/contagem`
 * arredonda para baixo antes de responder, e a tela só sabe o número redondo.
 * Arredondar PARA BAIXO é deliberado — o acervo entrega sempre um pouco mais do
 * que a frase promete, nunca menos.
 *
 * Arquivo puro, sem imports: é lido pela rota (servidor) e pelo modal
 * (navegador), e os dois precisam falar o mesmo número.
 */

/** Degrau do arredondamento. Abaixo dele não se fala em "mil". */
export const DEGRAU_DO_ACERVO = 1000

/**
 * A contagem real vira o múltiplo de mil imediatamente abaixo dela.
 *
 * Devolve `0` quando não há o que anunciar (acervo pequeno demais, contagem
 * ausente ou inválida) — e `0` é o sinal, para quem exibe, de dizer a frase
 * genérica em vez de inventar um número.
 */
export function acervoArredondado(total?: number | null): number {
  if (typeof total !== 'number' || !Number.isFinite(total) || total <= 0) return 0
  const redondo = Math.floor(total / DEGRAU_DO_ACERVO) * DEGRAU_DO_ACERVO
  return redondo >= DEGRAU_DO_ACERVO ? redondo : 0
}

/**
 * A frase que vai na tela: `+15 mil questões`.
 *
 * Recebe o número JÁ arredondado (o que a rota devolve). Com `0` — acervo
 * pequeno, rota fora do ar, resposta ainda carregando — devolve `null`, e cabe
 * a quem chama escrever a frase sem número (ver `ACERVO_SEM_NUMERO`). Uma tela
 * de venda pode ficar sem o número; não pode chutar um.
 */
export function rotuloDoAcervo(aproximado?: number | null): string | null {
  const redondo = acervoArredondado(aproximado)
  if (redondo === 0) return null
  return `+${(redondo / DEGRAU_DO_ACERVO).toLocaleString('pt-BR')} mil questões`
}

/** O que se diz quando não há número confiável para dizer. */
export const ACERVO_SEM_NUMERO = 'Milhares de questões'
