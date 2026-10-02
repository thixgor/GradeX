'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { BookmarkPlus, Check, Loader2, Plus } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { EstudoResumo } from '@/lib/manual-clinico/integracao/tipos'
import { cn } from '@/lib/utils'

import { alterarEstudo, criarEstudo, listarEstudos, rotaDoMeuEstudo } from './api'

/**
 * "+ Meu estudo": guarda um ou vários itens num Estudo Integrado do aluno.
 *
 * Abre um diálogo (e não um menu suspenso) porque no celular o menu some sob o
 * polegar e não comporta o campo de nome do estudo novo. A lista de estudos só
 * é pedida quando o diálogo abre — o botão, repetido em cada cartão, não custa
 * requisição nenhuma enquanto ninguém clica.
 */
export function AdicionarAoEstudo({
  refs,
  tituloSugerido,
  rotulo = 'Meu estudo',
  variante = 'compacto',
  className,
}: {
  refs: string[]
  tituloSugerido: string
  rotulo?: string
  variante?: 'compacto' | 'botao'
  className?: string
}) {
  const [aberto, setAberto] = useState(false)
  const [estudos, setEstudos] = useState<EstudoResumo[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [feito, setFeito] = useState<{ id: string; titulo: string; recusados?: number } | null>(null)
  const [novoTitulo, setNovoTitulo] = useState(tituloSugerido)

  const abrir = useCallback(() => {
    setAberto(true)
    setErro(null)
    setFeito(null)
    setNovoTitulo(tituloSugerido)
    listarEstudos()
      .then(setEstudos)
      .catch((e) => {
        setEstudos([])
        setErro(e.status === 403 ? 'O Estudo Integrado faz parte do Manual Clínico.' : e.message)
      })
  }, [tituloSugerido])

  const adicionar = async (estudo: EstudoResumo) => {
    setSalvando(estudo.id)
    setErro(null)
    try {
      const r = await alterarEstudo(estudo.id, { acao: 'acrescentar', refs })
      setFeito({ id: estudo.id, titulo: estudo.titulo, recusados: r.recusados })
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(null)
    }
  }

  const criar = async () => {
    if (!novoTitulo.trim()) return
    setSalvando('novo')
    setErro(null)
    try {
      const r = await criarEstudo(novoTitulo.trim(), refs)
      setFeito({ id: r.estudo.id, titulo: r.estudo.titulo, recusados: r.recusados })
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(null)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className={cn(
          variante === 'compacto'
            ? 'inline-flex min-h-[36px] items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground'
            : 'inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10',
          className,
        )}
        aria-label={`${rotulo}: guardar no Estudo Integrado`}
      >
        <BookmarkPlus className={variante === 'compacto' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
        {rotulo}
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Guardar no Estudo Integrado</DialogTitle>
            <DialogDescription>
              {refs.length === 1
                ? 'Junte este item a um estudo seu — com tudo dos outros manuais sobre o mesmo tema.'
                : `${refs.length} itens, de vários manuais, num estudo só.`}
            </DialogDescription>
          </DialogHeader>

          {feito ? (
            <div className="space-y-3 py-2">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <Check className="h-4 w-4" aria-hidden /> Guardado em “{feito.titulo}”
              </p>
              {feito.recusados ? (
                <p className="text-xs text-muted-foreground">
                  {feito.recusados} item(ns) ficaram de fora: o estudo chegou ao limite de itens.
                </p>
              ) : null}
              <Link
                href={rotaDoMeuEstudo(feito.id)}
                className="inline-flex min-h-[40px] items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Abrir o estudo
              </Link>
            </div>
          ) : (
            <div className="space-y-4 py-1">
              {erro ? <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-sm text-destructive">{erro}</p> : null}

              {estudos === null ? (
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Carregando seus estudos…
                </p>
              ) : estudos.length > 0 ? (
                <ul className="max-h-60 space-y-1.5 overflow-y-auto">
                  {estudos.map((estudo) => (
                    <li key={estudo.id}>
                      <button
                        type="button"
                        disabled={salvando !== null}
                        onClick={() => adicionar(estudo)}
                        className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border border-border px-3 text-left text-sm transition-colors hover:border-primary/40 disabled:opacity-60"
                      >
                        <span className="min-w-0 truncate font-semibold">{estudo.titulo}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {salvando === estudo.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : `${estudo.total} itens`}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <form
                className="space-y-2 border-t border-border pt-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  criar()
                }}
              >
                <label htmlFor="novo-estudo" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Novo estudo
                </label>
                <div className="flex gap-2">
                  <input
                    id="novo-estudo"
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    maxLength={120}
                    className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
                    placeholder="Ex.: Neoplasias renais"
                  />
                  <button
                    type="submit"
                    disabled={salvando !== null || !novoTitulo.trim()}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {salvando === 'novo' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                    Criar
                  </button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
