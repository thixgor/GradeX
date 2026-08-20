/**
 * A Aula como unidade de conhecimento (§3, §5, §19, §20, §21).
 *
 * O PRINCÍPIO
 *
 * Criar o conhecimento uma vez e reutilizá-lo em vários caminhos. Tudo neste
 * arquivo existe para sustentar isso: a aula não sabe em que Trilha está, não
 * guarda cópia de nada e não tem "posição" em lugar nenhum. Ela é um objeto
 * independente com uma localização principal na taxonomia e um punhado de
 * relações — quem monta caminhos é a Trilha, por referência.
 *
 * O DOCUMENTO NÃO FOI TROCADO
 *
 * Nada aqui cria uma coleção nova de aulas. `aulas_postagens` continua sendo a
 * única, com todos os campos que já tinha (vídeo, capa, PDFs, regras de acesso,
 * vínculo com /materiais, avaliação, capítulos, transcrição). O que este módulo
 * acrescenta mora em UM campo novo, `ensino`, e é aditivo por decisão: uma aula
 * cadastrada em 2024 abre sem `ensino` e continua funcionando exatamente como
 * abria (§36). Um campo aninhado, e não seis campos soltos na raiz, também
 * evita a colisão mais perigosa desta reforma — `topicoId` já existe na raiz
 * com o significado ANTIGO, e reaproveitá-lo com o significado novo trocaria a
 * organização de todo o acervo existente em silêncio.
 *
 * A AULA RESUMO
 *
 * Não é uma aula independente (§3). É um documento de aula com
 * `ensino.tipo = 'resumo'` apontando para a principal. Ganha assim, de graça,
 * tudo que uma aula tem — player, progresso, acesso, anotações — sem virar um
 * segundo tipo de conteúdo com metade dos recursos. E some da navegação normal:
 * quem procura "Fisiopatologia da IC" deve achar a aula, não duas entradas
 * quase iguais.
 */

import type { NivelDeEnsino } from '@/lib/ensino/taxonomia'

/* =================== PROFUNDIDADE =================== */

/**
 * Grau de profundidade (§21) — o que separa "ECG Essencial" de "Arritmias
 * Avançadas" sem duplicar aula.
 */
export const PROFUNDIDADES = ['essencial', 'intermediario', 'avancado'] as const
export type ProfundidadeDaAula = (typeof PROFUNDIDADES)[number]

export const ROTULO_DA_PROFUNDIDADE: Record<ProfundidadeDaAula, string> = {
  essencial: 'Essencial',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export function ehProfundidadeValida(valor: unknown): valor is ProfundidadeDaAula {
  return typeof valor === 'string' && (PROFUNDIDADES as readonly string[]).includes(valor)
}

/* =================== O BLOCO `ensino` =================== */

/** Aula principal ou versão condensada dela. */
export type TipoDeAula = 'aula' | 'resumo'

/**
 * Onde a aula mora na taxonomia nova.
 *
 * Os quatro níveis são opcionais e independentes: uma aula pode declarar só
 * área+tópico (sem subtópico, que é opcional por especificação — §2) e ainda
 * assim ser encontrada, porque a navegação filtra por qualquer um dos níveis.
 */
export interface LocalizacaoDaAula {
  areaId?: string | null
  moduloId?: string | null
  topicoId?: string | null
  subtopicoId?: string | null
}

export interface BlocoDeEnsinoDaAula extends LocalizacaoDaAula {
  tipo?: TipoDeAula
  /** Preenchido quando `tipo === 'resumo'`: a aula principal deste resumo. */
  aulaPrincipalId?: string | null
  /** Preenchido na aula principal: o resumo vinculado a ela. */
  resumoId?: string | null

  profundidade?: ProfundidadeDaAula
  /** Palavras livres — o caminho lateral para achar a aula (§5). */
  tags?: string[]
  /** Professores desta aula. Uma Trilha pode misturar vários (§26). */
  professorIds?: string[]
  /** Aulas recomendadas ANTES desta. Recomendação, não bloqueio (§19). */
  prerequisitos?: string[]
  /** Decks de flashcards vinculados (§3). */
  flashcardDeckIds?: string[]
  /** Duração em segundos, para exibir "18 min" sem abrir o vídeo. */
  duracaoSegundos?: number
  atualizadoEm?: Date | string
}

/**
 * O documento de aula visto por este subsistema.
 *
 * Deliberadamente frouxo nos campos antigos: este módulo não é dono deles e não
 * deve travar quando um campo legado vier com forma inesperada.
 */
export interface AulaDoEnsino {
  _id: string
  titulo: string
  descricao?: string
  capa?: any
  videoEmbed?: string
  pdfs?: Array<{ nome: string; url: string; tamanho?: number }>
  relacionadas?: string[] | null
  ensino?: BlocoDeEnsinoDaAula | null
  /** Hierarquia ANTIGA. Continua sendo lida — ver `compatibilidade.ts`. */
  setorId?: string
  topicoId?: string
  subtopicoId?: string
  moduloId?: string
  submoduloId?: string
  criadoEm?: Date | string
}

/* =================== NORMALIZAÇÃO =================== */

const TETO_TAGS = 24
const TETO_RELACOES = 24
const TAG_MAX = 48

function listaDeIds(valor: unknown, excluir?: string): string[] {
  if (!Array.isArray(valor)) return []
  const vistos = new Set<string>()
  const saida: string[] = []
  for (const bruto of valor.slice(0, TETO_RELACOES * 2)) {
    const id = String(bruto || '').trim()
    // Uma aula que é pré-requisito de si mesma trava a recomendação em laço —
    // e é o erro mais fácil de cometer num seletor de busca.
    if (!/^[a-f0-9]{24}$/i.test(id) || id === excluir || vistos.has(id)) continue
    vistos.add(id)
    saida.push(id)
    if (saida.length >= TETO_RELACOES) break
  }
  return saida
}

export function normalizarTags(valor: unknown): string[] {
  const bruto = Array.isArray(valor)
    ? valor
    : String(valor || '')
        .split(',')
        .filter(Boolean)

  const vistas = new Set<string>()
  const saida: string[] = []
  for (const item of bruto) {
    const tag = String(item || '').trim().replace(/\s+/g, ' ').slice(0, TAG_MAX)
    if (!tag) continue
    const chave = tag.toLowerCase()
    if (vistas.has(chave)) continue
    vistas.add(chave)
    saida.push(tag)
    if (saida.length >= TETO_TAGS) break
  }
  return saida
}

function idOuNulo(valor: unknown): string | null {
  const id = String(valor || '').trim()
  return /^[a-f0-9]{24}$/i.test(id) ? id : null
}

/**
 * Limpa o bloco `ensino` que veio da tela ou de um arquivo de importação.
 *
 * Devolve sempre um objeto (nunca `null`) para o documento não oscilar entre
 * "campo ausente" e "campo vazio" — a diferença entre os dois não significa
 * nada aqui e só produziria consultas com dois casos.
 */
export function normalizarBlocoDeEnsino(
  entrada: any,
  opcoes: { aulaId?: string } = {},
): BlocoDeEnsinoDaAula {
  const tipo: TipoDeAula = entrada?.tipo === 'resumo' ? 'resumo' : 'aula'
  const duracao = Math.max(0, Math.floor(Number(entrada?.duracaoSegundos) || 0))

  return {
    tipo,
    areaId: idOuNulo(entrada?.areaId),
    moduloId: idOuNulo(entrada?.moduloId),
    topicoId: idOuNulo(entrada?.topicoId),
    subtopicoId: idOuNulo(entrada?.subtopicoId),
    // Um resumo aponta para a principal; uma aula principal aponta para o seu
    // resumo. Guardar os dois lados é o que permite abrir a aba "Resumo" sem
    // varrer a coleção atrás de quem aponta para cá.
    aulaPrincipalId: tipo === 'resumo' ? idOuNulo(entrada?.aulaPrincipalId) : null,
    resumoId: tipo === 'aula' ? idOuNulo(entrada?.resumoId) : null,
    profundidade: ehProfundidadeValida(entrada?.profundidade) ? entrada.profundidade : undefined,
    tags: normalizarTags(entrada?.tags),
    professorIds: listaDeIds(entrada?.professorIds),
    prerequisitos: listaDeIds(entrada?.prerequisitos, opcoes.aulaId),
    flashcardDeckIds: listaDeIds(entrada?.flashcardDeckIds),
    duracaoSegundos: duracao || undefined,
    atualizadoEm: new Date(),
  }
}

/* =================== LEITURA =================== */

/** `1080` → `"18 min"`. Vazio quando a duração é desconhecida. */
export function duracaoLegivel(segundos?: number | null): string {
  const total = Math.max(0, Math.floor(Number(segundos) || 0))
  if (total <= 0) return ''
  if (total < 60) return `${total}s`
  const minutos = Math.round(total / 60)
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto > 0 ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`
}

/**
 * O nó mais específico que a aula declara.
 *
 * A localização exibida ("Cardiologia › Insuficiência Cardíaca") sai daqui, e a
 * navegação por ramo também: filtrar por Tópico precisa alcançar as aulas que
 * só declararam Subtópico.
 */
export function noPrincipalDaAula(
  aula: Pick<AulaDoEnsino, 'ensino'>,
): { id: string; nivel: NivelDeEnsino } | null {
  const e = aula.ensino
  if (!e) return null
  if (e.subtopicoId) return { id: String(e.subtopicoId), nivel: 'subtopico' }
  if (e.topicoId) return { id: String(e.topicoId), nivel: 'topico' }
  if (e.moduloId) return { id: String(e.moduloId), nivel: 'modulo' }
  if (e.areaId) return { id: String(e.areaId), nivel: 'area' }
  return null
}

/** Todos os nós declarados pela aula — é por eles que o filtro por ramo casa. */
export function nosDaAula(aula: Pick<AulaDoEnsino, 'ensino'>): string[] {
  const e = aula.ensino
  if (!e) return []
  return [e.areaId, e.moduloId, e.topicoId, e.subtopicoId]
    .filter(Boolean)
    .map((id) => String(id))
}

/** A aula está classificada na taxonomia nova? Alimenta o painel de pendências. */
export function estaClassificada(aula: Pick<AulaDoEnsino, 'ensino'>): boolean {
  return nosDaAula(aula).length > 0
}

/* =================== OS RECURSOS DA AULA =================== */

/**
 * As abas da aula (§10), derivadas do que ela realmente tem.
 *
 * A lista é montada aqui, e não na tela, por dois motivos: a página de assistir
 * e o cartão do catálogo precisam concordar sobre o que existe ("✓ Resumo ✓ PDF
 * ✓ Flashcards" no admin é a mesma verdade que as abas do aluno), e aba vazia
 * é ruído — a interface deve continuar limpa, com o que existe e nada além
 * (§10, §34).
 */
export type RecursoDaAula = 'aula' | 'resumo' | 'pdf' | 'flashcards' | 'anotacoes' | 'discussao'

export interface DisponibilidadeDeRecursos {
  aula: boolean
  resumo: boolean
  pdf: boolean
  flashcards: boolean
  /** Sempre verdadeiro para quem está logado — anotação não depende de cadastro
   *  de conteúdo. */
  anotacoes: boolean
  discussao: boolean
}

export function recursosDaAula(
  aula: Pick<AulaDoEnsino, 'videoEmbed' | 'pdfs' | 'ensino'>,
  opcoes: { logado?: boolean; discussaoAtiva?: boolean } = {},
): DisponibilidadeDeRecursos {
  const e = aula.ensino
  return {
    aula: Boolean(aula.videoEmbed),
    resumo: Boolean(e?.resumoId),
    pdf: Array.isArray(aula.pdfs) && aula.pdfs.length > 0,
    flashcards: Array.isArray(e?.flashcardDeckIds) && (e?.flashcardDeckIds || []).length > 0,
    anotacoes: opcoes.logado !== false,
    // A arquitetura fica pronta mesmo desligada (§10): a aba existe no modelo,
    // e ligá-la depois não muda nenhuma tela.
    discussao: opcoes.discussaoAtiva === true,
  }
}

export const ROTULO_DO_RECURSO: Record<RecursoDaAula, string> = {
  aula: 'Aula',
  resumo: 'Resumo',
  pdf: 'PDF',
  flashcards: 'Flashcards',
  anotacoes: 'Anotações',
  discussao: 'Dúvidas',
}
