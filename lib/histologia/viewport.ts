/**
 * Matemática do microscópio virtual.
 *
 * Módulo puro, sem DOM e sem React, por dois motivos: dá para testar o
 * alinhamento das camadas de forma exata (ver `__tests__/histologia/viewport.test.ts`)
 * e dá para provar a invariante que sustenta a experiência inteira —
 *
 *   **a imagem-base e todas as camadas de marcação recebem a mesma
 *   transformação, calculada uma única vez.**
 *
 * Na interface isso é reforçado pela estrutura: base e overlays são irmãos em
 * `position:absolute; inset:0` dentro de um único contêiner transformado. Não
 * existe um caminho de código em que uma camada possa receber escala ou
 * deslocamento diferente da outra — o desalinhamento clássico de visualizador
 * de lâmina é impossível por construção, não por cuidado.
 */

export interface Dimensoes {
  largura: number
  altura: number
}

/**
 * Estado do campo de visão.
 *
 * `escala` é o fator aplicado à imagem em sua resolução natural; `x` e `y` são
 * o deslocamento do canto superior esquerdo da imagem dentro do contêiner, em
 * pixels de tela. A transformação CSS equivalente é
 * `translate(x, y) scale(escala)` com `transform-origin: 0 0`.
 */
export interface Campo {
  escala: number
  x: number
  y: number
}

export interface Ponto {
  x: number
  y: number
}

/**
 * Objetivos do microscópio.
 *
 * ## O que estes presets são — e o que não são
 *
 * São **presets de campo de visão**, com as proporções reais entre objetivos
 * (4×, 10×, 40× e 100× guardam entre si a razão 1 : 2,5 : 10 : 25). Trocar de
 * objetivo aqui muda quanto da lâmina cabe na tela, exatamente como no
 * microscópio.
 *
 * **Não** são resolução óptica. Ampliar um JPEG não cria detalhe que o arquivo
 * não tem, e nenhum filtro inventa informação. A interface diz isso ao aluno
 * com todas as letras, porque a alternativa — deixar acreditar que o 100×
 * revela ultraestrutura — ensina errado sobre o próprio instrumento.
 */
export interface Objetivo {
  id: string
  rotulo: string
  /** Multiplicador sobre a escala de ajuste (imagem inteira visível). */
  fator: number
  descricao: string
}

export const OBJETIVOS: Objetivo[] = [
  {
    id: '4x',
    rotulo: '4×',
    fator: 1,
    descricao: 'Panorâmica. Arquitetura geral, camadas e orientação do corte.',
  },
  {
    id: '10x',
    rotulo: '10×',
    fator: 2.5,
    descricao: 'Médio aumento. Organização dos tecidos e limites entre camadas.',
  },
  {
    id: '40x',
    rotulo: '40×',
    fator: 10,
    descricao: 'Grande aumento. Tipos celulares, matriz e detalhe citológico.',
  },
  {
    id: '100x',
    rotulo: '100×',
    fator: 25,
    descricao: 'Imersão. Detalhe máximo que o arquivo comporta — sem resolução nova.',
  },
]

/** Limites de zoom, como múltiplos da escala de ajuste. */
export const FATOR_MINIMO = 1
export const FATOR_MAXIMO = 40

/** Escala em que a imagem inteira cabe no contêiner. */
export function escalaDeAjuste(imagem: Dimensoes, container: Dimensoes): number {
  if (imagem.largura <= 0 || imagem.altura <= 0) return 1
  if (container.largura <= 0 || container.altura <= 0) return 1
  return Math.min(container.largura / imagem.largura, container.altura / imagem.altura)
}

/** Campo inicial: imagem inteira visível e centralizada. */
export function campoDeAjuste(imagem: Dimensoes, container: Dimensoes): Campo {
  const escala = escalaDeAjuste(imagem, container)
  return centralizar({ escala, x: 0, y: 0 }, imagem, container)
}

/**
 * Aplica os limites de deslocamento.
 *
 * Quando a imagem escalada é menor que o contêiner em um eixo, ela é
 * centralizada nesse eixo — deixar o aluno arrastar uma lâmina pequena para
 * fora da tela não tem análogo no microscópio real e só desorienta. Quando é
 * maior, o deslocamento é limitado para que nunca sobre faixa vazia na borda.
 */
export function centralizar(campo: Campo, imagem: Dimensoes, container: Dimensoes): Campo {
  const largura = imagem.largura * campo.escala
  const altura = imagem.altura * campo.escala

  const x =
    largura <= container.largura
      ? (container.largura - largura) / 2
      : Math.min(0, Math.max(container.largura - largura, campo.x))
  const y =
    altura <= container.altura
      ? (container.altura - altura) / 2
      : Math.min(0, Math.max(container.altura - altura, campo.y))

  return { escala: campo.escala, x, y }
}

/** Converte um ponto do contêiner para coordenadas da imagem natural. */
export function paraCoordenadaDaImagem(campo: Campo, ponto: Ponto): Ponto {
  return {
    x: (ponto.x - campo.x) / campo.escala,
    y: (ponto.y - campo.y) / campo.escala,
  }
}

/** Converte um ponto da imagem natural para coordenadas do contêiner. */
export function paraCoordenadaDaTela(campo: Campo, ponto: Ponto): Ponto {
  return {
    x: ponto.x * campo.escala + campo.x,
    y: ponto.y * campo.escala + campo.y,
  }
}

/**
 * Zoom ancorado num ponto do contêiner.
 *
 * A propriedade que importa: o ponto da *imagem* que estava sob o cursor
 * continua sob o cursor depois do zoom. É o que faz a roda do mouse e o pinch
 * parecerem naturais — sem isso, aproximar joga o campo para longe do que se
 * estava olhando.
 */
export function aplicarZoom(
  campo: Campo,
  foco: Ponto,
  novaEscala: number,
  imagem: Dimensoes,
  container: Dimensoes,
): Campo {
  const limite = limitesDeEscala(imagem, container)
  const escala = Math.min(limite.maxima, Math.max(limite.minima, novaEscala))
  const alvo = paraCoordenadaDaImagem(campo, foco)
  return centralizar(
    { escala, x: foco.x - alvo.x * escala, y: foco.y - alvo.y * escala },
    imagem,
    container,
  )
}

export function limitesDeEscala(imagem: Dimensoes, container: Dimensoes) {
  const ajuste = escalaDeAjuste(imagem, container)
  return { minima: ajuste * FATOR_MINIMO, maxima: ajuste * FATOR_MAXIMO, ajuste }
}

/** Desloca o campo, respeitando os limites. */
export function deslocar(
  campo: Campo,
  delta: Ponto,
  imagem: Dimensoes,
  container: Dimensoes,
): Campo {
  return centralizar({ ...campo, x: campo.x + delta.x, y: campo.y + delta.y }, imagem, container)
}

/**
 * Troca de objetivo mantendo o centro da tela sobre o mesmo ponto da lâmina.
 *
 * É o comportamento do microscópio parfocal e parcentrado: ao girar o revólver,
 * a estrutura que estava no centro continua no centro. Recentralizar na imagem
 * inteira a cada troca obrigaria o aluno a reencontrar a estrutura toda vez.
 */
export function aplicarObjetivo(
  campo: Campo,
  objetivo: Objetivo,
  imagem: Dimensoes,
  container: Dimensoes,
): Campo {
  const { ajuste } = limitesDeEscala(imagem, container)
  const centro = { x: container.largura / 2, y: container.altura / 2 }
  return aplicarZoom(campo, centro, ajuste * objetivo.fator, imagem, container)
}

/** Enquadra um retângulo da imagem, com folga proporcional. */
export function enquadrar(
  alvo: { x: number; y: number; largura: number; altura: number },
  imagem: Dimensoes,
  container: Dimensoes,
  folga = 1.35,
): Campo {
  if (alvo.largura <= 0 || alvo.altura <= 0) return campoDeAjuste(imagem, container)
  const limite = limitesDeEscala(imagem, container)
  const bruta = Math.min(
    container.largura / (alvo.largura * folga),
    container.altura / (alvo.altura * folga),
  )
  const escala = Math.min(limite.maxima, Math.max(limite.minima, bruta))
  const centro = { x: alvo.x + alvo.largura / 2, y: alvo.y + alvo.altura / 2 }
  return centralizar(
    {
      escala,
      x: container.largura / 2 - centro.x * escala,
      y: container.altura / 2 - centro.y * escala,
    },
    imagem,
    container,
  )
}

/** Objetivo cujo fator mais se aproxima da escala atual. */
export function objetivoAtual(campo: Campo, imagem: Dimensoes, container: Dimensoes): Objetivo {
  const { ajuste } = limitesDeEscala(imagem, container)
  const fator = campo.escala / ajuste
  return OBJETIVOS.reduce((melhor, o) =>
    Math.abs(Math.log(o.fator / fator)) < Math.abs(Math.log(melhor.fator / fator)) ? o : melhor,
  )
}

/**
 * Retângulo do minimapa: que porção da lâmina está visível, em fração de 0 a 1.
 * Devolver fração (e não pixels) deixa o minimapa independente do seu tamanho
 * de renderização.
 */
export function janelaVisivel(campo: Campo, imagem: Dimensoes, container: Dimensoes) {
  const superiorEsquerdo = paraCoordenadaDaImagem(campo, { x: 0, y: 0 })
  const inferiorDireito = paraCoordenadaDaImagem(campo, {
    x: container.largura,
    y: container.altura,
  })
  const limitar = (v: number) => Math.min(1, Math.max(0, v))
  const esquerda = limitar(superiorEsquerdo.x / imagem.largura)
  const topo = limitar(superiorEsquerdo.y / imagem.altura)
  return {
    esquerda,
    topo,
    largura: limitar(inferiorDireito.x / imagem.largura) - esquerda,
    altura: limitar(inferiorDireito.y / imagem.altura) - topo,
  }
}

/** String de `transform` CSS. Base e overlays recebem exatamente esta string. */
export function transformCss(campo: Campo): string {
  return `translate3d(${campo.x}px, ${campo.y}px, 0) scale(${campo.escala})`
}

/**
 * Escala em micrômetros — só quando há calibração comprovada.
 *
 * O acervo do Digital Histology não declara µm/px, então esta função devolve
 * `null` para todas as lâminas atuais e a régua micrométrica não é desenhada.
 * Derivar a escala do objetivo nominal produziria um número plausível e falso;
 * é o tipo de erro que o aluno não tem como detectar e que ele levaria para a
 * bancada real.
 */
export function larguraDaBarraEmMicrometros(
  campo: Campo,
  calibracao: { micrometrosPorPixel: number } | undefined,
  larguraAlvoEmPixels: number,
): { micrometros: number; pixels: number } | null {
  if (!calibracao) return null
  const micrometrosBrutos = (larguraAlvoEmPixels / campo.escala) * calibracao.micrometrosPorPixel
  // Arredonda para 1, 2 ou 5 vezes uma potência de dez — o padrão das barras de
  // escala publicadas.
  const potencia = Math.pow(10, Math.floor(Math.log10(micrometrosBrutos)))
  const passos = [1, 2, 5, 10]
  const escolhido =
    passos.find((p) => micrometrosBrutos <= p * potencia) ?? passos[passos.length - 1]
  const micrometros = escolhido * potencia
  return {
    micrometros,
    pixels: (micrometros / calibracao.micrometrosPorPixel) * campo.escala,
  }
}
