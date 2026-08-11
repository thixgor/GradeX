/**
 * Números de reserva do Manual de Radiologia.
 *
 * A landing de vendas recebe as contagens reais pela API de acesso, mas ela
 * precisa continuar lendo certo se essa chamada falhar — uma página de vendas
 * que anuncia "undefined incidências" é pior do que uma que anuncia um número
 * de ontem. São literais de propósito: importar o acervo aqui levaria os 172 KB
 * do atlas para o bundle da landing, que é justamente o que não pode acontecer.
 *
 * O teste em `__tests__/radiologia/catalogo.test.ts` compara estes valores com
 * o acervo real e quebra quando alguém acrescentar uma incidência sem atualizá-los.
 */
export const NUMEROS_RAIO_X = {
  estudos: 28,
  estruturas: 221,
  regioes: 9,
} as const
