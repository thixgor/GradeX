'use client'

/**
 * "Pedir monitoria": o aluno diz o que precisa em poucos toques e os monitores
 * da matéria vêm até ele. Feito para o celular: quase tudo é escolha (chips),
 * só a matéria pede texto (e mesmo ela tem atalhos), e o botão fica preso no
 * rodapé, ao alcance do polegar.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Loader2, Minus, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BarraInferior } from '@/components/ui/barra-inferior'
import { cn } from '@/lib/utils'
import { api, CaixaErro, ErroApi } from './base'
import { irParaLogin } from './agendador'
import { formatarCentavos, interpretarValorEmReais } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import {
  DURACOES_DEMANDA,
  MATERIAS_COMUNS,
  MAX_PESSOAS_DEMANDA,
  PERIODOS_DEMANDA,
  QUANDO_DEMANDA,
  VALORES_SUGERIDOS_CENTAVOS,
  chaveDaMateria,
  type PeriodoDemanda,
  type QuandoDemanda,
} from '@/lib/monitorias/demandas-regras'

const RASCUNHO = 'mon-pedido-rascunho'

interface Estado {
  materia: string
  assunto: string
  pessoas: number
  /** 'propor' = o monitor propõe; 'outro' = digitado. */
  valor: number | 'propor' | 'outro'
  valorOutro: string
  duracaoMin: number
  quando: QuandoDemanda
  periodos: PeriodoDemanda[]
}

const INICIAL: Estado = {
  materia: '',
  assunto: '',
  pessoas: 1,
  valor: 'propor',
  valorOutro: '',
  duracaoMin: 60,
  quando: 'esta_semana',
  periodos: [],
}

export function FormularioDemanda() {
  const busca = useSearchParams()
  const reduzir = useReducedMotion()
  const [f, setF] = useState<Estado>(() => ({ ...INICIAL, materia: (busca?.get('materia') || '').slice(0, 60) }))
  const [materiasVitrine, setMateriasVitrine] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState<{ avisados: number; materia: string } | null>(null)
  const set = <K extends keyof Estado>(k: K, v: Estado[K]) => setF((x) => ({ ...x, [k]: v }))

  // Volta do login: o que a pessoa já tinha escolhido continua lá.
  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(RASCUNHO)
      if (salvo) {
        sessionStorage.removeItem(RASCUNHO)
        setF({ ...INICIAL, ...JSON.parse(salvo) })
      }
    } catch {}
  }, [])

  // Atalhos de matéria: as que já têm monitor primeiro, depois as comuns.
  useEffect(() => {
    api<{ materias: string[] }>('/api/monitorias/publico/vitrine')
      .then((r) => setMateriasVitrine(r.materias || []))
      .catch(() => {})
  }, [])
  const atalhos = useMemo(() => {
    const vistos = new Set<string>()
    return [...materiasVitrine, ...MATERIAS_COMUNS].filter((m) => {
      const k = chaveDaMateria(m)
      return vistos.has(k) ? false : (vistos.add(k), true)
    }).slice(0, 12)
  }, [materiasVitrine])

  const valorCentavos = f.valor === 'propor' ? null : f.valor === 'outro' ? interpretarValorEmReais(f.valorOutro) : f.valor
  const valorInvalido = f.valor === 'outro' && (valorCentavos === null || valorCentavos < 1000)
  const pronto = f.materia.trim().length >= 2 && !valorInvalido

  async function publicar() {
    if (!pronto) {
      setErro(f.materia.trim().length < 2 ? 'Diga a matéria.' : 'Valor mínimo: R$ 10,00.')
      return
    }
    setErro('')
    setEnviando(true)
    try {
      const r = await api<{ id: string; avisados: number }>('/api/monitorias/demandas', {
        method: 'POST',
        json: {
          materia: f.materia.trim(),
          assunto: f.assunto.trim(),
          pessoas: f.pessoas,
          valorPorPessoaCentavos: valorCentavos,
          duracaoMin: f.duracaoMin,
          quando: f.quando,
          periodos: f.periodos,
        },
      })
      setFeito({ avisados: r.avisados, materia: f.materia.trim() })
      window.scrollTo({ top: 0, behavior: reduzir ? 'auto' : 'smooth' })
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401) {
        try {
          sessionStorage.setItem(RASCUNHO, JSON.stringify(f))
        } catch {}
        return irParaLogin()
      }
      setErro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  if (feito) {
    return (
      <motion.div
        initial={reduzir ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-6 text-center sm:p-8"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Check className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-heading text-2xl font-semibold">Pedido publicado</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {feito.avisados > 0
            ? `Avisamos ${feito.avisados} ${feito.avisados === 1 ? 'monitor' : 'monitores'} de ${feito.materia}. Quando alguém responder, você recebe um aviso e conversa pelo chat.`
            : `Seu pedido de ${feito.materia} já está no mural dos monitores. Quando alguém responder, você recebe um aviso e conversa pelo chat.`}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">Você só paga se aceitar uma proposta.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/monitorias/minhas#pedidos"><Button className="w-full rounded-xl sm:w-auto">Ver meus pedidos</Button></Link>
          <Link href="/monitorias"><Button variant="outline" className="w-full rounded-xl sm:w-auto">Explorar monitores</Button></Link>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7 pb-28">
      <Bloco titulo="Qual matéria?">
        <input
          value={f.materia}
          onChange={(e) => set('materia', e.target.value.slice(0, 60))}
          placeholder="Ex.: Fisiologia"
          aria-label="Matéria"
          className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
        />
        <div className="mt-2.5 flex flex-wrap gap-2">
          {atalhos.map((m) => (
            <Opcao key={m} ativa={chaveDaMateria(m) === chaveDaMateria(f.materia)} onClick={() => set('materia', m)}>{m}</Opcao>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Algum assunto?" dica="Opcional">
        <input
          value={f.assunto}
          onChange={(e) => set('assunto', e.target.value.slice(0, 120))}
          placeholder="Ex.: ECG, ciclo cardíaco, prova da semana que vem"
          aria-label="Assunto"
          className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
        />
      </Bloco>

      <Bloco titulo="Para quantas pessoas?" dica={f.pessoas > 1 ? 'Em grupo sai mais barato para cada um' : undefined}>
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <Opcao key={n} ativa={f.pessoas === n} onClick={() => set('pessoas', n)}>{n === 1 ? 'Só eu' : n}</Opcao>
          ))}
          <Opcao ativa={f.pessoas >= 5} onClick={() => set('pessoas', Math.max(5, f.pessoas))}>5+</Opcao>
          {f.pessoas >= 5 && (
            <span className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1">
              <BotaoPasso rotulo="Menos uma pessoa" onClick={() => set('pessoas', Math.max(5, f.pessoas - 1))}><Minus className="h-4 w-4" /></BotaoPasso>
              <span className="w-8 text-center font-semibold tabular-nums">{f.pessoas}</span>
              <BotaoPasso rotulo="Mais uma pessoa" onClick={() => set('pessoas', Math.min(MAX_PESSOAS_DEMANDA, f.pessoas + 1))}><Plus className="h-4 w-4" /></BotaoPasso>
            </span>
          )}
        </div>
      </Bloco>

      <Bloco titulo={f.pessoas > 1 ? 'Quanto cada um topa pagar?' : 'Quanto você topa pagar?'} dica="Pela aula inteira">
        <div className="flex flex-wrap gap-2">
          <Opcao ativa={f.valor === 'propor'} onClick={() => set('valor', 'propor')}>O monitor propõe</Opcao>
          {VALORES_SUGERIDOS_CENTAVOS.map((v) => (
            <Opcao key={v} ativa={f.valor === v} onClick={() => set('valor', v)}>{formatarCentavos(v).replace(',00', '')}</Opcao>
          ))}
          <Opcao ativa={f.valor === 'outro'} onClick={() => set('valor', 'outro')}>Outro</Opcao>
        </div>
        {f.valor === 'outro' && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">R$</span>
            <input
              value={f.valorOutro}
              onChange={(e) => set('valorOutro', e.target.value.slice(0, 10))}
              inputMode="decimal"
              placeholder="45,00"
              aria-label="Valor por pessoa"
              autoFocus
              className={cn('h-12 w-32 rounded-xl border bg-background px-4 text-base', valorInvalido && f.valorOutro ? 'border-destructive' : 'border-border')}
            />
          </div>
        )}
      </Bloco>

      <Bloco titulo="Duração">
        <div className="flex flex-wrap gap-2">
          {DURACOES_DEMANDA.map((m) => (
            <Opcao key={m} ativa={f.duracaoMin === m} onClick={() => set('duracaoMin', m)}>{formatarDuracao(m)}</Opcao>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Para quando?">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(QUANDO_DEMANDA) as QuandoDemanda[]).map((q) => (
            <Opcao key={q} ativa={f.quando === q} onClick={() => set('quando', q)}>{QUANDO_DEMANDA[q]}</Opcao>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Melhor horário" dica="Opcional, pode marcar mais de um">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERIODOS_DEMANDA) as PeriodoDemanda[]).map((p) => {
            const ativa = f.periodos.includes(p)
            return (
              <Opcao key={p} ativa={ativa} onClick={() => set('periodos', ativa ? f.periodos.filter((x) => x !== p) : [...f.periodos, p])}>
                {PERIODOS_DEMANDA[p]}
              </Opcao>
            )
          })}
        </div>
      </Bloco>

      <p className="flex items-start gap-2.5 rounded-2xl bg-primary/[0.06] p-4 text-sm leading-relaxed text-foreground/85">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Pedir é grátis. Você conversa com quem responder e só paga se aceitar uma proposta, por PIX, com contrato e garantia DomineAqui.
      </p>
      {erro && <CaixaErro mensagem={erro} />}

      <BarraInferior>
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {f.materia.trim() ? (
              <>
                <span className="font-semibold text-foreground">{f.materia.trim()}</span>
                {' · '}
                {f.pessoas > 1 ? `${f.pessoas} pessoas` : 'Só eu'}
                {valorCentavos ? ` · até ${formatarCentavos(valorCentavos)}` : ''}
              </>
            ) : (
              'Escolha a matéria'
            )}
          </p>
          <Button onClick={publicar} disabled={enviando} className="h-12 shrink-0 rounded-xl px-5 text-base">
            {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Publicar pedido'}
          </Button>
        </div>
      </BarraInferior>
    </div>
  )
}

function Bloco({ titulo, dica, children }: { titulo: string; dica?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 flex flex-wrap items-baseline gap-x-2 text-[15px] font-semibold">
        {titulo}
        {dica && <span className="text-xs font-normal text-muted-foreground">{dica}</span>}
      </h2>
      {children}
    </section>
  )
}

function Opcao({ ativa, onClick, children }: { ativa: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativa}
      onClick={onClick}
      className={cn(
        'min-h-[44px] rounded-xl border px-4 text-sm font-medium transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        ativa ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/40',
      )}
    >
      {children}
    </button>
  )
}

function BotaoPasso({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={rotulo} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {children}
    </button>
  )
}
