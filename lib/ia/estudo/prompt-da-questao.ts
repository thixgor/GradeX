/**
 * O pedido de UMA questão à IA, desenhado para sair certo de primeira.
 *
 * A revisão (`auditoria-de-questoes.ts`) descartava questões por erros de
 * forma que a IA comete quando tem liberdade demais: duas alternativas
 * marcadas como corretas, uma alternativa a mais, afirmativas sem I/II/III,
 * asserção-razão sem as duas asserções, enunciado citando "a tabela a seguir"
 * sem tabela. Pedir com mais ênfase não resolve — tirar a liberdade resolve:
 *
 *  - **clássica e comparação**: a IA escreve `correta` (uma só, por
 *    construção) e `distratoras` com exatamente N−1 itens (`minItems` =
 *    `maxItems` no esquema), cada uma com o erro conceitual que representa —
 *    escrever o erro antes do texto é o que faz a distratora ser plausível,
 *    não banal;
 *  - **afirmativas**: a IA escreve quatro afirmativas e diz quais são
 *    verdadeiras; o enunciado com I–IV e as combinações das alternativas são
 *    montados aqui (`combinacoesDasAfirmativas`);
 *  - **asserção-razão**: a IA escreve as duas asserções e diz se cada uma é
 *    verdadeira e se a II justifica a I; o enunciado e a alternativa certa
 *    saem daqui, das cinco canônicas;
 *  - **recurso visual**: vem ANTES do enunciado na ordem do esquema
 *    (`propertyOrdering`) e com o tipo travado no pedido — o enunciado nasce
 *    citando um dado que já existe. Sem recurso pedido, o campo nem existe.
 *
 * Puro e client-safe: testado em `__tests__/ia/prompt-da-questao.test.ts`.
 */

import type { VagaDaQuestao } from './plano-da-prova'
import { normalizarComando } from './auditoria-de-questoes'
import { sanitizarRecurso, type RecursoVisual, type TipoDeRecurso } from './recursos-visuais'

/** As cinco alternativas fixas da asserção-razão, na ordem canônica das bancas. */
export const ALTERNATIVAS_ASSERCAO_RAZAO = [
  'As asserções I e II são verdadeiras, e a II é uma justificativa correta da I.',
  'As asserções I e II são verdadeiras, mas a II não é uma justificativa correta da I.',
  'A asserção I é verdadeira, e a II é falsa.',
  'A asserção I é falsa, e a II é verdadeira.',
  'As asserções I e II são falsas.',
]

/** Regras que valem para toda questão — idênticas em toda chamada (prefixo do cache implícito). */
export const INSTRUCAO_DO_SISTEMA = `Você é elaborador sênior de bancas (residência médica, vestibular, concursos da saúde) e professor. Escreve questões de múltipla escolha inéditas, corretas e didáticas, em português do Brasil, seguindo exatamente o formato JSON pedido.

COMO UMA QUESTÃO BOA É
1. Uma unidade: o comando pergunta exatamente o que o enunciado (e o recurso, se houver) permite responder; toda alternativa responde ao comando com a mesma estrutura gramatical; não falta dado necessário e não sobra dado decorativo.
2. Uma única resposta correta, inquestionável pela literatura atual (diretrizes vigentes, livros-texto de referência). Na dúvida entre duas condutas aceitas, mude o caso até sobrar uma.
3. Prefira comando afirmativo ("Qual é…", "A conduta mais adequada é…"). Se usar comando negativo, escreva INCORRETA ou EXCETO em caixa alta.
4. Distratoras que fazem pensar: cada uma nasce de um erro conceitual real de quem estudou pela metade — confundir mecanismos parecidos, trocar valores de referência, inverter causa e efeito, aplicar a conduta certa no momento errado, escolher o diagnóstico diferencial que quase serve. Nunca absurdas, nunca piada, nunca "nenhuma das anteriores".
5. A forma não entrega a resposta:
   - todas as alternativas com o mesmo tamanho (diferença máxima de 3 palavras) — a correta NUNCA é a mais longa nem a mais detalhada;
   - mesma estrutura em todas; nenhuma tem parênteses, travessão, dois-pontos ou "ou seja";
   - nas distratoras, nenhum termo absoluto: sempre, nunca, jamais, apenas, somente, exclusivamente, unicamente, totalmente, completamente, necessariamente, obrigatoriamente, nem advérbio absoluto em -mente;
   - a correta não repete palavras-chave do enunciado que as distratoras não repetem.
6. Não escreva letras (A, B, C…) em lugar nenhum: a ordem das alternativas é sorteada depois. Nos comentários e na explicação, cite o conteúdo, não a letra.
7. Estilo contextualizada: caso ou cenário realista de 4–7 linhas com dados concretos (idade, sexo, tempo de evolução, achados, valores). Estilo direta: 1–3 linhas.
8. Nível fácil: conceito central. Médio: aplicação que integra dois conceitos. Difícil: raciocínio em etapas, com um dado decisivo sutil.
9. fonte: referência verossímil curta ("Adaptado de: Guyton & Hall, Tratado de Fisiologia Médica, 14. ed."), sem DOI nem página.
10. Recurso visual (só quando o pedido trouxer o campo): é parte do raciocínio — sem ele não se responde —, traz dados verossímeis e coerentes entre si, e o enunciado o cita ("Os exames da tabela…"). Sem recurso no pedido, o enunciado não menciona tabela, gráfico, figura ou esquema.

RESPOSTA COMENTADA — uma aula para quem errou, começando do zero:
- fundamento: o conceito-base explicado para quem nunca viu o tema (3–6 frases: o que é, como funciona, por que importa).
- raciocinio: o caminho de resolução passo a passo, citando os dados do enunciado e do recurso que decidem.
- conclusao: por que a resposta certa é certa.
- pegadinha: a confusão mais comum neste tema e como não cair nela.
- paraFixar: 1–3 frases para memorizar (regra, mnemônico, número-chave).
- comentários de alternativa: por que está certa ou errada, nomeando o erro conceitual específico (1–3 frases). Nunca "está errada porque não é a correta".
Texto corrido, sem markdown, sem emojis.

ANTES DE RESPONDER, CONFIRA: uma única resposta certa; distratoras com erros diferentes entre si; tamanhos iguais (±3 palavras); nenhum termo absoluto nas distratoras; comando e alternativas casam gramaticalmente; nenhuma letra citada.`

const ROTULO_NIVEL = { facil: 'fácil', medio: 'médio', dificil: 'difícil' } as const

// ── Esquemas ───────────────────────────────────────────────────────────────

const texto = { type: 'STRING' }
const textos = (min?: number, max?: number) => ({
  type: 'ARRAY',
  items: { type: 'STRING' },
  ...(min ? { minItems: min } : {}),
  ...(max ? { maxItems: max } : {}),
})

/** O recurso com o tipo travado: a IA não escolhe outro nem deixa de fazer. */
function esquemaDoRecurso(tipo: TipoDeRecurso) {
  const comum = { tipo: { type: 'STRING', enum: [tipo] }, titulo: texto }
  switch (tipo) {
    case 'tabela':
      return {
        type: 'OBJECT',
        properties: { ...comum, cabecalho: textos(2, 5), linhas: { type: 'ARRAY', items: textos(2, 5), minItems: 2, maxItems: 8 }, fonte: texto },
        required: ['tipo', 'titulo', 'cabecalho', 'linhas'],
        propertyOrdering: ['tipo', 'titulo', 'cabecalho', 'linhas', 'fonte'],
      }
    case 'grafico':
      return {
        type: 'OBJECT',
        properties: {
          ...comum,
          forma: { type: 'STRING', enum: ['barras', 'linha'] },
          rotulos: textos(3, 8),
          series: {
            type: 'ARRAY',
            minItems: 1,
            maxItems: 3,
            items: {
              type: 'OBJECT',
              properties: { nome: texto, valores: { type: 'ARRAY', items: { type: 'NUMBER' }, minItems: 3, maxItems: 8 } },
              required: ['nome', 'valores'],
            },
          },
          eixoY: texto,
          fonte: texto,
        },
        required: ['tipo', 'titulo', 'forma', 'rotulos', 'series', 'eixoY'],
        propertyOrdering: ['tipo', 'titulo', 'forma', 'rotulos', 'series', 'eixoY', 'fonte'],
      }
    case 'esquema':
      return {
        type: 'OBJECT',
        properties: { ...comum, forma: { type: 'STRING', enum: ['fluxo', 'ciclo'] }, etapas: textos(3, 6) },
        required: ['tipo', 'titulo', 'forma', 'etapas'],
        propertyOrdering: ['tipo', 'titulo', 'forma', 'etapas'],
      }
    case 'citacao':
      return {
        type: 'OBJECT',
        properties: { tipo: comum.tipo, texto, autor: texto, fonte: texto },
        required: ['tipo', 'texto', 'autor'],
        propertyOrdering: ['tipo', 'texto', 'autor', 'fonte'],
      }
  }
}

const EXPLICACAO = { fundamento: texto, raciocinio: texto, conclusao: texto, pegadinha: texto, paraFixar: texto }
const CAMPOS_DA_EXPLICACAO = ['fundamento', 'raciocinio', 'conclusao', 'pegadinha', 'paraFixar']

/** O esquema JSON de UMA questão, sob medida para a vaga. */
export function esquemaDaQuestao(vaga: VagaDaQuestao, alternativas: number) {
  const inicio: Record<string, unknown> = { foco: texto }
  const ordemInicio = ['foco']
  if (vaga.recurso) {
    inicio.recurso = esquemaDoRecurso(vaga.recurso)
    ordemInicio.push('recurso')
  }

  let miolo: Record<string, unknown>
  let ordemMiolo: string[]
  if (vaga.formato === 'multiple-affirmative') {
    miolo = {
      enunciado: texto,
      fonte: texto,
      afirmativas: {
        type: 'ARRAY',
        minItems: 4,
        maxItems: 4,
        items: {
          type: 'OBJECT',
          properties: { texto, verdadeira: { type: 'BOOLEAN' }, comentario: texto },
          required: ['texto', 'verdadeira', 'comentario'],
          propertyOrdering: ['texto', 'verdadeira', 'comentario'],
        },
      },
      comando: texto,
    }
    ordemMiolo = ['enunciado', 'fonte', 'afirmativas', 'comando']
  } else if (vaga.formato === 'assertion-reason') {
    miolo = {
      enunciado: texto,
      fonte: texto,
      assercaoI: texto,
      assercaoII: texto,
      iVerdadeira: { type: 'BOOLEAN' },
      iiVerdadeira: { type: 'BOOLEAN' },
      iiJustificaI: { type: 'BOOLEAN' },
      comentarioI: texto,
      comentarioII: texto,
      comentarioRelacao: texto,
    }
    ordemMiolo = ['enunciado', 'fonte', 'assercaoI', 'assercaoII', 'iVerdadeira', 'iiVerdadeira', 'iiJustificaI', 'comentarioI', 'comentarioII', 'comentarioRelacao']
  } else {
    miolo = {
      enunciado: texto,
      fonte: texto,
      comando: texto,
      correta: {
        type: 'OBJECT',
        properties: { texto, comentario: texto },
        required: ['texto', 'comentario'],
        propertyOrdering: ['texto', 'comentario'],
      },
      distratoras: {
        type: 'ARRAY',
        minItems: alternativas - 1,
        maxItems: alternativas - 1,
        items: {
          type: 'OBJECT',
          properties: { erroConceitual: texto, texto, comentario: texto },
          required: ['erroConceitual', 'texto', 'comentario'],
          propertyOrdering: ['erroConceitual', 'texto', 'comentario'],
        },
      },
    }
    ordemMiolo = ['enunciado', 'fonte', 'comando', 'correta', 'distratoras']
  }

  return {
    type: 'OBJECT',
    properties: { ...inicio, ...miolo, ...EXPLICACAO },
    required: [...ordemInicio, ...ordemMiolo.filter((c) => c !== 'fonte'), 'fundamento', 'raciocinio', 'conclusao', 'paraFixar'],
    propertyOrdering: [...ordemInicio, ...ordemMiolo, ...CAMPOS_DA_EXPLICACAO],
  }
}

// ── Prompt ─────────────────────────────────────────────────────────────────

const COMO_FAZER_O_RECURSO: Record<TipoDeRecurso, string> = {
  tabela: 'uma tabela (2–5 colunas, 2–8 linhas) com os dados que decidem a questão, como exames com valores e unidades',
  grafico: 'um gráfico de barras ou linha (3–8 pontos no eixo X, 1–3 séries, valores numéricos e eixoY com a unidade) cuja leitura decide a questão',
  esquema: 'um esquema em etapas curtas (3–6), em fluxo ou ciclo — uma via, uma cascata, uma sequência de eventos — com a etapa decisiva para a pergunta',
  citacao: 'um trecho verossímil de diretriz, consenso ou autor clássico (2–4 frases) que a questão pede para interpretar ou aplicar',
}

function regrasDoFormato(vaga: VagaDaQuestao, alternativas: number): string {
  switch (vaga.formato) {
    case 'multiple-affirmative':
      return `Formato: afirmativas. Escreva o enunciado (contexto e a pergunta, sem numerar nada) e exatamente 4 afirmativas sobre ele, cada uma com "verdadeira" e o comentário de por que é verdadeira ou falsa. Entre 1 e 3 afirmativas verdadeiras (não todas). As falsas têm erro conceitual sutil, nunca termo absoluto. Não escreva I, II, III nem as alternativas: elas são montadas a partir das afirmativas. comando: por exemplo "Está correto o que se afirma em:".`
    case 'assertion-reason':
      return 'Formato: asserção-razão. Escreva um enunciado curto de contexto (1–3 linhas, sem as asserções), a asserção I (uma afirmação) e a asserção II (uma possível justificativa), cada uma com "verdadeira", e diga se a II justifica corretamente a I. Varie o resultado (não deixe sempre as duas verdadeiras). Comente cada asserção e a relação entre elas. Não escreva as alternativas: são as cinco clássicas, montadas depois.'
    case 'comparison':
      return `Formato: comparação. O enunciado põe duas situações, estruturas ou condutas lado a lado; o comando pede a relação entre elas. Escreva "correta" e exatamente ${alternativas - 1} distratoras; cada distratora começa pelo erroConceitual (a confusão que ela representa) e depois o texto.`
    default:
      return `Formato: clássica. Escreva "correta" e exatamente ${alternativas - 1} distratoras; cada distratora começa pelo erroConceitual (a confusão que ela representa, diferente das outras) e depois o texto. Escreva a correta primeiro e cada distratora com o mesmo número de palavras dela (±3).`
  }
}

export function promptDaQuestao(vaga: VagaDaQuestao, contexto: string, alternativas: number, evitar: string[]): string {
  const recurso = vaga.recurso
    ? `Recurso visual: obrigatório — ${COMO_FAZER_O_RECURSO[vaga.recurso]}. Crie o recurso primeiro e escreva o enunciado a partir dele, citando-o.`
    : 'Recurso visual: nenhum. O enunciado não cita tabela, gráfico, figura ou esquema.'
  const repetidos = evitar.length ? `\nNão repita estes focos, já cobrados na prova: ${evitar.slice(-30).join('; ')}.` : ''
  return `Banca/contexto: ${contexto}
Tema: ${vaga.tema}
Estilo: ${vaga.estilo === 'direta' ? 'direta' : 'contextualizada'} · Nível: ${ROTULO_NIVEL[vaga.nivel]}
${recurso}
${regrasDoFormato(vaga, alternativas)}
foco: em até 10 palavras, o ponto exato que a questão cobra.${repetidos}`
}

// ── Leitura ────────────────────────────────────────────────────────────────

export interface AlternativaMontada {
  texto: string
  correta: boolean
  comentario: string
}

export interface QuestaoMontada {
  foco: string
  enunciado: string
  recurso: RecursoVisual | null
  fonte: string
  comando: string
  alternativas: AlternativaMontada[]
  fundamento: string
  raciocinio: string
  conclusao: string
  pegadinha: string
  paraFixar: string
}

const limpo = (v: unknown, max: number) =>
  typeof v === 'string'
    ? v
        .replace(/\r/g, '')
        .replace(/\*\*/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, max)
    : ''

/** Tira "A) ", "b. " e afins do começo — a letra é nossa, não da IA. */
export const semLetra = (t: string) => t.replace(/^\s*(\(?[A-Ea-e][).:\-–]\s+)/, '').trim()

/** Tira "I. ", "II) " do começo da afirmativa: a numeração é nossa. */
const semNumeral = (t: string) => t.replace(/^\s*(I{1,3}|IV)\s*[.)\-–:]\s*/, '').trim()

const NUMERAIS = ['I', 'II', 'III', 'IV']

/** "I e III, apenas" / "II, apenas" / "I, II, III e IV". */
export function rotuloDaCombinacao(indices: number[]): string {
  const nomes = [...indices].sort((a, b) => a - b).map((i) => NUMERAIS[i])
  if (nomes.length === 4) return 'I, II, III e IV'
  if (nomes.length === 1) return `${nomes[0]}, apenas`
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}, apenas`
}

/**
 * As alternativas das afirmativas: a combinação verdadeira e as N−1 mais
 * parecidas com ela (diferença de uma afirmativa primeiro, depois de duas) —
 * as distratoras que exigem julgar cada afirmativa, não as que se eliminam
 * de longe.
 */
export function combinacoesDasAfirmativas(
  verdadeiras: boolean[],
  alternativas: number,
  aleatorio: () => number = Math.random,
): { indices: number[]; correta: boolean }[] {
  const certa = verdadeiras.map((v, i) => (v ? i : -1)).filter((i) => i >= 0)
  const chave = (c: number[]) => c.join(',')
  const todas: number[][] = []
  for (let m = 1; m < 16; m++) todas.push([0, 1, 2, 3].filter((i) => m & (1 << i)))
  const diferenca = (c: number[]) => {
    const a = new Set(c)
    return [0, 1, 2, 3].filter((i) => a.has(i) !== certa.includes(i)).length
  }
  const candidatas = todas
    .filter((c) => chave(c) !== chave(certa))
    .map((c) => ({ c, d: diferenca(c), r: aleatorio() }))
    .sort((x, y) => x.d - y.d || x.r - y.r)
    .slice(0, alternativas - 1)
    .map(({ c }) => ({ indices: c, correta: false }))
  return [{ indices: certa, correta: true }, ...candidatas]
}

function lerExplicacao(b: any) {
  return {
    fundamento: limpo(b?.fundamento, 2500),
    raciocinio: limpo(b?.raciocinio, 2500),
    conclusao: limpo(b?.conclusao, 1200),
    pegadinha: limpo(b?.pegadinha, 900),
    paraFixar: limpo(b?.paraFixar, 700),
  }
}

/**
 * Lê a resposta da IA para uma vaga e devolve a questão montada — ou `null`
 * quando falta o essencial. Afirmativas e asserção-razão são montadas aqui.
 */
export function montarDaResposta(
  b: any,
  vaga: VagaDaQuestao,
  alternativas: number,
  aleatorio: () => number = Math.random,
): QuestaoMontada | null {
  if (!b || typeof b !== 'object') return null
  const base = {
    foco: limpo(b.foco, 120),
    recurso: sanitizarRecurso(b.recurso),
    fonte: limpo(b.fonte, 220),
    ...lerExplicacao(b),
  }
  const intro = limpo(b.enunciado, 3000)

  if (vaga.formato === 'multiple-affirmative') {
    const afirmativas = (Array.isArray(b.afirmativas) ? b.afirmativas : [])
      .slice(0, 4)
      .map((a: any) => ({
        texto: semNumeral(limpo(a?.texto, 500)),
        verdadeira: a?.verdadeira === true || a?.verdadeira === 'true',
        comentario: limpo(a?.comentario, 600),
      }))
    if (afirmativas.length !== 4 || afirmativas.some((a: { texto: string }) => !a.texto)) return null
    const verdadeiras = afirmativas.map((a: { verdadeira: boolean }) => a.verdadeira)
    if (!verdadeiras.some(Boolean)) return null
    const combos = combinacoesDasAfirmativas(verdadeiras, alternativas, aleatorio)
    const certas = combos[0].indices
    const resumoCerto = `${rotuloDaCombinacao(certas)}: ${certas.length === 1 ? 'só a ' + NUMERAIS[certas[0]] + ' é verdadeira' : 'são as verdadeiras'}.`
    return {
      ...base,
      enunciado: `${intro}\n\n${afirmativas.map((a: { texto: string }, i: number) => `${NUMERAIS[i]}. ${a.texto}`).join('\n')}`,
      comando: normalizarComando(limpo(b.comando, 300) || 'Está correto o que se afirma em:'),
      alternativas: combos.map(({ indices, correta }) => {
        if (correta) return { texto: rotuloDaCombinacao(indices), correta: true, comentario: resumoCerto }
        const incluiFalsa = indices.find((i) => !verdadeiras[i])
        const esqueceVerdadeira = certas.find((i) => !indices.includes(i))
        const comentario =
          incluiFalsa !== undefined
            ? `Inclui a ${NUMERAIS[incluiFalsa]}, que é falsa: ${afirmativas[incluiFalsa].comentario}`
            : esqueceVerdadeira !== undefined
              ? `Deixa de fora a ${NUMERAIS[esqueceVerdadeira]}, que é verdadeira: ${afirmativas[esqueceVerdadeira].comentario}`
              : ''
        return { texto: rotuloDaCombinacao(indices), correta: false, comentario }
      }),
    }
  }

  if (vaga.formato === 'assertion-reason') {
    const i1 = semNumeral(limpo(b.assercaoI, 600))
    const i2 = semNumeral(limpo(b.assercaoII, 600))
    if (!i1 || !i2) return null
    const v1 = b.iVerdadeira === true || b.iVerdadeira === 'true'
    const v2 = b.iiVerdadeira === true || b.iiVerdadeira === 'true'
    const justifica = v1 && v2 && (b.iiJustificaI === true || b.iiJustificaI === 'true')
    const certa = v1 && v2 ? (justifica ? 0 : 1) : v1 ? 2 : v2 ? 3 : 4
    const c1 = limpo(b.comentarioI, 600)
    const c2 = limpo(b.comentarioII, 600)
    const cr = limpo(b.comentarioRelacao, 600)
    const porQue = [
      `${v1 && v2 && justifica ? 'As duas são verdadeiras e a II justifica a I' : v1 && v2 ? 'As duas são verdadeiras, mas a II não justifica a I' : v1 ? 'A I é verdadeira e a II é falsa' : v2 ? 'A I é falsa e a II é verdadeira' : 'As duas são falsas'}.`,
      c1 && `Asserção I: ${c1}`,
      c2 && `Asserção II: ${c2}`,
      v1 && v2 && cr && `Relação: ${cr}`,
    ]
      .filter(Boolean)
      .join(' ')
    return {
      ...base,
      enunciado: `${intro ? `${intro}\n\n` : ''}I. ${i1}\n\nPORQUE\n\nII. ${i2}`,
      comando: 'A respeito dessas asserções, assinale a opção correta:',
      alternativas: ALTERNATIVAS_ASSERCAO_RAZAO.map((textoDaAlt, k) => ({
        texto: textoDaAlt,
        correta: k === certa,
        comentario: k === certa ? porQue : erroDaAssercao(k, v1, v2, justifica),
      })),
    }
  }

  // Clássica e comparação.
  const correta = b.correta && typeof b.correta === 'object' ? b.correta : null
  const textoCerto = semLetra(limpo(correta?.texto, 600))
  const distratoras = (Array.isArray(b.distratoras) ? b.distratoras : [])
    .map((d: any) => ({
      texto: semLetra(limpo(d?.texto, 600)),
      correta: false,
      comentario: limpo(d?.comentario, 900) || limpo(d?.erroConceitual, 400),
    }))
    .filter((d: AlternativaMontada) => d.texto)
    .slice(0, alternativas - 1)
  if (!textoCerto || distratoras.length !== alternativas - 1) return null
  return {
    ...base,
    enunciado: intro,
    comando: normalizarComando(limpo(b.comando, 400)),
    alternativas: [{ texto: textoCerto, correta: true, comentario: limpo(correta?.comentario, 900) }, ...distratoras],
  }
}

/** Por que cada uma das alternativas erradas da asserção-razão erra, a partir do julgamento das asserções. */
function erroDaAssercao(k: number, v1: boolean, v2: boolean, justifica: boolean): string {
  const juizo = (v: boolean, n: string) => `a asserção ${n} é ${v ? 'verdadeira' : 'falsa'}`
  switch (k) {
    case 0:
      return v1 && v2 ? 'As duas são verdadeiras, mas a II não justifica a I.' : `Erra porque ${!v1 ? juizo(v1, 'I') : juizo(v2, 'II')}.`
    case 1:
      return v1 && v2 && justifica ? 'A II justifica, sim, a I.' : `Erra porque ${!v1 ? juizo(v1, 'I') : juizo(v2, 'II')}.`
    case 2:
      return `Erra porque ${!v1 ? juizo(v1, 'I') : juizo(v2, 'II')}.`
    case 3:
      return `Erra porque ${v1 ? juizo(v1, 'I') : juizo(v2, 'II')}.`
    default:
      return `Erra porque ${v1 ? juizo(v1, 'I') : juizo(v2, 'II')}.`
  }
}
