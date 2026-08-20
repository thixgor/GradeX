/**
 * Importação de conteúdo por arquivo — Markdown ou JSON.
 *
 * O PROBLEMA QUE ISTO RESOLVE
 *
 * Cadastrar uma Trilha de 29 aulas por formulário são 29 idas ao editor, e
 * reorganizá-la depois são outras tantas. Uma equipe pequena produzindo
 * conteúdo (§30) precisa escrever o plano de ensino num arquivo — que dá para
 * revisar, versionar no Git, comentar e reexecutar — e deixar o sistema montar
 * a estrutura. O Markdown existe porque é o formato em que um professor já
 * escreve; o JSON existe porque é o formato que outra ferramenta já cospe.
 *
 * OS DOIS FORMATOS CONVERGEM
 *
 * O Markdown é convertido para exatamente a mesma estrutura que o JSON entrega
 * (`PacoteDeImportacao`). A partir daí só existe um caminho — uma validação, um
 * planejamento, uma aplicação. Dois analisadores e um modelo, e não dois
 * sistemas de importação.
 *
 * IDEMPOTÊNCIA É REQUISITO, NÃO BÔNUS
 *
 * A chave de tudo é o SLUG, derivado do nome. Reimportar o mesmo arquivo depois
 * de corrigir uma linha atualiza os registros existentes em vez de criar cópias
 * — sem isso, a segunda importação de um arquivo de 40 aulas produziria 40
 * duplicatas e o acervo se perderia na primeira semana de uso.
 *
 * Módulo puro: só texto entra, só estrutura sai. Quem confronta com o banco é
 * `lib/ensino/importacao-servidor.ts`.
 */

import { gerarSlug } from '@/lib/ensino/taxonomia'
import type { NivelDeEnsino } from '@/lib/ensino/taxonomia'
import { ehProfundidadeValida, type ProfundidadeDaAula } from '@/lib/ensino/aula'
import type { NivelDaTrilha } from '@/lib/ensino/trilha'

/* =================== O PACOTE =================== */

export interface NoImportado {
  nivel: NivelDeEnsino
  nome: string
  slug: string
  descricao?: string
  /** Nomes dos ancestrais, da Área até o pai. Vazio para Área. */
  caminho: string[]
}

export interface RecursoImportado {
  nome: string
  url: string
}

export interface AulaImportada {
  titulo: string
  slug: string
  descricao?: string
  /** Nomes da localização: `["Medicina", "Ciclo Básico", "Cardiologia"]`. */
  caminho: string[]
  video?: string
  duracaoSegundos?: number
  profundidade?: ProfundidadeDaAula
  professor?: string
  tags: string[]
  /** Títulos de outras aulas do mesmo pacote (ou já existentes). */
  prerequisitos: string[]
  relacionadas: string[]
  pdfs: RecursoImportado[]
  flashcardDecks: string[]
  /** A Aula Resumo vinculada — vira uma aula com `tipo: 'resumo'` (§3). */
  resumo?: { titulo: string; video?: string; duracaoSegundos?: number }
  /** `gratuita` | `cadastrado` | `plus` | `amostra`. Traduzido na aplicação. */
  acesso?: string
}

export interface EtapaImportada {
  titulo: string
  descricao?: string
  /** Títulos de aulas, na ordem. */
  aulas: string[]
}

export interface TrilhaImportada {
  titulo: string
  slug: string
  subtitulo?: string
  descricao?: string
  objetivo?: string
  publico?: string
  nivel?: NivelDaTrilha
  duracaoEstimadaMin?: number
  aprendizados: string[]
  tags: string[]
  certificado?: boolean
  etapas: EtapaImportada[]
}

export interface PacoteDeImportacao {
  versao: number
  nos: NoImportado[]
  aulas: AulaImportada[]
  trilhas: TrilhaImportada[]
  /** Avisos não fatais: o que foi ignorado e por quê. */
  avisos: string[]
}

export const VERSAO_DO_FORMATO = 1

export function pacoteVazio(): PacoteDeImportacao {
  return { versao: VERSAO_DO_FORMATO, nos: [], aulas: [], trilhas: [], avisos: [] }
}

/* =================== AJUDANTES =================== */

const NIVEIS_POR_ROTULO: Record<string, NivelDeEnsino> = {
  area: 'area',
  modulo: 'modulo',
  topico: 'topico',
  subtopico: 'subtopico',
}

/** Remove acento e caixa de um rótulo de campo (`Duração` → `duracao`). */
function chaveNormalizada(texto: string): string {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * `"12min"`, `"1h20"`, `"720"`, `"12:30"` → segundos.
 *
 * Aceita tudo que um humano escreveria porque o arquivo é escrito à mão. Exigir
 * um formato só transformaria a primeira importação numa sessão de tentativa e
 * erro sobre pontuação.
 */
export function lerDuracaoEmSegundos(bruto: string): number {
  const texto = chaveNormalizada(bruto).replace(/\s+/g, '')
  if (!texto) return 0

  const relogio = texto.match(/^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/)
  if (relogio) {
    const [, a, b, c] = relogio
    return c
      ? Number(a) * 3600 + Number(b) * 60 + Number(c)
      : Number(a) * 60 + Number(b)
  }

  let segundos = 0
  let casou = false
  const horas = texto.match(/(\d+(?:[.,]\d+)?)h/)
  if (horas) {
    segundos += Number(horas[1].replace(',', '.')) * 3600
    casou = true
  }
  const minutos = texto.match(/(\d+(?:[.,]\d+)?)(?:min|m)(?!s)/)
  if (minutos) {
    segundos += Number(minutos[1].replace(',', '.')) * 60
    casou = true
  }
  const segs = texto.match(/(\d+)s\b/)
  if (segs) {
    segundos += Number(segs[1])
    casou = true
  }
  // "1h20" sem unidade no segundo número: o resto depois do h são minutos.
  if (horas && !minutos) {
    const resto = texto.split('h')[1]
    if (/^\d+$/.test(resto || '')) segundos += Number(resto) * 60
  }
  if (casou) return Math.round(segundos)

  // Só número: minutos é a leitura mais provável em plano de aula.
  const soNumero = texto.match(/^(\d+)$/)
  return soNumero ? Number(soNumero[1]) * 60 : 0
}

function listaSeparada(bruto: string): string[] {
  return String(bruto || '')
    .split(/[;,]|(?:\s+\|\s+)/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function lerSimNao(bruto: string): boolean {
  const v = chaveNormalizada(bruto)
  return v === 'sim' || v === 'true' || v === 'yes' || v === '1'
}

/* =================== MARKDOWN =================== */

/**
 * Lê o Markdown padrão da plataforma.
 *
 * A gramática é deliberadamente pequena — três formas e nada mais:
 *
 *   `## Seção`            abre Taxonomia, Aulas ou Trilhas
 *   `### Aula: Título`    abre um registro
 *   `- campo: valor`      preenche um campo do registro aberto
 *
 * Tudo que não casa com isso vira aviso, nunca erro fatal: um arquivo com uma
 * linha torta deve importar as outras 39 aulas e dizer qual linha ficou de
 * fora. Recusar o arquivo inteiro por causa de uma vírgula é o comportamento
 * que faz as pessoas desistirem do importador e voltarem ao formulário.
 *
 * O formato completo está em `docs/formato-importacao-aulas.md`.
 */
export function lerMarkdown(fonte: string): PacoteDeImportacao {
  const pacote = pacoteVazio()
  const linhas = String(fonte || '').split(/\r?\n/)

  type Secao = 'nenhuma' | 'taxonomia' | 'aulas' | 'trilhas'
  let secao: Secao = 'nenhuma'

  let aulaAtual: AulaImportada | null = null
  let trilhaAtual: TrilhaImportada | null = null
  let etapaAtual: EtapaImportada | null = null
  /** Último campo de lista aberto (`aprendizados:`), para os `-` seguintes. */
  let listaAberta: string[] | null = null

  /** Caminho corrente da taxonomia, por nível. */
  const caminhoAtual: string[] = []
  const nivelPorProfundidade: NivelDeEnsino[] = ['area', 'modulo', 'topico', 'subtopico']

  const fecharAula = () => {
    if (aulaAtual && aulaAtual.titulo) pacote.aulas.push(aulaAtual)
    aulaAtual = null
  }
  const fecharEtapa = () => {
    if (trilhaAtual && etapaAtual && etapaAtual.titulo) trilhaAtual.etapas.push(etapaAtual)
    etapaAtual = null
  }
  const fecharTrilha = () => {
    fecharEtapa()
    if (trilhaAtual && trilhaAtual.titulo) pacote.trilhas.push(trilhaAtual)
    trilhaAtual = null
  }

  for (let i = 0; i < linhas.length; i++) {
    const cru = linhas[i]
    const linha = cru.trim()
    if (!linha || linha.startsWith('<!--')) continue

    /* --- Cabeçalhos --------------------------------------------------- */

    const cabecalho = linha.match(/^(#{1,4})\s+(.*)$/)
    if (cabecalho) {
      const nivelMd = cabecalho[1].length
      const conteudo = cabecalho[2].trim()
      const chave = chaveNormalizada(conteudo)
      listaAberta = null

      if (nivelMd === 1) continue // título do arquivo

      if (nivelMd === 2) {
        fecharAula()
        fecharTrilha()
        secao = chave.startsWith('taxonomia')
          ? 'taxonomia'
          : chave.startsWith('aula')
            ? 'aulas'
            : chave.startsWith('trilha')
              ? 'trilhas'
              : 'nenhuma'
        if (secao === 'nenhuma') {
          pacote.avisos.push(`Linha ${i + 1}: seção "${conteudo}" desconhecida — ignorada.`)
        }
        continue
      }

      const [rotulo, ...resto] = conteudo.split(':')
      const valor = resto.join(':').trim()
      const tipo = chaveNormalizada(rotulo)

      if (nivelMd === 3 && (tipo === 'aula' || secao === 'aulas')) {
        fecharAula()
        aulaAtual = novaAulaImportada(valor || conteudo, caminhoAtual.slice())
        continue
      }

      if (nivelMd === 3 && (tipo === 'trilha' || secao === 'trilhas')) {
        fecharTrilha()
        trilhaAtual = novaTrilhaImportada(valor || conteudo)
        continue
      }

      if (nivelMd === 4 && trilhaAtual) {
        fecharEtapa()
        etapaAtual = { titulo: valor || conteudo, aulas: [] }
        continue
      }

      pacote.avisos.push(`Linha ${i + 1}: "${conteudo}" fora de contexto — ignorada.`)
      continue
    }

    /* --- Itens de lista ------------------------------------------------ */

    const item = cru.match(/^(\s*)[-*+]\s+(.*)$/)
    if (!item) {
      pacote.avisos.push(`Linha ${i + 1}: "${linha.slice(0, 60)}" não reconhecida.`)
      continue
    }

    const recuo = item[1].replace(/\t/g, '  ').length
    const conteudo = item[2].trim()
    const separador = conteudo.indexOf(':')
    const rotulo = separador > 0 ? chaveNormalizada(conteudo.slice(0, separador)) : ''
    const valor = separador > 0 ? conteudo.slice(separador + 1).trim() : conteudo

    /* Taxonomia: `- Área: Medicina` com recuo marcando a profundidade. */
    if (secao === 'taxonomia' && NIVEIS_POR_ROTULO[rotulo]) {
      const nivel = NIVEIS_POR_ROTULO[rotulo]
      const profundidade = nivelPorProfundidade.indexOf(nivel)
      const caminho = caminhoAtual.slice(0, profundidade)
      caminhoAtual.length = profundidade
      caminhoAtual.push(valor)
      pacote.nos.push({ nivel, nome: valor, slug: gerarSlug(valor), caminho })
      continue
    }

    /* Dentro de uma etapa de Trilha, item sem rótulo é o título de uma aula. */
    if (etapaAtual && !rotulo) {
      etapaAtual.aulas.push(valor)
      continue
    }
    if (etapaAtual && rotulo === 'descricao') {
      etapaAtual.descricao = valor
      continue
    }

    /* Continuação de uma lista aberta (`aprendizados:` seguido de `-`). */
    if (!rotulo && listaAberta && recuo > 0) {
      listaAberta.push(valor)
      continue
    }

    if (aulaAtual) {
      listaAberta = aplicarCampoDaAula(aulaAtual, rotulo, valor, pacote, i + 1)
      continue
    }
    if (trilhaAtual) {
      listaAberta = aplicarCampoDaTrilha(trilhaAtual, rotulo, valor, pacote, i + 1)
      continue
    }

    pacote.avisos.push(`Linha ${i + 1}: "${conteudo.slice(0, 60)}" sem registro aberto.`)
  }

  fecharAula()
  fecharTrilha()
  return pacote
}

function novaAulaImportada(titulo: string, caminho: string[]): AulaImportada {
  return {
    titulo,
    slug: gerarSlug(titulo),
    caminho,
    tags: [],
    prerequisitos: [],
    relacionadas: [],
    pdfs: [],
    flashcardDecks: [],
  }
}

function novaTrilhaImportada(titulo: string): TrilhaImportada {
  return {
    titulo,
    slug: gerarSlug(titulo),
    aprendizados: [],
    tags: [],
    etapas: [],
  }
}

/** Devolve a lista a ser preenchida pelos itens seguintes, ou `null`. */
function aplicarCampoDaAula(
  aula: AulaImportada,
  rotulo: string,
  valor: string,
  pacote: PacoteDeImportacao,
  linha: number,
): string[] | null {
  switch (rotulo) {
    case 'localizacao':
    case 'local':
    case 'caminho':
      // `Medicina > Ciclo Básico > Cardiologia > Insuficiência Cardíaca`
      aula.caminho = valor.split(/>|›|\//).map((t) => t.trim()).filter(Boolean)
      return null
    case 'descricao':
      aula.descricao = valor
      return null
    case 'video':
    case 'embed':
      aula.video = valor
      return null
    case 'duracao':
      aula.duracaoSegundos = lerDuracaoEmSegundos(valor)
      return null
    case 'profundidade':
    case 'nivel': {
      const v = chaveNormalizada(valor)
      if (ehProfundidadeValida(v)) aula.profundidade = v
      else pacote.avisos.push(`Linha ${linha}: profundidade "${valor}" desconhecida.`)
      return null
    }
    case 'professor':
      aula.professor = valor
      return null
    case 'tags':
      aula.tags = listaSeparada(valor)
      return null
    case 'prerequisitos':
    case 'prerequisito':
      aula.prerequisitos = listaSeparada(valor)
      return aula.prerequisitos
    case 'relacionadas':
    case 'relacionada':
      aula.relacionadas = listaSeparada(valor)
      return aula.relacionadas
    case 'pdf': {
      // `Nome | https://…` ou só a URL.
      const partes = valor.split('|').map((t) => t.trim())
      const url = partes.length > 1 ? partes[1] : partes[0]
      if (!/^https?:\/\//i.test(url)) {
        pacote.avisos.push(`Linha ${linha}: PDF sem endereço válido — ignorado.`)
        return null
      }
      aula.pdfs.push({ nome: partes.length > 1 ? partes[0] : 'Resumo em PDF', url })
      return null
    }
    case 'flashcards':
    case 'deck':
      aula.flashcardDecks.push(...listaSeparada(valor))
      return null
    case 'resumo': {
      // `Título | 4min | https://…`
      const partes = valor.split('|').map((t) => t.trim())
      const titulo = partes[0] || `${aula.titulo} — resumo`
      const duracao = partes.find((p) => /\d/.test(p) && !/^https?:/i.test(p) && p !== partes[0])
      const video = partes.find((p) => /^https?:/i.test(p))
      aula.resumo = {
        titulo,
        ...(video ? { video } : {}),
        ...(duracao ? { duracaoSegundos: lerDuracaoEmSegundos(duracao) } : {}),
      }
      return null
    }
    case 'acesso':
      aula.acesso = chaveNormalizada(valor)
      return null
    default:
      pacote.avisos.push(`Linha ${linha}: campo "${rotulo}" desconhecido na aula.`)
      return null
  }
}

function aplicarCampoDaTrilha(
  trilha: TrilhaImportada,
  rotulo: string,
  valor: string,
  pacote: PacoteDeImportacao,
  linha: number,
): string[] | null {
  switch (rotulo) {
    case 'subtitulo':
      trilha.subtitulo = valor
      return null
    case 'descricao':
      trilha.descricao = valor
      return null
    case 'objetivo':
      trilha.objetivo = valor
      return null
    case 'publico':
      trilha.publico = valor
      return null
    case 'nivel': {
      const v = chaveNormalizada(valor)
      if (v === 'iniciante' || v === 'intermediario' || v === 'avancado') trilha.nivel = v
      else pacote.avisos.push(`Linha ${linha}: nível "${valor}" desconhecido.`)
      return null
    }
    case 'duracao':
      trilha.duracaoEstimadaMin = Math.round(lerDuracaoEmSegundos(valor) / 60)
      return null
    case 'tags':
      trilha.tags = listaSeparada(valor)
      return null
    case 'certificado':
      trilha.certificado = lerSimNao(valor)
      return null
    case 'aprendizados':
    case 'aprendizado':
      if (valor) trilha.aprendizados.push(...listaSeparada(valor))
      return trilha.aprendizados
    default:
      pacote.avisos.push(`Linha ${linha}: campo "${rotulo}" desconhecido na Trilha.`)
      return null
  }
}

/* =================== JSON =================== */

/**
 * Lê o JSON no mesmo formato do Markdown.
 *
 * Aceita frouxidão de propósito (campo ausente, string onde caberia lista):
 * quem gera este arquivo é outra ferramenta, e recusar o pacote inteiro por um
 * campo faltando dá ao operador um erro sem conserto óbvio.
 */
export function lerJson(fonte: string | object): PacoteDeImportacao {
  const pacote = pacoteVazio()
  let bruto: any
  try {
    bruto = typeof fonte === 'string' ? JSON.parse(fonte) : fonte
  } catch {
    pacote.avisos.push('Arquivo JSON inválido — não foi possível interpretar.')
    return pacote
  }

  const comoLista = (v: any): string[] =>
    Array.isArray(v) ? v.map((x) => String(x || '').trim()).filter(Boolean) : listaSeparada(String(v || ''))

  const caminhoDe = (v: any): string[] =>
    Array.isArray(v)
      ? v.map((x) => String(x || '').trim()).filter(Boolean)
      : String(v || '').split(/>|›|\//).map((t) => t.trim()).filter(Boolean)

  for (const no of Array.isArray(bruto?.nos) ? bruto.nos : []) {
    const nivel = NIVEIS_POR_ROTULO[chaveNormalizada(no?.nivel)]
    const nome = String(no?.nome || '').trim()
    if (!nivel || !nome) {
      pacote.avisos.push(`Nó "${no?.nome || '?'}" sem nível válido — ignorado.`)
      continue
    }
    pacote.nos.push({
      nivel,
      nome,
      slug: gerarSlug(no?.slug || nome),
      descricao: no?.descricao ? String(no.descricao) : undefined,
      caminho: caminhoDe(no?.caminho),
    })
  }

  for (const a of Array.isArray(bruto?.aulas) ? bruto.aulas : []) {
    const titulo = String(a?.titulo || '').trim()
    if (!titulo) {
      pacote.avisos.push('Aula sem título — ignorada.')
      continue
    }
    const profundidade = chaveNormalizada(a?.profundidade)
    pacote.aulas.push({
      titulo,
      slug: gerarSlug(a?.slug || titulo),
      descricao: a?.descricao ? String(a.descricao) : undefined,
      caminho: caminhoDe(a?.caminho ?? a?.localizacao),
      video: a?.video ? String(a.video) : undefined,
      duracaoSegundos:
        typeof a?.duracaoSegundos === 'number'
          ? Math.max(0, Math.floor(a.duracaoSegundos))
          : lerDuracaoEmSegundos(String(a?.duracao || '')),
      profundidade: ehProfundidadeValida(profundidade) ? profundidade : undefined,
      professor: a?.professor ? String(a.professor) : undefined,
      tags: comoLista(a?.tags),
      prerequisitos: comoLista(a?.prerequisitos),
      relacionadas: comoLista(a?.relacionadas),
      pdfs: (Array.isArray(a?.pdfs) ? a.pdfs : [])
        .map((p: any) => ({
          nome: String(p?.nome || 'Resumo em PDF'),
          url: String(p?.url || ''),
        }))
        .filter((p: RecursoImportado) => /^https?:\/\//i.test(p.url)),
      flashcardDecks: comoLista(a?.flashcardDecks ?? a?.flashcards),
      resumo: a?.resumo?.titulo
        ? {
            titulo: String(a.resumo.titulo),
            video: a.resumo.video ? String(a.resumo.video) : undefined,
            duracaoSegundos:
              typeof a.resumo.duracaoSegundos === 'number'
                ? a.resumo.duracaoSegundos
                : lerDuracaoEmSegundos(String(a.resumo.duracao || '')),
          }
        : undefined,
      acesso: a?.acesso ? chaveNormalizada(a.acesso) : undefined,
    })
  }

  for (const t of Array.isArray(bruto?.trilhas) ? bruto.trilhas : []) {
    const titulo = String(t?.titulo || '').trim()
    if (!titulo) {
      pacote.avisos.push('Trilha sem título — ignorada.')
      continue
    }
    const nivel = chaveNormalizada(t?.nivel)
    pacote.trilhas.push({
      titulo,
      slug: gerarSlug(t?.slug || titulo),
      subtitulo: t?.subtitulo ? String(t.subtitulo) : undefined,
      descricao: t?.descricao ? String(t.descricao) : undefined,
      objetivo: t?.objetivo ? String(t.objetivo) : undefined,
      publico: t?.publico ? String(t.publico) : undefined,
      nivel:
        nivel === 'iniciante' || nivel === 'intermediario' || nivel === 'avancado'
          ? nivel
          : undefined,
      duracaoEstimadaMin:
        typeof t?.duracaoEstimadaMin === 'number'
          ? Math.max(0, Math.round(t.duracaoEstimadaMin))
          : Math.round(lerDuracaoEmSegundos(String(t?.duracao || '')) / 60) || undefined,
      aprendizados: comoLista(t?.aprendizados),
      tags: comoLista(t?.tags),
      certificado: t?.certificado === true,
      etapas: (Array.isArray(t?.etapas) ? t.etapas : []).map((e: any, i: number) => ({
        titulo: String(e?.titulo || `Etapa ${i + 1}`),
        descricao: e?.descricao ? String(e.descricao) : undefined,
        aulas: comoLista(e?.aulas),
      })),
    })
  }

  return pacote
}

/** Escolhe o analisador pelo conteúdo, não pela extensão do arquivo enviado. */
export function lerPacote(fonte: string): PacoteDeImportacao {
  const texto = String(fonte || '').trim()
  if (texto.startsWith('{') || texto.startsWith('[')) return lerJson(texto)
  return lerMarkdown(texto)
}

/* =================== CONFERÊNCIA =================== */

export interface ConferenciaDoPacote {
  nos: number
  aulas: number
  resumos: number
  trilhas: number
  etapas: number
  /** Aulas citadas por Trilhas que não existem no pacote — resolvidas no banco. */
  aulasCitadasForaDoPacote: string[]
  problemas: string[]
}

/**
 * O que o admin lê antes de confirmar a importação.
 *
 * A pergunta mais importante que ela responde: quais aulas citadas nas Trilhas
 * NÃO estão neste arquivo? Elas podem já existir na plataforma (o caso normal,
 * e o desejado — reuso), ou serem erro de digitação. O importador não pode
 * decidir isso sozinho; ele mostra a lista, e a resolução contra o banco vem
 * depois.
 */
export function conferirPacote(pacote: PacoteDeImportacao): ConferenciaDoPacote {
  const problemas: string[] = []
  const slugsDeAula = new Set(pacote.aulas.map((a) => a.slug))

  const titulosVistos = new Set<string>()
  for (const aula of pacote.aulas) {
    if (titulosVistos.has(aula.slug)) {
      problemas.push(`Aula "${aula.titulo}" aparece mais de uma vez no arquivo.`)
    }
    titulosVistos.add(aula.slug)
    if (aula.caminho.length === 0) {
      // Não é erro: aula avulsa é caso legítimo (§4). É aviso porque, num
      // arquivo grande, quase sempre é esquecimento.
      problemas.push(`Aula "${aula.titulo}" sem localização — ficará avulsa.`)
    }
  }

  const foraDoPacote = new Set<string>()
  let etapas = 0
  for (const trilha of pacote.trilhas) {
    etapas += trilha.etapas.length
    if (trilha.etapas.every((e) => e.aulas.length === 0)) {
      problemas.push(`Trilha "${trilha.titulo}" não tem nenhuma aula.`)
    }
    for (const etapa of trilha.etapas) {
      for (const titulo of etapa.aulas) {
        if (!slugsDeAula.has(gerarSlug(titulo))) foraDoPacote.add(titulo)
      }
    }
  }

  return {
    nos: pacote.nos.length,
    aulas: pacote.aulas.length,
    resumos: pacote.aulas.filter((a) => a.resumo).length,
    trilhas: pacote.trilhas.length,
    etapas,
    aulasCitadasForaDoPacote: Array.from(foraDoPacote),
    problemas,
  }
}
