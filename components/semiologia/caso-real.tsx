'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { AVISO_EDUCACIONAL } from '@/lib/acervos-licenciados'
import { fonteDaMidia, otimizavel, urlDaMidia, type MidiaClinica } from '@/lib/semiologia/midia'

/**
 * O caso real — a figura principal da cena.
 *
 * A fotografia é o que o aluno vai encontrar na clínica, então ela ocupa o
 * palco: uma imagem grande, na proporção original, com a legenda embaixo e
 * as demais mídias da cena como miniaturas para trocar. O esquema desenhado
 * vem depois, como referência — ensina o padrão, mas não é o que o olho
 * precisa reconhecer.
 *
 * O crédito curto aparece aqui **além** do rodapé permanente da seção, e isso
 * não contradiz a exigência de não repetir: o rodapé identifica a origem do
 * módulo; esta linha identifica de qual acervo veio *esta* imagem, que é outra
 * informação — sem ela, duas fontes no mesmo módulo viram uma massa
 * indistinguível. O vínculo para o caso original acompanha por ser o que torna
 * a proveniência verificável por quem quiser conferir.
 */
export function CasoReal({
  midias,
  cenaId,
  comparar,
}: {
  midias: MidiaClinica[]
  cenaId: string
  /** A cena normal, fotografada, para mostrar lado a lado com esta. */
  comparar?: { midias: MidiaClinica[]; rotulo: string }
}) {
  const [escolhida, setEscolhida] = useState(0)
  // Trocar de cena volta para a primeira mídia da nova cena.
  useEffect(() => setEscolhida(0), [cenaId])
  const atual = midias[Math.min(escolhida, midias.length - 1)]
  const src = urlDaMidia(atual)
  if (!src) return null
  const fonte = fonteDaMidia(atual)
  const normal = comparar?.midias.find((m) => urlDaMidia(m))

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Caso real</h3>
        {midias.length > 1 && (
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {escolhida + 1} de {midias.length}
          </span>
        )}
      </div>

      {/* Lado a lado com o normal: a mesma comparação que o esquema oferece,
          agora entre duas fotografias. O delta que o aluno precisa ver é o
          mesmo; muda só que aqui ele vem com o ruído da vida real. */}
      {normal && (
        <div className="grid grid-cols-2 gap-2">
          <Miniatura midia={normal} rotulo={comparar!.rotulo} cor="text-emerald-600 dark:text-emerald-400" />
          <Miniatura midia={atual} rotulo="Esta cena" cor="text-muted-foreground" />
        </div>
      )}

      <figure className={`overflow-hidden rounded-2xl border border-border bg-black ${normal ? 'hidden' : ''}`}>
        {atual.tipo === 'clipe' ? (
          // Clipe de ultrassom: sem som, em laço, e com `playsInline` para o
          // iOS não abrir em tela cheia no meio do estudo. Deslizamento pleural
          // e colapso de cava são achados de movimento — uma foto parada deles
          // não é o achado.
          <video
            key={atual.id}
            src={src}
            className="mx-auto max-h-[70vh] w-full object-contain"
            muted
            loop
            playsInline
            controls
            preload="metadata"
            aria-label={atual.legenda}
          />
        ) : (
          // `width`/`height` aqui são só a proporção reservada antes do
          // carregamento; `h-auto` devolve a proporção real assim que a imagem
          // chega. O otimizador serve a largura da coluna, não o original.
          <Image
            key={atual.id}
            src={src}
            alt={atual.legenda}
            width={1600}
            height={1200}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            unoptimized={!otimizavel(src)}
            className="mx-auto h-auto max-h-[70vh] w-full object-contain"
          />
        )}
        <figcaption className="space-y-1.5 bg-card p-4">
          <p className="text-sm leading-relaxed">{atual.legenda}</p>
          {atual.autoria && <p className="text-xs text-muted-foreground">{atual.autoria}</p>}
          <p className="text-[11px] text-muted-foreground/80">
            {fonte.creditoCurto} ·{' '}
            <a
              href={atual.urlDoCaso}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              caso original
            </a>
          </p>
        </figcaption>
      </figure>

      {midias.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Mídias deste caso">
          {midias.map((midia, indice) => {
            const miniatura = urlDaMidia(midia)
            if (!miniatura) return null
            const ativa = indice === escolhida
            return (
              <li key={midia.id} className="shrink-0">
                <button
                  role="tab"
                  aria-selected={ativa}
                  onClick={() => setEscolhida(indice)}
                  title={midia.legenda}
                  className={`relative block h-16 w-24 overflow-hidden rounded-lg border-2 bg-black transition-colors ${
                    ativa ? 'border-sky-500' : 'border-border hover:border-sky-500/50'
                  }`}
                >
                  {midia.tipo === 'clipe' ? (
                    <video src={miniatura} className="h-full w-full object-cover" muted playsInline preload="metadata" aria-hidden />
                  ) : (
                    <Image src={miniatura} alt="" fill sizes="96px" unoptimized={!otimizavel(miniatura)} className="object-cover" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground/80">{AVISO_EDUCACIONAL}</p>
    </section>
  )
}

function Miniatura({ midia, rotulo, cor }: { midia: MidiaClinica; rotulo: string; cor: string }) {
  const src = urlDaMidia(midia)
  if (!src) return null
  return (
    <figure className="space-y-1.5">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-black">
        {midia.tipo === 'clipe' ? (
          <video src={src} className="h-full w-full object-contain" muted loop playsInline autoPlay preload="metadata" aria-label={midia.legenda} />
        ) : (
          <Image src={src} alt={midia.legenda} fill sizes="(min-width: 1024px) 25vw, 50vw" unoptimized={!otimizavel(src)} className="object-contain" />
        )}
      </div>
      <figcaption className={`text-center text-[11px] font-medium uppercase tracking-wide ${cor}`}>{rotulo}</figcaption>
    </figure>
  )
}
