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
  | 'consolidacao'
  | 'pulmao-linhas-b-focal'
  | 'plax-normal'
  | 'plax-disfuncao-ve'
  | 'psax-normal'
  | 'psax-vd-dilatado'
  | 'aorta-normal'
  | 'aneurisma-aorta'
  | 'vesicula-normal'
  | 'colelitiase'
  | 'colecistite'
  | 'coledoco-dilatado'
  | 'rim-normal'
  | 'hidronefrose'
  | 'bexiga-normal'
  | 'retencao-urinaria'
  | 'veia-normal'
  | 'tvp'
  | 'partes-moles-normal'
  | 'abscesso'
  | 'apical-normal'
  | 'apical-derrame'
  | 'apical-colapso-atrial'
  | 'apical-hipovolemia'
  | 'atelectasia'
  | 'derrame-pleural-complexo'
  | 'fast-pelve-normal'
  | 'fast-pelve-liquido'
  | 'apendice-normal'
  | 'apendicite'
  | 'abscesso-abdominal'
  | 'abdome-agudo-normal'
  | 'gravidez-intrauterina'
  | 'gestacao-ectopica'
  | 'liquido-livre-gestante'
  | 'drenagem-guiada'

const PRETO = '#07080a'
const ANECOICO = '#0b0e12'

export function Ultrassom({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const cena = txt(params, 'cena', 'pulmao-normal') as Cena
  const sufixo = cena.replace(/[^a-z]/g, '')
  const idSpeckle = `us-spk-${sufixo}`
  const idSetor = `us-set-${sufixo}`

  // Leque para o convexo e o setorial; retângulo para o linear. O formato da
  // imagem é a primeira pista de qual sonda foi usada — e ensinar a janela
  // com o transdutor errado ensina a encostar a sonda errada.
  const setorial = !(
    cena.startsWith('pulmao') ||
    cena === 'pneumotorax' ||
    cena === 'consolidacao' ||
    cena === 'veia-normal' ||
    cena === 'tvp' ||
    cena === 'partes-moles-normal' ||
    cena === 'abscesso' ||
    cena === 'atelectasia' ||
    cena === 'derrame-pleural-complexo' ||
    cena === 'apendice-normal' ||
    cena === 'apendicite' ||
    cena === 'drenagem-guiada'
  )

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
    case 'consolidacao':
      return <Consolidacao profundidade={num(params, 'profundidade', 3)} />
    case 'pulmao-linhas-b-focal':
      return <Pulmao linhasB={num(params, 'linhasB', 5)} desliza focal />
    case 'plax-normal':
      return <EixoLongo fracaoEjecao={60} />
    case 'plax-disfuncao-ve':
      return <EixoLongo fracaoEjecao={num(params, 'fracaoEjecao', 25)} />
    case 'psax-normal':
      return <EixoCurto razaoVdVe={0.6} />
    case 'psax-vd-dilatado':
      return <EixoCurto razaoVdVe={num(params, 'razaoVdVe', 1.2)} />
    case 'aorta-normal':
      return <Aorta diametro={2} />
    case 'aneurisma-aorta':
      return <Aorta diametro={num(params, 'diametro', 5.5)} />
    case 'vesicula-normal':
      return <Vesicula calculos={0} parede={2} />
    case 'colelitiase':
      return <Vesicula calculos={num(params, 'calculos', 3)} parede={2} />
    case 'colecistite':
      return <Vesicula calculos={1} parede={num(params, 'parede', 6)} impactado />
    case 'coledoco-dilatado':
      return <Coledoco diametro={num(params, 'diametro', 11)} />
    case 'rim-normal':
      return <Rim grau={0} />
    case 'hidronefrose':
      return <Rim grau={num(params, 'grau', 3)} />
    case 'bexiga-normal':
      return <Bexiga volume={150} />
    case 'retencao-urinaria':
      return <Bexiga volume={num(params, 'volume', 800)} />
    case 'veia-normal':
      return <VeiaFemoral compressibilidade={100} />
    case 'tvp':
      return <VeiaFemoral compressibilidade={num(params, 'compressibilidade', 10)} />
    case 'partes-moles-normal':
      return <PartesMoles diametro={0} />
    case 'abscesso':
      return <PartesMoles diametro={num(params, 'diametro', 4)} />
    case 'apical-normal':
      return <ApicalQuatroCamaras derrame={0} colapsoAtrio={0} hipovolemia={0} />
    case 'apical-derrame':
      return <ApicalQuatroCamaras derrame={num(params, 'derrame', 15)} colapsoAtrio={0} hipovolemia={0} />
    case 'apical-colapso-atrial':
      return <ApicalQuatroCamaras derrame={18} colapsoAtrio={num(params, 'colapso', 40) / 100} hipovolemia={0} />
    case 'apical-hipovolemia':
      return <ApicalQuatroCamaras derrame={0} colapsoAtrio={0} hipovolemia={1 - (Math.max(2, Math.min(25, num(params, 'area', 8))) - 2) / 23} />
    case 'atelectasia':
      return <Atelectasia extensao={num(params, 'extensao', 50) / 100} />
    case 'derrame-pleural-complexo':
      return <DerramePleuralComplexo debris={num(params, 'debris', 2)} />
    case 'fast-pelve-normal':
      return <FastPelve lamina={0} />
    case 'fast-pelve-liquido':
      return <FastPelve lamina={num(params, 'lamina', 12)} />
    case 'abdome-agudo-normal':
    case 'apendice-normal':
      return <Apendice diametro={4.5} />
    case 'apendicite':
      return <Apendice diametro={num(params, 'diametro', 9)} apendicolito />
    case 'abscesso-abdominal':
      return <AbscessoAbdominal diametro={num(params, 'diametro', 6)} />
    case 'gravidez-intrauterina':
      return <Obstetrico semanas={num(params, 'semanas', 7)} />
    case 'gestacao-ectopica':
      return <Obstetrico semanas={7} ectopica massaAnexial={num(params, 'massa', 25)} liquido={200} />
    case 'liquido-livre-gestante':
      return <Obstetrico semanas={7} ectopica massaAnexial={20} liquido={num(params, 'volume', 500)} />
    case 'drenagem-guiada':
      return <DrenagemGuiada profundidade={num(params, 'profundidade', 3)} />
    default:
      return null
  }
}

/** Texto de rodapé no amarelo do aparelho — a "anotação do operador". */
function Legenda({ children }: { children: string }) {
  return (
    <text x="4" y="96" fill="#f2c14e" fontSize="4" fontFamily="system-ui, sans-serif">
      {children}
    </text>
  )
}

/**
 * Corte intercostal longitudinal — o "sinal do morcego".
 *
 * As linhas A são desenhadas por múltiplos da distância pele-pleura, que é o
 * que elas fisicamente são. Mudar a profundidade da linha pleural reposiciona
 * todas elas automaticamente, como aconteceria no aparelho.
 */
function Pulmao({ linhasB, desliza, focal = false }: { linhasB: number; desliza: boolean; focal?: boolean }) {
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
        // Focal: as linhas se agrupam num só lado do espaço intercostal, com o
        // resto do campo ainda em padrão A. É a distribuição — não a contagem —
        // que separa pneumonia de congestão.
        const x = focal ? 52 + i * 4.2 : 30 + i * 9 + (i % 2) * 2
        return (
          <g key={i}>
            <path d={`M ${x - 1.6} ${yPleura} L ${x + 1.6} ${yPleura} L ${x + 4.5} 100 L ${x - 4.5} 100 Z`} fill="#e7ebef" opacity="0.62" />
            <rect x={x - 0.6} y={yPleura} width="1.2" height={100 - yPleura} fill="#ffffff" opacity="0.8" />
          </g>
        )
      })}
      {focal && linhasB > 0 && <Legenda>linhas B focais · padrão A ao redor</Legenda>}
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

/**
 * Consolidação subpleural: o pulmão "vira fígado".
 *
 * Ar não deixa o feixe passar; tecido deixa. Quando o alvéolo se enche de
 * exsudato, o parênquima passa a ser atravessado como qualquer víscera e
 * ganha textura — a "hepatização". Os pontos brilhantes dentro dela são ar
 * residual nos brônquios: os broncogramas aéreos. A borda profunda irregular
 * com o pulmão ainda aerado é o sinal do fragmento (shred sign); a borda lisa
 * e regular é derrame ou atelectasia, não pneumonia.
 */
function Consolidacao({ profundidade }: { profundidade: number }) {
  const yPleura = 30
  const fundo = yPleura + Math.max(0, profundidade) * 12
  const contorno = `M 30 ${yPleura + 1.6} L 70 ${yPleura + 1.6} L 72 ${fundo - 6} L 66 ${fundo} L 58 ${fundo - 4} L 50 ${fundo + 2} L 42 ${fundo - 3} L 34 ${fundo + 1} L 28 ${fundo - 5} Z`
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#2b3038" />
      <rect x="0" y="6" width="100" height="4" fill="#3f4753" opacity="0.7" />
      {[20, 80].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={yPleura - 8} rx="9" ry="4.5" fill="#e8eaed" />
          <path d={`M ${cx - 9} ${yPleura - 6} L ${cx + 9} ${yPleura - 6} L ${cx + 10} 100 L ${cx - 10} 100 Z`} fill={PRETO} opacity="0.94" />
        </g>
      ))}
      <rect x="0" y={yPleura} width="100" height="1.6" fill="#f4f6f8" />
      {/* Pulmão aerado ao fundo: linhas A continuam onde não há consolidação. */}
      {[1, 2].map((n) => (
        <rect key={n} x="0" y={yPleura + 24 * n} width="100" height="1" fill="#aeb6bf" opacity={0.5 - n * 0.15} />
      ))}
      {profundidade > 0 && (
        <g>
          {/* Hepatização: textura de víscera com borda profunda em fragmentos. */}
          <path d={contorno} fill="#6b7684" />
          <path d={contorno} fill="#7d8896" opacity="0.45" />
          {/* Broncogramas aéreos: pontos e traços brilhantes, ramificados. */}
          {Array.from({ length: Math.round(6 + profundidade * 3) }, (_, i) => {
            const x = 34 + ((i * 29) % 34)
            const y = yPleura + 5 + ((i * 17) % Math.max(4, fundo - yPleura - 8))
            return i % 3 === 0 ? (
              <rect key={i} x={x} y={y} width="4" height="1.1" fill="#f4f6f8" opacity="0.9" />
            ) : (
              <circle key={i} cx={x} cy={y} r="0.8" fill="#f4f6f8" opacity="0.9" />
            )
          })}
          <Legenda>{`hepatização ${profundidade.toFixed(1)} cm · broncogramas aéreos · shred sign`}</Legenda>
        </g>
      )}
    </g>
  )
}

/**
 * Paraesternal eixo longo. `fracaoEjecao` decide quanto a cavidade encolhe.
 *
 * A figura sobrepõe as duas fases: a diástole como contorno tracejado e a
 * sístole como cavidade preenchida. A fração de ejeção **é** a diferença entre
 * as duas — e desenhar só uma delas, como fazem os esquemas de livro, esconde
 * exatamente o que se estima a olho. Abaixo de 35% o ventrículo também dilata:
 * o coração que bombeia mal se enche mais para tentar compensar.
 */
function EixoLongo({ fracaoEjecao }: { fracaoEjecao: number }) {
  const fe = Math.max(10, Math.min(70, fracaoEjecao)) / 100
  const dilatacao = fe < 0.35 ? (0.35 - fe) * 30 : 0
  const rxD = 22 + dilatacao
  const ryD = 12 + dilatacao * 0.6
  // Raio sistólico derivado da FE: volume ∝ área, então o fator é √(1 − FE).
  const encolhe = Math.sqrt(1 - fe)
  const rxS = rxD * (0.55 + encolhe * 0.45)
  const ryS = ryD * (0.5 + encolhe * 0.5)
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      {/* Ventrículo direito, anterior, em cima da tela. */}
      <path d="M 18 10 Q 50 4 84 12 L 84 24 Q 50 20 18 26 Z" fill={ANECOICO} />
      {/* Septo interventricular. */}
      <path d="M 18 26 Q 50 20 84 24" stroke="#c8d0d8" strokeWidth="2.2" fill="none" />
      {/* Aorta e átrio esquerdo, à direita. */}
      <path d="M 66 30 L 96 26 L 96 44 L 70 46 Z" fill={ANECOICO} />
      <path d="M 66 30 L 96 26 M 70 46 L 96 44" stroke="#e6e9ed" strokeWidth="1.2" fill="none" />
      <ellipse cx="80" cy="66" rx="15" ry="13" fill={ANECOICO} />
      <ellipse cx="80" cy="66" rx="15" ry="13" fill="none" stroke="#c8d0d8" strokeWidth="0.8" opacity="0.6" />
      {/* Ventrículo esquerdo: diástole tracejada, sístole preenchida. */}
      <ellipse cx="42" cy="50" rx={rxD} ry={ryD} fill="#262d36" />
      <ellipse cx="42" cy="50" rx={rxS} ry={ryS} fill={ANECOICO} />
      <ellipse cx="42" cy="50" rx={rxD} ry={ryD} fill="none" stroke="#f2c14e" strokeWidth="0.7" strokeDasharray="2 1.6" />
      {/* Parede posterior espessa. */}
      <path d={`M 14 ${50 + ryD + 2} Q 42 ${50 + ryD + 9} 66 ${50 + ryD + 3}`} stroke="#c8d0d8" strokeWidth="2.4" fill="none" />
      {/* Folheto anterior da mitral, entre VE e AE. */}
      <path d={`M 64 44 L ${52 + rxS * 0.3} ${50 - ryS * 0.4}`} stroke="#e6e9ed" strokeWidth="1.1" />
      <Legenda>{`FE estimada ${Math.round(fe * 100)}% · tracejado = diástole`}</Legenda>
    </g>
  )
}

/**
 * Paraesternal eixo curto, nível dos papilares. `razaoVdVe` é a relação de
 * tamanhos entre as duas cavidades.
 *
 * O ventrículo esquerdo normal é um anel — a pressão dentro dele é maior que a
 * do direito, então o septo abaúla para o lado direito e o VE fica redondo. Se
 * a pressão direita sobe, o septo se achata e o VE vira um "D". Esse é o sinal
 * que muda a conduta: é a sobrecarga de pressão do VD vista de dentro do VE.
 */
function EixoCurto({ razaoVdVe }: { razaoVdVe: number }) {
  const razao = Math.max(0.3, Math.min(1.5, razaoVdVe))
  const achatamento = razao >= 1 ? Math.min(1, (razao - 1) * 2 + 0.3) : 0
  const rVe = 15
  const cx = 58
  const cy = 58
  // O septo é o lado esquerdo do anel do VE. Normal: arco. Achatado: corda.
  const xSepto = cx - rVe + achatamento * 9
  const rvRx = 12 + razao * 14
  const cavidade =
    achatamento > 0
      ? `M ${xSepto} ${cy - Math.sqrt(rVe * rVe - (xSepto - cx) ** 2)} A ${rVe} ${rVe} 0 1 1 ${xSepto} ${cy + Math.sqrt(rVe * rVe - (xSepto - cx) ** 2)} Z`
      : `M ${cx - rVe} ${cy} A ${rVe} ${rVe} 0 1 1 ${cx + rVe} ${cy} A ${rVe} ${rVe} 0 1 1 ${cx - rVe} ${cy} Z`
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      {/* Ventrículo direito: meia-lua anterior e à esquerda do VE, que cresce com a razão. */}
      <path
        d={`M ${cx - rvRx - 4} ${cy - 6} Q ${cx - rvRx * 0.4} ${cy - rVe - 10 - razao * 6} ${cx + rvRx * 0.6} ${cy - rVe - 6} Q ${cx + 4} ${cy - rVe - 2} ${xSepto - 2} ${cy - 12} L ${xSepto - 2} ${cy + 12} Q ${cx - 10} ${cy + rVe + 4} ${cx - rvRx - 2} ${cy + 10} Z`}
        fill={ANECOICO}
      />
      {/* Miocárdio do VE: anel espesso. */}
      <circle cx={cx} cy={cy} r={rVe + 7} fill="#5a6470" />
      {/* Cavidade do VE: redonda no normal, "D" quando o septo achata. */}
      <path d={cavidade} fill={ANECOICO} />
      {/* Músculos papilares: dois, às 4 e 8 horas. */}
      <circle cx={cx + 6} cy={cy + 8} r="3" fill="#8d97a3" />
      <circle cx={cx - 6} cy={cy + 8} r="3" fill="#8d97a3" />
      <Legenda>{`VD/VE ${razao.toFixed(1)}${achatamento > 0 ? ' · septo achatado (sinal do D)' : ''}`}</Legenda>
    </g>
  )
}

/**
 * Aorta abdominal em corte transverso. `diametro` é a medida externa em cm.
 *
 * A referência é a sombra da vértebra: a aorta fica logo à frente dela, à
 * esquerda da cava. Acima de 3 cm é aneurisma; acima de 5,5 cm o risco de
 * ruptura passa a justificar cirurgia eletiva. O trombo mural aparece a partir
 * de dilatações maiores e é a armadilha clássica: medir só a luz que o Doppler
 * mostra é subestimar o aneurisma em centímetros.
 */
function Aorta({ diametro }: { diametro: number }) {
  const d = Math.max(1, Math.min(8, diametro))
  const r = d * 4.6
  const trombo = d > 4 ? (d - 4) * 1.4 : 0
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      {/* Alças e gordura mesentérica por cima. */}
      <path d="M 10 10 Q 50 2 90 12 L 90 30 Q 50 22 10 32 Z" fill="#59636f" opacity="0.8" />
      {/* Corpo vertebral: arco brilhante com sombra acústica atrás. */}
      <path d="M 30 76 Q 50 68 70 76" stroke="#eef1f4" strokeWidth="2.4" fill="none" />
      <path d="M 30 77 L 70 77 L 74 100 L 26 100 Z" fill={PRETO} opacity="0.92" />
      {/* Cava, à direita do paciente (esquerda da tela), oval e achatável. */}
      <ellipse cx="30" cy="60" rx="8" ry="5" fill={ANECOICO} />
      {/* Aorta: circular, parede espessa e brilhante; à esquerda do paciente. */}
      <circle cx="58" cy="56" r={r + 1.6} fill="#c8d0d8" />
      <circle cx="58" cy="56" r={r} fill="#6b7684" />
      <circle cx="58" cy="56" r={Math.max(2, r - trombo)} fill={ANECOICO} />
      {/* Régua da medida externa. */}
      <line x1={58 - r - 1.6} y1="86" x2={58 + r + 1.6} y2="86" stroke="#f2c14e" strokeWidth="0.6" />
      <line x1={58 - r - 1.6} y1="84" x2={58 - r - 1.6} y2="88" stroke="#f2c14e" strokeWidth="0.6" />
      <line x1={58 + r + 1.6} y1="84" x2={58 + r + 1.6} y2="88" stroke="#f2c14e" strokeWidth="0.6" />
      <Legenda>{`${d.toFixed(1)} cm externo${d >= 3 ? ' · aneurisma' : ''}${trombo > 0 ? ' · trombo mural' : ''}`}</Legenda>
    </g>
  )
}

/**
 * Vesícula em corte longitudinal. `calculos` conta as pedras; `parede` é a
 * espessura em mm; `impactado` prende um cálculo no infundíbulo.
 *
 * O cálculo se reconhece por três coisas juntas: é brilhante, projeta sombra
 * limpa e **se move** quando o paciente muda de decúbito. Pólipo é brilhante
 * mas não sombreia nem se move; lama é móvel mas não sombreia. Na colecistite
 * a parede engrossa e ganha uma camada intermediária escura — edema — e o
 * cálculo que não sai do colo é o motivo de tudo.
 */
function Vesicula({ calculos, parede, impactado = false }: { calculos: number; parede: number; impactado?: boolean }) {
  const p = Math.max(2, Math.min(8, parede))
  const e = p * 0.55
  const n = Math.max(0, Math.round(calculos))
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#5b6674" />
      {/* Líquido pericolecístico na colecistite. */}
      {p > 4 && <path d="M 22 40 Q 52 22 86 46 Q 60 74 22 62 Z" fill={ANECOICO} opacity="0.5" />}
      {/* Parede: externa brilhante, meio escuro (edema), interna brilhante. */}
      <path d="M 24 44 Q 54 26 84 48 Q 58 70 24 58 Z" fill="#eef1f4" />
      {p > 3.5 && (
        <path d={`M ${24 + e * 0.5} ${44 + e * 0.3} Q 54 ${26 + e} ${84 - e * 0.5} ${48 + e * 0.2} Q 58 ${70 - e} ${24 + e * 0.5} ${58 - e * 0.3} Z`} fill="#6b7684" />
      )}
      {/* Luz anecoica. */}
      <path d={`M ${24 + e} ${44 + e * 0.6} Q 54 ${26 + e * 1.8} ${84 - e} ${48 + e * 0.4} Q 58 ${70 - e * 1.8} ${24 + e} ${58 - e * 0.6} Z`} fill={ANECOICO} />
      {/* Reforço acústico posterior: líquido deixa passar mais som. */}
      <path d="M 30 62 Q 56 68 80 56 L 84 100 L 26 100 Z" fill="#7d8896" opacity="0.28" />
      {/* Cálculos: arco brilhante na parede dependente, sombra limpa atrás. */}
      {Array.from({ length: Math.min(n, 10) }, (_, i) => {
        const x = impactado ? 78 : 42 + ((i * 7) % 30)
        const y = impactado ? 47 : 61 - ((i * 5) % 9) * 0.5
        return (
          <g key={i}>
            <path d={`M ${x - 3} ${y} Q ${x} ${y - 3.2} ${x + 3} ${y}`} fill="#ffffff" />
            <path d={`M ${x - 3} ${y} L ${x + 3} ${y} L ${x + 4.5} 100 L ${x - 4.5} 100 Z`} fill={PRETO} opacity="0.9" />
          </g>
        )
      })}
      <Legenda>
        {p > 3.5
          ? `parede ${p.toFixed(0)} mm · cálculo impactado${p > 4 ? ' · líquido pericolecístico' : ''}`
          : n > 0
            ? `${n} cálculo(s) com sombra acústica`
            : 'parede fina · luz anecoica · sem cálculo'}
      </Legenda>
    </g>
  )
}

/**
 * Colédoco no hilo hepático. `diametro` em mm.
 *
 * A imagem clássica é o "cano duplo": veia porta atrás, colédoco à frente,
 * correndo paralelos. O colédoco normal é fino — até 6 mm, somando 1 mm por
 * década acima dos 60 e mais alguns após colecistectomia. Dilatado, ele se
 * iguala à porta e o aluno confunde os dois; o Doppler resolve, porque só a
 * porta tem fluxo.
 */
function Coledoco({ diametro }: { diametro: number }) {
  const d = Math.max(2, Math.min(20, diametro))
  const meia = d * 0.55
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#5b6674" />
      {/* Veia porta: calibrosa, parede brilhante. */}
      <path d="M 8 66 Q 50 58 92 64 L 92 76 Q 50 70 8 78 Z" fill={ANECOICO} />
      <path d="M 8 66 Q 50 58 92 64 M 8 78 Q 50 70 92 76" stroke="#e6e9ed" strokeWidth="1.4" fill="none" />
      {/* Colédoco: paralelo, anterior, sem fluxo. */}
      <path d={`M 8 ${54 - meia} Q 50 ${46 - meia} 92 ${52 - meia} L 92 ${52 + meia} Q 50 ${46 + meia} 8 ${54 + meia} Z`} fill={ANECOICO} />
      <path d={`M 8 ${54 - meia} Q 50 ${46 - meia} 92 ${52 - meia} M 8 ${54 + meia} Q 50 ${46 + meia} 92 ${52 + meia}`} stroke="#e6e9ed" strokeWidth="1" fill="none" />
      {/* Régua. */}
      <line x1="50" y1={49 - meia} x2="50" y2={49 + meia} stroke="#f2c14e" strokeWidth="0.6" />
      <line x1="48" y1={49 - meia} x2="52" y2={49 - meia} stroke="#f2c14e" strokeWidth="0.6" />
      <line x1="48" y1={49 + meia} x2="52" y2={49 + meia} stroke="#f2c14e" strokeWidth="0.6" />
      <Legenda>{`colédoco ${d.toFixed(0)} mm${d > 6 ? ' · dilatado' : ''} · porta posterior`}</Legenda>
    </g>
  )
}

/**
 * Rim em corte longitudinal. `grau` é a hidronefrose de 0 a 4.
 *
 * O seio renal normal é o miolo **brilhante** do rim — gordura e vasos. A
 * hidronefrose o escurece de dentro para fora: primeiro a pelve, depois os
 * cálices em ramos, e no grau 4 o córtex já afinou porque a pressão o
 * comprimiu. Um cisto parapiélico simula grau 1 e engana até quem sabe.
 */
function Rim({ grau }: { grau: number }) {
  const g = Math.max(0, Math.min(4, Math.round(grau)))
  const cortex = 15 - (g >= 4 ? 4 : 0)
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      {/* Fígado como janela, no alto. */}
      <path d="M 0 0 L 100 0 L 100 28 Q 50 20 0 30 Z" fill="#5b6674" />
      {/* Cápsula e córtex. */}
      <ellipse cx="50" cy="60" rx="34" ry={cortex + 8} fill="#5a6572" />
      <ellipse cx="50" cy="60" rx="34" ry={cortex + 8} fill="none" stroke="#c8d0d8" strokeWidth="0.9" opacity="0.7" />
      {/* Pirâmides: hipoecoicas, triangulares, no córtex. */}
      {[-22, -11, 0, 11, 22].map((dx) => (
        <path key={dx} d={`M ${50 + dx - 3} ${60 - cortex + 2} L ${50 + dx + 3} ${60 - cortex + 2} L ${50 + dx} ${60 - 5} Z`} fill="#4a5461" opacity="0.8" />
      ))}
      {/* Seio renal: brilhante no normal. */}
      <ellipse cx="50" cy="60" rx="18" ry="6.5" fill="#dfe4e9" opacity="0.85" />
      {/* Hidronefrose: pelve e cálices anecoicos, ramificados, crescendo com o grau. */}
      {g >= 1 && <ellipse cx="50" cy="60" rx={6 + g * 3} ry={3 + g * 1.2} fill={ANECOICO} />}
      {g >= 2 &&
        [-14, -7, 7, 14].map((dx) => (
          <ellipse key={dx} cx={50 + dx} cy={60 - 4 - Math.abs(dx) * 0.15} rx={2.4 + g * 0.6} ry={1.6 + g * 0.7} fill={ANECOICO} />
        ))}
      {g >= 3 &&
        [-14, -7, 7, 14].map((dx) => (
          <path key={dx} d={`M ${50 + dx} ${60 - 3} L ${50 + dx * 0.4} 60`} stroke={ANECOICO} strokeWidth={2 + g} strokeLinecap="round" />
        ))}
      <Legenda>{g === 0 ? 'seio renal hiperecogênico · sem dilatação' : `hidronefrose grau ${g}${g >= 4 ? ' · córtex afinado' : ''}`}</Legenda>
    </g>
  )
}

/**
 * Bexiga em corte transverso suprapúbico. `volume` em mL.
 *
 * Volume estimado = largura × altura × profundidade × 0,52. O que o desenho
 * ensina não é a fórmula: é que bexiga com 150 mL é uma sombra discreta atrás
 * do púbis, e com 800 mL é uma bola que sobe acima do umbigo — a mesma que a
 * mão sente como "globo vesical".
 */
function Bexiga({ volume }: { volume: number }) {
  const v = Math.max(0, Math.min(1500, volume))
  const rx = 6 + Math.cbrt(v) * 3
  const ry = rx * 0.62
  const y = 28
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      {/* Parede abdominal. */}
      <rect x="0" y="0" width="100" height="10" fill="#59636f" />
      {/* Bexiga: anecoica; arredondada quando pouco cheia, quadrangular sob tensão. */}
      <rect x={50 - rx} y={y} width={rx * 2} height={ry * 2} rx={v > 400 ? 8 : rx * 0.9} fill={ANECOICO} />
      <rect x={50 - rx} y={y} width={rx * 2} height={ry * 2} rx={v > 400 ? 8 : rx * 0.9} fill="none" stroke="#e6e9ed" strokeWidth="1" opacity="0.8" />
      {/* Reforço acústico atrás. */}
      <rect x={50 - rx * 0.8} y={y + ry * 2} width={rx * 1.6} height="30" fill="#7d8896" opacity="0.28" />
      {/* Régua de largura. */}
      <line x1={50 - rx} y1={y + ry * 2 + 5} x2={50 + rx} y2={y + ry * 2 + 5} stroke="#f2c14e" strokeWidth="0.6" />
      <Legenda>{`≈ ${Math.round(v)} mL${v >= 300 ? ' · globo vesical' : ''}`}</Legenda>
    </g>
  )
}

/**
 * Veia femoral comum, transverso, com e sem compressão. `compressibilidade`
 * é a fração da luz que some quando se aperta.
 *
 * O exame de trombose é **tátil**: a pergunta não é "tem trombo?" e sim "a
 * veia fecha quando eu aperto?". Veia normal colaba até as paredes se tocarem
 * antes de a artéria deformar. Veia trombosada fica redonda debaixo da sonda —
 * e o trombo em si pode ser quase anecoico nos primeiros dias, invisível.
 * Por isso a metade direita da figura é a que decide.
 */
function VeiaFemoral({ compressibilidade }: { compressibilidade: number }) {
  const c = Math.max(0, Math.min(100, compressibilidade)) / 100
  const ryComprimida = 8 * (1 - c * 0.95)
  const trombo = c < 0.6
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      <rect x="0" y="0" width="100" height="8" fill="#59636f" />
      <line x1="50" y1="0" x2="50" y2="100" stroke="#8d949c" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
      {[0, 1].map((lado) => {
        const ox = lado * 50
        const comprimida = lado === 1
        const ry = comprimida ? ryComprimida : 8
        return (
          <g key={lado}>
            {/* Artéria: lateral, parede espessa, redonda nas duas metades. */}
            <circle cx={ox + 16} cy="44" r="6.5" fill="#c8d0d8" />
            <circle cx={ox + 16} cy="44" r="5" fill={ANECOICO} />
            {/* Veia: medial, parede fina; colaba à direita se estiver livre. */}
            <ellipse cx={ox + 32} cy="44" rx="9" ry={Math.max(0.6, ry)} fill={ANECOICO} />
            {trombo && <ellipse cx={ox + 32} cy="44" rx="7.5" ry={Math.max(0.5, ry * 0.8)} fill="#6b7684" opacity="0.9" />}
            <ellipse cx={ox + 32} cy="44" rx="9" ry={Math.max(0.6, ry)} fill="none" stroke="#e6e9ed" strokeWidth="0.8" opacity="0.8" />
            {comprimida && <path d={`M ${ox + 22} 12 L ${ox + 32} 22 L ${ox + 42} 12`} stroke="#f2c14e" strokeWidth="1.2" fill="none" />}
            <text x={ox + 4} y="72" fill="#f2c14e" fontSize="3.6" fontFamily="system-ui, sans-serif">
              {comprimida ? 'com compressão' : 'sem compressão'}
            </text>
          </g>
        )
      })}
      <Legenda>{c >= 0.9 ? 'veia colaba por completo · sem trombo' : `veia não colaba (${Math.round(c * 100)}%)${trombo ? ' · trombo ecogênico na luz' : ''}`}</Legenda>
    </g>
  )
}

/**
 * Partes moles com sonda linear. `diametro` em cm da coleção.
 *
 * Celulite é o subcutâneo "em pedra de calçamento": lóbulos de gordura
 * separados por fendas de líquido, mas sem cavidade. Abscesso é cavidade —
 * hipoecoica, irregular, com ecos que rodam quando se comprime — e é a
 * diferença entre antibiótico e bisturi. A borda posterior mais clara é o
 * reforço acústico: líquido deixa passar mais som que o tecido ao redor.
 */
function PartesMoles({ diametro }: { diametro: number }) {
  const d = Math.max(0, Math.min(10, diametro))
  const rx = d * 4
  const ry = d * 2.2
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      {/* Pele e subcutâneo. */}
      <rect x="0" y="0" width="100" height="5" fill="#e6e9ed" opacity="0.9" />
      <rect x="0" y="5" width="100" height="34" fill="#59636f" />
      {/* Lóbulos de gordura: "pedra de calçamento" leve mesmo no normal. */}
      {Array.from({ length: 10 }, (_, i) => (
        <ellipse key={i} cx={8 + i * 10} cy={14 + (i % 2) * 12} rx="6" ry="4.5" fill="#66717e" opacity="0.7" />
      ))}
      {/* Fáscia e músculo, com o padrão estriado. */}
      <rect x="0" y="39" width="100" height="1.4" fill="#eef1f4" />
      {[46, 52, 58, 64, 70].map((y) => (
        <rect key={y} x="0" y={y} width="100" height="0.9" fill="#aeb6bf" opacity="0.4" />
      ))}
      {d > 0 && (
        <g>
          {/* Coleção: irregular, hipoecoica, com ecos internos. */}
          <path
            d={`M ${50 - rx} 24 Q ${50 - rx * 0.6} ${24 - ry} 50 ${24 - ry * 0.8} Q ${50 + rx * 0.7} ${24 - ry * 0.9} ${50 + rx} 26 Q ${50 + rx * 0.8} ${24 + ry} 50 ${24 + ry * 0.9} Q ${50 - rx * 0.7} ${24 + ry * 1.1} ${50 - rx} 24 Z`}
            fill="#1a2028"
          />
          {Array.from({ length: Math.round(d * 4) }, (_, i) => (
            <circle
              key={i}
              cx={50 - rx * 0.7 + ((i * 13) % Math.max(2, rx * 1.4))}
              cy={24 - ry * 0.5 + ((i * 7) % Math.max(2, ry))}
              r="0.6"
              fill="#8d97a3"
              opacity="0.8"
            />
          ))}
          {/* Reforço acústico posterior. */}
          <rect x={50 - rx * 0.8} y={24 + ry} width={rx * 1.6} height={76 - ry} fill="#7d8896" opacity="0.22" />
          <Legenda>{`coleção ${d.toFixed(1)} cm · ecos internos · reforço posterior`}</Legenda>
        </g>
      )}
    </g>
  )
}

/**
 * Apical de quatro câmaras. `derrame` é a lâmina em mm, `colapsoAtrio` a
 * fração do ciclo em que o átrio direito invagina, `hipovolemia` encolhe as
 * cavidades e as deixa hiperdinâmicas.
 *
 * É a janela em que as quatro câmaras aparecem lado a lado, e por isso a
 * melhor para comparar tamanhos: o átrio direito colabando enquanto o
 * esquerdo se mantém é o tamponamento contado em milissegundos; os dois
 * ventrículos pequenos com paredes que quase se tocam é a hipovolemia.
 */
function ApicalQuatroCamaras({ derrame, colapsoAtrio, hipovolemia }: { derrame: number; colapsoAtrio: number; hipovolemia: number }) {
  const lamina = derrame * 0.3
  const enc = 1 - hipovolemia * 0.45
  const invaginacao = colapsoAtrio * 6
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      {/* Saco pericárdico com a lâmina de líquido, se houver. */}
      <path d={`M ${22 - lamina} 20 Q 50 ${6 - lamina} ${78 + lamina} 20 L ${80 + lamina} 92 Q 50 ${100 + lamina} ${20 - lamina} 92 Z`} fill={derrame > 0 ? ANECOICO : '#2b323b'} />
      <path d={`M ${22 - lamina} 20 Q 50 ${6 - lamina} ${78 + lamina} 20 L ${80 + lamina} 92 Q 50 ${100 + lamina} ${20 - lamina} 92 Z`} fill="none" stroke="#eef1f4" strokeWidth="1.2" />
      {/* Miocárdio. */}
      <path d="M 22 20 Q 50 6 78 20 L 80 92 Q 50 100 20 92 Z" fill="#5a6470" />
      {/* Ventrículos (em cima, no apical o ápice fica no topo da tela). */}
      <ellipse cx={38} cy={38} rx={11 * enc} ry={16 * enc} fill={ANECOICO} />
      <ellipse cx={62} cy={40} rx={9 * enc} ry={14 * enc} fill={ANECOICO} />
      {/* Septo. */}
      <path d="M 50 22 L 50 60" stroke="#c8d0d8" strokeWidth="2" opacity="0.9" />
      {/* Átrios. O direito (à direita da tela) invagina na diástole quando a pressão pericárdica vence a dele. */}
      <ellipse cx={38} cy={72} rx={10} ry={9} fill={ANECOICO} />
      <path
        d={`M ${52} 66 Q 62 ${60 + invaginacao} 72 66 Q 74 78 62 82 Q 50 78 52 66 Z`}
        fill={ANECOICO}
      />
      {/* Válvulas mitral e tricúspide. */}
      <path d="M 30 58 L 46 60 M 54 60 L 70 58" stroke="#e6e9ed" strokeWidth="1.2" />
      {hipovolemia > 0.3 && (
        <path d={`M ${38 - 11 * enc + 2} 38 L ${38 + 11 * enc - 2} 38`} stroke="#f2c14e" strokeWidth="0.6" strokeDasharray="1.5 1" />
      )}
      <Legenda>
        {hipovolemia > 0.3
          ? `cavidades pequenas · paredes se tocam na sístole (${Math.round(2 + (1 - hipovolemia) * 20)} cm²)`
          : derrame > 0
            ? `derrame ${derrame.toFixed(0)} mm${colapsoAtrio > 0 ? ` · AD colaba ${Math.round(colapsoAtrio * 100)}% do ciclo` : ' · sem colapso'}`
            : 'quatro câmaras · VD menor que VE · sem derrame'}
      </Legenda>
    </g>
  )
}

/**
 * Atelectasia: o pulmão colabado tem textura de tecido como a pneumonia, mas
 * é **menor** — perdeu volume — e os broncogramas, se existem, ficam parados,
 * porque não há ar entrando neles. `extensao` é a fração do campo colabada.
 */
function Atelectasia({ extensao }: { extensao: number }) {
  const yPleura = 30
  const alt = 10 + extensao * 40
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#2b3038" />
      {[20, 80].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={yPleura - 8} rx="9" ry="4.5" fill="#e8eaed" />
          <path d={`M ${cx - 9} ${yPleura - 6} L ${cx + 9} ${yPleura - 6} L ${cx + 10} 100 L ${cx - 10} 100 Z`} fill={PRETO} opacity="0.94" />
        </g>
      ))}
      <rect x="0" y={yPleura} width="100" height="1.6" fill="#f4f6f8" />
      {/* Diafragma elevado — o volume perdido puxa tudo para cima. */}
      <path d={`M 0 ${yPleura + alt + 14} Q 50 ${yPleura + alt + 4} 100 ${yPleura + alt + 14}`} stroke="#f0f3f6" strokeWidth="1.8" fill="none" />
      <path d={`M 0 ${yPleura + alt + 14} Q 50 ${yPleura + alt + 4} 100 ${yPleura + alt + 14} L 100 100 L 0 100 Z`} fill="#5c6672" />
      {/* Pulmão colabado: bloco de tecido compacto, de borda lisa, colado ao diafragma. */}
      <path d={`M 30 ${yPleura + 1.6} L 70 ${yPleura + 1.6} L 68 ${yPleura + alt + 10} Q 50 ${yPleura + alt + 4} 32 ${yPleura + alt + 10} Z`} fill="#6b7684" />
      <path d={`M 30 ${yPleura + 1.6} L 70 ${yPleura + 1.6} L 68 ${yPleura + alt + 10} Q 50 ${yPleura + alt + 4} 32 ${yPleura + alt + 10} Z`} fill="#7d8896" opacity="0.4" />
      {/* Broncogramas estáticos: poucos, retos, sem movimento. */}
      {[0.3, 0.55, 0.8].map((t) => (
        <rect key={t} x={38 + t * 20} y={yPleura + 6 + t * alt * 0.6} width="5" height="1" fill="#f4f6f8" opacity="0.8" />
      ))}
      {/* Pequeno derrame acompanhando. */}
      <path d={`M 26 ${yPleura + alt + 6} Q 50 ${yPleura + alt + 12} 74 ${yPleura + alt + 6} L 74 ${yPleura + alt + 12} Q 50 ${yPleura + alt + 16} 26 ${yPleura + alt + 12} Z`} fill={ANECOICO} opacity="0.7" />
      <Legenda>{`atelectasia · ${Math.round(extensao * 100)}% do campo · broncogramas estáticos`}</Legenda>
    </g>
  )
}

/** Derrame pleural complexo: septos e detritos dentro do líquido. `debris` de 0 a 3. */
function DerramePleuralComplexo({ debris }: { debris: number }) {
  const d = Math.max(0, Math.min(3, debris))
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#1a1e24" />
      <path d="M 0 62 Q 40 56 100 64 L 100 100 L 0 100 Z" fill="#4a5360" />
      <path d="M 0 62 Q 40 56 100 64" stroke="#f0f3f6" strokeWidth="1.8" fill="none" />
      <path d="M 0 22 Q 40 18 100 26 L 100 63 Q 40 56 0 61 Z" fill={ANECOICO} />
      {/* Septos: fios ecogênicos que dividem o líquido em lojas. */}
      {d >= 1 &&
        [
          'M 12 30 Q 30 44 24 58',
          'M 40 24 Q 46 40 62 56',
          'M 70 28 Q 60 42 84 58',
          'M 20 44 Q 50 38 80 48',
        ].slice(0, 1 + d).map((p, i) => <path key={i} d={p} stroke="#dfe4e9" strokeWidth="0.9" fill="none" opacity="0.85" />)}
      {/* Detritos: ecos flutuando no líquido. */}
      {Array.from({ length: d * 18 }, (_, i) => (
        <circle key={i} cx={8 + ((i * 31) % 84)} cy={26 + ((i * 17) % 32)} r="0.7" fill="#aeb6bf" opacity="0.7" />
      ))}
      {/* Pleura espessada. */}
      {d >= 2 && <path d="M 0 22 Q 40 18 100 26" stroke="#c8d0d8" strokeWidth="2.6" fill="none" opacity="0.8" />}
      <Legenda>{d === 0 ? 'derrame anecoico simples' : `derrame complexo · septos e detritos (${d}/3)`}</Legenda>
    </g>
  )
}

/** Pelve transversa: bexiga como janela e o líquido livre atrás dela. `lamina` em mm. */
function FastPelve({ lamina }: { lamina: number }) {
  const l = Math.max(0, Math.min(30, lamina)) * 0.5
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      <rect x="0" y="0" width="100" height="10" fill="#59636f" />
      {/* Bexiga cheia: a janela. */}
      <rect x="22" y="22" width="56" height="30" rx="9" fill={ANECOICO} />
      <rect x="22" y="22" width="56" height="30" rx="9" fill="none" stroke="#e6e9ed" strokeWidth="1" opacity="0.8" />
      {/* Útero ou reto atrás. */}
      <ellipse cx="50" cy={66 + l} rx="18" ry="9" fill="#66717e" />
      {/* Líquido livre: faixa anecoica entre a bexiga e o útero, de bordas angulares. */}
      {l > 0 && <path d={`M 20 52 L 80 52 L 84 ${54 + l} Q 50 ${58 + l * 1.3} 16 ${54 + l} Z`} fill={ANECOICO} />}
      <rect x="30" y={76 + l} width="40" height="24" fill="#7d8896" opacity="0.25" />
      <Legenda>{l > 0 ? `líquido livre retrovesical · ${lamina.toFixed(0)} mm` : 'sem líquido atrás da bexiga'}</Legenda>
    </g>
  )
}

/**
 * Apêndice com sonda linear em compressão graduada. `diametro` em mm: até 6
 * é normal; acima, com parede espessa e sem compressão, é apendicite.
 * A estrutura é tubular, cega e sem peristalse — é isso que a distingue de
 * uma alça.
 */
function Apendice({ diametro, apendicolito = false }: { diametro: number; apendicolito?: boolean }) {
  const d = Math.max(3, Math.min(15, diametro))
  const meia = d * 1.6
  const inflamado = d > 6
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      <rect x="0" y="0" width="100" height="6" fill="#e6e9ed" opacity="0.8" />
      <rect x="0" y="6" width="100" height="20" fill="#59636f" />
      {/* Gordura mesentérica: brilhante e espessa quando inflamada. */}
      {inflamado && <ellipse cx="50" cy="52" rx="40" ry="22" fill="#9aa3ad" opacity="0.5" />}
      {/* Apêndice em corte longitudinal: tubo cego, parede em camadas. */}
      <path d={`M 10 ${50 - meia - 2} L 78 ${50 - meia - 2} Q ${86 + meia * 0.4} 50 78 ${50 + meia + 2} L 10 ${50 + meia + 2} Z`} fill="#c8d0d8" />
      <path d={`M 10 ${50 - meia + (inflamado ? 1.5 : 0.6)} L 78 ${50 - meia + (inflamado ? 1.5 : 0.6)} Q ${84 + meia * 0.3} 50 78 ${50 + meia - (inflamado ? 1.5 : 0.6)} L 10 ${50 + meia - (inflamado ? 1.5 : 0.6)} Z`} fill="#5a6572" />
      <path d={`M 10 ${50 - meia * 0.5} L 78 ${50 - meia * 0.5} Q ${82 + meia * 0.2} 50 78 ${50 + meia * 0.5} L 10 ${50 + meia * 0.5} Z`} fill={inflamado ? ANECOICO : '#8d97a3'} />
      {/* Apendicolito com sombra. */}
      {apendicolito && (
        <g>
          <path d="M 40 47 Q 45 42 50 47" fill="#ffffff" />
          <path d="M 40 47 L 50 47 L 52 100 L 38 100 Z" fill={PRETO} opacity="0.85" />
        </g>
      )}
      {/* Régua do diâmetro externo. */}
      <line x1="30" y1={50 - meia - 2} x2="30" y2={50 + meia + 2} stroke="#f2c14e" strokeWidth="0.6" />
      <line x1="28" y1={50 - meia - 2} x2="32" y2={50 - meia - 2} stroke="#f2c14e" strokeWidth="0.6" />
      <line x1="28" y1={50 + meia + 2} x2="32" y2={50 + meia + 2} stroke="#f2c14e" strokeWidth="0.6" />
      <Legenda>{`apêndice ${d.toFixed(0)} mm${inflamado ? ' · não compressível · gordura ecogênica' : ' · compressível · fundo cego'}${apendicolito ? ' · apendicolito' : ''}`}</Legenda>
    </g>
  )
}

/** Coleção intra-abdominal: paredes definidas, conteúdo heterogêneo, alças ao redor. `diametro` em cm. */
function AbscessoAbdominal({ diametro }: { diametro: number }) {
  const d = Math.max(0, Math.min(15, diametro))
  const r = d * 2.6
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      <rect x="0" y="0" width="100" height="12" fill="#59636f" />
      {/* Alças intestinais com gás ao redor. */}
      {[[16, 30], [84, 34], [20, 78], [82, 80]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <ellipse cx={x} cy={y} rx="12" ry="7" fill="#66717e" />
          <path d={`M ${x - 6} ${y - 2} L ${x + 6} ${y - 2}`} stroke="#f4f6f8" strokeWidth="1.4" />
          <path d={`M ${x - 7} ${y} L ${x + 7} ${y} L ${x + 9} 100 L ${x - 9} 100 Z`} fill={PRETO} opacity="0.35" />
        </g>
      ))}
      {d > 0 && (
        <g>
          <ellipse cx="50" cy="52" rx={r + 2} ry={r * 0.8 + 2} fill="#c8d0d8" />
          <ellipse cx="50" cy="52" rx={r} ry={r * 0.8} fill="#1a2028" />
          {Array.from({ length: Math.round(d * 3) }, (_, i) => (
            <circle key={i} cx={50 - r * 0.7 + ((i * 13) % Math.max(2, r * 1.4))} cy={52 - r * 0.5 + ((i * 7) % Math.max(2, r * 1.0))} r="0.7" fill="#8d97a3" opacity="0.8" />
          ))}
          {d > 5 && <path d={`M ${50 - r * 0.6} ${52 - r * 0.3} Q 50 ${52 + r * 0.2} ${50 + r * 0.5} ${52 - r * 0.4}`} stroke="#dfe4e9" strokeWidth="0.8" fill="none" opacity="0.8" />}
          <rect x={50 - r * 0.8} y={52 + r * 0.8} width={r * 1.6} height={48 - r * 0.8} fill="#7d8896" opacity="0.22" />
        </g>
      )}
      <Legenda>{d > 0 ? `coleção ${d.toFixed(1)} cm · parede definida · ecos internos` : 'alças com gás · sem coleção'}</Legenda>
    </g>
  )
}

/**
 * Útero em corte sagital pela bexiga. `semanas` põe saco, vesícula vitelina e
 * embrião conforme a idade; `ectopica` esvazia o útero e põe a massa no
 * anexo; `liquido` em mL enche o fundo de saco.
 */
function Obstetrico({ semanas, ectopica = false, massaAnexial = 0, liquido = 0 }: { semanas: number; ectopica?: boolean; massaAnexial?: number; liquido?: number }) {
  const s = Math.max(4, Math.min(12, semanas))
  const rSaco = 3 + (s - 4) * 1.6
  const embriao = s >= 6
  const l = Math.max(0, Math.min(1000, liquido)) / 1000
  const m = Math.max(0, Math.min(50, massaAnexial)) * 0.3
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      <rect x="0" y="0" width="100" height="8" fill="#59636f" />
      {/* Bexiga como janela, à esquerda. */}
      <path d="M 4 12 Q 30 10 40 22 Q 44 44 20 50 Q 4 46 4 30 Z" fill={ANECOICO} />
      {/* Útero em sagital. */}
      <path d="M 34 26 Q 70 14 84 40 Q 88 64 60 74 Q 36 74 30 54 Z" fill="#66717e" />
      {/* Endométrio: a faixa brilhante central. */}
      <path d="M 44 34 Q 64 26 74 42 Q 76 56 60 62" stroke="#dfe4e9" strokeWidth={ectopica ? 3 : 2} fill="none" opacity="0.9" strokeLinecap="round" />
      {/* Saco gestacional dentro do endométrio, com anel ecogênico. */}
      {!ectopica && (
        <g>
          <ellipse cx="60" cy="46" rx={rSaco + 1.2} ry={rSaco * 0.8 + 1.2} fill="#c8d0d8" />
          <ellipse cx="60" cy="46" rx={rSaco} ry={rSaco * 0.8} fill={ANECOICO} />
          {s >= 5 && <circle cx={60 - rSaco * 0.4} cy={46} r={1.2} fill="none" stroke="#f4f6f8" strokeWidth="0.7" />}
          {embriao && <ellipse cx={60 + rSaco * 0.3} cy={46 + rSaco * 0.2} rx={0.8 + (s - 6) * 0.9} ry={0.6 + (s - 6) * 0.6} fill="#c8d0d8" />}
        </g>
      )}
      {/* Massa anexial da ectópica: anel tubário ao lado do ovário, fora do útero. */}
      {ectopica && m > 0 && (
        <g>
          <ellipse cx="86" cy="70" rx={m + 3} ry={m * 0.8 + 3} fill="#c8d0d8" />
          <ellipse cx="86" cy="70" rx={m} ry={m * 0.8} fill="#1a2028" />
          <ellipse cx="72" cy="78" rx="6" ry="4" fill="#8d97a3" />
        </g>
      )}
      {/* Líquido livre no fundo de saco: atrás do útero, ecogênico se for sangue. */}
      {l > 0 && <path d={`M 40 ${76} Q 66 ${80 + l * 10} 92 ${72} L 94 ${82 + l * 14} Q 66 ${92 + l * 8} 38 ${84 + l * 12} Z`} fill={ANECOICO} />}
      {l > 0.3 && Array.from({ length: Math.round(l * 20) }, (_, i) => <circle key={i} cx={44 + ((i * 23) % 46)} cy={80 + ((i * 7) % Math.max(2, l * 12))} r="0.6" fill="#8d97a3" opacity="0.8" />)}
      <Legenda>
        {ectopica
          ? `útero vazio · massa anexial ${massaAnexial.toFixed(0)} mm${l > 0 ? ` · líquido livre ~${Math.round(l * 1000)} mL` : ''}`
          : l > 0
            ? `líquido livre no fundo de saco ~${Math.round(l * 1000)} mL`
            : `gestação intrauterina · ${s.toFixed(0)} semanas${embriao ? ' · embrião com batimento' : s >= 5 ? ' · vesícula vitelina' : ' · só o saco'}`}
      </Legenda>
    </g>
  )
}

/** Drenagem guiada: a agulha brilhante entrando na coleção, em plano. `profundidade` em cm. */
function DrenagemGuiada({ profundidade }: { profundidade: number }) {
  const p = Math.max(0.5, Math.min(10, profundidade))
  const y = 14 + p * 7
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill="#3a434e" />
      <rect x="0" y="0" width="100" height="5" fill="#e6e9ed" opacity="0.9" />
      <rect x="0" y="5" width="100" height="95" fill="#59636f" />
      {Array.from({ length: 10 }, (_, i) => (
        <ellipse key={i} cx={8 + i * 10} cy={14 + (i % 2) * 12} rx="6" ry="4.5" fill="#66717e" opacity="0.5" />
      ))}
      {/* Coleção alvo. */}
      <ellipse cx="58" cy={y} rx="16" ry="9" fill="#1a2028" />
      <ellipse cx="58" cy={y} rx="16" ry="9" fill="none" stroke="#c8d0d8" strokeWidth="1" opacity="0.7" />
      {/* Agulha em plano: linha brilhante com reverberação, ponta dentro da coleção. */}
      <path d={`M 4 4 L ${56} ${y + 2}`} stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
      <path d={`M 4 6.5 L ${40} ${y * 0.6 + 4}`} stroke="#ffffff" strokeWidth="0.6" opacity="0.5" />
      <circle cx="56" cy={y + 2} r="1.6" fill="#f2c14e" />
      <Legenda>{`agulha em plano · ponta na coleção a ${p.toFixed(1)} cm`}</Legenda>
    </g>
  )
}
