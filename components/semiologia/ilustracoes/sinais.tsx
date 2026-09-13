'use client'

import { Quadro, corDeTecido, entre, num, txt, type PropsDeIlustracao } from './base'

/**
 * Os sinais do exame físico sem instrumento.
 *
 * ## A ideia que sustenta a ala inteira
 *
 * "Como é uma pessoa ictérica?" não se responde com a definição de bilirrubina
 * acima de 2,5 mg/dL. Responde-se mostrando — e mostrando **o gradiente**, que
 * é justamente o que a fotografia isolada não dá: uma foto mostra *uma*
 * icterícia, a de um paciente, num dia. O que o aluno precisa é da transição,
 * porque a decisão clínica real é "isto é amarelo o bastante para eu me
 * preocupar?".
 *
 * Por isso a icterícia aqui é função contínua da bilirrubina, com o limiar de
 * detecção embutido na curva: abaixo de ~2,5 mg/dL a esclera não muda de cor no
 * desenho, do mesmo jeito que não muda no paciente. O aluno arrasta o controle
 * e vê onde o sinal nasce. Nenhum livro consegue fazer isso; um desenho
 * paramétrico faz de graça.
 *
 * A mesma lógica governa o resto: o cacifo do edema tem profundidade e tempo de
 * recuperação por causa; a cianose depende da hemoglobina reduzida em valor
 * absoluto; a coluna jugular tem altura em centímetros medida na régua do
 * ângulo esternal.
 */

// ─── Icterícia ────────────────────────────────────────────────────────────────

/**
 * Cor da esclera e da pele em função da bilirrubina total.
 *
 * A curva é sigmoide e começa em ~2,5 mg/dL, reproduzindo o limiar clínico: a
 * esclera cora primeiro (mais elastina, mais afinidade pela bilirrubina) e a
 * pele vem depois, com atraso e menos saturação.
 */
function tomDaIctericia(bilirrubina: number) {
  const escleral = Math.min(1, Math.max(0, (bilirrubina - 2.5) / 14))
  const cutanea = Math.min(1, Math.max(0, (bilirrubina - 5) / 18))
  return {
    esclera: `rgb(${Math.round(entre(252, 236, escleral))}, ${Math.round(entre(250, 214, escleral))}, ${Math.round(
      entre(246, 92, escleral),
    )})`,
    pele: `rgb(${Math.round(entre(226, 222, cutanea))}, ${Math.round(entre(184, 186, cutanea))}, ${Math.round(
      entre(158, 104, cutanea),
    )})`,
    escleral,
    cutanea,
  }
}

export function Ictericia({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const bilirrubina = num(params, 'bilirrubina', 8)
  const compartimento = txt(params, 'compartimento', '')
  const { esclera, pele, escleral } = tomDaIctericia(bilirrubina)
  // O pré-hepático vem com palidez; o colestático, com escoriações de prurido.
  const palidez = compartimento === 'pre' ? 0.35 : 0
  const escoriacoes = compartimento === 'colestatica'

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#0f1216">
      {/* Pele periorbital. */}
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill={corDeTecido(pele)}
        opacity={1 - palidez * 0.5}
      />
      <ellipse cx="50" cy="86" rx="60" ry="26" fill="#000" opacity="0.08" />

      {/* Pálpebras. */}
      <path d="M 6 50 Q 50 16 94 50 Q 50 84 6 50 Z" fill={corDeTecido('#f7f4ef')} />
      <path d="M 6 50 Q 50 16 94 50 Q 50 84 6 50 Z" fill={corDeTecido(esclera)} />

      {/* Vasos conjuntivais — reduzidos na palidez. */}
      <g opacity={0.5 - palidez}>
        {[
          'M 10 50 Q 22 46 30 50',
          'M 12 55 Q 24 58 32 54',
          'M 90 50 Q 78 45 70 49',
          'M 88 56 Q 76 59 68 55',
        ].map((d) => (
          <path key={d} d={d} stroke={corDeTecido('#c96a5a')} strokeWidth="0.7" fill="none" />
        ))}
      </g>

      {/* Íris, pupila e brilho. */}
      <circle cx="50" cy="50" r="17" fill={corDeTecido('#6b4a32')} />
      <circle cx="50" cy="50" r="17" fill={corDeTecido('#3d2a1b')} opacity="0.45" />
      <circle cx="50" cy="50" r="7.6" fill="#0b0b0c" />
      <circle cx="45" cy="44" r="3.1" fill="#fff" opacity="0.85" />

      {/* Contorno palpebral. */}
      <path d="M 6 50 Q 50 16 94 50" stroke={corDeTecido('#8a6a55')} strokeWidth="1.6" fill="none" />
      <path d="M 6 50 Q 50 84 94 50" stroke={corDeTecido('#8a6a55')} strokeWidth="1.3" fill="none" />
      <path d="M 4 47 Q 50 10 96 47" stroke={corDeTecido('#7a5a45')} strokeWidth="2.4" fill="none" opacity="0.5" />

      {escoriacoes &&
        [
          'M 14 18 L 22 26',
          'M 78 20 L 86 27',
          'M 20 82 L 28 88',
        ].map((d) => <path key={d} d={d} stroke={corDeTecido('#a4503f')} strokeWidth="0.9" opacity="0.7" />)}

      {/* Leitura numérica — o que a figura está representando. */}
      <text x="5" y="96" fill="#ffffff" fontSize="5" opacity={0.78} fontFamily="system-ui, sans-serif">
        BT {bilirrubina.toFixed(1)} mg/dL
      </text>
      {escleral <= 0 && (
        <text x="5" y="9" fill="#ffffff" fontSize="4.4" opacity={0.7} fontFamily="system-ui, sans-serif">
          abaixo do limiar clínico
        </text>
      )}
    </Quadro>
  )
}

// ─── Edema ────────────────────────────────────────────────────────────────────

type TipoDeEdema = 'cardiaco' | 'renal' | 'hepatico' | 'venoso' | 'linfatico'

const EDEMA: Record<TipoDeEdema, { cacifo: number; cor: string; dorso: number; pigmento: boolean; retorno: string }> = {
  cardiaco: { cacifo: 0.8, cor: '#cfa189', dorso: 0.2, pigmento: false, retorno: 'lento' },
  renal: { cacifo: 1, cor: '#e2c7b6', dorso: 0.15, pigmento: false, retorno: 'rápido' },
  hepatico: { cacifo: 0.75, cor: '#d8bd8a', dorso: 0.18, pigmento: false, retorno: 'lento' },
  venoso: { cacifo: 0.55, cor: '#a9765e', dorso: 0.25, pigmento: true, retorno: 'lento' },
  linfatico: { cacifo: 0.1, cor: '#c9a894', dorso: 0.85, pigmento: false, retorno: 'não deprime' },
}

export function Edema({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const tipo = (txt(params, 'tipo', 'cardiaco') as TipoDeEdema) ?? 'cardiaco'
  const e = EDEMA[tipo] ?? EDEMA.cardiaco
  const profundidade = e.cacifo * 5.5

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#12151a">
      {/* Perna em perfil: tíbia à esquerda, panturrilha à direita. */}
      <path
        d={`M 30 6 Q 24 40 ${28 + e.dorso * 2} 72 L ${40 + e.dorso * 16} 88 L ${64 + e.dorso * 12} 88 Q 60 70 62 44 Q 64 22 58 6 Z`}
        fill={corDeTecido(e.cor)}
      />
      {/* Dorso do pé: abaulado no linfedema, que é o que apaga os sulcos. */}
      <path
        d={`M ${40 + e.dorso * 16} 88 Q ${52 + e.dorso * 6} ${84 - e.dorso * 6} ${64 + e.dorso * 12} 88 L ${
          64 + e.dorso * 12
        } 94 L ${40 + e.dorso * 16} 94 Z`}
        fill={corDeTecido(e.cor)}
      />

      {/* Dermatite ocre e úlcera maleolar do edema venoso. */}
      {e.pigmento && (
        <>
          <ellipse cx="44" cy="70" rx="12" ry="9" fill={corDeTecido('#7a4a2c')} opacity="0.65" />
          <ellipse cx="40" cy="74" rx="4.5" ry="3.4" fill={corDeTecido('#b8503c')} />
          <ellipse cx="40" cy="74" rx="4.5" ry="3.4" fill="none" stroke={corDeTecido('#5e2f1c')} strokeWidth="0.7" />
        </>
      )}

      {/* Pele espessada e verrucosa do linfedema. */}
      {tipo === 'linfatico' &&
        Array.from({ length: 10 }, (_, i) => (
          <circle key={i} cx={38 + (i % 4) * 7} cy={56 + Math.floor(i / 4) * 9} r="1.6" fill={corDeTecido('#a8836f')} opacity="0.55" />
        ))}

      {/* O cacifo: a depressão que o polegar deixa sobre a crista tibial. */}
      <g>
        <path
          d={`M 30 44 Q ${34 + profundidade} 47 30 50`}
          stroke={corDeTecido('#8d6450')}
          strokeWidth="0.9"
          fill={corDeTecido('#b98d76')}
          opacity={e.cacifo > 0.2 ? 0.9 : 0.25}
        />
        <ellipse cx={31 + profundidade * 0.5} cy="47" rx={profundidade * 0.7} ry="3.4" fill="#000" opacity={e.cacifo * 0.28} />
      </g>

      {/* Polegar do examinador. */}
      <g opacity="0.92">
        <ellipse cx={20 + profundidade} cy="47" rx="9" ry="5.6" fill={corDeTecido('#e7bfa6')} transform={`rotate(-12 ${20 + profundidade} 47)`} />
        <ellipse cx={14 + profundidade} cy="46" rx="3" ry="2.2" fill={corDeTecido('#f3ddce')} transform={`rotate(-12 ${14 + profundidade} 46)`} />
      </g>

      <text x="4" y="96" fill="#fff" fontSize="4.6" opacity="0.78" fontFamily="system-ui, sans-serif">
        cacifo: {e.cacifo === 0.1 ? 'ausente' : `retorno ${e.retorno}`}
      </text>
    </Quadro>
  )
}

// ─── Cianose ──────────────────────────────────────────────────────────────────

export function Cianose({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const tipo = txt(params, 'tipo', 'central')
  const intensidade = num(params, 'intensidade', 2) / 4

  const central = tipo === 'central'
  const meta = tipo === 'metemoglobina'

  const azul = meta ? '#7c6e7a' : '#5a6f9c'
  const corMucosa = central || meta ? mistura('#c9707a', azul, intensidade) : '#c9707a'
  const corUnha = mistura('#e8a89c', meta ? '#8d7f88' : '#43567f', intensidade)

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#161319">
      {/* Pele: boca em cima, dedo embaixo, na mesma superfície — as duas
          leituras da cianose numa figura só. */}
      <rect x="0" y="0" width="100" height="100" fill={corDeTecido('#e2b79c')} />

      {/* Boca entreaberta: lábio superior com arco do cupido, lábio inferior
          mais cheio e língua ao fundo — é a língua que decide se é central. */}
      <path
        d="M 12 26 Q 26 14 38 21 Q 44 25 50 25 Q 56 25 62 21 Q 74 14 88 26 Q 70 32 50 32 Q 30 32 12 26 Z"
        fill={corDeTecido(corMucosa)}
      />
      <path d="M 12 26 Q 50 60 88 26 Q 50 40 12 26 Z" fill={corDeTecido(escuro(corMucosa, 0.05))} />
      <path d="M 17 27 Q 50 50 83 27 Q 50 38 17 27 Z" fill={corDeTecido(escuro(corMucosa, 0.3))} />
      <ellipse cx="50" cy="33" rx="21" ry="7" fill={corDeTecido(central || meta ? corMucosa : '#c9707a')} />
      <path d="M 50 28 L 50 39" stroke={corDeTecido(escuro(corMucosa, 0.35))} strokeWidth="0.7" opacity="0.7" />

      {/* Dedo e leito ungueal — o território da cianose periférica. */}
      <g>
        <path d="M 24 62 Q 50 52 76 62 L 76 96 Q 50 104 24 96 Z" fill={corDeTecido('#e6bda6')} />
        <ellipse cx="50" cy="76" rx="17" ry="13" fill={corDeTecido(corUnha)} />
        <ellipse cx="50" cy="76" rx="17" ry="13" fill="none" stroke={corDeTecido('#c69a86')} strokeWidth="0.9" />
        <ellipse cx="50" cy="68" rx="7" ry="3" fill="#fff" opacity="0.35" />
      </g>

      <text x="4" y="97" fill="#fff" fontSize="4.4" opacity="0.78" fontFamily="system-ui, sans-serif">
        {central ? 'mucosa + extremidade' : meta ? 'tom acinzentado' : 'extremidade apenas'}
      </text>
    </Quadro>
  )
}

// ─── Coluna jugular ───────────────────────────────────────────────────────────

export function Jugular({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const altura = num(params, 'altura', 7) // cm H2O, já somados os 5 cm do ângulo
  const acimaDoAngulo = Math.max(0, altura - 5)
  // 1 cm vertical ≈ 3,4 unidades da caixa; o ângulo esternal fica em y = 74.
  const yMenisco = 74 - acimaDoAngulo * 3.4

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#14161b">
      {/* Pescoço e mandíbula em perfil. */}
      <path d="M 18 100 Q 26 56 42 34 Q 56 16 84 12 L 96 22 Q 70 34 58 54 Q 48 74 46 100 Z" fill={corDeTecido('#e0b79f')} />
      {/* Esternocleidomastóideo. */}
      <path d="M 30 96 Q 42 66 62 40" stroke={corDeTecido('#c99a83')} strokeWidth="7" fill="none" opacity="0.55" />
      {/* Clavícula e ângulo esternal. */}
      <path d="M 14 92 Q 34 96 54 92" stroke={corDeTecido('#c99a83')} strokeWidth="3" fill="none" opacity="0.6" />
      <circle cx="30" cy="74" r="1.8" fill={corDeTecido('#a8785f')} />

      {/* Coluna venosa: preenche até a altura medida. */}
      <path
        d={`M 32 92 Q 38 82 44 ${yMenisco}`}
        stroke={corDeTecido(altura > 8 ? '#4a6fa0' : '#6d8cb5')}
        strokeWidth={altura > 8 ? 4.4 : 3}
        fill="none"
        strokeLinecap="round"
        opacity="0.9"
      />
      <ellipse cx="44" cy={yMenisco} rx="2.6" ry="1.4" fill={corDeTecido('#8fa9cb')} />

      {/* Régua a partir do ângulo esternal — o que torna a medida reprodutível. */}
      <line x1="30" y1="74" x2="74" y2="74" stroke="#f2c14e" strokeWidth="0.6" strokeDasharray="2 1.6" />
      <line x1="70" y1="74" x2="70" y2={yMenisco} stroke="#f2c14e" strokeWidth="0.7" />
      <line x1="66" y1={yMenisco} x2="74" y2={yMenisco} stroke="#f2c14e" strokeWidth="0.7" />
      <text x="76" y={(74 + yMenisco) / 2} fill="#f2c14e" fontSize="4.6" fontFamily="system-ui, sans-serif">
        {acimaDoAngulo.toFixed(0)} cm
      </text>
      <text x="4" y="97" fill="#fff" fontSize="4.4" opacity="0.8" fontFamily="system-ui, sans-serif">
        PVJ ≈ {altura.toFixed(0)} cmH₂O {altura > 8 ? '· elevada' : '· normal'}
      </text>
    </Quadro>
  )
}

// ─── Baqueteamento digital ────────────────────────────────────────────────────

export function Baqueteamento({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const grau = num(params, 'grau', 2) / 3 // 0 normal · 1 avançado
  const anguloLovibond = Math.round(entre(158, 195, grau))
  const bulbo = entre(0, 7, grau)

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#14161b">
      {/* Dedo de perfil. */}
      <path
        d={`M 6 62 L 52 ${62 - bulbo * 0.3} Q ${72 + bulbo} ${58 - bulbo} ${86 + bulbo * 0.4} ${
          66 - bulbo * 0.2
        } Q ${80 + bulbo} ${82 + bulbo * 0.4} 56 ${80 + bulbo * 0.5} L 6 80 Z`}
        fill={corDeTecido('#e7bda3')}
      />
      {/* Unha. */}
      <path
        d={`M 52 ${60 - bulbo * 0.3} Q ${70 + bulbo} ${56 - bulbo} ${84 + bulbo * 0.4} ${65 - bulbo * 0.2} Q ${
          70 + bulbo
        } ${70 - bulbo * 0.3} 52 ${68 - bulbo * 0.2} Z`}
        fill={corDeTecido('#f3d9c9')}
        stroke={corDeTecido('#c99a83')}
        strokeWidth="0.6"
      />
      {/* Prega ungueal proximal — o vértice do ângulo de Lovibond. */}
      <circle cx="52" cy={61 - bulbo * 0.3} r="1.3" fill={corDeTecido('#c07f62')} />

      {/* O ângulo, desenhado. */}
      <line x1="20" y1="62" x2="52" y2={61 - bulbo * 0.3} stroke="#f2c14e" strokeWidth="0.6" strokeDasharray="2 1.5" />
      <line x1="52" y1={61 - bulbo * 0.3} x2={82 + bulbo * 0.4} y2={64 - bulbo * 0.2} stroke="#f2c14e" strokeWidth="0.6" strokeDasharray="2 1.5" />
      <text x="30" y="48" fill="#f2c14e" fontSize="5.4" fontFamily="system-ui, sans-serif">
        {anguloLovibond}°
      </text>
      <text x="4" y="97" fill="#fff" fontSize="4.4" opacity="0.8" fontFamily="system-ui, sans-serif">
        {anguloLovibond > 180 ? 'Schamroth obliterado' : 'losango de Schamroth presente'}
      </text>
    </Quadro>
  )
}

// ─── Ascite ───────────────────────────────────────────────────────────────────

export function Ascite({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const volume = Math.min(5, num(params, 'volume', 3))
  const lateral = Boolean(params?.lateral)
  const nivel = entre(58, 34, volume / 5)

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#14161b">
      {/* Corte transversal do abdome. */}
      <ellipse cx="50" cy="50" rx={38 + volume * 1.6} ry={30 + volume * 1.4} fill={corDeTecido('#e2b79c')} />
      <ellipse cx="50" cy="50" rx={35 + volume * 1.6} ry={27 + volume * 1.4} fill={corDeTecido('#f0d6c2')} />

      {/* Líquido, obedecendo à gravidade — no decúbito lateral ele migra. */}
      <clipPath id="asc-clip">
        <ellipse cx="50" cy="50" rx={35 + volume * 1.6} ry={27 + volume * 1.4} />
      </clipPath>
      <g clipPath="url(#asc-clip)">
        {lateral ? (
          <rect x="50" y="0" width="50" height="100" fill={corDeTecido('#9fc0cf')} opacity="0.82" />
        ) : (
          <rect x="0" y={nivel} width="100" height="100" fill={corDeTecido('#9fc0cf')} opacity="0.82" />
        )}
      </g>

      {/* Alças com gás: flutuam, e é por isso que o centro é timpânico. */}
      {[
        [44, 40, 8],
        [58, 44, 7],
        [50, 32, 6.5],
        [38, 50, 6],
      ].map(([cx, cy, r]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={lateral ? cx - 10 : cx} cy={cy} r={r} fill={corDeTecido('#d9c3a8')} />
          <circle cx={lateral ? cx - 10 : cx} cy={cy} r={r * 0.6} fill={corDeTecido('#f3e6d2')} opacity="0.7" />
        </g>
      ))}

      {/* Onde a percussão dá maciço e onde dá timpânico. */}
      <text x="6" y="20" fill="#f2c14e" fontSize="4.2" fontFamily="system-ui, sans-serif">
        {lateral ? 'decúbito lateral' : 'decúbito dorsal'}
      </text>
      <text x="6" y="96" fill="#fff" fontSize="4.2" opacity="0.8" fontFamily="system-ui, sans-serif">
        timpânico no centro · maciço nos flancos
      </text>
    </Quadro>
  )
}

// ─── Enchimento capilar ───────────────────────────────────────────────────────

export function EnchimentoCapilar({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const segundos = num(params, 'segundos', 4)
  const retorno = Math.min(1, 3 / Math.max(0.5, segundos))

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#14161b">
      <path d="M 22 30 Q 50 20 78 30 L 78 82 Q 50 92 22 82 Z" fill={corDeTecido('#e7bda3')} />
      {/* Leito ungueal recuperando a cor. */}
      <ellipse cx="50" cy="52" rx="20" ry="15" fill={corDeTecido('#f2e2da')} />
      <ellipse
        cx="50"
        cy="52"
        rx={20 * retorno}
        ry={15 * retorno}
        fill={corDeTecido('#e79a8c')}
        opacity="0.95"
      />
      <ellipse cx="50" cy="52" rx="20" ry="15" fill="none" stroke={corDeTecido('#c69a86')} strokeWidth="0.9" />
      <ellipse cx="50" cy="42" rx="8" ry="3" fill="#fff" opacity="0.35" />

      <text
        x="50"
        y="90"
        textAnchor="middle"
        fill={segundos > 3 ? '#f2764e' : '#7fd6a4'}
        fontSize="8"
        fontFamily="system-ui, sans-serif"
      >
        {segundos.toFixed(1)} s
      </text>
      <text x="50" y="18" textAnchor="middle" fill="#fff" fontSize="4.2" opacity="0.75" fontFamily="system-ui, sans-serif">
        mão à altura do coração
      </text>
    </Quadro>
  )
}

// ─── Palidez ──────────────────────────────────────────────────────────────────

export function Palidez({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const hb = num(params, 'hemoglobina', 7)
  const t = Math.min(1, Math.max(0, (13.5 - hb) / 8))
  const conjuntiva = mistura('#e06a6a', '#f0cfc4', t)
  const prega = mistura('#c8564f', '#e8b9a8', t)

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#14161b">
      <rect x="0" y="0" width="100" height="100" fill={corDeTecido('#e0b79f')} />

      {/* Pálpebra inferior evertida: a conjuntiva exposta é o melhor ponto de
          leitura de hemoglobina do exame físico. */}
      <path d="M 6 16 Q 50 2 94 16 Q 50 26 6 16 Z" fill={corDeTecido('#c99a83')} opacity="0.5" />
      <ellipse cx="50" cy="19" rx="15" ry="8" fill={corDeTecido('#5a4130')} />
      <circle cx="50" cy="19" r="4" fill="#0b0b0c" />
      <path d="M 10 26 Q 50 16 90 26 Q 50 46 10 26 Z" fill={corDeTecido(conjuntiva)} />
      <path d="M 10 26 Q 50 16 90 26" stroke={corDeTecido('#a8785f')} strokeWidth="1.2" fill="none" />
      <path d="M 10 26 Q 50 46 90 26" stroke={corDeTecido('#c99a83')} strokeWidth="1" fill="none" />

      {/* Palma aberta: a prega normalmente é mais avermelhada que a pele ao
          redor; quando iguala, a hemoglobina está muito baixa. */}
      <g transform="translate(0 6)">
        <path
          d="M 26 56 Q 50 48 74 56 Q 80 70 76 84 Q 68 96 50 96 Q 32 96 24 84 Q 20 70 26 56 Z"
          fill={corDeTecido('#edcbb4')}
          stroke={corDeTecido('#c99a83')}
          strokeWidth="0.8"
        />
        {[30, 41, 52, 63].map((x, i) => (
          <rect
            key={x}
            x={x - 3.6}
            y={40 - i * 1.6}
            width="7.2"
            height={18 + i * 1.6}
            rx="3.6"
            fill={corDeTecido('#edcbb4')}
            stroke={corDeTecido('#c99a83')}
            strokeWidth="0.7"
          />
        ))}
        <rect
          x="70"
          y="56"
          width="12"
          height="7"
          rx="3.5"
          fill={corDeTecido('#edcbb4')}
          stroke={corDeTecido('#c99a83')}
          strokeWidth="0.7"
          transform="rotate(28 76 60)"
        />
        {[
          'M 31 68 Q 50 63 69 70',
          'M 30 77 Q 50 73 66 79',
          'M 37 87 Q 50 85 62 87',
        ].map((d) => (
          <path key={d} d={d} stroke={corDeTecido(prega)} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        ))}
      </g>

      <text x="5" y="97" fill="#fff" fontSize="4.4" opacity="0.8" fontFamily="system-ui, sans-serif">
        Hb {hb.toFixed(1)} g/dL
      </text>
    </Quadro>
  )
}

// ─── Aranha vascular e eritema palmar ─────────────────────────────────────────

export function AranhaVascular({ className, titulo, marcadores }: PropsDeIlustracao) {
  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#14161b">
      <rect x="0" y="0" width="100" height="100" fill={corDeTecido('#e7c3ab')} />
      {/* Aranha: arteríola central com radiações finas. */}
      <g transform="translate(34 34)">
        {Array.from({ length: 14 }, (_, i) => {
          const ang = (i / 14) * Math.PI * 2
          const r = 10 + (i % 3) * 3.5
          return (
            <path
              key={i}
              d={`M 0 0 Q ${Math.cos(ang) * r * 0.5 + 1.2} ${Math.sin(ang) * r * 0.5} ${Math.cos(ang) * r} ${Math.sin(ang) * r}`}
              stroke={corDeTecido('#c0392b')}
              strokeWidth="0.55"
              fill="none"
              opacity="0.85"
            />
          )
        })}
        <circle cx="0" cy="0" r="2.2" fill={corDeTecido('#a8281c')} />
      </g>
      {/* Eritema palmar: poupa o centro da palma. */}
      <g transform="translate(52 52)">
        <path d="M 4 8 Q 26 0 44 10 L 42 42 Q 22 48 4 42 Z" fill={corDeTecido('#e3b49b')} />
        <ellipse cx="12" cy="24" rx="8" ry="12" fill={corDeTecido('#cf6a5c')} opacity="0.75" />
        <ellipse cx="36" cy="26" rx="6.5" ry="11" fill={corDeTecido('#cf6a5c')} opacity="0.7" />
      </g>
      <text x="5" y="96" fill="#5a3a2c" fontSize="4.2" fontFamily="system-ui, sans-serif">
        enche do centro para a periferia
      </text>
    </Quadro>
  )
}

// ─── Asterixe ─────────────────────────────────────────────────────────────────

export function Asterixe({ className, titulo, marcadores }: PropsDeIlustracao) {
  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#14161b">
      <rect x="0" y="0" width="100" height="100" fill="transparent" />
      {/* Antebraço fixo. */}
      <path d="M 0 44 L 42 44 L 42 66 L 0 66 Z" fill={corDeTecido('#e0b79f')} />
      {/* Mão: o grupo inteiro gira em torno do punho — mioclonia negativa. */}
      <g style={{ transformOrigin: '42px 55px' }} className="semio-asterixe">
        <path d="M 42 42 Q 62 34 78 40 Q 88 44 86 54 Q 82 66 66 68 L 42 68 Z" fill={corDeTecido('#e7bda3')} />
        {[44, 52, 60].map((x, i) => (
          <path key={x} d={`M ${x} 40 Q ${x + 3} 32 ${x + 8} ${32 - i}`} stroke={corDeTecido('#d9a88f')} strokeWidth="4" strokeLinecap="round" fill="none" />
        ))}
      </g>
      {/* Arco do trajeto da queda. */}
      <path d="M 86 54 Q 88 74 74 84" stroke="#f2c14e" strokeWidth="0.7" strokeDasharray="2 2" fill="none" opacity="0.8" />
      <text x="5" y="96" fill="#fff" fontSize="4.2" opacity="0.8" fontFamily="system-ui, sans-serif">
        queda súbita e recuperação · arrítmica
      </text>
      <style>{`
        @keyframes semio-flap {
          0%, 62%, 100% { transform: rotate(0deg); }
          66% { transform: rotate(26deg); }
          72% { transform: rotate(2deg); }
          86% { transform: rotate(18deg); }
          90% { transform: rotate(0deg); }
        }
        .semio-asterixe { animation: semio-flap 3.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .semio-asterixe { animation: none; } }
      `}</style>
    </Quadro>
  )
}

// ─── Manobras abdominais ──────────────────────────────────────────────────────

export function Murphy({ className, titulo, marcadores }: PropsDeIlustracao) {
  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#14161b">
      <rect x="0" y="0" width="100" height="100" fill={corDeTecido('#e9c9b2')} />
      {/* Gradil costal. */}
      <path d="M 6 20 Q 40 34 52 62" stroke={corDeTecido('#c79a80')} strokeWidth="3" fill="none" />
      <path d="M 96 22 Q 66 36 54 62" stroke={corDeTecido('#c79a80')} strokeWidth="3" fill="none" />
      {/* Fígado e vesícula descendo com o diafragma. */}
      <path d="M 8 26 Q 40 22 56 40 L 46 58 Q 20 54 8 46 Z" fill={corDeTecido('#9c5548')} opacity="0.75" />
      <ellipse cx="38" cy="54" rx="8" ry="5.5" fill={corDeTecido('#6f8f4a')} transform="rotate(-24 38 54)" />
      <path d="M 38 62 L 38 74" stroke="#f2c14e" strokeWidth="0.8" strokeDasharray="2 1.6" />
      {/* Mão sob o rebordo costal. */}
      <g transform="translate(20 70)">
        <path d="M 0 8 Q 20 0 38 8 Q 44 16 36 24 Q 18 30 2 24 Z" fill={corDeTecido('#f0cdb4')} />
        {[6, 14, 22, 30].map((x) => (
          <path key={x} d={`M ${x} 6 Q ${x + 2} -2 ${x + 6} 0`} stroke={corDeTecido('#e0b193')} strokeWidth="4" strokeLinecap="round" fill="none" />
        ))}
      </g>
      <text x="5" y="96" fill="#5a3a2c" fontSize="4.2" fontFamily="system-ui, sans-serif">
        a inspiração empurra a vesícula contra os dedos
      </text>
    </Quadro>
  )
}

export function Blumberg({ className, titulo, marcadores }: PropsDeIlustracao) {
  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#14161b">
      <ellipse cx="50" cy="50" rx="42" ry="38" fill={corDeTecido('#e9c9b2')} />
      {/* Quadrantes. */}
      <line x1="50" y1="12" x2="50" y2="88" stroke={corDeTecido('#c79a80')} strokeWidth="0.7" strokeDasharray="3 2" />
      <line x1="8" y1="50" x2="92" y2="50" stroke={corDeTecido('#c79a80')} strokeWidth="0.7" strokeDasharray="3 2" />
      <circle cx="50" cy="50" r="3" fill={corDeTecido('#c79a80')} />
      {/* Ponto de McBurney, em foco. */}
      <circle cx="66" cy="66" r="9" fill={corDeTecido('#cf6a5c')} opacity="0.4" />
      <circle cx="66" cy="66" r="2" fill={corDeTecido('#a8281c')} />
      {/* Sequência: compressão lenta → descompressão súbita. */}
      <g transform="translate(56 56)">
        <path d="M 0 10 Q 16 2 30 10 Q 34 18 26 24 Q 12 28 0 24 Z" fill={corDeTecido('#f0cdb4')} opacity="0.95" />
      </g>
      <path d="M 74 46 Q 86 34 88 20" stroke="#f2c14e" strokeWidth="0.9" fill="none" markerEnd="" strokeDasharray="2.5 2" />
      <text x="6" y="20" fill="#5a3a2c" fontSize="4.2" fontFamily="system-ui, sans-serif">
        1 · comprima devagar
      </text>
      <text x="6" y="93" fill="#5a3a2c" fontSize="4.2" fontFamily="system-ui, sans-serif">
        2 · retire de uma vez — a dor é na retirada
      </text>
    </Quadro>
  )
}

// ─── Utilidades de cor ────────────────────────────────────────────────────────

function hexParaRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mistura(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexParaRgb(a)
  const [r2, g2, b2] = hexParaRgb(b)
  const k = Math.min(1, Math.max(0, t))
  return `rgb(${Math.round(entre(r1, r2, k))}, ${Math.round(entre(g1, g2, k))}, ${Math.round(entre(b1, b2, k))})`
}

function escuro(cor: string, fator: number): string {
  const m = /rgb\((\d+), (\d+), (\d+)\)/.exec(cor)
  const [r, g, b] = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : hexParaRgb(cor)
  return `rgb(${Math.round(r * (1 - fator))}, ${Math.round(g * (1 - fator))}, ${Math.round(b * (1 - fator))})`
}
