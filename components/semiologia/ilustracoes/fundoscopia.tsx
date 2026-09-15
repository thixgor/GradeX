'use client'

import { Quadro, Textura, Vinheta, corDeTecido, num, txt, type PropsDeIlustracao } from './base'

/**
 * O fundo de olho.
 *
 * ## Por que as lesões são geradas, e não posicionadas
 *
 * Hemorragias, microaneurismas e exsudatos são semeados por uma função
 * pseudoaleatória com semente fixa: a mesma cena dá sempre a mesma figura (não
 * pisca entre renderizações nem difere entre servidor e cliente), mas as lesões
 * não ficam alinhadas como se alguém as tivesse colocado uma a uma. Retina real
 * não distribui lesão em grade.
 *
 * Mais importante: a semeadura respeita a **topografia da doença**. Na
 * retinopatia diabética, o polo posterior concentra; na oclusão venosa central,
 * os quatro quadrantes se enchem ao longo das veias; na hipertensiva, as
 * hemorragias em chama seguem a camada de fibras nervosas e por isso são
 * alongadas na direção radial ao disco. A regra de distribuição é parte do que
 * a figura ensina — é ela que o aluno vai usar para diferenciar oclusão de ramo
 * (um setor) de oclusão central (tudo).
 */

type Cena =
  | 'normal'
  | 'papiledema'
  | 'retinopatia-diabetica'
  | 'retinopatia-hipertensiva'
  | 'oclusao-venosa-central'
  | 'descolamento-de-retina'
  | 'oclusao-arterial-central'
  | 'hemorragia-vitrea'
  | 'papila-palida'

/** Gerador determinístico — mesma cena, mesma figura, sempre. */
function semente(n: number): () => number {
  let estado = n >>> 0
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0
    return estado / 4294967296
  }
}

const DISCO = { x: 30, y: 50 }

export function Fundoscopia({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const cena = txt(params, 'cena', 'normal') as Cena
  const sufixo = cena.replace(/[^a-z]/g, '')

  const papiledema = cena === 'papiledema'
  const oclusao = cena === 'oclusao-venosa-central'
  const diabetica = cena === 'retinopatia-diabetica'
  const hipertensiva = cena === 'retinopatia-hipertensiva'
  const descolamento = cena === 'descolamento-de-retina'
  const oclusaoArterial = cena === 'oclusao-arterial-central'
  const hemorragiaVitrea = cena === 'hemorragia-vitrea'
  const papilaPalida = cena === 'papila-palida'

  // Calibre arteriolar: a hipertensiva estreita; a oclusão venosa dilata a veia;
  // a oclusão arterial afila as artérias até o fio.
  const calibreArteria = num(params, 'calibreArteria', hipertensiva ? 0.62 : oclusaoArterial ? 0.45 : 1)
  const calibreVeia = num(params, 'calibreVeia', oclusao ? 1.6 : 1)
  // Parâmetros das cenas novas, cada um no que a ficha mede.
  const extensaoDescolamento = descolamento ? Math.max(0, Math.min(100, num(params, 'extensao', 45))) / 100 : 0
  const palidezRetina = oclusaoArterial ? Math.max(0, Math.min(3, num(params, 'palidez', 2))) / 3 : 0
  const obscurecido = hemorragiaVitrea ? Math.max(0, Math.min(100, num(params, 'obscurecido', 60))) / 100 : 0
  const palidezDisco = papilaPalida ? Math.max(0, Math.min(3, num(params, 'palidez', 2))) / 3 : 0

  const idFundo = `fun-bg-${sufixo}`
  const idDisco = `fun-disc-${sufixo}`
  const idMacula = `fun-mac-${sufixo}`
  const idTextura = `fun-tex-${sufixo}`
  const idVinheta = `fun-vin-${sufixo}`
  const idBorrao = `fun-blur-${sufixo}`
  const idRecorte = `fun-rec-${sufixo}`

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#100608">
      <defs>
        <Textura id={idTextura} escala={2.2} opacidade={0.1} />
        <Vinheta id={idVinheta} dureza={0.72} />
        <clipPath id={idRecorte}>
          <circle cx="50" cy="50" r="49" />
        </clipPath>
        <radialGradient id={idFundo} cx="34%" cy="50%" r="78%">
          <stop offset="0%" stopColor={corDeTecido('#d9743f')} />
          <stop offset="55%" stopColor={corDeTecido('#c35c33')} />
          <stop offset="100%" stopColor={corDeTecido('#8e3a22')} />
        </radialGradient>
        <radialGradient id={idDisco} cx="50%" cy="50%" r="50%">
          {/* O disco pálido perde o rosa da vascularização e vira giz. */}
          <stop offset="0%" stopColor={corDeTecido(papiledema ? '#f6b98c' : misturar('#fbe6c2', '#ffffff', palidezDisco))} />
          <stop offset={papiledema ? '55%' : '38%'} stopColor={corDeTecido(papiledema ? '#ee9a6a' : misturar('#f2c98d', '#f7f5f0', palidezDisco))} />
          <stop offset="100%" stopColor={corDeTecido(papiledema ? '#e07f57' : misturar('#e9b273', '#eeeae2', palidezDisco))} />
        </radialGradient>
        <radialGradient id={idMacula} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={corDeTecido('#7a2e1c')} stopOpacity="0.85" />
          <stop offset="100%" stopColor={corDeTecido('#7a2e1c')} stopOpacity="0" />
        </radialGradient>
        <filter id={idBorrao} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      <g clipPath={`url(#${idRecorte})`}>
        <circle cx="50" cy="50" r="49" fill={`url(#${idFundo})`} />
        <circle cx="50" cy="50" r="49" fill={corDeTecido('#6d2a18')} opacity="0.35" filter={`url(#${idTextura})`} />

        {/* Arcadas vasculares. As veias vão por baixo; as artérias, por cima —
            é assim que o cruzamento arteriovenoso ganha sentido. */}
        <Vasos tipo="veia" calibre={calibreVeia} tortuosidade={oclusao ? 1 : 0.25} />
        <Vasos tipo="arteria" calibre={calibreArteria} tortuosidade={0.15} estreitamentoFocal={hipertensiva} />

        {/* Cruzamentos patológicos da hipertensiva: a arteríola espessada
            comprime a vênula e ela some no ponto de passagem. */}
        {hipertensiva &&
          [
            [55, 30],
            [58, 71],
          ].map(([cx, cy]) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r="2.6" fill={corDeTecido('#c35c33')} opacity="0.9" />
              <circle cx={cx} cy={cy} r="1.1" fill={corDeTecido('#f3d9a8')} opacity="0.35" />
            </g>
          ))}

        {/* Oclusão arterial: a retina inteira embranquece pelo edema isquêmico
            — menos a fóvea, que é fina demais para inchar e deixa ver a coroide
            por baixo. É o que faz a mácula parecer uma cereja: ela não está
            mais vermelha; tudo ao redor é que ficou pálido. */}
        {oclusaoArterial && <circle cx="50" cy="50" r="49" fill="#f3ead8" opacity={0.28 + palidezRetina * 0.42} />}

        {/* Mácula e reflexo foveal. */}
        <ellipse cx="70" cy="52" rx="11" ry="9.5" fill={`url(#${idMacula})`} />
        {oclusaoArterial && <circle cx="71" cy="52" r={3.2 + palidezRetina * 1.2} fill={corDeTecido('#b3261e')} opacity={0.55 + palidezRetina * 0.4} />}
        {!diabetica && !oclusao && !oclusaoArterial && <circle cx="72" cy="52" r="0.9" fill="#fff" opacity="0.8" />}

        {/* Estrela macular: exsudato disposto radialmente pelas fibras de Henle. */}
        {hipertensiva && <EstrelaMacular />}

        {/* Disco óptico. */}
        <g filter={papiledema ? `url(#${idBorrao})` : undefined}>
          <ellipse cx={DISCO.x} cy={DISCO.y} rx={papiledema ? 10.5 : 8.4} ry={papiledema ? 10 : 9} fill={`url(#${idDisco})`} />
        </g>
        {!papiledema && (
          <>
            <ellipse cx={DISCO.x} cy={DISCO.y} rx="8.4" ry="9" fill="none" stroke={corDeTecido('#a8552f')} strokeWidth="0.5" opacity="0.7" />
            {/* Escavação fisiológica. */}
            <ellipse cx={DISCO.x + 0.6} cy={DISCO.y} rx="3" ry="3.1" fill={corDeTecido('#fdf3df')} opacity="0.75" />
          </>
        )}
        {/* Neovasos do disco na retinopatia proliferativa. */}
        {diabetica && <Neovasos />}

        {/* Lesões, semeadas conforme a topografia de cada doença. */}
        {diabetica && <LesoesDiabeticas />}
        {(hipertensiva || papiledema || oclusao) && (
          <Chamas
            quantidade={oclusao ? 34 : papiledema ? 8 : 10}
            apenasPeripapilar={papiledema}
            seed={oclusao ? 21 : papiledema ? 33 : 12}
          />
        )}
        {(hipertensiva || papiledema || oclusao) && <ManchasAlgodonosas quantidade={oclusao ? 7 : 4} seed={oclusao ? 5 : 9} />}

        {/* Descolamento: a retina solta perde o vermelho da coroide e vira uma
            membrana cinza-esbranquiçada, elevada e ondulada, com os vasos
            escurecidos correndo por cima das dobras. Começa pela periferia
            temporal superior e avança em direção à mácula. */}
        {descolamento && extensaoDescolamento > 0 && (
          <g>
            <path
              d={`M 99 1 L 99 ${1 + extensaoDescolamento * 98} Q ${70 - extensaoDescolamento * 30} ${20 + extensaoDescolamento * 40} ${40 - extensaoDescolamento * 25} ${1} Z`}
              fill={corDeTecido('#d8d2c8')}
              opacity="0.88"
            />
            {[0.25, 0.5, 0.75].map((t) => (
              <path
                key={t}
                d={`M ${99 - t * 30} ${1 + extensaoDescolamento * 98 * t} Q ${85 - t * 20} ${10 + extensaoDescolamento * 60 * t} ${99} ${extensaoDescolamento * 98 * t * 0.6}`}
                stroke={corDeTecido('#9c9186')}
                strokeWidth="0.9"
                fill="none"
                opacity="0.7"
              />
            ))}
            <path d={`M 86 22 Q 90 ${20 + extensaoDescolamento * 20} 99 ${18 + extensaoDescolamento * 30}`} stroke={corDeTecido('#5a1a1c')} strokeWidth="1.2" fill="none" opacity="0.8" />
          </g>
        )}

        {/* Hemorragia vítrea: sangue na frente da retina. Não é lesão da retina
            — é véu; os detalhes do fundo desaparecem atrás dele conforme a
            quantidade. */}
        {hemorragiaVitrea && (
          <g>
            <circle cx="50" cy="50" r="49" fill={corDeTecido('#5a0d10')} opacity={obscurecido * 0.85} />
            {Array.from({ length: 9 }, (_, i) => (
              <ellipse
                key={i}
                cx={20 + ((i * 29) % 60)}
                cy={22 + ((i * 41) % 56)}
                rx={5 + (i % 3) * 3}
                ry={3 + (i % 2) * 2}
                fill={corDeTecido('#3a0608')}
                opacity={0.35 + obscurecido * 0.5}
              />
            ))}
          </g>
        )}
      </g>

      <circle cx="50" cy="50" r="50" fill={`url(#${idVinheta})`} />
    </Quadro>
  )
}

/** Mistura linear entre dois hex — só para a palidez do disco. */
function misturar(a: string, b: string, t: number): string {
  const na = parseInt(a.slice(1), 16)
  const nb = parseInt(b.slice(1), 16)
  const canal = (shift: number) => Math.round(((na >> shift) & 255) * (1 - t) + ((nb >> shift) & 255) * t)
  return `#${((canal(16) << 16) | (canal(8) << 8) | canal(0)).toString(16).padStart(6, '0')}`
}

/** Arcadas temporais e ramos nasais, espelhados acima e abaixo da mácula. */
function Vasos({
  tipo,
  calibre,
  tortuosidade,
  estreitamentoFocal = false,
}: {
  tipo: 'arteria' | 'veia'
  calibre: number
  tortuosidade: number
  estreitamentoFocal?: boolean
}) {
  const cor = corDeTecido(tipo === 'arteria' ? '#c0392b' : '#7d1f25')
  const largura = (tipo === 'arteria' ? 1.35 : 1.9) * calibre
  const desvio = tortuosidade * 6

  const arcadas = [
    // superior temporal, inferior temporal, nasal superior, nasal inferior
    `M ${DISCO.x} ${DISCO.y} C 44 ${38 - desvio} 62 ${24 + desvio} 86 22`,
    `M ${DISCO.x} ${DISCO.y} C 44 ${62 + desvio} 62 ${76 - desvio} 86 78`,
    `M ${DISCO.x} ${DISCO.y} C 24 ${40 + desvio} 16 ${28 - desvio} 8 20`,
    `M ${DISCO.x} ${DISCO.y} C 24 ${60 - desvio} 16 ${72 + desvio} 8 80`,
  ]
  const ramos = [
    `M 48 33 C 56 ${30 - desvio} 64 34 72 30`,
    `M 48 67 C 56 ${70 + desvio} 64 66 72 70`,
    `M 40 43 C 50 42 58 45 66 43`,
    `M 40 57 C 50 58 58 55 66 57`,
  ]

  const deslocamento = tipo === 'arteria' ? -1.6 : 1.6

  return (
    <g transform={`translate(0 ${deslocamento})`}>
      {arcadas.map((d, i) => (
        <path
          key={`a${i}`}
          d={d}
          stroke={cor}
          strokeWidth={largura}
          fill="none"
          strokeLinecap="round"
          opacity="0.92"
        />
      ))}
      {ramos.map((d, i) => (
        <path key={`r${i}`} d={d} stroke={cor} strokeWidth={largura * 0.6} fill="none" strokeLinecap="round" opacity="0.8" />
      ))}
      {/* Reflexo luminoso central — alargado quando a parede espessa. */}
      {tipo === 'arteria' &&
        arcadas.map((d, i) => (
          <path
            key={`b${i}`}
            d={d}
            stroke="#f6c9a8"
            strokeWidth={largura * (estreitamentoFocal ? 0.5 : 0.28)}
            fill="none"
            opacity={estreitamentoFocal ? 0.75 : 0.45}
          />
        ))}
    </g>
  )
}

/** Hemorragias em chama: seguem a camada de fibras nervosas, radiais ao disco. */
function Chamas({ quantidade, apenasPeripapilar, seed }: { quantidade: number; apenasPeripapilar: boolean; seed: number }) {
  const rnd = semente(seed)
  return (
    <g>
      {Array.from({ length: quantidade }, (_, i) => {
        const ang = rnd() * Math.PI * 2
        const dist = apenasPeripapilar ? 10 + rnd() * 6 : 12 + rnd() * 32
        const x = DISCO.x + Math.cos(ang) * dist
        const y = DISCO.y + Math.sin(ang) * dist * 0.92
        if (x < 4 || x > 96 || y < 4 || y > 96) return null
        const comprimento = 2.6 + rnd() * 3.4
        const rot = (Math.atan2(y - DISCO.y, x - DISCO.x) * 180) / Math.PI
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx={comprimento}
            ry={0.85 + rnd() * 0.6}
            fill={corDeTecido('#8c1420')}
            opacity="0.92"
            transform={`rotate(${rot} ${x} ${y})`}
          />
        )
      })}
    </g>
  )
}

/** Infartos de fibra nervosa: brancos, de bordas esfumaçadas. */
function ManchasAlgodonosas({ quantidade, seed }: { quantidade: number; seed: number }) {
  const rnd = semente(seed)
  return (
    <g>
      {Array.from({ length: quantidade }, (_, i) => {
        const ang = rnd() * Math.PI * 2
        const dist = 14 + rnd() * 24
        const x = DISCO.x + Math.cos(ang) * dist
        const y = DISCO.y + Math.sin(ang) * dist * 0.9
        if (x < 6 || x > 94 || y < 6 || y > 94) return null
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx={2.2 + rnd() * 1.6}
            ry={1.5 + rnd()}
            fill={corDeTecido('#f2efe4')}
            opacity="0.72"
            style={{ filter: 'blur(0.6px)' }}
          />
        )
      })}
    </g>
  )
}

/** Microaneurismas, hemorragias em borrão e exsudatos duros circinados. */
function LesoesDiabeticas() {
  const rnd = semente(41)
  return (
    <g>
      {/* Microaneurismas e hemorragias puntiformes, concentradas no polo posterior. */}
      {Array.from({ length: 30 }, (_, i) => {
        const x = 26 + rnd() * 62
        const y = 20 + rnd() * 60
        return <circle key={`m${i}`} cx={x} cy={y} r={0.55 + rnd() * 0.8} fill={corDeTecido('#8c1420')} opacity="0.95" />
      })}
      {/* Hemorragias em borrão. */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = 32 + rnd() * 54
        const y = 24 + rnd() * 52
        return <ellipse key={`b${i}`} cx={x} cy={y} rx={1.8 + rnd() * 1.4} ry={1.5 + rnd() * 1.2} fill={corDeTecido('#7a0f1a')} opacity="0.9" />
      })}
      {/* Exsudatos duros em anel ao redor da mácula — o sinal do edema macular. */}
      {Array.from({ length: 16 }, (_, i) => {
        const ang = (i / 16) * Math.PI * 2
        const r = 12 + rnd() * 3
        return (
          <ellipse
            key={`e${i}`}
            cx={70 + Math.cos(ang) * r}
            cy={52 + Math.sin(ang) * r * 0.85}
            rx={0.9 + rnd() * 0.8}
            ry={0.7 + rnd() * 0.6}
            fill={corDeTecido('#f4dd8a')}
            opacity="0.95"
          />
        )
      })}
      {/* Manchas algodonosas esparsas. */}
      {[
        [46, 30],
        [58, 68],
        [40, 64],
      ].map(([x, y]) => (
        <ellipse key={`c${x}`} cx={x} cy={y} rx="2.4" ry="1.7" fill={corDeTecido('#f2efe4')} opacity="0.7" style={{ filter: 'blur(0.6px)' }} />
      ))}
    </g>
  )
}

/** Rede fina e desordenada de neovasos sobre o disco. */
function Neovasos() {
  const rnd = semente(77)
  return (
    <g opacity="0.9">
      {Array.from({ length: 22 }, (_, i) => {
        const a1 = rnd() * Math.PI * 2
        const a2 = a1 + (rnd() - 0.5) * 2
        const r1 = rnd() * 7
        const r2 = 3 + rnd() * 8
        return (
          <path
            key={i}
            d={`M ${DISCO.x + Math.cos(a1) * r1} ${DISCO.y + Math.sin(a1) * r1} Q ${DISCO.x + Math.cos((a1 + a2) / 2) * (r2 + 2)} ${
              DISCO.y + Math.sin((a1 + a2) / 2) * (r2 + 2)
            } ${DISCO.x + Math.cos(a2) * r2} ${DISCO.y + Math.sin(a2) * r2}`}
            stroke={corDeTecido('#9e1b24')}
            strokeWidth="0.45"
            fill="none"
          />
        )
      })}
    </g>
  )
}

/** Exsudato radial na mácula — as fibras de Henle desenham a estrela. */
function EstrelaMacular() {
  return (
    <g opacity="0.9">
      {Array.from({ length: 18 }, (_, i) => {
        const ang = (i / 18) * Math.PI * 2
        const r1 = 2.5
        const r2 = 7 + (i % 3) * 1.6
        return (
          <line
            key={i}
            x1={70 + Math.cos(ang) * r1}
            y1={52 + Math.sin(ang) * r1}
            x2={70 + Math.cos(ang) * r2}
            y2={52 + Math.sin(ang) * r2}
            stroke={corDeTecido('#f4dd8a')}
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}
