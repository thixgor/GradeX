import { ACERVO_DE_MIDIA } from './acervo.gerado'
import type { CenaClinica, JanelaUltrassom, Vista } from './esquemas'
import { midiasServiveis, type MidiaClinica } from './midia'

/**
 * Junta a prosa escrita à mão com a mídia curada pelo script.
 *
 * ## Por que os dois vivem separados
 *
 * `vistas.ts` e `ultrassom.ts` são texto escrito e revisado: roteiro de leitura,
 * diferença para o normal, conduta. `acervo.gerado.ts` é saída de máquina:
 * URLs, hashes, dimensões. Se o gerador escrevesse dentro dos arquivos de
 * prosa, bastaria uma execução no momento errado para sobrescrever a revisão de
 * alguém — e ninguém perceberia, porque o texto continuaria existindo, só que
 * na versão anterior.
 *
 * Separados, cada um tem um dono: pessoas editam a prosa, o script edita o
 * acervo, e o merge acontece aqui, na leitura, onde nada é destruído.
 *
 * ## A chave
 *
 * `janela/cena` — `otoscopia/otite-media-aguda`, `pulmao-linhas/pneumotorax`.
 * É o par que já identifica a cena em toda a interface e na URL (`?cena=`), e
 * reusá-lo evita inventar um segundo sistema de identificação para dizer a
 * mesma coisa.
 */
export function chaveDaCena(janelaSlug: string, cenaId: string): string {
  return `${janelaSlug}/${cenaId}`
}

/**
 * Mídia servível de uma cena, do acervo gerado e do que estiver inline.
 *
 * A filtragem por `midiasServiveis` acontece aqui, no servidor, e não na
 * interface: sem ela a tela reservaria espaço para uma galeria que pode chegar
 * vazia quando o ambiente não tem espelho nem opt-in de origem.
 */
export function midiasDaCena(janelaSlug: string, cena: CenaClinica): MidiaClinica[] {
  const doAcervo = ACERVO_DE_MIDIA[chaveDaCena(janelaSlug, cena.id)] ?? []
  const inline = cena.midiaReal ?? []
  return midiasServiveis([...doAcervo, ...inline])
}

/**
 * A janela com a mídia já anexada em cada cena.
 *
 * As páginas chamam isto antes de entregar ao visor, de modo que o componente
 * de cliente receba só o que de fato será exibido — e o acervo inteiro nunca
 * atravesse a rede para uma cena que ninguém abriu.
 */
export function comAcervo<T extends Vista | JanelaUltrassom>(janela: T): T {
  return {
    ...janela,
    cenas: janela.cenas.map((cena) => {
      const midiaReal = midiasDaCena(janela.slug, cena)
      return midiaReal.length ? { ...cena, midiaReal } : { ...cena, midiaReal: undefined }
    }),
  }
}

/** Quantas cenas já têm caso real — o número que mede o avanço da curadoria. */
export function cobertura(janelas: (Vista | JanelaUltrassom)[]): {
  cenas: number
  comCaso: number
  midias: number
} {
  let cenas = 0
  let comCaso = 0
  let midias = 0
  for (const janela of janelas) {
    for (const cena of janela.cenas) {
      cenas += 1
      const encontradas = midiasDaCena(janela.slug, cena)
      if (encontradas.length) {
        comCaso += 1
        midias += encontradas.length
      }
    }
  }
  return { cenas, comCaso, midias }
}
