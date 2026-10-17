'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MotionConfig } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { api, ErroApi } from '@/components/monitorias/base'
import { Saguao } from '@/components/monitorias/sala/saguao'
import { SalaChamada } from '@/components/monitorias/sala/chamada'
import { ForaDaSala, SemSuporte } from '@/components/monitorias/sala/fora-da-sala'
import { precisaRecarregarASala, recarregarASala, salaCarregouDireito, useSalaDeAula } from '@/hooks/use-sala-de-aula'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import type { EstadoDoSaguao } from '@/lib/monitorias/sala/mensagens'

/** No saguão, quem já está na sala é conferido a cada 20 s, por no máximo 10 min. */
const ATUALIZACOES_DO_SAGUAO = 30

export default function PaginaDaSala({ params }: { params: { id: string } }) {
  const [recarregando] = useState(precisaRecarregarASala)
  useEffect(() => {
    if (recarregando) recarregarASala()
    else salaCarregouDireito()
  }, [recarregando])
  const { ctrl, estado } = useSalaDeAula(params.id, !recarregando)
  const [saguao, setSaguao] = useState<EstadoDoSaguao | null>(null)
  const [erroSaguao, setErroSaguao] = useState('')
  const [naoEncontrada, setNaoEncontrada] = useState(false)
  const voltas = useRef(0)

  const carregar = useCallback(async () => {
    try {
      setSaguao(await api<EstadoDoSaguao>(`/api/monitorias/reservas/${params.id}/sala`))
      setErroSaguao('')
    } catch (e) {
      if (e instanceof ErroApi && e.status === 404) setNaoEncontrada(true)
      else setErroSaguao(e instanceof Error ? e.message : 'Não deu para carregar a sala.')
    }
  }, [params.id])

  useEffect(() => {
    if (!recarregando) void carregar()
  }, [carregar, recarregando])

  // Voltou ao saguão (depois de sair): retrato novo da sala.
  const fase = estado?.fase
  useEffect(() => {
    if (fase === 'saguao') {
      voltas.current = 0
      void carregar()
    }
  }, [fase, carregar])

  // Sala ainda fechada: uma requisição só, no minuto em que ela abre.
  useEffect(() => {
    if (saguao?.acesso.motivo !== 'nao_abriu' || !saguao.acesso.abreEm) return
    const ms = new Date(saguao.acesso.abreEm).getTime() - Date.now() + 1_000
    if (ms > 2_000_000_000) return
    const t = setTimeout(() => void carregar(), Math.max(1_000, ms))
    return () => clearTimeout(t)
  }, [saguao, carregar])

  const atualizarSaguao = useCallback(() => {
    voltas.current++
    void carregar()
  }, [carregar])
  useIntervaloVisivel(atualizarSaguao, fase === 'saguao' && saguao?.acesso.ok && voltas.current < ATUALIZACOES_DO_SAGUAO ? 20_000 : null)

  if (naoEncontrada) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 text-center text-foreground">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Sala não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">Esta monitoria não existe ou não é sua.</p>
          <Link href="/monitorias/minhas" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            Ver minhas monitorias
          </Link>
        </div>
      </div>
    )
  }

  if (!ctrl || !estado || estado.fase === 'verificando') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background text-muted-foreground" role="status">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden /> Preparando a sala…
      </div>
    )
  }

  // A sala fica fora do app-shell: aqui ela mesma respeita "reduzir movimento".
  return (
    <MotionConfig reducedMotion="user">
      {estado.fase === 'sem_suporte' ? (
        <SemSuporte motivo={estado.semSuporte || 'webrtc'} reservaId={params.id} />
      ) : estado.fase === 'na_sala' ? (
        <SalaChamada ctrl={ctrl} estado={estado} titulo={saguao?.reserva.titulo || 'Monitoria'} fim={saguao?.reserva.fim || null} />
      ) : estado.fase === 'fora' ? (
        <ForaDaSala ctrl={ctrl} estado={estado} reservaId={params.id} ehAluno={saguao?.papel === 'aluno'} />
      ) : (
        <Saguao ctrl={ctrl} estado={estado} saguao={saguao} erroSaguao={erroSaguao} />
      )}
    </MotionConfig>
  )
}
