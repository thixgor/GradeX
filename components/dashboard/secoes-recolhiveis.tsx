'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { estiloDoChip } from '@/components/sidebar-cores'

/**
 * A parte da dashboard que fica guardada até a pessoa pedir.
 *
 * A dashboard empilhava tudo aberto: busca, saudação, questão do dia,
 * desempenho, foco, carrossel de áreas, atividade recente, insights, plano,
 * materiais — quase 2.000 px no computador e o dobro no celular. Ninguém lê
 * isso numa visita; a pessoa abre o app para continuar de onde parou.
 *
 * Aqui o que é consulta (atividade, insights, materiais, áreas) vira uma lista
 * agrupada, do jeito dos Ajustes do iPhone: cada linha mostra o título e UM
 * resumo — "Cardiologia · N1 2024 e mais 2", "9 dias seguidos · 72% de
 * acerto" — e só abre quando tocada. A informação continua a um toque e,
 * fechada, ainda diz o essencial.
 *
 * O que fica aberto é lembrado por aparelho (localStorage), e o conteúdo de
 * uma linha fechada sai da ordem de tabulação (`inert`).
 */

const CHAVE = 'gradex:dashboard-secoes'

export function useSecoesAbertas(padrao: Record<string, boolean>) {
  const [abertas, setAbertas] = useState<Record<string, boolean>>(padrao)

  // Lido depois de montar: o servidor não tem localStorage, e o primeiro
  // render precisa bater com o HTML dele.
  useEffect(() => {
    try {
      const salvo = JSON.parse(window.localStorage.getItem(CHAVE) || '{}')
      if (salvo && typeof salvo === 'object' && !Array.isArray(salvo)) {
        setAbertas((atual) => ({ ...atual, ...salvo }))
      }
    } catch {
      /* modo privado / storage cheio — fica o padrão */
    }
  }, [])

  const alternar = useCallback((id: string) => {
    setAbertas((atual) => {
      const proximo = { ...atual, [id]: !atual[id] }
      try {
        window.localStorage.setItem(CHAVE, JSON.stringify(proximo))
      } catch {
        /* idem */
      }
      return proximo
    })
  }, [])

  return { abertas, alternar }
}

export function GrupoDeSecoes({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="dash-rise" aria-label={titulo}>
      <h2 className="mb-2.5 px-1 font-heading text-lg font-semibold tracking-tight">{titulo}</h2>
      <div className="dash-grupo">{children}</div>
    </section>
  )
}

export function SecaoRecolhivel({
  id,
  titulo,
  resumo,
  icone,
  cor,
  aberta,
  onAlternar,
  acao,
  children,
}: {
  id: string
  titulo: string
  /** A linha de baixo do título — o que a seção diz mesmo fechada. */
  resumo?: React.ReactNode
  icone: React.ReactNode
  /** Chave de cor do chip (ver `components/sidebar-cores.ts`). */
  cor: string
  aberta: boolean
  onAlternar: () => void
  /** Atalho à direita ("Ver todas"), fora do botão de abrir. */
  acao?: { rotulo: string; href: string }
  children: React.ReactNode
}) {
  const corpoId = `secao-${id}`

  return (
    <div className="dash-linha" data-aberta={aberta || undefined}>
      <div className="dash-linha-topo">
        <button
          type="button"
          className="dash-linha-gatilho"
          onClick={onAlternar}
          aria-expanded={aberta}
          aria-controls={corpoId}
        >
          <span className="sidebar-mini-chip sidebar-mini-chip-grande" style={estiloDoChip(cor)} aria-hidden>
            {icone}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[15px] font-semibold leading-tight">{titulo}</span>
            {resumo && (
              <span className="mt-0.5 block truncate text-[13px] leading-snug text-muted-foreground">{resumo}</span>
            )}
          </span>
        </button>
        {acao && (
          <Link href={acao.href} className="dash-linha-acao">
            {acao.rotulo}
          </Link>
        )}
        {/* A seta fica sempre na ponta, com ou sem atalho ao lado. Tocar nela
            também abre; o teclado usa o botão da linha. */}
        <span className="dash-linha-seta-alvo" onClick={onAlternar} aria-hidden>
          <ChevronDown className="dash-linha-seta h-[18px] w-[18px] text-muted-foreground" />
        </span>
      </div>

      <div id={corpoId} className="dash-linha-corpo" inert={!aberta}>
        <div>
          <div className="dash-linha-conteudo">{children}</div>
        </div>
      </div>
    </div>
  )
}
