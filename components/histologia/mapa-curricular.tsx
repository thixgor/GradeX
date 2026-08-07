'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Microscope } from 'lucide-react'

import type { NoCurriculo } from '@/lib/histologia/esquemas'
import { rotaDaPagina } from '@/lib/histologia/rotas'
import { setorDe, tema } from './tema'

/**
 * Mapa curricular completo.
 *
 * ## A regra que orienta o desenho
 *
 * **A hierarquia não pode ser achatada.** O acervo tem até seis níveis
 * (Órgãos e Sistemas › Sistema Digestório › Tubular › Intestino Delgado ›
 * Visão Geral › lâmina), e transformá-los numa grade de cartões — a solução
 * óbvia — apagaria a informação mais útil que o currículo carrega: onde cada
 * assunto mora e o que vem antes dele.
 *
 * Então o mapa é uma árvore de verdade, com `<details>` por setor e expansão
 * progressiva por assunto. Os dois primeiros níveis vêm abertos porque são o
 * mapa; do terceiro em diante, a expansão é decisão do aluno — abrir 1.524
 * itens de uma vez seria ilegível e custaria a rolagem do celular.
 *
 * As lâminas folha não são listadas aqui: elas ficam na landing do assunto, com
 * miniatura. Repetir 1.320 links neste mapa não ajudaria a escolher.
 */
export function MapaCurricular({ setores }: { setores: NoCurriculo[] }) {
  return (
    <div className="space-y-3">
      {setores.map((setor) => (
        <BlocoDeSetor key={setor.slug} setor={setor} />
      ))}
    </div>
  )
}

function BlocoDeSetor({ setor }: { setor: NoCurriculo }) {
  const { cor, resumo } = setorDe(setor.caminho)
  const t = tema(cor)

  return (
    <details open className="group overflow-hidden rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 marker:hidden">
        <span className={`mt-0.5 shrink-0 rounded-lg border p-2 ${t.borda} ${t.fundo}`}>
          <Microscope className={`h-5 w-5 ${t.texto}`} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-heading text-lg font-semibold leading-tight">{setor.titulo}</span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {setor.filhos.length} assuntos · {setor.laminas} lâminas · {setor.estruturas}{' '}
              estruturas
            </span>
          </span>
          {resumo && (
            <span className="mt-1 block max-w-3xl text-xs leading-relaxed text-muted-foreground">
              {resumo}
            </span>
          )}
        </span>
        <ChevronDown
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="border-t border-border p-3">
        <ul className="space-y-1.5">
          {setor.filhos.map((assunto) => (
            <li key={assunto.slug}>
              <Ramo no={assunto} cor={cor} nivel={0} />
            </li>
          ))}
        </ul>
        <Link
          href={rotaDaPagina(setor.caminho)}
          className={`mt-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-border px-3 text-xs font-bold transition-colors ${t.hover}`}
        >
          Ver {setor.titulo} por inteiro
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </details>
  )
}

function Ramo({
  no,
  cor,
  nivel,
}: {
  no: NoCurriculo
  cor: ReturnType<typeof setorDe>['cor']
  nivel: number
}) {
  const t = tema(cor)
  const [aberto, setAberto] = useState(nivel === 0)

  // Só ramos com subseções expandem. Um nó cujos filhos são todos lâminas leva
  // direto à landing do assunto, onde elas aparecem com miniatura.
  const subsecoes = no.filhos.filter((f) => f.filhos.length > 0 || f.tipo === 'secao')
  const expansivel = subsecoes.length > 0

  return (
    <div style={{ paddingLeft: nivel * 14 }}>
      <div className="flex items-stretch gap-1">
        {expansivel ? (
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-label={`${aberto ? 'Recolher' : 'Expandir'} ${no.titulo}`}
            className="flex w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform ${aberto ? 'rotate-90' : ''}`}
              aria-hidden
            />
          </button>
        ) : (
          <span className="w-8 shrink-0" aria-hidden />
        )}

        <Link
          href={rotaDaPagina(no.caminho)}
          className={`flex min-h-[40px] flex-1 items-center justify-between gap-2 rounded-md border border-transparent px-2.5 py-1.5 transition-colors hover:bg-muted ${t.hover}`}
        >
          <span className="min-w-0 text-sm font-medium leading-snug">{no.titulo}</span>
          <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
            {no.laminas > 0 && `${no.laminas} lâmina${no.laminas === 1 ? '' : 's'}`}
          </span>
        </Link>
      </div>

      {expansivel && aberto && (
        <ul className="mt-1 space-y-1">
          {no.filhos
            .filter((f) => f.filhos.length > 0 || f.tipo === 'secao')
            .map((filho) => (
              <li key={filho.slug}>
                <Ramo no={filho} cor={cor} nivel={nivel + 1} />
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
