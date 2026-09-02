import type { ClasseId } from '../classes'

/**
 * Forma de uma ficha curada do Atlas de Anatomia.
 *
 * O acervo entrega nome e coordenada. Tudo o que o estudante lê depois — o que
 * a estrutura é, onde ela está, o que ela faz, quem a irriga, o que ela toca e
 * por que isso aparece na enfermaria — está escrito aqui, estrutura por
 * estrutura.
 *
 * ## Como o casamento funciona
 *
 * `termos` são **títulos exatos** do acervo, normalizados (minúsculo, sem
 * acento, espaços colapsados). A busca compara igualdade, não substring — e a
 * mudança não é preciosismo: com substring, a entrada do rim casava com
 * "Articulação Carpometacarpal do Polegar (entre o osso trapézio e o **prim**eiro
 * metacarpo)", a entrada da ulna respondia por "Nervo Ulnar" e a da fíbula
 * explicava o "Músculo Fibular Longo". O aluno lia a ficha do osso achando que
 * era a do nervo.
 *
 * `contem` existe para o caso legítimo oposto: famílias em que o acervo repete
 * dezenas de variações do mesmo nome ("Costela I", "Costela II"…) e uma ficha
 * de família responde bem. É consultado só depois de todos os `termos` exatos
 * falharem, do termo mais longo para o mais curto, e por isso nunca rouba um
 * título que tem ficha própria.
 *
 * ## Como escrever uma entrada
 *
 * A régua é a aula, não a legenda: o estudante precisa terminar a leitura
 * sabendo *por que* a estrutura é daquele jeito. Frase de identidade curta em
 * `resumo`; `localizacao` que sirva de instrução para achar a peça; `funcao`
 * que explique a forma; `clinica` com o caso concreto que faz a estrutura
 * valer a pena; e `memoria`, o gancho que impede o esquecimento.
 */
export interface EntradaDicionario {
  /** Títulos do acervo servidos por esta ficha, comparados por igualdade. */
  termos: string[]
  /** Casamento por conteúdo, só quando nenhum `termos` exato bateu. */
  contem?: string[]
  /**
   * Restringe a ficha a certos sistemas do acervo.
   *
   * O catálogo reaproveita nomes genéricos em pranchas de sistemas diferentes:
   * "Margem Superior" é a borda da escápula no esquelético e a borda do coração
   * no circulatório; "Ápice" é a ponta do coração, do pulmão ou da patela
   * conforme a prancha. Uma ficha só não pode responder pelas duas coisas sem
   * mentir para metade dos alunos, então a entrada declara em que sistemas ela
   * vale, e o motor procura primeiro a que combina com a prancha aberta.
   */
  sistemas?: string[]
  /** Corrige a classe quando o nome engana o classificador léxico. */
  classe?: ClasseId
  /** Frase de identidade: o que é essa estrutura, em uma linha. */
  resumo?: string
  localizacao?: string
  funcao?: string
  vascularizacao?: string
  inervacao?: string
  linfaticos?: string
  relacoes?: string
  clinica?: string
  /** O gancho que faz a estrutura grudar: mnemônico, imagem, raciocínio. */
  memoria?: string
  pontos?: string[]
}
