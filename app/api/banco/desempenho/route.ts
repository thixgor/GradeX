import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { computeStreak, dayKey } from '@/lib/streak'
import { ordenarPeriodosLetivos } from '@/lib/banco/periodo-letivo'

export const dynamic = 'force-dynamic'

const FUSO = 'America/Sao_Paulo'
/** Janela das colunas de atividade. */
const DIAS_DO_GRAFICO = 30
/** Janela do mapa de constância — 16 semanas fechadas. */
const SEMANAS_DO_MAPA = 16
/** Quantas categorias entram nas barras. Mais que isso vira uma lista, não um gráfico. */
const CATEGORIAS = 8

/**
 * O desempenho de quem estuda pelo Banco de Questões, em vários recortes.
 *
 * ## Por que uma rota nova
 *
 * `/api/banco/estatisticas` responde três números e é exclusiva do Plus+.
 * `/api/user/performance` é rica, mas mistura banco com provas e vive no
 * perfil. Nenhuma das duas serve ao painel do banco, que precisa de várias
 * leituras do MESMO histórico lado a lado — por dia, por assunto, por
 * dificuldade, por período letivo — para responder à única pergunta que
 * importa ali: onde eu erro mais?
 *
 * ## Quem vê
 *
 * Todo mundo que está autenticado, inclusive quem é gratuito. São os dados da
 * própria pessoa: cobrar para ela ver o próprio erro seria esconder justamente
 * a evidência de que vale a pena continuar. O que o plano gratuito limita é o
 * acesso às questões, não a leitura do que já foi respondido.
 *
 * ## Uma consulta só
 *
 * Tudo sai de um `$facet` sobre `banco_resolucoes`. Sete agregações separadas
 * seriam sete idas ao banco para responder a um painel que abre e fecha —
 * caro, e sem nenhum ganho de clareza.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const userId = new ObjectId(session.userId)
    const agora = new Date()

    // A fatia do mapa fecha na semana corrente: começar no meio de uma semana
    // deixaria a primeira coluna cheia de buracos que não são "dia sem estudo".
    const diasAteSabado = 6 - diaDaSemanaDaChave(dayKey(agora))
    const diasDoMapa = SEMANAS_DO_MAPA * 7 - diasAteSabado
    const chaves = ultimosDias(diasDoMapa, agora)
    const desde = new Date(agora.getTime() - diasDoMapa * 86_400_000)

    const porAssunto = (campo: string, colecao: string) => [
      {
        $lookup: {
          from: 'banco_questoes',
          localField: 'questaoId',
          foreignField: '_id',
          as: 'questao',
        },
      },
      { $unwind: '$questao' },
      {
        $group: {
          _id: `$questao.${campo}`,
          total: { $sum: 1 },
          acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { total: -1 } },
      { $limit: CATEGORIAS },
      { $lookup: { from: colecao, localField: '_id', foreignField: '_id', as: 'no' } },
      { $unwind: { path: '$no', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          nome: { $ifNull: ['$no.nome', 'Sem assunto'] },
          total: 1,
          acertos: 1,
        },
      },
    ]

    let dados: any = {}
    try {
      const [resultado] = await db
        .collection('banco_resolucoes')
        .aggregate([
          { $match: { userId } },
          {
            $facet: {
              totais: [
                {
                  $group: {
                    _id: null,
                    total: { $sum: 1 },
                    acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
                    erros: { $sum: { $cond: [{ $eq: ['$correta', false] }, 1, 0] } },
                  },
                },
              ],
              diario: [
                { $match: { createdAt: { $gte: desde } } },
                {
                  $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: FUSO } },
                    total: { $sum: 1 },
                    acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
                  },
                },
              ],
              // Para o streak basta o conjunto de dias distintos.
              diasAtivos: [
                {
                  $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: FUSO } },
                  },
                },
              ],
              porTipo: [
                {
                  $group: {
                    _id: '$tipo',
                    total: { $sum: 1 },
                    acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
                  },
                },
              ],
              porModulo: porAssunto('moduloId', 'banco_modulos'),
              porTopico: porAssunto('topicoId', 'banco_topicos'),
              porDificuldade: [
                {
                  $lookup: {
                    from: 'banco_questoes',
                    localField: 'questaoId',
                    foreignField: '_id',
                    as: 'questao',
                  },
                },
                { $unwind: '$questao' },
                {
                  $group: {
                    _id: { $ifNull: ['$questao.dificuldade', 'sem'] },
                    total: { $sum: 1 },
                    acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
                  },
                },
              ],
              porPeriodo: [
                {
                  $lookup: {
                    from: 'banco_questoes',
                    localField: 'questaoId',
                    foreignField: '_id',
                    as: 'questao',
                  },
                },
                { $unwind: '$questao' },
                { $match: { 'questao.periodoLetivo': { $type: 'string', $ne: '' } } },
                {
                  $group: {
                    _id: '$questao.periodoLetivo',
                    total: { $sum: 1 },
                    acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
                  },
                },
              ],
            },
          },
        ])
        .toArray()
      dados = resultado || {}
    } catch {
      // A coleção pode não existir nesta base — o painel simplesmente nasce vazio.
      dados = {}
    }

    const totais = dados.totais?.[0] || { total: 0, acertos: 0, erros: 0 }

    // ── Séries por dia ────────────────────────────────────────────────────
    const baldes = new Map<string, { total: number; acertos: number }>()
    for (const chave of chaves) baldes.set(chave, { total: 0, acertos: 0 })
    for (const linha of (dados.diario || []) as any[]) {
      const balde = baldes.get(linha._id)
      if (balde) {
        balde.total += linha.total
        balde.acertos += linha.acertos
      }
    }

    const mapa = chaves.map((date) => ({ date, total: baldes.get(date)!.total }))
    const diario = chaves.slice(-DIAS_DO_GRAFICO).map((date) => {
      const balde = baldes.get(date)!
      // As duas séries do gráfico empilhado são acertos e erros: juntas dão o
      // total do dia, então a altura da coluna continua sendo "quanto estudei".
      return { date, acertos: balde.acertos, erros: Math.max(0, balde.total - balde.acertos) }
    })

    const porDiaDaSemana = Array.from({ length: 7 }, (_, weekday) => ({ weekday, total: 0 }))
    for (const dia of mapa) porDiaDaSemana[diaDaSemanaDaChave(dia.date)].total += dia.total

    const diasComEstudo: Date[] = []
    for (const linha of (dados.diasAtivos || []) as any[]) {
      // Meio-dia em São Paulo: cai sempre no mesmo dia que a chave agregada.
      if (linha._id) diasComEstudo.push(new Date(`${linha._id}T12:00:00-03:00`))
    }
    const streak = computeStreak(diasComEstudo, agora)

    // ── Recortes categóricos ──────────────────────────────────────────────
    const comAcerto = (linhas: any[], nome: (l: any) => string) =>
      linhas.map((l) => ({
        nome: nome(l),
        total: l.total,
        acertos: l.acertos,
        accuracy: l.total > 0 ? Math.round((l.acertos / l.total) * 100) : 0,
      }))

    const NIVEIS: Array<{ chave: string; nome: string }> = [
      { chave: 'facil', nome: 'Fácil' },
      { chave: 'medio', nome: 'Média' },
      { chave: 'dificil', nome: 'Difícil' },
      { chave: 'sem', nome: 'Sem classificação' },
    ]
    const porNivel = new Map((dados.porDificuldade || []).map((l: any) => [String(l._id), l]))
    const porDificuldade = NIVEIS.map(({ chave, nome }) => {
      const linha: any = porNivel.get(chave) || { total: 0, acertos: 0 }
      return {
        nome,
        nivel: chave,
        total: linha.total,
        acertos: linha.acertos,
        accuracy: linha.total > 0 ? Math.round((linha.acertos / linha.total) * 100) : 0,
      }
      // Nível sem nenhuma resolução continua na lista, com zero: a ausência
      // ("nunca respondi uma difícil") é informação, não é ruído.
    }).filter((l) => l.nivel !== 'sem' || l.total > 0)

    const porTipo = comAcerto(
      (dados.porTipo || []).filter((l: any) => l._id),
      (l) => (l._id === 'discursiva' ? 'Discursiva' : 'Objetiva'),
    )

    const periodos = comAcerto(dados.porPeriodo || [], (l) => String(l._id))
    const ordem = ordenarPeriodosLetivos(periodos.map((p) => p.nome))
    periodos.sort((a, b) => ordem.indexOf(a.nome) - ordem.indexOf(b.nome))

    return NextResponse.json(
      {
        resumo: {
          total: totais.total,
          acertos: totais.acertos,
          erros: totais.erros,
          accuracy: totais.total > 0 ? Math.round((totais.acertos / totais.total) * 100) : 0,
          streakAtual: streak.current,
          streakRecorde: streak.longest,
          estudouHoje: streak.activeToday,
          diasAtivos: mapa.filter((d) => d.total > 0).length,
          diasDaJanela: mapa.length,
        },
        diario,
        mapa,
        porDiaDaSemana,
        porModulo: comAcerto(dados.porModulo || [], (l) => l.nome),
        porTopico: comAcerto(dados.porTopico || [], (l) => l.nome),
        porDificuldade,
        porTipo,
        porPeriodo: periodos.slice(0, CATEGORIAS),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('Erro ao montar o desempenho do banco:', error)
    return NextResponse.json({ error: 'Erro ao buscar desempenho' }, { status: 500 })
  }
}

/** Chaves YYYY-MM-DD (fuso SP) dos últimos N dias, da mais antiga à mais nova. */
function ultimosDias(n: number, agora: Date): string[] {
  const chaves: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    chaves.push(dayKey(new Date(agora.getTime() - i * 86_400_000)))
  }
  return chaves
}

/** Dia da semana (0 = domingo) de uma chave, sem passar pelo fuso local. */
function diaDaSemanaDaChave(chave: string): number {
  const [y, m, d] = chave.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}
