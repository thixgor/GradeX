/**
 * Abre a gaveta do carrinho (`MaterialCartButton`, no cabeçalho) de qualquer
 * lugar da página — o botão "No carrinho" dos cartões e a barra flutuante da
 * loja. Evento de janela para não amarrar a gaveta a um contexto novo.
 */
export const EVENTO_ABRIR_CARRINHO = 'domineaqui:abrir-carrinho'

export function abrirCarrinho() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENTO_ABRIR_CARRINHO))
}
