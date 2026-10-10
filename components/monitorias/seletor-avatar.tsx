'use client'

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, ExternalLink, Loader2 } from 'lucide-react'
import { AVATARES, FILTROS_AVATAR, SERIES_AVATAR, creditoDoAvatar, type Avatar, type FiltroAvatar, type SerieAvatar } from '@/lib/monitorias/avatares'
import { cn } from '@/lib/utils'
import { CaixaErro, api } from './base'

/**
 * Galeria de retratos do monitor. Não há envio de foto: o monitor escolhe um
 * retrato do catálogo (imagens livres hospedadas na Wikimedia, nada no nosso
 * storage) e o servidor grava só o id.
 */
export function SeletorAvatar({ atual, onEscolhido }: { atual: string | null; onEscolhido: (id: string) => void }) {
  const reduzir = useReducedMotion()
  const [filtro, setFiltro] = useState<FiltroAvatar>('todos')
  const [serie, setSerie] = useState<SerieAvatar | 'todas'>('todas')
  const [salvando, setSalvando] = useState<string | null>(null)
  const [escolhido, setEscolhido] = useState<string | null>(atual)
  const [erro, setErro] = useState('')
  const [creditos, setCreditos] = useState(false)

  // Em "Séries", a lista sai separada por série (com título) para achar o personagem mais rápido.
  const secoes = useMemo<Array<{ titulo?: string; itens: Avatar[] }>>(() => {
    const lista = AVATARES.filter((a) => FILTROS_AVATAR.find((f) => f.id === filtro)!.aceita(a))
    if (filtro !== 'series') return [{ itens: lista }]
    return SERIES_AVATAR.filter((s) => serie === 'todas' || s.id === serie)
      .map((s) => ({ titulo: s.rotulo, itens: lista.filter((a) => a.serie === s.id) }))
      .filter((s) => s.itens.length > 0)
  }, [filtro, serie])

  async function escolher(id: string) {
    if (salvando || id === escolhido) return
    setSalvando(id)
    setErro('')
    try {
      await api('/api/monitorias/tutor/foto', { method: 'PUT', json: { avatar: id } })
      setEscolhido(id)
      onEscolhido(id)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvando(null)
    }
  }

  return (
    <div>
      <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Filtrar retratos">
        {FILTROS_AVATAR.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filtro === f.id}
            onClick={() => { setFiltro(f.id); setSerie('todas') }}
            className={cn('shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium transition', filtro === f.id ? 'bg-foreground text-background' : 'bg-muted/60 text-muted-foreground hover:text-foreground')}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      {filtro === 'series' && (
        <>
          <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Escolher a série">
            {[{ id: 'todas' as const, rotulo: 'Todas' }, ...SERIES_AVATAR].map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={serie === s.id}
                onClick={() => setSerie(s.id)}
                className={cn('shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition', serie === s.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
              >
                {s.rotulo}
              </button>
            ))}
          </div>
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            Fotos dos atores em eventos públicos, com licença livre. A DomineAqui não tem vínculo com as séries, os estúdios ou os atores.
          </p>
        </>
      )}

      <div className="space-y-5">
        {secoes.map((secao) => (
          <section key={secao.titulo ?? 'lista'}>
            {secao.titulo && <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{secao.titulo}</h4>}
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {secao.itens.map((a, i) => {
                const ativo = escolhido === a.id
                return (
                  <motion.li
                    key={a.id}
                    initial={reduzir ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i, 16) * 0.015 }}
                  >
                    <button
                      type="button"
                      onClick={() => escolher(a.id)}
                      aria-pressed={ativo}
                      aria-label={`${a.nome}: ${a.legenda}`}
                      className={cn(
                        'group flex w-full flex-col items-center gap-1.5 rounded-2xl p-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        ativo ? 'bg-primary/10' : 'hover:bg-muted/60',
                      )}
                    >
                      <span className={cn('relative block aspect-square w-full overflow-hidden rounded-[32%] bg-muted ring-2 transition', ativo ? 'ring-primary' : 'ring-transparent group-hover:ring-border')}>
                        <Retrato url={a.url} nome={a.nome} />
                        {(ativo || salvando === a.id) && (
                          <span className="absolute inset-0 flex items-center justify-center bg-primary/35">
                            {salvando === a.id ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Check className="h-7 w-7 text-white drop-shadow" />}
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-2 text-xs font-semibold leading-tight">{a.nome}</span>
                      <span className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">{a.legenda}</span>
                    </button>
                  </motion.li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      {erro && <CaixaErro mensagem={erro} className="mt-3" />}

      <div className="mt-4 text-xs text-muted-foreground">
        <button type="button" onClick={() => setCreditos((x) => !x)} aria-expanded={creditos} className="font-medium underline-offset-4 hover:underline">
          {creditos ? 'Esconder créditos das imagens' : 'Créditos das imagens'}
        </button>
        {creditos && (
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {AVATARES.map((a) => (
              <li key={a.id}>
                <a href={creditoDoAvatar(a)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                  {a.ator ? `${a.ator} (${a.nome})` : a.nome}, Wikimedia Commons <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Imagem do retrato; se a Wikimedia não responder, mostra as iniciais (nunca o ícone de imagem quebrada). */
function Retrato({ url, nome }: { url: string; nome: string }) {
  const [falhou, setFalhou] = useState(false)
  if (falhou) {
    const iniciais = nome.replace(/^(Dra?|Enf)\.\s+/, '').split(/[\s,]+/).filter((p) => p.length > 2 || p === nome).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
    return <span className="flex h-full w-full items-center justify-center font-heading text-xl font-semibold text-primary">{iniciais}</span>
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFalhou(true)} className="h-full w-full object-cover object-[50%_22%]" />
}

