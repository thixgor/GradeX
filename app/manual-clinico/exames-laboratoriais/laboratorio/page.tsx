import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { LaboratorioVirtual } from '@/components/exames-laboratoriais/laboratorio'
import { CENARIOS } from '@/lib/exames-laboratoriais/laboratorio-virtual'

export const metadata: Metadata = {
  title: 'Laboratório Virtual — gere exames para praticar | DomineAqui Lab',
  description:
    'Gere exames laboratoriais fictícios por doença ou por painel, com contexto clínico. No modo desafio você interpreta primeiro e só depois vê a resposta comentada.',
}

/**
 * O Laboratório Virtual.
 *
 * A página é fina de propósito: o motor inteiro vive no componente de cliente,
 * porque a geração precisa acontecer no navegador — a pessoa clica e o exame
 * aparece, sem ida ao servidor. O gerador carrega apenas a tabela de faixas de
 * referência e os cenários, não o conteúdo clínico completo.
 */
export default function PaginaDoLaboratorio() {
  return (
    <AreaDosExames alvo="o Laboratório Virtual">
      <CabecalhoDaSecao
        titulo="Laboratório Virtual"
        subtitulo={`${CENARIOS.length} cenários clínicos. Os valores mudam a cada geração, mantendo o padrão fisiopatológico da condição — é o padrão que se aprende a reconhecer, não o caso.`}
      />

      <div className="container mx-auto max-w-4xl px-4 pb-16 pt-6">
        <div className="mb-6 rounded-xl border border-border bg-muted/25 px-4 py-3.5">
          <p className="text-sm font-bold">Como usar</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Escolha um cenário (ou sorteie). Com o modo desafio ligado você recebe só o contexto clínico e os valores;
            tente identificar as alterações, o padrão e a hipótese antes de pedir a interpretação. Toque em qualquer
            linha do laudo para abrir a ficha daquele marcador.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Todos os pacientes e valores são gerados para estudo. Nenhum dado provém de paciente real.
          </p>
        </div>

        <LaboratorioVirtual />
      </div>
    </AreaDosExames>
  )
}
