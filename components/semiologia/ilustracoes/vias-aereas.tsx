'use client'

import { Quadro, Vinheta, corDeTecido, num, txt, type PropsDeIlustracao } from './base'

/**
 * Orofaringe e fossa nasal.
 *
 * ## O que estas duas cenas têm em comum
 *
 * Nas duas, o achado que decide é **assimetria** ou **cor** — e ambos são
 * exatamente o que se perde numa descrição escrita. "Úvula desviada" é uma
 * frase; a diferença entre a orofaringe simétrica da faringite e a massa
 * unilateral do abscesso peritonsilar é uma imagem, e é a imagem que faz o
 * aluno reconhecer a emergência no meio de vinte dores de garganta banais.
 *
 * Na rinoscopia o eixo é cor: mucosa **pálida** da rinite alérgica contra
 * mucosa **hiperemiada** da infecciosa. São dois mecanismos opostos — edema que
 * afasta capilares da superfície versus vasodilatação — e o desenho paramétrico
 * consegue mostrar os dois com o mesmo traço, variando só a matiz.
 */

// ─── Orofaringe ───────────────────────────────────────────────────────────────

type CenaOro = 'normal' | 'faringite-estreptococica' | 'abscesso-peritonsilar' | 'candidiase'

export function Orofaringe({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const cena = txt(params, 'cena', 'normal') as CenaOro
  const sufixo = cena.replace(/[^a-z]/g, '')

  const hiperemia =
    cena === 'faringite-estreptococica' ? 0.85 : cena === 'abscesso-peritonsilar' ? 0.7 : cena === 'candidiase' ? 0.25 : 0.12
  // O abaulamento peritonsilar é unilateral e empurra a úvula para o lado são.
  const abaulamento = cena === 'abscesso-peritonsilar' ? 1 : 0
  const desvioUvula = abaulamento * 11
  const amigdala = cena === 'normal' ? 7 : cena === 'candidiase' ? 8 : 12

  const corMucosa = `rgb(${Math.round(212 + hiperemia * 30)}, ${Math.round(140 - hiperemia * 52)}, ${Math.round(
    138 - hiperemia * 50,
  )})`

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#140d0e">
      <defs>
        <Vinheta id={`oro-vin-${sufixo}`} dureza={0.5} />
      </defs>

      {/* Lábios e arcada. */}
      <ellipse cx="50" cy="50" rx="48" ry="44" fill={corDeTecido('#c4796d')} />
      <ellipse cx="50" cy="52" rx="41" ry="37" fill={corDeTecido('#2a1113')} />

      {/* Palato mole e parede posterior. */}
      <path d="M 12 50 Q 50 14 88 50 L 88 66 Q 50 44 12 66 Z" fill={corDeTecido(corMucosa)} />
      <ellipse cx="50" cy="66" rx="34" ry="20" fill={corDeTecido(corMucosa)} opacity="0.92" />
      <ellipse cx="50" cy="70" rx="26" ry="14" fill={corDeTecido('#8d3a37')} opacity="0.5" />

      {/* Língua, embaixo. */}
      <ellipse cx="50" cy="98" rx="36" ry="20" fill={corDeTecido('#c06c63')} />

      {/* Petéquias no palato — achado de peso na faringite estreptocócica. */}
      {cena === 'faringite-estreptococica' &&
        Array.from({ length: 14 }, (_, i) => (
          <circle key={i} cx={26 + ((i * 17) % 48)} cy={34 + ((i * 11) % 14)} r="0.9" fill={corDeTecido('#8c1420')} opacity="0.9" />
        ))}

      {/* Amígdalas. A esquerda cresce e abaula no abscesso. */}
      <ellipse cx={28 - abaulamento * 3} cy="62" rx={amigdala + abaulamento * 6} ry={amigdala + 2 + abaulamento * 5} fill={corDeTecido(corMucosa)} />
      <ellipse cx={28 - abaulamento * 3} cy="62" rx={amigdala + abaulamento * 6} ry={amigdala + 2 + abaulamento * 5} fill={corDeTecido('#a64a44')} opacity="0.35" />
      <ellipse cx="72" cy="62" rx={amigdala} ry={amigdala + 2} fill={corDeTecido(corMucosa)} />
      <ellipse cx="72" cy="62" rx={amigdala} ry={amigdala + 2} fill={corDeTecido('#a64a44')} opacity="0.3" />

      {/* Exsudato nas criptas. */}
      {cena === 'faringite-estreptococica' &&
        [
          [24, 58, 3],
          [31, 65, 2.4],
          [70, 60, 2.8],
          [75, 66, 2.2],
        ].map(([cx, cy, r]) => <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={r} ry={r * 0.8} fill={corDeTecido('#f2ead6')} opacity="0.95" />)}

      {/* Placas destacáveis da candidíase — em língua e mucosa, não nas criptas. */}
      {cena === 'candidiase' &&
        [
          [44, 92, 9, 4],
          [58, 94, 7, 3.4],
          [34, 88, 6, 3],
          [20, 70, 5, 3],
          [80, 72, 5, 3],
        ].map(([cx, cy, rx, ry]) => (
          <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} fill={corDeTecido('#f6f1e2')} opacity="0.95" />
        ))}

      {/* Úvula — central no normal, desviada no abscesso. */}
      <path
        d={`M ${50 + desvioUvula} 42 Q ${52 + desvioUvula} 54 ${50 + desvioUvula} 62 Q ${48 + desvioUvula} 54 ${
          50 + desvioUvula
        } 42 Z`}
        fill={corDeTecido(corMucosa)}
        stroke={corDeTecido('#8d3a37')}
        strokeWidth="0.5"
      />

      {abaulamento > 0 && (
        <text x="5" y="14" fill="#f2c14e" fontSize="4.4" fontFamily="system-ui, sans-serif">
          úvula desviada · assimetria
        </text>
      )}
      <circle cx="50" cy="50" r="50" fill={`url(#oro-vin-${sufixo})`} />
    </Quadro>
  )
}

// ─── Rinoscopia anterior ──────────────────────────────────────────────────────

type CenaNasal = 'normal' | 'rinite-alergica' | 'polipo'

export function Rinoscopia({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const cena = txt(params, 'cena', 'normal') as CenaNasal
  const sufixo = cena.replace(/[^a-z]/g, '')

  const alergica = cena === 'rinite-alergica'
  const polipo = cena === 'polipo'
  // Palidez azulada na alérgica; rósea no normal.
  const corMucosa = alergica ? '#b9b7c6' : '#d78a80'
  const volumeCorneto = alergica ? 1 : 0.45

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#120b0c">
      <defs>
        <Vinheta id={`rin-vin-${sufixo}`} dureza={0.5} />
        {/* Sem este recorte, o septo e o corneto vazam para fora da abertura
            do espéculo — o desenho vira um retângulo colado sobre o vestíbulo. */}
        <clipPath id={`rin-rec-${sufixo}`}>
          <ellipse cx="50" cy="52" rx="39" ry="40" />
        </clipPath>
      </defs>

      {/* Vestíbulo nasal. */}
      <ellipse cx="50" cy="52" rx="46" ry="46" fill={corDeTecido('#b06a5e')} />
      <ellipse cx="50" cy="52" rx="39" ry="40" fill={corDeTecido('#1f0f10')} />

      <g clipPath={`url(#rin-rec-${sufixo})`}>
      {/* Septo, à direita da imagem. */}
      <path d="M 66 8 Q 72 52 66 96 L 96 96 L 96 8 Z" fill={corDeTecido(alergica ? '#a9a6b6' : '#b96f67')} />
      <path
        d="M 66 8 Q 72 52 66 96"
        stroke={corDeTecido(alergica ? '#8c8a99' : '#8f4f49')}
        strokeWidth="1.2"
        fill="none"
      />
      {/* Sombra da parede septal: sem ela o septo lê como bloco chapado, e não
          como a parede que divide a fossa. */}
      <path d="M 66 8 Q 72 52 66 96 L 78 96 L 78 8 Z" fill="#000" opacity="0.18" />
      {/* Área de Kiesselbach — plexo ântero-inferior. */}
      <ellipse cx="66" cy="68" rx="7" ry="9" fill={corDeTecido('#c0392b')} opacity="0.32" />
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={`M ${62 + i * 1.4} ${58 + i * 2} Q ${68} ${64 + i * 1.6} ${72 - i} ${74 + i}`}
          stroke={corDeTecido('#a8281c')}
          strokeWidth="0.4"
          fill="none"
          opacity="0.55"
        />
      ))}

      {/* Corneto inferior: rosado e sensível; pálido e volumoso na alérgica. */}
      <ellipse
        cx={30 + volumeCorneto * 6}
        cy="62"
        rx={14 + volumeCorneto * 7}
        ry={10 + volumeCorneto * 5}
        fill={corDeTecido(corMucosa)}
      />
      <ellipse
        cx={30 + volumeCorneto * 6}
        cy="62"
        rx={14 + volumeCorneto * 7}
        ry={10 + volumeCorneto * 5}
        fill={corDeTecido(alergica ? '#8f8d9e' : '#a8564c')}
        opacity="0.28"
      />

      {/* Corneto médio e meato médio, acima. */}
      <ellipse cx="34" cy="34" rx="11" ry="7" fill={corDeTecido(corMucosa)} opacity="0.9" />
      <path d="M 26 42 Q 38 40 48 44" stroke={corDeTecido('#4a1d1c')} strokeWidth="2.6" fill="none" opacity="0.8" />

      {/* Pólipo: translúcido, acinzentado, emergindo do meato médio. */}
      {polipo && (
        <>
          <ellipse cx="42" cy="50" rx="11" ry="14" fill={corDeTecido('#d9d2c4')} opacity="0.92" />
          <ellipse cx="42" cy="50" rx="11" ry="14" fill="none" stroke={corDeTecido('#b5ac9b')} strokeWidth="0.6" />
          <ellipse cx="39" cy="44" rx="4" ry="5" fill="#ffffff" opacity="0.35" />
        </>
      )}

      {/* Secreção clara e aquosa da rinite alérgica. */}
      {alergica && (
        <path d="M 24 78 Q 36 86 52 84 Q 40 92 24 88 Z" fill={corDeTecido('#cfe3ea')} opacity="0.55" />
      )}
      </g>

      <text x="5" y="96" fill="#fff" fontSize="4.2" opacity="0.8" fontFamily="system-ui, sans-serif">
        {alergica ? 'mucosa pálida · azulada' : polipo ? 'massa insensível ao toque' : 'mucosa rósea · septo centrado'}
      </text>
      <circle cx="50" cy="50" r="50" fill={`url(#rin-vin-${sufixo})`} />
    </Quadro>
  )
}
