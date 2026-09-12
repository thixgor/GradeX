'use client'

/**
 * Painel colapsável de modelos persuasivos.
 *
 * Fica fechado por padrão: quem já sabe o que escrever não deveria rolar uma
 * lista de doze cards para chegar aos campos. Aberto, cada card explica a
 * técnica antes do texto — a ideia é escolher pelo efeito ("preciso de urgência
 * honesta") e não pelo primeiro texto que couber.
 */

import { useMemo, useState } from 'react'
import { ChevronDown, Eye, Lightbulb, Sparkles, Wand2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ANUNCIO_TEMPLATES, type AnuncioTemplate } from '@/lib/anuncio-templates'
import { cn } from '@/lib/utils'

interface PainelModelosProps {
  onAplicar: (template: AnuncioTemplate) => void
}

export function PainelModelos({ onAplicar }: PainelModelosProps) {
  const [aberto, setAberto] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [tecnica, setTecnica] = useState<string>('')

  const tecnicas = useMemo(
    () => Array.from(new Set(ANUNCIO_TEMPLATES.map((modelo) => modelo.tecnica))).sort(),
    [],
  )

  const visiveis = useMemo(
    () => (tecnica ? ANUNCIO_TEMPLATES.filter((modelo) => modelo.tecnica === tecnica) : ANUNCIO_TEMPLATES),
    [tecnica],
  )

  return (
    <div className="overflow-hidden rounded-lg border border-[#E2A43E]/35 bg-[#E2A43E]/5">
      <button
        type="button"
        onClick={() => setAberto((current) => !current)}
        aria-expanded={aberto}
        className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-[#E2A43E]/10"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E2A43E]/20 text-[#9A6817] dark:text-amber-200">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Modelos persuasivos</span>
          <span className="block text-xs text-muted-foreground">
            {ANUNCIO_TEMPLATES.length} textos prontos, um por técnica de persuasão. Preenchem título, conteúdo e botões.
          </span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', aberto && 'rotate-180')} />
      </button>

      {aberto && (
        <div className="space-y-3 border-t border-[#E2A43E]/25 p-3">
          <div className="flex flex-wrap gap-1">
            <FiltroTecnica ativo={!tecnica} label="Todas" onClick={() => setTecnica('')} />
            {tecnicas.map((item) => (
              <FiltroTecnica
                key={item}
                ativo={tecnica === item}
                label={item}
                onClick={() => setTecnica(tecnica === item ? '' : item)}
              />
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {visiveis.map((modelo) => (
              <CardModelo
                key={modelo.id}
                modelo={modelo}
                expandido={expandido === modelo.id}
                onAlternar={() => setExpandido(expandido === modelo.id ? null : modelo.id)}
                onAplicar={() => onAplicar(modelo)}
              />
            ))}
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-background/60 p-2.5 text-xs text-muted-foreground">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E2A43E]" />
            <span>
              Troque tudo que estiver entre [COLCHETES] por números e prazos reais. Escassez inventada
              queima a marca com quem já comprou — e é o tipo de detalhe que estudante percebe rápido.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

function FiltroTecnica({
  ativo,
  label,
  onClick,
}: {
  ativo: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-2.5 py-1 text-[11px] font-bold transition',
        ativo
          ? 'bg-[#468152] text-white shadow-sm'
          : 'bg-background/70 text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

function CardModelo({
  modelo,
  expandido,
  onAlternar,
  onAplicar,
}: {
  modelo: AnuncioTemplate
  expandido: boolean
  onAlternar: () => void
  onAplicar: () => void
}) {
  return (
    <article className="flex flex-col gap-2 rounded-lg border bg-background/70 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-bold">{modelo.nome}</h4>
          <span className="mt-1 inline-flex rounded-full bg-[#468152]/12 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#468152] dark:text-emerald-300">
            {modelo.tecnica}
          </span>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{modelo.comoFunciona}</p>

      {expandido && (
        <div className="space-y-2 rounded-lg bg-muted/40 p-2.5 text-xs">
          <p>
            <span className="font-bold">Quando usar: </span>
            {modelo.quandoUsar}
          </p>
          <p>
            <span className="font-bold">Banner: </span>
            {modelo.titulo} <span className="text-muted-foreground">— botão “{modelo.ctaTexto}”</span>
          </p>
          <p>
            <span className="font-bold">Modal: </span>
            {modelo.modalTitulo}
          </p>
          <div
            className="max-h-40 overflow-y-auto rounded-lg bg-background/80 p-2 leading-relaxed [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-1.5"
            dangerouslySetInnerHTML={{ __html: modelo.modalConteudo }}
          />
        </div>
      )}

      <div className="mt-auto flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onAplicar}
          className="h-8 flex-1 bg-[#468152] text-xs text-white hover:bg-[#3b7045]"
        >
          <Wand2 className="mr-1.5 h-3.5 w-3.5" />
          Usar modelo
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAlternar}
          className="h-8 px-2 text-xs"
          aria-expanded={expandido}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          {expandido ? 'Ocultar' : 'Ver texto'}
        </Button>
      </div>
    </article>
  )
}
