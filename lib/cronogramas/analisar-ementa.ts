/**
 * Leitor do markdown de ementa.
 *
 * Este módulo é puro e client-safe de propósito: o painel usa para mostrar a
 * prévia enquanto o admin cola o texto, e a rota de importação usa para gravar.
 * As duas lendo o MESMO código é o que garante que a prévia seja a verdade —
 * um parser no cliente e outro no servidor divergiriam na primeira correção.
 *
 * Dois formatos convivem, e em ambos o NÍVEL vem escrito no rótulo da linha,
 * não na indentação. É isso que salva documento com indentação inconsistente
 * (linha inteira recuada, `└─` no lugar de `├─`, negrito no meio do rótulo):
 *
 *     TÓPICO: SOI I:
 *     1. Subtópico: BASES CELULARES (Prioridade: Alta)
 *     ├─ Módulo: Ciclo celular (Prioridade: Alta)
 *     │   ├─ Submódulo: Interfase e fase M (Prioridade: Alta)
 *
 *     ## 1º PERÍODO
 *     **TÓPICO: Competência Relacional**
 *     > SUBTÓPICO: Comunicação Interpessoal
 *     > > MÓDULO: Escuta ativa e empatia
 *     > > > SUBMÓDULO: Técnicas de escuta sem julgamento
 *
 * `(Prioridade: Alta | Média | Baixa)` é opcional em qualquer nível. Quem não
 * declara entra como `normal`.
 */

import {
  SECOES,
  type EmentaTopico,
  type Prioridade,
  type SecaoCurso,
} from './tipos'

// ── Normalização de texto ───────────────────────────────────────────────────

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function slug(texto: string): string {
  return semAcento(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
}

/** Tira numeração de lista, pontuação solta e negrito residual do markdown. */
function limparNome(bruto: string): string {
  return bruto
    .replace(/\*\*/g, '')
    .replace(/^\s*\d+[.)]\s*/, '')
    .replace(/^[-–—•·]\s*/, '')
    .replace(/\s*[:–-]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Separa o nome do item da prioridade declarada entre parênteses no fim.
 * "Ciclo celular (Prioridade: Alta)" → { nome: 'Ciclo celular', prioridade: 'alta' }
 */
export function extrairPrioridade(bruto: string): { nome: string; prioridade: Prioridade } {
  const nome = bruto.trim()
  const encontrado = nome.match(/\s*\(\s*prioridade\s*:\s*([^)]+)\)\s*$/i)
  if (!encontrado) return { nome: limparNome(nome), prioridade: 'normal' }

  const rotulo = semAcento(encontrado[1]).trim().toLowerCase()
  const prioridade: Prioridade = rotulo.startsWith('alt')
    ? 'alta'
    : rotulo.startsWith('baix')
      ? 'baixa'
      : rotulo.startsWith('med')
        ? 'media'
        : 'normal'

  return { nome: limparNome(nome.slice(0, encontrado.index)), prioridade }
}

/** Remove o desenho da árvore (│ ├ └ ─) e a indentação da esquerda. */
function tirarDesenho(linha: string): string {
  return linha.replace(/^[\s│|]*[├└]?[─-]*\s*/, '').trim()
}

/** Remove os marcadores de citação (`> > >`). */
function tirarCitacao(linha: string): string {
  return linha.replace(/^[\s>]+/, '').trim()
}

// ── Parser ──────────────────────────────────────────────────────────────────

interface SubmoduloBruto {
  nome: string
  prioridade: Prioridade
}

interface ModuloBruto {
  nome: string
  prioridade: Prioridade
  submodulos: SubmoduloBruto[]
}

interface SubtopicoBruto {
  nome: string
  prioridade: Prioridade
  modulos: ModuloBruto[]
}

export interface TopicoBruto {
  nome: string
  prioridade: Prioridade
  subtopicos: SubtopicoBruto[]
}

export interface EmentaAnalisada {
  /** Período achado num cabeçalho "## 3º PERÍODO", se o documento tiver. */
  periodoDetectado: number | null
  topicos: TopicoBruto[]
  /** Linhas que o parser não soube classificar (fora as vazias e decorativas). */
  linhasIgnoradas: number
}

/** Lê o markdown e devolve a árvore crua — sem ids, sem horas. */
export function analisarEmenta(conteudo: string): EmentaAnalisada {
  const topicos: TopicoBruto[] = []
  let periodoDetectado: number | null = null
  let linhasIgnoradas = 0

  let topicoAtual: TopicoBruto | null = null
  let subtopicoAtual: SubtopicoBruto | null = null
  let moduloAtual: ModuloBruto | null = null

  for (const linhaBruta of String(conteudo ?? '').split(/\r?\n/)) {
    const linha = linhaBruta.trim()
    if (!linha || /^-{3,}$/.test(linha)) continue

    // "## 3º PERÍODO" — cabeçalho de período dos arquivos em citação.
    const cabecalhoPeriodo = linha.match(/^#{1,6}\s*(\d{1,2})\s*[ºo°]?\s*per[ií]odo/i)
    if (cabecalhoPeriodo) {
      periodoDetectado = Number(cabecalhoPeriodo[1])
      continue
    }

    // Título solto do documento ("# 🦷 ODONTOLOGIA", "PSICOLOGIA - 1° PERÍODO").
    if (/^#{1,6}\s/.test(linha) && !/t[óo]pico/i.test(linha)) continue

    const cru = linha.startsWith('>') ? tirarCitacao(linha) : tirarDesenho(linha)
    // O rótulo do nível pode vir embrulhado em negrito (`**TÓPICO: …**`) ou
    // atrás da numeração da lista (`1. Subtópico: …`). Tirar os dois aqui é o
    // que faz a detecção funcionar nos dois formatos com o mesmo par de regex.
    const texto = cru.replace(/\*\*/g, '').replace(/^\s*\d+[.)]\s*/, '').trim()
    if (!texto) continue

    const rotulo = semAcento(texto).toLowerCase()

    if (/^t[óo]pico\s*:/i.test(texto) || /^topico\s*:/.test(rotulo)) {
      const { nome, prioridade } = extrairPrioridade(texto.replace(/^t[óo]pico\s*:/i, ''))
      if (!nome) continue
      topicoAtual = { nome, prioridade, subtopicos: [] }
      subtopicoAtual = null
      moduloAtual = null
      topicos.push(topicoAtual)
      continue
    }

    // A ordem importa: "submodulo" contém "modulo", "subtopico" contém "topico".
    if (rotulo.startsWith('submodulo')) {
      if (!moduloAtual) {
        linhasIgnoradas += 1
        continue
      }
      const { nome, prioridade } = extrairPrioridade(texto.replace(/^subm[óo]dulo\s*:/i, ''))
      if (!nome) continue
      moduloAtual.submodulos.push({ nome, prioridade })
      continue
    }

    if (rotulo.startsWith('modulo')) {
      if (!subtopicoAtual) {
        linhasIgnoradas += 1
        continue
      }
      const { nome, prioridade } = extrairPrioridade(texto.replace(/^m[óo]dulo\s*:/i, ''))
      if (!nome) continue
      moduloAtual = { nome, prioridade, submodulos: [] }
      subtopicoAtual.modulos.push(moduloAtual)
      continue
    }

    if (rotulo.startsWith('subtopico')) {
      if (!topicoAtual) {
        // Documento que começa direto no subtópico ainda é aproveitável: o
        // tópico guarda-chuva é inventado em vez de descartar o arquivo.
        topicoAtual = { nome: 'Conteúdo', prioridade: 'normal', subtopicos: [] }
        topicos.push(topicoAtual)
      }
      const { nome, prioridade } = extrairPrioridade(texto.replace(/^subt[óo]pico\s*:/i, ''))
      if (!nome) continue
      subtopicoAtual = { nome, prioridade, modulos: [] }
      moduloAtual = null
      topicoAtual.subtopicos.push(subtopicoAtual)
      continue
    }

    linhasIgnoradas += 1
  }

  return { periodoDetectado, topicos, linhasIgnoradas }
}

// ── Estimativa de horas ─────────────────────────────────────────────────────

const PESO_PRIORIDADE: Record<Prioridade, number> = { alta: 1.35, media: 1, normal: 1, baixa: 0.7 }

/**
 * Horas de estudo de um módulo. A base é o tamanho real do módulo (quantos
 * submódulos ele tem), e a prioridade estica ou encolhe em torno disso.
 *
 * Um módulo sem submódulo declarado não é vazio — é um assunto que o documento
 * não detalhou —, então recebe o mesmo piso de 2h de um módulo com um item.
 */
function estimarHoras(modulo: ModuloBruto): number {
  const itens = Math.max(1, modulo.submodulos.length)
  const base = 1.5 + itens * 0.75
  return Math.max(2, Math.round(base * PESO_PRIORIDADE[modulo.prioridade] * 2) / 2)
}

// ── Montagem com ids estáveis ───────────────────────────────────────────────

/**
 * Fábrica de ids únicos e ESTÁVEIS dentro de um período.
 *
 * O id sai do nome, não da posição. Isso importa porque reimportar é rotina
 * agora: o admin corrige uma linha do markdown e sobe de novo. Com id
 * posicional, inserir um tópico no meio renumeraria todos os seguintes, e as
 * avaliações que apontam para "o subtópico X" passariam a apontar para outro
 * assunto. O sufixo numérico só aparece quando dois irmãos têm nomes que
 * colidem no slug.
 */
function criarGeradorDeId(prefixo: string) {
  const usados = new Map<string, number>()

  return (nome: string): string => {
    const base = `${prefixo}-${slug(nome) || 'item'}`
    const vezes = usados.get(base) ?? 0
    usados.set(base, vezes + 1)
    return vezes === 0 ? base : `${base}-${vezes + 1}`
  }
}

/** Converte a árvore crua em ementa com ids e horas, pronta para gravar. */
export function montarEmenta(secao: SecaoCurso, periodo: number, brutos: TopicoBruto[]): EmentaTopico[] {
  const idDoTopico = criarGeradorDeId(`${secao}-p${periodo}`)

  return brutos.map(topico => {
    const topicoId = idDoTopico(topico.nome)
    const idDoSubtopico = criarGeradorDeId(topicoId)

    return {
      id: topicoId,
      nome: topico.nome,
      prioridade: topico.prioridade,
      incluido: false,
      subtopicos: topico.subtopicos.map(sub => {
        const subId = idDoSubtopico(sub.nome)
        const idDoModulo = criarGeradorDeId(subId)

        return {
          id: subId,
          nome: sub.nome,
          prioridade: sub.prioridade,
          incluido: false,
          modulos: sub.modulos.map(modulo => {
            const moduloId = idDoModulo(modulo.nome)
            const idDoSubmodulo = criarGeradorDeId(moduloId)

            return {
              id: moduloId,
              nome: modulo.nome,
              prioridade: modulo.prioridade,
              horasEstimadas: estimarHoras(modulo),
              incluido: false,
              submodulos: modulo.submodulos.map(submodulo => ({
                id: idDoSubmodulo(submodulo.nome),
                nome: submodulo.nome,
                prioridade: submodulo.prioridade,
              })),
            }
          }),
        }
      }),
    }
  })
}

// ── Identificação a partir do nome do arquivo ───────────────────────────────

const ROMANOS: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
}

export interface AlvoDetectado {
  secao: SecaoCurso
  periodo: number | null
  /** "SOI I", "HAM III" — só Medicina nomeia por disciplina. */
  bloco: string | null
}

/**
 * Adivinha seção e período pelo nome do arquivo, para o admin não precisar
 * escolher os dois a cada arquivo ao soltar dez de uma vez.
 *
 * É só um palpite: a tela mostra o que foi detectado e deixa corrigir antes de
 * importar. Medicina nomeia por disciplina ("MEDICINA - SOI III") e o período
 * sai do romano; os demais nomeiam pelo próprio período.
 */
export function detectarAlvo(nomeDoArquivo: string): AlvoDetectado | null {
  const nome = semAcento(String(nomeDoArquivo ?? '')).toUpperCase()

  // Do nome mais longo para o mais curto, porque "BIOMEDICINA" contém
  // "MEDICINA": procurar na ordem do seletor mandaria todo arquivo de
  // Biomedicina para Medicina.
  const secao = [...SECOES]
    .sort((a, b) => b.nome.length - a.nome.length)
    .find(item => nome.includes(semAcento(item.nome).toUpperCase()))
  if (!secao) return null

  const medicina = nome.match(/\b(SOI|HAM)\s+(I{1,3}|IV|VI{0,3}|IX|XI{0,2}|V|X)\b/)
  if (medicina) {
    const periodo = ROMANOS[medicina[2]] ?? null
    return { secao: secao.id, periodo, bloco: `${medicina[1]} ${medicina[2]}` }
  }

  const porPeriodo = nome.match(/(\d{1,2})\s*[ºO°]?\s*PERIODO/)
  if (porPeriodo) {
    return { secao: secao.id, periodo: Number(porPeriodo[1]), bloco: null }
  }

  return { secao: secao.id, periodo: null, bloco: null }
}

// ── Resumo ──────────────────────────────────────────────────────────────────

export interface ResumoEmenta {
  topicos: number
  subtopicos: number
  modulos: number
  submodulos: number
  horas: number
  /** Quantos itens trazem prioridade declarada (ou seja, diferente de normal). */
  comPrioridade: number
}

/** Contagem de uma árvore crua — o que a prévia do painel mostra. */
export function resumirBruto(topicos: TopicoBruto[]): ResumoEmenta {
  const resumo: ResumoEmenta = { topicos: topicos.length, subtopicos: 0, modulos: 0, submodulos: 0, horas: 0, comPrioridade: 0 }
  const contar = (prioridade: Prioridade) => {
    if (prioridade !== 'normal') resumo.comPrioridade += 1
  }

  for (const topico of topicos) {
    contar(topico.prioridade)
    resumo.subtopicos += topico.subtopicos.length

    for (const sub of topico.subtopicos) {
      contar(sub.prioridade)
      resumo.modulos += sub.modulos.length

      for (const modulo of sub.modulos) {
        contar(modulo.prioridade)
        resumo.submodulos += modulo.submodulos.length
        resumo.horas += estimarHoras(modulo)
        for (const submodulo of modulo.submodulos) contar(submodulo.prioridade)
      }
    }
  }

  resumo.horas = Math.round(resumo.horas)
  return resumo
}
