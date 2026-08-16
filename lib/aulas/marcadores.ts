/**
 * Capítulos (§11) e transcrição (§10).
 *
 * O player já expõe `irPara(segundo)` desde a primeira versão — o que faltava
 * era conteúdo com tempo para navegar. As duas funcionalidades são a mesma
 * coisa em formatos diferentes: uma lista de (segundo, texto) que transforma o
 * vídeo em algo percorrível em vez de uma barra opaca de 40 minutos.
 *
 * A decisão que define este módulo é **aceitar o que a pessoa já tem**, e não
 * um formato nosso. Ninguém vai digitar quarenta capítulos num formulário de
 * quarenta campos: os capítulos já existem colados na descrição do YouTube
 * ("00:00 Introdução"), e a transcrição já existe como VTT ou SRT saído do
 * YouTube ou do Whisper. Exigir outra coisa garantiria que o recurso nunca
 * fosse usado — que é a forma mais cara de falhar, porque o código fica.
 *
 * Tudo aqui é puro. O parsing de tempo é onde este tipo de código erra
 * silenciosamente (1:30 é minuto e meio ou uma hora e meia?), e errar move o
 * aluno para o lugar errado do vídeo — pior do que não ter o recurso.
 */

export interface Capitulo {
  segundo: number
  titulo: string
}

export interface TrechoDaTranscricao {
  segundo: number
  /** Fim do trecho, quando o formato informa. Sustenta o destaque no player. */
  fim?: number
  texto: string
}

export const MAX_CAPITULOS = 200
export const MAX_TRECHOS = 5000
export const TITULO_CAPITULO_MAX = 120

/**
 * Lê um carimbo de tempo em qualquer das formas usuais.
 *
 * `mm:ss`, `hh:mm:ss` e `hh:mm:ss,mmm` (SRT) ou `hh:mm:ss.mmm` (VTT).
 *
 * A regra que evita o erro clássico: o número de campos decide a unidade, e não
 * o tamanho do valor. `1:30` é sempre 1min30s; quem quer uma hora e meia
 * escreve `1:30:00`. Adivinhar pelo valor faria um capítulo de `90:00` virar 90
 * horas em vez de 90 minutos.
 */
export function lerTempo(texto: string): number | null {
  const limpo = String(texto || '').trim()
  if (!limpo) return null

  const casou = limpo.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/)
  if (!casou) return null

  const [, h, m, s, ms] = casou
  const horas = h ? Number(h) : 0
  const minutos = Number(m)
  const segundos = Number(s)

  // Em `mm:ss`, minutos podem passar de 59 (um vídeo de 90:00). Em `hh:mm:ss`,
  // não — ali 90 minutos seria um carimbo malformado, e aceitar produziria um
  // salto para um ponto que não existe.
  if (h && minutos > 59) return null
  if (segundos > 59) return null

  const total = horas * 3600 + minutos * 60 + segundos + (ms ? Number(ms.padEnd(3, '0')) / 1000 : 0)
  return Math.floor(total)
}

/**
 * Capítulos a partir do texto colado.
 *
 * Uma linha por capítulo, no formato que já se usa na descrição do YouTube:
 *
 *     00:00 Introdução
 *     02:15 — Critérios diagnósticos
 *     12:48 - Conduta
 *
 * Linha sem carimbo é ignorada em silêncio: descrições reais vêm com cabeçalho
 * ("Capítulos:") e linhas em branco no meio, e recusar o texto inteiro por
 * causa delas obrigaria a limpar na mão justamente o que se queria colar.
 */
export function lerCapitulos(texto: string): Capitulo[] {
  const capitulos: Capitulo[] = []

  for (const linha of String(texto || '').split(/\r?\n/)) {
    const casou = linha.trim().match(/^(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*[-—–:]?\s*(.*)$/)
    if (!casou) continue

    const segundo = lerTempo(casou[1])
    if (segundo === null) continue

    const titulo = casou[2].trim().slice(0, TITULO_CAPITULO_MAX)
    // Carimbo sem título não é capítulo — seria um item de lista em branco.
    if (!titulo) continue

    capitulos.push({ segundo, titulo })
    if (capitulos.length >= MAX_CAPITULOS) break
  }

  return ordenarPorTempo(capitulos)
}

/**
 * Transcrição a partir de VTT, SRT ou texto carimbado.
 *
 * Os três chegam da mesma forma na prática: o VTT vem do YouTube, o SRT de
 * legendas antigas, e o texto carimbado de quem transcreveu à mão. Detectar o
 * formato aqui evita um seletor na tela que a pessoa erraria.
 */
export function lerTranscricao(texto: string): TrechoDaTranscricao[] {
  const bruto = String(texto || '').trim()
  if (!bruto) return []

  // A seta de tempo é a marca inconfundível de VTT e SRT.
  if (/-->/.test(bruto)) return lerLegenda(bruto)

  // Senão, o mesmo formato dos capítulos, mas cada linha é uma fala.
  const trechos: TrechoDaTranscricao[] = []
  for (const linha of bruto.split(/\r?\n/)) {
    const casou = linha.trim().match(/^\[?(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]?\s*(.*)$/)
    if (!casou) continue
    const segundo = lerTempo(casou[1])
    const conteudo = casou[2].trim()
    if (segundo === null || !conteudo) continue
    trechos.push({ segundo, texto: conteudo })
    if (trechos.length >= MAX_TRECHOS) break
  }
  return ordenarPorTempo(trechos)
}

function lerLegenda(bruto: string): TrechoDaTranscricao[] {
  const trechos: TrechoDaTranscricao[] = []

  // Blocos separados por linha em branco — a estrutura comum de VTT e SRT.
  for (const bloco of bruto.split(/\r?\n\s*\r?\n/)) {
    const linhas = bloco.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (linhas.length === 0) continue

    const indiceDoTempo = linhas.findIndex((l) => l.includes('-->'))
    if (indiceDoTempo < 0) continue

    const [inicioBruto, fimBruto] = linhas[indiceDoTempo].split('-->').map((p) => p.trim())
    const segundo = lerTempo(inicioBruto.split(/\s+/)[0])
    if (segundo === null) continue
    const fim = fimBruto ? lerTempo(fimBruto.split(/\s+/)[0]) : null

    // As linhas depois do tempo são a fala; as de antes são o número da legenda
    // (SRT) ou o cabeçalho WEBVTT, que não interessam.
    const texto = linhas
      .slice(indiceDoTempo + 1)
      // Tags de estilo do VTT (<c.color>, <i>) atrapalham a leitura e a busca.
      .map((l) => l.replace(/<[^>]*>/g, '').trim())
      .filter(Boolean)
      .join(' ')
      .trim()

    if (!texto) continue
    trechos.push(fim !== null ? { segundo, fim, texto } : { segundo, texto })
    if (trechos.length >= MAX_TRECHOS) break
  }

  return ordenarPorTempo(trechos)
}

function ordenarPorTempo<T extends { segundo: number }>(itens: T[]): T[] {
  return itens.slice().sort((a, b) => a.segundo - b.segundo)
}

/**
 * Qual capítulo está tocando agora.
 *
 * O último cujo início já passou. Devolve o índice para a tela poder rolar até
 * ele — e `-1` antes do primeiro capítulo, que é o caso real de um vídeo cuja
 * lista começa em 00:30 e não em 00:00.
 */
export function capituloAtual(capitulos: Capitulo[], segundo: number): number {
  let indice = -1
  for (let i = 0; i < capitulos.length; i += 1) {
    if (capitulos[i].segundo <= segundo) indice = i
    else break
  }
  return indice
}

/** Normaliza para busca: sem acento e sem caixa. */
export function paraBusca(texto: string): string {
  // Intervalo escrito como escape (\u0300-\u036f, os diacríticos combinantes
  // que o NFD separa) e não como caracteres literais: literais são invisíveis
  // no editor e não sobrevivem a cópia entre ferramentas.
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Busca na transcrição — o que transforma o vídeo em algo consultável.
 *
 * É a única forma de responder "onde ele falou de varfarina?" sem reassistir 40
 * minutos, e por isso a transcrição vale a pena mesmo quando ninguém a lê de
 * ponta a ponta.
 */
export function buscarNaTranscricao(
  trechos: TrechoDaTranscricao[],
  termo: string,
): TrechoDaTranscricao[] {
  const alvo = paraBusca(termo).trim()
  if (alvo.length < 2) return trechos
  return trechos.filter((t) => paraBusca(t.texto).includes(alvo))
}

/** Texto corrido, para copiar ou ler fora do player. */
export function transcricaoEmTexto(trechos: TrechoDaTranscricao[]): string {
  return trechos.map((t) => t.texto).join(' ')
}

/* =================== NORMALIZAÇÃO PARA GRAVAÇÃO =================== */

export function normalizarCapitulos(bruto: unknown): Capitulo[] | null {
  if (typeof bruto === 'string') {
    const lidos = lerCapitulos(bruto)
    return lidos.length > 0 ? lidos : null
  }
  if (!Array.isArray(bruto)) return null

  const capitulos: Capitulo[] = []
  for (const item of bruto.slice(0, MAX_CAPITULOS)) {
    if (!item || typeof item !== 'object') continue
    const segundo = Math.floor(Number((item as any).segundo))
    const titulo = String((item as any).titulo || '').trim().slice(0, TITULO_CAPITULO_MAX)
    if (!Number.isFinite(segundo) || segundo < 0 || !titulo) continue
    capitulos.push({ segundo, titulo })
  }
  return capitulos.length > 0 ? ordenarPorTempo(capitulos) : null
}

export function normalizarTranscricao(bruto: unknown): TrechoDaTranscricao[] | null {
  if (typeof bruto === 'string') {
    const lidos = lerTranscricao(bruto)
    return lidos.length > 0 ? lidos : null
  }
  if (!Array.isArray(bruto)) return null

  const trechos: TrechoDaTranscricao[] = []
  for (const item of bruto.slice(0, MAX_TRECHOS)) {
    if (!item || typeof item !== 'object') continue
    const segundo = Math.floor(Number((item as any).segundo))
    const texto = String((item as any).texto || '').trim()
    if (!Number.isFinite(segundo) || segundo < 0 || !texto) continue
    const fim = Math.floor(Number((item as any).fim))
    trechos.push(Number.isFinite(fim) && fim > segundo ? { segundo, fim, texto } : { segundo, texto })
  }
  return trechos.length > 0 ? ordenarPorTempo(trechos) : null
}
