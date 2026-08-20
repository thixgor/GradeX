import { ObjectId, type Db } from 'mongodb'

/**
 * Guarda de exclusão da estrutura de aulas (§45).
 *
 * As rotas de DELETE tentavam apagar em cascata as aulas do nó, com um filtro
 * comparando um campo de texto contra um `ObjectId`:
 *
 *     postagens.deleteMany({ topicoId: new ObjectId(id) })
 *
 * Isso nunca casa — `topicoId` é gravado como string. Na prática o efeito era
 * duplo e igualmente ruim: as aulas não eram apagadas (bom), mas ficavam
 * apontando para um pai que deixou de existir, sumiam da biblioteca do aluno e
 * a resposta ainda dizia "0 aula(s) removida(s)" como se estivesse tudo certo.
 *
 * A correção NÃO é fazer a cascata funcionar. Um filtro consertado passaria a
 * apagar de verdade centenas de aulas — com o progresso e as anotações dos
 * alunos junto — em telas onde hoje isso não acontece. Seria transformar um bug
 * inofensivo em perda de dados.
 *
 * Então a exclusão passa a ser guardada: se ainda existe algo pendurado, ela é
 * recusada e diz o que precisa sair antes. Esvaziar o nó é trabalho de um
 * clique no painel (seleção em massa), e a decisão de apagar aula continua
 * sendo tomada olhando para as aulas.
 */

export type TipoExcluivel = 'setor' | 'topico' | 'subtopico' | 'modulo' | 'submodulo'

/** Campo pelo qual os filhos apontam para este tipo. */
const CAMPO_DO_TIPO: Record<TipoExcluivel, string> = {
  setor: 'setorId',
  topico: 'topicoId',
  subtopico: 'subtopicoId',
  modulo: 'moduloId',
  submodulo: 'submoduloId',
}

/** Coleções que podem conter filhos diretos de cada tipo. */
const COLECOES_FILHAS: Record<TipoExcluivel, Array<{ colecao: string; rotulo: string }>> = {
  setor: [
    { colecao: 'aulas_topicos', rotulo: 'tópico(s)' },
    { colecao: 'aulas_subtopicos', rotulo: 'subtópico(s)' },
    { colecao: 'aulas_modulos', rotulo: 'módulo(s)' },
    { colecao: 'aulas_postagens', rotulo: 'aula(s)' },
  ],
  topico: [
    { colecao: 'aulas_subtopicos', rotulo: 'subtópico(s)' },
    { colecao: 'aulas_modulos', rotulo: 'módulo(s)' },
    { colecao: 'aulas_postagens', rotulo: 'aula(s)' },
  ],
  subtopico: [
    { colecao: 'aulas_modulos', rotulo: 'módulo(s)' },
    { colecao: 'aulas_postagens', rotulo: 'aula(s)' },
  ],
  modulo: [
    { colecao: 'aulas_submodulos', rotulo: 'submódulo(s)' },
    { colecao: 'aulas_postagens', rotulo: 'aula(s)' },
  ],
  submodulo: [{ colecao: 'aulas_postagens', rotulo: 'aula(s)' }],
}

export interface Dependentes {
  total: number
  /** Texto pronto para a mensagem: "3 módulo(s) e 12 aula(s)". */
  descricao: string
}

export async function contarDependentes(
  db: Db,
  tipo: TipoExcluivel,
  id: string,
): Promise<Dependentes> {
  const campo = CAMPO_DO_TIPO[tipo]
  const partes: string[] = []
  let total = 0

  for (const { colecao, rotulo } of COLECOES_FILHAS[tipo]) {
    // O id é comparado como texto porque é assim que ele foi gravado — o bug
    // antigo estava exatamente aqui.
    const quantidade = await db.collection(colecao).countDocuments({ [campo]: id }, { limit: 1000 })
    if (quantidade > 0) {
      total += quantidade
      partes.push(`${quantidade} ${rotulo}`)
    }
  }

  const descricao =
    partes.length <= 1
      ? partes.join('')
      : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`

  return { total, descricao }
}

/** Mensagem única para as cinco rotas — o admin merece a mesma explicação. */
export function mensagemDeBloqueio(dependentes: Dependentes): string {
  return `Ainda há ${dependentes.descricao} aqui dentro. Mova ou exclua esse conteúdo antes — assim nada some sem você ver.`
}

/**
 * Apaga um lote de aulas e limpa toda referência a elas — a mesma operação,
 * chamada dos dois lugares que apagam aula de verdade: a exclusão em massa do
 * catálogo (`/api/aulas/lote`) e a exclusão em cascata de um nível da
 * taxonomia nova (`/api/ensino/taxonomia/[id]`, quando pedida com
 * `cascata: true` — ver o comentário da rota).
 *
 * Existir num lugar só é o que importa aqui: as duas rotas destroem conteúdo
 * de verdade, e a limpeza — Trilhas, relacionadas, pré-requisitos, o vínculo
 * de Aula Resumo, progresso, anotações, favoritos — precisa ser IDÊNTICA nas
 * duas, ou uma delas vai deixar buraco silencioso (Trilha apontando para uma
 * aula que já não existe, "conteúdo relacionado" fantasma) que a outra não
 * deixa. Uma cópia da lógica em cada rota divergiria no primeiro ajuste.
 *
 * Nenhuma falha na limpeza derruba a exclusão que já aconteceu — as aulas já
 * foram apagadas quando a limpeza roda, e não há como desfazer isso. O erro só
 * é registrado.
 */
export async function excluirAulasComReferencias(db: Db, aulaIds: string[]): Promise<number> {
  const objectIds = aulaIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))
  if (objectIds.length === 0) return 0

  const r = await db.collection('aulas_postagens').deleteMany({ _id: { $in: objectIds } as any })

  try {
    await Promise.all([
      // Itens dentro das etapas de qualquer Trilha.
      db.collection('ensino_trilhas').updateMany(
        { 'etapas.itens.refId': { $in: aulaIds } },
        { $pull: { 'etapas.$[].itens': { refId: { $in: aulaIds } } } } as any,
      ),
      // Relações que apontavam para as aulas apagadas.
      db.collection('aulas_postagens').updateMany(
        { relacionadas: { $in: aulaIds } },
        { $pull: { relacionadas: { $in: aulaIds } } } as any,
      ),
      db.collection('aulas_postagens').updateMany(
        { 'ensino.prerequisitos': { $in: aulaIds } },
        { $pull: { 'ensino.prerequisitos': { $in: aulaIds } } } as any,
      ),
      // O vínculo com a Aula Resumo, dos dois lados.
      db.collection('aulas_postagens').updateMany(
        { 'ensino.resumoId': { $in: aulaIds } },
        { $set: { 'ensino.resumoId': null } },
      ),
      db.collection('aulas_postagens').updateMany(
        { 'ensino.aulaPrincipalId': { $in: aulaIds } },
        { $set: { 'ensino.aulaPrincipalId': null, 'ensino.tipo': 'aula' } },
      ),
      // Progresso e anotações órfãos: dado de aluno sobre conteúdo que não
      // existe mais só ocupa espaço e distorce as estatísticas.
      db.collection('aulas_progresso').deleteMany({ aulaId: { $in: aulaIds } }),
      db.collection('aulas_anotacoes').deleteMany({ aulaId: { $in: aulaIds } }),
      db.collection('aulas_favoritos').deleteMany({ aulaId: { $in: aulaIds } }),
    ])
  } catch (erroDeLimpeza) {
    console.error('[exclusao] limpeza pós-exclusão:', erroDeLimpeza)
  }

  return r.deletedCount
}
