'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Copy,
  Cpu,
  Home,
  Lock,
  type LucideIcon,
  MonitorSmartphone,
  Puzzle,
  RadioTower,
  RefreshCw,
  Server,
  ShieldOff,
  Signal,
  HardDrive,
  Hourglass,
  WifiOff,
} from 'lucide-react'

import {
  descreverAparelho,
  descreverConexao,
  diagnosticar,
  gerarCodigoDeErro,
  type Diagnostico,
  type EntradaDeDiagnostico,
  type IconeDeErro,
} from '@/lib/erros/diagnostico'

const ICONES: Record<IconeDeErro, LucideIcon> = {
  'sem-sinal': WifiOff,
  antena: RadioTower,
  atualizar: RefreshCw,
  cadeado: Lock,
  bloqueado: ShieldOff,
  bussola: Compass,
  ampulheta: Hourglass,
  servidor: Server,
  disco: HardDrive,
  chip: Cpu,
  'quebra-cabeca': Puzzle,
  alerta: AlertTriangle,
}

interface SinaisDoAparelho {
  online: boolean
  conexao: string
  aparelho: string
  instalado: boolean
  endereco: string
  horario: string
}

export interface TelaDeErroProps {
  /** Dados crus do erro. A classificação acontece aqui dentro. */
  entrada?: EntradaDeDiagnostico
  /** `reset()` da fronteira de erro do Next, quando existir. */
  aoTentarNovamente?: () => void
  /** Sobrescreve o diagnóstico — usado pela tela de 404, que já sabe a causa. */
  diagnosticoFixo?: Diagnostico
  /** Esconde o painel técnico (o 404 não tem nada de técnico a mostrar). */
  ocultarDetalhes?: boolean
}

/**
 * A tela que o usuário vê quando alguma coisa quebra.
 *
 * Três decisões que valem o comentário:
 *
 * 1. O diagnóstico é refeito depois da montagem. No servidor não existe
 *    `navigator.onLine`, então a primeira renderização classifica sem esse
 *    sinal; assim que o componente monta, a gente reclassifica sabendo se há
 *    rede. É por isso que quem está sem internet vê "Você está sem internet" e
 *    não uma mensagem genérica — mesmo que o erro original tenha sido outro.
 *
 * 2. Sem rede, a tela espera o sinal voltar sozinha (`online`) e recarrega. A
 *    pessoa não precisa adivinhar quando tentar de novo.
 *
 * 3. "Copiar detalhes" existe para o suporte. É o substituto honesto do "veja o
 *    console do navegador": ninguém abre o console, mas todo mundo sabe colar.
 */
export function TelaDeErro({
  entrada,
  aoTentarNovamente,
  diagnosticoFixo,
  ocultarDetalhes = false,
}: TelaDeErroProps) {
  const [sinais, setSinais] = useState<SinaisDoAparelho | null>(null)
  const [detalhesAbertos, setDetalhesAbertos] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [reconectou, setReconectou] = useState(false)

  useEffect(() => {
    const ler = () =>
      setSinais({
        online: navigator.onLine,
        conexao: descreverConexao(
          (navigator as Navigator & { connection?: { effectiveType?: string } })
            .connection?.effectiveType,
          navigator.onLine,
        ),
        aparelho: descreverAparelho(navigator.userAgent),
        instalado:
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
        endereco: window.location.pathname + window.location.search,
        horario: new Date().toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
      })

    ler()

    // Voltou o sinal: recarrega sozinho. Sem isto, quem ficou sem internet no
    // ônibus continuaria olhando para uma tela morta depois do sinal voltar.
    const voltou = () => {
      setReconectou(true)
      window.setTimeout(() => window.location.reload(), 900)
    }
    const caiu = () => ler()
    window.addEventListener('online', voltou)
    window.addEventListener('offline', caiu)
    return () => {
      window.removeEventListener('online', voltou)
      window.removeEventListener('offline', caiu)
    }
  }, [])

  const diagnostico = useMemo(() => {
    if (diagnosticoFixo) return diagnosticoFixo
    return diagnosticar({ ...entrada, online: sinais?.online })
  }, [diagnosticoFixo, entrada, sinais?.online])

  const codigo = useMemo(() => gerarCodigoDeErro(entrada ?? {}), [entrada])
  const Icone = ICONES[diagnostico.icone]

  const copiarDetalhes = useCallback(async () => {
    const relatorio = [
      `DomineAqui — relatório de erro`,
      `Código: ${codigo}`,
      `Categoria: ${diagnostico.categoria}`,
      `Título: ${diagnostico.titulo}`,
      `Página: ${sinais?.endereco ?? '—'}`,
      `Quando: ${sinais?.horario ?? '—'}`,
      `Aparelho: ${sinais?.aparelho ?? '—'}`,
      `Conexão: ${sinais?.conexao ?? '—'}`,
      `Modo: ${sinais?.instalado ? 'App instalado' : 'Navegador'}`,
      `Identificador técnico: ${entrada?.digest ?? '—'}`,
      `Erro: ${entrada?.nome ?? '—'}: ${entrada?.mensagem ?? '—'}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(relatorio)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2200)
    } catch {
      // Clipboard bloqueado (contexto inseguro, permissão negada): abrimos os
      // detalhes para a pessoa selecionar o texto na mão. Falhar em silêncio
      // seria transformar o botão em enfeite.
      setDetalhesAbertos(true)
    }
  }, [codigo, diagnostico.categoria, diagnostico.titulo, entrada, sinais])

  const critico = diagnostico.gravidade === 'erro'

  return (
    <main className="relative flex min-h-[70svh] flex-1 items-center justify-center overflow-hidden px-5 py-14">
      {/* Fundo: um halo suave atrás do cartão. Puramente decorativo — mantém a
          tela com cara de DomineAqui em vez de página de erro do navegador. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(60rem 32rem at 50% -10%, hsl(var(--primary) / 0.14), transparent 65%), radial-gradient(40rem 24rem at 100% 100%, hsl(var(--accent) / 0.10), transparent 60%)',
        }}
      />

      <div className="w-full max-w-xl">
        <div className="rounded-3xl border border-border/70 bg-card/85 p-7 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div
              className={[
                'flex h-16 w-16 items-center justify-center rounded-2xl ring-1',
                critico
                  ? 'bg-destructive/10 text-destructive ring-destructive/25'
                  : 'bg-primary/10 text-primary ring-primary/25',
              ].join(' ')}
            >
              <Icone className="h-8 w-8" strokeWidth={1.9} aria-hidden />
            </div>

            <p className="mt-5 font-clinical text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
              {diagnostico.fator}
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {diagnostico.titulo}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {diagnostico.resumo}
            </p>
          </div>

          {reconectou && (
            <p
              role="status"
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary"
            >
              <Signal className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              Conexão de volta — recarregando…
            </p>
          )}

          {/* O que fazer. Numerado porque a ordem é do que resolve mais para o
              que resolve menos. */}
          <ol className="mt-7 space-y-3">
            {diagnostico.passos.map((passo, indice) => (
              <li key={passo} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-clinical text-[0.65rem] font-semibold text-muted-foreground">
                  {indice + 1}
                </span>
                <span>{passo}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            {aoTentarNovamente && diagnostico.tentarNovamenteResolve && (
              <button
                type="button"
                onClick={aoTentarNovamente}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground transition active:scale-[0.97]"
              >
                <RefreshCw className="h-4 w-4" strokeWidth={2.6} aria-hidden />
                Tentar de novo
              </button>
            )}

            {diagnostico.recarregarResolve && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={[
                  'inline-flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-bold transition active:scale-[0.97]',
                  aoTentarNovamente && diagnostico.tentarNovamenteResolve
                    ? 'border border-border bg-background text-foreground hover:bg-muted'
                    : 'bg-primary text-primary-foreground',
                ].join(' ')}
              >
                <RefreshCw className="h-4 w-4" strokeWidth={2.6} aria-hidden />
                Recarregar página
              </button>
            )}

            <Link
              href="/"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground transition hover:bg-muted active:scale-[0.97]"
            >
              <Home className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              Ir para o início
            </Link>
          </div>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
            Voltar para a página anterior
          </button>
        </div>

        {!ocultarDetalhes && (
          <div className="mt-4 rounded-2xl border border-border/70 bg-card/60 px-5 py-4">
            {/* Os "fatores associados": o estado real do aparelho na hora do
                erro. É o que permite alguém entender sozinho que o problema é a
                internet dele, e o que o suporte pergunta antes de qualquer
                outra coisa. */}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              <Fator
                icone={sinais?.online === false ? WifiOff : Signal}
                rotulo="Conexão"
                valor={sinais?.conexao ?? 'Verificando…'}
                alerta={sinais?.online === false}
              />
              <Fator
                icone={MonitorSmartphone}
                rotulo="Aparelho"
                valor={
                  sinais
                    ? `${sinais.aparelho}${sinais.instalado ? ' · app instalado' : ''}`
                    : 'Verificando…'
                }
              />
              <Fator icone={Clock} rotulo="Quando" valor={sinais?.horario ?? '—'} />
              <Fator icone={AlertTriangle} rotulo="Código do erro" valor={codigo} mono />
            </dl>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={copiarDetalhes}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-muted px-3 text-xs font-semibold text-foreground transition hover:bg-muted/70 active:scale-[0.97]"
              >
                {copiado ? (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                    Copiar detalhes para o suporte
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDetalhesAbertos((aberto) => !aberto)}
                aria-expanded={detalhesAbertos}
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                Detalhes técnicos
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${detalhesAbertos ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
            </div>

            {detalhesAbertos && (
              <pre className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-muted/60 p-3 font-clinical text-[0.7rem] leading-relaxed text-muted-foreground">
{`Código: ${codigo}
Categoria: ${diagnostico.categoria}
Página: ${sinais?.endereco ?? '—'}
Identificador técnico: ${entrada?.digest ?? '—'}
Erro: ${entrada?.nome ?? '—'}: ${entrada?.mensagem ?? '—'}`}
              </pre>
            )}
          </div>
        )}

        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
          Continua acontecendo? Fale com a gente em{' '}
          <a
            href="mailto:contato@domineaqui.com.br"
            className="font-semibold text-foreground underline underline-offset-2"
          >
            contato@domineaqui.com.br
          </a>
          {/* O código só aparece onde ele significa alguma coisa. No 404 não
              houve exceção nenhuma para identificar, e mandar a pessoa citar
              um "DA-0000-00" ao suporte seria ruído com cara de informação. */}
          {ocultarDetalhes ? '.' : (
            <>
              {' '}
              com o código <span className="font-clinical">{codigo}</span>.
            </>
          )}
        </p>
      </div>
    </main>
  )
}

function Fator({
  icone: Icone,
  rotulo,
  valor,
  alerta = false,
  mono = false,
}: {
  icone: LucideIcon
  rotulo: string
  valor: string
  alerta?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icone
        className={`mt-0.5 h-4 w-4 shrink-0 ${alerta ? 'text-destructive' : 'text-muted-foreground'}`}
        strokeWidth={2}
        aria-hidden
      />
      <div className="min-w-0">
        <dt className="text-[0.68rem] uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </dt>
        <dd
          className={`truncate text-sm font-medium ${alerta ? 'text-destructive' : 'text-foreground'} ${mono ? 'font-clinical' : ''}`}
          title={valor}
        >
          {valor}
        </dd>
      </div>
    </div>
  )
}
