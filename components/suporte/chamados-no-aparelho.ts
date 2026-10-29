/**
 * Os chamados de visitante abertos NESTE aparelho — conveniência local.
 *
 * Quem abre um chamado sem conta acompanha pelo link do e-mail. Guardar o link
 * aqui deixa a Central de Ajuda mostrar "Seus chamados" a quem volta pelo mesmo
 * navegador, sem precisar caçar o e-mail. É só atalho: some numa aba anônima ou
 * com o armazenamento limpo, e a fonte da verdade continua sendo o e-mail.
 */

const CHAVE = 'domineaqui:chamados'
const MAXIMO = 10

export interface ChamadoNoAparelho {
  id: string
  chave: string
  protocolo: string
  titulo: string
  em: number
}

export function lerChamadosNoAparelho(): ChamadoNoAparelho[] {
  try {
    const bruto = JSON.parse(window.localStorage.getItem(CHAVE) || '[]')
    if (!Array.isArray(bruto)) return []
    return bruto
      .filter(
        (c): c is ChamadoNoAparelho =>
          c && /^[a-f0-9]{24}$/.test(c.id) && typeof c.chave === 'string' && c.chave.length === 32,
      )
      .slice(0, MAXIMO)
  } catch {
    return []
  }
}

export function guardarChamadoNoAparelho(chamado: ChamadoNoAparelho): void {
  try {
    const lista = [chamado, ...lerChamadosNoAparelho().filter((c) => c.id !== chamado.id)].slice(0, MAXIMO)
    window.localStorage.setItem(CHAVE, JSON.stringify(lista))
  } catch {
    /* modo privado / armazenamento cheio — o e-mail continua valendo */
  }
}

export function linkLocalDoChamado(c: Pick<ChamadoNoAparelho, 'id' | 'chave'>): string {
  return `/suporte/ticket/${c.id}?chave=${encodeURIComponent(c.chave)}`
}
