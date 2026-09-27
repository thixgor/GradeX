'use client'

import {
  CORES_DE_SETA,
  caminhoDaSeta,
  caminhoDoPonteiro,
  type CorDeSeta,
  type SetaMarcada,
} from '@/lib/histologia-zoom/setas'

const SVG = 'http://www.w3.org/2000/svg'

/**
 * Elemento DOM de uma seta cravada, para `viewer.addOverlay`.
 *
 * É um ponto de tamanho zero ancorado na ponta da seta (placement TOP_LEFT);
 * o desenho transborda dele. O OpenSeadragon aplica a rotação e o espelho do
 * viewport ao invólucro do overlay com origem nesse ponto, então a seta
 * continua apontando para a mesma estrutura quando a lâmina gira — o ângulo
 * gravado é o da lâmina, sem correção aqui. Só o rótulo recebe a transformação
 * inversa, para o texto nunca aparecer girado ou espelhado.
 */
export function criarElementoDeSeta(
  seta: SetaMarcada,
  opcoes: {
    numero: number
    tamanho: number
    mostrarRotulo: boolean
    destacada: boolean
    /** Rotação atual do viewport, em graus. */
    rotacao: number
    espelhado: boolean
  },
): HTMLElement {
  const { tamanho: L } = opcoes
  const cor = CORES_DE_SETA[seta.cor]
  const raiz = document.createElement('div')
  raiz.className = 'hz-seta'
  raiz.setAttribute('aria-hidden', 'true')

  const margem = 6
  const lado = 2 * (L + margem)
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('width', String(lado))
  svg.setAttribute('height', String(lado))
  svg.setAttribute('viewBox', `${-L - margem} ${-L - margem} ${lado} ${lado}`)
  svg.style.left = `${-L - margem}px`
  svg.style.top = `${-L - margem}px`

  const grupo = document.createElementNS(SVG, 'g')
  grupo.setAttribute('transform', `rotate(${seta.angulo})`)
  const caminho = document.createElementNS(SVG, 'path')
  caminho.setAttribute('d', caminhoDaSeta(L))
  caminho.setAttribute('fill', cor.preenchimento)
  caminho.setAttribute('stroke', cor.contorno)
  caminho.setAttribute('stroke-width', opcoes.destacada ? '3.5' : '2.2')
  caminho.setAttribute('stroke-linejoin', 'round')
  caminho.setAttribute('paint-order', 'stroke')
  grupo.appendChild(caminho)
  svg.appendChild(grupo)
  raiz.appendChild(svg)

  const texto = seta.rotulo.trim() || (opcoes.mostrarRotulo ? String(opcoes.numero) : '')
  if (opcoes.mostrarRotulo && texto) {
    const rad = (seta.angulo * Math.PI) / 180
    const d = L + 14
    const rotulo = document.createElement('span')
    rotulo.className = 'hz-seta-rotulo'
    rotulo.textContent = texto
    rotulo.style.left = `${-Math.cos(rad) * d}px`
    rotulo.style.top = `${-Math.sin(rad) * d}px`
    // Inverso de "rotate(r') scaleX(-1)" que o OpenSeadragon aplica ao invólucro.
    const r = opcoes.espelhado ? -opcoes.rotacao : opcoes.rotacao
    rotulo.style.transform = `translate(-50%, -50%)${opcoes.espelhado ? ' scaleX(-1)' : ''} rotate(${-r}deg)`
    raiz.appendChild(rotulo)
  }
  return raiz
}

/** Estilos dos overlays (setas e pinos), injetados uma vez pelo visualizador. */
export const ESTILO_DAS_SETAS = `
.hz-seta{position:relative;width:0;height:0;pointer-events:none}
.hz-seta svg{position:absolute;overflow:visible;filter:drop-shadow(0 1px 2px rgba(0,0,0,.55))}
.hz-seta-rotulo{position:absolute;white-space:nowrap;max-width:220px;overflow:hidden;text-overflow:ellipsis;padding:2px 7px;border-radius:6px;background:rgba(0,0,0,.78);color:#fff;font:600 12px/1.35 system-ui,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.4)}
`

/**
 * Seta da ocular: fixa no campo, com a ponta no centro. A lâmina é que se move
 * por baixo dela — como a agulha de um microscópio de ensino.
 */
export function PonteiroDaOcular({
  largura,
  altura,
  raio,
  angulo,
  cor,
}: {
  largura: number
  altura: number
  /** Raio do campo da ocular (se ativa); senão, o ponteiro usa o palco. */
  raio: number | null
  angulo: number
  cor: CorDeSeta
}) {
  const cx = largura / 2
  const cy = altura / 2
  const campo = raio ?? Math.min(largura, altura) * 0.45
  const comprimento = Math.max(40, campo * 0.62)
  const c = CORES_DE_SETA[cor]
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <g transform={`translate(${cx} ${cy}) rotate(${angulo})`}>
        <path
          d={caminhoDoPonteiro(comprimento)}
          fill={c.preenchimento}
          stroke={c.contorno}
          strokeWidth={1.2}
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,.6))' }}
        />
      </g>
    </svg>
  )
}

/** Amostra de cor para os seletores. */
export function AmostraDeCor({
  cor,
  ativa,
  onClick,
  tamanho = 'normal',
}: {
  cor: CorDeSeta
  ativa: boolean
  onClick: () => void
  tamanho?: 'normal' | 'mini'
}) {
  const c = CORES_DE_SETA[cor]
  const lado = tamanho === 'mini' ? 'h-6 w-6' : 'h-8 w-8'
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativa}
      aria-label={c.nome}
      title={c.nome}
      onClick={onClick}
      className={`${lado} shrink-0 rounded-full border-2 transition-transform ${
        ativa ? 'scale-110 border-teal-500 ring-2 ring-teal-500/40' : 'border-border hover:scale-105'
      }`}
      style={{ backgroundColor: c.preenchimento, boxShadow: `inset 0 0 0 2px ${c.contorno}33` }}
    />
  )
}
