/**
 * Endereços do Manual de Semiologia num lugar só.
 *
 * Rota escrita à mão em componente é como link quebrado nasce: alguém renomeia
 * um segmento e os `href` espalhados por dez arquivos continuam apontando para
 * o endereço antigo, sem erro de compilação nenhum. Aqui o compilador cobra.
 */
export const RAIZ = '/manual-clinico/semiologia'

export const ROTAS = {
  raiz: RAIZ,
  sinais: `${RAIZ}/sinais`,
  sinal: (slug: string) => `${RAIZ}/sinais/${slug}`,
  beiraLeito: `${RAIZ}/beira-leito`,
  vista: (slug: string) => `${RAIZ}/beira-leito/${slug}`,
  cena: (vista: string, cena: string) => `${RAIZ}/beira-leito/${vista}?cena=${cena}`,
  ultrassom: `${RAIZ}/ultrassom`,
  janela: (slug: string) => `${RAIZ}/ultrassom/${slug}`,
  comparadores: `${RAIZ}/comparar`,
  comparador: (slug: string) => `${RAIZ}/comparar/${slug}`,
} as const
