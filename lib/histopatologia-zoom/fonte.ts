/**
 * Origem das lâminas da Histopatologia com Zoom.
 *
 * ## Como as imagens chegam ao aluno
 *
 * As lâminas são casos pré-diagnosticados servidos por Aperio ImageServer. O
 * índice guarda só o caminho do `.svs`; cada tile é uma região pedida ao
 * servidor de origem, que responde com `Access-Control-Allow-Origin: *`.
 * Nenhuma imagem é copiada.
 *
 * ## Três servidores, um protocolo
 *
 * O acervo nasceu inteiro no Virtual Pathology Slide Library (University of
 * Leeds). Em outubro de 2026 o servidor de Leeds passou a responder 403 a
 * tudo, sem previsão de volta, e cada doença ganhou uma **lâmina suplementar**
 * de outro acervo que fala o mesmo protocolo — achadas pelo buscador de lâminas
 * virtuais do PathologyBites, que indexa repositórios de terceiros:
 *
 * - `rosai`: Rosai Collection of Surgical Pathology (seminários de patologia
 *   cirúrgica reunidos por Juan Rosai);
 * - `upmc`: arquivo das Diagnostic Slide Sessions da AANP, hospedado pela
 *   Divisão de Neuropatologia da University of Pittsburgh.
 *
 * Os outros repositórios do índice (PathPresenter, Wirtualny Mikroskop, MGH,
 * Recut Club) não servem tiles com CORS: só funcionariam por proxy, e cada
 * tile passaria a sair de uma função nossa (Fast Origin Transfer).
 *
 * ## Direitos
 *
 * Leeds: termo DOMAQ-LEEDS-VP-2026-001 (29/09/2026), sem obrigação de crédito,
 * que sugerimos manter no rodapé com referência ABNT. PathologyBites:
 * autorização de 24/10/2026, crédito recomendado de forma discreta. A
 * procedência completa, e o que cada documento cobre, está em
 * `FONTES_LICENCIADAS` (`lib/acervos-licenciados.ts`).
 */

import type { ServidorDeLaminas } from './tipos'

export const HOST_LEEDS = 'https://images.virtualpathology.leeds.ac.uk'

interface ServidorDeImagens {
  /** Prefixo do caminho do `.svs` (sem barra no fim). */
  host: string
  /** Nome curto do acervo, para selo e lista de lâminas. */
  acervo: string
  rodape: string
  referencia: string
}

export const RODAPE_LEEDS =
  'Conteúdos originários do projeto Leeds Virtual Pathology (University of Leeds). Catalogação, tradução, marcações e fichas de achados: Domine Aqui.'

export const REFERENCIA_ABNT_LEEDS =
  'UNIVERSITY OF LEEDS. Leeds Virtual Pathology: Virtual Pathology Slide Library. Leeds: University of Leeds, [2026]. Disponível em: https://www.virtualpathology.leeds.ac.uk/slides/library/. Acesso em: 29 set. 2026.'

const REFERENCIA_ABNT_PATHOLOGYBITES =
  'PATHOLOGY BITES. Virtual Slide Search Engine. [S. l.]: Pathology Bites, 2026. Disponível em: https://www.pathologybites.com/tools/virtual-slides. Acesso em: 23 out. 2026.'

export const SERVIDORES_DE_LAMINAS: Record<ServidorDeLaminas, ServidorDeImagens> = {
  leeds: {
    host: HOST_LEEDS,
    acervo: 'Leeds Virtual Pathology',
    rodape: RODAPE_LEEDS,
    referencia: REFERENCIA_ABNT_LEEDS,
  },
  rosai: {
    host: 'https://rosai.secondslide.com/imageserver',
    acervo: 'Rosai Collection',
    rodape:
      'Lâminas suplementares da Rosai Collection of Surgical Pathology (rosaicollection.net), localizadas pelo buscador de lâminas virtuais do PathologyBites (pathologybites.com). Catalogação, tradução, marcações e fichas de achados: Domine Aqui.',
    referencia: `ROSAI COLLECTION OF SURGICAL PATHOLOGY. Rosai Collection: seminars. [S. l.]: Rosai Collection, [2026]. Disponível em: https://rosaicollection.net/. Acesso em: 23 out. 2026. ${REFERENCIA_ABNT_PATHOLOGYBITES}`,
  },
  upmc: {
    host: 'https://image.upmc.edu',
    acervo: 'Neuropatologia · Pittsburgh',
    rodape:
      'Lâminas suplementares do arquivo das Diagnostic Slide Sessions da American Association of Neuropathologists, hospedado pela Divisão de Neuropatologia da University of Pittsburgh (neuro2.pathology.pitt.edu), localizadas pelo buscador de lâminas virtuais do PathologyBites (pathologybites.com). Catalogação, tradução, marcações e fichas de achados: Domine Aqui.',
    referencia: `UNIVERSITY OF PITTSBURGH. Division of Neuropathology. AANP Diagnostic Slide Session archive. Pittsburgh: University of Pittsburgh, [2026]. Disponível em: https://neuro2.pathology.pitt.edu/. Acesso em: 23 out. 2026. ${REFERENCIA_ABNT_PATHOLOGYBITES}`,
  },
}

/**
 * Servidores que não estão servindo tiles.
 *
 * Decide a ordem: a lâmina de um servidor daqui vai para o fim da lista da
 * doença, e a capa da doença (catálogo, capítulo, "continue estudando") passa a
 * ser a primeira lâmina que abre. A lâmina continua publicada — o visualizador
 * tenta de novo a cada minuto e oferece a suplementar enquanto isso.
 *
 * Quando Leeds voltar (o `?INFO` de qualquer `.svs` responder 200), tire-o
 * daqui: as lâminas originais retomam o primeiro lugar sem mais nada a mudar.
 */
export const SERVIDORES_FORA_DO_AR: readonly ServidorDeLaminas[] = ['leeds']

export function servidorNoAr(servidor: ServidorDeLaminas): boolean {
  return !SERVIDORES_FORA_DO_AR.includes(servidor)
}

export function urlDoSvs(caminho: string, servidor: ServidorDeLaminas = 'leeds'): string {
  return `${SERVIDORES_DE_LAMINAS[servidor].host}${caminho.split('/').map(encodeURIComponent).join('/')}`
}

/** Rodapé e referência dos acervos presentes, na ordem fixa de `SERVIDORES_DE_LAMINAS`. */
export function creditosDosServidores(servidores: Iterable<ServidorDeLaminas>): Array<{ rodape: string; referencia: string }> {
  const presentes = new Set(servidores)
  return (Object.keys(SERVIDORES_DE_LAMINAS) as ServidorDeLaminas[])
    .filter((s) => presentes.has(s))
    .map((s) => ({ rodape: SERVIDORES_DE_LAMINAS[s].rodape, referencia: SERVIDORES_DE_LAMINAS[s].referencia }))
}
