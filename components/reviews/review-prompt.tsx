'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CoverImage } from '@/components/cover-image'
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion'
import { Brain, Check, FileText, Loader2, Send, Sparkles, X } from 'lucide-react'
import { Portal } from '@/components/ui/portal'
import { StarRatingDisplay } from './star-rating'
import { REVIEW_COMMENT_MAX } from '@/lib/reviews-shared'
import type { ConviteDeAvaliacao, OrigemDoConvite } from '@/lib/reviews-prompt'

/**
 * A folha de avaliação que aparece ao fechar um material.
 *
 * ## Desenho
 *
 * No celular ela é uma folha presa à borda de baixo (o polegar alcança as
 * estrelas e o botão sem esticar a mão), arrastável para baixo para descartar.
 * No tablet e no computador vira um cartão centrado. É o mesmo componente: o
 * que muda são as classes e o eixo da animação — não há duas árvores para
 * manter em sincronia.
 *
 * ## Por que os atalhos de texto existem
 *
 * Digitar no celular é o maior atrito de uma avaliação, e é onde a maioria das
 * pessoas desiste. As etiquetas ("Conteúdo claro", "Ajudou na prova") deixam
 * quem não quer escrever mandar um comentário de verdade com dois toques — e
 * quem quiser escrever continua com o campo livre logo abaixo.
 *
 * ## Uma coisa de cada vez
 *
 * O campo de comentário só existe depois que a nota é dada. Abrir a folha já
 * com um retângulo de texto vazio faz a tarefa parecer grande; abrir com cinco
 * estrelas faz parecer um toque. O resto aparece quando a pessoa já se
 * comprometeu com o primeiro passo.
 */

interface ReviewPromptProps {
  convite: ConviteDeAvaliacao
  /** Resumo público do item — prova social ("4,8 · 32 avaliações"). */
  resumo?: { media: number; total: number } | null
  /** Capa/título confirmados pelo servidor (o convite pode estar defasado). */
  titulo?: string | null
  capa?: string | null
  onEnviado: () => void
  onAgoraNao: () => void
  onNuncaMais: () => void
  /** Servidor recusou (já avaliou, perdeu acesso): fecha sem penalizar nada. */
  onInvalido: () => void
}

const ROTULOS: Record<number, { titulo: string; frase: string }> = {
  1: { titulo: 'Deixou a desejar', frase: 'Conta o que deu errado — a gente corrige.' },
  2: { titulo: 'Dá pra melhorar', frase: 'O que faltou para este material te ajudar?' },
  3: { titulo: 'Foi bom', frase: 'O que seguraria a nota mais alta?' },
  4: { titulo: 'Muito bom!', frase: 'O que mais te ajudou no estudo?' },
  5: { titulo: 'Excelente!', frase: 'Conta rapidinho o que fez a diferença 👏' },
}

const ETIQUETAS_BOAS = ['Conteúdo claro', 'Bem organizado', 'Ajudou na prova', 'Direto ao ponto', 'Boas imagens']
const ETIQUETAS_RUINS = ['Faltou conteúdo', 'Difícil de ler', 'Muito superficial', 'Achei erros', 'Desorganizado']

const CONTEXTO: Record<OrigemDoConvite, { kicker: string; icone: typeof FileText }> = {
  pdf: { kicker: 'Você acabou de ler', icone: FileText },
  flashcards: { kicker: 'Você acabou de estudar', icone: Brain },
  html: { kicker: 'Você acabou de usar', icone: Sparkles },
  complementar: { kicker: 'Você acabou de ver', icone: FileText },
  material: { kicker: 'Você acabou de usar', icone: FileText },
}

export function ReviewPrompt({
  convite,
  resumo,
  titulo,
  capa,
  onEnviado,
  onAgoraNao,
  onNuncaMais,
  onInvalido,
}: ReviewPromptProps) {
  const [nota, setNota] = useState(0)
  const [hover, setHover] = useState(0)
  const [etiquetas, setEtiquetas] = useState<string[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  const cartaoRef = useRef<HTMLDivElement>(null)
  const primeiraEstrelaRef = useRef<HTMLButtonElement>(null)
  const dragControls = useDragControls()
  const reduzirMovimento = useReducedMotion()

  const nomeDoItem = titulo || convite.titulo || 'este material'
  const imagem = capa ?? convite.capa
  const { kicker, icone: Icone } = CONTEXTO[convite.origem] || CONTEXTO.material
  const emFoco = hover || nota
  const rotulo = emFoco ? ROTULOS[emFoco] : null
  const etiquetasVisiveis = nota >= 4 ? ETIQUETAS_BOAS : ETIQUETAS_RUINS

  const comentario = useMemo(() => {
    const partes = [etiquetas.join(' · '), texto.trim()].filter(Boolean)
    return partes.join(' — ').slice(0, REVIEW_COMMENT_MAX)
  }, [etiquetas, texto])

  // ─── Fechar por Esc, foco preso dentro da folha ───────────────────────────
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.stopPropagation()
        onAgoraNao()
        return
      }
      if (evento.key !== 'Tab' || !cartaoRef.current) return

      // Sem isto, o Tab sai da folha e passeia pela página atrás dela — que
      // continua ali, inerte, atrás de um véu. Quem navega por teclado perderia
      // o diálogo de vista sem ter como fechá-lo.
      const focaveis = cartaoRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )
      if (focaveis.length === 0) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      const ativo = document.activeElement

      if (evento.shiftKey && ativo === primeiro) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && ativo === ultimo) {
        evento.preventDefault()
        primeiro.focus()
      }
    }

    window.addEventListener('keydown', aoTeclar, true)
    return () => window.removeEventListener('keydown', aoTeclar, true)
  }, [onAgoraNao])

  // ─── O "voltar" do Android fecha a folha, não a página ────────────────────
  //
  // Sem isto, o gesto/botão de voltar — o reflexo de quem usa Android para sair
  // de qualquer coisa que se sobrepõe — levaria a pessoa para fora da página,
  // que não é nada do que ela pediu. A folha empurra uma entrada de histórico
  // com a MESMA URL: voltar consome essa entrada em vez de navegar, e o
  // `popstate` fecha a folha. A URL não muda, então o roteador do Next
  // restaura exatamente a mesma tela.
  const nossaEntradaRef = useRef(false)
  const recusarRef = useRef(onAgoraNao)
  recusarRef.current = onAgoraNao

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.history.pushState(null, '', window.location.href)
      nossaEntradaRef.current = true
    } catch {
      /* navegador que limita pushState: a folha só perde este atalho */
    }

    const aoVoltar = () => {
      // O navegador já tirou a entrada da pilha — não há o que desfazer aqui.
      nossaEntradaRef.current = false
      recusarRef.current()
    }
    window.addEventListener('popstate', aoVoltar)

    return () => {
      window.removeEventListener('popstate', aoVoltar)
      // Fechou pelo botão, pelo véu ou pelo Esc: a entrada que empurramos
      // continua na pilha, e sem removê-la o próximo "voltar" da pessoa seria
      // engolido por uma folha que já não existe.
      if (nossaEntradaRef.current) {
        nossaEntradaRef.current = false
        try {
          window.history.back()
        } catch {
          /* idem */
        }
      }
    }
  }, [])

  // Trava a rolagem do que está atrás. Sem isso, arrastar a folha no iOS rola a
  // página de baixo e o gesto de descartar vira uma rolagem esquisita.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  // O foco vai para a primeira estrela: leitor de tela anuncia o grupo de notas
  // e o teclado já opera as setas sem nenhum Tab.
  useEffect(() => {
    const t = window.setTimeout(() => primeiraEstrelaRef.current?.focus(), 120)
    return () => window.clearTimeout(t)
  }, [])

  const escolherNota = useCallback((valor: number) => {
    setNota(valor)
    setEtiquetas([])
    setErro(null)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(8)
    }
  }, [])

  const aoTeclarNasEstrelas = (evento: React.KeyboardEvent) => {
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      escolherNota(Math.min(5, (nota || 0) + 1))
    } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowDown') {
      evento.preventDefault()
      escolherNota(Math.max(1, (nota || 6) - 1))
    } else if (/^[1-5]$/.test(evento.key)) {
      evento.preventDefault()
      escolherNota(Number(evento.key))
    }
  }

  const alternarEtiqueta = (etiqueta: string) => {
    setEtiquetas(atual =>
      atual.includes(etiqueta) ? atual.filter(e => e !== etiqueta) : [...atual, etiqueta],
    )
  }

  async function enviar() {
    if (!nota || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: convite.targetType,
          targetId: convite.targetId,
          rating: nota,
          comment: comentario,
        }),
      })

      if (res.status === 409 || res.status === 403 || res.status === 423) {
        // Já avaliou por outra tela, perdeu o acesso ou o item travou. Nada
        // disso é culpa de quem está aqui: fecha em silêncio e não pergunta de
        // novo por este material.
        onInvalido()
        return
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Não foi possível enviar sua avaliação.')
      }

      setEnviado(true)
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([10, 40, 14])
      }
      window.setTimeout(onEnviado, 1900)
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível enviar sua avaliação.')
    } finally {
      setEnviando(false)
    }
  }

  const mola = reduzirMovimento
    ? { duration: 0.15 }
    : { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.8 }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="convite-avaliacao-titulo"
      >
        {/* Véu. Clicar fora vale como "agora não" — nunca como descarte
            definitivo: toque acidental não pode custar a opinião da pessoa. */}
        <motion.button
          type="button"
          aria-label="Fechar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onAgoraNao}
          className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[6px]"
        />

        <motion.div
          ref={cartaoRef}
          drag={reduzirMovimento ? false : 'y'}
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.45 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 110 || info.velocity.y > 700) onAgoraNao()
          }}
          initial={reduzirMovimento ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduzirMovimento ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
          transition={mola}
          className="relative flex w-full max-w-[34rem] flex-col overflow-hidden rounded-t-[28px] border border-white/60 bg-[#F7F4EE] shadow-[0_-18px_60px_-12px_rgba(11,82,54,0.45)] dark:border-white/10 dark:bg-[#101A15] sm:rounded-3xl sm:shadow-[0_30px_80px_-20px_rgba(11,82,54,0.55)]"
          style={{
            // Altura em porcentagem do véu (que é `fixed inset-0`) em vez de
            // `vh`: no Safari do iOS o `vh` mede o viewport de barras
            // escondidas, e a folha ficaria com o topo fora da tela.
            maxHeight: '92%',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          }}
        >
          {/* Brilho de topo — o mesmo vocabulário glass do resto da plataforma. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(240,197,99,0.28),transparent_70%)] dark:bg-[radial-gradient(120%_100%_at_50%_0%,rgba(240,197,99,0.16),transparent_70%)]"
          />

          {/* Alça de arrasto: só ela inicia o gesto, para que arrastar dentro do
              campo de texto continue selecionando texto. Some no desktop. */}
          <div
            onPointerDown={event => dragControls.start(event)}
            className="relative flex cursor-grab touch-none justify-center pb-1 pt-3 active:cursor-grabbing sm:hidden"
          >
            <span className="h-1.5 w-11 rounded-full bg-foreground/15 dark:bg-white/20" />
          </div>

          {/* `flex-1 min-h-0` e não `max-h-full`: a altura máxima do cartão é uma
              PORCENTAGEM, e porcentagem de pai sem altura definida não resolve —
              o conteúdo seria cortado pelo `overflow-hidden` do cartão em vez de
              rolar. Como coluna flex, o cartão tem altura definida pelo teto e
              esta área recebe o que sobra. */}
          <div
            className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-2 sm:px-7 sm:pt-6"
            style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {enviado ? (
                <motion.div
                  key="enviado"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center py-8 text-center"
                >
                  <motion.span
                    initial={reduzirMovimento ? {} : { scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-irish-emerald to-irish-forest text-white shadow-lg shadow-irish-emerald/30"
                  >
                    <Check className="h-8 w-8" strokeWidth={3} />
                  </motion.span>
                  <h2 className="mt-4 font-heading text-xl font-bold text-foreground">
                    Obrigado de verdade!
                  </h2>
                  <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                    Sua avaliação ajuda outros estudantes a escolherem o material certo.
                  </p>
                  <div className="mt-4">
                    <StarRatingDisplay value={nota} size="lg" />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="formulario" initial={false}>
                  {/* ─── Cabeçalho ───────────────────────────────────────── */}
                  <div className="flex items-start gap-3.5">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-irish-emerald/10 shadow-sm dark:border-white/10">
                      {/* `CoverImage` e não `next/image` cru: capa hospedada
                          fora da lista de `next.config.js` faz o otimizador
                          LANÇAR em tempo de render — e aqui isso derrubaria a
                          página inteira por causa de uma miniatura de 56px. */}
                      <CoverImage
                        src={imagem}
                        sizes="56px"
                        fallback={
                          <span className="flex h-full w-full items-center justify-center text-irish-emerald dark:text-irish-gold">
                            <Icone className="h-6 w-6" />
                          </span>
                        }
                      />
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-irish-emerald dark:text-irish-gold">
                        {kicker}
                      </p>
                      <h2
                        id="convite-avaliacao-titulo"
                        className="mt-0.5 line-clamp-2 font-heading text-base font-bold leading-snug text-foreground sm:text-lg"
                      >
                        {nomeDoItem}
                      </h2>
                      {resumo && resumo.total > 0 && (
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <StarRatingDisplay value={resumo.media} size="xs" />
                          <span>
                            {resumo.media.toFixed(1).replace('.', ',')} · {resumo.total}{' '}
                            {resumo.total === 1 ? 'avaliação' : 'avaliações'}
                          </span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={onAgoraNao}
                      aria-label="Agora não"
                      className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* ─── Estrelas ────────────────────────────────────────── */}
                  <div className="mt-5 rounded-2xl border border-irish-emerald/15 bg-white/60 px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                    <p className="text-sm font-semibold text-foreground">
                      Que nota você dá para este conteúdo?
                    </p>

                    <div
                      role="radiogroup"
                      aria-label="Sua nota, de 1 a 5 estrelas"
                      onKeyDown={aoTeclarNasEstrelas}
                      onMouseLeave={() => setHover(0)}
                      className="mt-3 flex items-center justify-center gap-1 sm:gap-2"
                    >
                      {[1, 2, 3, 4, 5].map(valor => {
                        const aceso = valor <= emFoco
                        return (
                          <motion.button
                            key={valor}
                            ref={valor === 1 ? primeiraEstrelaRef : undefined}
                            type="button"
                            role="radio"
                            aria-checked={nota === valor}
                            aria-label={`${valor} ${valor === 1 ? 'estrela' : 'estrelas'}`}
                            tabIndex={nota === valor || (!nota && valor === 1) ? 0 : -1}
                            onMouseEnter={() => setHover(valor)}
                            onFocus={() => setHover(valor)}
                            onBlur={() => setHover(0)}
                            onClick={() => escolherNota(valor)}
                            whileTap={reduzirMovimento ? undefined : { scale: 0.86 }}
                            animate={
                              reduzirMovimento ? undefined : { scale: aceso && nota === valor ? 1.12 : 1 }
                            }
                            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                            /* 48px de alvo: o mínimo confortável para o polegar,
                               bem acima dos 24px do ícone desenhado dentro. */
                            className="flex h-12 w-12 items-center justify-center rounded-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-irish-emerald/60 sm:h-[52px] sm:w-[52px]"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              className={`h-8 w-8 transition-all duration-150 sm:h-9 sm:w-9 ${
                                aceso ? 'irish-star' : 'text-muted-foreground/45'
                              }`}
                            >
                              <path
                                d="M12 2.4l2.94 6.06 6.66.97-4.82 4.72 1.14 6.66L12 17.74l-5.92 3.07 1.14-6.66L2.4 9.43l6.66-.97L12 2.4z"
                                fill={aceso ? '#F0C563' : 'none'}
                                stroke={aceso ? '#B98726' : 'currentColor'}
                                strokeWidth={aceso ? 0.65 : 1.4}
                                strokeLinejoin="round"
                              />
                            </svg>
                          </motion.button>
                        )
                      })}
                    </div>

                    {/* Altura reservada: sem ela, o rótulo aparecendo empurra o
                        resto da folha e as estrelas fogem do dedo. */}
                    <div className="mt-1 flex min-h-[38px] flex-col justify-center">
                      <AnimatePresence mode="wait" initial={false}>
                        {rotulo ? (
                          <motion.p
                            key={emFoco}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.14 }}
                            className="text-sm font-bold text-irish-forest dark:text-irish-gold"
                          >
                            {rotulo.titulo}
                          </motion.p>
                        ) : (
                          <motion.p
                            key="vazio"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-muted-foreground"
                          >
                            Toque numa estrela — leva 5 segundos.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* ─── Comentário (só depois da nota) ──────────────────── */}
                  <AnimatePresence initial={false}>
                    {nota > 0 && (
                      <motion.div
                        key="comentario"
                        initial={reduzirMovimento ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={reduzirMovimento ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4">
                          <p className="text-xs font-medium text-muted-foreground">
                            {rotulo?.frase} <span className="opacity-70">(opcional)</span>
                          </p>

                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {etiquetasVisiveis.map(etiqueta => {
                              const ativa = etiquetas.includes(etiqueta)
                              return (
                                <button
                                  key={etiqueta}
                                  type="button"
                                  aria-pressed={ativa}
                                  onClick={() => alternarEtiqueta(etiqueta)}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                                    ativa
                                      ? 'border-irish-emerald/50 bg-irish-emerald/15 text-irish-forest shadow-sm dark:text-irish-gold'
                                      : 'border-foreground/10 bg-white/50 text-muted-foreground hover:border-irish-emerald/30 hover:text-foreground dark:bg-white/[0.04]'
                                  }`}
                                >
                                  {etiqueta}
                                </button>
                              )
                            })}
                          </div>

                          <textarea
                            value={texto}
                            onChange={event => setTexto(event.target.value.slice(0, REVIEW_COMMENT_MAX))}
                            rows={2}
                            placeholder="Quer escrever mais alguma coisa?"
                            className="mt-2.5 w-full resize-none rounded-xl border border-irish-emerald/20 bg-white/70 px-3.5 py-2.5 text-sm leading-relaxed text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-irish-emerald/50 focus:outline-none focus:ring-2 focus:ring-irish-emerald/15 dark:bg-white/[0.04]"
                          />
                          <p className="mt-1.5 text-[11px] text-muted-foreground/70">
                            Aparece publicamente só com o seu primeiro nome.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

            {/* Ações FORA da área rolável.
                Num iPhone SE o cartão inteiro não cabe em 92% da tela, e com o
                botão no fim do fluxo a pessoa via as estrelas mas não via o
                "Enviar" — tinha que adivinhar que havia mais coisa abaixo. Como
                rodapé fixo da coluna, a ação principal está sempre à vista e o
                conteúdo rola por baixo dela. */}
            {!enviado && (
              <div className="relative shrink-0 border-t border-foreground/5 bg-[#F7F4EE]/90 px-5 pb-1 pt-3 backdrop-blur-sm dark:border-white/5 dark:bg-[#101A15]/90 sm:px-7 sm:pb-2">
                {erro && (
                  <div className="mb-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                    {erro}
                  </div>
                )}

                {/* ─── Ações ───────────────────────────────────────────── */}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center justify-center gap-1 sm:justify-start">
                    <button
                      type="button"
                      onClick={onAgoraNao}
                      className="rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                    >
                      Agora não
                    </button>
                    <span aria-hidden className="text-muted-foreground/30">·</span>
                    <button
                      type="button"
                      onClick={onNuncaMais}
                      className="rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground/70 underline-offset-2 transition-colors hover:text-foreground hover:underline"
                    >
                      Não quero avaliar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={enviar}
                    disabled={!nota || enviando}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-irish-emerald to-irish-forest px-6 text-sm font-bold text-white shadow-lg shadow-irish-emerald/25 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:h-11 sm:w-auto"
                  >
                    {enviando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar avaliação
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
        </motion.div>
      </div>
    </Portal>
  )
}
