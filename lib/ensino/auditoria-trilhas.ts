import { gerarSlug } from '@/lib/ensino/taxonomia'
import type { EtapaDaTrilha } from '@/lib/ensino/trilha'

/**
 * A auditoria de referências de Trilha.
 *
 * ══ O PROBLEMA QUE ISTO ENCONTRA ═══════════════════════════════════════
 *
 * Uma etapa não guarda a aula — guarda `{ tipo: 'aula', refId }`, o id do
 * documento em `aulas_postagens`. Na imensa maioria das rotas isso nunca
 * quebra, porque a exclusão de aula (em massa, em cascata pela taxonomia, ou
 * agora também a exclusão avulsa antiga) passa por
 * `excluirAulasComReferencias` (lib/aulas/exclusao.ts), que apaga a aula E
 * limpa a referência no mesmo golpe — a etapa nunca chega a ficar apontando
 * para o vazio.
 *
 * Mas a rota de exclusão avulsa antiga (`/api/aulas/[id]`) só passou a fazer
 * essa limpeza agora; qualquer aula apagada por ela ANTES disso já deixou um
 * `refId` órfão gravado — e é isso que a tela vê como "Aula removida do
 * acervo" (ou, pior, some em silêncio: `/api/ensino/trilhas/[id]` filtra
 * item de aula que não resolve, tanto para o aluno quanto para o editor, e
 * nunca escreve isso de volta no banco — então o órfão fica esperando lá,
 * invisível, até alguém salvar a Trilha por outro motivo e apagá-lo de vez
 * sem ninguém ter decidido isso).
 *
 * ══ POR QUE RECUPERAR PELO TÍTULO, E NÃO SÓ AVISAR ═════════════════════
 *
 * Desde que a importação passou a gravar `rotulo` com o título da aula no
 * momento em que a referência foi criada (ver `lib/ensino/importacao-servidor.ts`
 * e o construtor visual em `app/aulas/gerenciar/trilhas/[id]/page.tsx`), um
 * órfão carrega a pista de quem ele era. Se existir HOJE uma aula com esse
 * título — comparado pela MESMA normalização que a importação já usa para
 * casar aula por título (`gerarSlug`, que resolve maiúscula/minúscula,
 * acento, `—`/`–`/`-` e espaço duplicado por igual) —, a correção é
 * inequívoca: é a mesma aula, só que o id mudou (recriada, reimportada sob
 * um título levemente diferente, etc.).
 *
 * Referências criadas ANTES desta mudança não têm `rotulo` — não há como
 * adivinhar; ficam como "sem título salvo", para revisão manual. É a
 * diferença entre "não sei recuperar automaticamente" e "a aula sumiu": a
 * primeira é honesta sobre o limite da informação disponível, a segunda seria
 * uma afirmação que os dados não sustentam.
 *
 * ══ O QUE ISTO NUNCA FAZ ════════════════════════════════════════════════
 *
 * Só produz um RELATÓRIO — string em, string fora, nenhuma escrita. Quem
 * aplica a correção (a rota `/api/ensino/trilhas/auditoria`) decide, campo a
 * campo, qual `refId` trocar; o item nunca é apagado da etapa por esta
 * função, mesmo quando irrecuperável — sumir de vez é decisão do admin, não
 * efeito colateral de rodar uma auditoria.
 */

export type StatusDaReferencia =
  | 'valida'
  | 'recuperavel'
  | 'ambigua'
  | 'orfa-sem-titulo'
  | 'orfa-irrecuperavel'

export interface CandidatoDeAula {
  id: string
  titulo: string
}

export interface ReferenciaAuditada {
  trilhaId: string
  trilhaTitulo: string
  trilhaSlug?: string
  etapaId: string
  etapaTitulo: string
  itemId: string
  refIdAtual: string
  tituloSalvo?: string
  status: StatusDaReferencia
  /** Só para `recuperavel`: o id para o qual `refIdAtual` deveria apontar. */
  sugestao?: CandidatoDeAula
  /** Só para `ambigua`: mais de uma aula viva com o mesmo título normalizado. */
  candidatos?: CandidatoDeAula[]
}

export interface TrilhaParaAuditar {
  _id: string
  titulo: string
  slug?: string
  etapas: EtapaDaTrilha[]
}

export interface ResumoDaAuditoria {
  trilhasAnalisadas: number
  referencias: number
  validas: number
  recuperaveis: number
  ambiguas: number
  orfasSemTitulo: number
  orfasIrrecuperaveis: number
}

const chaveDeTitulo = (titulo: string) => gerarSlug(titulo)

/**
 * Audita as referências de aula de todas as Trilhas dadas.
 *
 * `idsDeAulasVivas` é o conjunto de ids que hoje existem em `aulas_postagens`
 * — a fonte da verdade sobre "resolve ou não". `aulasPorTitulo` é o mesmo
 * catálogo, indexado por título normalizado, para a tentativa de recuperação;
 * mais de uma aula viva cai na mesma chave normalizada em títulos repetidos
 * (raro, mas o catálogo não impede) — nesse caso a referência vira `ambigua`
 * em vez de a função escolher uma das duas por conta própria.
 */
export function auditarReferenciasDeTrilhas(
  trilhas: TrilhaParaAuditar[],
  idsDeAulasVivas: Set<string>,
  aulasPorTitulo: Map<string, CandidatoDeAula[]>,
): ReferenciaAuditada[] {
  const saida: ReferenciaAuditada[] = []

  for (const trilha of trilhas) {
    for (const etapa of trilha.etapas || []) {
      for (const item of etapa.itens || []) {
        if (item.tipo !== 'aula') continue

        const base = {
          trilhaId: trilha._id,
          trilhaTitulo: trilha.titulo,
          trilhaSlug: trilha.slug,
          etapaId: etapa.id,
          etapaTitulo: etapa.titulo,
          itemId: item.id,
          refIdAtual: item.refId,
          tituloSalvo: item.rotulo,
        }

        if (idsDeAulasVivas.has(item.refId)) {
          saida.push({ ...base, status: 'valida' })
          continue
        }

        if (!item.rotulo) {
          saida.push({ ...base, status: 'orfa-sem-titulo' })
          continue
        }

        const candidatos = aulasPorTitulo.get(chaveDeTitulo(item.rotulo)) || []

        if (candidatos.length === 1) {
          saida.push({ ...base, status: 'recuperavel', sugestao: candidatos[0] })
        } else if (candidatos.length > 1) {
          saida.push({ ...base, status: 'ambigua', candidatos })
        } else {
          saida.push({ ...base, status: 'orfa-irrecuperavel' })
        }
      }
    }
  }

  return saida
}

export function resumirAuditoria(
  trilhasAnalisadas: number,
  referencias: ReferenciaAuditada[],
): ResumoDaAuditoria {
  const contar = (status: StatusDaReferencia) =>
    referencias.filter((r) => r.status === status).length

  return {
    trilhasAnalisadas,
    referencias: referencias.length,
    validas: contar('valida'),
    recuperaveis: contar('recuperavel'),
    ambiguas: contar('ambigua'),
    orfasSemTitulo: contar('orfa-sem-titulo'),
    orfasIrrecuperaveis: contar('orfa-irrecuperavel'),
  }
}

/**
 * Agrupa aulas por título normalizado — o índice que a auditoria usa para
 * propor recuperação.
 *
 * Separado da auditoria em si porque quem chama (a rota da API) já tem a
 * lista de aulas em mãos por outro motivo; construir o índice aqui evita que
 * a rota repita a lógica de normalização por fora desta função.
 */
export function indexarAulasPorTitulo(
  aulas: Array<{ _id: string; titulo: string }>,
): Map<string, CandidatoDeAula[]> {
  const indice = new Map<string, CandidatoDeAula[]>()
  for (const aula of aulas) {
    const chave = chaveDeTitulo(aula.titulo || '')
    if (!chave) continue
    const lista = indice.get(chave) || []
    lista.push({ id: aula._id, titulo: aula.titulo })
    indice.set(chave, lista)
  }
  return indice
}
