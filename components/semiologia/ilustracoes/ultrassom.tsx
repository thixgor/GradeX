'use client'

import { Quadro, Textura, corDeTecido, num, txt, type PropsDeIlustracao } from './base'

/**
 * As janelas de ultrassom.
 *
 * ## O que é real e o que é artefato
 *
 * Metade do que se vê num ultrassom pulmonar **não existe**: linha A é
 * reverberação, linha B é ressonância, código de barras é ausência de
 * movimento registrada num eixo de tempo. Essa é a dificuldade central do
 * método, e um desenho que trate artefato e estrutura da mesma forma ensina
 * errado.
 *
 * Por isso o desenho os separa: estruturas reais têm contorno e textura de
 * speckle; artefatos são geometria pura — linhas perfeitamente paralelas e
 * igualmente espaçadas, porque é exatamente isso que eles são. Quando o aluno
 * percebe que as linhas A são *cópias* da linha pleural em múltiplos da mesma
 * distância, ele para de procurá-las e passa a prevê-las.
 *
 * ## Escala de cinza
 *
 * Cinza de ultrassom não é cinza de interface. A escala aqui é fixa e não
 * responde ao tema — pelo mesmo motivo que a esclera ictérica continua amarela
 * no modo escuro.
 */

type Cena =
  | 'pulmao-normal'
  | 'pulmao-linhas-b'
  | 'pneumotorax'
  | 'derrame-pleural'
  | 'fast-normal'
  | 'fast-positivo'
  | 'cava-normal'
  | 'cava-colabada'
  | 'cava-plectorica'
  | 'pericardio-normal'
  | 'derrame-pericardico'

const PRETO = '#07080a'
const ANECOICO = '#0b0e12'

export function Ultrassom({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const cena = txt(params, 'cena', 'pulmao-normal') as Cena
  const sufixo = cena.replace(/[^a-z]/g, '')
  const idSpeckle = `us-spk-${sufixo}`
  const idSetor = `us-set-${sufixo}`

  const setorial = cena.startsWith('fast') || cena.startsWith('cava') || cena.includes('pericardio')

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo={PRETO}>
      <defs>
        <Textura id={idSpeckle} escala={3.4} opacidade={0.34} />
        <clipPath id={idSetor}>
          {setorial ? (
            // Leque do convexo e do phased array. O ápice é uma face plana e
            // não um ponto: um triângulo de vértice único recortaria metade da
            // imagem útil, e o que sobra de um exame recortado não ensina nada.
            <path d="M 22 2 L 78 2 L 97 94 Q 50 105 3 94 Z" />
          ) : (
            <rect x="4" y="2" width="92" height="96" rx="2" />
          )}
        </clipPath>
      </defs>

      <g clipPath={`url(#${idSetor})`}>
        <rect x="0" y="0" width="100" height="100" fill={PRETO} />
        {conteudo(cena, params)}
        <rect x="0" y="0" width="100" height="100" fill="#8d949c" opacity="0.12" filter={`url(#${idSpeckle})`} />
      </g>

      {/* Moldura do aparelho: marcador de orientação e régua de profundidade. */}
      <circle cx={setorial ? 50 : 9} cy={setorial ? 6 : 7} r="1.6" fill="#f2c14e" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1="97" y1={8 + i * 10} x2={i % 2 ? 98.5 : 100} y2={8 + i * 10} stroke="#7a8290" strokeWidth="0.5" />
      ))}
    </Quadro>
  )
}

function conteudo(cena: Cena, params: PropsDeIlustracao['params']) {
  switch (cena) {
    case 'pulmao-normal':
      return <Pulmao linhasB={0} desliza />
    case 'pulmao-linhas-b':
      return <Pulmao linhasB={num(params, 'linhasB', 5)} desliza />
    case 'pneumotorax':
      return <ModoM desliza={false} />
    case 'derrame-pleural':
      return <DerramePleural />
    case 'fast-normal':
      return <Morrison liquido={0} />
    case 'fast-positivo':
      return <Morrison liquido={num(params, 'liquido', 3.2)} />
    case 'cava-normal':
      return <Cava diametro={1.9} colapso={0.6} />
    case 'cava-colabada':
      return <Cava diametro={1.1} colapso={1} />
    case 'cava-plectorica':
      return <Cava diametro={2.6} colapso={0.05} />
    case 'pericardio-normal':
      return <Pericardio derrame={0} />
    case 'derrame-pericardico':
      return <Pericardio derrame={num(params, 'derrame', 5)} />
    default:
      return null
  }
}

/**
 * Corte intercostal longitudinal — o "sinal do morcego".
 *
 * As linhas A são desenhadas por múltiplos da distância pele-pleura, que é o
 * que elas fisicamente são. Mudar a profundidade da linha pleural reposiciona
 * todas elas automaticamente, como aconteceria no aparelho.
 */
function Pulmao({ linhasB, desliza }: { linhasB: number; desliza: boolean }) {
  const yPleura = 34
  const espacamento = yPleura - 6 // distância pele→pleura = período da reverberação

  return (
    <g>
      {/* Tecido subcutâneo e músculo intercostal. */}
      <rect x="0" y="0" width="100" height={yPleura - 4} fill="#2b3038" />
      <rect x="0" y="6" width="100" height="4" fill="#3f4753" opacity="0.7" />
      <rect x="0" y="16" width="100" height="3" fill="#3a4149" opacity="0.6" />

      {/* Costelas com sombra acústica — as âncoras do sinal do morcego. */}
      {[22, 78].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={yPleura - 8} rx="10" ry="4.5" fill="#e8eaed" />
          <path d={`M ${cx - 10} ${yPleura - 6} L ${cx + 10} ${yPleura - 6} L ${cx + 11} 100 L ${cx - 11} 100 Z`} fill={PRETO} opacity="0.94" />
        </g>
      ))}

      {/* Linha pleural — a única estrutura real abaixo da parede. */}
      <rect x="0" y={yPleura} width="100" height="1.6" fill="#f4f6f8" />
      {desliza && <rect x="30" y={yPleura} width="40" height="1.6" fill="#ffffff" opacity="0.55" />}

      {/* Linhas A: repetições exatas da pleura. */}
      {[1, 2, 3].map((n) => {
        const y = yPleura + espacamento * n
        if (y > 98) return null
        return <rect key={n} x="0" y={y} width="100" height="1.1" fill="#aeb6bf" opacity={0.72 - n * 0.16} />
      })}

      {/* Linhas B: partem da pleura, vão até o fim da tela e apagam as A. */}
      {Array.from({ length: Math.max(0, Math.round(linhasB)) }, (_, i) => {
        const x = 30 + i * 9 + (i % 2) * 2
        return (
          <g key={i}>
            <path d={`M ${x - 1.6} ${yPleura} L ${x + 1.6} ${yPleura} L ${x + 4.5} 100 L ${x - 4.5} 100 Z`} fill="#e7ebef" opacity="0.62" />
            <rect x={x - 0.6} y={yPleura} width="1.2" height={100 - yPleura} fill="#ffffff" opacity="0.8" />
          </g>
        )
      })}
    </g>
  )
}

/**
 * Modo M: o eixo horizontal é **tempo**, não espaço.
 *
 * É o que torna possível registrar a ausência de deslizamento — um achado
 * puramente dinâmico — numa imagem estática. Acima da pleura, parede parada:
 * linhas retas nos dois casos. Abaixo, pulmão deslizando gera granulado
 * ("praia"); pulmão parado gera a continuação das linhas ("código de barras").
 */
function ModoM({ desliza }: { desliza: boolean }) {
  const yPleura = 42
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#15181d" />
      {/* Parede torácica: imóvel, linhas horizontais nos dois cenários. */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x="0" y={6 + i * 4} width="100" height="1.2" fill="#9aa2ab" opacity={0.35 + (i % 3) * 0.12} />
      ))}
      <rect x="0" y={yPleura} width="100" height="1.8" fill="#f4f6f8" />

      {desliza ? (
        // "Praia": granulado abaixo da pleura.
        <g>
          {Array.from({ length: 320 }, (_, i) => {
            const x = (i * 37) % 100
            const y = yPleura + 3 + ((i * 53) % 54)
            return <circle key={i} cx={x} cy={y} r="0.45" fill="#cfd6dd" opacity="0.5" />
          })}
        </g>
      ) : (
        // "Código de barras": as mesmas linhas horizontais continuam abaixo.
        <g>
          {Array.from({ length: 13 }, (_, i) => (
            <rect key={i} x="0" y={yPleura + 4 + i * 4.2} width="100" height="1.2" fill="#9aa2ab" opacity={0.42 - i * 0.015} />
          ))}
        </g>
      )}

      <text x="4" y="96" fill="#f2c14e" fontSize="4.2" fontFamily="system-ui, sans-serif">
        Modo M · {desliza ? 'praia' : 'código de barras'}
      </text>
    </g>
  )
}

/** Base do hemitórax: líquido, diafragma e o sinal da coluna. */
function DerramePleural() {
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#1a1e24" />
      {/* Fígado abaixo do diafragma — janela acústica. */}
      <path d="M 0 62 Q 40 56 100 64 L 100 100 L 0 100 Z" fill="#4a5360" />
      <path d="M 0 62 Q 40 56 100 64 L 100 100 L 0 100 Z" fill="#5c6672" opacity="0.5" />
      {/* Diafragma. */}
      <path d="M 0 62 Q 40 56 100 64" stroke="#f0f3f6" strokeWidth="1.8" fill="none" />
      {/* Derrame: anecoico, acima do diafragma. */}
      <path d="M 0 22 Q 40 18 100 26 L 100 63 Q 40 56 0 61 Z" fill={ANECOICO} />
      {/* Pulmão atelectasiado flutuando — "sinal da medusa". */}
      <path d="M 26 30 Q 44 34 56 30 Q 62 40 52 48 Q 36 52 28 44 Z" fill="#9aa3ad" opacity="0.85" />
      {/* Sinal da coluna: as vértebras aparecem acima do diafragma. */}
      {[70, 80, 90].map((y) => (
        <ellipse key={y} cx="50" cy={y} rx="9" ry="3" fill="#e6e9ed" opacity="0.7" />
      ))}
      {[30, 42, 54].map((y) => (
        <ellipse key={y} cx="50" cy={y} rx="8" ry="2.6" fill="#e6e9ed" opacity="0.55" />
      ))}
      <text x="4" y="96" fill="#f2c14e" fontSize="4" fontFamily="system-ui, sans-serif">
        sinal da coluna +
      </text>
    </g>
  )
}

/** Recesso hepatorrenal. `liquido` é a espessura da faixa anecoica. */
function Morrison({ liquido }: { liquido: number }) {
  return (
    <g>
      {/* Tecido de fundo em cinza médio. Sem ele, uma faixa anecoica desenhada
          sobre preto é invisível — e é justamente a faixa preta entre fígado e
          rim que constitui o exame positivo. */}
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      {/* Diafragma. */}
      <path d="M 12 24 Q 45 14 82 26" stroke="#eef1f4" strokeWidth="1.6" fill="none" opacity="0.9" />
      {/* Fígado: textura própria e borda visível, para não se confundir com o
          tecido de fundo — é contra ele que a faixa de líquido contrasta. */}
      <path d="M 4 22 Q 45 14 92 26 L 86 58 Q 44 52 6 58 Z" fill="#6b7684" />
      <path d="M 4 22 Q 45 14 92 26 L 86 58 Q 44 52 6 58 Z" fill="#7d8896" opacity="0.4" />
      <path d="M 4 22 Q 45 14 92 26" stroke="#c8d0d8" strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* Faixa de líquido livre: anecoica, com bordas angulares. */}
      {liquido > 0 && (
        <path
          d={`M 16 ${58 - liquido * 0.2} Q 48 ${53} 80 ${58} L 82 ${58 + liquido} Q 48 ${53 + liquido} 16 ${58 + liquido * 0.9} Z`}
          fill={ANECOICO}
        />
      )}
      {/* Rim direito: córtex e seio central hiperecogênico. */}
      <g transform={`translate(0 ${liquido})`}>
        <ellipse cx="50" cy="72" rx="27" ry="15" fill="#5a6572" />
        <ellipse cx="50" cy="72" rx="27" ry="15" fill="none" stroke="#c8d0d8" strokeWidth="0.8" opacity="0.6" />
        <ellipse cx="50" cy="72" rx="13" ry="6" fill="#dfe4e9" opacity="0.82" />
      </g>
      {liquido > 0 && (
        <text x="4" y="96" fill="#f2c14e" fontSize="4" fontFamily="system-ui, sans-serif">
          líquido livre
        </text>
      )}
    </g>
  )
}

/** Cava longitudinal. `colapso` é a fração que some na inspiração. */
function Cava({ diametro, colapso }: { diametro: number; colapso: number }) {
  const meia = diametro * 4.2
  const meiaInsp = meia * (1 - colapso * 0.9)
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      {/* Fígado — janela subxifoide. */}
      <path d="M 6 10 Q 50 4 96 14 L 96 44 Q 50 36 6 44 Z" fill="#5b6674" />
      {/* Átrio direito, à direita da tela. */}
      <ellipse cx="86" cy="34" rx="13" ry="11" fill={ANECOICO} />
      {/* Cava: expirada (contorno) e inspirada (preenchida). */}
      <path d={`M 10 ${52 + meia} Q 50 ${54 + meia} 78 ${40 + meia} L 78 ${40 - meia} Q 50 ${54 - meia} 10 ${52 - meia} Z`} fill={ANECOICO} />
      <path
        d={`M 10 ${52 + meiaInsp} Q 50 ${54 + meiaInsp} 78 ${40 + meiaInsp} L 78 ${40 - meiaInsp} Q 50 ${54 - meiaInsp} 10 ${52 - meiaInsp} Z`}
        fill="none"
        stroke="#f2c14e"
        strokeWidth="0.7"
        strokeDasharray="2 1.6"
        opacity="0.9"
      />
      {/* Veia hepática desembocando. */}
      <path d="M 44 32 Q 56 40 66 44" stroke={ANECOICO} strokeWidth="3.4" fill="none" />
      {/* Régua da medida, no ponto padronizado. */}
      <line x1="40" y1={52 - meia} x2="40" y2={52 + meia} stroke="#f2c14e" strokeWidth="0.6" />
      <line x1="38" y1={52 - meia} x2="42" y2={52 - meia} stroke="#f2c14e" strokeWidth="0.6" />
      <line x1="38" y1={52 + meia} x2="42" y2={52 + meia} stroke="#f2c14e" strokeWidth="0.6" />
      <text x="4" y="96" fill="#f2c14e" fontSize="4" fontFamily="system-ui, sans-serif">
        {diametro.toFixed(1)} cm · colapso {Math.round(colapso * 100)}%
      </text>
    </g>
  )
}

/** Janela subxifoide de quatro câmaras. `derrame` é a espessura da lâmina. */
function Pericardio({ derrame }: { derrame: number }) {
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      {/* Fígado: a janela acústica desta incidência. */}
      <path d="M 2 20 Q 30 14 52 26 L 40 54 Q 14 48 2 44 Z" fill="#515b67" />
      {/* Saco pericárdico. */}
      <ellipse cx="56" cy="56" rx={30 + derrame} ry={26 + derrame} fill={derrame > 0 ? ANECOICO : '#2b323b'} />
      <ellipse cx="56" cy="56" rx={30 + derrame} ry={26 + derrame} fill="none" stroke="#eef1f4" strokeWidth="1.3" />
      {/* Miocárdio. */}
      <ellipse cx="56" cy="56" rx="30" ry="26" fill="#5a6470" />
      {/* Ventrículo direito: mais raso, paredes finas; colapsa quando comprimido. */}
      <ellipse
        cx="45"
        cy="45"
        rx={11 - derrame * 1.1}
        ry={8 - derrame * 0.9}
        fill={ANECOICO}
        transform="rotate(-28 45 45)"
      />
      {/* Ventrículo esquerdo: mais profundo, parede espessa. */}
      <ellipse cx="63" cy="63" rx="12" ry="9.5" fill={ANECOICO} transform="rotate(-28 63 63)" />
      {derrame > 0 && (
        <text x="4" y="96" fill="#f2c14e" fontSize="4" fontFamily="system-ui, sans-serif">
          derrame circunferencial · colapso de VD
        </text>
      )}
    </g>
  )
}
