'use client'

import { Quadro, Textura, Vinheta, corDeTecido, num, txt, type PropsDeIlustracao } from './base'

/**
 * As quatro endoscopias: esôfago e estômago, cólon, laringe e brônquios.
 *
 * ## Um tubo, quatro revestimentos
 *
 * Toda endoscopia olha para dentro de um tubo, e o desenho parte disso: um
 * lúmen escuro no centro, a parede em anéis concêntricos que fogem para o
 * fundo, e a luz do aparelho que clareia o primeiro plano e escurece o resto.
 * O que muda entre os órgãos é o **revestimento** — pregas longitudinais
 * pálidas no esôfago, rugas alaranjadas no estômago, haustros triangulares no
 * cólon, os dois cordões brancos da laringe, os anéis cartilaginosos do
 * brônquio. Isso é anatomia, e é fixo.
 *
 * O que muda entre as cenas é a lesão, e ela é sempre desenhada **sobre** o
 * revestimento normal, do jeito que aparece na tela: a erosão é uma faixa
 * mais vermelha na prega, o pólipo é uma bola que projeta sombra, a variz é o
 * cordão azulado que abaúla para o lúmen. Manter o normal por baixo é o que
 * permite ao aluno ver o que foi acrescentado — e é por isso que nenhuma cena
 * apaga o revestimento para desenhar a doença.
 */

type Cena =
  // EDA
  | 'eda-normal'
  | 'esofagite-erosiva'
  | 'barrett'
  | 'varizes-esofagicas'
  | 'ulcera-sangrante'
  | 'ulcera-gastrica'
  | 'cancer-gastrico'
  | 'gastrite-erosiva'
  | 'corpo-estranho-esofagico'
  // Colonoscopia
  | 'colon-normal'
  | 'polipo-adenomatoso'
  | 'cancer-colorretal'
  | 'diverticulose'
  | 'colite-ulcerativa'
  | 'angiodisplasia'
  // Laringoscopia
  | 'laringe-normal'
  | 'paralisia-prega-vocal'
  | 'edema-de-glote'
  | 'lesao-laringea'
  // Broncoscopia
  | 'bronquio-normal'
  | 'corpo-estranho-endobronquico'
  | 'sangramento-endobronquico'
  | 'tampao-mucoso'

type Orgao = 'esofago' | 'estomago' | 'colon' | 'laringe' | 'bronquio'

const ORGAO: Record<Cena, Orgao> = {
  'eda-normal': 'esofago',
  'esofagite-erosiva': 'esofago',
  barrett: 'esofago',
  'varizes-esofagicas': 'esofago',
  'ulcera-sangrante': 'estomago',
  'ulcera-gastrica': 'estomago',
  'cancer-gastrico': 'estomago',
  'gastrite-erosiva': 'estomago',
  'corpo-estranho-esofagico': 'esofago',
  'colon-normal': 'colon',
  'polipo-adenomatoso': 'colon',
  'cancer-colorretal': 'colon',
  diverticulose: 'colon',
  'colite-ulcerativa': 'colon',
  angiodisplasia: 'colon',
  'laringe-normal': 'laringe',
  'paralisia-prega-vocal': 'laringe',
  'edema-de-glote': 'laringe',
  'lesao-laringea': 'laringe',
  'bronquio-normal': 'bronquio',
  'corpo-estranho-endobronquico': 'bronquio',
  'sangramento-endobronquico': 'bronquio',
  'tampao-mucoso': 'bronquio',
}

/** Cor base da mucosa de cada órgão — o que a luz do aparelho mostra de perto. */
const MUCOSA: Record<Orgao, string> = {
  esofago: '#e9b8b0',
  estomago: '#e0876f',
  colon: '#e6a89a',
  laringe: '#d99a92',
  bronquio: '#dcaaa2',
}

export function Endoscopia({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const cena = txt(params, 'cena', 'eda-normal') as Cena
  const orgao = ORGAO[cena] ?? 'esofago'
  const sufixo = cena.replace(/[^a-z]/g, '')
  const idTextura = `end-tex-${sufixo}`
  const idVinheta = `end-vin-${sufixo}`
  const idLumen = `end-lum-${sufixo}`
  const idRecorte = `end-rec-${sufixo}`

  const laringe = orgao === 'laringe'

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#0e0607">
      <defs>
        <Textura id={idTextura} escala={1.6} opacidade={0.12} />
        <Vinheta id={idVinheta} dureza={0.5} />
        <clipPath id={idRecorte}>
          <circle cx="50" cy="50" r="49" />
        </clipPath>
        {/* A luz do aparelho: forte perto, morre no fundo do tubo. */}
        <radialGradient id={idLumen} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#1a0a0b" />
          <stop offset="35%" stopColor={corDeTecido(escurecer(MUCOSA[orgao], 0.55))} />
          <stop offset="100%" stopColor={corDeTecido(MUCOSA[orgao])} />
        </radialGradient>
      </defs>

      <g clipPath={`url(#${idRecorte})`}>
        <circle cx="50" cy="50" r="49" fill={laringe ? corDeTecido(MUCOSA.laringe) : `url(#${idLumen})`} />
        <circle cx="50" cy="50" r="49" fill={corDeTecido('#7a3a33')} opacity="0.3" filter={`url(#${idTextura})`} />

        {orgao === 'esofago' && <Esofago />}
        {orgao === 'estomago' && <Estomago />}
        {orgao === 'colon' && <Colon />}
        {orgao === 'bronquio' && <Bronquio />}
        {orgao === 'laringe' && (
          <Laringe
            abducaoDireita={cena === 'paralisia-prega-vocal' ? 1 : cena === 'edema-de-glote' ? 0.5 : 1}
            abducaoEsquerda={cena === 'paralisia-prega-vocal' ? Math.max(0, Math.min(100, num(params, 'amplitude', 10))) / 100 : cena === 'edema-de-glote' ? 0.5 : 1}
            edema={cena === 'edema-de-glote' ? Math.max(0, Math.min(3, num(params, 'edema', 2))) / 3 : 0}
            lesao={cena === 'lesao-laringea' ? Math.max(0, Math.min(20, num(params, 'tamanho', 10))) / 20 : 0}
            paralisia={cena === 'paralisia-prega-vocal'}
          />
        )}

        {lesao(cena, params)}
      </g>

      <circle cx="50" cy="50" r="50" fill={`url(#${idVinheta})`} />
      <text x="4" y="96" fill="#f2c14e" fontSize="3.8" fontFamily="system-ui, sans-serif">
        {rotulo(cena, params)}
      </text>
    </Quadro>
  )
}

// ─── Revestimentos ────────────────────────────────────────────────────────────

/** Esôfago: pregas longitudinais finas convergindo para o lúmen. */
function Esofago() {
  return (
    <g>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.2
        return (
          <path
            key={i}
            d={`M ${50 + Math.cos(a) * 12} ${50 + Math.sin(a) * 12} Q ${50 + Math.cos(a + 0.12) * 32} ${50 + Math.sin(a + 0.12) * 32} ${50 + Math.cos(a) * 52} ${50 + Math.sin(a) * 52}`}
            stroke={corDeTecido('#c98f86')}
            strokeWidth="2.2"
            fill="none"
            opacity="0.55"
          />
        )
      })}
      {/* Padrão vascular fino — visível no esôfago sadio, some na esofagite e no Barrett. */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2
        return <path key={i} d={`M ${50 + Math.cos(a) * 20} ${50 + Math.sin(a) * 20} l ${Math.cos(a + 0.6) * 9} ${Math.sin(a + 0.6) * 9}`} stroke={corDeTecido('#b5524a')} strokeWidth="0.35" fill="none" opacity="0.6" />
      })}
    </g>
  )
}

/** Estômago: rugas grossas e sinuosas, mucosa alaranjada e brilhante. */
function Estomago() {
  return (
    <g>
      {Array.from({ length: 7 }, (_, i) => {
        const y = 14 + i * 12
        return (
          <path
            key={i}
            d={`M 0 ${y} Q 18 ${y - 6} 34 ${y + 2} T 66 ${y - 2} T 100 ${y + 3}`}
            stroke={corDeTecido('#b85a45')}
            strokeWidth="4.5"
            fill="none"
            opacity="0.5"
            strokeLinecap="round"
          />
        )
      })}
      {/* Reflexo da luz nas cristas das rugas. */}
      {Array.from({ length: 7 }, (_, i) => {
        const y = 12 + i * 12
        return <path key={i} d={`M 0 ${y} Q 18 ${y - 6} 34 ${y + 2} T 66 ${y - 2} T 100 ${y + 3}`} stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.18" />
      })}
    </g>
  )
}

/** Cólon: haustros — as pregas semilunares que fazem o lúmen triangular. */
function Colon() {
  return (
    <g>
      {[46, 34, 22].map((r, i) => (
        <path
          key={r}
          d={`M ${50 - r} ${50 + r * 0.55} L 50 ${50 - r} L ${50 + r} ${50 + r * 0.55} Z`}
          fill="none"
          stroke={corDeTecido('#b9695a')}
          strokeWidth={3.2 - i * 0.6}
          strokeLinejoin="round"
          opacity="0.55"
        />
      ))}
      {/* Padrão vascular submucoso — transparente e ramificado no cólon sadio. */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <path
            key={i}
            d={`M ${50 + Math.cos(a) * 30} ${50 + Math.sin(a) * 30} l ${Math.cos(a + 0.5) * 8} ${Math.sin(a + 0.5) * 8} m -4 -2 l ${Math.cos(a - 0.5) * 6} ${Math.sin(a - 0.5) * 6}`}
            stroke={corDeTecido('#a8463c')}
            strokeWidth="0.45"
            fill="none"
            opacity="0.7"
          />
        )
      })}
    </g>
  )
}

/** Brônquio: anéis cartilaginosos em C e a carina dividindo em dois. */
function Bronquio() {
  return (
    <g>
      {[44, 36, 28, 20].map((r, i) => (
        <path key={r} d={`M ${50 - r} ${52 + r * 0.25} A ${r} ${r} 0 1 1 ${50 + r} ${52 + r * 0.25}`} stroke={corDeTecido('#efe2dc')} strokeWidth={2.8 - i * 0.5} fill="none" opacity="0.7" />
      ))}
      {/* Carina: a crista afiada entre os dois brônquios-fonte. */}
      <path d="M 50 34 L 50 62" stroke={corDeTecido('#f3ebe6')} strokeWidth="1.8" opacity="0.85" />
      <ellipse cx="40" cy="52" rx="7" ry="9" fill="#1a0a0b" />
      <ellipse cx="60" cy="52" rx="7" ry="9" fill="#1a0a0b" />
    </g>
  )
}

/**
 * Laringe vista de cima: as duas pregas vocais em V, abertas na inspiração.
 * `abducao` (0–1) por lado é o quanto cada prega se afasta da linha média;
 * na paralisia uma delas fica parada perto do meio.
 */
function Laringe({
  abducaoDireita,
  abducaoEsquerda,
  edema,
  lesao,
  paralisia,
}: {
  abducaoDireita: number
  abducaoEsquerda: number
  edema: number
  lesao: number
  paralisia: boolean
}) {
  const espessura = 4 + edema * 7
  const cor = edema > 0 ? corDeTecido('#e6b0a8') : corDeTecido('#f4efe9')
  return (
    <g>
      {/* Epiglote no alto, aritenoides embaixo. */}
      <path d="M 18 22 Q 50 4 82 22 Q 50 30 18 22 Z" fill={corDeTecido(edema > 0.3 ? '#c9564a' : '#c98a82')} />
      <ellipse cx="38" cy="82" rx="8" ry="6" fill={corDeTecido(edema > 0.3 ? '#cf6a5e' : '#c98a82')} />
      <ellipse cx="62" cy="82" rx="8" ry="6" fill={corDeTecido(edema > 0.3 ? '#cf6a5e' : '#c98a82')} />
      {/* Glote: o triângulo escuro entre as pregas. */}
      <path d={`M 50 30 L ${50 - abducaoDireita * 16} 78 L ${50 + abducaoEsquerda * 16} 78 Z`} fill="#120608" />
      {/* Pregas vocais: brancas e lisas; grossas e rosadas no edema. */}
      <path d={`M 50 30 L ${50 - abducaoDireita * 16} 78`} stroke={cor} strokeWidth={espessura} strokeLinecap="round" />
      <path d={`M 50 30 L ${50 + abducaoEsquerda * 16} 78`} stroke={cor} strokeWidth={espessura} strokeLinecap="round" />
      {/* Prega paralisada: fica em posição paramediana, arqueada, enquanto a outra abduz. */}
      {paralisia && (
        <path d={`M 50 30 L ${50 + abducaoEsquerda * 16} 78`} stroke={corDeTecido('#e0d8d0')} strokeWidth={espessura + 1} strokeLinecap="round" opacity="0.6" strokeDasharray="1.5 1.5" />
      )}
      {/* Lesão suspeita: massa irregular e friável numa prega. */}
      {lesao > 0 && (
        <g>
          <path
            d={`M ${44 - abducaoDireita * 8} ${52} q ${-6 * lesao - 2} ${-6 * lesao} ${-2} ${-10 * lesao - 3} q ${8 * lesao + 3} ${-2 * lesao} ${10 * lesao + 4} ${6 * lesao + 2} q ${2} ${8 * lesao + 3} ${-6 * lesao - 3} ${8 * lesao + 3} Z`}
            fill={corDeTecido('#c9463a')}
          />
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={44 - abducaoDireita * 8 - 2 + ((i * 7) % 8) * lesao} cy={48 + ((i * 5) % 9) * lesao} r={0.7 + lesao * 0.6} fill={corDeTecido('#f6f0e6')} opacity="0.85" />
          ))}
        </g>
      )}
    </g>
  )
}

// ─── Lesões ───────────────────────────────────────────────────────────────────

function lesao(cena: Cena, params: PropsDeIlustracao['params']) {
  switch (cena) {
    case 'esofagite-erosiva': {
      // Grau de Los Angeles: A (< 5 mm), B (> 5 mm), C (confluentes < 75%), D (≥ 75%).
      const grau = Math.max(0, Math.min(3, Math.round(num(params, 'grau', 2))))
      const n = [2, 3, 5, 8][grau]
      const comprimento = [6, 12, 18, 22][grau]
      return (
        <g>
          {Array.from({ length: n }, (_, i) => {
            const a = (i / Math.max(n, 3)) * Math.PI * 2 + 0.4
            return (
              <path
                key={i}
                d={`M ${50 + Math.cos(a) * 14} ${50 + Math.sin(a) * 14} L ${50 + Math.cos(a) * (14 + comprimento)} ${50 + Math.sin(a) * (14 + comprimento)}`}
                stroke={corDeTecido('#c0271c')}
                strokeWidth={grau >= 2 ? 5 : 3}
                strokeLinecap="round"
                opacity="0.9"
              />
            )
          })}
          {grau === 3 && <circle cx="50" cy="50" r="30" fill="none" stroke={corDeTecido('#c0271c')} strokeWidth="7" opacity="0.55" />}
        </g>
      )
    }
    case 'barrett': {
      // Extensão proximal em cm (0–10): a mucosa salmão sobe em línguas a partir da junção.
      const cm = Math.max(0, Math.min(10, num(params, 'extensao', 4)))
      const alcance = 14 + cm * 3.4
      return (
        <g>
          <circle cx="50" cy="50" r="14" fill={corDeTecido('#d2603f')} opacity="0.9" />
          {Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * Math.PI * 2 + 0.5
            const comp = alcance * (0.6 + ((i * 3) % 4) * 0.13)
            return (
              <path
                key={i}
                d={`M ${50 + Math.cos(a - 0.35) * 14} ${50 + Math.sin(a - 0.35) * 14} Q ${50 + Math.cos(a) * comp * 1.05} ${50 + Math.sin(a) * comp * 1.05} ${50 + Math.cos(a + 0.35) * 14} ${50 + Math.sin(a + 0.35) * 14} Z`}
                fill={corDeTecido('#d2603f')}
                opacity="0.88"
              />
            )
          })}
        </g>
      )
    }
    case 'varizes-esofagicas': {
      const mm = Math.max(0, Math.min(10, num(params, 'calibre', 6)))
      const largura = 1.5 + mm * 0.9
      return (
        <g>
          {[0.6, 2.2, 3.9, 5.3].map((a, i) => (
            <path
              key={i}
              d={`M ${50 + Math.cos(a) * 12} ${50 + Math.sin(a) * 12} Q ${50 + Math.cos(a + 0.25) * 28} ${50 + Math.sin(a + 0.25) * 28} ${50 + Math.cos(a - 0.1) * 40} ${50 + Math.sin(a - 0.1) * 40} T ${50 + Math.cos(a + 0.1) * 54} ${50 + Math.sin(a + 0.1) * 54}`}
              stroke={corDeTecido('#5b4a8a')}
              strokeWidth={largura}
              strokeLinecap="round"
              fill="none"
              opacity="0.92"
            />
          ))}
          {/* Sinais vermelhos ("red wale") em varizes calibrosas — risco de sangrar. */}
          {mm >= 5 &&
            [0.6, 3.9].map((a, i) => (
              <path key={i} d={`M ${50 + Math.cos(a) * 24} ${50 + Math.sin(a) * 24} l ${Math.cos(a) * 8} ${Math.sin(a) * 8}`} stroke={corDeTecido('#d3261a')} strokeWidth="1.3" strokeLinecap="round" />
            ))}
        </g>
      )
    }
    case 'ulcera-sangrante': {
      // Forrest simplificado: 0 base limpa · 1 mancha · 2 coágulo aderido · 3 vaso visível/sangramento ativo.
      const estigma = Math.max(0, Math.min(3, Math.round(num(params, 'estigma', 3))))
      return (
        <g>
          <ellipse cx="56" cy="46" rx="14" ry="11" fill={corDeTecido('#f3ead9')} />
          <ellipse cx="56" cy="46" rx="14" ry="11" fill="none" stroke={corDeTecido('#c9463a')} strokeWidth="2.2" />
          {estigma === 1 && <circle cx="58" cy="45" r="2" fill={corDeTecido('#3a1a14')} />}
          {estigma === 2 && <ellipse cx="57" cy="45" rx="6" ry="4.5" fill={corDeTecido('#5a1418')} />}
          {estigma === 3 && (
            <g>
              <circle cx="58" cy="45" r="2.6" fill={corDeTecido('#b3261e')} />
              <path d="M 58 45 Q 52 60 44 78 Q 50 70 60 84" stroke={corDeTecido('#a01418')} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
              <ellipse cx="50" cy="86" rx="16" ry="5" fill={corDeTecido('#8c0f12')} opacity="0.8" />
            </g>
          )}
        </g>
      )
    }
    case 'ulcera-gastrica': {
      const mm = Math.max(0, Math.min(30, num(params, 'diametro', 12)))
      const r = 3 + mm * 0.45
      return (
        <g>
          <ellipse cx="56" cy="48" rx={r * 1.15} ry={r} fill={corDeTecido('#f3ead9')} />
          <ellipse cx="56" cy="48" rx={r * 1.15} ry={r} fill="none" stroke={corDeTecido('#d06a58')} strokeWidth="2.4" />
          {/* Pregas convergindo até a borda — o padrão da úlcera benigna. */}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2
            return <path key={i} d={`M ${56 + Math.cos(a) * (r * 1.15 + 3)} ${48 + Math.sin(a) * (r + 3)} L ${56 + Math.cos(a) * (r * 1.15 + 12)} ${48 + Math.sin(a) * (r + 12)}`} stroke={corDeTecido('#b85a45')} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
          })}
        </g>
      )
    }
    case 'cancer-gastrico': {
      const cm = Math.max(0, Math.min(8, num(params, 'extensao', 4)))
      const r = 8 + cm * 4
      return (
        <g>
          <path
            d={`M ${58 - r} 48 q ${r * 0.3} ${-r * 0.9} ${r * 0.9} ${-r * 0.6} q ${r * 0.8} ${r * 0.2} ${r * 0.7} ${r * 0.9} q ${-r * 0.4} ${r * 0.7} ${-r * 0.9} ${r * 0.5} q ${-r * 0.8} ${-r * 0.1} ${-r * 0.7} ${-r * 0.7} Z`}
            fill={corDeTecido('#b23c30')}
          />
          {/* Cratera ulcerada com bordas elevadas e necrose no fundo. */}
          <ellipse cx="60" cy="48" rx={r * 0.45} ry={r * 0.35} fill={corDeTecido('#5a2a20')} />
          <ellipse cx="60" cy="48" rx={r * 0.45} ry={r * 0.35} fill="none" stroke={corDeTecido('#e07a6a')} strokeWidth="2.5" />
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={60 - r * 0.3 + ((i * 11) % Math.max(2, r * 0.6))} cy={48 - r * 0.2 + ((i * 7) % Math.max(2, r * 0.4))} r={1 + (i % 2)} fill={corDeTecido('#f0e4d0')} opacity="0.75" />
          ))}
        </g>
      )
    }
    case 'gastrite-erosiva': {
      const n = Math.max(0, Math.min(30, Math.round(num(params, 'erosoes', 12))))
      return (
        <g>
          {Array.from({ length: n }, (_, i) => {
            const x = 12 + ((i * 29) % 76)
            const y = 12 + ((i * 17) % 76)
            return (
              <g key={i}>
                <ellipse cx={x} cy={y} rx={2.6} ry={1.6} fill={corDeTecido('#c0271c')} opacity="0.85" />
                <ellipse cx={x} cy={y} rx={1.2} ry={0.7} fill={corDeTecido('#f1e6d4')} opacity="0.9" />
              </g>
            )
          })}
        </g>
      )
    }
    case 'corpo-estranho-esofagico': {
      const pct = Math.max(0, Math.min(100, num(params, 'obstrucao', 80))) / 100
      const r = 6 + pct * 18
      return (
        <g>
          {/* Bolo alimentar impactado: massa irregular ocupando o lúmen. */}
          <path d={`M ${50 - r} 50 q ${r * 0.2} ${-r} ${r} ${-r * 0.8} q ${r * 0.9} ${r * 0.2} ${r * 0.9} ${r * 0.9} q ${-r * 0.3} ${r * 0.9} ${-r} ${r * 0.8} q ${-r} ${0} ${-r * 0.9} ${-r * 0.9} Z`} fill={corDeTecido('#c4a884')} />
          <path d={`M ${50 - r * 0.6} ${50 - r * 0.4} q ${r * 0.5} ${-r * 0.3} ${r * 0.9} ${0}`} stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.35" />
          {/* Saliva acumulada acima da obstrução. */}
          <ellipse cx="50" cy={50 + r + 6} rx={r * 0.9} ry="3" fill={corDeTecido('#e9f0f2')} opacity="0.5" />
        </g>
      )
    }
    case 'polipo-adenomatoso': {
      const mm = Math.max(0, Math.min(30, num(params, 'diametro', 12)))
      const r = 3 + mm * 0.55
      return (
        <g>
          {/* Pedículo e cabeça: o pólipo projeta sombra para o lado oposto à luz. */}
          <path d={`M 40 62 Q 44 ${58 - r * 0.6} ${46 + r * 0.3} ${52 - r * 0.6}`} stroke={corDeTecido('#d98f80')} strokeWidth={Math.max(3, r * 0.5)} fill="none" strokeLinecap="round" />
          <circle cx={48 + r * 0.4} cy={50 - r * 0.7} r={r} fill={corDeTecido('#d15a4a')} />
          <circle cx={48 + r * 0.4} cy={50 - r * 0.7} r={r} fill="#000" opacity="0.18" />
          <ellipse cx={46 + r * 0.2} cy={47 - r * 0.9} rx={r * 0.4} ry={r * 0.25} fill="#ffffff" opacity="0.35" />
          {/* Superfície lobulada, mais vermelha que a mucosa ao redor. */}
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={48 + r * 0.4 + Math.cos(i) * r * 0.5} cy={50 - r * 0.7 + Math.sin(i) * r * 0.5} r={r * 0.22} fill="none" stroke={corDeTecido('#a83a2c')} strokeWidth="0.5" opacity="0.6" />
          ))}
        </g>
      )
    }
    case 'cancer-colorretal': {
      const pct = Math.max(0, Math.min(100, num(params, 'estenose', 60))) / 100
      const r = 10 + pct * 26
      return (
        <g>
          <path d={`M ${50 - r} 52 q ${r * 0.1} ${-r} ${r * 0.8} ${-r * 0.9} q ${r * 0.9} ${r * 0.1} ${r * 1.1} ${r * 0.8} q ${-r * 0.1} ${r * 0.9} ${-r * 0.9} ${r * 1} q ${-r} ${0.1} ${-r * 1.1} ${-r * 0.9} Z`} fill={corDeTecido('#b3372a')} />
          <ellipse cx="50" cy="52" rx={Math.max(1.5, 8 - pct * 7)} ry={Math.max(1, 6 - pct * 5.5)} fill="#120608" />
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={50 + Math.cos(i * 0.8) * r * 0.55} cy={52 + Math.sin(i * 0.8) * r * 0.5} r={1.2 + (i % 3) * 0.5} fill={i % 2 ? corDeTecido('#f0e2cd') : corDeTecido('#6a0f12')} opacity="0.85" />
          ))}
        </g>
      )
    }
    case 'diverticulose': {
      const n = Math.max(0, Math.min(30, Math.round(num(params, 'diverticulos', 8))))
      return (
        <g>
          {Array.from({ length: n }, (_, i) => {
            const a = (i / Math.max(n, 6)) * Math.PI * 2 + i * 0.37
            const d = 22 + ((i * 7) % 3) * 8
            const x = 50 + Math.cos(a) * d
            const y = 50 + Math.sin(a) * d
            return (
              <g key={i}>
                <ellipse cx={x} cy={y} rx="4.2" ry="3.4" fill="#1a0a0b" />
                <ellipse cx={x} cy={y} rx="4.2" ry="3.4" fill="none" stroke={corDeTecido('#d08e80')} strokeWidth="1" opacity="0.8" />
              </g>
            )
          })}
        </g>
      )
    }
    case 'colite-ulcerativa': {
      const cm = Math.max(0, Math.min(100, num(params, 'extensao', 40)))
      const intensidade = 0.4 + (cm / 100) * 0.6
      return (
        <g>
          {/* A mucosa perde o padrão vascular, fica granular, friável, com erosões contínuas. */}
          <circle cx="50" cy="50" r="49" fill={corDeTecido('#c9463a')} opacity={0.35 * intensidade + 0.15} />
          {Array.from({ length: 60 }, (_, i) => (
            <circle key={i} cx={(i * 37) % 100} cy={(i * 53) % 100} r={0.9} fill={corDeTecido('#e89a8c')} opacity="0.5" />
          ))}
          {Array.from({ length: Math.round(6 + intensidade * 14) }, (_, i) => (
            <ellipse key={`u${i}`} cx={8 + ((i * 23) % 84)} cy={8 + ((i * 41) % 84)} rx="3" ry="1.4" fill={corDeTecido('#f1e4d2')} opacity="0.85" transform={`rotate(${(i * 40) % 180} ${8 + ((i * 23) % 84)} ${8 + ((i * 41) % 84)})`} />
          ))}
          {Array.from({ length: Math.round(4 + intensidade * 8) }, (_, i) => (
            <circle key={`s${i}`} cx={14 + ((i * 31) % 72)} cy={14 + ((i * 47) % 72)} r="1.5" fill={corDeTecido('#8c0f12')} opacity="0.8" />
          ))}
        </g>
      )
    }
    case 'angiodisplasia': {
      const mm = Math.max(0, Math.min(20, num(params, 'area', 8)))
      const r = 2 + mm * 0.7
      return (
        <g>
          <circle cx="58" cy="46" r={r} fill={corDeTecido('#d3261a')} opacity="0.85" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2
            return <path key={i} d={`M 58 46 q ${Math.cos(a) * r * 0.8} ${Math.sin(a) * r * 0.3} ${Math.cos(a) * r * 1.8} ${Math.sin(a) * r * 1.6}`} stroke={corDeTecido('#c0271c')} strokeWidth="0.8" fill="none" opacity="0.9" />
          })}
        </g>
      )
    }
    case 'corpo-estranho-endobronquico': {
      const pct = Math.max(0, Math.min(100, num(params, 'obstrucao', 70))) / 100
      const r = 2 + pct * 7
      return (
        <g>
          <ellipse cx="60" cy="52" rx={r} ry={r * 1.1} fill={corDeTecido('#8a6a3a')} />
          <ellipse cx="60" cy="52" rx={r} ry={r * 1.1} fill="none" stroke={corDeTecido('#e0c9a0')} strokeWidth="0.8" />
          {/* Granulação ao redor do objeto que ficou dias. */}
          <ellipse cx="60" cy="52" rx={r + 2.5} ry={r * 1.1 + 2.5} fill="none" stroke={corDeTecido('#c9463a')} strokeWidth="2" opacity="0.7" />
        </g>
      )
    }
    case 'sangramento-endobronquico': {
      const g = Math.max(0, Math.min(3, Math.round(num(params, 'intensidade', 2))))
      return (
        <g>
          {g >= 1 && <path d="M 60 44 Q 62 56 58 66" stroke={corDeTecido('#a01418')} strokeWidth={1.5 + g * 1.5} fill="none" strokeLinecap="round" />}
          {g >= 2 && <ellipse cx="60" cy="52" rx="7" ry="9" fill={corDeTecido('#8c0f12')} opacity="0.8" />}
          {g >= 3 && <ellipse cx="50" cy="70" rx="22" ry="8" fill={corDeTecido('#8c0f12')} opacity="0.85" />}
        </g>
      )
    }
    case 'tampao-mucoso': {
      const pct = Math.max(0, Math.min(100, num(params, 'obstrucao', 80))) / 100
      const r = 2 + pct * 7
      return (
        <g>
          <ellipse cx="40" cy="52" rx={r} ry={r * 1.15} fill={corDeTecido('#d9c98a')} />
          <ellipse cx="40" cy="52" rx={r} ry={r * 1.15} fill={corDeTecido('#efe6b8')} opacity="0.5" />
          <ellipse cx="38" cy="48" rx={r * 0.4} ry={r * 0.25} fill="#ffffff" opacity="0.4" />
        </g>
      )
    }
    default:
      return null
  }
}

function rotulo(cena: Cena, params: PropsDeIlustracao['params']): string {
  switch (cena) {
    case 'eda-normal':
      return 'esôfago: mucosa pálida, padrão vascular fino'
    case 'esofagite-erosiva':
      return `esofagite · Los Angeles ${['A', 'B', 'C', 'D'][Math.max(0, Math.min(3, Math.round(num(params, 'grau', 2))))]}`
    case 'barrett':
      return `Barrett · ${num(params, 'extensao', 4).toFixed(0)} cm acima da junção`
    case 'varizes-esofagicas':
      return `varizes · calibre ${num(params, 'calibre', 6).toFixed(0)} mm${num(params, 'calibre', 6) >= 5 ? ' · sinais vermelhos' : ''}`
    case 'ulcera-sangrante':
      return ['base limpa', 'mancha pigmentada', 'coágulo aderido', 'vaso visível · sangramento ativo'][Math.max(0, Math.min(3, Math.round(num(params, 'estigma', 3))))]
    case 'ulcera-gastrica':
      return `úlcera ${num(params, 'diametro', 12).toFixed(0)} mm · pregas convergentes`
    case 'cancer-gastrico':
      return `massa ulceroinfiltrativa · ${num(params, 'extensao', 4).toFixed(0)} cm`
    case 'gastrite-erosiva':
      return `${Math.round(num(params, 'erosoes', 12))} erosões · mucosa eritematosa`
    case 'corpo-estranho-esofagico':
      return `impactação · obstrução ${num(params, 'obstrucao', 80).toFixed(0)}%`
    case 'colon-normal':
      return 'cólon: haustros, padrão vascular visível'
    case 'polipo-adenomatoso':
      return `pólipo pediculado · ${num(params, 'diametro', 12).toFixed(0)} mm`
    case 'cancer-colorretal':
      return `massa friável · estenose ${num(params, 'estenose', 60).toFixed(0)}%`
    case 'diverticulose':
      return `${Math.round(num(params, 'diverticulos', 8))} divertículos`
    case 'colite-ulcerativa':
      return `colite ativa · ${num(params, 'extensao', 40).toFixed(0)} cm · sem padrão vascular`
    case 'angiodisplasia':
      return `angiodisplasia · ${num(params, 'area', 8).toFixed(0)} mm`
    case 'laringe-normal':
      return 'laringe: pregas brancas, abdução simétrica'
    case 'paralisia-prega-vocal':
      return `prega esquerda parada · mobilidade ${num(params, 'amplitude', 10).toFixed(0)}%`
    case 'edema-de-glote':
      return `edema de glote · lúmen reduzido ${Math.round((num(params, 'edema', 2) / 3) * 100)}%`
    case 'lesao-laringea':
      return `lesão irregular · ${num(params, 'tamanho', 10).toFixed(0)} mm`
    case 'bronquio-normal':
      return 'carina afiada · brônquios-fonte pérvios'
    case 'corpo-estranho-endobronquico':
      return `corpo estranho · obstrução ${num(params, 'obstrucao', 70).toFixed(0)}%`
    case 'sangramento-endobronquico':
      return ['sem sangue', 'raias de sangue', 'sangramento moderado', 'sangramento ativo volumoso'][Math.max(0, Math.min(3, Math.round(num(params, 'intensidade', 2))))]
    case 'tampao-mucoso':
      return `tampão mucoso · obstrução ${num(params, 'obstrucao', 80).toFixed(0)}%`
    default:
      return ''
  }
}

/** Escurece um hex por um fator — usado no gradiente do lúmen. */
function escurecer(hex: string, fator: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * (1 - fator))
  const g = Math.round(((n >> 8) & 255) * (1 - fator))
  const b = Math.round((n & 255) * (1 - fator))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
