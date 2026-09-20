'use client'

import Image from 'next/image'
import { AudioLines, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AVISO_EDUCACIONAL } from '@/lib/acervos-licenciados'
import { fonteDaMidia, miniaturaDaMidia, otimizavel, urlDaMidia, type MidiaClinica } from '@/lib/semiologia/midia'

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
 *
 * Quatro tipos de mídia passam por aqui, e a diferença entre eles é o que o
 * palco faz antes de o aluno pedir: a imagem carrega, o clipe roda em laço
 * mudo, o vídeo externo espera um clique (é um iframe de terceiro — não se
 * carrega o player do YouTube em cada cena do catálogo por via das dúvidas) e
 * o áudio espera o play, porque bulha tocando sozinha ao abrir a página é o
 * jeito mais rápido de fazer alguém fechar a aba.
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
  // A comparação lado a lado é entre duas fotos paradas: vídeo e áudio não
  // cabem numa grade de dois quadrados.
  const estatica = (m: MidiaClinica) => m.tipo === 'imagem' || m.tipo === 'clipe'
  const normal = estatica(atual) ? comparar?.midias.find((m) => estatica(m) && urlDaMidia(m)) : undefined

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {ROTULO_DO_TIPO[atual.tipo]}
        </h3>
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
        <Palco key={atual.id} midia={atual} src={src} />
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
              {atual.tipo === 'video' ? 'vídeo original' : 'caso original'}
            </a>
          </p>
        </figcaption>
      </figure>

      {midias.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Mídias deste caso">
          {midias.map((midia, indice) => {
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
                  <Vinheta midia={midia} />
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

const ROTULO_DO_TIPO: Record<MidiaClinica['tipo'], string> = {
  imagem: 'Caso real',
  clipe: 'Caso real',
  video: 'Caso real · vídeo',
  audio: 'Caso real · ausculta',
}

/** A mídia grande, por tipo. */
function Palco({ midia, src }: { midia: MidiaClinica; src: string }) {
  if (midia.tipo === 'clipe') {
    // Clipe de ultrassom: sem som, em laço, e com `playsInline` para o iOS não
    // abrir em tela cheia no meio do estudo. Deslizamento pleural e colapso de
    // cava são achados de movimento — uma foto parada deles não é o achado.
    return (
      <video
        src={src}
        className="mx-auto max-h-[70vh] w-full max-w-full object-contain"
        muted
        loop
        playsInline
        controls
        preload="metadata"
        aria-label={midia.legenda}
      />
    )
  }
  if (midia.tipo === 'video') {
    return midia.fonte === 'youtube' ? <PlayerExterno midia={midia} src={src} /> : (
      <video src={src} className="mx-auto max-h-[70vh] w-full max-w-full object-contain" controls playsInline preload="metadata" aria-label={midia.legenda} />
    )
  }
  if (midia.tipo === 'audio') {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-10 text-white/80">
        <AudioLines className="h-12 w-12 text-sky-400" aria-hidden />
        <audio src={src} controls preload="none" className="w-full max-w-md" aria-label={midia.legenda} />
        <p className="text-center text-xs text-white/60">Use fone de ouvido: bulhas graves somem no alto-falante do celular.</p>
      </div>
    )
  }
  // `width`/`height` aqui são só a proporção reservada antes do carregamento;
  // `h-auto` devolve a proporção real assim que a imagem chega. O otimizador
  // serve a largura da coluna, não o original.
  return (
    <Image
      src={src}
      alt={midia.legenda}
      width={1600}
      height={1200}
      sizes="(min-width: 1024px) 50vw, 100vw"
      priority
      unoptimized={!otimizavel(src)}
      className="mx-auto h-auto max-h-[70vh] w-full max-w-full object-contain"
    />
  )
}

/**
 * Player do YouTube atrás de um clique.
 *
 * Até o clique só existe a miniatura (uma imagem do próprio YouTube) e um
 * botão. O iframe entra depois, já com `autoplay`, porque o aluno acabou de
 * pedir para ver. Além de não carregar um player de terceiro à toa, isso
 * mantém o trecho: `start`/`end` estão na URL do embed.
 */
function PlayerExterno({ midia, src }: { midia: MidiaClinica; src: string }) {
  const [tocando, setTocando] = useState(false)
  const miniatura = miniaturaDaMidia(midia)
  if (tocando) {
    return (
      <div className="relative aspect-video w-full">
        <iframe
          src={`${src}&autoplay=1`}
          title={midia.legenda}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => setTocando(true)}
      className="group relative block aspect-video w-full"
      aria-label={`Reproduzir vídeo: ${midia.legenda}`}
    >
      {miniatura && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={miniatura} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform group-hover:scale-105">
          <Play className="ml-1 h-7 w-7" fill="currentColor" aria-hidden />
        </span>
      </span>
      {(midia.inicio || midia.fim) && (
        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] tabular-nums text-white/90">
          {formatarTrecho(midia.inicio, midia.fim)}
        </span>
      )}
    </button>
  )
}

function formatarTrecho(inicio?: number, fim?: number): string {
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  if (inicio && fim) return `${mmss(inicio)}–${mmss(fim)}`
  if (inicio) return `a partir de ${mmss(inicio)}`
  return `até ${mmss(fim!)}`
}

/** Miniatura da faixa de seleção, por tipo. */
function Vinheta({ midia }: { midia: MidiaClinica }) {
  if (midia.tipo === 'audio') {
    return (
      <span className="flex h-full w-full items-center justify-center text-sky-400">
        <AudioLines className="h-6 w-6" aria-hidden />
      </span>
    )
  }
  if (midia.tipo === 'clipe') {
    const src = urlDaMidia(midia)
    return src ? <video src={src} className="h-full w-full object-cover" muted playsInline preload="metadata" aria-hidden /> : null
  }
  const src = miniaturaDaMidia(midia)
  if (!src) {
    return (
      <span className="flex h-full w-full items-center justify-center text-white/70">
        <Play className="h-5 w-5" aria-hidden />
      </span>
    )
  }
  return (
    <>
      <Image src={src} alt="" fill sizes="96px" unoptimized={!otimizavel(src)} className="object-cover" />
      {midia.tipo === 'video' && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Play className="h-5 w-5 text-white drop-shadow" fill="currentColor" aria-hidden />
        </span>
      )}
    </>
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
