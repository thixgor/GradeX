import type { Exam } from '@/lib/types'

/**
 * As travas de cópia de uma prova.
 *
 * ## O que elas são, e o que não são
 *
 * Isto aumenta o ATRITO de tirar a prova da tela: sem seleção não há
 * `Ctrl+C`, sem impressão não há PDF de 30 páginas circulando no grupo, sem
 * menu do botão direito não há "copiar imagem". É o que dá para fazer de
 * dentro da página.
 *
 * O que não dá: quem tiver um celular fotografa a tela, e quem souber abrir o
 * inspetor lê o HTML. Nenhuma trava de navegador resolve isso — para esse
 * caso existem a marca d'água com o nome de quem baixou
 * (`lib/watermark-fingerprint.ts`) e o monitoramento por câmera
 * (`proctoring`). Chamar isto de "anti-cola" no plural seria vender o que ele
 * não entrega; ele é o degrau mais barato, e o único que não pede permissão
 * de nada nem atrapalha quem está de boa-fé.
 *
 * ## Por que é por prova
 *
 * Numa prova de treino, bloquear seleção é atrapalhar quem estuda — a pessoa
 * quer copiar o enunciado para pesquisar. Numa avaliação valendo nota, o
 * mesmo gesto é o problema. A decisão é da prova, e nasce desligada: quem não
 * pediu nada continua com a tela livre.
 */

export interface TravasAntiCola {
  /** Sem seleção de texto, sem `Ctrl+C`, sem arrastar conteúdo para fora. */
  copia: boolean
  /** Sem `Ctrl+P` e sem folha de impressão — a prova sai em branco no papel. */
  impressao: boolean
  /** Sem menu do botão direito (que é por onde se copia imagem). */
  menu: boolean
}

export const TRAVAS_PADRAO: TravasAntiCola = { copia: false, impressao: false, menu: false }

export function normalizarTravas(valor: unknown): TravasAntiCola {
  const bruto = (valor || {}) as Partial<Record<keyof TravasAntiCola, unknown>>
  return {
    copia: bruto.copia === true,
    impressao: bruto.impressao === true,
    menu: bruto.menu === true,
  }
}

export function travasDaProva(prova: Partial<Exam> | null | undefined): TravasAntiCola {
  return normalizarTravas((prova as any)?.antiCola)
}

export function algumaTravaLigada(travas: TravasAntiCola): boolean {
  return travas.copia || travas.impressao || travas.menu
}

/**
 * Este elemento é um lugar onde a pessoa ESCREVE?
 *
 * A trava de cópia não pode alcançá-los. O aluno precisa selecionar, corrigir
 * e recolar o próprio texto na discursiva e na redação — bloquear ali não
 * protege prova nenhuma (o texto é dele) e transforma uma questão aberta num
 * castigo. É o detalhe que separa uma trava de um defeito.
 */
export const SELETOR_DE_ESCRITA =
  'input, textarea, [contenteditable="true"], [data-permite-copia]'

export function ehCampoDeEscrita(alvo: EventTarget | null): boolean {
  const elemento = alvo as HTMLElement | null
  if (!elemento || typeof elemento.closest !== 'function') return false
  // `closest`, e não uma checagem da tag: o clique costuma cair num `<span>`
  // dentro do campo, e comparar só o alvo deixaria a trava valendo lá dentro.
  return !!elemento.closest(SELETOR_DE_ESCRITA)
}

/**
 * O aviso que a tela mostra quando a pessoa esbarra numa trava.
 *
 * Uma tecla que não faz nada parece defeito, e defeito no meio de uma prova
 * vira "o site travou" — dito para o professor depois, quando não há como
 * conferir. Dizer que a trava existe, e que ela é da prova, encerra o assunto
 * na hora.
 */
export function motivoDaTrava(qual: keyof TravasAntiCola): string {
  switch (qual) {
    case 'copia':
      return 'Esta prova não permite copiar o conteúdo.'
    case 'impressao':
      return 'Esta prova não permite impressão.'
    case 'menu':
      return 'O menu do botão direito está desativado nesta prova.'
  }
}

/** Resumo para a tela do admin: o que está ligado, em uma linha. */
export function rotuloDasTravas(travas: TravasAntiCola): string {
  const ligadas = [
    travas.copia && 'cópia',
    travas.impressao && 'impressão',
    travas.menu && 'menu do botão direito',
  ].filter(Boolean) as string[]

  if (ligadas.length === 0) return 'Nenhuma trava — a tela fica livre.'
  if (ligadas.length === 1) return `Bloqueia ${ligadas[0]}.`
  return `Bloqueia ${ligadas.slice(0, -1).join(', ')} e ${ligadas[ligadas.length - 1]}.`
}
