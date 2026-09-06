import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { prepararProvaParaEntrega, podeVerGabarito } from '@/lib/provas/sanitizar-prova'
import { montarProvaParaAluno, sementeDaProva } from '@/lib/provas/embaralhar'
import { lerPeriodoDoAluno } from '@/lib/provas/periodo-do-aluno'
import { normalizarExcecoes, provaExisteParaPessoa } from '@/lib/provas/visibilidade-da-prova'
import { resolverJanelaDaProva, validarJanelaDoFormulario } from '@/lib/provas/janela-da-prova'
import { interpretarInstante } from '@/lib/provas/horario-local'
import { jaEntrouNaProva } from '@/lib/provas/entrada-na-prova'
import { normalizarPublico } from '@/lib/provas/publico-da-prova'
import { normalizarEsperas, normalizarLiberacoes } from '@/lib/provas/downloads-da-prova'
import { normalizarTravas } from '@/lib/provas/anti-cola'

export const dynamic = 'force-dynamic'

// GET - Buscar prova por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })

    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const isAdmin = session.role === 'admin'

    /*
     * A prova existe para esta pessoa?
     *
     * Eram três checagens soltas aqui — pessoal, oculta e público —, cada uma
     * escrita à mão, e as outras portas da prova (entregar, salvar rascunho,
     * ver resultados) tinham cópias parciais ou nenhuma. Agora as três moram
     * em `provaExisteParaPessoa`, e toda porta faz a mesma pergunta.
     *
     * O endereço da prova é um id que circula em grupo de turma: esconder da
     * lista nunca foi proteger. Aqui ela simplesmente não existe — 404.
     */
    if (!isAdmin) {
      const periodoDoAluno = await lerPeriodoDoAluno(db, session.userId)

      if (!provaExisteParaPessoa(exam, { userId: session.userId, isAdmin, periodo: periodoDoAluno })) {
        return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
      }
    }

    /*
     * O gabarito só sai daqui para quem já pode vê-lo.
     *
     * Numa prova avaliativa, `alternatives[].isCorrect` e `explanation` iam no
     * mesmo JSON que o enunciado — o aluno abria o console no meio da prova e
     * lia as respostas em uma linha. Ver `lib/provas/sanitizar-prova.ts`.
     *
     * A consulta de submissão só roda quando ainda faz diferença: para admin,
     * criador, prova de treino/pessoal ou prova já encerrada o veredito é
     * conhecido sem ir ao banco, e uma prova aberta é o único caso que precisa
     * saber se esta pessoa já entregou.
     */
    const contextoBase = { userId: session.userId, isAdmin }

    /*
     * `jaSubmeteu` é consultado sempre, e não só quando decide o gabarito.
     *
     * A consulta era pulada quando o gabarito já podia ser visto (prova
     * encerrada, treino, admin) — barata, e errada: o campo ia `false` para
     * quem tinha entregue, e é ele que a tela usa para saber que a prova já
     * acabou PARA ESTA PESSOA. O aluno reabria a prova encerrada e recebia o
     * formulário de assinatura, como se pudesse fazer tudo de novo.
     *
     * É uma leitura indexada por (`examId`, `userId`) — a mesma que
     * `check-submission` já fazia numa segunda viagem.
     */
    const jaSubmeteu = !!(await db
      .collection('submissions')
      .findOne({ examId: id, userId: session.userId }, { projection: { _id: 1 } }))

    const entregue = prepararProvaParaEntrega(exam, { ...contextoBase, jaSubmeteu })

    /*
     * O embaralhamento acontece aqui, e não no navegador.
     *
     * Antes a tela da prova sorteava a ordem com `Math.random()` a cada
     * montagem do componente — recarregar a página devolvia outra prova, e a
     * ordem que o aluno viu não existia em lugar nenhum para o relatório
     * reproduzir. A semente estável (`examId:userId`) resolve as duas coisas, e
     * fazer isso no servidor resolve uma terceira: a ordem original nunca chega
     * ao navegador de quem está respondendo.
     *
     * `?ordem=original` devolve a prova como ela está no banco. É o que as
     * telas de admin precisam — editor, correção de discursivas e o PDF em
     * branco — e não revela nada a mais: quem tem direito ao gabarito já o
     * recebe inteiro de qualquer forma.
     */
    const querOrdemOriginal = request.nextUrl.searchParams.get('ordem') === 'original'
    const embaralha =
      !querOrdemOriginal && (exam.shuffleQuestions || (exam as any).shuffleAlternatives)

    const provaFinal = embaralha
      ? {
          ...entregue,
          questions: montarProvaParaAluno(
            entregue.questions || [],
            sementeDaProva(id, session.userId),
            {
              embaralharQuestoes: !!exam.shuffleQuestions,
              embaralharAlternativas: !!(exam as any).shuffleAlternatives,
            },
          ).questions,
        }
      : entregue

    /*
     * Quem já passou pelo portão continua dentro depois que ele fecha.
     *
     * Sem este dado a janela do servidor diria `podeIniciar: false` às 14h para
     * a sala de espera inteira de uma prova cujo portão fechou às 13h50 — o
     * portão é o limite da CHEGADA, não do começo. Ver
     * `lib/provas/entrada-na-prova.ts`.
     */
    const jaEntrou = await jaEntrouNaProva(db, id, session.userId)

    return NextResponse.json({
      exam: provaFinal,
      // A janela sai calculada pelo relógio do SERVIDOR. O cliente desenha
      // portões e contagem regressiva a partir daqui em vez de comparar datas
      // com o relógio da máquina do aluno, que ele controla.
      janela: resolverJanelaDaProva(exam, new Date(), { jaEntrou }),
      jaEntrou,
      jaSubmeteu,
    })
  } catch (error) {
    console.error('Get exam error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar prova' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar prova
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const body = await request.json()
    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Apenas admin ou o criador da prova pode editar/deletar
    const isAdmin = session.role === 'admin'
    const isCreator = exam.createdBy === session.userId

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    /*
     * Só campos conhecidos entram no `$set`.
     *
     * ## O que isto conserta
     *
     * O corpo da requisição era espalhado inteiro (`{ ...body }`) no `$set`.
     * Como qualquer aluno cria prova pessoal — e é o `createdBy` dela —, ele
     * passava por esta autorização legitimamente e depois escrevia QUALQUER
     * campo no documento, direto do console do navegador:
     *
     *   fetch('/api/exams/<prova dele>', { method: 'PUT',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ isPersonalExam: false, isHidden: false }) })
     *
     * Duas chaves, e a prova privada dele passava a ser listada em `/provas`
     * para a plataforma inteira — porque é exatamente por esses dois campos que
     * `GET /api/exams` decide o que é público. O mesmo caminho servia para
     * plantar campos que o código nunca espera achar num documento de prova e
     * quebrar as telas que o leem.
     *
     * ## Como está agora
     *
     * `CAMPOS_DO_CRIADOR` é o que o dono da prova mexe: conteúdo, aparência,
     * tempo e monitoramento. `CAMPOS_SO_DE_ADMIN` é o que decide onde a prova
     * aparece para os OUTROS — visibilidade, grupo, natureza pessoal/pública —
     * e por isso só o painel escreve. O que não está em nenhuma das duas listas
     * é silenciosamente ignorado, inclusive `_id`, `createdBy` e `createdAt`,
     * que antes eram removidos um a um depois do espalhamento.
     */
    const CAMPOS_DO_CRIADOR = [
      'title', 'description', 'coverImage', 'themePhrase', 'pdfUrl',
      'numberOfAlternatives', 'numberOfQuestions', 'questions',
      'scoringMethod', 'totalPoints', 'duration', 'durationMinutes',
      'discursiveCorrectionMethod', 'discursiveAiRigor',
      'essayStyle', 'essayCorrectionMethod', 'essayAiRigor',
      'navigationMode', 'allowCustomName', 'requireSignature',
      'shuffleQuestions', 'shuffleAlternatives', 'timeMode', 'generalizedTimeSeconds',
      'feedbackMode',
    ] as const

    // `audience` e `freeDownloads` decidem quem VÊ a prova e quem BAIXA os PDFs
    // dela — as duas coisas valem para os outros, não para o dono. Ficam do lado
    // do admin pela mesma razão que `isHidden`: um aluno criando prova pessoal
    // não escolhe para qual período da faculdade ela é aplicada, nem se abre uma
    // exceção no plano de quem baixa.
    const CAMPOS_SO_DE_ADMIN = [
      'isHidden', 'isPersonalExam', 'isPracticeExam',
      'groupId', 'orderInGroup',
      'audience', 'freeDownloads',
      // Quem enxerga a prova oculta — decisão sobre os outros, como `isHidden`.
      'hiddenExcept',
      // Quais arquivos esperam o término: decide o que a TURMA recebe, e
      // quando — não é uma preferência de quem montou a prova.
      'holdDownloads',
      // As travas de cópia da tela de resolução.
      'antiCola',
      // `showRanking` decide se a turma inteira vê a lista de notas com nome —
      // uma decisão sobre os OUTROS, como `isHidden` e `audience`.
      'showRanking',
    ] as const

    const permitidos = new Set<string>([
      ...CAMPOS_DO_CRIADOR,
      ...(isAdmin ? CAMPOS_SO_DE_ADMIN : []),
    ])

    const camposEnviados: Record<string, any> = {}
    for (const [chave, valor] of Object.entries(body)) {
      if (permitidos.has(chave)) camposEnviados[chave] = valor
    }

    // Os dois blocos entram normalizados: o formulário manda o que o admin
    // marcou, e a normalização é o que impede um período 0, um período 47 ou um
    // "true" em texto de virar regra de acesso.
    if ('audience' in camposEnviados) {
      camposEnviados.audience = normalizarPublico(camposEnviados.audience)
    }
    if ('freeDownloads' in camposEnviados) {
      camposEnviados.freeDownloads = normalizarLiberacoes(camposEnviados.freeDownloads)
    }
    if ('holdDownloads' in camposEnviados) {
      camposEnviados.holdDownloads = normalizarEsperas(camposEnviados.holdDownloads)
    }
    if ('antiCola' in camposEnviados) {
      camposEnviados.antiCola = normalizarTravas(camposEnviados.antiCola)
    }
    if ('hiddenExcept' in camposEnviados) {
      camposEnviados.hiddenExcept = normalizarExcecoes(camposEnviados.hiddenExcept)
    }
    /*
     * Reexibir a prova apaga as exceções.
     *
     * Elas só significam alguma coisa enquanto a prova está oculta. Guardadas
     * numa prova visível, ficariam esperando para valer de novo na próxima vez
     * que alguém a ocultasse — meses depois, com uma lista de nomes que
     * ninguém lembra de ter escrito.
     */
    if (camposEnviados.isHidden === false) {
      // O padrão explícito, e não `undefined`: dentro de um `$set` o driver
      // grava `null` para `undefined` (ver o comentário dos portões abaixo), e
      // "apagar os nomes" precisa ser uma escrita de verdade, não um efeito
      // colateral de como o driver trata um campo ausente.
      camposEnviados.hiddenExcept = normalizarExcecoes(null)
    }

    // Para provas práticas sem datas, usar uma data muito distante no futuro
    const defaultFutureDate = new Date('2099-12-31T23:59:59')
    // Lido de `camposEnviados`, não de `body`: para quem não é admin o campo foi
    // descartado acima, e ler o corpo cru aqui deixaria um não-admin escolher
    // as datas derivadas de uma prova que ele não pode reclassificar.
    const isPracticeExam =
      camposEnviados.isPracticeExam !== undefined
        ? camposEnviados.isPracticeExam
        : exam.isPracticeExam

    // Corrigir numeração das questões (começar em 1, não 0)
    if (camposEnviados.questions && Array.isArray(camposEnviados.questions)) {
      camposEnviados.questions = camposEnviados.questions.map((q: any, index: number) => ({
        ...q,
        number: index + 1
      }))
    }

    // As datas e o bloco de proctoring são derivados, não copiados: eles entram
    // já convertidos, fora da lista de campos permitidos.
    /*
     * Os portões só são reescritos quando a requisição fala deles.
     *
     * `gatesOpen: undefined` dentro de um `$set` não é "não mexer" — o driver
     * grava `null` no documento, e a prova perdia os portões em qualquer PUT
     * parcial que não os reenviasse (uma mudança de ordem, um ajuste de título
     * pela tela de edição de outro campo). Quem quiser TIRAR o portão manda
     * `null` explicitamente; quem não mandar nada fica com o que já estava.
     *
     * A conversão é `interpretarInstante`, não `new Date`: o painel manda ISO
     * com fuso, mas um texto no formato do `<input datetime-local>`
     * ("2026-05-10T14:00") seria lido no fuso de quem executa — UTC — e o
     * portão das 14h de Brasília entrava no banco como 11h. Ver
     * lib/provas/horario-local.ts.
     */
    const portoes: Record<string, any> = {}
    if ('gatesOpen' in body) portoes.gatesOpen = interpretarInstante(body.gatesOpen)
    if ('gatesClose' in body) portoes.gatesClose = interpretarInstante(body.gatesClose)

    const comecaEm = interpretarInstante(body.startTime)
    const terminaEm = interpretarInstante(body.endTime)

    /*
     * A janela é validada como ela FICARÁ, não só com o que veio no corpo: um
     * PUT parcial que mexe só no fechamento precisa ser conferido contra a
     * abertura que já está gravada, senão a conferência passa por cima do
     * defeito que ela existe para pegar.
     */
    if (!isPracticeExam) {
      const erroDaJanela = validarJanelaDoFormulario({
        gatesOpen: 'gatesOpen' in portoes ? portoes.gatesOpen : exam.gatesOpen,
        gatesClose: 'gatesClose' in portoes ? portoes.gatesClose : exam.gatesClose,
        startTime: comecaEm ?? exam.startTime,
        endTime: terminaEm ?? exam.endTime,
      })
      if (erroDaJanela) {
        return NextResponse.json({ error: erroDaJanela }, { status: 400 })
      }
    }

    const updateData: Record<string, any> = {
      ...camposEnviados,
      ...portoes,
      startTime: comecaEm ?? (isPracticeExam ? defaultFutureDate : exam.startTime),
      endTime: terminaEm ?? (isPracticeExam ? defaultFutureDate : exam.endTime),
      // Configurações de proctoring
      proctoring: body.proctoringEnabled ? {
        enabled: body.proctoringEnabled,
        camera: body.proctoringCamera || false,
        audio: body.proctoringAudio || false,
        screen: body.proctoringScreen || false,
        screenMode: body.proctoringScreenMode || 'window',
      } : (body.proctoringEnabled === false ? undefined : exam.proctoring),
      updatedAt: new Date(),
    }

    await examsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update exam error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar prova' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar prova
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')
    const submissionsCollection = db.collection('submissions')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Permissões de deleção:
    // - Admin pode deletar qualquer prova
    // - Criador pode deletar sua própria prova (pessoal ou geral)
    const isAdmin = session.role === 'admin'
    const isCreator = exam.createdBy === session.userId

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Deletar todas as submissões relacionadas a essa prova
    await submissionsCollection.deleteMany({ examId: id })

    // Deletar a prova
    await examsCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: 'Prova deletada com sucesso'
    })
  } catch (error) {
    console.error('Delete exam error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar prova' },
      { status: 500 }
    )
  }
}
