import { ObjectId, type Db } from 'mongodb'
import {
  aplicarBatida,
  PERCENTUAL_CONCLUSAO_PADRAO,
  SEGUNDOS_MINIMOS_PARA_RETOMAR,
  type ProgressoDaAula,
} from '@/lib/aulas/progresso'

/**
 * Persistência do progresso — a ponte entre a lógica pura e o Mongo.
 *
 * Coleção `aulas_progresso`, um registro por (usuário, aula). O modelo antigo
 * guardava conclusão num array dentro da própria aula
 * (`aulas_postagens.usuariosConcluidos`), que só respondia "concluiu?" e crescia
 * dentro do documento: uma aula com 5 mil alunos carregava 5 mil IDs a cada
 * abertura, para todo mundo.
 *
 * A migração é por leitura, não por script (§45): quem já concluiu aulas no
 * modelo antigo continua vendo-as concluídas, porque `lerProgresso` funde as
 * duas fontes. Nada é apagado, e a rota antiga de conclusão segue funcionando —
 * ela só passou a escrever nos dois lugares.
 */

const COLECAO = 'aulas_progresso'

export interface DocumentoProgresso extends ProgressoDaAula {
  _id?: ObjectId
}

function chave(usuarioId: string, aulaId: string) {
  return { usuarioId, aulaId }
}

/**
 * Progresso de várias aulas de uma vez.
 *
 * Sempre em lote: a biblioteca precisa do progresso de dezenas de aulas para
 * desenhar as barras, e uma consulta por aula transformaria a abertura da
 * página em N requisições ao banco.
 */
export async function lerProgressoEmLote(
  db: Db,
  usuarioId: string,
  aulaIds: string[],
): Promise<Map<string, ProgressoDaAula>> {
  const mapa = new Map<string, ProgressoDaAula>()
  if (!usuarioId || aulaIds.length === 0) return mapa

  const registros = await db.collection<DocumentoProgresso>(COLECAO)
    .find({ usuarioId, aulaId: { $in: aulaIds } })
    .toArray()

  for (const registro of registros) mapa.set(registro.aulaId, registro)

  // Conclusões do modelo antigo entram para as aulas que ainda não têm registro
  // novo. Sem isto, quem já tinha terminado um curso inteiro veria tudo zerado
  // no dia do deploy — a pior forma possível de estrear uma reformulação.
  const semRegistro = aulaIds.filter((id) => !mapa.has(id))
  if (semRegistro.length > 0) {
    const legado = await db.collection('aulas_postagens')
      .find(
        {
          _id: { $in: semRegistro.filter(ObjectId.isValid).map((id) => new ObjectId(id)) } as any,
          usuariosConcluidos: usuarioId,
        },
        { projection: { _id: 1 } },
      )
      .toArray()

    for (const aula of legado) {
      mapa.set(String(aula._id), {
        aulaId: String(aula._id),
        usuarioId,
        posicaoSegundos: 0,
        duracaoSegundos: 0,
        percentual: 100,
        concluida: true,
        concluidaManualmente: true,
        atualizadoEm: new Date(0),
      })
    }
  }

  return mapa
}

export async function lerProgresso(
  db: Db,
  usuarioId: string,
  aulaId: string,
): Promise<ProgressoDaAula | null> {
  const mapa = await lerProgressoEmLote(db, usuarioId, [aulaId])
  return mapa.get(aulaId) || null
}

/**
 * Salva uma batida do player.
 *
 * Devolve o progresso resultante para a tela não precisar recalcular nada — o
 * servidor é quem decide se a aula virou concluída, e a UI só reflete.
 */
export async function salvarBatida(
  db: Db,
  usuarioId: string,
  aulaId: string,
  batida: { posicaoSegundos: number; duracaoSegundos?: number; limiteConclusao?: number },
  opcoes: {
    /**
     * Consultado só no instante em que a batida CONCLUIRIA a aula.
     *
     * Existe por causa da avaliação obrigatória (§39): sem isso, a trava valeria
     * apenas no botão "marcar como concluída" e o player concluiria a aula
     * sozinho aos 90%, que é o caminho que quase todo aluno percorre. A
     * pergunta é feita na transição, e não a cada batida, porque o PUT de
     * progresso roda de poucos em poucos segundos e precisa continuar barato.
     */
    podeConcluir?: () => Promise<boolean>
  } = {},
): Promise<ProgressoDaAula> {
  const anterior = await lerProgresso(db, usuarioId, aulaId)
  let calculado = aplicarBatida(anterior, {
    ...batida,
    limiteConclusao: batida.limiteConclusao ?? PERCENTUAL_CONCLUSAO_PADRAO,
  })

  if (calculado.concluida && !anterior?.concluida && opcoes.podeConcluir) {
    if (!(await opcoes.podeConcluir())) {
      // O percentual assistido continua valendo — o que fica pendente é só o
      // carimbo de concluída. Zerar o progresso puniria quem assistiu tudo.
      calculado = { ...calculado, concluida: false, concluidaEm: null }
    }
  }

  const documento: ProgressoDaAula = {
    aulaId,
    usuarioId,
    concluidaManualmente: anterior?.concluidaManualmente,
    ...calculado,
  }

  await db.collection<DocumentoProgresso>(COLECAO).updateOne(
    chave(usuarioId, aulaId),
    { $set: documento },
    { upsert: true },
  )

  // A conclusão automática precisa refletir no array antigo enquanto houver
  // telas lendo dele — é o que mantém as duas visões concordando durante a
  // transição.
  if (calculado.concluida && !anterior?.concluida && ObjectId.isValid(aulaId)) {
    await db.collection('aulas_postagens').updateOne(
      { _id: new ObjectId(aulaId) as any },
      { $addToSet: { usuariosConcluidos: usuarioId } },
    )
  }

  return documento
}

/** Conclusão marcada à mão pelo aluno (§34) — vale mesmo sem assistir tudo. */
export async function definirConclusaoManual(
  db: Db,
  usuarioId: string,
  aulaId: string,
  concluida: boolean,
): Promise<ProgressoDaAula> {
  const anterior = await lerProgresso(db, usuarioId, aulaId)
  const agora = new Date()

  const documento: ProgressoDaAula = {
    aulaId,
    usuarioId,
    posicaoSegundos: anterior?.posicaoSegundos || 0,
    duracaoSegundos: anterior?.duracaoSegundos || 0,
    // Desmarcar devolve o percentual real assistido; marcar preenche a barra.
    percentual: concluida ? 100 : Math.min(anterior?.percentual || 0, 99),
    concluida,
    concluidaEm: concluida ? (anterior?.concluidaEm || agora) : null,
    concluidaManualmente: concluida,
    atualizadoEm: agora,
  }

  await db.collection<DocumentoProgresso>(COLECAO).updateOne(
    chave(usuarioId, aulaId),
    { $set: documento },
    { upsert: true },
  )

  if (ObjectId.isValid(aulaId)) {
    await db.collection('aulas_postagens').updateOne(
      { _id: new ObjectId(aulaId) as any },
      concluida
        ? { $addToSet: { usuariosConcluidos: usuarioId } }
        : { $pull: { usuariosConcluidos: usuarioId } } as any,
    )
  }

  return documento
}

/**
 * As aulas que o aluno estava assistindo — alimenta "Continue estudando" (§35).
 *
 * Só o que está em andamento: aula concluída não é "continuar", é histórico.
 *
 * ══ POR QUE O CORTE É EM SEGUNDOS, E NÃO EM `percentual > 0` ═══════════
 *
 * Era `percentual > 0`, e isso deixava entrar coisa que ninguém assistiu. O
 * player grava a cada dez segundos, ao pausar e ao sair da aula — então abrir
 * uma aula, deixar o vídeo rodar dois segundos enquanto se lê o título e sair
 * já grava uma batida. Em vídeo curto, dois segundos arredondam para 1%, e 1%
 * é maior que zero: a aula subia para o TOPO da home (a lista é ordenada por
 * `atualizadoEm`) como a próxima coisa a fazer, com o título "Bom te ver de
 * volta" em cima — de um vídeo que a pessoa nunca viu.
 *
 * O corte agora é o mesmo `SEGUNDOS_MINIMOS_PARA_RETOMAR` que `podeRetomar`
 * usa para decidir se vale oferecer "continuar de 18:42". Ter as duas
 * perguntas — "entra na lista de retomada?" e "dá para retomar num ponto?" —
 * respondidas pelo mesmo número é o que impede a home de anunciar uma
 * retomada que a própria aula depois se recusa a oferecer.
 *
 * Aula em iframe (YouTube, Vimeo…) continua de fora, como já estava: o
 * navegador não deixa ler o tempo de outro domínio, então a posição dela é
 * sempre 0 e não existe evidência nenhuma de que foi assistida. Ela aparece no
 * histórico, que é o lugar de "passei por aqui" — não em "continue de onde
 * parou", que promete um ponto que não existe.
 */
export async function lerEmAndamento(
  db: Db,
  usuarioId: string,
  limite = 8,
): Promise<ProgressoDaAula[]> {
  if (!usuarioId) return []
  return db.collection<DocumentoProgresso>(COLECAO)
    .find({
      usuarioId,
      concluida: false,
      posicaoSegundos: { $gte: SEGUNDOS_MINIMOS_PARA_RETOMAR },
    })
    .sort({ atualizadoEm: -1 })
    .limit(Math.max(1, Math.min(50, limite)))
    .toArray()
}

/** Índices que sustentam as consultas acima. Idempotente. */
export async function garantirIndicesDeProgresso(db: Db) {
  const colecao = db.collection(COLECAO)
  await Promise.all([
    colecao.createIndex({ usuarioId: 1, aulaId: 1 }, { unique: true }),
    colecao.createIndex({ usuarioId: 1, atualizadoEm: -1 }),
  ])
}
