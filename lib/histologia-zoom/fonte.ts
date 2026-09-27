/**
 * Origem das imagens da Histologia com Zoom.
 *
 * ## Como as imagens chegam ao aluno
 *
 * O catálogo guarda só o índice (nome, coloração, pirâmide de tiles) e o
 * visualizador busca cada tile direto do servidor do acervo, que os serve com
 * `Access-Control-Allow-Origin: *`. É também por isso que a exportação de
 * imagem funciona: o canvas não fica "contaminado" por origem cruzada.
 *
 * ## Direitos
 *
 * Uso autorizado por escrito pela Aarhus University (HistoViewer) em
 * 26/09/2026 — utilizar, catalogar, traduzir, aprofundar e disponibilizar de
 * forma paga, **sem obrigação de crédito aos criadores** (cláusula 3.1). A
 * procedência completa (signatários, cláusulas, SHA-256 do documento) está em
 * `FONTES_LICENCIADAS.histoviewer`, em `lib/acervos-licenciados.ts`.
 *
 * Por isso a interface apresenta o acervo como **Microscopia Virtual — Domine
 * Aqui** e não leva o aluno ao site de origem. Se a autorização for revogada, a
 * cláusula 4 exige restaurar o crédito nas lâminas já publicadas.
 */

import { FONTES_LICENCIADAS } from '@/lib/acervos-licenciados'

export const HOST_DO_ACERVO = 'https://histoviewer.biomed.au.dk'
export const BASE_DE_IMAGENS = `${HOST_DO_ACERVO}/imgsets/`

/** Nome com que o acervo é apresentado ao aluno. */
export const MARCA_DO_ACERVO = 'Microscopia Virtual — Domine Aqui'
export const CREDITO_CURTO = FONTES_LICENCIADAS.histoviewer.creditoCurto

/** Linha de rodapé das páginas do módulo. */
export const RODAPE_DO_ACERVO =
  'Microscopia Virtual — Domine Aqui. Catalogação, visualizador e fichas de características em português.'

/**
 * Procedência de cada fonte de lâminas.
 *
 * GTEx (Genotype-Tissue Expression Project, NIH Common Fund): recurso
 * comunitário de acesso aberto, com lâminas humanas em H&E servidas em Deep
 * Zoom. O portal declara as imagens de histologia como dado aberto, mas **não
 * publica licença explícita para uso comercial**. Até haver autorização
 * escrita, o crédito ao GTEx aparece em toda lâmina dessa fonte — é o mínimo
 * que a comunidade científica espera de quem usa o recurso.
 */
export const FONTES_DO_ACERVO = {
  histoviewer: {
    credito: CREDITO_CURTO,
    autorizacao: 'escrita' as const,
  },
  gtex: {
    credito: 'Microscopia Virtual · Domine Aqui — lâmina do GTEx Project (NIH)',
    creditoLongo:
      'Lâmina do Genotype-Tissue Expression Project (GTEx), apoiado pelo Common Fund do NIH, pelo NCI, NHGRI, NHLBI, NIDA, NIMH e NINDS; imagem disponibilizada pelo GTEx Portal.',
    autorizacao: 'pendente' as const,
    pendencia:
      'Acesso aberto (recurso comunitário do NIH), sem licença explícita para uso comercial nem autorização escrita arquivada. Para encerrar: obter autorização do GTEx/NIH ou retirar as lâminas desta fonte (data/histologia-zoom/acervo-dzi.json).',
  },
}

/**
 * Fotomicrografias avulsas (Wikimedia Commons, Human Protein Atlas): licenças
 * abertas que permitem uso comercial com crédito ao autor. O crédito é por
 * imagem (`LaminaZoom.credito`) e aparece na lâmina, na página e na imagem
 * salva; a exibição é sem modificação, o que cumpre o ShareAlike.
 */
export const FONTES_ABERTAS = {
  commons: { nome: 'Wikimedia Commons', autorizacao: 'licenca-aberta' as const },
  hpa: { nome: 'Human Protein Atlas', autorizacao: 'licenca-aberta' as const },
}

export function linhaDeCredito(c: { autor: string; licenca: string; acervo: string }): string {
  return `Imagem: ${c.autor} — ${c.licenca} (${c.acervo})`
}

/** Crédito curto sobre a lâmina: o da imagem, quando a licença exige; senão o do acervo. */
export function creditoDaLamina(l: {
  fonte: 'histoviewer' | 'gtex' | 'commons' | 'hpa'
  credito: { autor: string; licenca: string; acervo: string } | null
}): string {
  if (l.credito) return `${MARCA_DO_ACERVO} · ${linhaDeCredito(l.credito)}`
  return l.fonte === 'gtex' ? FONTES_DO_ACERVO.gtex.credito : FONTES_DO_ACERVO.histoviewer.credito
}

export function urlDoEspecime(root: string): string {
  return `${BASE_DE_IMAGENS}${root}`
}
