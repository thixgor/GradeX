'use client'

import Link from 'next/link'
import { useXp } from './xp-provider'
import { AnelDeNivel, estiloDaLiga } from './pecas'

/**
 * O XP no rodapé do menu: anel do nível, liga, barra até o próximo nível e o
 * XP da semana. Recolhido, sobra só o anel com o número — a doca continua
 * dizendo "você está no nível 12" sem precisar de rótulo.
 */
export function XpDoMenu({ recolhido, aoNavegar }: { recolhido: boolean; aoNavegar?: () => void }) {
  const { dados } = useXp()
  if (!dados) return null
  const { nivel } = dados

  return (
    <Link
      href="/ranking"
      prefetch={false}
      onClick={aoNavegar}
      className="xp-menu"
      style={{ ...estiloDaLiga(nivel.liga), justifyContent: recolhido ? 'center' : undefined, padding: recolhido ? 6 : undefined }}
      title={recolhido ? `Nível ${nivel.nivel} · ${dados.total.toLocaleString('pt-BR')} XP` : undefined}
      aria-label={`Nível ${nivel.nivel}, liga ${nivel.liga.nome}, ${dados.total.toLocaleString('pt-BR')} XP. Abrir o ranking`}
    >
      <AnelDeNivel nivel={nivel.nivel} progresso={nivel.progresso} liga={nivel.liga} tamanho={38} espessura={3.5} />
      {!recolhido && (
        <span className="min-w-0 flex-1">
          <span className="xp-menu-linha">
            <span className="truncate">Nível {nivel.nivel} · <span className="xp-menu-liga">{nivel.liga.nome}</span></span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{dados.total.toLocaleString('pt-BR')} XP</span>
          </span>
          <span className="xp-menu-barra" aria-hidden>
            <i style={{ transform: `scaleX(${nivel.progresso})` }} />
          </span>
          <span className="xp-menu-sub block truncate">
            {dados.semana > 0 ? `+${dados.semana.toLocaleString('pt-BR')} XP esta semana` : 'Estude hoje e entre no ranking da semana'}
            {dados.posicaoSemana ? ` · ${dados.posicaoSemana}º` : ''}
          </span>
        </span>
      )}
    </Link>
  )
}
