import { paraCodigo } from '@/lib/banco/hierarquia'
import {
  formatarPeriodoLetivo,
  lerAnoDoTitulo,
  lerPeriodoLetivo,
} from '@/lib/banco/periodo-letivo'

/**
 * Trazer as questões das Provas da Faculdade para o Banco de Questões.
 *
 * As provas já existem em /provas com questões, gabarito e — nas que foram
 * criadas com feedback comentado — uma explicação por alternativa. Redigitar
 * isso no banco seria manter duas cópias da mesma questão, que divergem no
 * primeiro conserto de gabarito. Aqui a questão é COPIADA uma vez e carimbada
 * com a origem, para que reimportar atualize em vez de duplicar.
 *
 * ## Para onde cada coisa vai
 *
 * O admin escolhe um ou mais grupos de /provas. Para cada prova encontrada
 * dentro do grupo escolhido (incluindo subgrupos, em qualquer profundidade):
 *
 * - **Módulo**    = nome do grupo ESCOLHIDO pelo admin.
 * - **Tópico**    = caminho do grupo da prova relativo à escolha, unido por
 *                   " › ". Quando a prova está direto no grupo escolhido, o
 *                   tópico é "Geral".
 * - **Subtópico** = título da prova.
 *
 * O caminho relativo inteiro vira o nome do tópico de propósito. Usar só o
 * último segmento faria "Módulo I" de Período 1 e "Módulo I" de Período 2 se
 * fundirem num tópico só — e ninguém descobriria, porque a fusão não dá erro:
 * as questões simplesmente aparecem no lugar errado do filtro.
 *
 * Este arquivo é puro: recebe provas e grupos, devolve questões prontas. Assim
 * a regra pode ser testada sem banco, e a rota só executa.
 */

export interface GrupoDeProvas {
  _id: string
  name: string
  parentGroupId?: string | null
}

export interface AlternativaDaProva {
  letter?: string
  text?: string
  isCorrect?: boolean
}

export interface QuestaoDaProva {
  id?: string
  number?: number
  type?: string
  statement?: string
  command?: string
  imageUrl?: string
  explanation?: string
  commentedFeedback?: {
    correctAlternative?: string
    explanations?: Record<string, string>
  }
  alternatives?: AlternativaDaProva[]
  keyPoints?: { description?: string; weight?: number }[]
}

export interface ProvaParaImportar {
  _id: string
  title: string
  groupId?: string | null
  questions?: QuestaoDaProva[]
  createdAt?: Date | string
  startTime?: Date | string
}

export type LetraValida = 'A' | 'B' | 'C' | 'D' | 'E'
const LETRAS: LetraValida[] = ['A', 'B', 'C', 'D', 'E']

export interface QuestaoImportada {
  tipo: 'objetiva' | 'discursiva'
  moduloNome: string
  topicoNome: string
  subtopicoNome: string
  enunciado: string
  alternativas?: { letra: LetraValida; texto: string; correta: boolean }[]
  respostaModelo?: string
  explicacao?: string
  imagemUrl?: string
  fonte: string
  ano?: number
  /** 1 ou 2, quando o título da prova diz o semestre. */
  semestre?: 1 | 2
  /** "2026.2" — o rótulo pronto, para não remontá-lo em toda tela. */
  periodoLetivo?: string
  /** Carimbo de origem — é o que torna a reimportação uma atualização. */
  origem: {
    tipo: 'prova'
    examId: string
    questaoId: string
    grupoId?: string | null
  }
}

export interface QuestaoIgnorada {
  examId: string
  provaTitulo: string
  questaoNumero?: number
  motivo: string
}

export interface ResultadoDoMapeamento {
  questoes: QuestaoImportada[]
  ignoradas: QuestaoIgnorada[]
}

/** O caminho de grupos da raiz escolhida até o grupo informado (inclusive). */
function caminhoRelativo(
  grupos: Map<string, GrupoDeProvas>,
  raizId: string,
  grupoId: string | null | undefined,
): string[] | null {
  const nomes: string[] = []
  let atual = grupoId ? grupos.get(grupoId) : undefined
  const vistos = new Set<string>()

  while (atual && !vistos.has(atual._id)) {
    vistos.add(atual._id)
    if (atual._id === raizId) return nomes.reverse()
    nomes.push(atual.name)
    atual = atual.parentGroupId ? grupos.get(atual.parentGroupId) : undefined
  }
  // A prova não está sob a raiz escolhida.
  return null
}

/**
 * A resposta comentada, montada a partir do que a prova tem.
 *
 * Ordem de preferência: o feedback por alternativa (o mais rico — diz por que
 * cada erro é erro), depois a explicação avulsa. Uma questão sem nenhum dos
 * dois entra assim mesmo, sem explicação: ter a questão no banco vale mais do
 * que não ter, e o admin pode completar depois.
 */
export function montarExplicacao(questao: QuestaoDaProva): string | undefined {
  const partes: string[] = []
  const avulsa = (questao.explanation || '').trim()
  if (avulsa) partes.push(avulsa)

  const porAlternativa = questao.commentedFeedback?.explanations
  if (porAlternativa && typeof porAlternativa === 'object') {
    const linhas = Object.entries(porAlternativa)
      .filter(([, texto]) => String(texto || '').trim().length > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letra, texto]) => `**${letra})** ${String(texto).trim()}`)
    if (linhas.length > 0) {
      partes.push(['**Comentário por alternativa**', ...linhas].join('\n'))
    }
  }

  return partes.length > 0 ? partes.join('\n\n') : undefined
}

/** Enunciado + comando: na prova são dois campos, e o comando some se ignorado. */
export function montarEnunciado(questao: QuestaoDaProva): string {
  const enunciado = (questao.statement || '').trim()
  const comando = (questao.command || '').trim()
  if (!comando) return enunciado
  if (!enunciado) return comando
  // O comando repetido dentro do enunciado é comum em prova; evitar a duplicata
  // é o que impede "Assinale a alternativa correta." duas vezes seguidas.
  return enunciado.includes(comando) ? enunciado : `${enunciado}\n\n${comando}`
}

/**
 * De quando é a prova.
 *
 * O TÍTULO manda. Na plataforma a prova se chama "N1 SOI I - 2026.2", e é esse
 * "2026.2" que diz o período letivo em que ela foi aplicada. A data do
 * documento diz outra coisa: quando a prova foi CADASTRADA aqui — e boa parte
 * do acervo antigo foi digitada anos depois, o que fazia uma N1 de 2023.2
 * entrar no banco como questão de 2026.
 *
 * A data continua como último recurso, para a prova cujo título não traz nada.
 * Melhor um ano aproximado do que nenhum: é ele que alimenta o filtro por ano.
 */
function periodoDaProva(prova: ProvaParaImportar): {
  ano?: number
  semestre?: 1 | 2
  periodoLetivo?: string
} {
  const doTitulo = lerPeriodoLetivo(prova.title)
  if (doTitulo) {
    return {
      ano: doTitulo.ano,
      semestre: doTitulo.semestre,
      periodoLetivo: formatarPeriodoLetivo(doTitulo) || undefined,
    }
  }

  // Título com o ano mas sem o semestre ("Prova de 2024"): o ano vale, o
  // rótulo de período não — inventar ".1" seria fabricar um dado.
  const anoSolto = lerAnoDoTitulo(prova.title)
  if (anoSolto) return { ano: anoSolto }

  const bruto = prova.startTime || prova.createdAt
  if (!bruto) return {}
  const data = new Date(bruto as any)
  const ano = data.getFullYear()
  return Number.isFinite(ano) && ano > 1990 && ano < 2200 ? { ano } : {}
}

/**
 * Converte as provas de um grupo escolhido em questões do banco.
 *
 * Nada é gravado aqui. A rota usa esta mesma função para a PRÉVIA e para a
 * importação — é o que garante que o número mostrado antes seja o número
 * importado depois.
 */
export function mapearProvas(
  raiz: GrupoDeProvas,
  provas: ProvaParaImportar[],
  grupos: GrupoDeProvas[],
): ResultadoDoMapeamento {
  const porId = new Map(grupos.map((g) => [g._id, g]))
  const questoes: QuestaoImportada[] = []
  const ignoradas: QuestaoIgnorada[] = []

  for (const prova of provas) {
    const relativo = caminhoRelativo(porId, raiz._id, prova.groupId)
    if (relativo === null) continue

    const topicoNome = relativo.length > 0 ? relativo.join(' › ') : 'Geral'
    const quando = periodoDaProva(prova)

    for (const questao of prova.questions || []) {
      const numero = questao.number
      const enunciado = montarEnunciado(questao)

      if (!enunciado) {
        ignoradas.push({
          examId: prova._id,
          provaTitulo: prova.title,
          questaoNumero: numero,
          motivo: 'Questão sem enunciado',
        })
        continue
      }

      const base = {
        moduloNome: raiz.name,
        topicoNome,
        subtopicoNome: prova.title,
        enunciado,
        explicacao: montarExplicacao(questao),
        imagemUrl: questao.imageUrl || undefined,
        fonte: prova.title,
        ano: quando.ano,
        semestre: quando.semestre,
        periodoLetivo: quando.periodoLetivo,
        origem: {
          tipo: 'prova' as const,
          examId: prova._id,
          questaoId: String(questao.id || numero || ''),
          grupoId: prova.groupId || null,
        },
      }

      const tipo = String(questao.type || '')

      if (tipo === 'multiple-choice') {
        const alternativas = (questao.alternatives || [])
          .slice(0, 5)
          .map((alt, i) => ({
            letra: (String(alt.letter || LETRAS[i]).toUpperCase().slice(0, 1) as LetraValida),
            texto: String(alt.text || '').trim(),
            correta: alt.isCorrect === true,
          }))
          .filter((alt) => LETRAS.includes(alt.letra) && alt.texto.length > 0)

        if (alternativas.length < 2) {
          ignoradas.push({
            examId: prova._id,
            provaTitulo: prova.title,
            questaoNumero: numero,
            motivo: 'Menos de duas alternativas com texto',
          })
          continue
        }
        if (!alternativas.some((a) => a.correta)) {
          // Sem gabarito a questão não pode ser corrigida, e uma questão que
          // nunca acerta ninguém é pior do que uma questão ausente.
          ignoradas.push({
            examId: prova._id,
            provaTitulo: prova.title,
            questaoNumero: numero,
            motivo: 'Sem alternativa correta marcada',
          })
          continue
        }

        questoes.push({ ...base, tipo: 'objetiva', alternativas })
        continue
      }

      if (tipo === 'discursive') {
        const pontos = (questao.keyPoints || [])
          .map((p) => String(p.description || '').trim())
          .filter(Boolean)
        questoes.push({
          ...base,
          tipo: 'discursiva',
          // Os pontos-chave da correção são a resposta modelo que a prova já
          // tem escrita; sem eles a questão entra para ser respondida e
          // comparada com a explicação.
          respostaModelo: pontos.length > 0 ? pontos.map((p) => `• ${p}`).join('\n') : undefined,
        })
        continue
      }

      // Redação não tem equivalente no banco: não é objetiva nem discursiva de
      // resposta curta, e a correção dela é um sistema à parte.
      ignoradas.push({
        examId: prova._id,
        provaTitulo: prova.title,
        questaoNumero: numero,
        motivo: tipo === 'essay' ? 'Redação não entra no banco' : `Tipo não suportado: ${tipo || 'vazio'}`,
      })
    }
  }

  return { questoes, ignoradas }
}

/** Chave de deduplicação — é ela que faz a segunda importação atualizar. */
export function chaveDeOrigem(origem: QuestaoImportada['origem']): string {
  return `prova:${origem.examId}:${origem.questaoId}`
}

/** Os nomes de hierarquia que a importação precisa criar, sem repetição. */
export function hierarquiaNecessaria(questoes: QuestaoImportada[]) {
  const modulos = new Map<string, string>()
  const topicos = new Map<string, { moduloCodigo: string; nome: string }>()
  const subtopicos = new Map<string, { topicoChave: string; nome: string }>()

  for (const q of questoes) {
    const moduloCodigo = paraCodigo(q.moduloNome)
    modulos.set(moduloCodigo, q.moduloNome)

    const topicoChave = `${moduloCodigo}/${paraCodigo(q.topicoNome)}`
    topicos.set(topicoChave, { moduloCodigo, nome: q.topicoNome })

    const subChave = `${topicoChave}/${paraCodigo(q.subtopicoNome)}`
    subtopicos.set(subChave, { topicoChave, nome: q.subtopicoNome })
  }

  return { modulos, topicos, subtopicos }
}
