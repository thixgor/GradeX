import 'server-only'

import { coloracaoPorId } from '../coloracoes'
import { vistaDaMarcacao, paradasDaMarcacao } from '../desenho-de-marcacoes'
import { GLOSSARIO, estruturaPorId, todasAsAnotacoes } from '../estruturas'
import type { Estrutura, Marca, MarcacaoNaLamina } from '../estruturas/tipos'
import { LAMINAS, ORGAOS, laminaPorSlug, orgaoPorId } from '../repositorio'
import { rotaDaLaminaZoom } from '../rotas'
import { SISTEMAS, sistemaPorId } from '../sistemas'
import type { LaminaZoom, Orgao, PiramideDaLamina, SistemaId } from '../tipos'
import { ROTA_DOS_TILES, cifrar, decifrar } from './cifra'
import {
  FORA_DO_QUIZ_DE_ORGAO,
  GRUPOS_DE_ESTRUTURAS,
  GRUPOS_DE_ORGAOS,
  LAMINAS_FORA_DO_QUIZ,
  ORGAO_ACEITA_TAMBEM,
  conflitam,
} from './confusoes'
import { confere, formasDoNome, normalizar } from './respostas'

// ─── Tipos públicos (o que vai ao navegador) ────────────────────────────────

export type TipoDeQuestao = 'estrutura' | 'orgao'
export type Formato = 'objetiva' | 'escrita'

export interface ConfiguracaoDoQuiz {
  tipos: TipoDeQuestao[]
  formato: Formato | 'misto'
  sistemas: SistemaId[]
  quantidade: number
  semente: number
}

export interface QuestaoPublica {
  /** Token opaco: não revela lâmina nem resposta. */
  id: string
  tipo: TipoDeQuestao
  formato: Formato
  enunciado: string
  piramide: PiramideDaLamina
  largura: number
  altura: number
  /** Marcas a desenhar (sem rótulo). */
  marcas: Marca[]
  /** Região inicial [x0,y0,x1,y1]; ausente = lâmina inteira. */
  vista: [number, number, number, number] | null
  opcoes: Array<{ id: string; texto: string }> | null
  /** Revelada só se o aluno pedir a dica. */
  dica: string
}

export interface SecaoDoComentario {
  titulo: string
  paragrafos?: string[]
  itens?: string[]
}

export interface Correcao {
  resultado: 'certo' | 'parcial' | 'errado'
  /** Id da alternativa certa (objetivas). */
  opcaoCerta: string | null
  respostaCerta: string
  veredito: string
  secoes: SecaoDoComentario[]
  revelacao: {
    titulo: string
    coloracao: string
    especie: string
    url: string
    credito: string | null
  }
}

// ─── Aleatoriedade determinística ───────────────────────────────────────────

function hash(texto: string): number {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function gerador(semente: number): () => number {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function embaralhar<T>(lista: T[], rnd: () => number): T[] {
  const c = [...lista]
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[c[i], c[j]] = [c[j], c[i]]
  }
  return c
}

// ─── O banco ────────────────────────────────────────────────────────────────

interface Descritor {
  tipo: TipoDeQuestao
  slug: string
  sistema: SistemaId
  /** Estrutura: id da marcação. */
  marcacao?: string
}

function montarBanco(): Descritor[] {
  const banco: Descritor[] = []
  for (const a of Object.values(todasAsAnotacoes())) {
    if (LAMINAS_FORA_DO_QUIZ.has(a.slug)) continue
    const l = laminaPorSlug(a.slug)
    if (!l) continue
    for (const m of a.estruturas) {
      if (!estruturaPorId(m.estrutura)) continue
      banco.push({ tipo: 'estrutura', slug: l.slug, sistema: l.sistema, marcacao: m.id })
    }
  }
  for (const l of LAMINAS) {
    if (LAMINAS_FORA_DO_QUIZ.has(l.slug) || FORA_DO_QUIZ_DE_ORGAO.has(l.orgao)) continue
    banco.push({ tipo: 'orgao', slug: l.slug, sistema: l.sistema })
  }
  return banco
}

export const BANCO: Descritor[] = montarBanco()

/** Quantas questões há por sistema e tipo — para a tela de configuração. */
export function contagemDoBanco(): Array<{ sistema: SistemaId; nome: string; estrutura: number; orgao: number }> {
  return SISTEMAS.map((s) => ({
    sistema: s.id,
    nome: s.nome,
    estrutura: BANCO.filter((d) => d.sistema === s.id && d.tipo === 'estrutura').length,
    orgao: BANCO.filter((d) => d.sistema === s.id && d.tipo === 'orgao').length,
  })).filter((c) => c.estrutura + c.orgao > 0)
}

// ─── Pirâmide mascarada ─────────────────────────────────────────────────────

const MASCARAS = new Map<string, Promise<PiramideDaLamina>>()

function mascarar(l: LaminaZoom): Promise<PiramideDaLamina> {
  const pronto = MASCARAS.get(l.slug)
  if (pronto) return pronto
  const p = l.piramide
  const promessa = (async () => {
    const absoluto = async (url: string, sufixo: string) => `${ROTA_DOS_TILES}/${await cifrar(`!${url}`)}/${sufixo}`
    const miniatura = { ...p.miniatura, url: await absoluto(p.miniatura.url, 'm.jpg') }
    if (p.formato === 'imagem') {
      const niveis = await Promise.all(p.niveis.map(async (n, i) => ({ ...n, pasta: await absoluto(n.pasta, `${i}.jpg`) })))
      return { ...p, base: '', miniatura, niveis }
    }
    return { ...p, base: `${ROTA_DOS_TILES}/${await cifrar(p.base)}/`, miniatura }
  })()
  MASCARAS.set(l.slug, promessa)
  return promessa
}

// ─── Identificação de uma questão ───────────────────────────────────────────

interface Chave {
  t: TipoDeQuestao
  s: string
  m?: string
  p?: number
  f: Formato
  r: number
}

async function chaveDe(id: string): Promise<Chave | null> {
  const texto = await decifrar(id)
  if (!texto) return null
  try {
    return JSON.parse(texto) as Chave
  } catch {
    return null
  }
}

function marcacaoDe(slug: string, id: string): MarcacaoNaLamina | undefined {
  return todasAsAnotacoes()[slug]?.estruturas.find((m) => m.id === id)
}

// ─── Distratoras ────────────────────────────────────────────────────────────

function nomeDe(id: string): string {
  return estruturaPorId(id)?.nome ?? id
}

function distratorasDeEstrutura(resposta: string, slug: string, rnd: () => number): string[] {
  const alvo = estruturaPorId(resposta)!
  const naLamina = new Set(
    todasAsAnotacoes()[slug]?.estruturas.map((m) => m.estrutura) ?? [],
  )
  const gruposDaResposta = GRUPOS_DE_ESTRUTURAS.filter((g) => g.includes(resposta))
  const nomeCerto = normalizar(alvo.nome)
  const pontuadas = GLOSSARIO.filter((e) => e.id !== resposta && !conflitam(e.id, resposta))
    .filter((e) => normalizar(e.nome) !== nomeCerto)
    .filter((e) => !['quadrado-milimetrico', 'linha-de-5-mm'].includes(e.id))
    .map((e) => {
      const grupos = gruposDaResposta.filter((g) => g.includes(e.id)).length
      const pontos =
        grupos * 5 + (naLamina.has(e.id) ? 3 : 0) + (e.tipo === alvo.tipo ? 1.5 : 0) + rnd() * 1.2
      return { id: e.id, pontos, grupos }
    })
    .sort((a, b) => b.pontos - a.pontos)
  const escolhidas: string[] = []
  for (const c of pontuadas) {
    if (escolhidas.length === 4) break
    // Duas distratoras que se contêm confundem sem ensinar: fica só uma.
    if (escolhidas.some((e) => conflitam(e, c.id) || normalizar(nomeDe(e)) === normalizar(nomeDe(c.id)))) continue
    escolhidas.push(c.id)
  }
  return escolhidas
}

function aceitosDoOrgao(o: Orgao): string[] {
  return [...formasDoNome(o.nome), ...o.sinonimos.slice(0, 2), ...(ORGAO_ACEITA_TAMBEM[o.id] ?? [])]
}

function distratorasDeOrgao(resposta: string, rnd: () => number): string[] {
  const alvo = orgaoPorId(resposta)!
  const aceitos = aceitosDoOrgao(alvo)
  const grupos = GRUPOS_DE_ORGAOS.filter((g) => g.includes(resposta))
  const pontuadas = ORGAOS.filter((o) => o.id !== resposta && !FORA_DO_QUIZ_DE_ORGAO.has(o.id))
    // Um órgão que a resposta também aceita ("bexiga" para o músculo liso da
    // bexiga) seria uma segunda alternativa certa.
    .filter((o) => !aceitos.some((a) => confere(o.nome, [a])) && !aceitosDoOrgao(o).some((a) => confere(alvo.nome, [a])))
    .map((o) => ({
      id: o.id,
      pontos: grupos.filter((g) => g.includes(o.id)).length * 5 + (o.sistema === alvo.sistema ? 1.5 : 0) + rnd() * 1.2,
    }))
    .sort((a, b) => b.pontos - a.pontos)
  return pontuadas.slice(0, 4).map((o) => o.id)
}

// ─── Montagem do quiz ───────────────────────────────────────────────────────

export async function montarQuiz(c: ConfiguracaoDoQuiz): Promise<QuestaoPublica[]> {
  const rnd = gerador(c.semente)
  const tipos = new Set(c.tipos.length ? c.tipos : ['estrutura', 'orgao'])
  const sistemas = new Set(c.sistemas)
  const filtradas = BANCO.filter((d) => tipos.has(d.tipo) && (!sistemas.size || sistemas.has(d.sistema)))
  // Espalha as lâminas: evita cinco perguntas seguidas do mesmo esfregaço.
  const embaralhadas = embaralhar(filtradas, rnd)
  const usadasPorLamina = new Map<string, number>()
  const escolhidas: Descritor[] = []
  for (const limite of [1, 2, 4, 1000]) {
    for (const d of embaralhadas) {
      if (escolhidas.length >= c.quantidade) break
      if (escolhidas.includes(d)) continue
      const n = usadasPorLamina.get(d.slug) ?? 0
      if (n >= limite) continue
      usadasPorLamina.set(d.slug, n + 1)
      escolhidas.push(d)
    }
  }
  const ordem = embaralhar(escolhidas, rnd)
  return Promise.all(ordem.map((d, i) => questaoPublica(d, c.formato, (c.semente ^ hash(`${d.slug}:${d.marcacao ?? ''}:${i}`)) >>> 0)))
}

async function questaoPublica(d: Descritor, formato: Formato | 'misto', semente: number): Promise<QuestaoPublica> {
  const rnd = gerador(semente)
  const l = laminaPorSlug(d.slug)!
  const f: Formato = formato === 'misto' ? (rnd() < 0.5 ? 'objetiva' : 'escrita') : formato
  const piramide = await mascarar(l)
  const larguraDoScan = l.piramide.niveis.at(-1)?.largura
  const dica = `Coloração: ${l.coloracao}.`

  if (d.tipo === 'orgao') {
    const chave: Chave = { t: 'orgao', s: d.slug, f, r: semente }
    const opcoes =
      f === 'objetiva'
        ? embaralhar([l.orgao, ...distratorasDeOrgao(l.orgao, rnd)], rnd).map((id) => ({ id, texto: orgaoPorId(id)!.nome }))
        : null
    return {
      id: await cifrar(JSON.stringify(chave)),
      tipo: 'orgao',
      formato: f,
      enunciado: 'De que órgão ou tecido é esta lâmina? Explore o campo inteiro antes de responder.',
      piramide,
      largura: l.largura,
      altura: l.altura,
      marcas: [],
      vista: null,
      opcoes,
      dica,
    }
  }

  const m = marcacaoDe(d.slug, d.marcacao!)!
  const paradas = paradasDaMarcacao(m)
  const p = paradas > 1 ? Math.floor(rnd() * paradas) : undefined
  const marcas = p === undefined ? m.marcas : [m.marcas[p]]
  const chave: Chave = { t: 'estrutura', s: d.slug, m: m.id, p, f, r: semente }
  const opcoes =
    f === 'objetiva'
      ? embaralhar([m.estrutura, ...distratorasDeEstrutura(m.estrutura, d.slug, rnd)], rnd).map((id) => ({ id, texto: nomeDe(id) }))
      : null
  const soSetas = marcas.every((k) => k.tipo === 'seta')
  return {
    id: await cifrar(JSON.stringify(chave)),
    tipo: 'estrutura',
    formato: f,
    enunciado: soSetas
      ? `Identifique a estrutura apontada pela seta.`
      : `Identifique a estrutura delimitada pelo contorno.`,
    piramide,
    largura: l.largura,
    altura: l.altura,
    marcas,
    vista: vistaDaMarcacao({ ...m, marcas }, 0, larguraDoScan),
    opcoes,
    dica,
  }
}

// ─── Correção e resposta comentada ──────────────────────────────────────────

function revelacao(l: LaminaZoom): Correcao['revelacao'] {
  return {
    titulo: l.subtitulo ? `${l.titulo} — ${l.subtitulo}` : l.titulo,
    coloracao: l.coloracao,
    especie: l.especie,
    url: rotaDaLaminaZoom(l.sistema, l.slug),
    credito: l.credito ? `${l.credito.autor} — ${l.credito.licenca} (${l.credito.acervo})` : null,
  }
}

function secaoDaColoracao(l: LaminaZoom): SecaoDoComentario {
  const c = coloracaoPorId(l.coloracaoId)
  return {
    titulo: 'A coloração deste corte',
    paragrafos: [`${l.coloracao}. ${c?.resultado ?? ''}`.trim()],
  }
}

function secaoDaOrigem(l: LaminaZoom): SecaoDoComentario | null {
  const o = l.origem
  if (o.categoria === 'humana') return null
  const itens = [
    `Espécie: ${o.especie}.`,
    ...(o.comparacao ? [o.comparacao.resumo, ...o.comparacao.diferencas] : []),
  ]
  const titulo = o.categoria === 'nao-informada' ? 'Espécie da peça' : 'Esta peça não é humana'
  return { titulo, itens }
}

function linhaDoVerbete(e: Estrutura): string {
  return `${e.nome}: ${e.resumo}`
}

function comentarioDeEstrutura(
  l: LaminaZoom,
  m: MarcacaoNaLamina,
  e: Estrutura,
  opcoes: string[],
): SecaoDoComentario[] {
  const secoes: SecaoDoComentario[] = []
  secoes.push({
    titulo: `O que é: ${m.rotulo ?? e.nome}`,
    paragrafos: [e.resumo, ...(m.nota ? [`Nesta lâmina: ${m.nota}`] : [])],
  })
  const orgao = orgaoPorId(l.orgao)
  const passos = [
    `Situe-se antes de olhar a seta: este corte é de ${orgao?.nome.toLowerCase() ?? 'um órgão'} (${nomeDoSistema(l.sistema).toLowerCase()}), corado por ${l.coloracao}. ${coloracaoPorId(l.coloracaoId)?.resultado ?? ''}`.trim(),
    `Olhe o que está em volta da marcação — a vizinhança restringe as possibilidades: ${(e.ondeEncontrar[0] ?? 'o tecido ao redor').replace(/\.+$/, '')}.`,
    `Critério decisivo: ${e.caracteristicas[0] ?? e.resumo}`,
    ...(e.caracteristicas[1] ? [`Confirme com um segundo critério: ${e.caracteristicas[1]}`] : []),
    `Conclusão: ${m.rotulo ?? e.nome}.`,
  ]
  secoes.push({ titulo: 'Raciocínio passo a passo', itens: passos })
  secoes.push({ titulo: 'Como reconhecer ao microscópio', itens: e.caracteristicas })
  const outras = opcoes.filter((id) => id !== e.id).map((id) => estruturaPorId(id)).filter((x): x is Estrutura => Boolean(x))
  if (outras.length) {
    secoes.push({
      titulo: 'Por que não é cada uma das outras alternativas',
      itens: outras.map((o) => {
        const aspecto = o.caracteristicas.slice(0, 2).join(' ')
        const onde = o.ondeEncontrar.slice(0, 2).join('; ')
        return `${o.nome}: ${o.resumo} Aspecto: ${aspecto}${onde ? ` Onde aparece: ${onde}.` : ''} Aqui, ao contrário, o que se vê é: ${(e.caracteristicas[0] ?? e.resumo).replace(/\.$/, '')}.`
      }),
    })
  }
  const vizinhas = todasAsAnotacoes()[l.slug]
    ?.estruturas.filter((x) => x.id !== m.id)
    .map((x) => estruturaPorId(x.estrutura))
    .filter((x): x is Estrutura => Boolean(x) && !outras.some((o) => o.id === x!.id) && x!.id !== e.id)
  if (vizinhas?.length) {
    const unicas = [...new Map(vizinhas.map((v) => [v.id, v])).values()].slice(0, 6)
    secoes.push({
      titulo: 'Pistas do contexto: o que mais há neste corte',
      itens: unicas.map(linhaDoVerbete),
    })
  }
  if (e.aprofundado.length) secoes.push({ titulo: 'Aprofundamento', itens: e.aprofundado })
  secoes.push({ titulo: 'Função', itens: e.funcoes })
  secoes.push({
    titulo: 'Regeneração',
    paragrafos: [e.regeneracao.texto],
  })
  secoes.push({ titulo: 'Onde mais se encontra', itens: e.ondeEncontrar })
  secoes.push({ titulo: 'Correlação clínica: alterações típicas', itens: e.alteracoes })
  secoes.push(secaoDaColoracao(l))
  const origem = secaoDaOrigem(l)
  if (origem) secoes.push(origem)
  return secoes
}

function comentarioDeOrgao(l: LaminaZoom, o: Orgao, opcoes: string[]): SecaoDoComentario[] {
  const f = o.ficha
  const secoes: SecaoDoComentario[] = []
  secoes.push({ titulo: `O que é: ${o.nome}`, paragrafos: [f.resumo, `Tecido que define o órgão: ${f.tecidoPrincipal}.`] })
  secoes.push({ titulo: 'Critérios de reconhecimento na prova prática', itens: f.reconhecer })
  secoes.push({ titulo: 'Arquitetura, do menor ao maior aumento', itens: f.morfologia })
  if (f.epitelios.length) {
    secoes.push({ titulo: 'Epitélios', itens: f.epitelios.map((e) => `${e.tipo} — ${e.onde}`) })
  } else if (f.semEpitelio) {
    secoes.push({ titulo: 'Epitélios', paragrafos: [f.semEpitelio] })
  }
  const marcadas = todasAsAnotacoes()[l.slug]
    ?.estruturas.map((x) => estruturaPorId(x.estrutura))
    .filter((x): x is Estrutura => Boolean(x))
  if (marcadas?.length) {
    const unicas = [...new Map(marcadas.map((v) => [v.id, v])).values()].slice(0, 8)
    secoes.push({ titulo: 'Estruturas que entregam o diagnóstico neste corte', itens: unicas.map(linhaDoVerbete) })
  }
  const outras = opcoes.filter((id) => id !== o.id).map((id) => orgaoPorId(id)).filter((x): x is Orgao => Boolean(x))
  const diferencial = [...(f.diferencial ?? [])]
  for (const d of outras) {
    const criterios = d.ficha.reconhecer.slice(0, 2).join(' ')
    diferencial.push(`${d.nome}: ${d.ficha.resumo} Seria reconhecido por: ${criterios} Nesta lâmina isso não aparece — o que se vê é: ${f.reconhecer[0] ?? f.resumo}`)
  }
  if (diferencial.length) secoes.push({ titulo: 'Diagnóstico diferencial: por que não é outro órgão', itens: diferencial })
  secoes.push(secaoDaColoracao(l))
  const origem = secaoDaOrigem(l)
  if (origem) secoes.push(origem)
  return secoes
}

export async function corrigir(
  id: string,
  resposta: { opcao?: string; texto?: string },
  opcoesMostradas: string[] = [],
): Promise<Correcao | null> {
  const chave = await chaveDe(id)
  if (!chave) return null
  const l = laminaPorSlug(chave.s)
  if (!l) return null
  const rev = revelacao(l)

  if (chave.t === 'orgao') {
    const o = orgaoPorId(l.orgao)!
    const aceitos = aceitosDoOrgao(o)
    const opcoes = opcoesMostradas.length ? opcoesMostradas : distratorasDeOrgao(o.id, gerador(chave.r)).concat(o.id)
    let resultado: Correcao['resultado'] = 'errado'
    let veredito = ''
    if (resposta.opcao !== undefined) {
      resultado = resposta.opcao === o.id ? 'certo' : 'errado'
      if (resultado === 'errado') veredito = `Você marcou ${orgaoPorId(resposta.opcao)?.nome ?? 'outra alternativa'}.`
    } else if (resposta.texto) {
      resultado = confere(resposta.texto, aceitos) ? 'certo' : 'errado'
      if (resultado === 'errado') {
        const parecido = ORGAOS.find((x) => x.id !== o.id && confere(resposta.texto!, aceitosDoOrgao(x)))
        veredito = parecido
          ? `"${resposta.texto}" corresponde a ${parecido.nome}, um diagnóstico diferencial deste órgão.`
          : `"${resposta.texto}" não corresponde ao órgão desta lâmina.`
      }
    }
    return {
      resultado,
      opcaoCerta: o.id,
      respostaCerta: o.nome,
      veredito: resultado === 'certo' ? 'Correto.' : veredito,
      secoes: comentarioDeOrgao(l, o, opcoes),
      revelacao: rev,
    }
  }

  const m = marcacaoDe(chave.s, chave.m!)
  if (!m) return null
  const e = estruturaPorId(m.estrutura)!
  const opcoes = opcoesMostradas.length ? opcoesMostradas : [e.id]
  const aceitos = [...formasDoNome(e.nome), ...(e.sinonimos ?? [])]
  let resultado: Correcao['resultado'] = 'errado'
  let veredito = ''
  if (resposta.opcao !== undefined) {
    resultado = resposta.opcao === e.id ? 'certo' : 'errado'
    if (resultado === 'errado') veredito = `Você marcou ${nomeDe(resposta.opcao)}.`
  } else if (resposta.texto) {
    if (confere(resposta.texto, aceitos)) resultado = 'certo'
    else {
      const outra = GLOSSARIO.find((x) => x.id !== e.id && confere(resposta.texto!, [...formasDoNome(x.nome), ...(x.sinonimos ?? [])]))
      if (outra && conflitam(outra.id, e.id)) {
        resultado = 'parcial'
        veredito = `Quase: ${outra.nome} está relacionado(a), mas a marcação aponta especificamente ${m.rotulo ?? e.nome}.`
      } else if (outra) {
        veredito = `"${resposta.texto}" corresponde a ${outra.nome}, que é outra estrutura.`
      } else {
        veredito = `"${resposta.texto}" não corresponde à estrutura marcada.`
      }
    }
  }
  return {
    resultado,
    opcaoCerta: e.id,
    respostaCerta: m.rotulo ? `${e.nome} (${m.rotulo})` : e.nome,
    veredito: resultado === 'certo' ? 'Correto.' : veredito,
    secoes: comentarioDeEstrutura(l, m, e, opcoes),
    revelacao: rev,
  }
}

export function nomeDoSistema(id: string): string {
  return sistemaPorId(id)?.nome ?? id
}
