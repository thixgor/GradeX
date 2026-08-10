import { CalendarClock, ShieldQuestion, UserCheck } from 'lucide-react'

import type { RevisaoBiomedica } from '@/lib/histopatologia/esquemas'
import { AVISO_EDUCACIONAL } from '@/lib/histopatologia/direitos'
import { MARCA_DE_REVISAO } from './tema'

/**
 * Tarja de estado editorial.
 *
 * Aparece **antes** do conteúdo, não no rodapé. A ordem é a mensagem: quem
 * chega numa página de patologia precisa saber que está lendo texto ainda não
 * revisado por profissional habilitado antes de ler o texto, não depois.
 *
 * As pendências ficam à vista em vez de escondidas num campo interno. Elas são a
 * lista do que falta para publicar — e publicar aqui não é um botão, é um
 * processo com revisor identificado, registro profissional e data.
 */
export function PainelDeRevisao({ revisao }: { revisao: RevisaoBiomedica }) {
  const marca = MARCA_DE_REVISAO[revisao.estado]
  const publicado = revisao.estado === 'publicado'

  return (
    <aside
      aria-labelledby="estado-editorial"
      className={`rounded-xl border p-4 ${publicado ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="estado-editorial" className="sr-only">
          Estado editorial deste conteúdo
        </h2>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${marca.classe}`}>
          <span aria-hidden>{marca.simbolo}</span>
          {marca.rotulo}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          Atualizado em {revisao.atualizadoEm} · versão {revisao.versao}
        </span>
        {revisao.revisor && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5" aria-hidden />
            Revisado por {revisao.revisor}
            {revisao.registroProfissional ? ` (${revisao.registroProfissional})` : ''}
            {revisao.revisadoEm ? ` em ${revisao.revisadoEm}` : ''}
          </span>
        )}
      </div>

      {!publicado && (
        <p className="mt-2.5 text-xs leading-relaxed">
          Este texto foi escrito pela edição do Domine Aqui e{' '}
          <strong>ainda não passou por revisão de profissional habilitado</strong>. Use-o para
          estudar o raciocínio morfológico, não como referência para conduta ou laudo.
        </p>
      )}

      {revisao.pendencias.length > 0 && (
        <details className="mt-2.5">
          <summary className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <ShieldQuestion className="h-3.5 w-3.5" aria-hidden />
            O que falta para publicar ({revisao.pendencias.length})
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] leading-relaxed text-muted-foreground">
            {revisao.pendencias.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-2.5 border-t border-border/60 pt-2 text-[10px] leading-relaxed text-muted-foreground">
        {AVISO_EDUCACIONAL}
      </p>
    </aside>
  )
}
