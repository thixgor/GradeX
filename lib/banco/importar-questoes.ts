import { paraBusca } from '@/lib/banco/hierarquia'

/**
 * Ler o arquivo de texto da importação em massa do Banco de Questões.
 *
 * ## Por que existe um arquivo só para isto
 *
 * A leitura vivia dentro da rota `POST /api/admin/banco/importar`, e por isso
 * só era possível descobrir se o arquivo estava certo DEPOIS de mandá-lo para
 * o servidor — com metade das questões já gravadas quando a outra metade
 * falhava. Aqui a leitura é pura: não toca em banco, não importa `mongodb`,
 * e por isso roda igual no navegador (para avisar antes de enviar), na rota
 * (que grava) e no teste.
 *
 * ## O erro que motivou a reescrita
 *
 * O corte dos blocos era feito com
 *
 *     conteudo.split(/\n\s*\n(?=\s*\[(OBJETIVA|DISCURSIVA)\])/i)
 *
 * e `String.prototype.split` **devolve os grupos de captura junto com os
 * pedaços** — inclusive os que estão dentro de um lookahead. Cada fronteira
 * entre duas questões injetava um bloco de texto igual a "OBJETIVA" ou
 * "DISCURSIVA", que caía direto na validação como
 * "Tipo não especificado ([OBJETIVA] ou [DISCURSIVA])". Ou seja: um arquivo
 * perfeito com 40 questões importava as 40 e ainda assim exibia 39 erros
 * vermelhos. O grupo virou não-capturante e o corte passou a ser feito
 * varrendo linha a linha, o que também dá o número de linha REAL de cada
 * problema (o cálculo anterior, com `indexOf` do bloco já normalizado,
 * devolvia 1 para tudo em arquivo salvo com quebra de linha do Windows).
 *
 * ## O que o formato aceita hoje
 *
 * Além do que já era aceito, e sem quebrar nenhum arquivo antigo:
 *
 * - rótulos sem acento, em qualquer caixa e com espaço antes dos dois pontos
 *   (`modulo :` = `MÓDULO:`), mais sinônimos (`GABARITO:` = `CORRETA:`,
 *   `COMENTÁRIO:` = `EXPLICAÇÃO:`, `PERGUNTA:` = `ENUNCIADO:`);
 * - alternativas escritas como `A)`, `A.`, `A -` ou `(A)`, em minúscula, e
 *   ocupando várias linhas;
 * - `CORRETA: letra B`, `CORRETA: b)` — a letra é extraída do que vier;
 * - `TIPO: objetiva` como alternativa ao marcador `[OBJETIVA]`;
 * - `IMAGEM A:` para imagem de alternativa, `SEMESTRE:` junto de `ANO:`;
 * - `---` só é separador quando a linha inteira é traço. Antes, QUALQUER `---`
 *   no arquivo — um travessão numa explicação — trocava o modo de corte e
 *   picava as questões no meio.
 *
 * O tópico deixou de ser obrigatório: sem ele a questão vai para "Geral" com
 * um aviso, em vez de ser recusada. Recusar obrigava a reescrever o arquivo
 * para informar um nível que o admin pode arrumar depois na tela de
 * hierarquia — e questão recusada é questão que ninguém importa.
 */

export type TipoDeQuestao = 'objetiva' | 'discursiva'
export type NivelDeDificuldade = 'facil' | 'medio' | 'dificil'

export interface AlternativaLida {
  letra: string
  texto: string
  imagemUrl?: string
}

export interface QuestaoLida {
  /** Linha onde o bloco começa — o que aparece no relatório de erro. */
  linha: number
  tipo: TipoDeQuestao
  modulo: string
  topico: string
  subtopico?: string
  enunciado: string
  imagemUrl?: string
  alternativas?: AlternativaLida[]
  correta?: string
  respostaModelo?: string
  explicacao?: string
  dificuldade?: NivelDeDificuldade
  tags?: string[]
  fonte?: string
  ano?: number
  semestre?: 1 | 2
}

export interface OcorrenciaDeImportacao {
  linha: number
  mensagem: string
}

export interface LeituraDaImportacao {
  questoes: QuestaoLida[]
  /** Impedem a questão de entrar. */
  erros: OcorrenciaDeImportacao[]
  /** A questão entra mesmo assim; o aviso diz o que foi assumido ou ignorado. */
  avisos: OcorrenciaDeImportacao[]
}

/** Tópico de quem não informou nenhum. */
export const TOPICO_PADRAO = 'Geral'

const LETRAS_VALIDAS = ['A', 'B', 'C', 'D', 'E']

/**
 * Rótulo do arquivo → campo interno.
 *
 * A chave é o rótulo já normalizado por `paraBusca` (sem acento, minúsculo),
 * então cada linha aqui cobre todas as grafias daquela palavra.
 */
const CAMPOS: Record<string, string> = {
  tipo: 'tipo',
  periodo: 'periodo',
  modulo: 'modulo',
  disciplina: 'modulo',
  topico: 'topico',
  assunto: 'topico',
  subtopico: 'subtopico',
  subassunto: 'subtopico',
  enunciado: 'enunciado',
  pergunta: 'enunciado',
  questao: 'enunciado',
  imagem: 'imagem',
  img: 'imagem',
  'imagem do enunciado': 'imagem',
  correta: 'correta',
  gabarito: 'correta',
  'resposta correta': 'correta',
  'alternativa correta': 'correta',
  resposta: 'resposta',
  'resposta modelo': 'resposta',
  'resposta esperada': 'resposta',
  explicacao: 'explicacao',
  comentario: 'explicacao',
  justificativa: 'explicacao',
  dificuldade: 'dificuldade',
  nivel: 'dificuldade',
  tags: 'tags',
  tag: 'tags',
  'palavras chave': 'tags',
  fonte: 'fonte',
  origem: 'fonte',
  ano: 'ano',
  semestre: 'semestre',
}

/** `[OBJETIVA]` / `[ DISCURSIVA ]` — a linha inteira, nada mais. */
function lerMarcadorDeTipo(linha: string): TipoDeQuestao | null {
  const m = linha.trim().match(/^\[\s*([\p{L}]+)\s*\]$/u)
  if (!m) return null
  return lerTipo(m[1])
}

function lerTipo(valor: string): TipoDeQuestao | null {
  const v = paraBusca(valor)
  if (v === 'objetiva' || v === 'multipla escolha' || v === 'fechada') return 'objetiva'
  if (v === 'discursiva' || v === 'dissertativa' || v === 'aberta') return 'discursiva'
  return null
}

/** Linha só de traços: separador legado entre questões. */
function ehSeparador(linha: string): boolean {
  return /^\s*[-–—_=*]{3,}\s*$/.test(linha)
}

interface Rotulo {
  campo: string
  /** Preenchida em `IMAGEM A:` — a alternativa a que a imagem pertence. */
  letra?: string
  valor: string
}

function lerRotulo(linha: string): Rotulo | null {
  // A chave só pode ser letra e espaço: assim "Paciente de 45 anos: refere
  // dor" continua sendo texto do enunciado, e não um campo desconhecido.
  const m = linha.match(/^\s*([\p{L}][\p{L} ]{0,30})\s*:\s?([\s\S]*)$/u)
  if (!m) return null

  const chave = paraBusca(m[1]).replace(/\s+/g, ' ')
  const valor = m[2].trim()

  const campo = CAMPOS[chave]
  if (campo) return { campo, valor }

  // "IMAGEM A", "IMG B" — imagem de uma alternativa.
  const imagem = chave.match(/^(?:imagem|img)\s+([a-e])$/)
  if (imagem) return { campo: 'imagemAlternativa', letra: imagem[1].toUpperCase(), valor }

  // "ALTERNATIVA C: texto" — mesma coisa que "C) texto".
  const alternativa = chave.match(/^(?:alternativa|opcao)\s+([a-e])$/)
  if (alternativa) return { campo: 'alternativa', letra: alternativa[1].toUpperCase(), valor }

  return null
}

/** `A) texto`, `a. texto`, `(B) texto`, `C - texto`. */
function lerAlternativa(linha: string): { letra: string; texto: string } | null {
  const m = linha.match(/^\s*\(?([A-Ea-e])\)?\s*[)\].\-–:]\s+(\S[\s\S]*)$/)
  if (!m) return null
  return { letra: m[1].toUpperCase(), texto: m[2].trim() }
}

/** Só a letra, de onde ela estiver: "letra B", "b)", "B". */
function lerLetraCorreta(valor: string): string | null {
  const m = valor.toUpperCase().match(/\b([A-E])\b/)
  return m ? m[1] : null
}

/** `\n` escrito no arquivo vira quebra de linha de verdade. */
function aplicarQuebras(texto: string): string {
  return texto.replace(/\\n/g, '\n')
}

function juntar(linhas: string[]): string {
  return aplicarQuebras(linhas.join('\n'))
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface Bloco {
  linha: number
  tipoDoMarcador: TipoDeQuestao | null
  linhas: { n: number; texto: string }[]
}

/**
 * Corta o arquivo em blocos de questão.
 *
 * Um bloco abre em `[OBJETIVA]`/`[DISCURSIVA]`, no começo do arquivo e depois
 * de uma linha de separador. Linha em branco NÃO fecha bloco: campo de várias
 * linhas com parágrafo é comum, e fechar ali partiria o enunciado ao meio.
 */
function cortarEmBlocos(conteudo: string): Bloco[] {
  const linhas = conteudo
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')

  const blocos: Bloco[] = []
  let atual: Bloco | null = null

  linhas.forEach((texto, i) => {
    const n = i + 1

    if (ehSeparador(texto)) {
      atual = null
      return
    }

    const marcador = lerMarcadorDeTipo(texto)
    if (marcador) {
      atual = { linha: n, tipoDoMarcador: marcador, linhas: [] }
      blocos.push(atual)
      return
    }

    if (!atual) {
      if (!texto.trim()) return
      atual = { linha: n, tipoDoMarcador: null, linhas: [] }
      blocos.push(atual)
    }

    atual.linhas.push({ n, texto })
  })

  return blocos
}

interface BlocoLido {
  questao?: QuestaoLida
  erros: OcorrenciaDeImportacao[]
  avisos: OcorrenciaDeImportacao[]
  /** Bloco sem nenhum campo reconhecido: cabeçalho, comentário, sobra. */
  vazio: boolean
}

function lerBloco(bloco: Bloco): BlocoLido {
  const erros: OcorrenciaDeImportacao[] = []
  const avisos: OcorrenciaDeImportacao[] = []

  let tipo: TipoDeQuestao | null = bloco.tipoDoMarcador
  let modulo = ''
  let topico = ''
  let subtopico = ''
  let imagemUrl = ''
  let dificuldade: NivelDeDificuldade | undefined
  let fonte = ''
  let ano: number | undefined
  let semestre: 1 | 2 | undefined
  let correta = ''
  const tags: string[] = []

  const enunciado: string[] = []
  const resposta: string[] = []
  const explicacao: string[] = []
  const alternativas: AlternativaLida[] = []
  const imagensDeAlternativa = new Map<string, string>()

  // Para onde vai uma linha que não é rótulo nem alternativa.
  let destino: 'enunciado' | 'resposta' | 'explicacao' | 'alternativa' | null = null
  let reconheceuAlgo = false

  const acrescentar = (texto: string) => {
    if (destino === 'enunciado') enunciado.push(texto)
    else if (destino === 'resposta') resposta.push(texto)
    else if (destino === 'explicacao') explicacao.push(texto)
    else if (destino === 'alternativa' && alternativas.length > 0) {
      alternativas[alternativas.length - 1].texto += `\n${texto}`
    }
  }

  for (const { n, texto } of bloco.linhas) {
    if (!texto.trim()) {
      // Linha em branco só existe dentro de campo de várias linhas.
      if (destino && destino !== 'alternativa') acrescentar('')
      continue
    }

    const rotulo = lerRotulo(texto)
    if (rotulo) {
      reconheceuAlgo = true
      destino = null

      switch (rotulo.campo) {
        case 'tipo': {
          const lido = lerTipo(rotulo.valor)
          if (lido) tipo = lido
          else erros.push({ linha: n, mensagem: `Tipo "${rotulo.valor}" não existe — use objetiva ou discursiva` })
          break
        }
        case 'periodo':
          // O nível saiu do produto (ver lib/banco/hierarquia.ts). A linha
          // continua sendo aceita para não obrigar ninguém a reescrever
          // arquivo antigo, e some sem alarde.
          break
        case 'modulo':
          modulo = rotulo.valor
          break
        case 'topico':
          topico = rotulo.valor
          break
        case 'subtopico':
          subtopico = rotulo.valor
          break
        case 'imagem':
          imagemUrl = rotulo.valor
          break
        case 'imagemAlternativa':
          if (rotulo.letra && rotulo.valor) imagensDeAlternativa.set(rotulo.letra, rotulo.valor)
          break
        case 'alternativa':
          if (rotulo.letra) {
            alternativas.push({ letra: rotulo.letra, texto: rotulo.valor })
            destino = 'alternativa'
          }
          break
        case 'correta': {
          const letra = lerLetraCorreta(rotulo.valor)
          if (letra) correta = letra
          else erros.push({ linha: n, mensagem: `Não consegui ler a alternativa correta em "${rotulo.valor}"` })
          break
        }
        case 'enunciado':
          enunciado.push(rotulo.valor)
          destino = 'enunciado'
          break
        case 'resposta':
          resposta.push(rotulo.valor)
          destino = 'resposta'
          break
        case 'explicacao':
          explicacao.push(rotulo.valor)
          destino = 'explicacao'
          break
        case 'dificuldade': {
          const v = paraBusca(rotulo.valor)
          if (v === 'facil' || v === 'medio' || v === 'dificil') dificuldade = v
          else if (v === 'media') dificuldade = 'medio'
          else avisos.push({ linha: n, mensagem: `Dificuldade "${rotulo.valor}" não existe (use facil, medio ou dificil) — questão importada sem dificuldade` })
          break
        }
        case 'tags':
          tags.push(...rotulo.valor.split(/[,;]/).map((t) => t.trim()).filter(Boolean))
          break
        case 'fonte':
          fonte = rotulo.valor
          break
        case 'ano': {
          const numero = parseInt(rotulo.valor.replace(/\D/g, ''), 10)
          if (!Number.isNaN(numero) && numero > 1900 && numero < 2200) ano = numero
          else avisos.push({ linha: n, mensagem: `Ano "${rotulo.valor}" não parece um ano — ignorado` })
          break
        }
        case 'semestre': {
          const numero = parseInt(rotulo.valor.replace(/\D/g, ''), 10)
          if (numero === 1 || numero === 2) semestre = numero
          else avisos.push({ linha: n, mensagem: `Semestre "${rotulo.valor}" não é 1 nem 2 — ignorado` })
          break
        }
      }
      continue
    }

    const alternativa = lerAlternativa(texto)
    // Só conta como alternativa depois que o enunciado começou: uma questão
    // que abre com "A) ..." não existe, mas texto começando com "E - " existe.
    // E nunca dentro de EXPLICAÇÃO ou RESPOSTA: citar "A) ..." ao comentar as
    // alternativas não pode reabrir a lista e virar uma alternativa nova.
    if (
      alternativa &&
      (enunciado.length > 0 || alternativas.length > 0) &&
      destino !== 'resposta' &&
      destino !== 'explicacao'
    ) {
      reconheceuAlgo = true
      alternativas.push({ letra: alternativa.letra, texto: alternativa.texto })
      destino = 'alternativa'
      continue
    }

    if (destino) {
      acrescentar(texto.trim())
      continue
    }

    avisos.push({ linha: n, mensagem: `Linha fora de qualquer campo, ignorada: "${resumir(texto.trim())}"` })
  }

  for (const [letra, url] of imagensDeAlternativa) {
    const alvo = alternativas.find((a) => a.letra === letra)
    if (alvo) alvo.imagemUrl = url
    else avisos.push({ linha: bloco.linha, mensagem: `IMAGEM ${letra}: não há alternativa ${letra} nesta questão` })
  }

  const textoEnunciado = juntar(enunciado)

  if (!reconheceuAlgo && !textoEnunciado) {
    return { erros, avisos: [], vazio: true }
  }

  const linha = bloco.linha
  const identificacao = textoEnunciado ? ` (${resumir(textoEnunciado)})` : ''

  if (!tipo) {
    erros.push({
      linha,
      mensagem: `Questão sem tipo${identificacao} — comece o bloco com [OBJETIVA] ou [DISCURSIVA]`,
    })
    return { erros, avisos, vazio: false }
  }

  if (!modulo) {
    erros.push({ linha, mensagem: `Questão sem MÓDULO${identificacao}` })
    return { erros, avisos, vazio: false }
  }

  if (!topico) {
    avisos.push({ linha, mensagem: `Questão sem TÓPICO${identificacao} — foi para "${TOPICO_PADRAO}"` })
    topico = TOPICO_PADRAO
  }

  if (!textoEnunciado) {
    erros.push({ linha, mensagem: 'Questão sem ENUNCIADO' })
    return { erros, avisos, vazio: false }
  }

  const alternativasFinais = alternativas.map((a) => ({
    letra: a.letra,
    texto: juntar([a.texto]),
    imagemUrl: a.imagemUrl,
  }))

  if (tipo === 'objetiva') {
    const letras = alternativasFinais.map((a) => a.letra)
    const repetida = letras.find((l, i) => letras.indexOf(l) !== i)

    if (alternativasFinais.length < 2) {
      erros.push({
        linha,
        mensagem: `Questão objetiva com ${alternativasFinais.length} alternativa(s)${identificacao} — escreva pelo menos duas, uma por linha, no formato "A) texto"`,
      })
      return { erros, avisos, vazio: false }
    }

    if (repetida) {
      erros.push({ linha, mensagem: `Alternativa ${repetida} aparece duas vezes${identificacao}` })
      return { erros, avisos, vazio: false }
    }

    if (alternativasFinais.some((a) => !a.texto)) {
      erros.push({ linha, mensagem: `Alternativa sem texto${identificacao}` })
      return { erros, avisos, vazio: false }
    }

    if (!correta) {
      erros.push({ linha, mensagem: `Questão objetiva sem CORRETA${identificacao}` })
      return { erros, avisos, vazio: false }
    }

    if (!letras.includes(correta)) {
      erros.push({
        linha,
        mensagem: `CORRETA: ${correta}, mas a questão só tem as alternativas ${letras.join(', ')}${identificacao}`,
      })
      return { erros, avisos, vazio: false }
    }
  }

  const textoResposta = juntar(resposta)
  if (tipo === 'discursiva' && !textoResposta) {
    erros.push({ linha, mensagem: `Questão discursiva sem RESPOSTA${identificacao}` })
    return { erros, avisos, vazio: false }
  }

  if (tipo === 'discursiva' && alternativasFinais.length > 0) {
    avisos.push({ linha, mensagem: `Questão discursiva com alternativas${identificacao} — elas foram ignoradas` })
  }

  return {
    questao: {
      linha,
      tipo,
      modulo,
      topico,
      subtopico: subtopico || undefined,
      enunciado: textoEnunciado,
      imagemUrl: imagemUrl || undefined,
      alternativas: tipo === 'objetiva' ? alternativasFinais : undefined,
      correta: tipo === 'objetiva' ? correta : undefined,
      respostaModelo: tipo === 'discursiva' ? textoResposta : undefined,
      explicacao: juntar(explicacao) || undefined,
      dificuldade,
      tags: tags.length > 0 ? tags : undefined,
      fonte: fonte || undefined,
      ano,
      semestre,
    },
    erros,
    avisos,
    vazio: false,
  }
}

/** Recorte curto do texto para caber numa mensagem de erro. */
export function resumir(texto: string, limite = 60): string {
  const limpo = texto.replace(/\s+/g, ' ').trim()
  return limpo.length > limite ? `${limpo.slice(0, limite - 1)}…` : limpo
}

/** Chave de comparação de duas questões: mesmo enunciado, escrito diferente. */
export function chaveDaQuestao(modulo: string, enunciado: string): string {
  return `${paraBusca(modulo)}|${paraBusca(enunciado).replace(/\s+/g, ' ')}`
}

export function lerArquivoDeImportacao(conteudo: string): LeituraDaImportacao {
  const questoes: QuestaoLida[] = []
  const erros: OcorrenciaDeImportacao[] = []
  const avisos: OcorrenciaDeImportacao[] = []

  const blocos = cortarEmBlocos(conteudo || '')

  if (blocos.length === 0) {
    return {
      questoes,
      erros: [{ linha: 1, mensagem: 'Arquivo vazio — nenhuma questão encontrada' }],
      avisos,
    }
  }

  if (blocos.every((b) => b.tipoDoMarcador === null)) {
    // Sem nenhum marcador, o arquivo inteiro vira um bloco só e o erro
    // "questão sem tipo" não diz o que está faltando de verdade.
    erros.push({
      linha: blocos[0].linha,
      mensagem:
        'Nenhuma questão começa com [OBJETIVA] ou [DISCURSIVA]. Cada questão precisa desse marcador na primeira linha.',
    })
    return { questoes, erros, avisos }
  }

  const vistas = new Map<string, number>()

  for (const bloco of blocos) {
    const lido = lerBloco(bloco)
    erros.push(...lido.erros)
    avisos.push(...lido.avisos)

    if (!lido.questao) {
      if (lido.vazio) {
        avisos.push({
          linha: bloco.linha,
          mensagem: `Texto fora de qualquer questão, ignorado: "${resumir(bloco.linhas.map((l) => l.texto).join(' '))}"`,
        })
      }
      continue
    }

    const chave = chaveDaQuestao(lido.questao.modulo, lido.questao.enunciado)
    const anterior = vistas.get(chave)
    if (anterior) {
      avisos.push({
        linha: lido.questao.linha,
        mensagem: `Questão repetida dentro do próprio arquivo (igual à da linha ${anterior}) — importada só uma vez`,
      })
      continue
    }
    vistas.set(chave, lido.questao.linha)

    questoes.push(lido.questao)
  }

  return { questoes, erros, avisos }
}
