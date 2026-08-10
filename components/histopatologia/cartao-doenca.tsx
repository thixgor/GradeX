import Link from 'next/link'

import type { ResumoDeDoenca } from '@/lib/histopatologia/esquemas'
import { rotaDaDoenca } from '@/lib/histopatologia/rotas'
import { MARCA_DE_NATUREZA, MARCA_DE_REVISAO } from './tema'

/**
 * Cartão de doença canônica.
 *
 * Mostra os dois estados que governam o módulo — revisão e natureza — junto do
 * nome, e não escondidos atrás de um clique. Quem varre uma lista de doenças
 * precisa saber, antes de entrar, o que já foi revisado.
 *
 * Os contadores de mídia exibem **presença por modalidade**, e não um total
 * inventado. Só as mídias curadas de uma doença têm contagem exata; anunciar um
 * número aproximado num cartão seria dar aparência de precisão a uma estimativa.
 */
export function CartaoDeDoenca({ doenca }: { doenca: ResumoDeDoenca }) {
  const revisao = MARCA_DE_REVISAO[doenca.estadoDeRevisao]
  const natureza = MARCA_DE_NATUREZA[doenca.natureza] ?? MARCA_DE_NATUREZA.indefinida
  const modalidades = Object.entries(doenca.midias).filter(([, n]) => n > 0)

  return (
    <Link
      href={rotaDaDoenca(doenca.slug)}
      className="flex h-full min-h-[44px] flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-teal-600/50"
    >
      <div className="mb-2 flex flex-wrap gap-1.5 text-[10px] font-bold">
        <span className={`rounded-full border px-2 py-0.5 ${revisao.classe}`}>
          <span aria-hidden>{revisao.simbolo}</span> {revisao.rotulo}
        </span>
        <span className={`rounded-full border px-2 py-0.5 ${natureza.classe}`}>
          <span aria-hidden>{natureza.simbolo}</span> {natureza.rotulo}
        </span>
      </div>

      <p className="text-sm font-bold leading-snug">{doenca.nome}</p>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
        {doenca.definicaoCurta}
      </p>

      <p className="mt-2 text-[11px] text-muted-foreground">{doenca.orgaos.join(' · ')}</p>

      {modalidades.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
          {modalidades.map(([modalidade, n]) => (
            <li key={modalidade} className="rounded-full border border-border px-2 py-0.5">
              {modalidade} · {n}
            </li>
          ))}
          {doenca.temLaminaVirtual && (
            <li className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-violet-800 dark:text-violet-300">
              Com lâmina virtual
            </li>
          )}
        </ul>
      )}
    </Link>
  )
}
