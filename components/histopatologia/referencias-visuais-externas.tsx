import { ExternalLink } from 'lucide-react'

import { FONTES, resolverDireitos } from '@/lib/histopatologia/direitos'
import type { ReferenciaVisualExterna } from '@/lib/histopatologia/editorial/referencias-visuais'
import type { MidiaExibivel } from '@/lib/histopatologia/esquemas'
import { GaleriaWebPathUtah } from './galeria-webpath-utah'

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

  const incorporadas = referencias
    .filter((referencia) => referencia.fonteId === 'webpath-utah' && referencia.urlImagem)
    .map((referencia) => {
      const modalidade: MidiaExibivel['modalidade'] = /macro/i.test(referencia.modalidade)
        ? 'Macroscopia'
        : /imuno/i.test(referencia.modalidade)
          ? 'Imuno-histoquímica'
          : 'Histologia'
      const midia: MidiaExibivel = {
        id: referencia.id,
        fonteId: 'webpath-utah',
        modalidade,
        coloracao: /\bHE\b/i.test(referencia.modalidade) ? 'HE' : 'Não informado',
        descricao: referencia.descricaoDidatica,
        descricaoRevisada: true,
        nomeCatalogado: referencia.titulo,
        urlPaginaFonte: referencia.urlPaginaFonte,
        urlImagem: referencia.urlImagem,
        estadoDeDireitos: resolverDireitos({
          fonteId: 'webpath-utah',
          midiaId: referencia.id,
          urlPaginaFonte: referencia.urlPaginaFonte,
          urlImagem: referencia.urlImagem,
        }).estado,
        alt: `${modalidade} catalogada como “${referencia.titulo}”, exibida diretamente da WebPath com autorização.`,
        creditoCurto: FONTES['webpath-utah'].creditoCurto,
        aumento: referencia.aumento === 'especial' ? undefined : referencia.aumento,
        legendaEditorial: referencia.descricaoDidatica,
      }
      return {
        midia,
        nomeOriginal: referencia.tituloOriginal,
        secao: referencia.modalidade,
        pontosDeObservacao: referencia.oQueObservar,
      }
    })
  const externas = referencias.filter(
    (referencia) => referencia.fonteId !== 'webpath-utah' || !referencia.urlImagem,
  )

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold">Estudo visual em acervos complementares</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            O roteiro e as descrições ficam no Domine Aqui, com a procedência indicada no crédito
            de cada referência.
          </p>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
          {referencias.length} {referencias.length === 1 ? 'referência guiada' : 'referências guiadas'}
        </span>
      </div>

      {incorporadas.length > 0 && <GaleriaWebPathUtah entradas={incorporadas} />}

      {externas.length > 0 && (
      <ul className={`grid gap-3 md:grid-cols-2 ${incorporadas.length > 0 ? 'mt-4' : ''}`}>
        {externas.map((referencia) => {
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

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Crédito: {fonte.creditoCurto}
                </span>
                <a
                  href={referencia.urlPaginaFonte}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[36px] items-center gap-1.5 text-[11px] font-semibold text-muted-foreground underline transition-colors hover:text-foreground"
                >
                  Consultar imagem na fonte
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </li>
          )
        })}
      </ul>
      )}
    </div>
  )
}
