'use client'

import { Search, X } from 'lucide-react'
import './manual-vidro.css'

/**
 * O campo de busca de todo catálogo do Manual (Patologias, Farmacologia,
 * Ferramentas…): a mesma pílula de vidro, o mesmo lugar, o mesmo gesto.
 * Reconhecer é mais barato que lembrar — quem buscou um fármaco já sabe buscar
 * uma calculadora.
 */
export function BuscaDoManual({
  valor,
  aoMudar,
  placeholder,
  rotulo,
  autoFocus,
  className = '',
}: {
  valor: string
  aoMudar: (v: string) => void
  placeholder: string
  /** Nome acessível do campo. */
  rotulo: string
  autoFocus?: boolean
  className?: string
}) {
  return (
    <div className={`ck-escopo mc-busca ${className}`} role="search">
      <Search aria-hidden />
      <input
        type="search"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        aria-label={rotulo}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
      />
      {valor && (
        <button type="button" onClick={() => aoMudar('')} className="mc-busca-limpar" aria-label="Limpar busca">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
