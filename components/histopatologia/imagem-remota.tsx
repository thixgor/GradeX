'use client'

import { useState } from 'react'
import { AlertTriangle, ExternalLink, ImageOff, Microscope } from 'lucide-react'

import type { MidiaExibivel } from '@/lib/histopatologia/esquemas'
import { AVISO_DESCRICAO, AVISO_MIDIA_REMOTA, podeIncorporar } from '@/lib/histopatologia/midia'
import { EXPLICACAO_DE_DIREITOS } from '@/lib/histopatologia/direitos'
import { MARCA_DE_DIREITOS } from './tema'

/**
 * Cartão de mídia histopatológica remota.
 *
 * ## A regra central do módulo vive nestas linhas
 *
 * Este componente **nunca** monta um elemento `<img>` a menos que
 * `podeIncorporar` seja verdadeiro — o que exige, ao mesmo tempo, estado
 * `autorizado-incorporacao` e uma URL presente no DTO. Como
 * `lib/histopatologia/midia.ts` remove a URL quando o estado não a autoriza, as
 * duas condições são redundantes de propósito: mesmo que alguém quebre uma
 * delas no futuro, a outra continua fechando o portão.
 *
 * Quando a incorporação é autorizada, o `src` é a **URL remota da instituição de
 * origem**, tal como catalogada. Não passa por `next/image`, não passa por
 * `/_next/image`, não passa por proxy nosso e não é buscada pelo servidor: o
 * navegador do aluno pede o arquivo diretamente a quem o publicou. Isso não é
 * uma otimização pendente — é a política do módulo. Otimizar exigiria baixar, e
 * baixar é exatamente o que está proibido.
 *
 * ## Layout reservado
 *
 * A proporção é fixada por CSS (`aspect-[4/3]`) antes de qualquer carregamento.
 * As imagens remotas não declaram dimensões no catálogo, e sem reserva de espaço
 * cada lâmina que chegasse empurraria o texto abaixo dela — o pior tipo de
 * deslocamento, porque acontece enquanto a pessoa lê.
 *
 * ## Erro
 *
 * Erro de carregamento é recuperável e explícito: o cartão troca a imagem por um
 * aviso com o link para a origem. Os atlas são servidores institucionais únicos,
 * sem CDN; ficarem fora do ar é evento esperado, não exceção.
 */

export interface ImagemRemotaProps {
  midia: MidiaExibivel
  /** `cartao` na galeria; `principal` na figura de destaque da doença. */
  variante?: 'cartao' | 'principal'
}

export function ImagemHistopatologicaRemota({ midia, variante = 'cartao' }: ImagemRemotaProps) {
  const [falhou, setFalhou] = useState(false)
  const marca = MARCA_DE_DIREITOS[midia.estadoDeDireitos]
  const incorporar = podeIncorporar(midia) && !falhou

  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[4/3] w-full shrink-0 bg-muted/60">
        {incorporar ? (
          /*
           * `<img>` nativo, deliberadamente.
           *
           * eslint-disable abaixo é intencional e documentado: `next/image`
           * roteia por `/_next/image`, que **busca o arquivo no servidor**,
           * transcodifica e o serve do nosso edge. Isso seria cópia e
           * reprocessamento de mídia de terceiros — proibido pela política do
           * módulo, independentemente de estado de direitos.
           */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={midia.urlImagem}
            alt={midia.alt}
            loading="lazy"
            decoding="async"
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full object-cover"
            onError={() => setFalhou(true)}
          />
        ) : (
          <SemImagem
            estado={midia.estadoDeDireitos}
            falhou={falhou}
            descricao={midia.legendaEditorial ?? midia.descricao}
          />
        )}
      </div>

      <figcaption className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-muted-foreground">
            {midia.modalidade}
          </span>
          {midia.coloracao && midia.coloracao !== 'Não informado' && (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-muted-foreground">
              {midia.coloracao}
            </span>
          )}
          <span className={`rounded-full border px-2 py-0.5 ${marca.classe}`}>
            <span aria-hidden>{marca.simbolo}</span> {marca.rotulo}
          </span>
        </div>

        {/* Nome catalogado: texto puro, nunca HTML. */}
        <p className="text-xs font-semibold leading-snug">{midia.nomeCatalogado}</p>

        {midia.legendaEditorial ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{midia.legendaEditorial}</p>
        ) : (
          midia.descricao && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {midia.descricao}
              <span className="mt-1 block text-[10px] italic">{AVISO_DESCRICAO}</span>
            </p>
          )
        )}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <a
            href={midia.urlPaginaFonte}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[11px] font-bold transition-colors hover:border-teal-600/50"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Abrir página de origem
            <span className="sr-only"> de {midia.nomeCatalogado}</span>
          </a>
          {midia.urlImagem && (
            <a
              href={midia.urlImagem}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[11px] font-bold transition-colors hover:border-teal-600/50"
            >
              <ImageOff className="h-3.5 w-3.5" aria-hidden />
              Abrir imagem na fonte
              <span className="sr-only"> de {midia.nomeCatalogado}</span>
            </a>
          )}
          {midia.urlVisualizador && (
            <a
              href={midia.urlVisualizador}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[11px] font-bold transition-colors hover:border-violet-600/50"
            >
              <Microscope className="h-3.5 w-3.5" aria-hidden />
              Abrir lâmina virtual
              <span className="sr-only"> de {midia.nomeCatalogado}</span>
            </a>
          )}
        </div>

        {/*
          Crédito por item, na mesma unidade visual da mídia. A página geral de
          créditos é complementar e não substitui isto — é exigência explícita de
          CREDITOS_E_DIREITOS.md.
        */}
        <p className="border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">
          {midia.creditoCurto}
          {incorporar && <> · {AVISO_MIDIA_REMOTA}</>}
        </p>
      </figcaption>
    </figure>
  )
}

function SemImagem({
  estado,
  falhou,
  descricao,
}: {
  estado: MidiaExibivel['estadoDeDireitos']
  falhou: boolean
  descricao: string
}) {
  if (falhou) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
        role="status"
      >
        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden />
        <p className="text-xs font-semibold">A imagem não carregou</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          O servidor da instituição de origem não respondeu. Use o botão abaixo para abrir a página
          original.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
      <ImageOff className="h-6 w-6 text-muted-foreground" aria-hidden />
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {EXPLICACAO_DE_DIREITOS[estado]}
      </p>
      {descricao && (
        <p className="line-clamp-3 text-[11px] italic leading-relaxed text-muted-foreground">
          {descricao}
        </p>
      )}
    </div>
  )
}
