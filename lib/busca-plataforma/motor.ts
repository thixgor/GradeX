import {
  chaveDeBusca,
  colar,
  compactar,
  distanciaLimitada,
  ehSubsequencia,
  iniciais,
  palavras,
  termosDaConsulta,
  tetoDeErro,
} from './texto'

/**
 * Motor de ranqueamento da busca global.
 *
 * O item entra com campos de peso diferente (título vale mais que descrição) e
 * sai com uma pontuação que combina três perguntas independentes:
 *
 *  1. a consulta INTEIRA casa com o campo? (exata, prefixo, palavra, contida…)
 *  2. cada TERMO da consulta aparece em algum lugar do item?
 *  3. o usuário costuma abrir este item?
 *
 * A regra (2) é eliminatória: item que não cobre todos os termos é descartado.
 * É o que faz "prova pessoal" não devolver toda prova do sistema só porque a
 * palavra "prova" aparece. A tolerância a erro de digitação entra apenas
 * quando nada mais casou, e nunca inventa cobertura de graça — um termo
 * "coberto por aproximação" vale menos que um coberto de verdade.
 *
 * Custo: o índice estático tem ~250 itens e o motor faz varredura completa com
 * saídas curtas. Estruturas invertidas só compensariam uma ordem de grandeza
 * acima disso, e cobrariam consistência (índice invertido não tolera erro de
 * digitação sem um segundo índice de n-gramas). O que evita trabalho repetido
 * aqui é o cache de consultas em `criarBuscador`.
 */

export interface ItemBuscavel {
  id: string
  titulo: string
  subtitulo?: string
  /** Caminho/categoria exibido junto do resultado ("Manual Clínico › Ferramentas"). */
  trilha?: string
  /** Sinônimos, siglas e como o usuário chamaria isto de cabeça. */
  palavrasChave?: string[]
  /** 0 a 10. Área principal fica acima de subpágina com o mesmo casamento. */
  prioridade?: number
}

export interface CampoIndexado {
  chave: string
  /** Chave sem espaço nenhum. */
  compacta: string
  /** Só as palavras significativas, coladas ("banco de questões" → "bancoquestoes"). */
  colada: string
  palavras: string[]
  iniciais: string
  peso: number
}

export interface ItemIndexado<T extends ItemBuscavel = ItemBuscavel> {
  item: T
  campos: CampoIndexado[]
  /** Tamanho do título normalizado, usado no desempate por concisão. */
  tamanhoTitulo: number
}

export interface Resultado<T extends ItemBuscavel = ItemBuscavel> {
  item: T
  pontos: number
  /** Por que casou — some na interface, útil em teste e depuração. */
  motivo: string
}

/** Sinal de uso do próprio usuário, para personalizar a ordem. */
export interface HistoricoDeUso {
  /** id → quantas vezes foi aberto pela busca. */
  aberturas?: Record<string, number>
  /** id → timestamp (ms) da última abertura. */
  ultimaAbertura?: Record<string, number>
}

const PESO_CAMPO = {
  titulo: 1,
  palavrasChave: 0.86,
  subtitulo: 0.52,
  trilha: 0.34,
}

/**
 * Níveis de casamento da consulta inteira. A ORDEM importa mais que os números:
 * quem começa com o termo vem antes de quem só o contém, e sigla exata vem
 * antes de substring perdida no meio de uma descrição.
 */
const NIVEL = {
  exata: 1000,
  prefixo: 820,
  palavraInicial: 720,
  palavraInteira: 640,
  sigla: 600,
  contida: 460,
  compacta: 400,
  aproximada: 250,
  subsequencia: 130,
}

const MOTIVO: Record<keyof typeof NIVEL, string> = {
  exata: 'Correspondência exata',
  prefixo: 'Começa com o termo',
  palavraInicial: 'Palavra começa com o termo',
  palavraInteira: 'Contém a palavra inteira',
  sigla: 'Bate com a sigla',
  contida: 'Contém o termo',
  compacta: 'Contém o termo sem espaços',
  aproximada: 'Parecido com o que você digitou',
  subsequencia: 'Contém as letras na ordem',
}

/** Pontos por termo isolado, somados à parte do casamento da consulta inteira. */
const TERMO = {
  exato: 100,
  prefixo: 78,
  contido: 52,
  aproximado: 38,
  subsequencia: 16,
}

function campo(texto: string | undefined, peso: number): CampoIndexado | null {
  const chave = chaveDeBusca(texto)
  if (!chave) return null
  return {
    chave,
    compacta: compactar(chave),
    colada: colar(chave),
    palavras: palavras(chave),
    iniciais: iniciais(chave),
    peso,
  }
}

/**
 * Pré-computa tudo o que não depende da consulta. Roda uma vez por índice: sem
 * isto, cada tecla digitada normalizaria as mesmas centenas de strings de novo.
 */
export function indexar<T extends ItemBuscavel>(itens: readonly T[]): ItemIndexado<T>[] {
  return itens.map(item => {
    const campos: CampoIndexado[] = []
    const titulo = campo(item.titulo, PESO_CAMPO.titulo)
    if (titulo) campos.push(titulo)

    // As palavras-chave entram como UM campo só. Separadas, um item com vinte
    // sinônimos acumularia bônus de "aparece em vários campos" e passaria na
    // frente do item cujo próprio título é a resposta.
    const chaves = (item.palavrasChave || []).join(' ')
    const kw = campo(chaves, PESO_CAMPO.palavrasChave)
    if (kw) campos.push(kw)

    const sub = campo(item.subtitulo, PESO_CAMPO.subtitulo)
    if (sub) campos.push(sub)

    const trilha = campo(item.trilha, PESO_CAMPO.trilha)
    if (trilha) campos.push(trilha)

    return { item, campos, tamanhoTitulo: titulo?.chave.length ?? 0 }
  })
}

interface Consulta {
  chave: string
  compacta: string
  colada: string
  termos: string[]
  tetos: number[]
}

export function prepararConsulta(texto: string): Consulta | null {
  const chave = chaveDeBusca(texto)
  if (chave.length < 1) return null
  const termos = termosDaConsulta(texto)
  return {
    chave,
    compacta: compactar(chave),
    colada: colar(chave),
    termos,
    tetos: termos.map(tetoDeErro),
  }
}

interface PontuacaoDeCampo {
  pontos: number
  motivo: string
  /** Índices dos termos cobertos por casamento forte (exato/prefixo/contido). */
  firmes: number[]
  /** Índices cobertos apenas por aproximação ou subsequência. */
  fracos: number[]
}

function pontuarCampo(c: CampoIndexado, consulta: Consulta): PontuacaoDeCampo | null {
  let nivel = 0
  let motivo = ''

  const marcar = (chave: keyof typeof NIVEL) => {
    if (NIVEL[chave] > nivel) {
      nivel = NIVEL[chave]
      motivo = MOTIVO[chave]
    }
  }

  const { chave, compacta } = consulta

  if (c.chave === chave) marcar('exata')
  else if (c.chave.startsWith(chave)) marcar('prefixo')
  else if (c.palavras.some(p => p.startsWith(chave))) marcar('palavraInicial')
  else if (c.chave.includes(` ${chave} `) || c.chave.endsWith(` ${chave}`)) marcar('palavraInteira')
  else if (c.chave.includes(chave)) marcar('contida')

  if (c.iniciais && (c.iniciais === compacta || c.iniciais.startsWith(compacta))) marcar('sigla')
  if (nivel === 0 && (c.compacta.includes(compacta) || c.colada.includes(consulta.colada))) {
    marcar('compacta')
  }

  // Termo a termo. Roda sempre — é daqui que sai a cobertura, e sem ela a
  // consulta de duas palavras aceitaria itens que só têm uma delas.
  let somaTermos = 0
  const firmes: number[] = []
  const fracos: number[] = []

  for (let i = 0; i < consulta.termos.length; i++) {
    const termo = consulta.termos[i]
    let melhor = 0
    let firme = false

    for (const palavra of c.palavras) {
      if (palavra === termo) { melhor = TERMO.exato; firme = true; break }
      // Uma letra solta não é prefixo de nada: em "raio x", o "x" casaria com
      // metade do catálogo e a busca inteira perderia o sentido.
      if (termo.length >= 2 && palavra.startsWith(termo)) {
        // Prefixo longo vale quase tanto quanto igualdade; prefixo de duas
        // letras dentro de uma palavra enorme quase não diz nada.
        const proporcao = termo.length / palavra.length
        const pontos = TERMO.prefixo * (0.55 + 0.45 * proporcao)
        if (pontos > melhor) { melhor = pontos; firme = true }
      } else if (termo.length >= 3 && palavra.includes(termo)) {
        if (TERMO.contido > melhor) { melhor = TERMO.contido; firme = true }
      }
    }

    // Daqui para baixo tudo é casamento frouxo, e frouxo só vale para termo com
    // corpo. Abaixo de três letras, ou a palavra bate inteira (ou pelo começo),
    // ou o termo simplesmente não foi encontrado neste campo.
    const podeAfrouxar = termo.length >= 3

    if (melhor === 0 && podeAfrouxar && (c.compacta.includes(termo) || c.colada.includes(termo))) {
      // Casa quando o termo cruza a fronteira de duas palavras ("bancoquestoes").
      // Vale menos por ser um casamento mais frouxo.
      melhor = TERMO.contido * 0.7
      firme = true
    }

    if (melhor === 0 && podeAfrouxar) {
      const teto = consulta.tetos[i]
      if (teto > 0) {
        for (const palavra of c.palavras) {
          const distancia = distanciaLimitada(termo, palavra, teto)
          if (distancia <= teto) {
            const pontos = TERMO.aproximado - (distancia - 1) * 10
            if (pontos > melhor) melhor = pontos
          }
        }
      }
      // Subsequência só em campo curto. Num campo longo — uma lista de vinte
      // sinônimos, uma descrição inteira — as letras de qualquer termo aparecem
      // em ordem em algum lugar, e o casamento deixa de significar coisa alguma.
      if (
        melhor === 0 &&
        termo.length >= 4 &&
        c.colada.length <= termo.length * 3 &&
        ehSubsequencia(termo, c.colada)
      ) {
        melhor = TERMO.subsequencia
      }
    }

    if (melhor > 0) {
      // O primeiro termo pesa mais: é o que a pessoa tinha em mente ao começar
      // a digitar, e os seguintes costumam ser qualificadores.
      somaTermos += melhor * (i === 0 ? 1.15 : 1)
      if (firme) firmes.push(i)
      else fracos.push(i)
    }
  }

  if (nivel === 0 && somaTermos === 0) return null

  if (nivel === 0 && fracos.length > 0 && firmes.length === 0) {
    motivo = MOTIVO.aproximada
  } else if (nivel === 0) {
    motivo = 'Contém os termos'
  }

  return { pontos: nivel + somaTermos * 0.62, motivo, firmes, fracos }
}

/**
 * Personalização: o que você abre sempre sobe, e o que abriu há pouco sobe mais.
 *
 * É MULTIPLICATIVO, não um bônus fixo. Um bônus fixo faz o item habitual passar
 * na frente de qualquer coisa quando a consulta é fraca (o histórico vira a
 * resposta) e não faz diferença nenhuma quando a consulta é forte. Como fator,
 * o hábito só desempata entre casamentos de qualidade parecida — que é
 * exatamente quando ele é informação útil.
 */
const TETO_DO_HABITO = 0.35

function fatorDeUso(id: string, historico: HistoricoDeUso | undefined, agora: number): number {
  if (!historico) return 1

  const aberturas = historico.aberturas?.[id] ?? 0
  // Logaritmo, não contagem direta: a diferença entre 1 e 3 aberturas é sinal
  // forte; entre 40 e 42 não é sinal nenhum.
  const frequencia = aberturas > 0 ? 0.1 * Math.log2(1 + aberturas) : 0

  const ultima = historico.ultimaAbertura?.[id]
  let recencia = 0
  if (ultima) {
    const dias = (agora - ultima) / 86_400_000
    if (dias < 14) recencia = 0.12 * (1 - dias / 14)
  }

  return 1 + Math.min(TETO_DO_HABITO, frequencia + recencia)
}

export interface OpcoesDeBusca {
  limite?: number
  historico?: HistoricoDeUso
  agora?: number
}

/**
 * Ranqueia o índice. `limite` corta DEPOIS de ordenar — cortar antes traria os
 * primeiros do arquivo, não os melhores.
 */
export function ranquear<T extends ItemBuscavel>(
  indice: readonly ItemIndexado<T>[],
  texto: string,
  { limite = 24, historico, agora = Date.now() }: OpcoesDeBusca = {},
): Resultado<T>[] {
  const consulta = prepararConsulta(texto)
  if (!consulta) return []

  const achados: Array<Resultado<T> & { prioridade: number }> = []

  for (const indexado of indice) {
    let melhorCampo = 0
    let outros = 0
    let motivo = ''
    const firmes = new Set<number>()
    const fracos = new Set<number>()

    for (const c of indexado.campos) {
      const r = pontuarCampo(c, consulta)
      if (!r) continue
      const pontos = r.pontos * c.peso
      if (pontos > melhorCampo) {
        outros += melhorCampo
        melhorCampo = pontos
        motivo = r.motivo
      } else {
        outros += pontos
      }
      for (const i of r.firmes) firmes.add(i)
      for (const i of r.fracos) fracos.add(i)
    }

    if (melhorCampo === 0) continue

    // Um termo achado com todas as letras no título não vira "aproximado" só
    // porque a descrição também tem uma palavra parecida. Vale o melhor
    // casamento que o item conseguiu para aquele termo, não o pior.
    for (const i of firmes) fracos.delete(i)

    // Eliminatória: todo termo precisa aparecer em ALGUM campo do item.
    const cobertos = firmes.size + fracos.size
    if (cobertos < consulta.termos.length) continue

    // Campos secundários contam pouco: eles confirmam a relevância, não a
    // definem. Somar cheio faria uma descrição prolixa vencer um título certeiro.
    let pontos = melhorCampo + outros * 0.16

    // Cobertura só por aproximação é sinal fraco de propósito: quem digitou
    // certo tem que vir antes de quem foi corrigido.
    if (fracos.size > 0) pontos *= 1 - Math.min(0.4, 0.18 * fracos.size)

    const prioridade = indexado.item.prioridade ?? 0
    pontos *= 1 + prioridade / 40
    pontos *= fatorDeUso(indexado.item.id, historico, agora)

    // Concisão como desempate suave: entre dois títulos que casam igual, o mais
    // curto costuma ser o item que a pessoa quis ("Provas" antes de
    // "Provas anteriores do módulo de cardiologia").
    pontos -= Math.min(40, indexado.tamanhoTitulo / 4)

    achados.push({ item: indexado.item, pontos, motivo, prioridade })
  }

  achados.sort(
    (a, b) =>
      b.pontos - a.pontos ||
      b.prioridade - a.prioridade ||
      a.item.titulo.localeCompare(b.item.titulo, 'pt-BR'),
  )

  return achados.slice(0, limite).map(({ item, pontos, motivo }) => ({ item, pontos, motivo }))
}

/**
 * Buscador com memória de consultas. A cada tecla o React re-renderiza e a
 * mesma consulta seria ranqueada de novo; apagar uma letra volta para uma
 * consulta que acabou de rodar. O cache torna esses dois casos gratuitos.
 *
 * A chave inclui a versão do histórico porque abrir um resultado muda a ordem
 * — sem isso a lista ficaria congelada no ranking anterior.
 */
export function criarBuscador<T extends ItemBuscavel>(
  itens: readonly T[],
  padrao: OpcoesDeBusca = {},
) {
  const indice = indexar(itens)
  const cache = new Map<string, Resultado<T>[]>()
  const CACHE_MAXIMO = 60

  return {
    indice,
    buscar(texto: string, opcoes: OpcoesDeBusca & { versao?: string | number } = {}) {
      const limite = opcoes.limite ?? padrao.limite ?? 24
      const chave = `${limite}|${opcoes.versao ?? ''}|${chaveDeBusca(texto)}`
      const emCache = cache.get(chave)
      if (emCache) return emCache

      const resultado = ranquear(indice, texto, {
        limite,
        historico: opcoes.historico ?? padrao.historico,
        agora: opcoes.agora ?? padrao.agora,
      })

      if (cache.size >= CACHE_MAXIMO) cache.clear()
      cache.set(chave, resultado)
      return resultado
    },
    limpar() {
      cache.clear()
    },
  }
}
