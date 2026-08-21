'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion'
import { Check, Crown, Flame, Lock, Play, Star, Trophy, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A camada lúdica da Área de Ensino.
 *
 * DE ONDE VEM ESTE VOCABULÁRIO
 *
 * Uma plataforma de estudo compete com o cansaço de quem estuda depois do
 * plantão. A linguagem visual daqui — botões que afundam ao toque, nós que
 * estouram ao aparecer, o caminho que serpenteia para baixo — não é enfeite: é
 * o que faz a próxima aula parecer um passo curto em vez de mais uma linha numa
 * lista. É a mesma aposta que o Duolingo faz, adaptada ao verde-escuro do
 * Domine Aqui e a um conteúdo que é sério.
 *
 * O LIMITE QUE ESTA CAMADA RESPEITA
 *
 * Nada aqui inventa gamificação de mentira. Não há pontos que não significam
 * nada, nem vidas que impedem de estudar (§27: "não transformar a experiência
 * num jogo exagerado"). O que é celebrado é o que realmente aconteceu — aula
 * concluída, etapa fechada, Trilha terminada — e o progresso continua sendo o
 * mesmo número derivado de `aulas_progresso`.
 *
 * MOVIMENTO É OPCIONAL, SEMPRE
 *
 * Todo componente daqui consulta `prefers-reduced-motion`. Quem pediu ao
 * sistema para parar de mover as coisas recebe a mesma tela, estática. Animação
 * que ignora esse pedido não é caprichada — é desrespeitosa, e em quem tem
 * enxaqueca vestibular chega a ser incapacitante.
 */

/* =================== O BOTÃO 3D =================== */

/**
 * O botão que afunda.
 *
 * A sombra sólida embaixo (`shadow-[0_4px_0_...]`) desenha a "espessura" da
 * tecla; no toque, o botão desce os mesmos 4px e a sombra some. O corpo inteiro
 * do efeito são duas linhas de CSS, e ele dá o retorno tátil que um `hover:
 * opacity-90` nunca deu.
 *
 * A sombra é preta translúcida em vez de uma versão escura da cor: assim o
 * mesmo componente funciona no verde, no branco e no vermelho, nos dois temas,
 * sem uma paleta paralela de "cor escura de cada cor".
 */
export function BotaoDuo({
  children,
  onClick,
  href,
  tom = 'primario',
  tamanho = 'medio',
  className,
  disabled,
  type = 'button',
  ...resto
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  tom?: 'primario' | 'claro' | 'contorno' | 'perigo' | 'ouro'
  tamanho?: 'pequeno' | 'medio' | 'grande'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
  /** Só faz sentido com `href` — links externos precisam abrir em outra aba. */
  target?: string
  rel?: string
} & Omit<React.HTMLAttributes<HTMLElement>, 'onClick' | 'type'>) {
  const classe = cn(
    'group relative inline-flex select-none items-center justify-center gap-2 rounded-2xl font-extrabold uppercase tracking-wide',
    'transition-[transform,box-shadow,filter] duration-100 ease-out',
    // A tecla desce e a sombra some — os dois ao mesmo tempo, senão o botão
    // parece flutuar em vez de ser pressionado.
    'active:translate-y-[3px] active:shadow-none',
    'disabled:pointer-events-none disabled:opacity-50',
    tamanho === 'pequeno' && 'h-9 px-3.5 text-[11px]',
    tamanho === 'medio' && 'h-12 px-5 text-sm',
    tamanho === 'grande' && 'h-14 px-7 text-base',
    tom === 'primario' &&
      'bg-primary text-primary-foreground shadow-[0_3px_0_rgb(0_0_0/0.28)] hover:brightness-110',
    tom === 'ouro' &&
      'bg-accent text-accent-foreground shadow-[0_3px_0_rgb(0_0_0/0.24)] hover:brightness-105',
    tom === 'claro' &&
      'bg-card text-foreground shadow-[0_3px_0_rgb(0_0_0/0.16)] ring-2 ring-inset ring-border hover:bg-muted',
    tom === 'contorno' &&
      'bg-transparent text-muted-foreground shadow-none ring-2 ring-inset ring-border hover:text-foreground active:translate-y-0',
    tom === 'perigo' &&
      'bg-destructive text-destructive-foreground shadow-[0_3px_0_rgb(0_0_0/0.28)] hover:brightness-110',
    className,
  )

  if (href && !disabled) {
    return (
      <Link href={href} className={classe} {...(resto as any)}>
        {children}
      </Link>
    )
  }

  // Sem `href`, `target` e `rel` não têm significado em `<button>` — passá-los
  // adiante só produziria atributos inválidos no HTML.
  const { target: _alvo, rel: _rel, ...paraBotao } = resto as any

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classe} {...paraBotao}>
      {children}
    </button>
  )
}

/* =================== NÚMERO QUE CONTA =================== */

/**
 * O número que sobe de 0 até o valor.
 *
 * Só anima quando entra na tela, e uma vez só: um contador que reinicia a cada
 * rolagem vira ruído. Com movimento reduzido, aparece direto no valor final.
 */
export function NumeroAnimado({
  valor,
  sufixo = '',
  className,
  duracao = 0.9,
}: {
  valor: number
  sufixo?: string
  className?: string
  duracao?: number
}) {
  const alvo = Math.max(0, Math.round(Number(valor) || 0))
  const referencia = useRef<HTMLSpanElement>(null)
  const visivel = useInView(referencia, { once: true, margin: '-40px' })
  const semMovimento = useReducedMotion()
  const [atual, setAtual] = useState(semMovimento ? alvo : 0)

  useEffect(() => {
    if (semMovimento || !visivel) {
      setAtual(alvo)
      return
    }
    if (alvo === 0) return

    const inicio = performance.now()
    let quadro = 0

    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / (duracao * 1000))
      // Desaceleração cúbica: rápido no começo, suave no fim. É a curva que
      // faz o número "assentar" em vez de parar de repente.
      setAtual(Math.round(alvo * (1 - Math.pow(1 - t, 3))))
      if (t < 1) quadro = requestAnimationFrame(passo)
    }

    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [alvo, duracao, semMovimento, visivel])

  return (
    <span ref={referencia} className={cn('tabular-nums', className)}>
      {atual}
      {sufixo}
    </span>
  )
}

/* =================== ENTRADA EM CASCATA =================== */

/**
 * As variantes de entrada, compartilhadas.
 *
 * Ficam aqui e não em cada tela porque o efeito só funciona quando é o MESMO:
 * três telas com atrasos diferentes fazem a plataforma parecer montada por três
 * pessoas que não se falaram.
 */
export const cascata: Variants = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

export const item: Variants = {
  oculto: { opacity: 0, y: 14 },
  visivel: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 30 },
  },
}

/** Envolve uma seção para ela entrar em cascata quando aparecer. */
export function Cascata({
  children,
  className,
  as: Elemento = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: any
}) {
  const semMovimento = useReducedMotion()
  const Motion = motion[Elemento as 'div'] || motion.div

  if (semMovimento) return <Elemento className={className}>{children}</Elemento>

  return (
    <Motion
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, margin: '-60px' }}
      variants={cascata}
      className={className}
    >
      {children}
    </Motion>
  )
}

export function ItemDaCascata({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const semMovimento = useReducedMotion()
  if (semMovimento) return <div className={className}>{children}</div>
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

/* =================== O CAMINHO =================== */

export type EstadoDoNo = 'concluido' | 'atual' | 'disponivel' | 'bloqueado'

export interface NoDoCaminho {
  id: string
  titulo: string
  href: string
  estado: EstadoDoNo
  /** 0 a 100 — desenha o anel parcial em volta do nó em andamento. */
  percentual?: number
  /** Marca o último nó da etapa: ele ganha o troféu em vez do play. */
  fimDeEtapa?: boolean
  duracaoLabel?: string
  /** Rótulo curto sob o nó ("Resumo", "Complementar"). */
  etiqueta?: string
}

const ICONE_DO_ESTADO: Record<EstadoDoNo, LucideIcon> = {
  concluido: Check,
  atual: Play,
  disponivel: Star,
  bloqueado: Lock,
}

/**
 * Um nó do caminho.
 *
 * A LEITURA EM MEIO SEGUNDO
 *
 * O aluno precisa saber, sem ler nada: o que já fez (verde cheio com ✓), onde
 * está (anel pulsando e o balão "COMEÇAR"), o que pode fazer (contorno) e o que
 * está trancado (cinza com cadeado). Quatro estados, quatro desenhos
 * inconfundíveis — se dois deles se parecessem, o caminho perderia a única
 * função que tem.
 *
 * O nó também afunda ao toque, como o botão: é a mesma gramática, e ela ensina
 * que aquilo é clicável antes de qualquer instrução.
 */
export function NoDoCaminhoBotao({
  no,
  deslocamento,
  indice,
}: {
  no: NoDoCaminho
  deslocamento: number
  indice: number
}) {
  const semMovimento = useReducedMotion()
  const Icone = no.fimDeEtapa && no.estado !== 'bloqueado' ? Trophy : ICONE_DO_ESTADO[no.estado]
  const bloqueado = no.estado === 'bloqueado'

  const corpo = (
    <>
      {/* O anel de progresso do nó em andamento. Só aparece quando há o que
          mostrar — um anel a 0% é moldura vazia. */}
      {no.estado === 'atual' && (no.percentual || 0) > 0 ? (
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute -inset-2 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className="stroke-primary/20"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - (no.percentual || 0) / 100)}
            className="stroke-primary transition-[stroke-dashoffset] duration-700"
          />
        </svg>
      ) : null}

      <span
        className={cn(
          'relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full',
          'transition-[transform,box-shadow] duration-100 ease-out',
          'group-active:translate-y-[4px] group-active:shadow-none',
          no.estado === 'concluido' &&
            'bg-primary text-primary-foreground shadow-[0_5px_0_rgb(0_0_0/0.28)]',
          no.estado === 'atual' &&
            'bg-primary text-primary-foreground shadow-[0_5px_0_rgb(0_0_0/0.28)] ring-4 ring-primary/25',
          no.estado === 'disponivel' &&
            'bg-card text-primary shadow-[0_5px_0_rgb(0_0_0/0.14)] ring-[3px] ring-inset ring-primary/30',
          bloqueado &&
            'bg-muted text-muted-foreground/60 shadow-[0_4px_0_rgb(0_0_0/0.10)] group-active:translate-y-0 group-active:shadow-[0_4px_0_rgb(0_0_0/0.10)]',
        )}
      >
        <Icone
          className={cn('h-8 w-8', no.estado === 'atual' && 'ml-0.5')}
          strokeWidth={no.estado === 'concluido' ? 3.5 : 2.5}
          fill={no.estado === 'atual' ? 'currentColor' : 'none'}
        />

        {/* O brilho no topo: é ele que faz o círculo parecer uma peça física
            e não um disco chapado. */}
        {!bloqueado ? (
          <span className="pointer-events-none absolute inset-x-3 top-1.5 h-3 rounded-full bg-white/25 blur-[2px]" />
        ) : null}
      </span>
    </>
  )

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ transform: `translateX(${deslocamento}px)` }}
    >
      {/* O balão sobre o nó atual.
          Ele dizia "COMEÇAR"/"CONTINUAR" — a mesma ação do botão fixo no
          rodapé da Trilha, escrita duas vezes na mesma tela. Agora ele faz o
          que só ele pode fazer: dizer ONDE a pessoa está no caminho (§10). A
          ação continua sendo uma só, embaixo, e o toque no nó continua
          funcionando. */}
      {no.estado === 'atual' ? (
        <motion.div
          initial={semMovimento ? false : { opacity: 0, y: 6 }}
          animate={
            semMovimento
              ? {}
              : { opacity: 1, y: [0, -5, 0], transition: { y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.3 } } }
          }
          className="absolute -top-11 z-10 whitespace-nowrap"
        >
          <span className="relative block rounded-xl bg-card px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary shadow-[0_3px_0_rgb(0_0_0/0.14)] ring-2 ring-primary/30">
            Você está aqui
            <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-card ring-2 ring-primary/30 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
          </span>
        </motion.div>
      ) : null}

      <motion.div
        initial={semMovimento ? false : { scale: 0.4, opacity: 0 }}
        whileInView={semMovimento ? {} : { scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ type: 'spring', stiffness: 420, damping: 22, delay: Math.min(indice, 8) * 0.05 }}
      >
        {bloqueado ? (
          <div
            className="group relative cursor-not-allowed"
            title="Conclua as aulas anteriores para liberar"
            aria-disabled
          >
            {corpo}
          </div>
        ) : (
          <Link href={no.href} className="group relative block" aria-label={no.titulo}>
            {corpo}
          </Link>
        )}
      </motion.div>

      {/* `break-words`: o nó é deslocado lateralmente e tem largura máxima
          curta, então um título com uma palavra longa e sem espaço (um nome
          de fármaco, uma sigla composta) não teria onde quebrar e vazaria
          pela borda da tela no celular. */}
      <p
        className={cn(
          'mt-2 max-w-[10.5rem] break-words text-center text-[13px] font-bold leading-tight',
          bloqueado ? 'text-muted-foreground/70' : 'text-foreground',
        )}
      >
        {no.titulo}
      </p>

      {no.duracaoLabel || no.etiqueta ? (
        <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {[no.etiqueta, no.duracaoLabel].filter(Boolean).join(' · ')}
        </p>
      ) : null}
    </div>
  )
}

/**
 * O caminho serpenteante.
 *
 * POR QUE SERPENTEIA
 *
 * Uma coluna reta de círculos é uma lista com bolinhas. O desvio lateral é o
 * que transforma a lista em PERCURSO: o olho segue a curva e entende que existe
 * um antes e um depois, sem nenhuma legenda. A amplitude vem de um seno para
 * as curvas serem regulares — desvio aleatório parece defeito de renderização.
 *
 * No celular a amplitude cai pela metade: numa tela de 390px, o mesmo desvio do
 * desktop jogaria os nós contra a borda e cortaria os títulos.
 */
export function CaminhoDeNos({
  nos,
  className,
}: {
  nos: NoDoCaminho[]
  className?: string
}) {
  const [amplitude, setAmplitude] = useState(64)

  useEffect(() => {
    const medir = () => setAmplitude(window.innerWidth < 640 ? 42 : 76)
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  const deslocamentos = useMemo(
    () => nos.map((_, i) => Math.round(Math.sin(i * 0.85) * amplitude)),
    [nos, amplitude],
  )

  return (
    <div className={cn('relative flex flex-col items-center gap-7 py-4', className)}>
      {nos.map((no, i) => (
        <NoDoCaminhoBotao key={no.id} no={no} deslocamento={deslocamentos[i]} indice={i} />
      ))}
    </div>
  )
}

/* =================== CELEBRAÇÃO =================== */

/**
 * O confete da conclusão.
 *
 * Dura dois segundos e some sozinho. É CSS puro sobre `motion.span`, sem
 * biblioteca de partículas: trinta divs animadas custam menos que 40kB de
 * dependência, e o efeito de uma conclusão por semana não justifica mais que
 * isso.
 */
export function Confete({ ativo }: { ativo: boolean }) {
  const semMovimento = useReducedMotion()

  const pedacos = useMemo(
    () =>
      Array.from({ length: 34 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320,
        atraso: Math.random() * 0.35,
        giro: Math.random() * 720 - 360,
        cor: ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))'][i % 3],
        largura: 6 + Math.random() * 6,
        altura: 9 + Math.random() * 8,
      })),
    [],
  )

  if (!ativo || semMovimento) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center overflow-visible"
    >
      {pedacos.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
          animate={{ opacity: [1, 1, 0], y: 320, x: p.x, rotate: p.giro }}
          transition={{ duration: 1.9, delay: p.atraso, ease: [0.2, 0.6, 0.4, 1] }}
          style={{
            backgroundColor: p.cor,
            width: p.largura,
            height: p.altura,
            borderRadius: 2,
          }}
          className="absolute top-0"
        />
      ))}
    </div>
  )
}

/* =================== FICHAS DE ESTATÍSTICA =================== */

/**
 * A fileira de números do topo — aulas concluídas, horas, Trilhas.
 *
 * Números REAIS, e é isso que a separa da gamificação vazia: cada ficha é uma
 * contagem que sai do progresso do aluno. Não há moeda inventada nem pontuação
 * que não signifique nada.
 */
export function FichaDeEstatistica({
  valor,
  rotulo,
  icone: Icone,
  tom = 'primario',
  sufixo,
}: {
  valor: number
  rotulo: string
  icone: LucideIcon
  tom?: 'primario' | 'ouro' | 'fogo'
  sufixo?: string
}) {
  return (
    <div className="vidro-cartao vidro-reflexo flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5">
      <span
        className={cn(
          'flex h-9 w-9 flex-none items-center justify-center rounded-xl',
          tom === 'primario' && 'bg-primary/12 text-primary',
          tom === 'ouro' && 'bg-accent/20 text-accent-foreground',
          tom === 'fogo' && 'bg-secondary/15 text-secondary',
        )}
      >
        <Icone className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="min-w-0">
        <span className="block font-heading text-xl font-extrabold leading-none">
          <NumeroAnimado valor={valor} sufixo={sufixo} />
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </span>
      </span>
    </div>
  )
}

export { Crown, Flame }
