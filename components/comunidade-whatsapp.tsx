'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'

// A comunidade é a porta de entrada: dentro dela ficam os grupos (ofertas,
// materiais gratuitos, simulados ao vivo). Linkar a comunidade, e não um grupo
// solto, deixa o aluno escolher em quais entrar — e o link não quebra quando um
// grupo enche e é trocado por outro.
export const COMUNIDADE_WHATSAPP_URL = 'https://chat.whatsapp.com/LeLYPVgwaXmLYWcR5D7MDc'

export function WhatsAppGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}

// Quem clicou em "Entrar" provavelmente entrou: some de vez. Quem fechou no X
// só não quer ver agora: volta depois de um tempo, porque a comunidade é o
// canal onde saem os simulados ao vivo e vale lembrar.
const STORAGE_KEY = 'gradex-comunidade-whatsapp'
const VOLTA_DEPOIS_DE_DIAS = 21

type Estado = { entrou?: boolean; fechadoEm?: number }

function lerEstado(): Estado {
  try {
    const bruto = window.localStorage.getItem(STORAGE_KEY)
    return bruto ? (JSON.parse(bruto) as Estado) : {}
  } catch {
    return {}
  }
}

function gravarEstado(estado: Estado) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estado))
  } catch {}
}

/**
 * Faixa discreta do dashboard convidando para a comunidade do WhatsApp.
 * Uma linha no desktop, duas no celular; nasce oculta e só aparece depois de
 * ler o localStorage, para não piscar para quem já dispensou.
 */
export function ComunidadeWhatsAppCard({ className = '' }: { className?: string }) {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const { entrou, fechadoEm } = lerEstado()
    if (entrou) return
    if (fechadoEm && Date.now() - fechadoEm < VOLTA_DEPOIS_DE_DIAS * 86_400_000) return
    setVisivel(true)
  }, [])

  if (!visivel) return null

  function fechar() {
    gravarEstado({ fechadoEm: Date.now() })
    setVisivel(false)
  }

  function entrar() {
    gravarEstado({ entrou: true })
    // Deixa o card na tela durante a navegação para a aba nova; some na
    // próxima visita.
  }

  return (
    <section
      aria-label="Comunidade no WhatsApp"
      className={
        'relative overflow-hidden rounded-2xl border border-[#25D366]/25 bg-gradient-to-r from-[#25D366]/[0.09] via-card/60 to-card/40 ' +
        className
      }
    >
      <div className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full bg-[#25D366]/15 blur-3xl" />

      <div className="relative flex flex-col gap-3 p-4 pr-11 sm:flex-row sm:items-center sm:gap-5 sm:p-5 sm:pr-14">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#1FAF55] dark:text-[#25D366]">
            <WhatsAppGlyph className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-[15px] font-semibold leading-snug tracking-tight">
              Entre na nossa comunidade do WhatsApp
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
              É lá que avisamos primeiro das{' '}
              <span className="text-foreground/90">ofertas</span>, liberamos{' '}
              <span className="text-foreground/90">materiais gratuitos</span> e marcamos os{' '}
              <span className="text-foreground/90">simulados ao vivo</span>.
            </p>
          </div>
        </div>

        <a
          href={COMUNIDADE_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={entrar}
          className="group inline-flex h-10 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-[#07361A] shadow-[0_8px_20px_-12px_rgba(37,211,102,0.8)] transition hover:bg-[#2EE274] active:scale-[0.98]"
        >
          Entrar nos grupos
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </div>

      <button
        type="button"
        onClick={fechar}
        aria-label="Dispensar convite da comunidade"
        title="Agora não"
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/70 transition hover:bg-foreground/5 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </section>
  )
}
