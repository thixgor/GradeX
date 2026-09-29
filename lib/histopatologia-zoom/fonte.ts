/**
 * Origem das lâminas da Histopatologia com Zoom.
 *
 * ## Como as imagens chegam ao aluno
 *
 * As lâminas são casos pré-diagnosticados do Virtual Pathology Slide Library
 * (University of Leeds). O índice guarda só o caminho do `.svs`; cada tile é
 * uma região pedida ao ImageServer de Leeds, que responde com
 * `Access-Control-Allow-Origin: *`. Nenhuma imagem é copiada.
 *
 * ## Direitos
 *
 * Termo de autorização DOMAQ-LEEDS-VP-2026-001 (29/09/2026): indexar,
 * catalogar, traduzir, aprofundar e disponibilizar, inclusive de forma paga,
 * **sem obrigação de crédito** (cláusula 4). O próprio termo sugere o crédito
 * no rodapé da seção e uma referência em ABNT — é o que `RODAPE_LEEDS` e
 * `REFERENCIA_ABNT_LEEDS` fazem, fora da área da lâmina. A procedência completa
 * está em `FONTES_LICENCIADAS.leeds`, em `lib/acervos-licenciados.ts`.
 */

export const HOST_LEEDS = 'https://images.virtualpathology.leeds.ac.uk'

export function urlDoSvs(caminho: string): string {
  return `${HOST_LEEDS}${caminho.split('/').map(encodeURIComponent).join('/')}`
}

export const RODAPE_LEEDS =
  'Conteúdos originários do projeto Leeds Virtual Pathology (University of Leeds). Catalogação, tradução, marcações e fichas de achados: Domine Aqui.'

export const REFERENCIA_ABNT_LEEDS =
  'UNIVERSITY OF LEEDS. Leeds Virtual Pathology: Virtual Pathology Slide Library. Leeds: University of Leeds, [2026]. Disponível em: https://www.virtualpathology.leeds.ac.uk/slides/library/. Acesso em: 29 set. 2026.'
