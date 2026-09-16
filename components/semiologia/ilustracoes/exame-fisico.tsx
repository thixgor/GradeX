'use client'

import { Quadro, Vinheta, corDeTecido, num, txt, type PropsDeIlustracao } from './base'

/**
 * Sinais do exame físico que não são uma imagem — e como desenhá-los assim mesmo.
 *
 * ## O problema
 *
 * Um sopro não tem cor. Um pulso irregular não tem forma. A macicez é o que a
 * mão sente e o ouvido ouve. A maior parte do exame físico é **tempo** e
 * **comparação**, e a fotografia não registra nem um nem outro — o que a torna
 * quase inútil para ensinar ausculta e palpação.
 *
 * O desenho consegue, desde que abandone a fotografia como modelo e adote a
 * notação que o próprio exame usa: o fonocardiograma para a ausculta (B1, B2 e
 * o que se mete entre elas), o traçado de pulso para o ritmo e a amplitude, o
 * mapa do tórax para o que muda de um lado só, a régua de temperatura para a
 * extremidade fria. Cada figura aqui é uma dessas notações com um parâmetro
 * ligado ao deslizador — o mesmo princípio de todo o módulo: o aluno arrasta e
 * vê o limiar em que o achado passa a existir.
 */

const AMARELO = '#f2c14e'
const TINTA = '#e8ecf1'
const FUNDO = '#151a20'

// ─── Ausculta: fonocardiograma ────────────────────────────────────────────────

type Ausculta =
  | 'sopro-ejecao'
  | 'sopro-holossistolico'
  | 'b3'
  | 'b4'
  | 'sibilos'
  | 'sibilo-monofonico'
  | 'estertores'
  | 'estridor'

/**
 * Dois ciclos cardíacos (ou respiratórios) em linha do tempo. B1 e B2 são
 * barras verticais; o sopro é o envelope entre elas com o formato que o nome
 * descreve — crescendo-decrescendo na estenose aórtica, retangular na
 * insuficiência mitral. B3 e B4 são bulhas extras no lugar exato em que
 * ocorrem: logo depois de B2 e logo antes de B1. Os sons respiratórios usam
 * o mesmo eixo, com inspiração e expiração no lugar da sístole e diástole.
 */
export function Fonocardiograma({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const tipo = txt(params, 'tipo', 'sopro-ejecao') as Ausculta
  const intensidade = num(params, 'intensidade', 3)
  const respiratorio = tipo === 'sibilos' || tipo === 'sibilo-monofonico' || tipo === 'estertores' || tipo === 'estridor'
  // Amplitude do achado: 0–6 nos sopros (escala de Levine), 0–3 nos demais.
  const amp = Math.max(0, Math.min(1, intensidade / (tipo.startsWith('sopro') ? 6 : 3)))

  const ciclo = 44 // largura de um ciclo, em unidades da figura
  const y0 = 56
  const ciclos = [8, 8 + ciclo]

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo={FUNDO}>
      <defs>
        <Vinheta id={`fono-vin-${tipo}`} dureza={0.2} />
      </defs>
      {/* Eixo do tempo. */}
      <line x1="4" y1={y0} x2="96" y2={y0} stroke="#3a4552" strokeWidth="0.6" />
      {respiratorio ? <SonsRespiratorios tipo={tipo} amp={amp} y0={y0} ciclos={ciclos} ciclo={ciclo} /> : <SonsCardiacos tipo={tipo} amp={amp} y0={y0} ciclos={ciclos} ciclo={ciclo} />}
      <text x="4" y="94" fill={AMARELO} fontSize="3.8" fontFamily="system-ui, sans-serif">
        {rotuloAusculta(tipo, intensidade)}
      </text>
      <circle cx="50" cy="50" r="50" fill={`url(#fono-vin-${tipo})`} />
    </Quadro>
  )
}

function SonsCardiacos({ tipo, amp, y0, ciclos, ciclo }: { tipo: Ausculta; amp: number; y0: number; ciclos: number[]; ciclo: number }) {
  return (
    <g>
      {ciclos.map((x0) => {
        const xB1 = x0
        const xB2 = x0 + ciclo * 0.38
        const xProxB1 = x0 + ciclo
        return (
          <g key={x0}>
            {/* B1 e B2: as duas barras que ancoram o ciclo. */}
            <rect x={xB1 - 1.2} y={y0 - 14} width="2.4" height="28" fill={TINTA} />
            <rect x={xB2 - 1} y={y0 - 11} width="2" height="22" fill={TINTA} />
            <text x={xB1} y={y0 + 20} textAnchor="middle" fill="#8d97a3" fontSize="3.4" fontFamily="system-ui, sans-serif">B1</text>
            <text x={xB2} y={y0 + 20} textAnchor="middle" fill="#8d97a3" fontSize="3.4" fontFamily="system-ui, sans-serif">B2</text>

            {/* Sopro de ejeção: losango crescendo-decrescendo que começa depois de B1 e termina antes de B2. */}
            {tipo === 'sopro-ejecao' && amp > 0 && (
              <path
                d={`M ${xB1 + 3} ${y0} L ${(xB1 + xB2) / 2} ${y0 - 12 * amp} L ${xB2 - 2.5} ${y0} L ${(xB1 + xB2) / 2} ${y0 + 12 * amp} Z`}
                fill={AMARELO}
                opacity="0.85"
              />
            )}
            {/* Sopro holossistólico: retângulo que cola em B1 e engole B2. */}
            {tipo === 'sopro-holossistolico' && amp > 0 && (
              <rect x={xB1 + 1.2} y={y0 - 10 * amp} width={xB2 - xB1} height={20 * amp} fill={AMARELO} opacity="0.85" />
            )}
            {/* B3: bulha grave no início da diástole, logo após B2. */}
            {tipo === 'b3' && amp > 0 && <rect x={xB2 + 5} y={y0 - 7 * amp} width="2.6" height={14 * amp} fill={AMARELO} rx="1" />}
            {/* B4: logo antes de B1 do ciclo seguinte. */}
            {tipo === 'b4' && amp > 0 && <rect x={xProxB1 - 6} y={y0 - 7 * amp} width="2.6" height={14 * amp} fill={AMARELO} rx="1" />}
          </g>
        )
      })}
      {/* Rótulo do intervalo: sístole entre B1 e B2, diástole depois. */}
      <text x={ciclos[0] + ciclo * 0.19} y={y0 - 20} textAnchor="middle" fill="#5f6b78" fontSize="3.2" fontFamily="system-ui, sans-serif">sístole</text>
      <text x={ciclos[0] + ciclo * 0.7} y={y0 - 20} textAnchor="middle" fill="#5f6b78" fontSize="3.2" fontFamily="system-ui, sans-serif">diástole</text>
    </g>
  )
}

function SonsRespiratorios({ tipo, amp, y0, ciclos, ciclo }: { tipo: Ausculta; amp: number; y0: number; ciclos: number[]; ciclo: number }) {
  return (
    <g>
      {ciclos.map((x0) => {
        const xIns = x0
        const xExp = x0 + ciclo * 0.42
        const fim = x0 + ciclo
        return (
          <g key={x0}>
            {/* Envelope do murmúrio vesicular: inspiração maior, expiração curta. */}
            <path d={`M ${xIns} ${y0} Q ${(xIns + xExp) / 2} ${y0 - 8} ${xExp} ${y0} Q ${(xExp + fim) / 2} ${y0 - 3} ${fim - 2} ${y0}`} stroke="#5f6b78" strokeWidth="0.8" fill="none" />
            <text x={(xIns + xExp) / 2} y={y0 + 20} textAnchor="middle" fill="#8d97a3" fontSize="3.4" fontFamily="system-ui, sans-serif">insp.</text>
            <text x={(xExp + fim) / 2} y={y0 + 20} textAnchor="middle" fill="#8d97a3" fontSize="3.4" fontFamily="system-ui, sans-serif">exp.</text>

            {/* Sibilos: ondas musicais contínuas, várias frequências, na expiração. */}
            {tipo === 'sibilos' &&
              amp > 0 &&
              [0, 1, 2].map((k) => (
                <path
                  key={k}
                  d={Array.from({ length: 12 }, (_, i) => `${i === 0 ? 'M' : 'L'} ${xExp + 1 + i * ((fim - xExp - 3) / 11)} ${y0 - (i % 2 ? 1 : -1) * (5 + k * 2) * amp}`).join(' ')}
                  stroke={AMARELO}
                  strokeWidth="0.9"
                  fill="none"
                  opacity={0.9 - k * 0.25}
                />
              ))}
            {/* Sibilo monofônico: uma só onda, regular, mesma frequência sempre. */}
            {tipo === 'sibilo-monofonico' && amp > 0 && (
              <path d={Array.from({ length: 16 }, (_, i) => `${i === 0 ? 'M' : 'L'} ${xExp + 1 + i * ((fim - xExp - 3) / 15)} ${y0 - (i % 2 ? 1 : -1) * 7 * amp}`).join(' ')} stroke={AMARELO} strokeWidth="1.1" fill="none" />
            )}
            {/* Estertores: estalos descontínuos no fim da inspiração. */}
            {tipo === 'estertores' &&
              amp > 0 &&
              Array.from({ length: Math.round(3 + amp * 6) }, (_, i) => (
                <rect key={i} x={xIns + (xExp - xIns) * (0.55 + i * 0.045)} y={y0 - 6 * amp - (i % 2) * 2} width="0.9" height={12 * amp + (i % 2) * 4} fill={AMARELO} />
              ))}
            {/* Estridor: som único, áspero, inspiratório — ocupa a inspiração inteira. */}
            {tipo === 'estridor' && amp > 0 && (
              <path d={Array.from({ length: 22 }, (_, i) => `${i === 0 ? 'M' : 'L'} ${xIns + 1 + i * ((xExp - xIns - 2) / 21)} ${y0 - (i % 2 ? 1 : -1) * 9 * amp}`).join(' ')} stroke={AMARELO} strokeWidth="1.2" fill="none" />
            )}
          </g>
        )
      })}
    </g>
  )
}

function rotuloAusculta(tipo: Ausculta, intensidade: number): string {
  switch (tipo) {
    case 'sopro-ejecao':
      return `sopro crescendo-decrescendo · ${Math.round(intensidade)}/6 · foco aórtico → carótidas`
    case 'sopro-holossistolico':
      return `sopro holossistólico · ${Math.round(intensidade)}/6 · ápice → axila`
    case 'b3':
      return `B3 · protodiastólica · ${['ausente', 'discreta', 'nítida', 'galope'][Math.round(intensidade)] ?? ''}`
    case 'b4':
      return `B4 · pré-sistólica · ${['ausente', 'discreta', 'nítida', 'galope'][Math.round(intensidade)] ?? ''}`
    case 'sibilos':
      return `sibilos difusos · polifônicos · ${['ausentes', 'expiratórios', 'bifásicos', 'com tórax silencioso próximo'][Math.round(intensidade)] ?? ''}`
    case 'sibilo-monofonico':
      return `sibilo monofônico fixo · ${Math.round(intensidade)} Hz`
    case 'estertores':
      return `estertores crepitantes · fim da inspiração · ${['ausentes', 'bases', 'até terço médio', 'difusos'][Math.round(intensidade)] ?? ''}`
    case 'estridor':
      return `estridor inspiratório · ${['ausente', 'ao esforço', 'em repouso', 'bifásico — via aérea crítica'][Math.round(intensidade)] ?? ''}`
  }
}

// ─── Tórax: mapa de achados unilaterais ───────────────────────────────────────

type AchadoToracico = 'mv-abolido' | 'macicez' | 'fremito-aumentado' | 'fremito-reduzido' | 'musculatura-acessoria'

/**
 * Tórax de frente com os dois hemitórax lado a lado. O achado é sempre uma
 * **diferença** entre os lados, e é isso que a figura mostra: a zona
 * hachurada de um lado e o lado oposto normal. A extensão em cm (ou o
 * percentual) governa a altura da zona a partir da base — porque líquido e
 * consolidação são gravitacionais.
 */
export function MapaToracico({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const achado = txt(params, 'achado', 'mv-abolido') as AchadoToracico
  const valor = num(params, 'valor', 50)
  const acessoria = achado === 'musculatura-acessoria'
  // Fração do hemitórax acometido, de baixo para cima.
  const fracao = achado === 'macicez' ? Math.min(1, valor / 20) : Math.min(1, valor / 100)
  const cor = achado === 'fremito-aumentado' ? '#e07a4a' : achado === 'fremito-reduzido' || achado === 'mv-abolido' ? '#4a7fe0' : '#b8a04a'
  const alturaZona = 56 * fracao
  const freq = num(params, 'frequencia', 30)
  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo={FUNDO}>
      {/* Contorno do tórax e pescoço. */}
      <path d="M 30 26 Q 50 20 70 26 L 84 34 Q 90 60 84 88 L 16 88 Q 10 60 16 34 Z" fill="#2a323b" stroke="#5f6b78" strokeWidth="0.8" />
      <path d="M 42 10 L 42 26 M 58 10 L 58 26" stroke="#5f6b78" strokeWidth="0.8" />
      <line x1="50" y1="26" x2="50" y2="88" stroke="#3a4552" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
      {/* Costelas. */}
      {[36, 46, 56, 66, 76].map((y) => (
        <path key={y} d={`M 18 ${y} Q 50 ${y + 5} 82 ${y}`} stroke="#3a4552" strokeWidth="0.6" fill="none" />
      ))}
      {!acessoria && fracao > 0 && (
        <g>
          {/* Zona acometida: hemitórax direito do paciente (esquerda da tela), de baixo para cima. */}
          <path d={`M 16 88 L 49 88 L 49 ${88 - alturaZona} Q 30 ${86 - alturaZona} 16 ${88 - alturaZona} Z`} fill={cor} opacity="0.55" />
          {Array.from({ length: Math.round(alturaZona / 4) }, (_, i) => (
            <line key={i} x1="17" y1={86 - i * 4} x2="48" y2={86 - i * 4 - 2} stroke={cor} strokeWidth="0.5" opacity="0.8" />
          ))}
          <text x="32" y={84 - alturaZona - 2} textAnchor="middle" fill={AMARELO} fontSize="3.4" fontFamily="system-ui, sans-serif">
            {achado === 'macicez' ? 'maciço' : achado === 'mv-abolido' ? 'MV abolido' : achado === 'fremito-aumentado' ? 'FTV ↑' : 'FTV ↓'}
          </text>
          <text x="67" y="60" textAnchor="middle" fill="#8d97a3" fontSize="3.4" fontFamily="system-ui, sans-serif">normal</text>
        </g>
      )}
      {acessoria && (
        <g>
          {/* Esternocleidomastoideos e escalenos contraídos; retração intercostal. */}
          {[[42, 10, 34, 28], [58, 10, 66, 28]].map(([x1, y1, x2, y2]) => (
            <path key={x1} d={`M ${x1} ${y1} Q ${(x1 + x2) / 2 + (x1 < 50 ? -3 : 3)} ${(y1 + y2) / 2} ${x2} ${y2}`} stroke="#e07a4a" strokeWidth={1.5 + (freq - 8) / 12} fill="none" strokeLinecap="round" />
          ))}
          {[46, 56, 66].map((y) => (
            <path key={y} d={`M 22 ${y + 2} Q 50 ${y + 9} 78 ${y + 2}`} stroke="#e07a4a" strokeWidth="0.8" fill="none" opacity={Math.min(1, (freq - 8) / 30)} />
          ))}
          <path d="M 34 30 L 66 30" stroke="#e07a4a" strokeWidth="0.8" strokeDasharray="1 1" opacity={Math.min(1, (freq - 8) / 30)} />
          <text x="50" y="96" textAnchor="middle" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">
            {`${Math.round(freq)} irpm · esternocleidomastoideos ${freq > 24 ? 'contraídos' : 'relaxados'}${freq > 30 ? ' · tiragem' : ''}`}
          </text>
        </g>
      )}
      {!acessoria && (
        <text x="50" y="96" textAnchor="middle" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">
          {achado === 'macicez' ? `macicez ${Math.round(valor)} cm a partir da base` : `${achado === 'mv-abolido' ? 'redução do som' : achado === 'fremito-aumentado' ? 'frêmito' : 'redução do frêmito'} ${Math.round(valor)}%`}
        </text>
      )}
    </Quadro>
  )
}

// ─── Pulso e pressão ──────────────────────────────────────────────────────────

type AchadoPulso = 'irregular' | 'paradoxal' | 'assimetrico' | 'ortostatico' | 'itb'

/**
 * O pulso como traçado no tempo — ou, para a pressão, como barras. A
 * irregularidade é intervalo que muda sem padrão; o paradoxal é amplitude
 * que cai na inspiração; a assimetria e o índice tornozelo-braquial são
 * dois traçados (ou duas barras) lado a lado.
 */
export function Pulso({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const achado = txt(params, 'achado', 'irregular') as AchadoPulso
  const valor = num(params, 'valor', 50)
  const y0 = 56
  const onda = (x: number, a: number) => `M ${x} ${y0} q 1.2 ${-a} 2.4 ${-a} q 1.6 0 2.8 ${a * 0.6} q 1.4 ${a * 0.4} 3.2 ${a * 0.4}`
  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo={FUNDO}>
      <line x1="4" y1={y0} x2="96" y2={y0} stroke="#3a4552" strokeWidth="0.6" />
      {achado === 'irregular' && (
        <g>
          {/* Intervalos sorteados com semente fixa, mais variáveis conforme o valor. */}
          {(() => {
            const v = Math.max(0, Math.min(100, valor)) / 100
            let x = 6
            const ondas: number[] = []
            let k = 0
            while (x < 90) {
              ondas.push(x)
              const ruido = ((k * 7919) % 100) / 100 - 0.5
              x += 12 + ruido * 16 * v
              k++
            }
            return ondas.map((xi) => <path key={xi} d={onda(xi, 14)} stroke={AMARELO} strokeWidth="1.1" fill="none" />)
          })()}
        </g>
      )}
      {achado === 'paradoxal' && (
        <g>
          {/* Amplitude cai na inspiração — a queda da PAS em mmHg vira encolhimento da onda. */}
          {Array.from({ length: 8 }, (_, i) => {
            const insp = i % 4 === 1 || i % 4 === 2
            const a = insp ? 14 * (1 - Math.min(1, valor / 40)) : 14
            return <path key={i} d={onda(6 + i * 11, a)} stroke={AMARELO} strokeWidth="1.1" fill="none" />
          })}
          <rect x="17" y={y0 + 10} width="22" height="1.2" fill="#4a7fe0" />
          <text x="28" y={y0 + 16} textAnchor="middle" fill="#8d97a3" fontSize="3.2" fontFamily="system-ui, sans-serif">inspiração</text>
          <rect x="61" y={y0 + 10} width="22" height="1.2" fill="#4a7fe0" />
          <text x="72" y={y0 + 16} textAnchor="middle" fill="#8d97a3" fontSize="3.2" fontFamily="system-ui, sans-serif">inspiração</text>
        </g>
      )}
      {achado === 'assimetrico' && (
        <g>
          {Array.from({ length: 4 }, (_, i) => (
            <path key={`d${i}`} d={onda(8 + i * 10, 14)} stroke={AMARELO} strokeWidth="1.1" fill="none" />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <path key={`e${i}`} d={onda(54 + i * 10, 14 * (1 - Math.min(1, valor / 100)))} stroke={AMARELO} strokeWidth="1.1" fill="none" />
          ))}
          <line x1="50" y1="30" x2="50" y2="80" stroke="#3a4552" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
          <text x="26" y="30" textAnchor="middle" fill="#8d97a3" fontSize="3.4" fontFamily="system-ui, sans-serif">lado normal</text>
          <text x="74" y="30" textAnchor="middle" fill="#8d97a3" fontSize="3.4" fontFamily="system-ui, sans-serif">lado afetado</text>
        </g>
      )}
      {(achado === 'ortostatico' || achado === 'itb') && (
        <g>
          {/* Barras de pressão: deitado × em pé, ou braço × tornozelo. */}
          {(() => {
            const a = achado === 'ortostatico' ? 130 : 130
            const b = achado === 'ortostatico' ? 130 - valor : 130 * Math.max(0, Math.min(1.5, valor))
            const esc = 0.4
            return (
              <g>
                <rect x="24" y={80 - a * esc} width="16" height={a * esc} fill="#4a7fe0" opacity="0.8" />
                <rect x="60" y={80 - b * esc} width="16" height={b * esc} fill={achado === 'ortostatico' ? (valor >= 20 ? '#e07a4a' : '#4a7fe0') : valor < 0.9 ? '#e07a4a' : '#4a7fe0'} opacity="0.85" />
                <text x="32" y={76 - a * esc} textAnchor="middle" fill={TINTA} fontSize="3.6" fontFamily="system-ui, sans-serif">{Math.round(a)}</text>
                <text x="68" y={76 - b * esc} textAnchor="middle" fill={TINTA} fontSize="3.6" fontFamily="system-ui, sans-serif">{Math.round(b)}</text>
                <text x="32" y="86" textAnchor="middle" fill="#8d97a3" fontSize="3.2" fontFamily="system-ui, sans-serif">{achado === 'ortostatico' ? 'deitado' : 'braço'}</text>
                <text x="68" y="86" textAnchor="middle" fill="#8d97a3" fontSize="3.2" fontFamily="system-ui, sans-serif">{achado === 'ortostatico' ? 'em pé (3 min)' : 'tornozelo'}</text>
                <line x1="4" y1="80" x2="96" y2="80" stroke="#3a4552" strokeWidth="0.6" />
              </g>
            )
          })()}
        </g>
      )}
      <text x="4" y="95" fill={AMARELO} fontSize="3.8" fontFamily="system-ui, sans-serif">
        {achado === 'irregular'
          ? `intervalos variáveis · ${Math.round(valor)}% de variabilidade${valor >= 30 ? ' · irregularmente irregular' : ''}`
          : achado === 'paradoxal'
            ? `queda inspiratória da PAS ${Math.round(valor)} mmHg${valor >= 10 ? ' · pulso paradoxal' : ''}`
            : achado === 'assimetrico'
              ? `diferença de amplitude ${Math.round(valor)}%${valor >= 50 ? ' · pulso reduzido ou ausente' : ''}`
              : achado === 'ortostatico'
                ? `queda da PAS ${Math.round(valor)} mmHg ao ficar em pé${valor >= 20 ? ' · hipotensão ortostática' : ''}`
                : `ITB ${valor.toFixed(2)}${valor < 0.9 ? ' · doença arterial periférica' : valor > 1.3 ? ' · artéria não compressível' : ' · normal'}`}
      </text>
    </Quadro>
  )
}

// ─── Membro inferior: cor, temperatura e feridas ──────────────────────────────

type AchadoMembro = 'frio' | 'isquemia' | 'ulcera-arterial' | 'ulcera-venosa' | 'celulite' | 'fasciite'

/**
 * Perna vista de frente, do joelho ao pé. A cor da pele vem da perfusão: rósea
 * quando há sangue, pálida e depois marmórea e cianótica quando não há. A
 * ferida arterial fica na ponta dos dedos e no dorso, é seca e pálida; a
 * venosa fica no maléolo medial, é úmida e cercada de pele marrom.
 */
export function MembroInferior({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const achado = txt(params, 'achado', 'frio') as AchadoMembro
  const valor = num(params, 'valor', 50)
  const temperatura = achado === 'frio' ? valor : 36
  const horas = achado === 'isquemia' ? valor : 0
  // Palidez: quanto mais frio ou mais horas de isquemia, mais pálido → marmóreo → cianótico.
  const isquemiaFrac = achado === 'frio' ? Math.max(0, Math.min(1, (36 - temperatura) / 12)) : achado === 'isquemia' ? Math.max(0, Math.min(1, horas / 12)) : 0
  const corPele = isquemiaFrac > 0.66 ? '#8a90a8' : isquemiaFrac > 0.33 ? '#d9d2cf' : achado === 'celulite' || achado === 'fasciite' ? '#e2b6a0' : '#dfb59a'
  const area = achado === 'celulite' || achado === 'fasciite' ? Math.max(0, Math.min(1, valor / (achado === 'celulite' ? 1000 : 500))) : 0
  const rUlcera = achado === 'ulcera-arterial' || achado === 'ulcera-venosa' ? 2 + Math.sqrt(Math.max(0, Math.min(20, valor))) * 1.6 : 0
  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo={FUNDO}>
      {/* Perna e pé. */}
      <path d="M 36 4 Q 30 40 34 70 L 34 78 Q 34 86 44 88 L 78 90 Q 84 88 80 82 L 62 78 L 62 70 Q 66 40 62 4 Z" fill={corDeTecido(corPele)} stroke="#5f6b78" strokeWidth="0.8" />
      {/* Livedo marmóreo na isquemia avançada. */}
      {isquemiaFrac > 0.4 &&
        Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx={40 + ((i * 17) % 20)} cy={12 + i * 8} rx="7" ry="4" fill="none" stroke="#6a5a7a" strokeWidth="0.7" opacity={Math.min(1, (isquemiaFrac - 0.4) * 2)} />
        ))}
      {/* Dedos cianóticos na isquemia grave. */}
      {isquemiaFrac > 0.7 && <path d="M 66 86 L 80 88 Q 84 88 80 82 L 68 80 Z" fill="#4a4f7a" opacity="0.85" />}
      {/* Celulite / fasciíte: eritema difuso de limites imprecisos, de baixo para cima. */}
      {area > 0 && (
        <g>
          <path d={`M 34 78 L 62 78 L 62 ${78 - area * 66} Q 48 ${72 - area * 66} 34 ${78 - area * 66} Z`} fill="#d1453a" opacity="0.55" />
          {achado === 'fasciite' && (
            <g>
              {/* Bolhas, áreas violáceas e necrose: a pele que já morreu por cima da fáscia. */}
              {Array.from({ length: Math.round(2 + area * 5) }, (_, i) => (
                <ellipse key={i} cx={40 + ((i * 11) % 18)} cy={72 - i * 8 * area} rx="3.5" ry="2.4" fill="#5a2a6a" opacity="0.85" />
              ))}
              <ellipse cx="48" cy={60 - area * 20} rx="5" ry="3.5" fill="#2a1a1a" opacity="0.9" />
              <ellipse cx="42" cy={48 - area * 20} rx="3" ry="2" fill="#f0e6d0" opacity="0.9" />
            </g>
          )}
        </g>
      )}
      {/* Úlcera arterial: dorso do pé / dedos, seca, pálida, bordas nítidas. */}
      {achado === 'ulcera-arterial' && (
        <g>
          <circle cx="70" cy="84" r={rUlcera} fill="#f0e6d0" />
          <circle cx="70" cy="84" r={rUlcera} fill="none" stroke="#8a2a2a" strokeWidth="0.9" />
          <circle cx="70" cy="84" r={rUlcera * 0.5} fill="#3a2a2a" opacity="0.7" />
        </g>
      )}
      {/* Úlcera venosa: maléolo medial, rasa, úmida, com dermatite ocre ao redor. */}
      {achado === 'ulcera-venosa' && (
        <g>
          <ellipse cx="40" cy="70" rx={rUlcera * 2.2 + 3} ry={rUlcera * 1.6 + 3} fill="#8a5a3a" opacity="0.55" />
          <ellipse cx="40" cy="70" rx={rUlcera * 1.3} ry={rUlcera} fill="#c9463a" />
          <ellipse cx="40" cy="70" rx={rUlcera * 1.3} ry={rUlcera} fill="#e0d0a0" opacity="0.45" />
          <path d="M 46 30 Q 40 50 44 62" stroke="#3a4a8a" strokeWidth="1.6" fill="none" opacity="0.7" />
        </g>
      )}
      {/* Termômetro lateral para a extremidade fria. */}
      {achado === 'frio' && (
        <g>
          <rect x="86" y="14" width="4" height="60" rx="2" fill="#2a323b" stroke="#5f6b78" strokeWidth="0.5" />
          <rect x="87" y={74 - ((temperatura - 20) / 17) * 58} width="2" height={((temperatura - 20) / 17) * 58} fill={temperatura < 30 ? '#4a7fe0' : '#e07a4a'} />
          <text x="88" y="80" textAnchor="middle" fill={TINTA} fontSize="3.2" fontFamily="system-ui, sans-serif">{`${temperatura.toFixed(0)}°`}</text>
        </g>
      )}
      <text x="4" y="96" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">
        {achado === 'frio'
          ? `pele a ${temperatura.toFixed(0)} °C · pulso ${temperatura < 30 ? 'filiforme' : 'presente'}`
          : achado === 'isquemia'
            ? `${Math.round(horas)} h de isquemia · ${horas < 6 ? 'pálido, salvável' : horas < 12 ? 'marmóreo · déficit sensitivo' : 'cianótico · rigidez — inviável'}`
            : achado === 'celulite'
              ? `eritema, calor e edema · ${Math.round(valor)} cm²`
              : achado === 'fasciite'
                ? `necrose ${Math.round(valor)} cm² · bolhas · dor desproporcional`
                : achado === 'ulcera-arterial'
                  ? `úlcera ${valor.toFixed(1)} cm² · distal, seca, dolorosa · pé frio`
                  : `úlcera ${valor.toFixed(1)} cm² · maléolo medial · dermatite ocre`}
      </text>
    </Quadro>
  )
}

// ─── Pele: lesões elementares ─────────────────────────────────────────────────

type Lesao = 'alvo' | 'purpura' | 'urticaria'

/**
 * Um retalho de pele visto de perto. A lesão em alvo tem três zonas
 * concêntricas; a púrpura é a mancha que **não some** quando a lâmina de
 * vidro comprime (o quadrado translúcido sobre a metade direita); a urtica é
 * a placa elevada, pálida no centro e vermelha na borda, que a sombra denuncia.
 */
export function Pele({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const lesao = txt(params, 'lesao', 'alvo') as Lesao
  const valor = num(params, 'valor', 10)
  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo={FUNDO}>
      <rect x="4" y="4" width="92" height="84" rx="4" fill={corDeTecido('#e0b79c')} />
      <rect x="4" y="4" width="92" height="84" rx="4" fill={corDeTecido('#c9987c')} opacity="0.2" />
      {lesao === 'alvo' &&
        (() => {
          const r = 3 + Math.max(0, Math.min(30, valor)) * 0.5
          return [
            [30, 34],
            [62, 30],
            [46, 62],
            [76, 66],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill="#d1453a" opacity="0.85" />
              <circle cx={cx} cy={cy} r={r * 0.66} fill="#e8b0a0" />
              <circle cx={cx} cy={cy} r={r * 0.33} fill="#7a2a3a" />
            </g>
          ))
        })()}
      {lesao === 'purpura' && (
        <g>
          {Array.from({ length: 26 }, (_, i) => {
            const r = 0.6 + Math.max(0, Math.min(20, valor)) * 0.12 + ((i * 3) % 4) * 0.3
            return <circle key={i} cx={8 + ((i * 31) % 84)} cy={10 + ((i * 47) % 70)} r={r} fill="#6a1a3a" opacity="0.9" />
          })}
          {/* Diascopia: a lâmina comprime a metade direita e a púrpura continua lá. */}
          <rect x="52" y="8" width="40" height="76" fill="#cfe6f2" opacity="0.28" stroke="#ffffff" strokeWidth="0.6" />
          <text x="72" y="82" textAnchor="middle" fill="#3a4552" fontSize="3.2" fontFamily="system-ui, sans-serif">sob a lâmina: não some</text>
        </g>
      )}
      {lesao === 'urticaria' && (
        <g>
          {Array.from({ length: Math.round(1 + Math.max(0, Math.min(100, valor)) / 14) }, (_, i) => {
            const cx = 20 + ((i * 29) % 60)
            const cy = 20 + ((i * 43) % 50)
            const rx = 9 + (i % 3) * 3
            const ry = 6 + (i % 2) * 2
            return (
              <g key={i}>
                <ellipse cx={cx + 1} cy={cy + 1.2} rx={rx} ry={ry} fill="#000" opacity="0.18" />
                <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#e26a5a" />
                <ellipse cx={cx} cy={cy} rx={rx * 0.7} ry={ry * 0.65} fill="#f0d0c0" />
              </g>
            )
          })}
        </g>
      )}
      <text x="4" y="96" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">
        {lesao === 'alvo'
          ? `lesões em alvo · ${Math.round(valor)} mm · três zonas concêntricas`
          : lesao === 'purpura'
            ? `púrpura ${valor <= 3 ? 'petequial' : 'equimótica'} · ${Math.round(valor)} mm · não desaparece à pressão`
            : `urticas · ${Math.round(valor)}% da superfície · fugazes, pruriginosas`}
      </text>
    </Quadro>
  )
}

// ─── Face e boca ──────────────────────────────────────────────────────────────

type AchadoFacial = 'angioedema-lingua' | 'desvio-lingua' | 'hemianopsia' | 'campo-confrontacao' | 'nistagmo'

export function Face({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const achado = txt(params, 'achado', 'desvio-lingua') as AchadoFacial
  const valor = num(params, 'valor', 15)
  const campo = achado === 'hemianopsia' || achado === 'campo-confrontacao'
  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo={FUNDO}>
      {campo ? (
        <g>
          {/* Dois campos visuais, um por olho, como no mapa da campimetria. */}
          {[28, 72].map((cx, i) => {
            const perdido = achado === 'hemianopsia' ? Math.max(0, Math.min(50, valor)) / 50 : i === 1 ? Math.max(0, Math.min(50, valor)) / 50 : 0
            return (
              <g key={cx}>
                <circle cx={cx} cy="50" r="20" fill="#2a323b" stroke="#5f6b78" strokeWidth="0.8" />
                <line x1={cx} y1="30" x2={cx} y2="70" stroke="#3a4552" strokeWidth="0.5" />
                <line x1={cx - 20} y1="50" x2={cx + 20} y2="50" stroke="#3a4552" strokeWidth="0.5" />
                {/* Hemianopsia homônima: o mesmo lado (direito) perdido nos dois olhos. */}
                {perdido > 0 && <path d={`M ${cx} 30 A 20 20 0 0 1 ${cx} 70 Z`} fill="#0a0c10" opacity={0.5 + perdido * 0.5} />}
                {achado === 'campo-confrontacao' && i === 1 && perdido > 0 && <path d={`M ${cx} 30 A 20 20 0 0 1 ${cx + 20} 50 L ${cx} 50 Z`} fill="#0a0c10" opacity="0.95" />}
                <text x={cx} y="78" textAnchor="middle" fill="#8d97a3" fontSize="3.4" fontFamily="system-ui, sans-serif">{i === 0 ? 'olho esquerdo' : 'olho direito'}</text>
              </g>
            )
          })}
          <text x="4" y="94" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">
            {achado === 'hemianopsia' ? `hemianopsia homônima direita · ${Math.round(valor)}% do campo · lesão retroquiasmática esquerda` : `déficit à confrontação · quadrante temporal superior direito · ${Math.round(valor)}%`}
          </text>
        </g>
      ) : achado === 'nistagmo' ? (
        <g>
          {[30, 70].map((cx) => (
            <g key={cx}>
              <path d={`M ${cx - 16} 50 Q ${cx} 36 ${cx + 16} 50 Q ${cx} 64 ${cx - 16} 50 Z`} fill={corDeTecido('#f4efe8')} />
              <circle cx={cx + Math.min(8, valor * 1.6)} cy="50" r="7" fill={corDeTecido('#5b4a3a')} />
              <circle cx={cx + Math.min(8, valor * 1.6)} cy="50" r="3" fill="#0a0708" />
              {/* Setas: fase lenta para um lado, rápida (batida) para o outro. */}
              <path d={`M ${cx - 10} 70 L ${cx + 6} 70`} stroke="#8d97a3" strokeWidth="0.8" />
              <path d={`M ${cx + 6} 70 L ${cx + 10} 70 M ${cx + 8} 68 L ${cx + 10} 70 L ${cx + 8} 72`} stroke={AMARELO} strokeWidth="1.2" fill="none" />
            </g>
          ))}
          <text x="4" y="94" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">{`nistagmo horizontal · ${valor.toFixed(1)} Hz · fase rápida para a direita`}</text>
        </g>
      ) : (
        <g>
          {/* Boca aberta com a língua protruída. */}
          <path d="M 20 30 Q 50 14 80 30 Q 84 60 50 70 Q 16 60 20 30 Z" fill={corDeTecido('#c07068')} />
          <path d="M 24 32 Q 50 20 76 32 Q 78 50 50 58 Q 22 50 24 32 Z" fill="#2a1113" />
          {achado === 'desvio-lingua' && (
            <path
              d={`M 40 44 Q ${50 + Math.max(0, Math.min(30, valor)) * 0.5} 30 ${50 + Math.max(0, Math.min(30, valor)) * 1.1} ${78 - Math.max(0, Math.min(30, valor)) * 0.2} Q ${50 + Math.max(0, Math.min(30, valor)) * 0.6} 82 ${44 + Math.max(0, Math.min(30, valor)) * 0.3} 78 Q 36 60 40 44 Z`}
              fill={corDeTecido('#d7736a')}
              stroke={corDeTecido('#8a3a35')}
              strokeWidth="0.8"
            />
          )}
          {achado === 'angioedema-lingua' && (
            <path
              d={`M ${38 - valor * 0.14} 42 Q 50 ${28 - valor * 0.1} ${62 + valor * 0.14} 42 Q ${64 + valor * 0.16} ${70 + valor * 0.12} 50 ${80 + valor * 0.1} Q ${36 - valor * 0.16} ${70 + valor * 0.12} ${38 - valor * 0.14} 42 Z`}
              fill={corDeTecido('#d98a80')}
              stroke={corDeTecido('#8a3a35')}
              strokeWidth="0.8"
            />
          )}
          <text x="4" y="94" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">
            {achado === 'desvio-lingua' ? `língua desviada ${Math.round(valor)}° para a direita · lesão do XII direito` : `língua aumentada ${Math.round(valor)}% · via aérea ameaçada`}
          </text>
        </g>
      )}
    </Quadro>
  )
}

// ─── Abdome ───────────────────────────────────────────────────────────────────

type AchadoAbdominal = 'grey-turner' | 'cullen' | 'defesa' | 'massa-pulsatil' | 'hepatomegalia' | 'esplenomegalia' | 'descompressao'

export function Abdome({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const achado = txt(params, 'achado', 'hepatomegalia') as AchadoAbdominal
  const valor = num(params, 'valor', 5)
  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo={FUNDO}>
      {/* Abdome de frente: rebordos costais, umbigo e linhas de referência. */}
      <rect x="12" y="8" width="76" height="84" rx="14" fill={corDeTecido('#dfb59a')} />
      <path d="M 12 26 Q 30 18 44 26 M 88 26 Q 70 18 56 26" stroke="#8a6a5a" strokeWidth="1.2" fill="none" />
      <circle cx="50" cy="56" r="2" fill="#a07a68" />
      {achado === 'grey-turner' && (
        <g>
          <ellipse cx="18" cy="50" rx={4 + Math.sqrt(Math.max(0, valor)) * 0.9} ry={8 + Math.sqrt(Math.max(0, valor)) * 1.4} fill="#5a2a6a" opacity="0.8" />
          <ellipse cx="82" cy="52" rx={4 + Math.sqrt(Math.max(0, valor)) * 0.7} ry={7 + Math.sqrt(Math.max(0, valor)) * 1.2} fill="#5a2a6a" opacity="0.7" />
        </g>
      )}
      {achado === 'cullen' && <circle cx="50" cy="56" r={2 + Math.max(0, Math.min(15, valor)) * 1.4} fill="#4a3a7a" opacity="0.8" />}
      {achado === 'defesa' && (
        <g>
          {/* Retos contraídos: as bandas verticais que aparecem na palpação. */}
          {[40, 60].map((x) => (
            <rect key={x} x={x - 6} y="28" width="12" height="58" rx="5" fill="#b08070" opacity={0.15 + Math.max(0, Math.min(3, valor)) * 0.25} />
          ))}
          <path d="M 44 40 L 56 40 M 44 52 L 56 52 M 44 64 L 56 64" stroke="#8a6a5a" strokeWidth="0.6" opacity={Math.max(0, Math.min(3, valor)) / 3} />
        </g>
      )}
      {achado === 'massa-pulsatil' && (
        <g>
          <ellipse cx="48" cy="44" rx={Math.max(2, Math.min(10, valor)) * 2.2} ry={Math.max(2, Math.min(10, valor)) * 1.4} fill="#c9463a" opacity="0.45" />
          <ellipse cx="48" cy="44" rx={Math.max(2, Math.min(10, valor)) * 2.2 + 3} ry={Math.max(2, Math.min(10, valor)) * 1.4 + 2} fill="none" stroke="#c9463a" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
          <path d={`M ${48 - valor * 2.2 - 8} 44 L ${48 - valor * 2.2 - 3} 44 M ${48 + valor * 2.2 + 3} 44 L ${48 + valor * 2.2 + 8} 44`} stroke={AMARELO} strokeWidth="1" />
        </g>
      )}
      {achado === 'hepatomegalia' && (
        <path d={`M 12 26 Q 30 18 44 26 L 56 ${28 + Math.max(0, Math.min(15, valor)) * 2.6} Q 30 ${34 + Math.max(0, Math.min(15, valor)) * 2.8} 12 ${28 + Math.max(0, Math.min(15, valor)) * 2.2} Z`} fill="#8a3a35" opacity="0.45" />
      )}
      {achado === 'esplenomegalia' && (
        <path d={`M 88 26 Q 70 18 56 26 L ${48 - Math.max(0, Math.min(15, valor)) * 1.6} ${30 + Math.max(0, Math.min(15, valor)) * 2.8} Q 76 ${40 + Math.max(0, Math.min(15, valor)) * 2.6} 88 ${28 + Math.max(0, Math.min(15, valor)) * 1.4} Z`} fill="#4a3a7a" opacity="0.45" />
      )}
      {achado === 'descompressao' && (
        <g>
          <circle cx="66" cy="66" r="9" fill="#c9463a" opacity={0.15 + Math.max(0, Math.min(10, valor)) * 0.06} />
          <path d="M 66 46 L 66 56 M 63 53 L 66 56 L 69 53" stroke={AMARELO} strokeWidth="1.2" fill="none" />
          <path d="M 80 66 L 90 66 M 87 63 L 90 66 L 87 69" stroke={AMARELO} strokeWidth="1.2" fill="none" transform="rotate(-90 85 66)" />
        </g>
      )}
      <text x="4" y="97" fill={AMARELO} fontSize="3.5" fontFamily="system-ui, sans-serif">
        {achado === 'grey-turner'
          ? `equimose de flancos · ${Math.round(valor)} cm²`
          : achado === 'cullen'
            ? `equimose periumbilical · ${Math.round(valor)} cm`
            : achado === 'defesa'
              ? `rigidez ${['ausente', 'leve', 'moderada', 'em tábua'][Math.round(Math.max(0, Math.min(3, valor)))]}`
              : achado === 'massa-pulsatil'
                ? `massa pulsátil expansiva · ${valor.toFixed(1)} cm${valor >= 3 ? ' · aneurisma até prova em contrário' : ''}`
                : achado === 'hepatomegalia'
                  ? `fígado ${Math.round(valor)} cm abaixo do rebordo`
                  : achado === 'esplenomegalia'
                    ? `baço ${Math.round(valor)} cm abaixo do rebordo${valor >= 8 ? ' · esplenomegalia maciça' : ''}`
                    : `dor à descompressão ${Math.round(valor)}/10`}
      </text>
    </Quadro>
  )
}

// ─── Neurológico: manobras ────────────────────────────────────────────────────

type AchadoNeuro = 'pronator-drift' | 'marcha-ataxica' | 'rigidez-nuca' | 'kernig' | 'disartria' | 'afasia'

export function ManobraNeurologica({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const achado = txt(params, 'achado', 'pronator-drift') as AchadoNeuro
  const valor = num(params, 'valor', 15)
  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo={FUNDO}>
      {achado === 'pronator-drift' && (
        <g>
          {/* Braços estendidos, palmas para cima, olhos fechados: o afetado prona e cai. */}
          <circle cx="50" cy="20" r="7" fill={corDeTecido('#dfb59a')} />
          <rect x="44" y="27" width="12" height="30" rx="4" fill="#3a4552" />
          <path d="M 44 32 L 10 34" stroke={corDeTecido('#dfb59a')} strokeWidth="5" strokeLinecap="round" />
          <path d={`M 56 32 Q 74 ${34 + valor * 0.6} 90 ${34 + Math.max(0, Math.min(30, valor)) * 1.4}`} stroke={corDeTecido('#dfb59a')} strokeWidth="5" strokeLinecap="round" fill="none" />
          <ellipse cx="10" cy="33" rx="4" ry="2.4" fill="none" stroke={TINTA} strokeWidth="0.6" />
          <ellipse cx="90" cy={33 + Math.max(0, Math.min(30, valor)) * 1.4} rx="4" ry="2.4" fill={valor > 5 ? TINTA : 'none'} stroke={TINTA} strokeWidth="0.6" transform={`rotate(${Math.min(90, valor * 3)} 90 ${33 + Math.max(0, Math.min(30, valor)) * 1.4})`} />
          <line x1="12" y1="34" x2="90" y2="34" stroke="#3a4552" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
          <text x="4" y="94" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">{`braço esquerdo prona e cai ${Math.round(valor)} cm · déficit piramidal sutil`}</text>
        </g>
      )}
      {achado === 'marcha-ataxica' && (
        <g>
          {/* Pegadas: base alargada e passos irregulares. */}
          {Array.from({ length: 7 }, (_, i) => {
            const base = Math.max(0, Math.min(30, valor)) * 1.1
            const ruido = ((i * 7919) % 100) / 100 - 0.5
            const x = 50 + (i % 2 ? base / 2 : -base / 2) + ruido * base * 0.4
            const y = 84 - i * 11 + ruido * 4
            return <ellipse key={i} cx={x} cy={y} rx="3.5" ry="6" fill={TINTA} opacity="0.85" transform={`rotate(${ruido * 30 * (base / 15)} ${x} ${y})`} />
          })}
          <line x1="50" y1="8" x2="50" y2="92" stroke="#3a4552" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
          <text x="4" y="97" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">{`base ${Math.round(valor)} cm · passos irregulares${valor >= 15 ? ' · marcha ebriosa' : ''}`}</text>
        </g>
      )}
      {(achado === 'rigidez-nuca' || achado === 'kernig') && (
        <g>
          {/* Paciente deitado; o examinador flete o pescoço (nuca) ou estende o joelho (Kernig). */}
          <line x1="6" y1="70" x2="94" y2="70" stroke="#3a4552" strokeWidth="0.8" />
          <circle cx="20" cy={achado === 'rigidez-nuca' ? 62 - Math.max(0, Math.min(90, valor)) * 0.2 : 62} r="7" fill={corDeTecido('#dfb59a')} />
          <rect x="26" y="58" width="40" height="10" rx="4" fill="#3a4552" />
          {achado === 'rigidez-nuca' ? (
            <g>
              <path d={`M 26 62 Q 22 ${64 - Math.max(0, Math.min(90, valor)) * 0.25} 20 ${62 - Math.max(0, Math.min(90, valor)) * 0.2}`} stroke="#8a6a5a" strokeWidth="2" fill="none" />
              <path d="M 20 40 L 20 50 M 17 47 L 20 50 L 23 47" stroke={AMARELO} strokeWidth="1.2" fill="none" />
              <text x="4" y="94" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">{`flexão do pescoço ${Math.round(valor)}° ${valor < 45 ? '· resistência dolorosa · rigidez de nuca' : '· livre'}`}</text>
            </g>
          ) : (
            <g>
              {/* Quadril a 90°, joelho que não estende. */}
              <path d="M 66 63 L 70 40" stroke={corDeTecido('#dfb59a')} strokeWidth="6" strokeLinecap="round" />
              <path d={`M 70 40 L ${70 + Math.cos(((180 - Math.max(0, Math.min(180, valor))) * Math.PI) / 180) * 24} ${40 + Math.sin(((180 - Math.max(0, Math.min(180, valor))) * Math.PI) / 180) * 24}`} stroke={corDeTecido('#dfb59a')} strokeWidth="5" strokeLinecap="round" />
              <text x="4" y="94" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">{`extensão do joelho ${Math.round(valor)}° ${valor < 135 ? '· dor e resistência · Kernig positivo' : '· completa'}`}</text>
            </g>
          )}
        </g>
      )}
      {(achado === 'disartria' || achado === 'afasia') && (
        <g>
          {/* Balão de fala: na disartria a forma da onda se deforma (articulação); na afasia as palavras faltam (fluência). */}
          <path d="M 14 26 Q 14 16 24 16 L 76 16 Q 86 16 86 26 L 86 56 Q 86 66 76 66 L 40 66 L 28 78 L 30 66 L 24 66 Q 14 66 14 56 Z" fill="#2a323b" stroke="#5f6b78" strokeWidth="0.8" />
          {achado === 'disartria' ? (
            <path d={Array.from({ length: 40 }, (_, i) => `${i === 0 ? 'M' : 'L'} ${20 + i * 1.5} ${41 - (i % 2 ? 1 : -1) * (4 + ((i * 13) % 9) * (1 - Math.max(0, Math.min(100, valor)) / 100))}`).join(' ')} stroke={AMARELO} strokeWidth="1" fill="none" />
          ) : (
            <g>
              {Array.from({ length: 8 }, (_, i) => {
                const presente = i < Math.round((Math.max(0, Math.min(100, valor)) / 100) * 8)
                return <rect key={i} x={20 + (i % 4) * 16} y={30 + Math.floor(i / 4) * 14} width={10 + (i % 3) * 2} height="5" rx="1.5" fill={presente ? TINTA : '#3a4552'} />
              })}
            </g>
          )}
          <text x="4" y="94" fill={AMARELO} fontSize="3.6" fontFamily="system-ui, sans-serif">
            {achado === 'disartria' ? `fala pastosa · inteligibilidade ${Math.round(valor)}% · linguagem preservada` : `fala não fluente, esforçada · fluência ${Math.round(valor)}% · compreende comandos`}
          </text>
        </g>
      )}
    </Quadro>
  )
}
