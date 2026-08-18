'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, FolderTree, Loader2, Plus, Search, X } from 'lucide-react'
import {
  buscarAssuntos,
  listarAssuntos,
  modulosOrdenados,
  type Catalogo,
} from '@/lib/banco/catalogo'
import { cn } from '@/lib/utils'

/**
 * Onde a questão fica: um campo só, com busca.
 *
 * Eram quatro `<select>` encadeados — Período, Módulo, Tópico, Subtópico — e
 * cada um só ganhava opções depois de o anterior ser respondido, com uma
 * requisição a cada passo. Para mexer no enunciado de uma questão de arritmia
 * era preciso lembrar em que período estava o módulo que continha o tópico.
 *
 * Aqui o tópico é procurado pelo nome, com o módulo dele à vista, e escolher o
 * tópico já define o módulo — que é o que o banco guarda de qualquer forma. O
 * catálogo inteiro já está em memória, então a busca não vai ao servidor.
 */

const LIMITE_VISIVEL = 60

export function SeletorDeAssunto({
  catalogo,
  moduloId,
  topicoId,
  onEscolher,
  onCatalogoMudou,
  desabilitado = false,
}: {
  catalogo: Catalogo
  moduloId: string
  topicoId: string
  onEscolher: (escolha: { moduloId: string; topicoId: string }) => void
  /** Chamado depois de criar um tópico, para a tela recarregar o catálogo. */
  onCatalogoMudou: () => Promise<void> | void
  desabilitado?: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [criando, setCriando] = useState(false)
  const [nomeNovo, setNomeNovo] = useState('')
  const [moduloNovo, setModuloNovo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const campoBusca = useRef<HTMLInputElement>(null)

  const assuntos = useMemo(() => listarAssuntos(catalogo), [catalogo])
  const encontrados = useMemo(() => buscarAssuntos(assuntos, busca), [assuntos, busca])
  const escolhido = useMemo(() => assuntos.find((a) => a.topicoId === topicoId), [assuntos, topicoId])
  const modulos = useMemo(() => modulosOrdenados(catalogo), [catalogo])

  useEffect(() => {
    if (aberto && !criando) campoBusca.current?.focus()
  }, [aberto, criando])

  // O módulo do tópico atual é o palpite certo para "criar tópico aqui do lado".
  useEffect(() => {
    if (criando && !moduloNovo) setModuloNovo(moduloId || modulos[0]?._id || '')
  }, [criando, moduloNovo, moduloId, modulos])

  async function criarTopico() {
    const nome = nomeNovo.trim()
    if (!nome || !moduloNovo) return

    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/admin/banco/topicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduloId: moduloNovo, nome }),
      })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(dados.error || 'Não foi possível criar o tópico')
        return
      }

      await onCatalogoMudou()
      onEscolher({ moduloId: moduloNovo, topicoId: String(dados.topico._id) })
      setNomeNovo('')
      setCriando(false)
      setAberto(false)
    } catch {
      setErro('Não foi possível criar o tópico')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      onKeyDown={(e) => {
        // Esc fecha o painel, não o formulário inteiro: quem está procurando um
        // tópico espera desistir da BUSCA, não da edição da questão.
        if (e.key === 'Escape' && aberto) {
          e.stopPropagation()
          e.preventDefault()
          if (criando) setCriando(false)
          else setAberto(false)
        }
      }}
    >
      <button
        type="button"
        disabled={desabilitado}
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left text-sm transition',
          'hover:border-primary/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10',
          desabilitado && 'cursor-not-allowed opacity-50',
          !escolhido && 'text-muted-foreground',
        )}
      >
        <FolderTree className="h-4 w-4 flex-none text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">
          {escolhido ? escolhido.caminho : 'Escolher módulo e tópico…'}
        </span>
        <ChevronDown className={cn('h-4 w-4 flex-none text-muted-foreground transition', aberto && 'rotate-180')} />
      </button>

      {/* Painel embutido, não flutuante: o formulário já vive dentro de um
          diálogo que rola, e um menu posicionado por cima dele descola do campo
          na primeira rolagem. */}
      {aberto ? (
        <div className="mt-2 rounded-xl border border-border bg-card p-2">
          {criando ? (
            <div className="space-y-2">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Novo tópico
              </p>
              <select
                value={moduloNovo}
                onChange={(e) => setModuloNovo(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
              >
                {modulos.length === 0 ? <option value="">Nenhum módulo cadastrado</option> : null}
                {modulos.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.nome}
                  </option>
                ))}
              </select>
              <input
                value={nomeNovo}
                onChange={(e) => setNomeNovo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void criarTopico()
                  }
                }}
                placeholder="Nome do tópico"
                autoFocus
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
              />
              {erro ? <p className="px-1 text-[12px] text-red-500">{erro}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void criarTopico()}
                  disabled={salvando || !nomeNovo.trim() || !moduloNovo}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Criar e usar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCriando(false)
                    setErro('')
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={campoBusca}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar módulo ou tópico…"
                  className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-8 text-[13px] outline-none focus:border-primary/50"
                />
                {busca ? (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    aria-label="Limpar busca"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>

              <div className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
                {encontrados.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Nenhum tópico com esse nome.
                  </p>
                ) : (
                  encontrados.slice(0, LIMITE_VISIVEL).map((assunto) => {
                    const marcado = assunto.topicoId === topicoId
                    return (
                      <button
                        key={assunto.topicoId}
                        type="button"
                        onClick={() => {
                          onEscolher({ moduloId: assunto.moduloId, topicoId: assunto.topicoId })
                          setAberto(false)
                          setBusca('')
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition hover:bg-muted',
                          marcado && 'bg-primary/10 text-primary',
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {assunto.moduloNome}
                          </span>
                          <span className="block truncate font-medium">{assunto.topicoNome}</span>
                        </span>
                        <span className="flex-none rounded bg-muted px-1.5 text-[10.5px] font-semibold tabular-nums text-muted-foreground">
                          {assunto.totalQuestoes}
                        </span>
                        {marcado ? <Check className="h-3.5 w-3.5 flex-none" /> : null}
                      </button>
                    )
                  })
                )}
                {encontrados.length > LIMITE_VISIVEL ? (
                  <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                    e mais {encontrados.length - LIMITE_VISIVEL} — refine a busca
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setCriando(true)}
                className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar tópico
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
