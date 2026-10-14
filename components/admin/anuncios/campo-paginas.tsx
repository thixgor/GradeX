'use client'

/**
 * Em que páginas o anúncio na página aparece.
 *
 * Atalhos para as áreas do site, "todas as páginas" e um campo livre para um
 * caminho específico (`/manual-clinico/farmacologia`, `/materiais/loja`...).
 * Cada caminho vale para ele e para tudo abaixo dele — a regra está em
 * `anuncioCasaComPagina` (lib/anuncio-midia.ts).
 */

import { useState } from 'react'
import { Globe2, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ANUNCIO_ROTAS_SEM_EXIBICAO } from '@/lib/anuncio-exibicao'
import { ANUNCIO_PAGINAS_ATALHOS, TODAS_AS_PAGINAS, normalizarCaminho } from '@/lib/anuncio-midia'
import { cn } from '@/lib/utils'

interface CampoPaginasProps {
  value: string[]
  onChange: (paginas: string[]) => void
  onError: (message: string) => void
}

export function CampoPaginas({ value, onChange, onError }: CampoPaginasProps) {
  const [caminho, setCaminho] = useState('')
  const todas = value.includes(TODAS_AS_PAGINAS)
  const atalhos = new Set(ANUNCIO_PAGINAS_ATALHOS.map((a) => a.caminho))
  const personalizados = value.filter((p) => p !== TODAS_AS_PAGINAS && !atalhos.has(p))

  function alternar(p: string) {
    onChange(value.includes(p) ? value.filter((item) => item !== p) : [...value.filter((i) => i !== TODAS_AS_PAGINAS), p])
  }

  function adicionar() {
    const normalizado = normalizarCaminho(caminho.startsWith('/') ? caminho : `/${caminho}`)
    if (!normalizado || normalizado === TODAS_AS_PAGINAS) {
      onError('Caminho inválido. Use algo como /manual-clinico/farmacologia')
      return
    }
    if (!value.includes(normalizado)) onChange([...value.filter((i) => i !== TODAS_AS_PAGINAS), normalizado])
    setCaminho('')
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Páginas onde aparece *</Label>
        <p className="text-xs text-muted-foreground">
          Cada página vale também para tudo abaixo dela: &quot;Manual clínico&quot; inclui farmacologia, ECG, histologia...
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(todas ? [] : [TODAS_AS_PAGINAS])}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition',
          todas ? 'border-[#468152] bg-[#468152]/10' : 'bg-background/70 hover:bg-muted/60',
        )}
      >
        <Globe2 className={cn('h-5 w-5 shrink-0', todas ? 'text-[#468152]' : 'text-muted-foreground')} />
        <span>
          <span className="block text-sm font-bold">Todas as páginas do site</span>
          <span className="block text-xs text-muted-foreground">
            Menos onde anúncio nunca aparece: {ANUNCIO_ROTAS_SEM_EXIBICAO.map((r) => r.motivo.toLowerCase()).slice(0, 4).join(', ')}...
          </span>
        </span>
      </button>

      {!todas && (
        <>
          <div className="flex flex-wrap gap-2">
            {ANUNCIO_PAGINAS_ATALHOS.map((atalho) => {
              const ativo = value.includes(atalho.caminho)
              return (
                <button
                  key={atalho.caminho}
                  type="button"
                  onClick={() => alternar(atalho.caminho)}
                  title={atalho.caminho}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                    ativo
                      ? 'bg-[#468152] text-white shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {atalho.rotulo}
                </button>
              )
            })}
          </div>

          <div className="flex gap-2">
            <Input
              value={caminho}
              onChange={(event) => setCaminho(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  adicionar()
                }
              }}
              placeholder="/manual-clinico/farmacologia"
            />
            <Button type="button" variant="outline" onClick={adicionar} disabled={!caminho.trim()}>
              <Plus className="mr-1 h-4 w-4" />
              Adicionar
            </Button>
          </div>

          {personalizados.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {personalizados.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#468152] px-2.5 py-1 text-xs font-bold text-white"
                >
                  {p}
                  <button type="button" onClick={() => alternar(p)} aria-label={`Remover ${p}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** "Dashboard, Manual clínico +2" — resumo para a lista do admin. */
export function resumirPaginas(paginas: string[] | undefined): string {
  if (!paginas || paginas.length === 0) return 'Nenhuma página'
  if (paginas.includes(TODAS_AS_PAGINAS)) return 'Todas as páginas'
  const nomes = paginas.map(
    (p) => ANUNCIO_PAGINAS_ATALHOS.find((a) => a.caminho === p)?.rotulo.replace(/ \(.*\)$/, '') ?? p,
  )
  return nomes.length > 2 ? `${nomes.slice(0, 2).join(', ')} +${nomes.length - 2}` : nomes.join(', ')
}
