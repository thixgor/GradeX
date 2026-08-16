import { type Db } from 'mongodb'

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
