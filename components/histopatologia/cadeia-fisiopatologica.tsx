import type { AplicacaoDeMecanismoResolvida, EtapaCausal } from './tipos'

const ROTULO_DE_ETAPA: Record<EtapaCausal['etapa'], string> = {
  gatilho: 'Gatilho / etiologia',
  alvo: 'Alvo molecular ou celular',
  'resposta-celular': 'Resposta celular',
  'resposta-tecidual': 'Resposta tecidual',
  morfologia: 'Achado morfológico',
  disfuncao: 'Perda ou alteração de função',
  clinica: 'Manifestação clínica',
  complicacao: 'Complicação',
}

/**
 * Cadeia causal, visual e textual ao mesmo tempo.
 *
 * ## Por que uma lista ordenada, e não um diagrama
 *
 * O plano pede a cadeia "disponível visualmente e como texto" (§6). A tentação é
 * desenhar um fluxograma em SVG e acrescentar um `aria-label` resumido — o que
 * entrega, a quem usa leitor de tela, uma versão empobrecida do conteúdo
 * principal. Aqui a estrutura semântica **é** a lista ordenada: cada etapa é um
 * item numerado com título e explicação causal, e as setas são decoração
 * (`aria-hidden`) sobre uma estrutura que já se lê sozinha. Ninguém recebe
 * versão resumida.
 *
 * ## Por que cada etapa exige `porQue`
 *
 * O schema torna o campo obrigatório. Uma cadeia de substantivos ligados por
 * setas — "isquemia → necrose → fibrose" — parece explicação e não é: ela nomeia
 * a sequência sem dizer por que cada passo produz o seguinte. É exatamente o
 * modo de escrever que o plano proíbe, e o contrato de dados o impede.
 */
export function CadeiaFisiopatologica({
  etapas,
  mecanismos,
}: {
  etapas: EtapaCausal[]
  mecanismos: AplicacaoDeMecanismoResolvida[]
}) {
  if (etapas.length === 0 && mecanismos.length === 0) {
    return <EmPreparacao />
  }

  return (
    <div className="space-y-6">
      {mecanismos.length > 0 && (
        <section aria-labelledby="mecanismo-geral">
          <h3 id="mecanismo-geral" className="mb-2 text-sm font-bold">
            Mecanismo patológico geral
          </h3>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            O conceito reutilizável primeiro, a aplicação a esta doença depois. Separar os dois é o
            que permite reconhecer o mesmo mecanismo em outro órgão.
          </p>
          <ul className="space-y-3">
            {mecanismos.map((m) => (
              <li key={m.id} className="rounded-xl border border-border bg-card p-3.5">
                <p className="text-sm font-bold">{m.nome}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.conceito}</p>
                <p className="mt-2 border-t border-border pt-2 text-xs leading-relaxed">
                  <span className="font-bold">Nesta doença: </span>
                  {m.aplicacao}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {etapas.length > 0 && (
        <section aria-labelledby="cadeia-causal">
          <h3 id="cadeia-causal" className="mb-2 text-sm font-bold">
            Cadeia causal específica
          </h3>
          <ol className="relative space-y-0">
            {etapas.map((etapa, i) => (
              <li key={`${etapa.etapa}-${i}`} className="relative pl-9">
                {/* Trilho vertical: decoração pura sobre a lista numerada. */}
                {i < etapas.length - 1 && (
                  <span
                    className="absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px bg-border"
                    aria-hidden
                  />
                )}
                <span
                  className="absolute left-0 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-[11px] font-black"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="pb-5">
                  <p className="editorial-mark text-[10px]">{ROTULO_DE_ETAPA[etapa.etapa]}</p>
                  <p className="mt-0.5 text-sm font-bold leading-snug">{etapa.titulo}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{etapa.porQue}</p>
                  {etapa.achadoAssociado && (
                    <p className="mt-1.5 rounded-md border border-teal-600/25 bg-teal-500/5 px-2.5 py-1.5 text-[11px] leading-relaxed">
                      <span className="font-bold">Na lâmina: </span>
                      {etapa.achadoAssociado}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

export function EmPreparacao({ o = 'Esta seção' }: { o?: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
      {o} está em preparação. O acervo de origem não fornece este conteúdo, e ele só entra aqui
      escrito com fonte e submetido a revisão — preencher a lacuna com texto genérico seria pior do
      que deixá-la à vista.
    </p>
  )
}
