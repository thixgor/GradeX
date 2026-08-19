/**
 * Memória de "onde eu parei" em Domine Anatomia.
 *
 * A seção tem duas metades grandes (o Atlas, com 418 pranchas, e os modelos
 * 3D) e quem estuda volta ao mesmo lugar por dias seguidos. Sem isto, cada
 * volta custava a mesma travessia — hub, sistema, região, coleção — para
 * chegar à prancha que já estava aberta ontem.
 *
 * Fica no `localStorage` de propósito: é preferência de navegação, não dado
 * de conta. Nada aqui pode quebrar a página — leitura e escrita engolem
 * qualquer falha (modo privado, cota cheia, JSON corrompido) e a interface
 * simplesmente não mostra o atalho.
 */

const CHAVE = 'gradex:anatomia:ultima-visita'

export interface UltimaVisita {
  /** Rótulo curto do lugar: "Esquelético · Crânio". */
  titulo: string
  /** Uma linha dizendo o que é aquilo. */
  detalhe?: string
  /** Para onde o atalho leva — já com sistema e coleção na busca. */
  href: string
  /** 'atlas' | 'modelo' — muda só o ícone e a cor do atalho. */
  tipo: 'atlas' | 'modelo'
  /** Milissegundos desde a época; usado para descartar visitas velhas. */
  quando: number
}

/** Depois de um mês, "continuar de onde parou" já não é onde a pessoa parou. */
const VALIDADE = 1000 * 60 * 60 * 24 * 30

export function registrarVisita(visita: Omit<UltimaVisita, 'quando'>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify({ ...visita, quando: Date.now() }))
  } catch {
    /* modo privado ou cota cheia: o atalho some, o estudo continua */
  }
}

export function lerUltimaVisita(): UltimaVisita | null {
  if (typeof window === 'undefined') return null
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return null
    const dado = JSON.parse(bruto) as Partial<UltimaVisita>
    if (!dado?.href || !dado?.titulo || typeof dado.quando !== 'number') return null
    if (Date.now() - dado.quando > VALIDADE) return null
    return {
      titulo: dado.titulo,
      detalhe: dado.detalhe,
      href: dado.href,
      tipo: dado.tipo === 'modelo' ? 'modelo' : 'atlas',
      quando: dado.quando,
    }
  } catch {
    return null
  }
}

export function esquecerVisita() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CHAVE)
  } catch {
    /* idem */
  }
}
