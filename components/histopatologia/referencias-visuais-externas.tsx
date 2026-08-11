import { ExternalLink } from 'lucide-react'

import { FONTES } from '@/lib/histopatologia/direitos'
import type { ReferenciaVisualExterna } from '@/lib/histopatologia/editorial/referencias-visuais'

const ROTULO_DO_AUMENTO: Record<ReferenciaVisualExterna['aumento'], string> = {
  macroscopia: 'Macroscopia',
  panoramica: 'Panorâmica',
  pequeno: 'Pequeno aumento',
  medio: 'Aumento intermediário',
  grande: 'Grande aumento',
  especial: 'Método especial',
}

export function ReferenciasVisuaisExternas({
  referencias,
}: {
  referencias: ReferenciaVisualExterna[]
}) {
  if (referencias.length === 0) return null

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold">Estudo visual em acervos complementares</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            O roteiro e as descrições ficam no Domine Aqui; cada botão abre a página visual
            selecionada no acervo responsável.
          </p>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
          {referencias.length} {referencias.length === 1 ? 'referência guiada' : 'referências guiadas'}
        </span>
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {referencias.map((referencia) => {
          const fonte = FONTES[referencia.fonteId]
          return (
            <li
              key={referencia.id}
              className="flex flex-col rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                <span>{ROTULO_DO_AUMENTO[referencia.aumento]}</span>
                <span aria-hidden>·</span>
                <span>{referencia.modalidade}</span>
              </div>
              <h4 className="mt-2 text-sm font-bold leading-snug">{referencia.titulo}</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Título na fonte: <span lang="en">{referencia.tituloOriginal}</span>
              </p>
              <p className="mt-2 text-xs leading-relaxed">{referencia.descricaoDidatica}</p>

              <div className="mt-3 rounded-lg bg-muted/45 p-3">
                <p className="text-[11px] font-bold">Ao abrir, procure:</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">
                  {referencia.oQueObservar.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Crédito: {fonte.creditoCurto}
                </span>
                <a
                  href={referencia.urlPaginaFonte}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Abrir referência visual
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
