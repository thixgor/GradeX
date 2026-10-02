'use client'

import { ShieldCheck } from 'lucide-react'
import { useGruposDeAcesso, type GrupoDeAcesso } from '@/hooks/use-cargos'

/**
 * Marcar "só estes cargos veem" — grupos de /provas e módulos/tópicos do Banco.
 *
 * O mesmo vocabulário da restrição dos materiais (ver
 * `lib/restricao-por-cargo.ts`): os cargos do registro mais o `monitor`.
 * Nenhum marcado = todo mundo vê.
 */
export function SeletorDeCargos({
  valor,
  onChange,
  descricao = 'Deixe tudo desmarcado para liberar a todos.',
  desabilitado,
}: {
  valor: string[]
  onChange: (cargos: string[]) => void
  descricao?: string
  desabilitado?: boolean
}) {
  const grupos = useGruposDeAcesso()

  return (
    <div className="space-y-2 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-medium">Visível só para os cargos</span>
      </div>
      <p className="text-xs text-muted-foreground">{descricao}</p>
      <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
        {grupos.map((grupo) => {
          const marcado = valor.includes(grupo.id)
          return (
            <label
              key={grupo.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all ${marcado ? '' : 'border-muted hover:border-muted-foreground/30'}`}
              style={marcado ? { color: grupo.color, background: grupo.color + '15', borderColor: grupo.color + '50' } : {}}
            >
              <input
                type="checkbox"
                checked={marcado}
                disabled={desabilitado}
                onChange={(e) =>
                  onChange(e.target.checked ? [...valor, grupo.id] : valor.filter((g) => g !== grupo.id))
                }
                className="rounded"
                style={marcado ? { accentColor: grupo.color } : {}}
              />
              <span className="text-sm">{grupo.label}</span>
            </label>
          )
        })}
      </div>
      {valor.length > 0 ? (
        <p className="flex items-center gap-1 pt-1 text-xs text-amber-600 dark:text-amber-400">
          <ShieldCheck className="h-3 w-3" />
          Apenas {rotulosDosCargos(valor, grupos)} verão
        </p>
      ) : null}
    </div>
  )
}

export function rotulosDosCargos(cargos: string[], grupos: GrupoDeAcesso[]): string {
  return cargos.map((c) => grupos.find((g) => g.id === c)?.label || c).join(', ')
}

/** Selo compacto "Só Plus+, Quest+" para o admin ver de relance o que está restrito. */
export function SeloDeCargos({ cargos, className = '' }: { cargos?: string[] | null; className?: string }) {
  const grupos = useGruposDeAcesso()
  if (!cargos || cargos.length === 0) return null
  const texto = rotulosDosCargos(cargos, grupos)
  return (
    <span
      title={`Visível só para: ${texto}`}
      className={`inline-flex max-w-full items-center gap-1 truncate rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300 ${className}`}
    >
      <ShieldCheck className="h-3 w-3 flex-none" />
      <span className="truncate">Só {texto}</span>
    </span>
  )
}
