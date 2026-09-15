'use client'

import { Quadro, Textura, Vinheta, corDeTecido, num, txt, type PropsDeIlustracao } from './base'

/**
 * A membrana timpânica, desenhada a partir do que a doença faz com ela.
 *
 * ## O modelo
 *
 * A cena não é um arquivo por diagnóstico — é um conjunto de quatro parâmetros
 * físicos, e cada diagnóstico é uma combinação deles:
 *
 * - **curvatura** (−1 retraída · 0 plana · +1 abaulada) governa o reflexo
 *   luminoso. O triângulo de luz existe porque uma superfície plana e inclinada
 *   devolve a luz do otoscópio num cone; abaule ou retraia essa superfície e o
 *   cone se desfaz. Aqui ele é **calculado** a partir da curvatura, não
 *   desenhado à mão em cada cena — de modo que é impossível alguém desenhar
 *   uma membrana abaulada que ainda tenha triângulo luminoso.
 * - **opacidade** governa quanto do promontório se enxerga por transparência.
 * - **hiperemia** governa a vascularização visível ao longo do cabo do martelo
 *   e na periferia.
 * - **conduto** governa o quanto a parede do canal invade o campo — é o que
 *   transforma a mesma cena em otite externa.
 *
 * Essa é a vantagem inteira do desenho paramétrico sobre o acervo de imagens:
 * a relação entre mecanismo e aparência fica escrita no código, e o aluno pode
 * varrer o parâmetro e ver o achado nascer.
 */

type Cena =
  | 'normal'
  | 'otite-media-aguda'
  | 'otite-media-com-efusao'
  | 'perfuracao'
  | 'otite-externa'
  | 'cerume'
  | 'colesteatoma'
  | 'otite-media-cronica'
  | 'timpano-retraido'

interface Estado {
  /** −1 retraída · 0 plana · +1 abaulada */
  curvatura: number
  /** 0 translúcida · 1 completamente opaca */
  opacidade: number
  /** 0 sem vasos · 1 muito hiperemiada */
  hiperemia: number
  /** Raio da abertura útil do conduto (0–50). Menor = conduto estreitado. */
  conduto: number
  corMembrana: string
  nivelLiquido?: number
  perfuracao?: boolean
  cerume?: boolean
  /** Massa branca nacarada na pars flaccida — o colesteatoma. */
  colesteatoma?: boolean
  /** Raio da perfuração (em unidades da figura). A central da otite crônica é larga. */
  raioPerfuracao?: number
}

const ESTADOS: Record<Cena, Estado> = {
  normal: { curvatura: -0.12, opacidade: 0.18, hiperemia: 0.12, conduto: 38, corMembrana: '#d9cfc2' },
  'otite-media-aguda': { curvatura: 0.85, opacidade: 0.92, hiperemia: 0.95, conduto: 36, corMembrana: '#c96a5a' },
  'otite-media-com-efusao': {
    curvatura: -0.75,
    opacidade: 0.62,
    hiperemia: 0.2,
    conduto: 38,
    corMembrana: '#d8b36a',
    nivelLiquido: 0.52,
  },
  perfuracao: { curvatura: -0.05, opacidade: 0.35, hiperemia: 0.3, conduto: 38, corMembrana: '#d2c6b6', perfuracao: true },
  'otite-externa': { curvatura: -0.1, opacidade: 0.3, hiperemia: 0.5, conduto: 17, corMembrana: '#cfc2b2' },
  cerume: { curvatura: -0.1, opacidade: 0.25, hiperemia: 0.15, conduto: 38, corMembrana: '#cfc2b2', cerume: true },
  colesteatoma: { curvatura: -0.55, opacidade: 0.55, hiperemia: 0.35, conduto: 38, corMembrana: '#cbbcae', colesteatoma: true },
  'otite-media-cronica': { curvatura: -0.05, opacidade: 0.45, hiperemia: 0.45, conduto: 38, corMembrana: '#c9b8a6', perfuracao: true, raioPerfuracao: 13 },
  'timpano-retraido': { curvatura: -0.95, opacidade: 0.28, hiperemia: 0.15, conduto: 38, corMembrana: '#d3c8ba' },
}

export function Otoscopia({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const cena = txt(params, 'cena', 'normal') as Cena
  const base = ESTADOS[cena] ?? ESTADOS.normal
  // A retração é a curvatura negativa, lida em milímetros de profundidade
  // quando a cena é a de tímpano retraído: 0 mm é plana, 5 mm é colada ao
  // promontório. Nas demais cenas a curvatura vem do estado.
  const retracao = cena === 'timpano-retraido' ? num(params, 'retracao', 4) : undefined
  const curvatura = retracao !== undefined ? -Math.min(1, retracao / 5) : num(params, 'curvatura', base.curvatura)
  const raio = base.conduto
  // Perfuração: diâmetro em mm na otite crônica (0–10), raio fixo na traumática.
  const raioPerfuracao = base.raioPerfuracao ? Math.max(1.5, num(params, 'diametro', 7) * 1.9) : 8.5
  // Colesteatoma: fração do campo timpânico ocupada pela massa (0–80%).
  const areaColesteatoma = base.colesteatoma ? Math.max(0.04, num(params, 'area', 30) / 100) : 0

  // O triângulo luminoso é função da planura. Quanto mais a membrana se afasta
  // do plano — para fora ou para dentro —, menos o reflexo se organiza em cone.
  const forcaDoCone = Math.max(0, 1 - Math.abs(curvatura) * 1.9)

  const sufixo = cena.replace(/[^a-z]/g, '')
  const idTextura = `oto-tex-${sufixo}`
  const idVinheta = `oto-vin-${sufixo}`
  const idMembrana = `oto-mem-${sufixo}`
  const idPromontorio = `oto-prom-${sufixo}`
  const idRecorte = `oto-rec-${sufixo}`

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#1a1012">
      <defs>
        <Textura id={idTextura} escala={1.4} opacidade={0.14} />
        <Vinheta id={idVinheta} dureza={0.56} />
        <clipPath id={idRecorte}>
          <circle cx="50" cy="50" r={raio} />
        </clipPath>
        {/* O brilho central desloca-se conforme a curvatura: convexa devolve luz
            no centro, côncava devolve na periferia. */}
        <radialGradient id={idMembrana} cx={`${50 - curvatura * 6}%`} cy={`${46 - curvatura * 8}%`} r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.15 + Math.max(0, curvatura) * 0.35} />
          <stop offset="45%" stopColor={corDeTecido(base.corMembrana)} stopOpacity="1" />
          <stop offset="100%" stopColor={corDeTecido(escurecer(base.corMembrana, 0.32))} stopOpacity="1" />
        </radialGradient>
        <radialGradient id={idPromontorio} cx="60%" cy="45%" r="34%">
          <stop offset="0%" stopColor="#e8b4a4" stopOpacity={0.85 * (1 - base.opacidade)} />
          <stop offset="100%" stopColor="#e8b4a4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Parede do conduto auditivo — o anel de pele que emoldura tudo. */}
      <circle cx="50" cy="50" r="50" fill={corDeTecido(cena === 'otite-externa' ? '#c2705f' : '#9c6a5c')} />
      <circle cx="50" cy="50" r="50" fill={corDeTecido('#7d4f45')} opacity="0.45" filter={`url(#${idTextura})`} />

      <g clipPath={`url(#${idRecorte})`}>
        {/* Membrana */}
        <circle cx="50" cy="50" r={raio} fill={`url(#${idMembrana})`} />
        {/* Promontório por transparência — some conforme a opacidade sobe. */}
        <circle cx="50" cy="50" r={raio} fill={`url(#${idPromontorio})`} />

        {/* Pars flaccida: sem camada fibrosa, sempre um pouco mais opaca e
            rosada que a pars tensa. */}
        <path
          d={`M ${50 - raio * 0.72} ${50 - raio * 0.52} A ${raio} ${raio} 0 0 1 ${50 + raio * 0.72} ${50 - raio * 0.52} Z`}
          fill={corDeTecido('#c9a091')}
          opacity={0.5 + base.hiperemia * 0.3}
        />

        {/* Vascularização radial ao longo do cabo do martelo e da periferia. */}
        {base.hiperemia > 0.25 &&
          Array.from({ length: 14 }, (_, i) => {
            const ang = (i / 14) * Math.PI * 2
            const x1 = 50 + Math.cos(ang) * raio * 0.95
            const y1 = 50 + Math.sin(ang) * raio * 0.95
            const x2 = 50 + Math.cos(ang) * raio * (0.3 + (i % 3) * 0.12)
            const y2 = 50 + Math.sin(ang) * raio * (0.3 + (i % 3) * 0.12)
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} Q ${(x1 + x2) / 2 + 1.4} ${(y1 + y2) / 2} ${x2} ${y2}`}
                stroke={corDeTecido('#a83b2c')}
                strokeWidth={0.55}
                fill="none"
                opacity={base.hiperemia * 0.75}
              />
            )
          })}

        {/* Nível hidroaéreo e bolhas da efusão. */}
        {base.nivelLiquido !== undefined && (
          <>
            <path
              d={`M ${50 - raio} ${50 + raio * (base.nivelLiquido - 0.5) * 2} L ${50 + raio} ${
                50 + raio * (base.nivelLiquido - 0.5) * 2 - 2
              } L ${50 + raio} ${50 + raio} L ${50 - raio} ${50 + raio} Z`}
              fill={corDeTecido('#c99b45')}
              opacity="0.55"
            />
            <line
              x1={50 - raio}
              y1={50 + raio * (base.nivelLiquido - 0.5) * 2}
              x2={50 + raio}
              y2={50 + raio * (base.nivelLiquido - 0.5) * 2 - 2}
              stroke={corDeTecido('#8a6620')}
              strokeWidth="0.7"
              opacity="0.8"
            />
            {[
              [42, 42, 3.1],
              [58, 46, 2.2],
              [50, 38, 1.7],
            ].map(([cx, cy, r]) => (
              <circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={corDeTecido('#f0dca8')}
                strokeWidth="0.6"
                opacity="0.75"
              />
            ))}
          </>
        )}

        {/* Perfuração central: buraco com mucosa do promontório ao fundo. Na
            otite crônica ela é larga, de bordas espessadas, e a mucosa que se
            vê está inflamada — o tímpano não cicatriza porque o ouvido médio
            continua drenando por ele. */}
        {base.perfuracao && (
          <>
            <ellipse cx={base.raioPerfuracao ? 47 : 41} cy={base.raioPerfuracao ? 56 : 60} rx={raioPerfuracao} ry={raioPerfuracao * 0.82} fill={corDeTecido('#5d2a26')} />
            <ellipse cx={base.raioPerfuracao ? 47 : 41} cy={base.raioPerfuracao ? 56 : 60} rx={raioPerfuracao} ry={raioPerfuracao * 0.82} fill={corDeTecido(base.raioPerfuracao ? '#c4574a' : '#a8564c')} opacity="0.55" />
            <ellipse cx={base.raioPerfuracao ? 47 : 41} cy={base.raioPerfuracao ? 56 : 60} rx={raioPerfuracao} ry={raioPerfuracao * 0.82} fill="none" stroke={corDeTecido('#f2e6d6')} strokeWidth={base.raioPerfuracao ? 1.4 : 0.8} />
            <ellipse cx={base.raioPerfuracao ? 45 : 39.5} cy={base.raioPerfuracao ? 54 : 58.5} rx={raioPerfuracao * 0.38} ry={raioPerfuracao * 0.3} fill={corDeTecido('#d38b7c')} opacity="0.6" />
          </>
        )}

        {/* Colesteatoma: massa branca nacarada de queratina na pars flaccida,
            dentro de uma bolsa de retração ático-posterior, com detritos e
            granulação ao redor. Cresce para dentro — o que se vê é a ponta. */}
        {base.colesteatoma && (
          <>
            <ellipse cx="54" cy={50 - raio * 0.5} rx={raio * 0.55 * Math.sqrt(areaColesteatoma) + 4} ry={raio * 0.45 * Math.sqrt(areaColesteatoma) + 3} fill={corDeTecido('#4a2320')} opacity="0.8" />
            <ellipse cx="54" cy={50 - raio * 0.5} rx={raio * 0.5 * Math.sqrt(areaColesteatoma) + 3} ry={raio * 0.4 * Math.sqrt(areaColesteatoma) + 2.2} fill={corDeTecido('#f4f0e6')} />
            <ellipse cx="52" cy={50 - raio * 0.54} rx={raio * 0.25 * Math.sqrt(areaColesteatoma) + 1.5} ry={raio * 0.18 * Math.sqrt(areaColesteatoma) + 1} fill="#ffffff" opacity="0.55" />
            <ellipse cx="62" cy={50 - raio * 0.4} rx="2.6" ry="2" fill={corDeTecido('#b8362a')} opacity="0.85" />
          </>
        )}

        {/* Cabo do martelo: some sob o abaulamento, ganha destaque na retração. */}
        <g opacity={cena === 'cerume' ? 0 : Math.max(0.15, 1 - Math.max(0, curvatura) * 0.95)}>
          <path
            d={`M ${50 - raio * 0.14} ${50 - raio * 0.56} L ${50 - curvatura * 1.5} ${50 + raio * 0.2}`}
            stroke={corDeTecido('#f4ece0')}
            strokeWidth={1.5 + Math.max(0, -curvatura) * 0.8}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(${curvatura < -0.4 ? 12 : 0} 50 50)`}
          />
          {/* Processo lateral — proeminente quando a membrana retrai. */}
          <circle
            cx={50 - raio * 0.16}
            cy={50 - raio * 0.58}
            r={1.1 + Math.max(0, -curvatura) * 0.9}
            fill={corDeTecido('#fbf5ea')}
          />
          {/* Umbo */}
          <circle cx={50 - curvatura * 1.5} cy={50 + raio * 0.2} r="1.1" fill={corDeTecido('#fbf5ea')} opacity="0.9" />
        </g>

        {/* Cone de luz — intensidade derivada da planura da membrana. */}
        {forcaDoCone > 0.05 && (
          <path
            d={`M ${50 - curvatura * 1.5} ${50 + raio * 0.2} L ${50 + raio * 0.62} ${50 + raio * 0.72} L ${
              50 + raio * 0.2
            } ${50 + raio * 0.86} Z`}
            fill="#ffffff"
            opacity={forcaDoCone * 0.72}
          />
        )}

        {/* Rolha de cerume. */}
        {base.cerume && (
          <>
            <ellipse cx="52" cy="54" rx={raio * 0.92} ry={raio * 0.82} fill={corDeTecido('#8a5a1e')} />
            <ellipse cx="52" cy="54" rx={raio * 0.92} ry={raio * 0.82} fill={corDeTecido('#5d3a10')} opacity="0.5" filter={`url(#${idTextura})`} />
            <ellipse cx="45" cy="45" rx="9" ry="6" fill={corDeTecido('#b78437')} opacity="0.6" />
          </>
        )}

        {/* Ânulo timpânico. */}
        <circle cx="50" cy="50" r={raio - 0.6} fill="none" stroke={corDeTecido('#f0e4d2')} strokeWidth="1.1" opacity="0.55" />
      </g>

      <circle cx="50" cy="50" r="50" fill={`url(#${idVinheta})`} />
    </Quadro>
  )
}

/** Escurece um hex por um fator — usado só no gradiente da membrana. */
function escurecer(hex: string, fator: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * (1 - fator))
  const g = Math.round(((n >> 8) & 255) * (1 - fator))
  const b = Math.round((n & 255) * (1 - fator))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
