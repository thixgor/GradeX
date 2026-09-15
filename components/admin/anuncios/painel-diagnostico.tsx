'use client'

/**
 * "Por que o anúncio não está aparecendo?"
 *
 * A pergunta não tinha resposta na tela: o admin criava a peça, não via nada e
 * não tinha como saber se o problema era o anúncio, a conta, a rota ou o
 * próprio navegador. Os quatro casos são comuns e têm causas bem diferentes:
 *
 *  1. Nenhum anúncio ativo.
 *  2. O anúncio existe, mas a API pública não o entrega PARA ESTA CONTA — é o
 *     que acontece com segmentação por período.
 *  3. A rota não exibe anúncio (o painel do admin é uma delas, então quem
 *     testa sem sair de /admin nunca vê nada).
 *  4. O "ocultar por 30 minutos" ficou salvo neste navegador.
 *
 * O painel checa os quatro chamando a MESMA rota que o usuário final chama, com
 * a sessão de quem está olhando. É diagnóstico de verdade, não uma lista de
 * dicas genéricas.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  Loader2,
  MapPin,
  RefreshCw,
  Stethoscope,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  ANUNCIO_ROTAS_SEM_EXIBICAO,
  lerOcultacaoDeAnuncios,
  limparOcultacaoDeAnuncios,
} from '@/lib/anuncio-exibicao'
import { cn } from '@/lib/utils'

/** O mínimo que o diagnóstico precisa ler — a tela passa o anúncio inteiro. */
interface AnuncioResumo {
  _id: string
  ativo: boolean
  periodos?: number[]
}

interface PainelDiagnosticoProps<T extends AnuncioResumo> {
  anuncios: T[]
  /** Título legível de um anúncio, para citar quem ficou de fora. */
  tituloDe: (anuncio: T) => string
}

export function PainelDiagnostico<T extends AnuncioResumo>({
  anuncios,
  tituloDe,
}: PainelDiagnosticoProps<T>) {
  const [entreguesIds, setEntreguesIds] = useState<string[] | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ocultoAte, setOcultoAte] = useState(0)

  const verificar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    setOcultoAte(lerOcultacaoDeAnuncios())

    try {
      const res = await fetch('/api/anuncios', { cache: 'no-store' })
      if (!res.ok) throw new Error(`A rota publica respondeu ${res.status}`)

      const data = await res.json()
      const lista = Array.isArray(data?.anuncios) ? data.anuncios : []
      setEntreguesIds(lista.map((item: { _id: unknown }) => String(item._id)))
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao consultar a rota publica')
      setEntreguesIds(null)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    verificar()
  }, [verificar])

  const ativos = anuncios.filter((anuncio) => anuncio.ativo)
  const entregues = entreguesIds ?? []
  const naoEntregues = entreguesIds ? ativos.filter((anuncio) => !entregues.includes(anuncio._id)) : []

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-[#468152]/20 bg-white/55 shadow-sm backdrop-blur-xl dark:border-emerald-400/20 dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#468152]/20 bg-[#468152]/10 text-[#468152]">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Diagnostico de exibicao</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              O que a plataforma entrega agora, conferido pela mesma rota que o usuario final usa.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={verificar} disabled={carregando}>
            {carregando ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            Reverificar
          </Button>
          {/* O /admin nao exibe anuncio: sem este atalho, "ir ver se apareceu"
              exige lembrar de qual rota serve para o teste. */}
          <Button
            size="sm"
            className="bg-[#468152] text-white hover:bg-[#3b7045]"
            onClick={() => window.open('/dashboard', '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            Abrir a dashboard
          </Button>
        </div>
      </div>

      <div className="space-y-2.5 p-4">
        <Checagem
          estado={ativos.length > 0 ? 'ok' : 'erro'}
          titulo={`${ativos.length} anuncio(s) ativo(s) de ${anuncios.length}`}
          detalhe={
            ativos.length > 0
              ? 'Anuncio inativo fica salvo, mas fora da rotacao.'
              : 'Nenhum anuncio ativo: nada aparece na plataforma. Ative um na lista abaixo.'
          }
        />

        {erro ? (
          <Checagem estado="erro" titulo="A rota publica falhou" detalhe={erro} />
        ) : (
          <Checagem
            estado={entreguesIds === null ? 'neutro' : naoEntregues.length === 0 ? 'ok' : 'alerta'}
            titulo={
              entreguesIds === null
                ? 'Consultando /api/anuncios...'
                : `${entregues.length} anuncio(s) entregue(s) para a SUA conta`
            }
            detalhe={
              naoEntregues.length === 0
                ? 'Todos os anuncios ativos chegam nesta conta.'
                : `Fora para voce: ${naoEntregues
                    .map((anuncio) => {
                      const periodos = anuncio.periodos?.length
                        ? ` (segmentado para ${anuncio.periodos.map((p) => `${p}o`).join(', ')})`
                        : ''
                      return `${tituloDe(anuncio)}${periodos}`
                    })
                    .join('; ')}. Anuncio com periodo so aparece para quem esta naquele periodo — inclusive para voce.`
            }
          />
        )}

        <Checagem
          estado={ocultoAte > 0 ? 'alerta' : 'ok'}
          titulo={
            ocultoAte > 0
              ? `Voce ocultou os anuncios neste navegador ate ${new Date(ocultoAte).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Anuncios nao estao ocultos neste navegador'
          }
          detalhe={
            ocultoAte > 0
              ? 'O "x" da peca silencia os anuncios por 30 minutos neste aparelho. Isso vale so para voce.'
              : 'O botao "x" da peca silencia por 30 minutos — so neste aparelho.'
          }
          acao={
            ocultoAte > 0 ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  limparOcultacaoDeAnuncios()
                  setOcultoAte(0)
                }}
              >
                <Eye className="mr-2 h-3.5 w-3.5" />
                Voltar a ver agora
              </Button>
            ) : null
          }
        />

        <details className="group rounded-lg border bg-muted/20 p-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold">
            <MapPin className="h-4 w-4 text-[#E2A43E]" />
            Onde a peca NUNCA aparece
            <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">
              abrir
            </span>
          </summary>
          <p className="mt-2 text-xs text-muted-foreground">
            Voce esta em <span className="font-semibold text-foreground">/admin</span> agora: esta tela
            e uma das que nao exibem anuncio. Para ver a peca publicada, abra a dashboard ou outra area
            fora da lista.
          </p>
          <ul className="mt-2 space-y-1">
            {ANUNCIO_ROTAS_SEM_EXIBICAO.map((item) => (
              <li key={item.rota} className="flex flex-wrap gap-x-2 text-xs">
                <code className="rounded bg-background px-1.5 py-0.5 font-mono font-semibold">
                  {item.rota}
                </code>
                <span className="text-muted-foreground">{item.motivo}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  )
}

function Checagem({
  estado,
  titulo,
  detalhe,
  acao,
}: {
  estado: 'ok' | 'alerta' | 'erro' | 'neutro'
  titulo: string
  detalhe: string
  acao?: React.ReactNode
}) {
  const Icone = estado === 'ok' ? CheckCircle2 : estado === 'erro' ? XCircle : AlertTriangle

  return (
    <div
      className={cn(
        'flex flex-wrap items-start gap-3 rounded-lg border p-3',
        estado === 'ok' && 'border-emerald-500/25 bg-emerald-500/5',
        estado === 'alerta' && 'border-amber-500/30 bg-amber-500/5',
        estado === 'erro' && 'border-red-500/30 bg-red-500/5',
        estado === 'neutro' && 'border-border bg-muted/20',
      )}
    >
      <Icone
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0',
          estado === 'ok' && 'text-emerald-600 dark:text-emerald-400',
          estado === 'alerta' && 'text-amber-600 dark:text-amber-400',
          estado === 'erro' && 'text-red-500',
          estado === 'neutro' && 'text-muted-foreground',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{titulo}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detalhe}</p>
      </div>
      {acao}
    </div>
  )
}
