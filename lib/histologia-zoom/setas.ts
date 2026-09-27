/**
 * Setas: a seta da ocular e as setas que o aluno crava na lâmina.
 *
 * ## Seta da ocular (ponteiro)
 *
 * Muitos microscópios de ensino trazem, dentro da ocular, uma agulha preta
 * que entra pela borda do campo e aponta para o centro. Ela não se move com a
 * lâmina: é a lâmina que se move por baixo dela, até a estrutura ficar na
 * ponta. É a alternativa clássica à retícula — o professor diz "o que está na
 * ponta da seta", e todo mundo olha o mesmo ponto.
 *
 * ## Setas cravadas
 *
 * Marcações do próprio aluno: uma seta presa a um ponto da lâmina, com rótulo
 * opcional, que acompanha zoom e deslocamento. A ponta é o dado; a direção e a
 * cor são apresentação. Ficam no navegador (localStorage), por lâmina.
 *
 * ## Ângulos
 *
 * Em graus, sentido horário, 0 = apontando para a direita (convenção de tela:
 * y cresce para baixo). O ângulo **gravado** é relativo à lâmina sem rotação
 * nem espelhamento; `anguloNaTela` converte para o que se vê agora, para a
 * seta continuar apontando para a mesma estrutura depois de girar a lâmina.
 */

export type CorDeSeta = 'preta' | 'branca' | 'vermelha' | 'amarela' | 'verde' | 'azul'

export const CORES_DE_SETA: Record<CorDeSeta, { nome: string; preenchimento: string; contorno: string }> = {
  preta: { nome: 'Preta', preenchimento: '#111111', contorno: '#ffffff' },
  branca: { nome: 'Branca', preenchimento: '#ffffff', contorno: '#111111' },
  vermelha: { nome: 'Vermelha', preenchimento: '#e11d1d', contorno: '#ffffff' },
  amarela: { nome: 'Amarela', preenchimento: '#facc15', contorno: '#111111' },
  verde: { nome: 'Verde', preenchimento: '#22c55e', contorno: '#111111' },
  azul: { nome: 'Azul', preenchimento: '#2563eb', contorno: '#ffffff' },
}

export const ORDEM_DAS_CORES: CorDeSeta[] = ['preta', 'branca', 'vermelha', 'amarela', 'verde', 'azul']

export interface SetaMarcada {
  id: string
  /** Ponta da seta, em coordenadas de viewport do OpenSeadragon. */
  x: number
  y: number
  /** Direção da seta relativa à lâmina (sem rotação nem espelho), em graus. */
  angulo: number
  rotulo: string
  cor: CorDeSeta
  criadaEm: number
}

/** Direção padrão: a seta vem de cima-esquerda e aponta para baixo-direita. */
export const ANGULO_PADRAO = 45

export function normalizarAngulo(a: number): number {
  return ((a % 360) + 360) % 360
}

/** Ângulo que se vê na tela, dado o ângulo gravado e o estado do viewport. */
export function anguloNaTela(angulo: number, rotacao: number, espelhado: boolean): number {
  return normalizarAngulo(espelhado ? 180 - (angulo + rotacao) : angulo + rotacao)
}

/** Inverso de `anguloNaTela`: o ângulo a gravar para que a seta apareça com `naTela`. */
export function anguloNaLamina(naTela: number, rotacao: number, espelhado: boolean): number {
  return normalizarAngulo(espelhado ? 180 - naTela - rotacao : naTela - rotacao)
}

/**
 * Contorno de uma seta apontando para a direita, com a ponta em (0, 0).
 * Haste fina e cabeça triangular — o desenho de ponteiro de microscópio.
 */
export function caminhoDaSeta(comprimento: number): string {
  const cabeca = Math.min(18, comprimento * 0.34)
  const meiaCabeca = cabeca * 0.42
  const meiaHaste = Math.max(1.4, comprimento * 0.028)
  const x0 = -comprimento
  const xb = -cabeca
  return [
    `M 0 0`,
    `L ${xb} ${-meiaCabeca}`,
    `L ${xb} ${-meiaHaste}`,
    `L ${x0} ${-meiaHaste * 0.6}`,
    `L ${x0} ${meiaHaste * 0.6}`,
    `L ${xb} ${meiaHaste}`,
    `L ${xb} ${meiaCabeca}`,
    `Z`,
  ].join(' ')
}

/**
 * Agulha da ocular: cunha longa que afina até a ponta, como o ponteiro metálico
 * de um microscópio. Ponta em (0, 0), apontando para a direita.
 */
export function caminhoDoPonteiro(comprimento: number): string {
  const base = Math.max(3, comprimento * 0.035)
  return `M 0 0 L ${-comprimento} ${-base} L ${-comprimento} ${base} Z`
}

/** Desenha uma seta num canvas 2D (imagem salva). */
export function desenharSetaNoCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  anguloTela: number,
  comprimento: number,
  cor: CorDeSeta,
  rotulo?: string,
  escala = 1,
  forma: 'seta' | 'ponteiro' = 'seta',
) {
  const c = CORES_DE_SETA[cor]
  const caminho = new Path2D(forma === 'seta' ? caminhoDaSeta(comprimento) : caminhoDoPonteiro(comprimento))
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(escala, escala)
  ctx.rotate((anguloTela * Math.PI) / 180)
  ctx.lineJoin = 'round'
  ctx.lineWidth = 2.5
  ctx.strokeStyle = c.contorno
  ctx.stroke(caminho)
  ctx.fillStyle = c.preenchimento
  ctx.fill(caminho)
  ctx.restore()

  if (rotulo) {
    const rad = (anguloTela * Math.PI) / 180
    const tx = x - Math.cos(rad) * (comprimento + 10) * escala
    const ty = y - Math.sin(rad) * (comprimento + 10) * escala
    ctx.save()
    ctx.font = `600 ${12 * escala}px system-ui, sans-serif`
    const w = ctx.measureText(rotulo).width + 12 * escala
    const h = 20 * escala
    ctx.fillStyle = 'rgba(0,0,0,0.78)'
    ctx.beginPath()
    if (typeof ctx.roundRect === 'function') ctx.roundRect(tx - w / 2, ty - h / 2, w, h, 6 * escala)
    else ctx.rect(tx - w / 2, ty - h / 2, w, h)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(rotulo, tx, ty)
    ctx.restore()
  }
}

// ─── Persistência ───────────────────────────────────────────────────────────

const chave = (slug: string) => `histologia-zoom:setas:${slug}`

export function carregarSetas(slug: string): SetaMarcada[] {
  try {
    const bruto = window.localStorage.getItem(chave(slug))
    const lista = bruto ? (JSON.parse(bruto) as SetaMarcada[]) : []
    return Array.isArray(lista)
      ? lista.filter((s) => Number.isFinite(s.x) && Number.isFinite(s.y) && s.cor in CORES_DE_SETA)
      : []
  } catch {
    return []
  }
}

export function salvarSetas(slug: string, lista: SetaMarcada[]): void {
  try {
    window.localStorage.setItem(chave(slug), JSON.stringify(lista))
  } catch {
    // Armazenamento indisponível: as setas valem só nesta visita.
  }
}
