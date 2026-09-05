'use client'

import { useEffect, useState } from 'react'
import { DoorOpen, Flag, Lock, PlayCircle } from 'lucide-react'
import {
  indiceDoProximoMarco,
  marcosDaJanela,
  type FaseDaProva,
  type JanelaDaProva,
} from '@/lib/provas/janela-da-prova'
import { cn } from '@/lib/utils'

/**
 * O portão da prova.
 *
 * ## O que ele era
 *
 * Uma lista de quatro datas com uma bolinha ao lado de cada uma. A informação
 * estava correta e a imagem não existia: "portão" é uma metáfora física, e o
 * aluno lia uma tabela.
 *
 * Agora é um portão desenhado — duas folhas gradeadas que se encostam no meio
 * quando está fechado e se recolhem contra os postes quando abre, com o
 * cadeado sumindo junto. O estado da prova vira uma coisa que se entende antes
 * de ler qualquer palavra.
 *
 * ## O que a metáfora precisou acertar
 *
 * O portão limita a CHEGADA, não o começo. Quem entrou antes de ele fechar
 * está dentro — e para essa pessoa o portão continua aberto no desenho, com
 * uma faixa dizendo que ela entrou a tempo. Desenhar um portão fechado para
 * quem está do lado de dentro seria mentir com precisão.
 *
 * ## O relógio
 *
 * Cada fase tem UM próximo marco, e é ele que interessa. "Faltam 8 minutos
 * para o portão fechar" muda o que a pessoa faz nos próximos minutos; quatro
 * datas absolutas não mudam nada. A contagem corre no cliente, mas os marcos
 * vêm do relógio do servidor (`resolverJanelaDaProva`).
 */

type Aparencia = {
  titulo: string
  Icone: typeof Lock
  /** Canal RGB cru, para as variáveis CSS do portão. */
  rgb: string
  texto: string
  aberto: boolean
}

function aparenciaDaFase(fase: FaseDaProva, jaEntrou: boolean): Aparencia {
  switch (fase) {
    case 'antes-do-portao':
      return {
        titulo: 'Portões fechados',
        Icone: Lock,
        rgb: '100 116 139',
        texto: 'text-slate-600 dark:text-slate-300',
        aberto: false,
      }
    case 'sala-de-espera':
      return {
        titulo: 'Portões abertos',
        Icone: DoorOpen,
        rgb: '59 130 246',
        texto: 'text-blue-600 dark:text-blue-400',
        aberto: true,
      }
    case 'em-andamento':
      return {
        titulo: jaEntrou ? 'Você está dentro' : 'Prova em andamento',
        Icone: PlayCircle,
        rgb: '16 185 129',
        texto: 'text-emerald-600 dark:text-emerald-400',
        aberto: true,
      }
    case 'portao-fechado':
      return {
        titulo: 'Portões fechados',
        Icone: Lock,
        rgb: '245 158 11',
        texto: 'text-amber-600 dark:text-amber-400',
        aberto: false,
      }
    case 'encerrada':
      return {
        titulo: 'Prova encerrada',
        Icone: Flag,
        rgb: '244 63 94',
        texto: 'text-rose-600 dark:text-rose-400',
        aberto: false,
      }
    default:
      return {
        titulo: 'Disponível',
        Icone: DoorOpen,
        rgb: '16 185 129',
        texto: 'text-emerald-600 dark:text-emerald-400',
        aberto: true,
      }
  }
}

/** O marco que ainda vai acontecer — o único que muda o que a pessoa faz agora. */
function proximoMarco(janela: JanelaDaProva): { rotulo: string; quando: Date } | null {
  const alvo = (valor: Date | string | null | undefined) => {
    if (!valor) return null
    const d = new Date(valor)
    return Number.isFinite(d.getTime()) ? d : null
  }

  switch (janela.fase) {
    case 'antes-do-portao': {
      const d = alvo(janela.abrePortaoEm)
      return d ? { rotulo: 'Os portões abrem em', quando: d } : null
    }
    case 'sala-de-espera': {
      const d = alvo(janela.comecaEm)
      return d ? { rotulo: 'A prova começa em', quando: d } : null
    }
    case 'em-andamento':
    case 'portao-fechado': {
      const d = alvo(janela.terminaEm)
      return d ? { rotulo: 'A prova termina em', quando: d } : null
    }
    default:
      return null
  }
}

/** Segundos em `1:04:09` / `4:09` — o formato de cronômetro, não de duração. */
function contagem(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const dois = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${dois(m)}:${dois(s)}` : `${m}:${dois(s)}`
}

/** Só o relógio (`13:50`) — para citar um horário no meio de uma frase. */
function apenasHora(data: Date | string | null): string {
  if (!data) return '—'
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function hora(data: Date | string | null): string {
  if (!data) return '—'
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** O portão desenhado. */
function Portao({ aberto, rgb, Icone }: { aberto: boolean; rgb: string; Icone: typeof Lock }) {
  return (
    <div
      className="exam-portao"
      data-aberto={aberto ? 'true' : 'false'}
      style={{ ['--portao-cor' as string]: rgb }}
      aria-hidden
    >
      <div className="exam-portao-vao" />
      {aberto && <div className="exam-portao-convite" />}
      <div className="exam-portao-chao" />
      <div className="exam-portao-folha" data-lado="esquerdo" />
      <div className="exam-portao-folha" data-lado="direito" />
      <div className="exam-portao-poste" data-lado="esquerdo" />
      <div className="exam-portao-poste" data-lado="direito" />
      <div className="exam-portao-cadeado">
        <Icone className="h-3.5 w-3.5" />
      </div>
    </div>
  )
}

export function ExamGateStatus({
  janela,
  className,
  compacto = false,
}: {
  janela: JanelaDaProva
  className?: string
  compacto?: boolean
}) {
  const [agora, setAgora] = useState(() => Date.now())

  // O relógio só corre quando há um marco à frente: numa prova encerrada, um
  // `setInterval` de 1s é uma aba consumindo bateria para não mudar nada.
  const marco = proximoMarco(janela)
  const alvoEmMs = marco ? marco.quando.getTime() : null
  useEffect(() => {
    if (alvoEmMs === null) return
    const relogio = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(relogio)
  }, [alvoEmMs])

  if (janela.fase === 'livre') return null

  const { titulo, Icone, rgb, texto, aberto } = aparenciaDaFase(janela.fase, janela.jaEntrou)
  const restante = marco ? new Date(marco.quando).getTime() - agora : 0

  if (compacto) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5',
          className,
        )}
      >
        <Icone className={cn('h-3.5 w-3.5', texto)} />
        <span className={cn('text-xs font-semibold', texto)}>{titulo}</span>
        {marco && restante > 0 && (
          <span className="exam-portao-relogio text-xs text-muted-foreground">{contagem(restante)}</span>
        )}
      </div>
    )
  }

  // A linha do tempo, ordenada pelo relógio e com cada marco respondendo pelo
  // próprio horário — ver `marcosDaJanela` em lib/provas/janela-da-prova.ts.
  const marcos = marcosDaJanela(janela, new Date(agora))
  const indiceDoProximo = indiceDoProximoMarco(marcos)

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border/60 bg-muted/25', className)}>
      <div className="p-4">
        <Portao aberto={aberto} rgb={rgb} Icone={Icone} />

        <div className="mt-3.5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className={cn('text-base font-bold leading-tight', texto)}>{titulo}</p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {janela.motivo ?? descricaoDaFase(janela, apenasHora(janela.fechaPortaoEm))}
            </p>
          </div>

          {marco && restante > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {marco.rotulo}
              </p>
              <p className={cn('exam-portao-relogio text-2xl font-black leading-none', texto)}>
                {contagem(restante)}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* A linha do tempo, agora como rodapé do portão e não como o cartão inteiro. */}
      <ol
        className="grid grid-cols-2 gap-x-4 border-t border-border/50 bg-background/40 px-4 py-3 sm:grid-cols-4"
        // A cor da fase desce para o rodapé: o ponto do próximo marco pulsa na
        // mesma cor do portão, em vez de um verde fixo discordando de um
        // cartão âmbar.
        style={{ ['--portao-cor' as string]: rgb }}
      >
        {marcos.map((m, i) => {
          const jaPassou = m.jaPassou
          const eOProximo = i === indiceDoProximo
          return (
            <li key={m.rotulo} className="flex items-center gap-2 py-0.5">
              <span
                className={cn(
                  'h-1.5 w-1.5 flex-shrink-0 rounded-full',
                  eOProximo
                    ? 'exam-marco-pulsa'
                    : jaPassou
                      ? 'bg-[rgb(var(--portao-cor)/0.45)]'
                      : 'bg-border',
                )}
                aria-hidden
              />
              <span className="min-w-0">
                <span
                  className={cn(
                    'block text-[10px] uppercase tracking-wide',
                    jaPassou ? 'text-muted-foreground' : 'font-semibold text-foreground',
                  )}
                >
                  {m.rotulo}
                </span>
                <span className="block text-[11px] tabular-nums text-muted-foreground">
                  {hora(m.quando)}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/**
 * UMA frase, e só uma.
 *
 * O cartão dizia a mesma coisa três vezes empilhadas: o título ("Você está
 * dentro"), a descrição ("Você entrou dentro do horário e pode iniciar a
 * prova.") e um selo verde ("Você passou pelo portão. Fechar o portão vale
 * para quem ainda não entrou…"). Três camadas para uma informação — e a
 * terceira só existia porque a segunda não contava a parte que interessa.
 *
 * A parte que interessa é a contradição aparente: o portão fechou E você está
 * dentro. Quando ela existe, a frase a resolve, com o horário; quando não
 * existe, a frase diz o que fazer agora e o selo não tem por que aparecer.
 */
function descricaoDaFase(janela: JanelaDaProva, horaDoFechamento: string): string {
  const portaoAberto = janela.podeEntrar

  switch (janela.fase) {
    case 'sala-de-espera':
      return janela.jaEntrou
        ? 'Você está na sala. A prova abre no horário marcado.'
        : 'Você já pode entrar e esperar. A prova abre no horário marcado.'
    case 'em-andamento':
      if (janela.jaEntrou && !portaoAberto) {
        return `Os portões fecharam às ${horaDoFechamento} para quem ainda não tinha entrado. Você entrou a tempo — sua prova segue normalmente.`
      }
      return janela.jaEntrou
        ? 'Você já pode iniciar a prova.'
        : 'A prova está acontecendo e os portões ainda estão abertos.'
    default:
      return ''
  }
}
