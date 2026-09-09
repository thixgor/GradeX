/**
 * As imagens de uma questão — quantas forem, onde forem, do tamanho que forem.
 *
 * ## O problema que este módulo resolve
 *
 * Uma questão tinha UMA imagem, e ela morava em dois campos soltos
 * (`imageUrl` + `imageSource` nas provas, `imagemUrl` no Banco de Questões).
 * Isso deixava três coisas de fora:
 *
 * 1. **Mais de uma imagem.** Caso clínico com radiografia e laudo, lâmina em
 *    dois aumentos, gráfico antes e depois — tudo isso virava "escolha uma".
 * 2. **Imagem na resposta comentada.** O comentário podia descrever o achado,
 *    mas não mostrá-lo. Era o pedido mais repetido de quem escreve gabarito.
 * 3. **Tamanho.** A imagem ocupava a largura toda, na tela e no PDF. Uma seta
 *    apontando para um detalhe saía do tamanho de um caso clínico inteiro, e o
 *    PDF de uma prova de vinte questões virava um arquivo de trinta páginas.
 *
 * ## Por que um módulo só, e não um campo em cada lugar
 *
 * Provas e Banco de Questões desenham a mesma coisa em seis telas e nove PDFs.
 * Se cada um tivesse a sua noção de "imagem da questão", o tamanho configurado
 * na tela do admin não seria o tamanho do PDF, e a segunda imagem apareceria em
 * dois dos nove arquivos. O formato mora aqui; cada tela e cada gerador só
 * pergunta `imagensDoEnunciado(questao)` e desenha o que voltar.
 *
 * ## Compatibilidade com o que já está gravado
 *
 * Nada do que existe muda de lugar. `imageUrl`/`imagemUrl` continuam sendo lidos
 * e continuam sendo GRAVADOS (sempre com a primeira imagem da lista), então uma
 * questão nova aparece certa em qualquer código que ainda não conheça a lista —
 * e uma questão antiga, que só tem o campo velho, entra aqui como uma lista de
 * um item. Ver `sincronizarCampoLegado`.
 */

/** Como as imagens de um mesmo bloco se arrumam entre si. */
export type LayoutDeImagens = 'empilhado' | 'lado-a-lado'

export const LAYOUTS_DE_IMAGENS: { valor: LayoutDeImagens; rotulo: string; descricao: string }[] = [
  {
    valor: 'empilhado',
    rotulo: 'Uma embaixo da outra',
    descricao: 'Cada imagem ocupa a sua linha. É o padrão, e o que melhor cabe no celular.',
  },
  {
    valor: 'lado-a-lado',
    rotulo: 'Uma do lado da outra',
    descricao: 'As imagens dividem a linha enquanto couberem. No celular elas voltam a empilhar.',
  },
]

export const LAYOUT_PADRAO: LayoutDeImagens = 'empilhado'

/**
 * O tamanho é uma PORCENTAGEM da largura disponível, não pixels nem milímetros.
 *
 * Assim o mesmo número serve para a tela do celular, a tela do computador e a
 * página A4 do PDF: em todos, "70" quer dizer "setenta por cento da largura do
 * texto". Pixel fixo não sobrevive à troca de tela, e milímetro não existe no
 * navegador.
 *
 * O padrão é 70 e não 100 porque a largura toda era exatamente a reclamação:
 * uma imagem de exame ocupava a tela inteira e empurrava o enunciado para fora.
 * Quem quiser a largura inteira ainda a tem — é só arrastar até 100.
 */
export const TAMANHO_PADRAO_DA_IMAGEM = 70
export const TAMANHO_MINIMO_DA_IMAGEM = 20
export const TAMANHO_MAXIMO_DA_IMAGEM = 100

/** Os degraus do seletor rápido de tamanho, para não precisar mirar no slider. */
export const TAMANHOS_SUGERIDOS: { valor: number; rotulo: string }[] = [
  { valor: 35, rotulo: 'Pequena' },
  { valor: 55, rotulo: 'Média' },
  { valor: TAMANHO_PADRAO_DA_IMAGEM, rotulo: 'Padrão' },
  { valor: 100, rotulo: 'Largura toda' },
]

export interface ImagemDeQuestao {
  url: string
  /** Crédito da imagem, exibido em itálico logo abaixo dela. */
  fonte?: string
  /** Largura em % da largura disponível. Ausente = `TAMANHO_PADRAO_DA_IMAGEM`. */
  tamanho?: number
}

/**
 * Uma imagem tem que ser buscável pelo navegador: endereço http(s), caminho do
 * próprio site ou `data:image/...`. `javascript:` não é imagem — e estes campos
 * são colados à mão, inclusive por quem cola o que copiou de outra aba.
 */
export function ehUrlDeImagem(valor: unknown): valor is string {
  const url = typeof valor === 'string' ? valor.trim() : ''
  if (url.length === 0) return false
  return /^https?:\/\//i.test(url) || url.startsWith('/') || /^data:image\//i.test(url)
}

/** O tamanho de uma imagem, já dentro dos limites e com o padrão aplicado. */
export function tamanhoDaImagem(imagem: Pick<ImagemDeQuestao, 'tamanho'> | null | undefined): number {
  const bruto = Number(imagem?.tamanho)
  if (!Number.isFinite(bruto)) return TAMANHO_PADRAO_DA_IMAGEM
  return Math.min(TAMANHO_MAXIMO_DA_IMAGEM, Math.max(TAMANHO_MINIMO_DA_IMAGEM, Math.round(bruto)))
}

export function ehLayoutDeImagens(valor: unknown): valor is LayoutDeImagens {
  return valor === 'empilhado' || valor === 'lado-a-lado'
}

export function layoutDeImagens(valor: unknown): LayoutDeImagens {
  return ehLayoutDeImagens(valor) ? valor : LAYOUT_PADRAO
}

/**
 * Lê uma imagem de qualquer formato que já tenha passado por aqui.
 *
 * Aceita a string solta (`"https://…"`) porque é isso que um campo antigo, um
 * importador de TXT ou uma colagem produzem, e devolve `null` para o que não
 * for imagem — em vez de gravar um endereço que nunca vai carregar.
 */
export function normalizarImagem(bruto: unknown): ImagemDeQuestao | null {
  if (typeof bruto === 'string') {
    return ehUrlDeImagem(bruto) ? { url: bruto.trim(), tamanho: TAMANHO_PADRAO_DA_IMAGEM } : null
  }
  if (!bruto || typeof bruto !== 'object') return null

  const registro = bruto as Record<string, unknown>
  const url = registro.url ?? registro.imageUrl ?? registro.imagemUrl
  if (!ehUrlDeImagem(url)) return null

  const fonteBruta = registro.fonte ?? registro.imageSource ?? registro.source
  const fonte = typeof fonteBruta === 'string' ? fonteBruta.trim() : ''

  const imagem: ImagemDeQuestao = {
    url: String(url).trim(),
    tamanho: tamanhoDaImagem({ tamanho: registro.tamanho as number | undefined }),
  }
  if (fonte.length > 0) imagem.fonte = fonte
  return imagem
}

/** O limite de imagens por bloco. Não é técnico: é o que ainda dá para ler. */
export const MAXIMO_DE_IMAGENS = 8

/**
 * Lê uma lista de imagens, descartando o que não for imagem e o que repetir.
 *
 * A mesma URL duas vezes é sempre engano de colagem, e no PDF ela custa o dobro
 * do peso do arquivo pelo mesmo conteúdo.
 */
export function normalizarImagens(bruto: unknown): ImagemDeQuestao[] {
  if (!Array.isArray(bruto)) {
    const unica = normalizarImagem(bruto)
    return unica ? [unica] : []
  }
  const vistas = new Set<string>()
  const imagens: ImagemDeQuestao[] = []
  for (const item of bruto) {
    const imagem = normalizarImagem(item)
    if (!imagem || vistas.has(imagem.url)) continue
    vistas.add(imagem.url)
    imagens.push(imagem)
    if (imagens.length >= MAXIMO_DE_IMAGENS) break
  }
  return imagens
}

/**
 * A forma como um bloco de imagens é guardado dentro de uma questão.
 *
 * `layout` fica junto das imagens, e não na questão inteira, porque enunciado e
 * resposta comentada são decisões diferentes: duas lâminas lado a lado no
 * enunciado convivem com um fluxograma sozinho no comentário.
 */
export interface BlocoDeImagens {
  imagens: ImagemDeQuestao[]
  layout: LayoutDeImagens
}

export function blocoVazio(): BlocoDeImagens {
  return { imagens: [], layout: LAYOUT_PADRAO }
}

/**
 * Reúne o campo antigo e a lista nova numa lista só.
 *
 * A regra é: **a lista manda quando existe**. Uma questão migrada tem os dois
 * campos preenchidos (ver `sincronizarCampoLegado`), e somar os dois duplicaria
 * a primeira imagem em toda tela e todo PDF. Uma questão nunca tocada tem só o
 * campo antigo, e é dele que a lista de um item nasce.
 */
export function reunirImagens(
  lista: unknown,
  urlLegada: unknown,
  fonteLegada?: unknown,
): ImagemDeQuestao[] {
  const daLista = normalizarImagens(lista)
  if (daLista.length > 0) return daLista

  const legada = normalizarImagem({ url: urlLegada, fonte: fonteLegada })
  return legada ? [legada] : []
}

/**
 * O valor que o campo antigo deve ter depois de uma gravação.
 *
 * Toda tela e todo PDF que este trabalho não alcançou continua lendo
 * `imageUrl`/`imagemUrl`. Gravar ali a primeira imagem da lista é o que faz uma
 * questão com três imagens aparecer com a primeira — e não sem nenhuma — em
 * qualquer lugar que ainda não saiba da lista. Apagar a lista devolve `null`,
 * que é como o `$set` do Mongo remove o campo.
 */
export function sincronizarCampoLegado(imagens: ImagemDeQuestao[]): string | null {
  return imagens.length > 0 ? imagens[0].url : null
}

/** Idem, para a fonte da primeira imagem. */
export function fonteDoCampoLegado(imagens: ImagemDeQuestao[]): string | null {
  return imagens[0]?.fonte || null
}

/**
 * Distribui as imagens em linhas, respeitando o tamanho de cada uma.
 *
 * É a mesma conta na tela e no PDF, e por isso ela mora aqui e não em nenhum
 * dos dois: no `lado-a-lado`, as imagens dividem a linha ENQUANTO CABEM — três
 * imagens de 50% ocupam duas linhas (50+50, depois 50), não uma linha de 150%.
 * `empilhado` é o caso degenerado de uma imagem por linha.
 *
 * A tolerância de 0,5 ponto percentual existe porque tamanhos como 33+33+33
 * são o jeito óbvio de pedir três colunas, e 99 ≠ 100 não pode empurrar a
 * terceira para a linha de baixo.
 */
export function distribuirEmLinhas(
  imagens: ImagemDeQuestao[],
  layout: LayoutDeImagens,
): ImagemDeQuestao[][] {
  if (imagens.length === 0) return []
  if (layout !== 'lado-a-lado') return imagens.map((imagem) => [imagem])

  const linhas: ImagemDeQuestao[][] = []
  let linha: ImagemDeQuestao[] = []
  let ocupado = 0

  for (const imagem of imagens) {
    const largura = tamanhoDaImagem(imagem)
    if (linha.length > 0 && ocupado + largura > TAMANHO_MAXIMO_DA_IMAGEM + 0.5) {
      linhas.push(linha)
      linha = []
      ocupado = 0
    }
    linha.push(imagem)
    ocupado += largura
  }
  if (linha.length > 0) linhas.push(linha)
  return linhas
}
