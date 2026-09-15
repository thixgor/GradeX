'use client'

import { Quadro, Vinheta, corDeTecido, num, txt, type PropsDeIlustracao } from './base'

/**
 * As pupilas, aos pares.
 *
 * ## Por que a figura mostra dois olhos e, às vezes, dois momentos
 *
 * Pupila não se examina sozinha: o achado é a **comparação** — entre os dois
 * olhos (anisocoria) e entre dois instantes (a resposta à luz). Por isso a
 * cena traz sempre o par de olhos, e as cenas de reflexo desenham dois
 * quadros, "luz no olho direito" e "luz no olho esquerdo", como no teste da
 * lanterna oscilante. O defeito pupilar aferente só existe nessa alternância:
 * cada olho, iluminado sozinho, parece reagir; é ao trocar a luz de um para o
 * outro que a pupila do lado doente **dilata** em vez de contrair — porque a
 * luz que chega por um nervo lesado conta menos do que a que acabou de sair
 * do nervo sadio.
 *
 * A anisocoria fisiológica, por outro lado, é o que **não** muda: a mesma
 * diferença pequena no claro e no escuro, com reflexos normais dos dois lados.
 * Ela está aqui para o aluno saber parar de investigar.
 */

type Cena = 'normal' | 'anisocoria-fisiologica' | 'defeito-pupilar-aferente' | 'anisocoria-nao-reativa'

export function Pupilas({ params, className, titulo, marcadores }: PropsDeIlustracao) {
  const cena = txt(params, 'cena', 'normal') as Cena
  const sufixo = cena.replace(/[^a-z]/g, '')

  // Diferença entre as pupilas, em mm, para a anisocoria fisiológica (0–2).
  const diferenca = cena === 'anisocoria-fisiologica' ? Math.max(0, Math.min(2, num(params, 'diferenca', 1))) : 0
  // Assimetria da resposta no DPAR (0–100%): 0 é normal, 100 é o olho afetado
  // dilatando por completo quando a luz passa para ele.
  const assimetria = cena === 'defeito-pupilar-aferente' ? Math.max(0, Math.min(100, num(params, 'assimetria', 70))) / 100 : 0
  // Anisocoria patológica com pupila fixa (0–8 mm de diferença).
  const diferencaFixa = cena === 'anisocoria-nao-reativa' ? Math.max(0, Math.min(8, num(params, 'diferenca', 4))) : 0

  const doisQuadros = cena === 'defeito-pupilar-aferente' || cena === 'anisocoria-nao-reativa'

  return (
    <Quadro className={className} titulo={titulo} marcadores={marcadores} fundo="#1b1416">
      <defs>
        <Vinheta id={`pup-vin-${sufixo}`} dureza={0.4} />
      </defs>

      {doisQuadros ? (
        <>
          {/* Quadro de cima: luz no olho direito (esquerda da tela). */}
          <Par
            y={27}
            luzEm="direito"
            pupilaDireita={cena === 'defeito-pupilar-aferente' ? 2.2 : 2.2}
            pupilaEsquerda={cena === 'defeito-pupilar-aferente' ? 2.2 : 2.2 + diferencaFixa}
            rotulo="luz no olho direito"
          />
          {/* Quadro de baixo: a luz passa para o olho esquerdo. No DPAR, as
              duas pupilas dilatam — a esquerda é a que "não vê" a luz. Na
              anisocoria não reativa, a esquerda continua fixa. */}
          <Par
            y={73}
            luzEm="esquerdo"
            pupilaDireita={cena === 'defeito-pupilar-aferente' ? 2.2 + assimetria * 2.2 : 2.2}
            pupilaEsquerda={cena === 'defeito-pupilar-aferente' ? 2.2 + assimetria * 2.2 : 2.2 + diferencaFixa}
            rotulo={cena === 'defeito-pupilar-aferente' ? 'luz passa ao esquerdo · as duas dilatam' : 'luz no esquerdo · pupila fixa'}
          />
        </>
      ) : (
        <Par y={50} luzEm="ambos" pupilaDireita={3.4} pupilaEsquerda={3.4 + diferenca} rotulo={diferenca > 0 ? `diferença ${diferenca.toFixed(1)} mm · reflexos normais` : 'isocóricas · fotorreagentes'} />
      )}

      <circle cx="50" cy="50" r="50" fill={`url(#pup-vin-${sufixo})`} />
    </Quadro>
  )
}

/** Um par de olhos numa linha. Os raios das pupilas são em "mm" (1 mm ≈ 1 unidade). */
function Par({
  y,
  luzEm,
  pupilaDireita,
  pupilaEsquerda,
  rotulo,
}: {
  y: number
  luzEm: 'direito' | 'esquerdo' | 'ambos'
  pupilaDireita: number
  pupilaEsquerda: number
  rotulo: string
}) {
  const olhos = [
    { cx: 28, pupila: pupilaDireita, lado: 'direito' as const },
    { cx: 72, pupila: pupilaEsquerda, lado: 'esquerdo' as const },
  ]
  return (
    <g>
      {olhos.map(({ cx, pupila, lado }) => {
        const iluminado = luzEm === 'ambos' || luzEm === lado
        return (
          <g key={lado}>
            {/* Pálpebras e esclera. */}
            <path d={`M ${cx - 17} ${y} Q ${cx} ${y - 13} ${cx + 17} ${y} Q ${cx} ${y + 13} ${cx - 17} ${y} Z`} fill={corDeTecido('#f4efe8')} />
            {/* Íris. */}
            <circle cx={cx} cy={y} r="9" fill={corDeTecido('#5b4a3a')} />
            <circle cx={cx} cy={y} r="9" fill="none" stroke={corDeTecido('#3a2d22')} strokeWidth="0.8" />
            {Array.from({ length: 24 }, (_, i) => {
              const a = (i / 24) * Math.PI * 2
              return <line key={i} x1={cx + Math.cos(a) * (pupila + 0.6)} y1={y + Math.sin(a) * (pupila + 0.6)} x2={cx + Math.cos(a) * 8.6} y2={y + Math.sin(a) * 8.6} stroke={corDeTecido('#7a6247')} strokeWidth="0.35" opacity="0.7" />
            })}
            {/* Pupila — o que se mede. */}
            <circle cx={cx} cy={y} r={pupila} fill="#0a0708" />
            <circle cx={cx - 1.2} cy={y - 1.4} r="0.8" fill="#fff" opacity="0.85" />
            {/* Pálpebras por cima. */}
            <path d={`M ${cx - 17} ${y} Q ${cx} ${y - 13} ${cx + 17} ${y}`} stroke={corDeTecido('#8a5a4e')} strokeWidth="1.6" fill="none" />
            <path d={`M ${cx - 17} ${y} Q ${cx} ${y + 13} ${cx + 17} ${y}`} stroke={corDeTecido('#8a5a4e')} strokeWidth="1" fill="none" />
            {/* Feixe da lanterna. */}
            {iluminado && luzEm !== 'ambos' && (
              <path d={`M ${cx} ${y} L ${cx - 6} ${y - 24} L ${cx + 6} ${y - 24} Z`} fill="#f2c14e" opacity="0.28" />
            )}
            <text x={cx} y={y + 19} textAnchor="middle" fill="#f2c14e" fontSize="3.6" fontFamily="system-ui, sans-serif">
              {pupila.toFixed(1)} mm
            </text>
          </g>
        )
      })}
      <text x="50" y={y - 17} textAnchor="middle" fill="#f2c14e" fontSize="3.8" opacity="0.9" fontFamily="system-ui, sans-serif">
        {rotulo}
      </text>
    </g>
  )
}
