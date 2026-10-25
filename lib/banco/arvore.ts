import { getDb } from '@/lib/mongodb'

/** Oculto/restrito a cargos — ver lib/banco/visibilidade.ts. Só aparece quando marcado. */
export interface Marcacao {
  isHidden?: boolean
  allowedGroups?: string[]
}

export interface ArvoreDoBanco {
  modulos: Array<{ _id: string; nome: string; ordem: number; totalQuestoes: number } & Marcacao>
  topicos: Array<{
    _id: string
    moduloId: string
    nome: string
    ordem: number
    totalQuestoes: number
  } & Marcacao>
  subtopicos: Array<{
    _id: string
    topicoId: string
    nome: string
    ordem: number
    totalQuestoes: number
  }>
}

/**
 * A árvore inteira do banco numa requisição só.
 *
 * A tela antiga montava a hierarquia com quatro chamadas encadeadas: pedia os
 * períodos, esperava a escolha, pedia os módulos daquele período, esperava,
 * pedia os tópicos… Cada nível só existia depois do clique no anterior, então
 * era impossível VER o catálogo — só navegá-lo às cegas, um select de cada vez.
 *
 * A árvore inteira é pequena (dezenas de módulos, centenas de tópicos): cabe
 * numa resposta e permite desenhar tudo aberto, com contagem, e filtrar sem ir
 * ao servidor a cada tecla.
 *
 * ## Como a contagem é feita — e como ela NÃO pode ser feita
 *
 * A versão anterior contava com um `$lookup` de `banco_questoes` por nível:
 * para cada módulo, cada tópico e cada subtópico, o Mongo montava um ARRAY com
 * as questões daquele nó só para em seguida tirar o `$size` dele. Isso lê o
 * acervo inteiro três vezes e o materializa em memória — e um único documento
 * de questão carrega enunciado, alternativas e explicação, que é justamente o
 * que uma contagem não precisa. Com o banco crescendo, essa era a consulta mais
 * cara da abertura da tela, e ela nem devolvia questão nenhuma.
 *
 * Aqui a contagem vem de UMA varredura com `$facet`: três `$group` sobre a
 * mesma passada, cada um devolvendo `{ id do nó → quantas }`. O cruzamento com
 * os nomes acontece no Node, sobre listas de dezenas de itens.
 */
export async function montarArvoreDoBanco(): Promise<ArvoreDoBanco> {
  const db = await getDb()

  const paraTexto = (v: unknown) => (v == null ? undefined : String(v))

  // Só nome/ordem/pai: os documentos de taxonomia podem ter descrição e outros
  // campos que a árvore da tela não desenha.
  const camposDoNo = { nome: 1, ordem: 1, moduloId: 1, topicoId: 1, isHidden: 1, allowedGroups: 1 }

  // A marcação só entra no JSON quando existe: a árvore sem marcação nenhuma
  // continua do mesmo tamanho de antes.
  const marcacao = (n: any): Marcacao => ({
    ...(n.isHidden === true ? { isHidden: true } : {}),
    ...(Array.isArray(n.allowedGroups) && n.allowedGroups.length > 0 ? { allowedGroups: n.allowedGroups } : {}),
  })

  const [modulos, topicos, subtopicos, contagens] = await Promise.all([
    db.collection('banco_modulos').find({}, { projection: camposDoNo }).toArray(),
    db.collection('banco_topicos').find({}, { projection: camposDoNo }).toArray(),
    db.collection('banco_subtopicos').find({}, { projection: camposDoNo }).toArray(),
    db
      .collection('banco_questoes')
      .aggregate([
        {
          $facet: {
            porModulo: [{ $group: { _id: '$moduloId', total: { $sum: 1 } } }],
            porTopico: [{ $group: { _id: '$topicoId', total: { $sum: 1 } } }],
            // `subtopicoid` com "i" minúsculo é como o campo foi gravado desde
            // a importação original. Corrigir o nome exigiria migrar o acervo.
            porSubtopico: [{ $group: { _id: '$subtopicoid', total: { $sum: 1 } } }],
          },
        },
      ])
      .toArray(),
  ])

  const mapear = (linhas: any[] | undefined) =>
    new Map<string, number>(
      (linhas || [])
        .filter((l) => l._id != null)
        .map((l) => [String(l._id), Number(l.total) || 0]),
    )

  const facetas = (contagens[0] || {}) as Record<string, any[]>
  const porModulo = mapear(facetas.porModulo)
  const porTopico = mapear(facetas.porTopico)
  const porSubtopico = mapear(facetas.porSubtopico)

  return {
    modulos: modulos.map((m: any) => ({
      _id: String(m._id),
      nome: m.nome,
      ordem: m.ordem ?? 0,
      totalQuestoes: porModulo.get(String(m._id)) || 0,
      ...marcacao(m),
    })),
    topicos: topicos.map((t: any) => ({
      _id: String(t._id),
      moduloId: paraTexto(t.moduloId) || '',
      nome: t.nome,
      ordem: t.ordem ?? 0,
      totalQuestoes: porTopico.get(String(t._id)) || 0,
      ...marcacao(t),
    })),
    subtopicos: subtopicos.map((s: any) => ({
      _id: String(s._id),
      topicoId: paraTexto(s.topicoId) || '',
      nome: s.nome,
      ordem: s.ordem ?? 0,
      totalQuestoes: porSubtopico.get(String(s._id)) || 0,
    })),
  }
}
