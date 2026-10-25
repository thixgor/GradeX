'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app-shell'
import { FundoDeVidro } from '@/components/vitrine/vidro-app'
import { ProgramaDeEmbaixadores } from '@/components/embaixadores/programa'
import { PainelDoEmbaixadorView } from '@/components/embaixadores/painel'
import type { PainelDoEmbaixador } from '@/lib/embaixadores/servidor'
import { CONFIG_PADRAO } from '@/lib/embaixadores/regras'
import { MARCA_DO_EMBAIXADOR } from '@/components/embaixadores/selo-do-link'
import '@/components/embaixadores/embaixadores.css'

interface Programa {
  linkInscricao: string
  descontoCupom: number
}

type Estado =
  | { fase: 'carregando' }
  | { fase: 'erro' }
  | { fase: 'pronto'; painel: PainelDoEmbaixador | null; programa: Programa }

/**
 * A aba Embaixadores.
 *
 * Uma página, duas caras: para quem é embaixador, o painel (link, cupom,
 * desempenho, comissão e PIX); para os demais — inclusive visitante sem
 * conta — o programa e a inscrição.
 */
function Conteudo() {
  const { user, loading } = useAppShell()
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' })
  const [tentativa, setTentativa] = useState(0)

  // Depende de QUEM está logado, não do objeto do bootstrap: ele é recriado a
  // cada atualização e remontaria a tela (com a animação de entrada) à toa.
  const quem = loading ? null : user?.id || 'visitante'

  useEffect(() => {
    if (!quem) return
    let vivo = true
    setEstado((atual) => (atual.fase === 'pronto' && tentativa === 0 ? atual : { fase: 'carregando' }))
    const url = quem !== 'visitante' ? '/api/embaixadores/me' : '/api/embaixadores/programa'
    fetch(url, { cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 401) {
          const publico = await fetch('/api/embaixadores/programa').then((r) => r.json())
          return { painel: null, programa: publico.programa }
        }
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((dados) => {
        if (!vivo) return
        marcarAparelho(quem !== 'visitante' ? dados.painel || null : undefined)
        setEstado({
          fase: 'pronto',
          painel: dados.painel || null,
          programa: dados.programa || { linkInscricao: CONFIG_PADRAO.linkInscricao, descontoCupom: CONFIG_PADRAO.descontoCupomPadrao },
        })
      })
      .catch(() => vivo && setEstado({ fase: 'erro' }))
    return () => {
      vivo = false
    }
  }, [quem, tentativa])

  if (estado.fase === 'carregando') return <Esqueleto />
  if (estado.fase === 'erro') {
    return (
      <div className="emb mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <p className="text-[20px] font-extrabold">Não deu para carregar agora</p>
        <p className="emb-suave mt-2 text-[15px]">Pode ser a conexão. Tente de novo em instantes.</p>
        <button type="button" onClick={() => setTentativa((n) => n + 1)} className="emb-botao vidro-botao emb-foco mt-6">
          <RefreshCw className="h-4 w-4" aria-hidden /> Tentar de novo
        </button>
      </div>
    )
  }
  if (estado.painel) return <PainelDoEmbaixadorView painel={estado.painel} />
  return <ProgramaDeEmbaixadores linkInscricao={estado.programa.linkInscricao} descontoCupom={estado.programa.descontoCupom} />
}

/**
 * A marca "sou embaixador" que liga o botão "Meu link desta página" nas
 * páginas de produto (components/embaixadores/selo-do-link). Vale 30 dias e é
 * refeita a cada visita ao painel; quem deixou de ser embaixador perde a marca.
 * `undefined` = visitante, não mexe.
 */
function marcarAparelho(painel: PainelDoEmbaixador | null | undefined) {
  if (painel === undefined) return
  try {
    if (painel && painel.embaixador.status === 'ativo') {
      window.localStorage.setItem(
        MARCA_DO_EMBAIXADOR,
        JSON.stringify({ codigo: painel.embaixador.codigo, link: painel.embaixador.link, validoAte: Date.now() + 30 * 86_400_000 }),
      )
    } else {
      window.localStorage.removeItem(MARCA_DO_EMBAIXADOR)
    }
  } catch {
    // sem storage: o botão flutuante simplesmente não aparece
  }
}

function Esqueleto() {
  return (
    <div className="emb mx-auto w-full max-w-6xl px-4 pt-10 md:px-8" aria-busy="true" aria-label="Carregando">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="emb-esqueleto h-8 w-56 rounded-full" />
          <div className="emb-esqueleto h-16 w-full max-w-lg" />
          <div className="emb-esqueleto h-5 w-full max-w-md" />
          <div className="emb-esqueleto h-5 w-2/3 max-w-sm" />
        </div>
        <div className="emb-esqueleto h-72 rounded-[28px] lg:col-span-5" />
      </div>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="emb-esqueleto h-28 rounded-[22px]" />
        ))}
      </div>
    </div>
  )
}

export default function EmbaixadoresPage() {
  return (
    <AppShell allowGuest guestNotice={false} headerTitle="Embaixadores" headerSubtitle="Programa de Embaixadores DomineAqui" vidro>
      <FundoDeVidro className="min-h-[100svh]">
        <Conteudo />
      </FundoDeVidro>
    </AppShell>
  )
}
