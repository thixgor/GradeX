'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Mail, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  ehDestinoInterno,
  partirEmNegrito,
  type PitchMontado,
} from '@/lib/provas/pitch-de-vendas'
import { cn } from '@/lib/utils'

/**
 * O convite que aparece quando a prova acaba.
 *
 * ## O que ele resolve
 *
 * A tela de fim de prova terminava em "Voltar para Início". A pessoa acabava
 * de passar duas horas estudando de graça, era a visitante mais interessada do
 * dia, e a plataforma se despedia dela sem dizer nada. Este cartão é o que
 * passa a ser dito — e o conteúdo dele é decidido por quem aplica a prova, em
 * `/admin/exams`.
 *
 * ## A regra do destino
 *
 * Todo botão daqui usa `router.push`. Nenhum usa `window.open`, `<a
 * target="_blank">` ou endereço absoluto — e `ehDestinoInterno` confere cada
 * rota antes de desenhar o botão, porque ela chega do servidor e o servidor a
 * leu do banco.
 *
 * O motivo é onde o aluno está: boa parte entra pelo aplicativo instalado. Ali
 * um link externo abre uma aba do navegador POR CIMA do app — a pessoa sai do
 * aplicativo para ver a página de planos e, quando volta, perdeu o lugar. Uma
 * navegação interna troca a seção sem sair de casa. É a diferença entre
 * convidar alguém para outro cômodo e empurrá-lo para a rua.
 *
 * ## Por que o texto vem pronto do servidor
 *
 * Duas frases do pitch dependem de fatos que esta tela não pode conhecer: o
 * número real de contas (prova social) e o aproveitamento da pessoa, que numa
 * prova avaliativa fica preso até o término. Ver
 * `app/api/exams/[id]/pitch/route.ts`. Aqui só se desenha.
 *
 * ## Quando ele não aparece
 *
 * Enquanto a resposta não chega, e sempre que ela vier vazia: prova sem pitch,
 * pitch desligado, pitch sem destino, ou uma conta que já assina. Um cartão de
 * esqueleto para um convite que talvez nem exista seria pior do que o silêncio
 * — e a chegada um instante depois do resultado é, de propósito, a ordem certa
 * da conversa: primeiro a nota que a pessoa veio buscar, depois o convite.
 */

interface PitchDeVendasDaProvaProps {
  examId: string
  className?: string
}

interface RespostaDoPitch {
  pitch: PitchMontado | null
  email?: boolean
}

export function PitchDeVendasDaProva({ examId, className }: PitchDeVendasDaProvaProps) {
  const router = useRouter()
  const [pitch, setPitch] = useState<PitchMontado | null>(null)
  /**
   * O aviso do e-mail só aparece depois que o servidor confirma que ele saiu.
   *
   * Prometer na tela um e-mail que a fila engoliu é pior do que não prometer
   * nada: a pessoa vai procurar na caixa de entrada. Aqui a frase só é escrita
   * quando a rota responde `enviado: true` — e quem já recebeu numa visita
   * anterior recebe `false`, sem repetir o aviso.
   */
  const [emailSaiu, setEmailSaiu] = useState(false)
  /**
   * O e-mail é pedido uma vez por montagem, no máximo.
   *
   * A trava de verdade é do servidor (`pitchEmailEnviadoEm` na entrega); esta
   * aqui só evita a segunda requisição inútil do modo estrito do React em
   * desenvolvimento, que monta cada efeito duas vezes.
   */
  const emailPedido = useRef(false)

  useEffect(() => {
    if (!examId) return
    let cancelado = false

    ;(async () => {
      try {
        const res = await fetch(`/api/exams/${examId}/pitch`, { cache: 'no-store' })
        if (!res.ok) return
        const dados = (await res.json()) as RespostaDoPitch
        if (cancelado || !dados?.pitch) return

        setPitch(dados.pitch)

        if (dados.email && !emailPedido.current) {
          emailPedido.current = true
          // Sem `await`: o e-mail é um acréscimo, e o cartão já está na tela
          // enquanto ele sai. Uma falha aqui não vira aviso nenhum — não há
          // nada que a pessoa possa fazer a respeito.
          fetch(`/api/exams/${examId}/pitch/email`, { method: 'POST' })
            .then((resposta) => (resposta.ok ? resposta.json() : null))
            .then((corpo) => {
              if (!cancelado && corpo?.enviado) setEmailSaiu(true)
            })
            .catch(() => undefined)
        }
      } catch {
        // Sem pitch, a tela de fim de prova continua exatamente como era.
      }
    })()

    return () => {
      cancelado = true
    }
  }, [examId])

  if (!pitch) return null

  const destinos = pitch.destinos.filter((destino) => ehDestinoInterno(destino.href))
  if (destinos.length === 0) return null

  const principal = destinos[0]
  const secundarios = destinos.slice(1)

  return (
    <div
      className={cn(
        'exam-resultado-entra relative overflow-hidden rounded-2xl border border-emerald-500/25',
        'bg-gradient-to-br from-emerald-500/10 via-background/60 to-teal-500/5 p-6 sm:p-8 backdrop-blur-md shadow-lg',
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl" />

      <div className="relative space-y-4">
        {pitch.selo && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-3 w-3" />
            {pitch.selo}
          </span>
        )}

        {pitch.titulo && (
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-foreground">
            {pitch.titulo}
          </h2>
        )}

        <div className="space-y-3">
          {pitch.paragrafos.map((paragrafo, indice) => (
            <p key={indice} className="text-[15px] leading-relaxed text-muted-foreground">
              {partirEmNegrito(paragrafo).map((pedaco, posicao) =>
                pedaco.forte ? (
                  <strong key={posicao} className="font-semibold text-foreground">
                    {pedaco.texto}
                  </strong>
                ) : (
                  <span key={posicao}>{pedaco.texto}</span>
                ),
              )}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            size="lg"
            className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 sm:w-auto"
            // `router.push`, nunca `window.open`: dentro do aplicativo, abrir
            // aba tira a pessoa de onde ela está. Ver o cabeçalho.
            onClick={() => router.push(principal.href)}
          >
            {pitch.chamada || `Ver ${principal.rotulo}`}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {secundarios.map((destino) => (
            <Button
              key={destino.chave}
              size="lg"
              variant="outline"
              className="rounded-xl border-emerald-500/30 sm:w-auto"
              onClick={() => router.push(destino.href)}
              title={destino.descricao}
            >
              {destino.rotulo}
            </Button>
          ))}
        </div>

        {secundarios.length === 0 && (
          <p className="text-xs text-muted-foreground/80">{principal.descricao}</p>
        )}

        {/*
          O aviso do e-mail é aviso, não argumento — daí o tamanho e o tom.
          Dizer que a mensagem saiu, no instante em que ela sai, é a diferença
          entre um e-mail esperado e um e-mail que aparece do nada na caixa de
          entrada duas horas depois.
        */}
        {emailSaiu && (
          <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            Mandamos um resumo disto para o e-mail da sua conta.
          </p>
        )}
      </div>
    </div>
  )
}
