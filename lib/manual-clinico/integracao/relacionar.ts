import { ETAPAS } from './modulos'
import type {
  Conexao,
  GrupoDeConexoes,
  ItemDoManual,
  ModuloIntegrado,
  MotivoDaConexao,
  Natureza,
} from './tipos'
import {
  ehEssencialDoOrgao,
  naturezasDoTexto,
  nomeDoOrgao,
  orgaosDoTexto,
  pluralDaNatureza,
  termosDoTexto,
} from './vocabulario'

/**
 * O motor do Estudo Integrado: dado um assunto, o que mais dos manuais fala
 * dele — e por quê.
 *
 * Puro e síncrono: recebe o índice pronto e devolve as conexões. Não lê banco
 * nem rede, então o mesmo código roda na rota e nos testes, e o teste de
 * aceitação ("estudando carcinoma renal na TC, o que aparece?") roda sobre o
 * índice real.
 *
 * ## As quatro razões para dois itens estarem ligados
 *
 * 1. **Ligação direta** — alguém já escreveu no acervo que um leva ao outro
 *    (o sinal cita a patologia; a patologia lista o fármaco de primeira linha).
 * 2. **Mesma doença** — os nomes dizem a mesma coisa. Medido por cosseno de
 *    termos ponderados por IDF: "carcinoma" e "renal" aparecem em dezenas de
 *    itens e pesam pouco; "células claras" aparece em três e pesa muito.
 * 3. **Mesmo órgão e mesmo processo** — as doenças "irmãs": do carcinoma de
 *    células claras aos outros tumores do rim. É a pergunta que a pessoa faria
 *    em seguida ("e os outros tipos?").
 * 4. **Referência do órgão** — o rim normal na lâmina, a janela de ultrassom
 *    dos rins, a creatinina. Não são a doença, são o chão em que ela acontece.
 */

export interface IndicePreparado {
  itens: ItemDoManual[]
  porRef: Map<string, ItemDoManual>
  idf: Map<string, number>
  idfPadrao: number
}

export function prepararIndice(itens: ItemDoManual[]): IndicePreparado {
  const df = new Map<string, number>()
  for (const item of itens) {
    for (const t of new Set([...item.termos, ...(item.termosExtras ?? [])])) df.set(t, (df.get(t) ?? 0) + 1)
  }
  const total = Math.max(itens.length, 1)
  const idf = new Map<string, number>()
  for (const [t, n] of df) idf.set(t, Math.log(1 + total / n))
  return {
    itens,
    porRef: new Map(itens.map((i) => [i.ref, i])),
    idf,
    // Termo que não existe no índice é raríssimo — e por isso, específico.
    idfPadrao: Math.log(1 + total),
  }
}

/** O assunto de partida: um item do acervo ou um tema digitado. */
export interface Origem {
  ref?: string
  titulo: string
  orgaos: string[]
  naturezas: Natureza[]
  termos: string[]
  termosExtras?: string[]
  ligados?: string[]
  referencia?: boolean
}

export function origemDoItem(item: ItemDoManual): Origem {
  return {
    ref: item.ref,
    titulo: item.titulo,
    orgaos: item.orgaos,
    naturezas: item.naturezas,
    termos: item.termos,
    termosExtras: item.termosExtras,
    ligados: item.ligados,
    referencia: item.referencia,
  }
}

/** "neoplasia renal", "pneumonia", "rim": o tema digitado vira uma origem. */
export function origemDaConsulta(texto: string): Origem {
  return {
    titulo: texto.trim(),
    orgaos: orgaosDoTexto(texto),
    naturezas: naturezasDoTexto(texto),
    termos: termosDoTexto(texto),
  }
}

/* ───────────────────────────── Similaridade ───────────────────────────── */

function peso(indice: IndicePreparado, termo: string): number {
  return indice.idf.get(termo) ?? indice.idfPadrao
}

function norma(indice: IndicePreparado, termos: string[]): number {
  let soma = 0
  for (const t of termos) soma += peso(indice, t) ** 2
  return Math.sqrt(soma)
}

/**
 * Cosseno entre os nomes.
 *
 * Os sinônimos entram no casamento, mas só os que casaram entram na norma:
 * um item com oito sinônimos em inglês não fica "menos parecido" por isso, e
 * um sinônimo solto também não infla a nota acima do que o título sustenta.
 * Quando só os sinônimos casam (nenhuma palavra do título em comum), a nota é
 * amortecida — é parentesco, raramente a mesma doença.
 */
export function similaridade(
  indice: IndicePreparado,
  a: { termos: string[]; termosExtras?: string[] },
  b: { termos: string[]; termosExtras?: string[] },
): number {
  if (a.termos.length === 0 || b.termos.length === 0) return 0
  const todosA = new Set([...a.termos, ...(a.termosExtras ?? [])])
  const todosB = new Set([...b.termos, ...(b.termosExtras ?? [])])
  let comum = 0
  for (const t of todosA) if (todosB.has(t)) comum += peso(indice, t) ** 2
  if (comum === 0) return 0

  const vetorA = [...a.termos, ...(a.termosExtras ?? []).filter((t) => todosB.has(t))]
  const vetorB = [...b.termos, ...(b.termosExtras ?? []).filter((t) => todosA.has(t))]
  const cos = Math.min(1, comum / (norma(indice, vetorA) * norma(indice, vetorB)))

  const tituloEmComum = a.termos.some((t) => todosB.has(t)) || b.termos.some((t) => todosA.has(t))
  return tituloEmComum ? cos : cos * 0.7
}

function intersecao<T>(a: T[], b: T[]): T[] {
  return a.filter((x) => b.includes(x))
}

/* ───────────────────────────── Pontuação ───────────────────────────── */

interface Pontuado {
  item: ItemDoManual
  pontos: number
  motivo: MotivoDaConexao
  rotulo: string
}

const LIMIAR_MESMA_DOENCA = 0.6
const LIMIAR_RELACIONADO = 0.38
const PONTOS_MINIMOS = 25

function pontuar(indice: IndicePreparado, origem: Origem, item: ItemDoManual): Pontuado | null {
  if (item.ref === origem.ref) return null

  const candidatos: Pontuado[] = []
  const orgaosComuns = intersecao(origem.orgaos, item.orgaos)
  const semOrgaoParaComparar = origem.orgaos.length === 0 || item.orgaos.length === 0

  if (origem.ligados?.includes(item.ref) || (origem.ref && item.ligados?.includes(origem.ref))) {
    candidatos.push({ item, pontos: 95, motivo: 'ligacao-direta', rotulo: 'Ligação direta' })
  }

  const sim = similaridade(indice, origem, item)
  // Nomes parecidos em órgãos diferentes ("carcinoma escamoso" do colo e do
  // esôfago) são parentes distantes, não a mesma doença.
  // E quando só um dos lados tem órgão, o nome precisa sustentar sozinho:
  // "reto" do músculo reto abdominal não é o reto do intestino.
  const orgaoCompativel =
    orgaosComuns.length > 0 || (semOrgaoParaComparar && (origem.orgaos.length === item.orgaos.length || sim >= 0.5))

  if (origem.referencia && orgaosComuns.length > 0 && !item.referencia && sim >= LIMIAR_RELACIONADO) {
    // Partindo de um órgão (a lâmina do fígado), nada é "a mesma doença":
    // o nome parecido só ordena as doenças do órgão.
    candidatos.push({ item, pontos: 40 + 10 * sim, motivo: 'doenca-do-orgao', rotulo: `Doenças: ${nomeDoOrgao(orgaosComuns[0])}` })
  } else if (sim >= LIMIAR_MESMA_DOENCA && orgaoCompativel) {
    candidatos.push({ item, pontos: 60 + 35 * sim, motivo: 'mesma-doenca', rotulo: 'Mesma doença' })
  } else if (sim >= LIMIAR_RELACIONADO && orgaoCompativel) {
    candidatos.push({ item, pontos: 30 + 30 * sim, motivo: 'relacionado', rotulo: 'Tema relacionado' })
  }

  if (orgaosComuns.length > 0) {
    const orgao = nomeDoOrgao(orgaosComuns[0])
    // Quanto mais órgãos o item cobre, menos ele é "deste" órgão: a lâmina do
    // rim vale mais que o painel de eletrólitos, que também lista o rim.
    const especificidade = Math.max(0, item.orgaos.length - 1) * 3

    if (item.referencia) {
      // Entre as referências do órgão, as de primeira linha (creatinina e
      // urina tipo I para o rim; transaminases para o fígado) vêm antes.
      const essencial = orgaosComuns.some((o) => ehEssencialDoOrgao(o, item)) ? 4 : 0
      candidatos.push({
        item,
        pontos: 36 + essencial - especificidade,
        motivo: 'referencia-do-orgao',
        rotulo: `Referência: ${orgao}`,
      })
    } else if (origem.naturezas.length === 0 || origem.referencia) {
      // Partindo do órgão (a lâmina normal do rim, o tema "rim"), toda
      // doença do órgão interessa.
      candidatos.push({
        item,
        pontos: 40 - especificidade,
        motivo: 'doenca-do-orgao',
        rotulo: `Doenças: ${orgao}`,
      })
    } else {
      const processo = intersecao(origem.naturezas, item.naturezas)
      if (processo.length > 0) {
        candidatos.push({
          item,
          pontos: 45 - especificidade,
          motivo: 'mesmo-orgao-e-processo',
          rotulo: `Outras ${pluralDaNatureza(processo[0])}: ${orgao}`,
        })
      }
    }
  }

  if (candidatos.length === 0) return null
  const melhor = candidatos.reduce((a, b) => (b.pontos > a.pontos ? b : a))
  return melhor.pontos >= PONTOS_MINIMOS ? melhor : null
}

/* ───────────────────────────── Montagem ───────────────────────────── */

export interface OpcoesDeRelacao {
  /** Quantos itens por manual. */
  porModulo?: number
  /** Teto da resposta inteira. */
  total?: number
  /** Refs que não devem voltar (o que já está no estudo). */
  excluir?: Set<string>
}

/**
 * Conexões de uma ou mais origens. Com várias (as sugestões para completar um
 * estudo), cada candidato fica com a melhor nota que recebeu de qualquer uma.
 */
export function relacionar(
  indice: IndicePreparado,
  origens: Origem[],
  opcoes: OpcoesDeRelacao = {},
): { grupos: GrupoDeConexoes[]; total: number } {
  const porModulo = opcoes.porModulo ?? 5
  const teto = opcoes.total ?? 40
  const excluir = opcoes.excluir ?? new Set<string>()
  for (const o of origens) if (o.ref) excluir.add(o.ref)

  const melhores = new Map<string, Pontuado>()
  const guardar = (p: Pontuado) => {
    if (excluir.has(p.item.ref)) return
    const atual = melhores.get(p.item.ref)
    if (!atual || p.pontos > atual.pontos) melhores.set(p.item.ref, p)
  }

  for (const origem of origens) {
    for (const item of indice.itens) {
      const p = pontuar(indice, origem, item)
      if (p) guardar(p)
    }
  }

  // Segundo passo: o que a mesma doença em outro manual liga diretamente
  // (a ficha do Manual Clínico aponta os fármacos de primeira linha). É assim
  // que o caso de TC chega à Farmacologia sem que ninguém tenha ligado os dois.
  for (const p of Array.from(melhores.values())) {
    if (p.motivo !== 'mesma-doenca' && p.motivo !== 'ligacao-direta') continue
    for (const ref of p.item.ligados ?? []) {
      const alvo = indice.porRef.get(ref)
      if (!alvo) continue
      const tratamento = alvo.modulo === 'farmacologia'
      guardar({
        item: alvo,
        pontos: tratamento ? 58 : 50,
        motivo: tratamento ? 'tratamento' : 'ligacao-direta',
        rotulo: tratamento ? `Tratamento de ${p.item.titulo}` : `Via ${p.item.titulo}`,
      })
    }
  }

  const ordenados = Array.from(melhores.values()).sort(
    (a, b) => b.pontos - a.pontos || a.item.titulo.localeCompare(b.item.titulo, 'pt-BR'),
  )

  const contagem = new Map<ModuloIntegrado, number>()
  const escolhidos: Pontuado[] = []
  for (const p of ordenados) {
    if (escolhidos.length >= teto) break
    const n = contagem.get(p.item.modulo) ?? 0
    if (n >= porModulo) continue
    contagem.set(p.item.modulo, n + 1)
    escolhidos.push(p)
  }

  const grupos = new Map<string, GrupoDeConexoes>()
  for (const p of escolhidos) {
    const chave = `${p.item.etapa}|${p.item.modulo}`
    let grupo = grupos.get(chave)
    if (!grupo) {
      grupo = { etapa: p.item.etapa, modulo: p.item.modulo, itens: [] }
      grupos.set(chave, grupo)
    }
    grupo.itens.push(paraConexao(p))
  }

  const lista = Array.from(grupos.values()).sort(
    (a, b) =>
      ETAPAS[a.etapa].numero - ETAPAS[b.etapa].numero ||
      (b.itens[0]?.pontos ?? 0) - (a.itens[0]?.pontos ?? 0),
  )
  return { grupos: lista, total: escolhidos.length }
}

function paraConexao(p: Pontuado): Conexao {
  const c: Conexao = {
    ref: p.item.ref,
    modulo: p.item.modulo,
    tipo: p.item.tipo,
    titulo: p.item.titulo,
    href: p.item.href,
    etapa: p.item.etapa,
    motivo: p.motivo,
    rotuloDoMotivo: p.rotulo,
    pontos: Math.round(p.pontos),
  }
  if (p.item.subtitulo) c.subtitulo = p.item.subtitulo
  return c
}
