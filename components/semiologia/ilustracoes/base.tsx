/**
 * Fundações do desenho paramétrico.
 *
 * ## A regra de ouro: 0–100 em tudo
 *
 * Toda ilustração usa `viewBox="0 0 100 100"`. Não é preferência estética — é o
 * que permite às estruturas de `vistas.ts` guardarem coordenadas em
 * porcentagem e o marcador cair exatamente sobre o cabo do martelo, sem que o
 * dado precise saber nada sobre o tamanho em que a figura vai ser exibida. O
 * dado fala em porcentagem, o SVG fala em porcentagem, e a caixa pode ter
 * qualquer tamanho.
 *
 * ## Por que não `<img>` de SVG externo
 *
 * Um SVG servido como arquivo não recebe parâmetro, não anima com CSS do
 * documento hospedeiro e não responde ao tema. Inline, o mesmo desenho aceita
 * `bilirrubina={12}`, escurece junto com o resto da página e permite que o
 * marcador de estrutura seja um elemento real, focável pelo teclado.
 *
 * ## Sobre cor e tema
 *
 * Tecido não muda de cor porque o aluno ligou o modo escuro — uma esclera
 * ictérica é amarela nos dois temas, e alterar isso destruiria justamente o que
 * a figura ensina. O que se adapta é a **moldura**: fundo, legenda, régua e
 * traço de anotação usam token do tema; o tecido, não. `corDeTecido` existe
 * para tornar essa fronteira explícita no código, e não acidental.
 */

import type { ReactNode } from 'react'

export interface PropsDeIlustracao {
  params?: Record<string, number | string | boolean | undefined>
  className?: string
  /** Descrição para leitor de tela. Sem ela, a figura é decorativa. */
  titulo?: string
  /** Marcadores de estrutura sobrepostos (posições em 0–100). */
  marcadores?: ReactNode
}

/** Interpola dois números. `t` fora de 0–1 é grampeado. */
export function entre(a: number, b: number, t: number): number {
  const k = Math.min(1, Math.max(0, t))
  return a + (b - a) * k
}

/** Lê um parâmetro numérico com padrão, tolerando string vinda do dado. */
export function num(
  params: PropsDeIlustracao['params'],
  chave: string,
  padrao: number,
): number {
  const valor = params?.[chave]
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor
  if (typeof valor === 'string') {
    const convertido = Number(valor)
    if (Number.isFinite(convertido)) return convertido
  }
  return padrao
}

/** Lê um parâmetro de texto com padrão. */
export function txt(params: PropsDeIlustracao['params'], chave: string, padrao: string): string {
  const valor = params?.[chave]
  return typeof valor === 'string' && valor ? valor : padrao
}

/**
 * Cor de tecido — nunca muda com o tema.
 *
 * Envolver os literais numa função é o que impede alguém, meses depois, de
 * trocar `#c8a24a` por `var(--muted-foreground)` "para ficar consistente" e
 * apagar a informação clínica no modo escuro.
 */
export function corDeTecido(cor: string): string {
  return cor
}

/** Moldura padrão: caixa quadrada, fundo do tema, recorte arredondado. */
export function Quadro({
  children,
  className = '',
  titulo,
  marcadores,
  fundo = 'transparent',
}: {
  children: ReactNode
  className?: string
  titulo?: string
  marcadores?: ReactNode
  fundo?: string
}) {
  return (
    <div className={`relative aspect-square w-full overflow-hidden rounded-xl ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        role={titulo ? 'img' : 'presentation'}
        aria-label={titulo}
        aria-hidden={titulo ? undefined : true}
      >
        {fundo !== 'transparent' && <rect x="0" y="0" width="100" height="100" fill={fundo} />}
        {children}
      </svg>
      {marcadores}
    </div>
  )
}

/**
 * Ruído sutil de textura.
 *
 * Um desenho vetorial perfeitamente liso lê como ícone, não como tecido. Uma
 * camada de `feTurbulence` com opacidade baixa quebra a chapa sem custar
 * imagem nenhuma e sem inventar detalhe que não existe.
 */
export function Textura({ id, escala = 0.9, opacidade = 0.18 }: { id: string; escala?: number; opacidade?: number }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency={escala} numOctaves={3} seed={7} result="ruido" />
      <feColorMatrix
        in="ruido"
        type="matrix"
        values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacidade} 0`}
        result="ruidoSuave"
      />
      <feComposite in="ruidoSuave" in2="SourceGraphic" operator="atop" />
    </filter>
  )
}

/** Vinheta escura nas bordas — o que o espéculo e o oftalmoscópio produzem. */
export function Vinheta({ id, dureza = 0.62 }: { id: string; dureza?: number }) {
  return (
    <radialGradient id={id} cx="50%" cy="50%" r="58%">
      <stop offset="0%" stopColor="#000" stopOpacity="0" />
      <stop offset={`${dureza * 100}%`} stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
    </radialGradient>
  )
}
